"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BRANCH_LABELS = {
  HUE: "Chi nhánh Huế (Port 1401)",
  SAIGON: "Chi nhánh Sài Gòn (Port 1402)",
  HANOI: "Chi nhánh Hà Nội (Port 1403)",
  CENTRAL: "Tổng công ty (Port 1404)",
};

function getCookie(name) {
  const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
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

export function useBranch({ requireLocal = false, requireCentral = false } = {}) {
  const router = useRouter();
  const [branch, setBranchState] = useState(null);

  useEffect(() => {
    const current = getCookie("current_branch");
    if (requireCentral && current !== "CENTRAL") {
      router.replace("/");
      return;
    }
    if (requireLocal && (!current || current === "CENTRAL")) {
      router.replace("/");
      return;
    }
    setBranchState(current);
  }, [requireCentral, requireLocal, router]);

  const setBranch = (next) => {
    setCookie("current_branch", next);
    setBranchState(next);
  };

  const logout = () => {
    deleteCookie("current_branch");
    router.replace("/");
  };

  return {
    branch,
    branchLabel: branch ? BRANCH_LABELS[branch] || branch : "",
    setBranch,
    logout,
  };
}
