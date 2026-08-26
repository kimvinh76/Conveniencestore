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
const customerRoutes = require("./routes/customer-routes");
const promotionsRoutes = require("./routes/promotions");

const app = express();

const frontendOrigin = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

app.use(cors({ origin: frontendOrigin, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
// Chỉ mount Swagger UI nếu file output đã được sinh ra
const swaggerFile = path.join(__dirname, '../swagger_output.json');
if (fs.existsSync(swaggerFile)) {
  const swaggerDocument = require(swaggerFile);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

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
app.use("/api/customers", customerRoutes);
app.use("/api/promotions", promotionsRoutes);

const categoriesRoutes = require("./routes/categories");
const brandsRoutes = require("./routes/brands");

app.use("/api/categories", categoriesRoutes);
app.use("/api/brands", brandsRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Not found" });
});

module.exports = app;
