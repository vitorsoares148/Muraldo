const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

function checkOrigin(req, res, next) {
  const methods = ["POST", "PUT", "PATCH", "DELETE"];

  if (
    methods.includes(req.method) &&
    req.headers.origin &&
    req.headers.origin !== FRONTEND_URL
  ) {
    return res.status(403).json({ error: "FORBIDDEN" });
  }

  next();
}

module.exports = { checkOrigin };
