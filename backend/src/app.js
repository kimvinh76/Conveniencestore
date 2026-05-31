const express = require("express");
const cors = require("cors");
require("dotenv").config();

const healthRoutes = require("./routes/health");
const employeesRoutes = require("./routes/employees");
const invoicesRoutes = require("./routes/invoices");
const productsRoutes = require("./routes/products");
const inventoryRoutes = require("./routes/inventory");
const dashboardRoutes = require("./routes/dashboard");
const analyticsRoutes = require("./routes/analytics");
const transferRoutes = require("./routes/transfer");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", transferRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

module.exports = app;
