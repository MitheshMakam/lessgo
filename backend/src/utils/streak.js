const prisma = require("./prisma");

/**
 * Records that the given user was "active" today (UTC midnight-normalized).
 * Safe to call multiple times per day — uses upsert so it's idempotent.
 */
async function logActivity(userId) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    await prisma.activity.upsert({
      where: { userId_date: { userId, date: today } },
      update: {},
      create: { userId, date: today },
    });
  } catch (err) {
    // Non-critical — don't let streak logging break the main request
    console.error("Failed to log activity:", err.message);
  }
}

/**
 * Computes the current streak (consecutive days up to today or yesterday)
 * and the longest streak ever, from a list of activity dates.
 */
function computeStreak(activityDates) {
  if (activityDates.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const daySet = new Set(
    activityDates.map((d) => new Date(d).setUTCHours(0, 0, 0, 0))
  );
  const sortedDays = [...daySet].sort((a, b) => a - b);

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const diff = (sortedDays[i] - sortedDays[i - 1]) / 86400000;
    if (diff === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
  }

  // Current streak: walk backwards from today (or yesterday) while consecutive
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const oneDay = 86400000;

  let cursor = today.getTime();
  if (!daySet.has(cursor)) {
    cursor -= oneDay; // allow "yesterday" to still count as an active streak
  }

  let currentStreak = 0;
  while (daySet.has(cursor)) {
    currentStreak += 1;
    cursor -= oneDay;
  }

  return { currentStreak, longestStreak };
}

module.exports = { logActivity, computeStreak };
