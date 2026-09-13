const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../db");

const SECRET_KEY = process.env.SECRET_KEY;

// ======================================================
// REGISTRAR
// ======================================================
async function register(username, email, password) {
  // VERIFICAR SE USERNAME OU EMAIL JÁ EXISTEM
  const [existingUsers] = await db.query(
    `SELECT id, username, email
     FROM users
     WHERE username = ? OR email = ?
     LIMIT 2`,
    [username, email],
  );

  if (existingUsers.some((user) => user.username === username)) {
    const error = new Error("Username already exists");
    error.code = "USERNAME_TAKEN";
    throw error;
  }

  if (existingUsers.some((user) => user.email === email)) {
    const error = new Error("Email already exists");
    error.code = "EMAIL_TAKEN";
    throw error;
  }

  // CRIPTOGRAFAR SENHA
  const hashedPassword = await bcrypt.hash(password, 12);

  // CRIAR USUÁRIO
  const [result] = await db.query(
    `INSERT INTO users (username, email, password)
     VALUES (?, ?, ?)`,
    [username, email, hashedPassword],
  );

  return result.insertId;
}

// ======================================================
// LOGIN
// ======================================================
async function login(username, password) {
  const [users] = await db.query(
    `SELECT id, username, password
     FROM users
     WHERE username = ?
     LIMIT 1`,
    [username],
  );

  if (!users || users.length === 0) {
    const error = new Error("Invalid credentials");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  const user = users[0];

  const passwordCorrect = await bcrypt.compare(password, user.password);

  if (!passwordCorrect) {
    const error = new Error("Invalid credentials");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  return user.id;
}

// ======================================================
// JWT
// ======================================================
function createToken(userId, res) {
  const token = jwt.sign(
    {
      userId,
    },
    SECRET_KEY,
    {
      expiresIn: "60m",
      issuer: "muraldo",
      audience: "muraldo-client",
    },
  );

  res.cookie("token", token, {
    httpOnly: true,
    // HTTPS em produção
    secure: process.env.NODE_ENV === "production",
    // Proteção contra CSRF
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    // Cookie disponível para toda a aplicação
    path: "/",
    // 60 minutos
    maxAge: 60 * 60 * 1000,
  });
}

// ======================================================

module.exports = {
  register,
  login,
  createToken,
};
