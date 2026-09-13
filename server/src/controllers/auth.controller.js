const authService = require("../services/auth.service");

// ======================================================
// REGISTRAR
// ======================================================
async function register(req, res) {
  const { name, email, password } = req.body;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return res.status(400).json({
      error: "INVALID_INPUT",
    });
  }

  const username = name.trim();
  const userEmail = email.trim().toLowerCase();

  if (username.length < 4 || username.length > 32) {
    return res.status(400).json({
      error: "INVALID_USERNAME",
    });
  }

  if (password.length < 8 || password.length > 32) {
    return res.status(400).json({
      error: "INVALID_PASSWORD",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(userEmail)) {
    return res.status(400).json({
      error: "INVALID_EMAIL",
    });
  }

  try {
    const userId = await authService.register(username, userEmail, password);

    authService.createToken(userId, res);

    return res.status(201).json({
      message: "SUCCESS",
    });
  } catch (error) {
    console.error("Register error:", error);

    if (error.code === "USERNAME_TAKEN") {
      return res.status(409).json({
        error: "USERNAME_TAKEN",
      });
    }

    if (error.code === "EMAIL_TAKEN") {
      return res.status(409).json({
        error: "EMAIL_TAKEN",
      });
    }

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// LOGIN
// ======================================================
async function login(req, res) {
  const { name, password } = req.body;

  if (
    typeof name !== "string" ||
    typeof password !== "string" ||
    name.trim() === "" ||
    password === ""
  ) {
    return res.status(400).json({
      error: "INVALID_INPUT",
    });
  }

  const username = name.trim();

  try {
    const userId = await authService.login(username, password);

    authService.createToken(userId, res);

    return res.json({
      message: "SUCCESS",
    });
  } catch (error) {
    console.error("Login error:", error);

    if (error.code === "INVALID_CREDENTIALS") {
      return res.status(401).json({
        error: "INVALID_CREDENTIALS",
      });
    }

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// LOGOUT
// ======================================================
function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    path: "/",
  });

  return res.json({
    message: "SUCCESS",
  });
}

// ======================================================

module.exports = {
  register,
  login,
  logout,
};
