"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/services/api";

const BRANCH_LABELS = {
  HUE: "Chi nhánh Huế ",
  SAIGON: "Chi nhánh Sài Gòn ",
  HANOI: "Chi nhánh Hà Nội ",
  CENTRAL: "Tổng công ty ",
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
  const [auth, setAuth] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const syncAuthState = async () => {
      try {
        const response = await apiFetch("/api/auth/me", { method: "GET" });
        const current = response?.auth?.branch || null;

        if (!current) {
          deleteCookie("current_branch");
          setAuth(null);
          router.replace("/");
          return;
        }

        if (requireCentral && current !== "CENTRAL") {
          router.replace("/");
          return;
        }

        if (requireLocal && current === "CENTRAL") {
          router.replace("/");
          return;
        }

        setCookie("current_branch", current);
        if (!cancelled) {
          setBranchState(current);
          setAuth(response?.auth || null);
        }
      } catch (_error) {
        deleteCookie("current_branch");
        setAuth(null);
        router.replace("/");
      } finally {
        if (!cancelled) {
          setReady(true);
        }
      }
    };

    syncAuthState().catch(() => { });

    return () => {
      cancelled = true;
    };
  }, [requireCentral, requireLocal, router]);

  const setBranch = (next) => {
    setCookie("current_branch", next);
    setBranchState(next);
  };

  const logout = () => {
    apiFetch("/api/auth/logout", { method: "POST" }).catch(() => { });
    deleteCookie("current_branch");
    router.replace("/");
  };

  return {
    branch,
    branchLabel: branch ? BRANCH_LABELS[branch] || branch : "",
    setBranch,
    logout,
    ready,
    auth,
  };
}
