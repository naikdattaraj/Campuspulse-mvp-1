/**
 * One place that decides "mock or real backend".
 * NEXT_PUBLIC_USE_MOCK=true  -> every call is answered by its `mock` function.
 * NEXT_PUBLIC_USE_MOCK=false -> the call goes to the NestJS API.
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type Options<T> = { method?: "GET" | "POST"; body?: unknown; mock: () => T | Promise<T> };

export async function request<T>(path: string, opts: Options<T>): Promise<T> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200)); // feel like a real request
    return opts.mock();
  }

  let token: string | null = null;
  try {
    token = localStorage.getItem("cp_token");
    
  } catch {
    /* storage blocked */
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? "GET",
      headers: {
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check that the API is running and try again.");
  }

  if (!res.ok) {
    let message = `Something went wrong (${res.status}).`;
    try {
      const data = await res.json();
      message = Array.isArray(data.message) ? data.message[0] : data.message ?? message;
    } catch {
      /* keep default */
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}
