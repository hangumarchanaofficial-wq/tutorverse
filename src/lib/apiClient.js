import { supabase } from "./supabaseClient";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : "");

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
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

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

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
