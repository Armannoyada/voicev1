const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      "bypass-tunnel-reminder": "true",
      ...(init.headers ?? {}),
    },
    ...init,
  });

  let body: any = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const msg =
      (body && (body.message || body.error)) ||
      `request failed (${res.status})`;
    throw new ApiError(
      Array.isArray(msg) ? msg.join(", ") : String(msg),
      res.status,
    );
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
};

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Call {
  id: string;
  roomName: string;
  status:
    | "RINGING"
    | "ACCEPTED"
    | "DECLINED"
    | "MISSED"
    | "ENDED"
    | "CANCELED";
  callerId: string;
  calleeId: string;
  caller: User;
  callee: User;
  createdAt: string;
}

export interface CallTokenInfo {
  token: string;
  url: string;
  mode: string;
  roomName: string;
}

export interface Room {
  id: string;
  code: string;
  title: string;
  roomName: string;
  hostId: string;
  status: "ACTIVE" | "ENDED";
  host: User;
  createdAt: string;
  endedAt?: string | null;
}

export interface RoomJoinResponse {
  room: Room;
  token: string;
  url: string;
  mode: string;
}
