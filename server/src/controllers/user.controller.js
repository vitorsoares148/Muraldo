const userService = require("../services/user.service");

// ======================================================
// INFORMAÇÕES DO USUÁRIO
// ======================================================
async function getUserInfo(req, res) {
  try {
    const user = await userService.getUserInfo(req.userId);

    if (!user) {
      return res.status(404).json({
        error: "USER_NOT_FOUND",
      });
    }

    return res.json({
      message: "SUCCESS",
      user,
    });
  } catch (error) {
    console.error("Error getting user info:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================

module.exports = {
  getUserInfo,
};
