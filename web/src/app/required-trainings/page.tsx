"use client";

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

function trainingDetails(item: RequiredTrainingItem) {
  return [
    ["과정구분", item.category],
    ["차시", item.sessions],
    ["기준시간", item.requiredDuration],
    ["주기", item.frequency],
    ["대상구분", item.targetType],
    ["이수방법", item.deliveryMethod],
    ["출처", item.source],
    ["근거/비고", item.note]
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
}

function matchesFilter(item: RequiredTrainingItem, filter: RequiredTrainingFilter) {
  if (filter === "all") return true;
  if (filter === "bundled") return item.isBundled;
  if (filter === "separate") return item.isSeparateRequired;
  return item.matchStatus === filter;
}

export default function RequiredTrainingsPage() {
  const [result, setResult] = useState<RequiredTrainingsResult>();
  const [filter, setFilter] = useState<RequiredTrainingFilter>("all");
  const [message, setMessage] = useState("필수연수 기준을 불러오는 중입니다.");

  useEffect(() => {
    async function load() {
      const configResult = await loadAppConfig();
      if (!configResult.ok) {
        setMessage("학교 설정이 준비되면 필수연수 기준을 확인할 수 있습니다.");
        return;
      }
      const requiredResult = await getRequiredTrainings(configResult.config);
      if (requiredResult.error || !requiredResult.data) {
        setMessage(requiredResult.error ?? "필수연수 기준을 불러오지 못했습니다.");
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
    : "학교 설정 확인 중";

  return (
    <main className="page">
      <div className="dashboard-shell">
        <div className="route-actions">
          <span className="page-toolbar-title">필수연수 안내</span>
          <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
            홈으로
          </a>
        </div>

        <section className="today-card" aria-label="필수연수 기준">
          <div className="today-copy">
            <div className="section-kicker">
              <span>REQUIRED TRAININGS</span>
            </div>
            <h1>우리 학교에 해당하는 법정·의무연수를 확인합니다.</h1>
            <p>{standardText}</p>
          </div>
        </section>

        {result?.setupRequired ? (
          <section className="training-section">
            <div className="empty-training">
              <div>
                <strong>필수연수 기준을 확인하려면 학교 설정을 먼저 완료해주세요.</strong>
                <p>학교급, 지역, 설립유형 설정이 필요합니다.</p>
              </div>
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
                    {item.isBundled ? <span className="badge-blue">교육청 묶음과정</span> : null}
                    {item.isSeparateRequired ? <span className="badge-violet">별도 이수 필요</span> : null}
                  </div>
                  {item.isSeparateRequired ? <p>교육청 묶음과정에 포함되지 않아 개별 이수가 필요한 과정입니다.</p> : null}
                  <dl className="required-detail-grid">
                    {trainingDetails(item).map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
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
  );
}
