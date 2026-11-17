const express = require("express");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");
const { logActivity } = require("../utils/streak");

const router = express.Router();

// GET /api/leetcode/problems?difficulty=&topic=&status=&company=
router.get("/problems", requireAuth, async (req, res) => {
  const { difficulty, topic, status, company } = req.query;

  try {
    // Fetch the user's active track so we can prioritize track-relevant
    // questions first. This is the only new piece of logic here — the
    // response shape, filters, and existing DSA UI are all untouched.
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { track: true },
    });

    const problems = await prisma.problem.findMany({
      where: {
        ...(difficulty ? { difficulty: difficulty.toUpperCase() } : {}),
        ...(topic ? { topic: { equals: topic, mode: "insensitive" } } : {}),
        ...(company ? { companyTags: { has: company } } : {}),
      },
      include: {
        progress: { where: { userId: req.user.userId } },
      },
      orderBy: { slNo: "asc" },
    });

    let result = problems.map((p) => ({
      id: p.id,
      slNo: p.slNo,
      title: p.title,
      topic: p.topic,
      difficulty: p.difficulty,
      link: p.link,
      companyTags: p.companyTags,
      hints: p.hints,
      approach: p.approach,
      timeComplexity: p.timeComplexity,
      spaceComplexity: p.spaceComplexity,
      visualizationSteps: p.visualizationSteps,
      status: p.progress[0]?.status || "NOT_STARTED",
      _trackWeight: (p.trackWeights && user?.track && p.trackWeights[user.track]) || 0,
    }));

    if (status) {
      result = result.filter((p) => p.status === status.toUpperCase());
    }

    // Only reorder when the user has set a track; otherwise keep the original
    // slNo order exactly as before (no behavior change for users without a track).
    if (user?.track) {
      result.sort((a, b) => b._trackWeight - a._trackWeight || a.slNo - b.slNo);
    }
    result = result.map(({ _trackWeight, ...p }) => p);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch problems." });
  }
});

// GET /api/leetcode/companies - distinct company tags for the filter dropdown
router.get("/companies", requireAuth, async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({ select: { companyTags: true } });
    const set = new Set();
    problems.forEach((p) => p.companyTags.forEach((c) => set.add(c)));
    res.json([...set].sort());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch company tags." });
  }
});

// PUT /api/leetcode/problems/:id/status
router.put("/problems/:id/status", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["NOT_STARTED", "ATTEMPTED", "SOLVED"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }

  try {
    const progress = await prisma.leetcodeProgress.upsert({
      where: { userId_problemId: { userId: req.user.userId, problemId: id } },
      update: { status },
      create: { userId: req.user.userId, problemId: id, status },
    });

    // Any interaction with a problem (attempted or solved) counts toward the streak
    if (status === "SOLVED" || status === "ATTEMPTED") {
      await logActivity(req.user.userId);
    }

    res.json(progress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status." });
  }
});

// GET /api/leetcode/progress-summary
router.get("/progress-summary", requireAuth, async (req, res) => {
  try {
    const total = await prisma.problem.count();
    const solved = await prisma.leetcodeProgress.count({
      where: { userId: req.user.userId, status: "SOLVED" },
    });
    const attempted = await prisma.leetcodeProgress.count({
      where: { userId: req.user.userId, status: "ATTEMPTED" },
    });

    res.json({ total, solved, attempted, remaining: total - solved - attempted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch progress summary." });
  }
});

// POST /api/leetcode/problems/:id/notes
router.post("/problems/:id/notes", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Note content cannot be empty." });
  }

  try {
    const note = await prisma.note.create({
      data: { content, userId: req.user.userId, problemId: id },
    });
    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save note." });
  }
});

// GET /api/leetcode/problems/:id/notes
router.get("/problems/:id/notes", requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const notes = await prisma.note.findMany({
      where: { problemId: id, userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch notes." });
  }
});

module.exports = router;
