const express = require("express");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/roadmaps - list all roadmaps (no auth needed to browse)
router.get("/", async (req, res) => {
  try {
    const roadmaps = await prisma.roadmap.findMany({
      include: { _count: { select: { steps: true } } },
    });
    res.json(roadmaps);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch roadmaps." });
  }
});

// GET /api/roadmaps/:id - roadmap with steps (+ user progress if logged in)
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const authHeader = req.headers.authorization;
  let userId = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (e) {
      // invalid token, just treat as anonymous
    }
  }

  try {
    const roadmap = await prisma.roadmap.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { order: "asc" },
          include: userId
            ? { progress: { where: { userId } } }
            : undefined,
        },
      },
    });

    if (!roadmap) return res.status(404).json({ message: "Roadmap not found." });

    const steps = roadmap.steps.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      order: s.order,
      resourceUrl: s.resourceUrl,
      completed: userId ? Boolean(s.progress?.[0]?.completed) : false,
    }));

    res.json({ ...roadmap, steps });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch roadmap." });
  }
});

// PUT /api/roadmaps/steps/:stepId/toggle - mark a step complete/incomplete
router.put("/steps/:stepId/toggle", requireAuth, async (req, res) => {
  const { stepId } = req.params;

  try {
    const existing = await prisma.roadmapProgress.findUnique({
      where: { userId_stepId: { userId: req.user.userId, stepId } },
    });

    const updated = await prisma.roadmapProgress.upsert({
      where: { userId_stepId: { userId: req.user.userId, stepId } },
      update: { completed: !existing?.completed },
      create: { userId: req.user.userId, stepId, completed: true },
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update step progress." });
  }
});

module.exports = router;
