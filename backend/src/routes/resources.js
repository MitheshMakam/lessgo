const express = require("express");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/resources?type=&category=&search=
router.get("/", async (req, res) => {
  const { type, category, search } = req.query;

  try {
    const resources = await prisma.resource.findMany({
      where: {
        ...(type ? { type: type.toUpperCase() } : {}),
        ...(category ? { category: { equals: category, mode: "insensitive" } } : {}),
        ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch resources." });
  }
});

// POST /api/resources/:id/bookmark - toggle bookmark
router.post("/:id/bookmark", requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await prisma.bookmark.findUnique({
      where: { userId_resourceId: { userId: req.user.userId, resourceId: id } },
    });

    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } });
      return res.json({ bookmarked: false });
    }

    await prisma.bookmark.create({ data: { userId: req.user.userId, resourceId: id } });
    res.json({ bookmarked: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update bookmark." });
  }
});

// GET /api/resources/bookmarks/mine
router.get("/bookmarks/mine", requireAuth, async (req, res) => {
  try {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId: req.user.userId },
      include: { resource: true },
    });
    res.json(bookmarks.map((b) => b.resource));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bookmarks." });
  }
});

module.exports = router;
