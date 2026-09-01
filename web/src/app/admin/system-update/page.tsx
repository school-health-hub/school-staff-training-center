"use client";

import { AdminAuthGate, AdminLogoutButton } from "@/components/admin-auth-gate";
import { getSchemaStatus, loadAppConfig, previewSchemaMigration, runSchemaMigration } from "@/lib/apps-script";
import { getBasePath } from "@/lib/paths";
import type { AppConfig, SchemaMigrationPreview, SchemaMigrationResult, SchemaStatus } from "@/lib/types";
import { useEffect, useState } from "react";

const APP_BASE_PATH = getBasePath();

type UpdateStep = "loading" | "ready" | "preview" | "running" | "done";

export default function AdminSystemUpdatePage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [status, setStatus] = useState<SchemaStatus>();
  const [preview, setPreview] = useState<SchemaMigrationPreview>();
  const [result, setResult] = useState<SchemaMigrationResult>();
  const [step, setStep] = useState<UpdateStep>("loading");
  const [message, setMessage] = useState("시스템 버전을 확인하는 중입니다.");

  useEffect(() => {
    async function load() {
      const configResult = await loadAppConfig();
      if (!configResult.ok) {
        setMessage("Apps Script URL 설정 후 시스템 업데이트를 사용할 수 있습니다.");
        setStep("ready");
        return;
      }
      setRuntimeConfig(configResult.config);
      const statusResult = await getSchemaStatus(configResult.config);
      if (statusResult.error || !statusResult.data) {
        setMessage(statusResult.error ?? "시스템 버전을 확인하지 못했습니다.");
        setStep("ready");
        return;
      }
      setStatus(statusResult.data);
      setMessage(statusResult.data.needsUpdate ? "새로운 업데이트가 있습니다." : "최신 버전입니다.");
      setStep("ready");
    }
    void load();
  }, []);

  async function handlePreview() {
    if (!runtimeConfig) return;
    const previewResult = await previewSchemaMigration(runtimeConfig);
    if (previewResult.error || !previewResult.data) {
      setMessage(previewResult.error ?? "업데이트 내용을 확인하지 못했습니다.");
      return;
    }
    setPreview(previewResult.data);
    setMessage(previewResult.data.needsUpdate ? "이번 업데이트에서 추가됩니다." : "추가 업데이트가 없습니다.");
    setStep("preview");
  }

  async function handleRun() {
    if (!runtimeConfig) return;
    setStep("running");
    setMessage("업데이트를 실행하는 중입니다.");
    const migrationResult = await runSchemaMigration(runtimeConfig);
    if (migrationResult.error || !migrationResult.data) {
      setMessage(migrationResult.error ?? "업데이트를 완료하지 못했습니다.");
      setStep("preview");
      return;
    }
    setResult(migrationResult.data);
    setStatus({
      currentVersion: migrationResult.data.currentVersion,
      latestVersion: migrationResult.data.targetVersion,
      needsUpdate: false
    });
    setMessage("업데이트가 완료되었습니다.");
    setStep("done");
  }

  return (
    <AdminAuthGate>
      <main className="page">
        <div className="dashboard-shell">
          <div className="route-actions">
            <span className="page-toolbar-title">시스템 업데이트</span>
            <a className="ghost-button" href={`${APP_BASE_PATH}/admin/`}>
              관리자 메뉴
            </a>
            <AdminLogoutButton />
          </div>

          <section className="today-card" aria-label="시스템 업데이트">
            <div className="today-copy">
              <div className="section-kicker">
                <span>SYSTEM UPDATE</span>
              </div>
              <h1>허브시트 구조와 새로운 기능을 최신 버전으로 업데이트합니다.</h1>
              <p>기존 교육목록, 전자서명, 이수증 데이터는 변경되지 않습니다.</p>
            </div>
          </section>

          <section className="training-section" aria-label="업데이트 상태">
            <div className="status-summary-grid required-summary-grid">
              <div className="status-summary-card">
                <span>현재 버전</span>
                <strong>{status?.currentVersion ?? "-"}</strong>
              </div>
              <div className="status-summary-card">
                <span>최신 버전</span>
                <strong>{status?.latestVersion ?? "1.1.0"}</strong>
              </div>
              <div className="status-summary-card">
                <span>업데이트 상태</span>
                <strong>{status?.needsUpdate ? "업데이트 필요" : "최신"}</strong>
              </div>
            </div>
            <div className={status?.needsUpdate ? "setup-status-card warning" : "setup-status-card success"}>
              <strong>{status?.needsUpdate ? "새로운 업데이트가 있습니다." : "최신 버전입니다."}</strong>
              <p>{message}</p>
            </div>
            <button className="primary-action" disabled={!runtimeConfig || step === "loading" || step === "running"} onClick={handlePreview} type="button">
              업데이트 확인
            </button>
          </section>

          {preview ? (
            <section className="training-section" aria-label="업데이트 미리보기">
              <div className="section-head">
                <div>
                  <h2>이번 업데이트에서 추가됩니다.</h2>
                  <p>{preview.currentVersion} → {preview.targetVersion}</p>
                </div>
              </div>
              <ul className="check-list">
                {(preview.changes.length ? preview.changes : ["추가 변경사항 없음"]).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="setup-status-card">
                <strong>기존 교육목록, 전자서명, 이수증 데이터는 변경되지 않습니다.</strong>
                <p>없는 시트, 없는 헤더, 없는 설정 key만 추가하는 additive update입니다.</p>
              </div>
              {preview.needsUpdate ? (
                <button className="primary-action" disabled={step === "running"} onClick={handleRun} type="button">
                  {step === "running" ? "업데이트 실행 중" : "업데이트 실행"}
                </button>
              ) : null}
            </section>
          ) : null}

          {result ? (
            <section className="training-section" aria-label="업데이트 완료">
              <div className="setup-status-card success">
                <strong>업데이트가 완료되었습니다.</strong>
                <p>{result.fromVersion} → {result.currentVersion}</p>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </AdminAuthGate>
  );
}
