const express = require("express");
const prisma = require("../utils/prisma");

const router = express.Router();

// GET /api/interview/companies - list all companies
router.get("/companies", async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: { _count: { select: { questions: true } } },
      orderBy: { name: "asc" },
    });
    res.json(companies);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch companies." });
  }
});

// GET /api/interview/questions?category=&company=&search=
router.get("/questions", async (req, res) => {
  const { category, company, search } = req.query;

  try {
    const questions = await prisma.question.findMany({
      where: {
        ...(category ? { category: category.toUpperCase() } : {}),
        ...(company ? { company: { name: { equals: company, mode: "insensitive" } } } : {}),
        ...(search
          ? { title: { contains: search, mode: "insensitive" } }
          : {}),
      },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch questions." });
  }
});

module.exports = router;
