const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

// ======================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ======================================================
function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  // TOKEN NÃO EXISTE
  if (!token) {
    return res.status(401).json({
      error: "NOT_AUTHENTICATED",
    });
  }

  try {
    // VALIDAR JWT
    const decoded = jwt.verify(token, SECRET_KEY, {
      issuer: "muraldo",
      audience: "muraldo-client",
    });

    if (!Number.isInteger(decoded.userId) || decoded.userId <= 0) {
      return res.status(401).json({
        error: "INVALID_TOKEN",
      });
    }

    // DISPONIBILIZAR ID PARA A ROTA
    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(401).json({
      error: "INVALID_OR_EXPIRED_TOKEN",
    });
  }
}

// ======================================================

module.exports = {
  authenticateToken,
};
