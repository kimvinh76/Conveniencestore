const express = require("express");
const controller = require("../controllers/employee-controller");
const router = express.Router();

router.get("/", controller.listEmployees);
router.post("/", controller.createEmployee);
router.put("/:employeeId", controller.updateEmployee);
router.delete("/:employeeId", controller.deleteEmployee);

module.exports = router;
