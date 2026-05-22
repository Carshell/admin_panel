import { clearToken, getToken } from "./auth.js";

const apiBase = import.meta.env.VITE_API_URL || "/api";

function authHeaders() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function parseError(res, errBody) {
  if (res.status === 401 && getToken()) {
    clearToken();
    window.location.reload();
    return "Session expired. Please log in again.";
  }
  if (res.status === 401) {
    return "Invalid login or password";
  }
  const detail = errBody.detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
  if (typeof detail === "string") return detail;
  return `Request failed (${res.status})`;
}

export async function fetchJson(path) {
  const res = await fetch(`${apiBase}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseError(res, err));
  }
  return res.json();
}

export async function postJson(path, body, { auth = true } = {}) {
  const headers = auth ? authHeaders() : { "Content-Type": "application/json" };
  const res = await fetch(`${apiBase}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseError(res, err));
  }
  return res.json();
}

export async function loginRequest(login, password) {
  return postJson(
    "/auth/login",
    { login, password },
    { auth: false }
  );
}

async function requestJson(method, path, body) {
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseError(res, err));
  }
  if (res.status === 204) return null;
  return res.json();
}

export function putJson(path, body) {
  return requestJson("PUT", path, body);
}

export function deleteJson(path) {
  return requestJson("DELETE", path);
}
