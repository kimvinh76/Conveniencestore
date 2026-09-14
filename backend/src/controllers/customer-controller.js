const customerService = require("../services/customer-service");

async function listCustomers(req, res, next) {
  try {
    const branch = req.auth?.branch || req.query.branch || "CENTRAL";
    const query = req.query.search || null;
    const data = await customerService.searchCustomers(branch, query);
    res.json(data);
  } catch (error) {
    next(error);
  }
}

async function createCustomer(req, res, next) {
  try {
    const branch = req.auth?.branch || req.query.branch || "CENTRAL";
    
    // Yêu cầu branchId để biết khách được đăng ký ở đâu, default là branch hiện tại nếu là chi nhánh
    let { customerId, fullName, phoneNumber, branchId } = req.body;
    
    if (branch === "CENTRAL") {
       return res.status(400).json({ success: false, message: "Hệ thống chỉ cho phép đăng ký khách hàng tại các chi nhánh cửa hàng." });
    }
    
    if (!branchId) {
       branchId = branch;
    }

    if (!customerId || !fullName) {
      return res.status(400).json({ message: "customerId và fullName là bắt buộc!" });
    }

    const data = await customerService.createCustomer(branch, { customerId, fullName, phoneNumber, branchId });
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

async function updateCustomer(req, res, next) {
  try {
    const branch = req.auth?.branch || req.query.branch || "CENTRAL";
    const customerId = req.params.id;
    const { fullName, phoneNumber } = req.body;

    if (!fullName) {
      return res.status(400).json({ message: "fullName là bắt buộc!" });
    }

    const data = await customerService.updateCustomer(branch, customerId, { fullName, phoneNumber });
    res.json(data);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCustomers,
  createCustomer,
  updateCustomer
};
