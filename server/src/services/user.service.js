const db = require("../../db");

async function getUserInfo(userId) {
  const [rows] = await db.query(
    `
    SELECT username, id
    FROM users
    WHERE id = ?
    `,
    [userId],
  );

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
}

// ======================================================

module.exports = {
  getUserInfo,
};