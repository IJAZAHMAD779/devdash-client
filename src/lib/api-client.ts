/**
 * Centralized API Client for DevDash
 * Communicates with decoupled Express backend on Render/Localhost.
 * Automatically injects Clerk Bearer tokens and handles Render cold-start detection.
 */

export function getApiBaseUrl(): string {
  // Always use the verified Render production backend on non-localhost hosts (such as Vercel)
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://devdash-api-gf3p.onrender.com/api/v1";
  }

  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.includes("devdash-api-gf3p.onrender.com")) {
    return envUrl;
  }

  return "http://localhost:5000/api/v1";
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

// Global Cold-Start event dispatcher for ADR 004
function notifyColdStart(isWarming: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("devdash:cold-start", { detail: { isWarming } })
    );
  }
}

export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    let clerk = (window as any).Clerk;
    // If Clerk or session is still hydrating, wait up to 3 seconds
    if (!clerk || !clerk.session) {
      for (let i = 0; i < 30; i++) {
        await new Promise((r) => setTimeout(r, 100));
        clerk = (window as any).Clerk;
        if (clerk?.session) break;
      }
    }

    if (clerk?.session) {
      const token = await clerk.session.getToken();
      if (token) return token;
    }
  } catch (err) {
    console.warn("[AuthToken] Error obtaining Clerk token:", err);
  }

  // Development fallback token if Clerk keys are placeholders in local dev
  if (
    process.env.NODE_ENV === "development" ||
    (typeof window !== "undefined" && window.location.hostname === "localhost")
  ) {
    return "dev_user_token";
  }

  return null;
}

interface FetchOptions extends RequestInit {
  token?: string | null;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const token = options.token ?? (await getAuthToken());

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  // Cold start timer (trigger banner if request exceeds 2.5s)
  let coldStartTriggered = false;
  const timer = setTimeout(() => {
    coldStartTriggered = true;
    notifyColdStart(true);
  }, 2500);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    clearTimeout(timer);
    if (coldStartTriggered) {
      notifyColdStart(false);
    }

    const json: ApiResponse<T> = await res.json().catch(() => ({
      success: false,
      data: null as any,
      error: {
        code: "PARSE_ERROR",
        message: "Failed to parse JSON response from server",
      },
    }));

    if (!res.ok || !json.success) {
      const errorMsg =
        json.error?.message || `Request failed with status ${res.status}`;
      const err: any = new Error(errorMsg);
      err.code = json.error?.code || "HTTP_ERROR";
      err.status = res.status;
      err.details = json.error?.details;
      throw err;
    }

    return json.data;
  } catch (error: any) {
    clearTimeout(timer);
    if (coldStartTriggered) {
      notifyColdStart(false);
    }
    throw error;
  }
}

export const apiClient = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "GET" }),
  post: <T>(endpoint: string, body?: any, options?: FetchOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(endpoint: string, body?: any, options?: FetchOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: any, options?: FetchOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string, options?: FetchOptions) =>
    apiRequest<T>(endpoint, { ...options, method: "DELETE" }),
};
