const express = require("express");
const { login } = require("../controllers/auth.controller");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/login", asyncHandler(login));

module.exports = router;
