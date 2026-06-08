const BASE = "http://localhost:8000/api";

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("access_token");

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.clear();
    window.location.reload();
  }

  return res;
}

export function parseToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}