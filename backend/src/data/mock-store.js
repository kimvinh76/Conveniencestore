const employees = {
  HUE: [
    { MaNV: "H001", HoTen: "Nguyen Van A", ChiNhanh: "HUE", ChucVu: "Thu ngan" },
    { MaNV: "H002", HoTen: "Le Van B", ChiNhanh: "HUE", ChucVu: "Quan ly kho" },
    { MaNV: "H003", HoTen: "Pham Thi C", ChiNhanh: "HUE", ChucVu: "Ban hang" },
  ],
  SAIGON: [
    { MaNV: "S001", HoTen: "Tran Thi C", ChiNhanh: "SAIGON", ChucVu: "Ban hang" },
    { MaNV: "S002", HoTen: "Pham Van D", ChiNhanh: "SAIGON", ChucVu: "Thu ngan" },
    { MaNV: "S003", HoTen: "Le Thi F", ChiNhanh: "SAIGON", ChucVu: "Quan ly kho" },
  ],
  HANOI: [
    { MaNV: "N001", HoTen: "Do Thi E", ChiNhanh: "HANOI", ChucVu: "Ban hang" },
    { MaNV: "N002", HoTen: "Hoang Van F", ChiNhanh: "HANOI", ChucVu: "Quan ly cua hang" },
    { MaNV: "N003", HoTen: "Nguyen Thi I", ChiNhanh: "HANOI", ChucVu: "Thu ngan" },
  ],
};

const products = {
  MI_GOI: { TenHang: "Mi goi", Gia: 12000 },
  SUA_HOP: { TenHang: "Sua hop", Gia: 12000 },
  NUOC_SUOI: { TenHang: "Nuoc suoi", Gia: 7000 },
  BANH_SNACK: { TenHang: "Banh snack", Gia: 15000 },
  CA_PHE_LON: { TenHang: "Ca phe lon", Gia: 18000 },
  TRA_XANH: { TenHang: "Tra xanh", Gia: 10000 },
};

const inventory = {
  HUE: { MI_GOI: 220, SUA_HOP: 80, NUOC_SUOI: 140, BANH_SNACK: 95, CA_PHE_LON: 75, TRA_XANH: 130 },
  SAIGON: { MI_GOI: 110, SUA_HOP: 120, NUOC_SUOI: 160, BANH_SNACK: 100, CA_PHE_LON: 90, TRA_XANH: 145 },
  HANOI: { MI_GOI: 170, SUA_HOP: 60, NUOC_SUOI: 150, BANH_SNACK: 105, CA_PHE_LON: 85, TRA_XANH: 120 },
};

const invoiceSeeds = [
  ["HD_HUE_001", "HUE", "MI_GOI", 10],
  ["HD_HUE_002", "HUE", "SUA_HOP", 5],
  ["HD_SG_001", "SAIGON", "SUA_HOP", 8],
  ["HD_HN_001", "HANOI", "MI_GOI", 6],
];

const invoices = invoiceSeeds.map(([MaHD, ChiNhanh, MaSP, SoLuong]) => {
  const product = products[MaSP] || { TenHang: MaSP, Gia: 0 };
  return {
    MaHD,
    ChiNhanh,
    MaSP,
    SoLuong,
    TongTien: Number(product.Gia || 0) * Number(SoLuong || 0),
    GhiChu: "Hoa don khoi tao",
    NgayTao: new Date().toISOString(),
    TenHang: product.TenHang,
    DonGia: Number(product.Gia || 0),
  };
});

function branchPrefix(branch) {
  if (branch === "HUE") return "H";
  if (branch === "SAIGON") return "S";
  return "N";
}

function listEmployeesByBranch(branch) {
  return [...(employees[branch] || [])];
}

function createEmployee(branch, payload) {
  const list = employees[branch] || (employees[branch] = []);
  const maNV = payload.MaNV || `${branchPrefix(branch)}${String(Date.now()).slice(-4)}`;
  if (list.find((item) => item.MaNV === maNV)) {
    throw new Error(`Employee ${maNV} already exists in ${branch}`);
  }
  const created = { MaNV: maNV, HoTen: payload.HoTen, ChiNhanh: branch, ChucVu: payload.ChucVu };
  list.push(created);
  return created;
}

function updateEmployee(branch, employeeId, payload) {
  const list = employees[branch] || [];
  const index = list.findIndex((item) => item.MaNV === employeeId);
  if (index < 0) throw new Error(`Employee ${employeeId} not found in ${branch}`);
  const next = { ...list[index], HoTen: payload.HoTen || list[index].HoTen, ChucVu: payload.ChucVu || list[index].ChucVu };
  list[index] = next;
  return next;
}

function deleteEmployee(branch, employeeId) {
  const list = employees[branch] || [];
  const index = list.findIndex((item) => item.MaNV === employeeId);
  if (index < 0) throw new Error(`Employee ${employeeId} not found in ${branch}`);
  const [deleted] = list.splice(index, 1);
  return deleted;
}

function listAllEmployees() {
  return Object.keys(employees).flatMap((branch) => employees[branch]);
}

function revenueReport() {
  const byBranch = ["HUE", "SAIGON", "HANOI"].map((branch) => {
    const total = invoices.filter((item) => item.ChiNhanh === branch).reduce((sum, item) => sum + Number(item.TongTien || 0), 0);
    return { branch, revenue: total };
  });
  const nationalRevenue = byBranch.reduce((sum, item) => sum + item.revenue, 0);
  return { mode: "MOCK", generatedAt: new Date().toISOString(), byBranch, nationalRevenue, invoiceCount: invoices.length };
}

function getInventory(branch, productCode) {
  const value = Number((inventory[branch] || {})[productCode] || 0);
  return { branch, productCode, quantity: value };
}

function listInventory(branch) {
  const bucket = inventory[branch] || {};
  return Object.keys(bucket).map((productCode) => ({ branch, productCode, quantity: Number(bucket[productCode] || 0) }));
}

function listProducts() {
  return Object.keys(products).map((code) => ({ productCode: code, productName: products[code].TenHang || code, unitPrice: Number(products[code].Gia || 0) }));
}

function getProductByCode(_branch, productCode) {
  const code = String(productCode || "").trim();
  const product = products[code];
  if (!product) return null;
  return { branch: "CENTRAL", productCode: code, productName: product.TenHang, unitPrice: Number(product.Gia || 0) };
}

function updateInventoryItem(branch, productCode, quantity) {
  const bucket = inventory[branch] || (inventory[branch] = {});
  if (bucket[productCode] === undefined) throw new Error(`Product ${productCode} not found in ${branch}`);
  bucket[productCode] = quantity;
  return { branch, productCode, quantity };
}

function branchDashboard(branch) {
  const branchEmployees = listEmployeesByBranch(branch);
  const branchInvoices = invoices.filter((item) => item.ChiNhanh === branch);
  const branchInventory = listInventory(branch);
  const revenue = branchInvoices.reduce((sum, item) => sum + Number(item.TongTien || 0), 0);
  const totalStockUnits = branchInventory.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const lowStockProducts = branchInventory.filter((item) => Number(item.quantity || 0) < 50).length;
  return { mode: "MOCK", branch, employeeCount: branchEmployees.length, invoiceCount: branchInvoices.length, revenue, totalStockUnits, lowStockProducts, generatedAt: new Date().toISOString() };
}

function transferStock(payload) {
  const fromQty = Number((inventory[payload.fromBranch] || {})[payload.productCode] || 0);
  const toQty = Number((inventory[payload.toBranch] || {})[payload.productCode] || 0);
  if (fromQty < payload.quantity) {
    throw new Error(`Insufficient stock in ${payload.fromBranch}: current ${fromQty}, requested ${payload.quantity}`);
  }
  inventory[payload.fromBranch][payload.productCode] = fromQty - payload.quantity;
  inventory[payload.toBranch][payload.productCode] = toQty + payload.quantity;
  return {
    mode: "MOCK",
    status: "COMMITTED",
    transactionType: "BEGIN DISTRIBUTED TRANSACTION (simulated)",
    productCode: payload.productCode,
    quantity: payload.quantity,
    fromBranch: payload.fromBranch,
    toBranch: payload.toBranch,
    before: { from: fromQty, to: toQty },
    after: { from: inventory[payload.fromBranch][payload.productCode], to: inventory[payload.toBranch][payload.productCode] },
    committedAt: new Date().toISOString(),
  };
}

module.exports = {
  listEmployeesByBranch,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listAllEmployees,
  listInvoicesByBranch: (branch) => invoices.filter((item) => item.ChiNhanh === branch),
  getInvoiceDetailsLocal: (branch, invoiceId) => invoices.filter((item) => item.ChiNhanh === branch && item.MaHD === invoiceId),
  createInvoiceLocal: () => { throw new Error("Mock createInvoice not implemented"); },
  revenueReport,
  getInventory,
  listInventory,
  listProducts,
  createProduct: () => { throw new Error("Mock createProduct not implemented"); },
  updateProduct: () => { throw new Error("Mock updateProduct not implemented"); },
  deleteProduct: () => { throw new Error("Mock deleteProduct not implemented"); },
  getProductByCode,
  updateInventoryItem,
  branchDashboard,
  transferStock,
};
