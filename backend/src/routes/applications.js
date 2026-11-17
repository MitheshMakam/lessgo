const express = require("express");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");
const { logActivity } = require("../utils/streak");

const router = express.Router();

const validStages = ["APPLIED", "OA_SCHEDULED", "OA_DONE", "INTERVIEW", "OFFER", "REJECTED"];

// GET /api/applications - list all of the current user's applications
router.get("/", requireAuth, async (req, res) => {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.user.userId },
      orderBy: { updatedAt: "desc" },
    });
    res.json(applications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch applications." });
  }
});

// POST /api/applications - create a new application entry
router.post("/", requireAuth, async (req, res) => {
  const { companyName, role, stage, notes, appliedDate } = req.body;

  if (!companyName || !companyName.trim()) {
    return res.status(400).json({ message: "Company name is required." });
  }
  if (!role || !role.trim()) {
    return res.status(400).json({ message: "Role is required." });
  }

  try {
    const application = await prisma.application.create({
      data: {
        userId: req.user.userId,
        companyName: companyName.trim(),
        role: role.trim(),
        stage: validStages.includes(stage) ? stage : "APPLIED",
        notes,
        appliedDate: appliedDate ? new Date(appliedDate) : new Date(),
      },
    });
    await logActivity(req.user.userId);
    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create application." });
  }
});

// PUT /api/applications/:id - update stage/notes/role/company
router.put("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { companyName, role, stage, notes } = req.body;

  if (stage && !validStages.includes(stage)) {
    return res.status(400).json({ message: "Invalid stage value." });
  }

  try {
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ message: "Application not found." });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        ...(companyName ? { companyName } : {}),
        ...(role ? { role } : {}),
        ...(stage ? { stage } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    await logActivity(req.user.userId);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update application." });
  }
});

// DELETE /api/applications/:id
router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.userId) {
      return res.status(404).json({ message: "Application not found." });
    }

    await prisma.application.delete({ where: { id } });
    res.json({ message: "Application deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete application." });
  }
});

module.exports = router;
