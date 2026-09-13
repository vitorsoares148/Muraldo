const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo de 10 tentativas
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TOO_MANY_LOGIN_ATTEMPTS",
  },
  skip: () => process.env.NODE_ENV === "test",
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // máximo de 5 cadastros por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "TOO_MANY_REGISTER_ATTEMPTS",
  },
  skip: () => process.env.NODE_ENV === "test",
});

// ======================================================

module.exports = {
  loginLimiter,
  registerLimiter,
};
