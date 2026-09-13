const express = require("express");

const { getUserInfo } = require("../controllers/user.controller");

const { authenticateToken } = require("../middleware/authenticateToken");

const router = express.Router();

router.get("/info", authenticateToken, getUserInfo);

module.exports = router;
