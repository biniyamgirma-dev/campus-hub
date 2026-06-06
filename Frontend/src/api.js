const BASE_URL = "https://campus-hub-s2kw.onrender.com";

export default BASE_URL;

export async function apiFetch(path, options = {}) {
  localStorage.setItem("access_token", data.access);

  const res = await fetch(`${BASE_URL}${path}`, {
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

