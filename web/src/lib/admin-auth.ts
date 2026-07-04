const ADMIN_SESSION_KEY = "school-health-hub-admin-verified";

export function isAdminSessionVerified() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function markAdminSessionVerified() {
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
  }
}

export function clearAdminSession() {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}
