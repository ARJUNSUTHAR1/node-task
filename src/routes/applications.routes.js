const express = require("express");
const {
  getSummary,
  getAging,
} = require("../controllers/applicationsReport.controller");

const router = express.Router();

router.get("/summary", getSummary);
router.get("/aging", getAging);

module.exports = router;
