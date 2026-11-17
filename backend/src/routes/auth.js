const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const prisma = require("../utils/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { name, email, password: hashed },
      });

      const token = signToken(user);
      res.status(201).json({ token, user: sanitizeUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      const token = signToken(user);
      res.json({ token, user: sanitizeUser(user) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  }
);

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Something went wrong." });
  }
});

// PUT /api/auth/track - set or change the user's target track (used by Settings)
router.put("/track", requireAuth, async (req, res) => {
  const { track } = req.body;
  const validTracks = ["FAANG", "PRODUCT_STARTUP", "SERVICE_FRESHER"];

  if (track !== null && !validTracks.includes(track)) {
    return res.status(400).json({ message: "Invalid track value." });
  }

  try {
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { track },
    });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update track." });
  }
});

module.exports = router;
