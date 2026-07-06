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
import type { AppConfig, Training } from "@/lib/types";
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";

const APP_BASE_PATH = getBasePath();

type TrainingFilter = "all" | "active" | "inactive" | "qr" | "signature" | "certificate";
type TrainingForm = {
  title: string;
  date: string;
  time: string;
  place: string;
  department: string;
  category: string;
  qrEnabled: boolean;
  signatureRequired: boolean;
  certificateRequired: boolean;
  status: string;
  note: string;
};

const FILTERS: Array<{ label: string; value: TrainingFilter }> = [
  { label: "전체", value: "all" },
  { label: "활성", value: "active" },
  { label: "종료/비활성", value: "inactive" },
  { label: "QR 사용", value: "qr" },
  { label: "서명 필요", value: "signature" },
  { label: "이수증 필요", value: "certificate" }
];

const emptyForm: TrainingForm = {
  title: "",
  date: "",
  time: "",
  place: "",
  department: "",
  category: "",
  qrEnabled: true,
  signatureRequired: false,
  certificateRequired: false,
  status: "활성",
  note: ""
};

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
  return normalized === "활성" || normalized === "active" || normalized === "y" || normalized === "yes" || normalized === "사용";
}

function statusChipClass(training: Training) {
  return isActiveTraining(training) ? "status-chip status-completed" : "status-chip status-incomplete";
}

function trainingMeta(training: Training) {
  return [training.date, training.time, training.place ?? training.location, training.department].filter(Boolean).join(" · ");
}

function formFromTraining(training: Training): TrainingForm {
  return {
    title: training.title ?? "",
    date: training.date ?? "",
    time: training.time ?? "",
    place: training.place ?? training.location ?? "",
    department: training.department ?? "",
    category: training.category ?? "",
    qrEnabled: Boolean(training.qrEnabled),
    signatureRequired: Boolean(training.signatureRequired),
    certificateRequired: Boolean(training.certificateRequired),
    status: training.status || training.activeStatus || "활성",
    note: training.note ?? ""
  };
}

function mutationFromForm(form: TrainingForm): TrainingMutation {
  return {
    title: form.title.trim(),
    date: form.date.trim(),
    time: form.time.trim(),
    place: form.place.trim(),
    location: form.place.trim(),
    department: form.department.trim(),
    category: form.category.trim(),
    qrEnabled: form.qrEnabled,
    signatureRequired: form.signatureRequired,
    certificateRequired: form.certificateRequired,
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

  if (filter === "qr") {
    return training.qrEnabled;
  }

  if (filter === "signature") {
    return training.signatureRequired;
  }

  if (filter === "certificate") {
    return Boolean(training.certificateRequired);
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
        const haystack = [training.title, training.department, training.category, training.status, training.activeStatus].join(" ").toLowerCase();
        return matchesFilter(training, filter) && (!normalizedQuery || haystack.includes(normalizedQuery));
      })
      .sort((a, b) => (a.date || "").localeCompare(b.date || "") || (a.title || a.trainingId).localeCompare(b.title || b.trainingId, "ko"));
  }, [filter, query, trainings]);

  const summary = useMemo(
    () => ({
      total: trainings.length,
      active: trainings.filter(isActiveTraining).length,
      qr: trainings.filter((training) => training.qrEnabled).length,
      signature: trainings.filter((training) => training.signatureRequired).length,
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
              <p>Google Sheet를 직접 열지 않아도 교육 일정, QR 출석, 전자서명, 이수증 제출 필요 여부를 안전하게 수정합니다.</p>
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
              <span>QR 사용</span>
              <strong>{summary.qr}</strong>
            </div>
            <div className="status-summary-card">
              <span>서명/이수증</span>
              <strong>{summary.signature + summary.certificate}</strong>
            </div>
          </section>

          <div className={panelOpen ? "staff-management-layout panel-open" : "staff-management-layout"}>
            <section className="training-section" aria-label="교육 목록">
              <div className="section-head">
                <div>
                  <h2>교육 목록</h2>
                  <p>교육명, 담당부서, 교육구분, 활성상태로 검색하고 필요한 설정을 바로 변경합니다.</p>
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
                          <th>설정</th>
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
                                <span>{training.qrEnabled ? "QR" : "QR 없음"}</span>
                                <span>{training.signatureRequired ? "서명" : "서명 없음"}</span>
                                <span>{training.certificateRequired ? "이수증" : "이수증 없음"}</span>
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
                          <span>{training.qrEnabled ? "QR 사용" : "QR 미사용"}</span>
                          <span>{training.signatureRequired ? "전자서명 필요" : "전자서명 없음"}</span>
                          <span>{training.certificateRequired ? "이수증 제출 필요" : "이수증 제출 없음"}</span>
                        </div>
                        <div className="route-actions">
                          <button className="ghost-button compact" onClick={() => openEditPanel(training)} type="button">
                            수정
                          </button>
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
                    <p>저장하면 Apps Script를 통해 01_교육목록 탭에 기록됩니다.</p>
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

                  <div className="training-card">
                    <label className="checkbox-row">
                      <input checked={form.qrEnabled} name="qrEnabled" onChange={handleChange} type="checkbox" />
                      <span>QR사용여부</span>
                    </label>
                    <label className="checkbox-row">
                      <input checked={form.signatureRequired} name="signatureRequired" onChange={handleChange} type="checkbox" />
                      <span>전자서명필요여부</span>
                    </label>
                    <label className="checkbox-row">
                      <input checked={form.certificateRequired} name="certificateRequired" onChange={handleChange} type="checkbox" />
                      <span>이수증제출필요여부</span>
                    </label>
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
