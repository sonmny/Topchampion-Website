import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API_BASE });

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("tc_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 → wipe token and force back to login
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 401) {
      const onAdminRoute = window.location.pathname.startsWith("/admin");
      localStorage.removeItem("tc_token");
      if (onAdminRoute && window.location.pathname !== "/admin/login") {
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(err);
  }
);

export function formatApiError(err, fallback = "Request failed") {
  const d = err?.response?.data?.detail;
  if (!d) return err?.message || fallback;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((e) => e?.msg || JSON.stringify(e)).join("; ");
  if (d?.msg) return d.msg;
  return fallback;
}
