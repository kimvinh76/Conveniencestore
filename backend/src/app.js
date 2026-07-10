const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const employeesRoutes = require("./routes/employees");
const invoicesRoutes = require("./routes/invoices");
const productsRoutes = require("./routes/products");
const inventoryRoutes = require("./routes/inventory");
const dashboardRoutes = require("./routes/dashboard");
const analyticsRoutes = require("./routes/analytics");
const transferRoutes = require("./routes/transfer");
const accountsRoutes = require("./routes/accounts"); 
const purchaseReceiptsRoutes = require("./routes/purchase-receipts");
const suppliersRoutes = require("./routes/suppliers");


const app = express();

const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", transferRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/purchase-receipts", purchaseReceiptsRoutes);
app.use("/api/suppliers", suppliersRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

module.exports = app;
