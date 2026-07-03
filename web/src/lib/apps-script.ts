import type { AppConfig, AppsScriptEnvelope, SchoolConfig, Training } from "@/lib/types";

export const DEFAULT_CONFIG: SchoolConfig = {
  schoolName: "학교명 미설정",
  centerName: "학교 교직원 교육센터",
  schoolLogoUrl: "",
  primaryColor: "#1F2A44",
  secondaryColor: "#EEF4FF",
  privacyNotice: "전자서명과 출석 기록은 연수 증빙용으로 학교 Google Sheet와 Google Drive에 저장됩니다."
};

export type AppsScriptAction = "getSchoolConfig" | "getTrainingList";

export type RuntimeConfigResult =
  | {
      ok: true;
      config: AppConfig;
      schoolConfig: SchoolConfig;
    }
  | {
      ok: false;
      schoolConfig: SchoolConfig;
      message: string;
    };

const APP_CONFIG_PATH = "app-config.json";

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function mergeSchoolConfig(data: Partial<SchoolConfig>): SchoolConfig {
  return {
    ...DEFAULT_CONFIG,
    ...Object.fromEntries(
      Object.entries(data).filter(([, value]) => (typeof value === "string" ? value.trim().length > 0 : value !== undefined))
    )
  };
}

function themeToColors(theme: AppConfig["theme"]): Pick<SchoolConfig, "primaryColor" | "secondaryColor"> {
  if (!theme || theme === "default") {
    return {
      primaryColor: DEFAULT_CONFIG.primaryColor,
      secondaryColor: DEFAULT_CONFIG.secondaryColor
    };
  }

  return {
    primaryColor: nonEmptyString(theme.primaryColor) ? theme.primaryColor.trim() : DEFAULT_CONFIG.primaryColor,
    secondaryColor: nonEmptyString(theme.secondaryColor) ? theme.secondaryColor.trim() : DEFAULT_CONFIG.secondaryColor
  };
}

function schoolConfigFromAppConfig(config: Partial<AppConfig>): SchoolConfig {
  const themeColors = themeToColors(config.theme);

  return mergeSchoolConfig({
    schoolName: config.schoolName,
    centerName: config.centerName,
    schoolLogoUrl: config.schoolLogo,
    primaryColor: themeColors.primaryColor,
    secondaryColor: themeColors.secondaryColor
  });
}

function schoolConfigOverridesFromAppConfig(config: AppConfig): Partial<SchoolConfig> {
  const themeColors = themeToColors(config.theme);
  const overrides: Partial<SchoolConfig> = {
    primaryColor: themeColors.primaryColor,
    secondaryColor: themeColors.secondaryColor
  };

  if (nonEmptyString(config.schoolName)) {
    overrides.schoolName = config.schoolName.trim();
  }

  if (nonEmptyString(config.centerName)) {
    overrides.centerName = config.centerName.trim();
  }

  if (nonEmptyString(config.schoolLogo)) {
    overrides.schoolLogoUrl = config.schoolLogo.trim();
  }

  return overrides;
}

export async function loadAppConfig(): Promise<RuntimeConfigResult> {
  if (typeof window === "undefined") {
    return {
      ok: false,
      schoolConfig: DEFAULT_CONFIG,
      message: "브라우저에서 app-config.json을 다시 불러와 주세요."
    };
  }

  try {
    const response = await fetch(APP_CONFIG_PATH, { cache: "no-store" });

    if (!response.ok) {
      return {
        ok: false,
        schoolConfig: DEFAULT_CONFIG,
        message: "app-config.json 파일을 찾을 수 없습니다. app-config.example.json을 복사해 학교 설정을 입력해 주세요."
      };
    }

    const config = (await response.json()) as AppConfig;
    const schoolConfig = schoolConfigFromAppConfig(config);

    if (!nonEmptyString(config.appsScriptUrl)) {
      return {
        ok: false,
        schoolConfig,
        message: "app-config.json의 appsScriptUrl 값을 입력해 주세요."
      };
    }

    return {
      ok: true,
      config: {
        ...config,
        appsScriptUrl: config.appsScriptUrl.trim()
      },
      schoolConfig
    };
  } catch {
    return {
      ok: false,
      schoolConfig: DEFAULT_CONFIG,
      message: "app-config.json을 읽을 수 없습니다. JSON 형식과 배포 위치를 확인해 주세요."
    };
  }
}

async function requestAppsScript<T>(config: AppConfig, action: AppsScriptAction): Promise<T> {
  const response = await fetch(config.appsScriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify({ action }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("학교 데이터를 불러오지 못했습니다.");
  }

  const payload = (await response.json()) as AppsScriptEnvelope<T> | T;

  if (typeof payload === "object" && payload && "ok" in payload && payload.ok === false) {
    throw new Error(payload.message ?? payload.error ?? "학교 데이터를 불러오지 못했습니다.");
  }

  if (typeof payload === "object" && payload && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export async function getSchoolConfig(config: AppConfig): Promise<{ data: SchoolConfig; error?: string }> {
  try {
    const data = await requestAppsScript<Partial<SchoolConfig>>(config, "getSchoolConfig");
    return { data: mergeSchoolConfig({ ...data, ...schoolConfigOverridesFromAppConfig(config) }) };
  } catch (error) {
    return {
      data: schoolConfigFromAppConfig(config),
      error: error instanceof Error ? error.message : "학교설정을 불러오지 못했습니다."
    };
  }
}

export async function getTrainingList(config: AppConfig): Promise<{ data: Training[]; error?: string }> {
  try {
    const payload = await requestAppsScript<{ trainings?: Training[] } | Training[]>(config, "getTrainingList");
    const trainings = Array.isArray(payload) ? payload : payload.trainings ?? [];
    return { data: trainings };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error.message : "교육목록을 불러오지 못했습니다."
    };
  }
}
