const db = require("../../../db");

async function cleanupDatabase() {
  await db.query("DELETE FROM tasks");
  await db.query("DELETE FROM columns");
  await db.query("DELETE FROM boards");
  await db.query("DELETE FROM project_members");
  await db.query("DELETE FROM projects");
  await db.query("DELETE FROM users");
}

module.exports = cleanupDatabase;
