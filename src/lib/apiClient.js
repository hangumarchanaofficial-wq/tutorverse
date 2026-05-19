import { supabase } from "./supabaseClient";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : "");

const ADMIN_BYPASS =
  String(process.env.REACT_APP_ADMIN_BYPASS || "").toLowerCase() === "true";

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]);
}

async function getAccessToken() {
  if (ADMIN_BYPASS) return null;

  try {
    const { data } = await withTimeout(supabase.auth.getSession(), 4000, "Auth session");
    return data?.session?.access_token || null;
  } catch {
    return null;
  }
}

export async function apiFetch(path, options = {}) {
  if (!API_BASE) {
    throw new Error(
      "REACT_APP_API_BASE_URL is not configured. Set it in Amplify environment variables."
    );
  }

  const token = await getAccessToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await withTimeout(
    fetch(`${API_BASE}${path}`, { ...options, headers }),
    15000,
    "API request"
  );

  if (!response.ok) {
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return response.json();
  return response.blob();
}
