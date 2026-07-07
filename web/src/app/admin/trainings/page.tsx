"use client";

import { AdminAuthGate, AdminLogoutButton } from "@/components/admin-auth-gate";
import {
  createTraining,
  getTrainingList,
  loadAppConfig,
  updateTraining,
  updateTrainingStatus,
  type TrainingMutation
} from "@/lib/apps-script";
import { getBasePath } from "@/lib/paths";
import type { AppConfig, CompletionMethod, Training } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

const APP_BASE_PATH = getBasePath();

type TrainingFilter = "all" | "active" | "inactive" | "qr-signature" | "certificate" | "admin-check";
type TrainingForm = {
  title: string;
  date: string;
  time: string;
  place: string;
  department: string;
  category: string;
  completionMethod: CompletionMethod;
  status: string;
  note: string;
};

const FILTERS: Array<{ label: string; value: TrainingFilter }> = [
  { label: "전체", value: "all" },
  { label: "활성", value: "active" },
  { label: "종료/비활성", value: "inactive" },
  { label: "현장 QR 서명", value: "qr-signature" },
  { label: "이수증 업로드", value: "certificate" },
  { label: "관리자 확인", value: "admin-check" }
];

const emptyForm: TrainingForm = {
  title: "",
  date: "",
  time: "",
  place: "",
  department: "",
  category: "",
  completionMethod: "qr-signature",
  status: "활성",
  note: ""
};

const COMPLETION_METHODS: Array<{ value: CompletionMethod; label: string; description: string }> = [
  {
    value: "qr-signature",
    label: "현장 QR 서명",
    description: "교육장에서 QR을 스캔하고 전자서명을 제출하면 이수완료로 처리합니다."
  },
  {
    value: "certificate-upload",
    label: "이수증 업로드",
    description: "교직원이 외부 이수증을 제출하고 담당자가 확인합니다."
  },
  {
    value: "admin-check",
    label: "관리자 확인",
    description: "담당자가 별도 확인 후 이수 상태를 정리하는 교육입니다."
  }
];

function PageIcon() {
  return (
    <svg aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.85" viewBox="0 0 24 24">
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}

function isActiveTraining(training: Training) {
  const normalized = (training.status ?? training.activeStatus ?? "").trim().toLowerCase();
  return ["활성", "진행중", "준비중", "active", "ready", "y", "yes", "사용"].includes(normalized);
}

function statusChipClass(training: Training) {
  return isActiveTraining(training) ? "status-chip status-completed" : "status-chip status-incomplete";
}

function trainingMeta(training: Training) {
  return [training.date, training.time, training.place ?? training.location, training.department].filter(Boolean).join(" · ");
}

function completionMethodForTraining(training: Training): CompletionMethod {
  if (training.certificateRequired) {
    return "certificate-upload";
  }

  if (training.qrEnabled) {
    return "qr-signature";
  }

  return "admin-check";
}

function completionMethodLabel(method: CompletionMethod) {
  return COMPLETION_METHODS.find((item) => item.value === method)?.label ?? "관리자 확인";
}

function completionMethodDescription(method: CompletionMethod) {
  return COMPLETION_METHODS.find((item) => item.value === method)?.description ?? "";
}

function formFromTraining(training: Training): TrainingForm {
  const completionMethod = completionMethodForTraining(training);

  return {
    title: training.title ?? "",
    date: training.date ?? "",
    time: training.time ?? "",
    place: training.place ?? training.location ?? "",
    department: training.department ?? "",
    category: training.category ?? "",
    completionMethod,
    status: training.status || training.activeStatus || "활성",
    note: training.note ?? ""
  };
}

function mutationFromForm(form: TrainingForm): TrainingMutation {
  const isQrSignature = form.completionMethod === "qr-signature";
  const isCertificateUpload = form.completionMethod === "certificate-upload";

  return {
    title: form.title.trim(),
    date: form.date.trim(),
    time: form.time.trim(),
    place: form.place.trim(),
    location: form.place.trim(),
    department: form.department.trim(),
    category: form.category.trim(),
    qrEnabled: isQrSignature,
    signatureRequired: isQrSignature,
    certificateRequired: isCertificateUpload,
    status: form.status.trim(),
    activeStatus: form.status.trim(),
    note: form.note.trim()
  };
}

function matchesFilter(training: Training, filter: TrainingFilter) {
  if (filter === "active") {
    return isActiveTraining(training);
  }

  if (filter === "inactive") {
    return !isActiveTraining(training);
  }

  if (filter === "qr-signature") {
    return completionMethodForTraining(training) === "qr-signature";
  }

  if (filter === "certificate") {
    return completionMethodForTraining(training) === "certificate-upload";
  }

  if (filter === "admin-check") {
    return completionMethodForTraining(training) === "admin-check";
  }

  return true;
}

export default function AdminTrainingsPage() {
  const [runtimeConfig, setRuntimeConfig] = useState<AppConfig>();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TrainingFilter>("all");
  const [editingTrainingId, setEditingTrainingId] = useState<string>();
  const [form, setForm] = useState<TrainingForm>(emptyForm);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("교육목록을 불러오는 중입니다.");
  const [messageTone, setMessageTone] = useState<"info" | "success" | "error">("info");

  const refreshTrainings = useCallback(async (config: AppConfig) => {
    const result = await getTrainingList(config, { includeInactive: true });

    if (result.error) {
      setMessage(result.error);
      setMessageTone("error");
      return;
    }

    setTrainings(result.data);
    setMessage("교육목록을 불러왔습니다.");
    setMessageTone("success");
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadPage() {
      const configResult = await loadAppConfig();

      if (ignore) {
        return;
      }

      if (!configResult.ok) {
        setMessage(configResult.message);
        setMessageTone("error");
        return;
      }

      setRuntimeConfig(configResult.config);
      await refreshTrainings(configResult.config);
    }

    void loadPage();

    return () => {
      ignore = true;
    };
  }, [refreshTrainings]);

  const filteredTrainings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return trainings
      .filter((training) => {
        const haystack = [training.title, training.department, training.category, completionMethodLabel(completionMethodForTraining(training)), training.status, training.activeStatus]
          .join(" ")
          .toLowerCase();
        return matchesFilter(training, filter) && (!normalizedQuery || haystack.includes(normalizedQuery));
      })
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.title || a.trainingId).localeCompare(b.title || b.trainingId, "ko"));
  }, [filter, query, trainings]);

  const summary = useMemo(
    () => ({
      total: trainings.length,
      active: trainings.filter(isActiveTraining).length,
      qrSignature: trainings.filter((training) => completionMethodForTraining(training) === "qr-signature").length,
      certificate: trainings.filter((training) => training.certificateRequired).length
    }),
    [trainings]
  );

  function openCreatePanel() {
    setEditingTrainingId(undefined);
    setForm(emptyForm);
    setPanelOpen(true);
  }

  function openEditPanel(training: Training) {
    setEditingTrainingId(training.trainingId);
    setForm(formFromTraining(training));
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setEditingTrainingId(undefined);
    setForm(emptyForm);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const target = event.target;
    const value = target instanceof HTMLInputElement && target.type === "checkbox" ? target.checked : target.value;
    setForm((current) => ({
      ...current,
      [target.name]: value
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!runtimeConfig) {
      setMessage("app-config.json의 Apps Script URL을 먼저 확인해 주세요.");
      setMessageTone("error");
      return;
    }

    if (!form.title.trim()) {
      setMessage("교육명을 입력해 주세요.");
      setMessageTone("error");
      return;
    }

    setSaving(true);
    setMessage(editingTrainingId ? "교육 정보를 저장하는 중입니다." : "교육을 추가하는 중입니다.");
    setMessageTone("info");

    const payload = mutationFromForm(form);
    const result = editingTrainingId ? await updateTraining(runtimeConfig, editingTrainingId, payload) : await createTraining(runtimeConfig, payload);
    setSaving(false);

    if (result.error || !result.data) {
      setMessage(result.error || "교육 정보를 저장하지 못했습니다.");
      setMessageTone("error");
      return;
    }

    await refreshTrainings(runtimeConfig);
    closePanel();
    setMessage(editingTrainingId ? "교육 정보를 저장했습니다." : "교육을 추가했습니다.");
    setMessageTone("success");
  }

  async function handleStatusToggle(training: Training) {
    if (!runtimeConfig) {
      setMessage("app-config.json의 Apps Script URL을 먼저 확인해 주세요.");
      setMessageTone("error");
      return;
    }

    const nextStatus = isActiveTraining(training) ? "비활성" : "활성";
    setSaving(true);
    setMessage(`교육 상태를 ${nextStatus}(으)로 변경하는 중입니다.`);
    setMessageTone("info");

    const result = await updateTrainingStatus(runtimeConfig, training.trainingId, nextStatus);
    setSaving(false);

    if (result.error || !result.data) {
      setMessage(result.error || "교육 상태를 변경하지 못했습니다.");
      setMessageTone("error");
      return;
    }

    await refreshTrainings(runtimeConfig);
    setMessage(`교육 상태를 ${nextStatus}(으)로 변경했습니다.`);
    setMessageTone("success");
  }

  return (
    <AdminAuthGate>
      <main className="page">
        <div className="dashboard-shell">
          <div className="route-actions">
            <span className="page-toolbar-title">교육목록 관리</span>
            <a className="ghost-button" href={`${APP_BASE_PATH}/admin/`}>
              관리자 메뉴로
            </a>
            <a className="ghost-button" href={`${APP_BASE_PATH}/`}>
              홈으로
            </a>
            <AdminLogoutButton />
          </div>

          <section className="today-card" aria-label="교육목록 관리">
            <div className="today-copy">
              <div className="section-kicker">
                <PageIcon />
                <span>TRAINING ADMIN</span>
              </div>
              <h1>교육목록을 등록하고 운영 상태를 관리합니다.</h1>
              <p>교육의 이수방식을 정하면 기존 Sheet 컬럼에 맞춰 현장 QR 서명, 이수증 업로드, 관리자 확인 방식으로 저장합니다.</p>
            </div>
          </section>

          {message ? (
            <div className={messageTone === "error" ? "soft-alert danger" : messageTone === "success" ? "soft-alert success" : "soft-alert"} role="status">
              {message}
            </div>
          ) : null}

          <section className="status-summary-grid" aria-label="교육목록 요약">
            <div className="status-summary-card">
              <span>전체 교육</span>
              <strong>{summary.total}</strong>
            </div>
            <div className="status-summary-card">
              <span>활성 교육</span>
              <strong>{summary.active}</strong>
            </div>
            <div className="status-summary-card">
              <span>현장 QR 서명</span>
              <strong>{summary.qrSignature}</strong>
            </div>
            <div className="status-summary-card">
              <span>이수증 업로드</span>
              <strong>{summary.certificate}</strong>
            </div>
          </section>

          <div className={panelOpen ? "staff-management-layout panel-open" : "staff-management-layout"}>
            <section className="training-section" aria-label="교육 목록">
              <div className="section-head">
                <div>
                  <h2>교육 목록</h2>
                  <p>교육명, 담당부서, 교육구분, 이수방식으로 검색하고 필요한 설정을 바로 변경합니다.</p>
                </div>
                <button className="primary-action" onClick={openCreatePanel} type="button">
                  교육 추가
                </button>
              </div>

              <div className="admin-attendance-controls">
                <label className="field-group">
                  <span>검색</span>
                  <input onChange={(event) => setQuery(event.target.value)} placeholder="교육명, 담당부서, 교육구분 검색" type="search" value={query} />
                </label>
                <div className="filter-pills" aria-label="교육 필터">
                  {FILTERS.map((item) => (
                    <button className={item.value === filter ? "filter-pill active" : "filter-pill"} key={item.value} onClick={() => setFilter(item.value)} type="button">
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTrainings.length ? (
                <>
                  <div className="admin-attendance-table-wrap">
                    <table className="admin-attendance-table staff-table">
                      <thead>
                        <tr>
                          <th>교육ID</th>
                          <th>교육명</th>
                          <th>교육일자</th>
                          <th>교육시간</th>
                          <th>장소</th>
                          <th>담당부서</th>
                          <th>교육구분</th>
                          <th>이수방식</th>
                          <th>활성상태</th>
                          <th>관리</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTrainings.map((training) => (
                          <tr key={training.trainingId}>
                            <td>{training.trainingId}</td>
                            <td>{training.title || "-"}</td>
                            <td>{training.date || "-"}</td>
                            <td>{training.time || "-"}</td>
                            <td>{training.place || training.location || "-"}</td>
                            <td>{training.department || "-"}</td>
                            <td>{training.category || "-"}</td>
                            <td>
                              <div className="badge-row">
                                <span>{completionMethodLabel(completionMethodForTraining(training))}</span>
                                {completionMethodForTraining(training) === "qr-signature" ? <span>05_전자서명기록 기준</span> : null}
                              </div>
                            </td>
                            <td>
                              <span className={statusChipClass(training)}>{training.status || training.activeStatus || "-"}</span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button className="ghost-button compact" onClick={() => openEditPanel(training)} type="button">
                                  수정
                                </button>
                                <a className="ghost-button compact" href={`${APP_BASE_PATH}/admin/targets/`}>
                                  대상 지정
                                </a>
                                {completionMethodForTraining(training) === "qr-signature" ? (
                                  <a className="ghost-button compact" href={`${APP_BASE_PATH}/admin/qr/`}>
                                    QR 출력
                                  </a>
                                ) : null}
                                <button className="ghost-button compact" disabled={saving} onClick={() => void handleStatusToggle(training)} type="button">
                                  {isActiveTraining(training) ? "비활성" : "활성"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="admin-attendance-cards">
                    {filteredTrainings.map((training) => (
                      <article className="training-card status-card" key={training.trainingId}>
                        <div className="status-card-head">
                          <div>
                            <strong>{training.title || "-"}</strong>
                            <p>{trainingMeta(training) || training.trainingId}</p>
                          </div>
                          <span className={statusChipClass(training)}>{training.status || training.activeStatus || "-"}</span>
                        </div>
                        <div className="badge-row">
                          <span>{training.trainingId}</span>
                          <span>{training.category || "교육구분 미입력"}</span>
                          <span>{completionMethodLabel(completionMethodForTraining(training))}</span>
                          {completionMethodForTraining(training) === "qr-signature" ? <span>QR 출력 가능</span> : null}
                        </div>
                        <div className="route-actions">
                          <button className="ghost-button compact" onClick={() => openEditPanel(training)} type="button">
                            수정
                          </button>
                          <a className="ghost-button compact" href={`${APP_BASE_PATH}/admin/targets/`}>
                            대상 지정
                          </a>
                          {completionMethodForTraining(training) === "qr-signature" ? (
                            <a className="ghost-button compact" href={`${APP_BASE_PATH}/admin/qr/`}>
                              QR 출력
                            </a>
                          ) : null}
                          <button className="ghost-button compact" disabled={saving} onClick={() => void handleStatusToggle(training)} type="button">
                            {isActiveTraining(training) ? "비활성으로 변경" : "활성으로 변경"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : (
                <div className="soft-alert" role="status">
                  검색 또는 필터 조건에 맞는 교육이 없습니다.
                </div>
              )}
            </section>

            {panelOpen ? (
              <aside className="staff-editor-panel" aria-label={editingTrainingId ? "교육 수정" : "교육 추가"}>
                <div className="section-head">
                  <div>
                    <h2>{editingTrainingId ? "교육 수정" : "교육 추가"}</h2>
                    <p>저장하면 Apps Script를 통해 01_교육목록 탭에 기록됩니다. 현장 QR 서명은 전자서명 출석으로 자동 처리됩니다.</p>
                  </div>
                </div>

                <form className="attendance-form" onSubmit={handleSubmit}>
                  <label className="field-group">
                    <span>교육명</span>
                    <input name="title" onChange={handleChange} type="text" value={form.title} />
                  </label>
                  <label className="field-group">
                    <span>교육일자</span>
                    <input name="date" onChange={handleChange} type="date" value={form.date} />
                  </label>
                  <label className="field-group">
                    <span>교육시간</span>
                    <input name="time" onChange={handleChange} placeholder="15:30-17:30" type="text" value={form.time} />
                  </label>
                  <label className="field-group">
                    <span>장소</span>
                    <input name="place" onChange={handleChange} type="text" value={form.place} />
                  </label>
                  <label className="field-group">
                    <span>담당부서</span>
                    <input name="department" onChange={handleChange} type="text" value={form.department} />
                  </label>
                  <label className="field-group">
                    <span>교육구분</span>
                    <input name="category" onChange={handleChange} type="text" value={form.category} />
                  </label>
                  <label className="field-group">
                    <span>활성상태</span>
                    <select name="status" onChange={handleChange} value={form.status}>
                      <option value="활성">활성</option>
                      <option value="준비중">준비중</option>
                      <option value="종료">종료</option>
                      <option value="비활성">비활성</option>
                    </select>
                  </label>

                  <label className="field-group">
                    <span>이수방식</span>
                    <select name="completionMethod" onChange={handleChange} value={form.completionMethod}>
                      {COMPLETION_METHODS.map((method) => (
                        <option key={method.value} value={method.value}>
                          {method.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="training-card">
                    <strong>{completionMethodLabel(form.completionMethod)}</strong>
                    <p>{completionMethodDescription(form.completionMethod)}</p>
                    {form.completionMethod === "qr-signature" ? (
                      <div className="badge-row">
                        <span>현장 QR 서명</span>
                        <span>QR 출력 가능</span>
                        <span>서명부 생성 대상</span>
                        <span>05_전자서명기록 기준</span>
                      </div>
                    ) : null}
                    {form.completionMethod === "certificate-upload" ? (
                      <div className="badge-row">
                        <span>이수증 업로드</span>
                        <span>06_이수증업로드 기준</span>
                      </div>
                    ) : null}
                  </div>

                  <label className="field-group">
                    <span>비고</span>
                    <textarea name="note" onChange={handleChange} rows={4} value={form.note} />
                  </label>

                  <div className="route-actions">
                    <button className="primary-action" disabled={saving} type="submit">
                      {saving ? "저장 중" : "저장"}
                    </button>
                    <button className="ghost-button" onClick={closePanel} type="button">
                      닫기
                    </button>
                  </div>
                </form>
              </aside>
            ) : null}
          </div>
        </div>
      </main>
    </AdminAuthGate>
  );
}
