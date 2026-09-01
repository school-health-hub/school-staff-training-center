"use client";

import { AdminAuthGate, AdminLogoutButton } from "@/components/admin-auth-gate";
import { getRequiredTrainings, loadAppConfig } from "@/lib/apps-script";
import { getBasePath } from "@/lib/paths";
import type { RequiredTrainingItem, RequiredTrainingMatchStatus, RequiredTrainingsResult } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const APP_BASE_PATH = getBasePath();

type RequiredTrainingFilter = "all" | "bundled" | "separate" | RequiredTrainingMatchStatus;

const FILTERS: Array<{ label: string; value: RequiredTrainingFilter }> = [
  { label: "전체", value: "all" },
  { label: "묶음과정", value: "bundled" },
  { label: "별도이수", value: "separate" },
  { label: "등록완료", value: "registered" },
  { label: "미등록", value: "missing" },
  { label: "확인필요", value: "needs_review" }
];

function statusLabel(status: RequiredTrainingMatchStatus) {
  if (status === "registered") return "등록완료";
  if (status === "needs_review") return "확인필요";
  return "미등록";
}

function statusClassName(status: RequiredTrainingMatchStatus) {
  if (status === "registered") return "status-chip status-completed";
  if (status === "needs_review") return "status-chip status-review";
  return "status-chip status-incomplete";
}

function matchesFilter(item: RequiredTrainingItem, filter: RequiredTrainingFilter) {
  if (filter === "all") return true;
  if (filter === "bundled") return item.isBundled;
  if (filter === "separate") return item.isSeparateRequired;
  return item.matchStatus === filter;
}

function registerHref(title: string) {
  const params = new URLSearchParams({ title });
  return `${APP_BASE_PATH}/admin/trainings/?${params.toString()}`;
}

export default function AdminRequiredTrainingsPage() {
  const [result, setResult] = useState<RequiredTrainingsResult>();
  const [filter, setFilter] = useState<RequiredTrainingFilter>("all");
  const [message, setMessage] = useState("필수연수 등록 현황을 불러오는 중입니다.");

  useEffect(() => {
    async function load() {
      const configResult = await loadAppConfig();
      if (!configResult.ok) {
        setMessage("Apps Script URL 설정 후 필수연수 점검을 사용할 수 있습니다.");
        return;
      }
      const requiredResult = await getRequiredTrainings(configResult.config);
      if (requiredResult.error || !requiredResult.data) {
        setMessage(requiredResult.error ?? "필수연수 등록 현황을 불러오지 못했습니다.");
        return;
      }
      setResult(requiredResult.data);
      setMessage(requiredResult.data.message || "");
    }
    void load();
  }, []);

  const visibleItems = useMemo(() => (result?.requiredTrainings ?? []).filter((item) => matchesFilter(item, filter)), [filter, result]);
  const standardText = result
    ? [result.schoolConfig.year, result.schoolConfig.region, result.schoolConfig.schoolType, result.schoolConfig.schoolLevel].filter(Boolean).join(" · ")
    : "학교 기준 확인 중";

  return (
    <AdminAuthGate>
      <main className="page">
        <div className="dashboard-shell">
          <div className="route-actions">
            <span className="page-toolbar-title">필수연수 점검</span>
            <a className="ghost-button" href={`${APP_BASE_PATH}/admin/`}>
              관리자 메뉴
            </a>
            <AdminLogoutButton />
          </div>

          <section className="today-card" aria-label="필수연수 점검">
            <div className="today-copy">
              <div className="section-kicker">
                <span>REQUIRED TRAININGS</span>
              </div>
              <h1>우리 학교 필수연수 등록 현황을 확인합니다.</h1>
              <p>{standardText}</p>
            </div>
          </section>

          {result?.setupRequired ? (
            <section className="training-section">
              <div className="empty-training">
                <div>
                  <strong>필수연수 기준을 확인하려면 학교 설정을 먼저 완료해주세요.</strong>
                  <p>학교급, 지역, 설립유형을 설정하면 기준표를 필터링할 수 있습니다.</p>
                </div>
                <a className="primary-action" href={`${APP_BASE_PATH}/admin/settings/`}>
                  학교 설정으로 이동
                </a>
              </div>
            </section>
          ) : null}

          {result ? (
            <section className="training-section" aria-label="필수연수 요약">
              <div className="status-summary-grid required-summary-grid">
                <div className="status-summary-card"><span>전체</span><strong>{result.summary.total}</strong></div>
                <div className="status-summary-card"><span>등록완료</span><strong>{result.summary.registered}</strong></div>
                <div className="status-summary-card"><span>미등록</span><strong>{result.summary.missing}</strong></div>
                <div className="status-summary-card"><span>묶음과정</span><strong>{result.summary.bundled}</strong></div>
                <div className="status-summary-card"><span>별도이수</span><strong>{result.summary.separateRequired}</strong></div>
                <div className="status-summary-card"><span>확인필요</span><strong>{result.summary.needsReview}</strong></div>
              </div>
              <div className="filter-row">
                {FILTERS.map((item) => (
                  <button className={filter === item.value ? "filter-chip active" : "filter-chip"} key={item.value} onClick={() => setFilter(item.value)} type="button">
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="training-section" aria-label="필수연수 목록">
            <div className="training-list required-training-list">
              {visibleItems.length > 0 ? (
                visibleItems.map((item) => (
                  <article className="training-card required-training-card" key={item.requiredTrainingId || item.title}>
                    <div className="status-card-head">
                      <div>
                        <strong>{item.title}</strong>
                        {item.matchedTrainingTitle ? <p>등록 교육: {item.matchedTrainingTitle}</p> : null}
                      </div>
                      <span className={statusClassName(item.matchStatus)}>{statusLabel(item.matchStatus)}</span>
                    </div>
                    <div className="badge-row">
                      {item.category ? <span>{item.category}</span> : null}
                      {item.isBundled ? <span className="badge-blue">교육청 묶음과정</span> : null}
                      {item.isSeparateRequired ? <span className="badge-violet">별도 이수 필요</span> : null}
                    </div>
                    {item.matchStatus === "missing" ? (
                      <a className="primary-action compact" href={registerHref(item.title)}>
                        교육 등록하기
                      </a>
                    ) : null}
                    {item.matchStatus === "needs_review" ? <p>유사한 교육이 있습니다. 교육목록에서 같은 과정인지 확인해 주세요.</p> : null}
                  </article>
                ))
              ) : (
                <div className="empty-training">
                  <div>
                    <strong>{message || "표시할 필수연수 기준이 없습니다."}</strong>
                    <p>학교 설정 또는 필수연수 기준표를 확인해 주세요.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </AdminAuthGate>
  );
}
