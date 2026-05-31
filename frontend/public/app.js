/* DDBMS adapted app.js — uses cookies for branch state instead of localStorage */
(function () {
  const BRANCH_LABELS = {
    HUE: "Chi nhánh Huế (Port 1401)",
    SAIGON: "Chi nhánh Sài Gòn (Port 1402)",
    HANOI: "Chi nhánh Hà Nội (Port 1403)",
    CENTRAL: "Tổng công ty (Port 1404)",
  };

  const chartRegistry = {};
  const page = document.body.dataset.page;

  function getCookie(name) {
    const m = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return m ? decodeURIComponent(m[2]) : null;
  }

  function setCookie(name, value, days = 30) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${d.toUTCString()}`;
  }

  function deleteCookie(name) {
    document.cookie = `${name}=; path=/; max-age=0`;
  }

  function getCurrentBranch() {
    return getCookie("current_branch");
  }

  function setCurrentBranch(branch) {
    setCookie("current_branch", branch, 30);
  }

  function logout() {
    deleteCookie("current_branch");
    window.location.href = "/";
  }

  function navigateByBranch(branch) {
    setCurrentBranch(branch);
    window.location.href = branch === "CENTRAL" ? "/central" : "/branch-dashboard";
  }

  function ensureLocalBranch() {
    const branch = getCurrentBranch();
    if (!branch || branch === "CENTRAL") {
      window.location.href = "/";
      return null;
    }
    return branch;
  }

  function ensureCentralBranch() {
    const branch = getCurrentBranch();
    if (branch !== "CENTRAL") {
      window.location.href = "/";
      return false;
    }
    return true;
  }

  function setupBranchShell(branch) {
    const branchTitle = document.getElementById("branchTitle");
    if (branchTitle) {
      branchTitle.textContent = BRANCH_LABELS[branch] || branch;
    }
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }
  }

  function setupCentralShell() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", logout);
    }
  }

  /* The rest of the original helper functions are kept intact (renderTable, fetchJSON, etc.) */
  /* For brevity, include minimal implementations used by pages (renderTable, fetchJSON, renderStatsGrid) */

  function formatTableCellValue(columnName, value) {
    if (value === null || value === undefined) return "";
    const normalized = String(columnName || "").toLowerCase();
    const shouldFormatDate = normalized === "ngaytao";
    if (!shouldFormatDate) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const pad2 = (num) => String(num).padStart(2, "0");
    const day = pad2(date.getUTCDate());
    const month = pad2(date.getUTCMonth() + 1);
    const year = date.getUTCFullYear();
    const hour = pad2(date.getUTCHours());
    const minute = pad2(date.getUTCMinutes());
    const second = pad2(date.getUTCSeconds());
    return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }

  function renderTable(wrapper, rows, options = {}) {
    if (!rows || rows.length === 0) {
      wrapper.innerHTML = `<p class="subtitle">${options.emptyMessage || "Không có dữ liệu."}</p>`;
      return;
    }
    const tableId = options.tableId || `tb_${Math.random().toString(36).slice(2)}`;
    const headers = Object.keys(rows[0]);
    const thead = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`;
    const tbody = `<tbody>${rows
      .map(
        (row, index) =>
          `<tr data-table-id="${tableId}" data-row-index="${index}">${headers
            .map((h) => `<td>${formatTableCellValue(h, row[h])}</td>`)
            .join("")}</tr>`,
      )
      .join("")}</tbody>`;
    wrapper.innerHTML = `<table class="selectable-table">${thead}${tbody}</table>`;
    if (typeof options.onRowSelect === "function") {
      const renderedRows = wrapper.querySelectorAll(`tr[data-table-id="${tableId}"]`);
      renderedRows.forEach((rowEl) => {
        rowEl.addEventListener("click", () => {
          renderedRows.forEach((item) => item.classList.remove("is-selected"));
          rowEl.classList.add("is-selected");
          const index = Number(rowEl.dataset.rowIndex || 0);
          options.onRowSelect(rows[index], index);
        });
      });
    }
  }

  async function fetchJSON(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }
    return data;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
  }

  function renderStatsGrid(wrapper, stats) {
    const cards = [
      { label: "Nhân viên", value: stats.employeeCount },
      { label: "Hóa đơn", value: stats.invoiceCount },
      { label: "Doanh thu", value: `${formatNumber(stats.revenue)} VND` },
      { label: "Tổng tồn kho", value: formatNumber(stats.totalStockUnits) },
      { label: "Sản phẩm sắp hết", value: formatNumber(stats.lowStockProducts) },
    ];
    wrapper.innerHTML = cards
      .map((item) => `<article class="stat-card"><p>${item.label}</p><h3>${item.value}</h3></article>`)
      .join("");
  }

  /* Expose some helpers on window for pages that rely on them */
  window.DDBMS = {
    getCurrentBranch,
    setCurrentBranch,
    logout,
    navigateByBranch,
    ensureLocalBranch,
    ensureCentralBranch,
    setupBranchShell,
    setupCentralShell,
    renderTable,
    renderStatsGrid,
    fetchJSON,
  };

  /* Initialize landing page buttons if present */
  document.addEventListener("DOMContentLoaded", function () {
    const landingButtons = document.querySelectorAll("[data-branch]");
    landingButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const branch = btn.dataset.branch;
        setCurrentBranch(branch);
        navigateByBranch(branch);
      });
    });

    // Hook logout buttons
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", logout);
  });
})();
