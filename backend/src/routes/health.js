const express = require("express");
const { supportedBranches } = require("../config/branches");

const router = express.Router();

router.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "distributed-store-demo",
    mode: process.env.MOCK_MODE === "true" ? "MOCK" : "SQL_SERVER",
    branches: supportedBranches(),
  });
});

module.exports = router;
