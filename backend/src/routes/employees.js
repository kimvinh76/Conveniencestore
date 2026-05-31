const express = require("express");
const { normalizeBranch, isCentralBranch } = require("../config/branches");
const service = require("../services/store-service");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    const rows = await service.listEmployeesByBranch(branch);
    return res.json({ branch, count: rows.length, data: rows });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const branch = normalizeBranch(req.body.branch);
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    const payload = {
      MaNV: String(req.body.MaNV || "").trim() || null,
      HoTen: String(req.body.HoTen || "").trim(),
      ChucVu: String(req.body.ChucVu || "").trim(),
    };
    if (!payload.HoTen || !payload.ChucVu) {
      return res.status(400).json({ message: "HoTen and ChucVu are required" });
    }
    const data = await service.createEmployee(branch, payload);
    return res.status(201).json({ message: "Employee created", data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put("/:employeeId", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    const employeeId = String(req.params.employeeId || "").trim();
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required" });
    }
    const payload = {
      HoTen: req.body.HoTen ? String(req.body.HoTen).trim() : null,
      ChucVu: req.body.ChucVu ? String(req.body.ChucVu).trim() : null,
    };
    if (!payload.HoTen && !payload.ChucVu) {
      return res.status(400).json({ message: "at least HoTen or ChucVu is required to update" });
    }
    const data = await service.updateEmployee(branch, employeeId, payload);
    return res.json({ message: "Employee updated", data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete("/:employeeId", async (req, res) => {
  try {
    const branch = normalizeBranch(req.query.branch);
    const employeeId = String(req.params.employeeId || "").trim();
    if (!branch || isCentralBranch(branch)) {
      return res.status(400).json({ message: "branch is required and must be HUE, SAIGON, or HANOI" });
    }
    if (!employeeId) {
      return res.status(400).json({ message: "employeeId is required" });
    }
    const data = await service.deleteEmployee(branch, employeeId);
    return res.json({ message: "Employee deleted", data });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
