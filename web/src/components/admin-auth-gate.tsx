"use client";

import { loadAppConfig, verifyAdminCode } from "@/lib/apps-script";
import { clearAdminSession, isAdminSessionVerified, markAdminSessionVerified } from "@/lib/admin-auth";
import { getBasePath } from "@/lib/paths";
import type { AppConfig } from "@/lib/types";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

const APP_BASE_PATH = getBasePath();

function ShieldIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function AdminLogoutButton() {
  function handleLogout() {
    clearAdminSession();
    window.location.reload();
  }

  return (
    <button className="ghost-button" onClick={handleLogout} type="button">
      인증 해제
    </button>
  );
}

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [adminCode, setAdminCode] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("관리자 기능은 학교 담당자만 사용할 수 있습니다.");
  const [messageTone, setMessageTone] = useState<"info" | "error">("info");

  useEffect(() => {
    async function loadRuntimeConfig() {
      const stored = isAdminSessionVerified();
      setAuthenticated(stored);

      const result = await loadAppConfig();
      if (!result.ok) {
        setMessage(result.message);
        setMessageTone("error");
        setLoading(false);
        return;
      }

      setRuntimeConfig(result.config);
      setLoading(false);
    }

    void loadRuntimeConfig();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!runtimeConfig) {
      setMessage("app-config.json의 Apps Script URL을 먼저 확인해주세요.");
      setMessageTone("error");
      return;
    }

    setChecking(true);
    setMessage("관리자 코드를 확인하는 중입니다.");
    setMessageTone("info");

    const result = await verifyAdminCode(runtimeConfig, adminCode);
    setChecking(false);

    if (result.error || !result.data?.verified) {
      setMessage("관리자 코드가 일치하지 않습니다.");
      setMessageTone("error");
      setAdminCode("");
      return;
    }

    markAdminSessionVerified();
    setAuthenticated(true);
    setAdminCode("");
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <main className="page">
      <div className="admin-auth-shell">
        <article className="admin-auth-card" aria-label="관리자 인증">
          <div className="admin-auth-icon" aria-hidden="true">
            <ShieldIcon />
          </div>
          <div className="admin-auth-copy">
            <span>ADMIN ACCESS</span>
            <h1>관리자 인증</h1>
            <p>관리자 전용 화면입니다. 학교설정의 관리자 코드를 입력해 주세요.</p>
          </div>

          {message ? <div className={messageTone === "error" ? "soft-alert danger" : "soft-alert"}>{loading ? "설정을 불러오는 중입니다." : message}</div> : null}

          <form className="attendance-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span>관리자 코드</span>
              <input autoComplete="current-password" disabled={loading || checking} onChange={(event) => setAdminCode(event.target.value)} type="password" value={adminCode} />
            </label>
            <button className="primary-action" disabled={loading || checking || !adminCode.trim()} type="submit">
              {checking ? "확인 중" : "관리자 화면 열기"}
            </button>
          </form>
          <a className="ghost-button admin-auth-home" href={`${APP_BASE_PATH}/`}>
            홈으로 돌아가기
          </a>
        </article>
      </div>
    </main>
  );
}
