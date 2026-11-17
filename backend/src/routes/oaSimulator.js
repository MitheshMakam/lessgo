const express = require("express");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");
const { logActivity } = require("../utils/streak");

const router = express.Router();

// Track-specific OA format. Duration is in minutes; counts describe how many
// aptitude MCQs vs. coding problems to pull for that track's typical OA style.
const FORMATS = {
  FAANG: { durationMinutes: 60, aptitudeCount: 0, codingCount: 3, codingDifficulty: "MEDIUM" },
  PRODUCT_STARTUP: { durationMinutes: 60, aptitudeCount: 10, codingCount: 2, codingDifficulty: "EASY" },
  SERVICE_FRESHER: { durationMinutes: 90, aptitudeCount: 25, codingCount: 2, codingDifficulty: "EASY" },
};

// GET /api/oa-simulator/config?track=FAANG
router.get("/config", requireAuth, (req, res) => {
  const { track } = req.query;
  const format = FORMATS[track];
  if (!format) {
    return res.status(400).json({ message: "Unknown or missing track." });
  }
  res.json(format);
});

// POST /api/oa-simulator/start  { track }
// Builds a fresh question set for this attempt. Aptitude questions are drawn
// from the existing Question bank (APTITUDE category, MCQ-enabled ones only);
// coding questions are drawn from the existing Problem/DSA bank — no new
// content system, just a curated pull from what already exists.
router.post("/start", requireAuth, async (req, res) => {
  const { track } = req.body;
  const format = FORMATS[track];
  if (!format) {
    return res.status(400).json({ message: "Unknown or missing track." });
  }

  try {
    // Fetch the full eligible pool, then randomly sample — so each attempt
    // pulls a different question set instead of the same fixed slice every time.
    const aptitudePool = format.aptitudeCount
      ? await prisma.question.findMany({
          where: { category: "APTITUDE", options: { not: null } },
        })
      : [];
    const codingPool = await prisma.problem.findMany({
      where: { difficulty: format.codingDifficulty },
    });

    const sample = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);
    const aptitudeQuestions = sample(aptitudePool, format.aptitudeCount);
    const codingProblems = sample(codingPool, format.codingCount);

    res.json({
      track,
      durationMinutes: format.durationMinutes,
      startedAt: new Date().toISOString(),
      sections: [
        {
          section: "Aptitude",
          questions: aptitudeQuestions.map((q) => ({
            id: q.id,
            title: q.title,
            content: q.content,
            options: q.options,
          })),
        },
        {
          section: "Coding",
          questions: codingProblems.map((p) => ({
            id: p.id,
            title: p.title,
            topic: p.topic,
            difficulty: p.difficulty,
            link: p.link,
          })),
        },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to start OA simulator." });
  }
});

// POST /api/oa-simulator/submit
// { track, timeTakenSeconds, aptitudeAnswers: [{questionId, selectedIndex}], codingSolvedIds: [problemId] }
router.post("/submit", requireAuth, async (req, res) => {
  const { track, timeTakenSeconds, aptitudeAnswers = [], codingSolvedIds = [] } = req.body;
  const format = FORMATS[track];
  if (!format) {
    return res.status(400).json({ message: "Unknown or missing track." });
  }

  try {
    // Grade aptitude MCQs against stored correct answers
    const questionIds = aptitudeAnswers.map((a) => a.questionId);
    const questions = questionIds.length
      ? await prisma.question.findMany({ where: { id: { in: questionIds } } })
      : [];
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    let aptitudeCorrect = 0;
    for (const a of aptitudeAnswers) {
      const q = questionMap.get(a.questionId);
      if (q && q.correctOptionIndex === a.selectedIndex) aptitudeCorrect += 1;
    }
    const aptitudeTotal = aptitudeAnswers.length;

    // Coding is self-reported (no code execution engine in this app) — counted
    // as "solved within the time limit" rather than auto-graded correctness.
    const codingTotal = format.codingCount;
    const codingSolved = Math.min(codingSolvedIds.length, codingTotal);

    const correctCount = aptitudeCorrect + codingSolved;
    const totalCount = aptitudeTotal + codingTotal;
    const incorrectCount = totalCount - correctCount;
    const totalScore = totalCount ? Math.round((correctCount / totalCount) * 100) : 0;

    const sectionBreakdown = [
      ...(aptitudeTotal ? [{ section: "Aptitude", correct: aptitudeCorrect, total: aptitudeTotal }] : []),
      { section: "Coding", correct: codingSolved, total: codingTotal },
    ];

    const attempt = await prisma.oASimulatorAttempt.create({
      data: {
        userId: req.user.userId,
        track,
        totalScore,
        correctCount,
        incorrectCount,
        timeTakenSeconds: timeTakenSeconds || 0,
        sectionBreakdown,
      },
    });

    await logActivity(req.user.userId);

    res.json(attempt);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit OA simulator attempt." });
  }
});

// GET /api/oa-simulator/history - past attempts for the logged-in user
router.get("/history", requireAuth, async (req, res) => {
  try {
    const attempts = await prisma.oASimulatorAttempt.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    res.json(attempts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch OA simulator history." });
  }
});

module.exports = router;
