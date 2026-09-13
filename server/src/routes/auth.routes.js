const express = require("express");

const {
  register,
  login,
  logout,
} = require("../controllers/auth.controller");

const { loginLimiter, registerLimiter } = require("../middleware/rateLimiters");

const router = express.Router();

router.post("/register", registerLimiter, register);

router.post("/login", loginLimiter, login);

router.post("/logout", logout);

module.exports = router;
