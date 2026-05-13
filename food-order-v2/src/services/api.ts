import axios from "axios";

// Token getter is set by the Auth0 provider bridge (vendor/admin flows only)
let getTokenFn: (() => Promise<string>) | null = null;

export function setTokenGetter(fn: () => Promise<string>) {
  getTokenFn = fn;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  if (getTokenFn) {
    try {
      const token = await getTokenFn();
      config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // unauthenticated request — proceed without token
    }
  }
  return config;
});

// Prisma serialises Decimal fields as strings in JSON.
// Coerce known numeric fields to numbers on every response so components can
// call .toFixed() and do arithmetic without wrapping every usage in Number().
const DECIMAL_FIELDS = new Set(["price", "unitPrice", "totalAmount"]);
function coerceDecimals(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(coerceDecimals);
  if (value !== null && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k,
        DECIMAL_FIELDS.has(k) && typeof v === "string"
          ? parseFloat(v)
          : coerceDecimals(v),
      ]),
    );
  }
  return value;
}

api.interceptors.response.use((response) => {
  response.data = coerceDecimals(response.data);
  return response;
});

export default api;
