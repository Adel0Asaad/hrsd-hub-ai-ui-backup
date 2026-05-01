// services/api.ts
// Centralised API client for the frontend.
// All backend communication goes through here.

const SDP_SERVICE_URL = import.meta.env.VITE_SDP_SERVICE_URL ?? "http://localhost:8080";
const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL ?? "http://localhost:3002";
const FILES_SVC_URL = import.meta.env.VITE_FILES_SVC_URL ?? "http://api.taaheel.sumerge.com/files-svc";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** Matches the UserResponse DTO from sdp-service. */
export interface UserProfile {
  id: string;
  name: string;
  disabled: boolean;
  /**
   * Coarse-grained persona role (e.g. "DISABILITY", "ELDERLY", "GENERAL").
   * The frontend echoes this back on `/chat`; the ai-gateway owns all
   * prompt policy and maps role → system-prompt server-side. Prompt
   * text is never sent to or received from the client.
   */
  role: string;
}

/** Matches the ChatMessage shape used by the ai-gateway. */
export interface ChatMessageDto {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
}

export interface ChatResponse {
  conversationId?: string;
  text: string;
  history: ChatMessageDto[];
  toolsUsed: { name: string; durationMs: number }[];
  /**
   * Opaque chat history from Cohere (OCI provider only).
   * Frontend should echo this back in the next request.
   */
  cohereChatHistory?: { role: string; message?: string; toolResults?: [] }[];
}

export interface FileUploadResponse {
  id: number;
  fileId: string;
  name: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  fileUuid: string | null;
}

/* ------------------------------------------------------------------ */
/*  Error handling                                                    */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message: string;
    try {
      const parsed = JSON.parse(body);
      message = parsed?.error?.message ?? parsed?.message ?? body;
    } catch {
      message = body || `Request failed with status ${res.status}`;
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  SDP Service (login)                                               */
/* ------------------------------------------------------------------ */

export async function login(userId: string, password: string): Promise<UserProfile> {
  const res = await fetch(`${SDP_SERVICE_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, password }),
  });
  return handleResponse<UserProfile>(res);
}

/* ------------------------------------------------------------------ */
/*  File Upload (via files-svc)                                       */
/* ------------------------------------------------------------------ */

export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${FILES_SVC_URL}/upload`, {
    method: "POST",
    headers: {
      "X-Bypass-Interceptor": "true",
    },
    body: formData,
  });

  return handleResponse<FileUploadResponse>(res);
}

/* ------------------------------------------------------------------ */
/*  AI Gateway (chat)                                                 */
/* ------------------------------------------------------------------ */

export async function sendMessage(
  message: string,
  role: string | undefined,
  history: ChatMessageDto[],
  conversationId?: string,
  userId?: string,
  fileIds?: string[],
  cohereChatHistory?: { role: string; message: string }[],
): Promise<ChatResponse> {
  const res = await fetch(`${AI_GATEWAY_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      role,
      history,
      conversationId,
      userId,
      fileIds,
      cohereChatHistory,
    }),
  });
  return handleResponse<ChatResponse>(res);
}
