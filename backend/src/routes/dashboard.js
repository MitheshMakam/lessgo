const express = require("express");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");
const { computeStreak } = require("../utils/streak");

const router = express.Router();

// GET /api/dashboard - aggregate stats for the logged-in user
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user.userId;

  try {
    const [
      totalProblems,
      solved,
      attempted,
      roadmaps,
      totalSteps,
      completedSteps,
      bookmarksCount,
      notesCount,
      applicationsCount,
      offersCount,
      activityDates,
    ] = await Promise.all([
      prisma.problem.count(),
      prisma.leetcodeProgress.count({ where: { userId, status: "SOLVED" } }),
      prisma.leetcodeProgress.count({ where: { userId, status: "ATTEMPTED" } }),
      prisma.roadmap.findMany({ select: { id: true, title: true } }),
      prisma.roadmapStep.count(),
      prisma.roadmapProgress.count({ where: { userId, completed: true } }),
      prisma.bookmark.count({ where: { userId } }),
      prisma.note.count({ where: { userId } }),
      prisma.application.count({ where: { userId } }),
      prisma.application.count({ where: { userId, stage: "OFFER" } }),
      prisma.activity.findMany({ where: { userId }, select: { date: true } }),
    ]);

    const { currentStreak, longestStreak } = computeStreak(activityDates.map((a) => a.date));

    res.json({
      leetcode: { total: totalProblems, solved, attempted },
      roadmaps: { available: roadmaps.length, totalSteps, completedSteps },
      bookmarksCount,
      notesCount,
      applications: { total: applicationsCount, offers: offersCount },
      streak: { currentStreak, longestStreak },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load dashboard data." });
  }
});

module.exports = router;
