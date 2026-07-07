"use client";

import { AdminAuthGate, AdminLogoutButton } from "@/components/admin-auth-gate";
import { getStaffList, getTrainingList, getTrainingTargets, loadAppConfig, updateTrainingTargets } from "@/lib/apps-script";
import { getBasePath } from "@/lib/paths";
import type { AdminStaff, AppConfig, CompletionMethod, Training, TrainingTargetsMutationItem } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

const APP_BASE_PATH = getBasePath();

type TargetDraft = {
  isTarget: boolean;
  required: boolean;
  certificateTarget: boolean;
  note: string;
};

function PageIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m16 11 2 2 4-4" />
    </svg>
  );
}

function completionMethodForTraining(training?: Training): CompletionMethod {
  if (!training) {
    return "qr-signature";
  }

  if (training.certificateRequired) {
    return "certificate-upload";
  }

  if (training.qrEnabled) {
    return "qr-signature";
  }

  return "admin-check";
}

function completionMethodLabel(method: CompletionMethod) {
  if (method === "qr-signature") return "현장 QR 서명";
  if (method === "certificate-upload") return "이수증 업로드";
  return "관리자 확인";
}

function methodGuide(method: CompletionMethod) {
  if (method === "qr-signature") {
    return "대상자가 교육장에서 QR을 스캔하고 전자서명을 제출하면 05_전자서명기록 기준으로 이수완료 처리됩니다.";
  }

  if (method === "certificate-upload") {
    return "이수증 제출 대상자는 06_이수증업로드 기록을 기준으로 제출 상태를 확인합니다.";
  }

  return "담당자가 별도 확인 후 이수 상태를 정리하는 교육입니다.";
}

function staffMeta(staff: AdminStaff) {
  return [staff.department, staff.position, staff.employmentStatus].filter(Boolean).join(" · ");
}

function emptyDraftFor(method: CompletionMethod): TargetDraft {
  return {
    isTarget: false,
    required: true,
    certificateTarget: method === "certificate-upload",
    note: ""
  };
}

export default function AdminTargetsPage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [selectedTrainingId, setSelectedTrainingId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, TargetDraft>>({});
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("교육대상 관리 정보를 불러오는 중입니다.");
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">("info");

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      const configResult = await loadAppConfig();

      if (ignore) return;

      if (!configResult.ok) {
        setMessage(configResult.message);
        setMessageTone("error");
        return;
      }

      setRuntimeConfig(configResult.config);

      const [trainingResult, staffResult] = await Promise.all([getTrainingList(configResult.config, { includeInactive: true }), getStaffList(configResult.config)]);

      if (ignore) return;

      if (trainingResult.error) {
        setMessage(trainingResult.error);
        setMessageTone("error");
        return;
      }

      if (staffResult.error || !staffResult.data) {
        setMessage(staffResult.error || "교직원 명단을 불러오지 못했습니다.");
        setMessageTone("error");
        return;
      }

      setTrainings(trainingResult.data);
      setStaff(staffResult.data.staff);
      setSelectedTrainingId(trainingResult.data[0]?.trainingId ?? "");
      setMessage(trainingResult.data.length ? "교육을 선택하면 대상자 명단이 표시됩니다." : "등록된 교육이 없습니다.");
      setMessageTone("info");
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, []);

  const selectedTraining = trainings.find((training) => training.trainingId === selectedTrainingId);
  const completionMethod = completionMethodForTraining(selectedTraining);

  useEffect(() => {
    let ignore = false;

    async function loadTargets() {
      if (!runtimeConfig || !selectedTrainingId) {
        setDrafts({});
        return;
      }

      setMessage("교육대상 명단을 불러오는 중입니다.");
      setMessageTone("info");

      const result = await getTrainingTargets(runtimeConfig, selectedTrainingId);

      if (ignore) return;

      if (result.error || !result.data) {
        setDrafts({});
        setMessage(result.error || "교육대상 명단을 불러오지 못했습니다.");
        setMessageTone("error");
        return;
      }

      const nextDrafts: Record<string, TargetDraft> = {};
      result.data.targets.forEach((target) => {
        nextDrafts[target.staffId] = {
          isTarget: target.isTarget,
          required: target.required,
          certificateTarget: target.certificateTarget ?? completionMethod === "certificate-upload",
          note: target.note ?? ""
        };
      });
      setDrafts(nextDrafts);
      setMessage("교육대상 명단을 불러왔습니다.");
      setMessageTone("success");
    }

    void loadTargets();

    return () => {
      ignore = true;
    };
  }, [completionMethod, runtimeConfig, selectedTrainingId]);

  const departments = useMemo(() => Array.from(new Set(staff.map((item) => item.department).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ko")), [staff]);

  const filteredStaff = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return staff
      .filter((item) => {
        const haystack = [item.name, item.department, item.position].join(" ").toLowerCase();
        const departmentMatched = departmentFilter === "all" || item.department === departmentFilter;
        return departmentMatched && (!normalizedQuery || haystack.includes(normalizedQuery));
      })
      .sort((a, b) => a.department.localeCompare(b.department, "ko") || a.name.localeCompare(b.name, "ko"));
  }, [departmentFilter, query, staff]);

  const summary = useMemo(() => {
    const values = staff.map((item) => drafts[item.staffId] ?? emptyDraftFor(completionMethod));
    const targetCount = values.filter((item) => item.isTarget).length;
    const requiredCount = values.filter((item) => item.isTarget && item.required).length;
    const certificateCount = values.filter((item) => item.isTarget && item.certificateTarget).length;
    return { total: staff.length, targetCount, requiredCount, certificateCount };
  }, [completionMethod, drafts, staff]);

  function updateDraft(staffId: string, updates: Partial<TargetDraft>) {
    setDrafts((current) => ({
      ...current,
      [staffId]: {
        ...(current[staffId] ?? emptyDraftFor(completionMethod)),
        ...updates
      }
    }));
  }

  function applyVisibleTargets(isTarget: boolean) {
    setDrafts((current) => {
      const next = { ...current };
      filteredStaff.forEach((item) => {
        next[item.staffId] = {
          ...(next[item.staffId] ?? emptyDraftFor(completionMethod)),
          isTarget,
          required: isTarget ? true : next[item.staffId]?.required ?? true,
          certificateTarget: isTarget && completionMethod === "certificate-upload"
        };
      });
      return next;
    });
  }

  async function handleSave() {
    if (!runtimeConfig || !selectedTrainingId) {
      setMessage("저장할 교육을 먼저 선택해 주세요.");
      setMessageTone("error");
      return;
    }

    const targets: TrainingTargetsMutationItem[] = staff.map((item) => {
      const draft = drafts[item.staffId] ?? emptyDraftFor(completionMethod);
      return {
        staffId: item.staffId,
        isTarget: draft.isTarget,
        required: draft.required,
        certificateTarget: completionMethod === "certificate-upload" ? draft.isTarget && draft.certificateTarget : false,
        note: draft.note
      };
    });

    setSaving(true);
    setMessage("교육대상 명단을 저장하는 중입니다.");
    setMessageTone("info");

    const result = await updateTrainingTargets(runtimeConfig, selectedTrainingId, targets);
    setSaving(false);

    if (result.error || !result.data) {
      setMessage(result.error || "교육대상 명단을 저장하지 못했습니다.");
      setMessageTone("error");
      return;
    }

    const nextDrafts: Record<string, TargetDraft> = {};
    result.data.targets.forEach((target) => {
      nextDrafts[target.staffId] = {
        isTarget: target.isTarget,
        required: target.required,
        certificateTarget: target.certificateTarget ?? false,
        note: target.note ?? ""
      };
    });
    setDrafts(nextDrafts);
    setMessage(`교육대상 ${result.data.updatedCount}건을 저장했습니다.`);
    setMessageTone("success");
  }

  return (
    <AdminAuthGate>
      <main className="page">
        <div className="dashboard-shell">
          <div className="route-actions">
            <span className="page-toolbar-title">교육대상 관리</span>
            <a className="ghost-button" href={`${APP_BASE_PATH}/admin/`}>
              관리자 메뉴로
            </a>
            <a className="ghost-button" href={`${APP_BASE_PATH}/admin/trainings/`}>
              교육목록 관리
            </a>
            <AdminLogoutButton />
          </div>

          <section className="today-card" aria-label="교육대상 관리">
            <div className="today-copy">
              <div className="section-kicker">
                <PageIcon />
                <span>TARGET ADMIN</span>
              </div>
              <h1>교육별 대상자를 지정합니다.</h1>
              <p>교육목록과 교직원 명단을 직접 연결하지 않고 03_교육대상 탭을 기준으로 대상 여부를 관리합니다.</p>
            </div>
          </section>

          {message ? (
            <div className={messageTone === "error" ? "soft-alert danger" : messageTone === "success" ? "soft-alert success" : "soft-alert"} role="status">
              {message}
            </div>
          ) : null}

          <section className="training-section" aria-label="교육 선택">
            <div className="section-head">
              <div>
                <h2>교육 선택</h2>
                <p>{methodGuide(completionMethod)}</p>
              </div>
              <button className="primary-action" disabled={saving || !selectedTrainingId} onClick={() => void handleSave()} type="button">
                {saving ? "저장 중" : "교육대상 저장"}
              </button>
            </div>

            <div className="admin-attendance-controls">
              <label className="field-group">
                <span>교육</span>
                <select onChange={(event) => setSelectedTrainingId(event.target.value)} value={selectedTrainingId}>
                  {trainings.map((training) => (
                    <option key={training.trainingId} value={training.trainingId}>
                      {training.title || training.trainingId}
                    </option>
                  ))}
                </select>
              </label>
              <div className="badge-row">
                <span>{completionMethodLabel(completionMethod)}</span>
                <span>{selectedTraining?.date || "교육일자 미입력"}</span>
                <span>{selectedTraining?.department || "담당부서 미입력"}</span>
              </div>
            </div>
          </section>

          <section className="status-summary-grid" aria-label="교육대상 요약">
            <div className="status-summary-card">
              <span>교직원 수</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="status-summary-card">
              <span>대상자</span>
              <strong>{summary.targetCount}</strong>
            </div>
            <div className="status-summary-card">
              <span>필수 대상</span>
              <strong>{summary.requiredCount}</strong>
            </div>
            <div className="status-summary-card">
              <span>이수증 제출 대상</span>
              <strong>{summary.certificateCount}</strong>
            </div>
          </section>

          <section className="training-section" aria-label="대상자 목록">
            <div className="section-head">
              <div>
                <h2>대상자 목록</h2>
                <p>서명제외여부는 고급 옵션으로 숨기고, 대상여부와 이수증 제출 대상 여부만 관리합니다.</p>
              </div>
              <div className="route-actions">
                <button className="ghost-button compact" onClick={() => applyVisibleTargets(true)} type="button">
                  보이는 명단 대상 지정
                </button>
                <button className="ghost-button compact" onClick={() => applyVisibleTargets(false)} type="button">
                  보이는 명단 해제
                </button>
              </div>
            </div>

            <div className="admin-attendance-controls">
              <label className="field-group">
                <span>검색</span>
                <input onChange={(event) => setQuery(event.target.value)} placeholder="성명, 소속부서, 직위 검색" type="search" value={query} />
              </label>
              <label className="field-group">
                <span>부서</span>
                <select onChange={(event) => setDepartmentFilter(event.target.value)} value={departmentFilter}>
                  <option value="all">전체 부서</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {filteredStaff.length ? (
              <>
                <div className="admin-attendance-table-wrap">
                  <table className="admin-attendance-table staff-table">
                    <thead>
                      <tr>
                        <th>대상</th>
                        <th>성명</th>
                        <th>소속부서</th>
                        <th>직위</th>
                        <th>필수여부</th>
                        <th>이수증 제출 대상</th>
                        <th>비고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((item) => {
                        const draft = drafts[item.staffId] ?? emptyDraftFor(completionMethod);
                        return (
                          <tr key={item.staffId}>
                            <td>
                              <input checked={draft.isTarget} onChange={(event) => updateDraft(item.staffId, { isTarget: event.target.checked })} type="checkbox" />
                            </td>
                            <td>{item.name}</td>
                            <td>{item.department || "-"}</td>
                            <td>{item.position || "-"}</td>
                            <td>
                              <input checked={draft.required} disabled={!draft.isTarget} onChange={(event) => updateDraft(item.staffId, { required: event.target.checked })} type="checkbox" />
                            </td>
                            <td>
                              <input
                                checked={draft.certificateTarget}
                                disabled={!draft.isTarget || completionMethod !== "certificate-upload"}
                                onChange={(event) => updateDraft(item.staffId, { certificateTarget: event.target.checked })}
                                type="checkbox"
                              />
                            </td>
                            <td>
                              <input
                                aria-label={`${item.name} 비고`}
                                onChange={(event) => updateDraft(item.staffId, { note: event.target.value })}
                                placeholder="비고"
                                type="text"
                                value={draft.note}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="admin-attendance-cards">
                  {filteredStaff.map((item) => {
                    const draft = drafts[item.staffId] ?? emptyDraftFor(completionMethod);
                    return (
                      <article className="training-card status-card" key={item.staffId}>
                        <div className="status-card-head">
                          <div>
                            <strong>{item.name}</strong>
                            <p>{staffMeta(item) || item.staffId}</p>
                          </div>
                          <span className={draft.isTarget ? "status-chip status-completed" : "status-chip status-incomplete"}>{draft.isTarget ? "대상" : "대상 아님"}</span>
                        </div>
                        <label className="checkbox-row">
                          <input checked={draft.isTarget} onChange={(event) => updateDraft(item.staffId, { isTarget: event.target.checked })} type="checkbox" />
                          <span>교육대상</span>
                        </label>
                        <label className="checkbox-row">
                          <input checked={draft.required} disabled={!draft.isTarget} onChange={(event) => updateDraft(item.staffId, { required: event.target.checked })} type="checkbox" />
                          <span>필수 대상</span>
                        </label>
                        {completionMethod === "certificate-upload" ? (
                          <label className="checkbox-row">
                            <input
                              checked={draft.certificateTarget}
                              disabled={!draft.isTarget}
                              onChange={(event) => updateDraft(item.staffId, { certificateTarget: event.target.checked })}
                              type="checkbox"
                            />
                            <span>이수증 제출 대상</span>
                          </label>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="soft-alert" role="status">
                조건에 맞는 교직원이 없습니다.
              </div>
            )}
          </section>
        </div>
      </main>
    </AdminAuthGate>
  );
}
