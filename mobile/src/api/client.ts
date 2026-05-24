import { API_BASE_URL } from "../config/api";

type QueryValue = string | number | boolean | null | undefined;
type QueryParams = Record<string, QueryValue>;

type ApiRequestOptions = RequestInit & {
  params?: QueryParams;
  token?: string | null;
};

let accessToken: string | null = null;

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function setApiToken(token: string | null) {
  accessToken = token;
}

export function withQuery(path: string, params?: QueryParams) {
  if (!params) {
    return path;
  }

  const search = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");

  if (!search) {
    return path;
  }

  return `${path}${path.includes("?") ? "&" : "?"}${search}`;
}

function getErrorMessage(details: unknown, fallback: string) {
  if (details && typeof details === "object" && "detail" in details) {
    const detail = (details as { detail?: unknown }).detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (item && typeof item === "object" && "msg" in item) {
            return String((item as { msg: unknown }).msg);
          }
          return String(item);
        })
        .join("\n");
    }
  }

  return fallback;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const { params, headers, token, ...requestOptions } = options;
  const bodyIsForm = typeof FormData !== "undefined" && requestOptions.body instanceof FormData;
  const url = `${API_BASE_URL}${withQuery(path, params)}`;

  const response = await fetch(url, {
    ...requestOptions,
    headers: {
      Accept: "application/json",
      ...(bodyIsForm ? {} : { "Content-Type": "application/json" }),
      ...(accessToken || token ? { Authorization: `Bearer ${token || accessToken}` } : {}),
      ...headers,
    },
  });

  const raw = await response.text();
  const data = raw ? JSON.parse(raw) : null;

  if (!response.ok) {
    throw new ApiError(getErrorMessage(data, "Request failed"), response.status, data);
  }

  return data as T;
}
