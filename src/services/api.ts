// services/api.ts
// Centralised API client for the frontend.
// All backend communication goes through here.

const SDP_SERVICE_URL =
  import.meta.env.VITE_SDP_SERVICE_URL ?? 'http://localhost:8080';
const AI_GATEWAY_URL =
  import.meta.env.VITE_AI_GATEWAY_URL ?? 'http://localhost:3002';
const FILES_SVC_URL =
  import.meta.env.VITE_FILES_SVC_URL ??
  'http://api.taaheel.sumerge.com/files-svc';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** Login response from sdp-service HRSD API. */
export interface LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  employeeId: number;
  nationalId: string;
  mobileNumber: string;
  employeeType: string;
  employeeName: string;
  employeeStatus: string;
  emailAddress: string;
  workLocation: number;
  workLocationName: string;
  actualDepartment: string;
  serviceYears: number;
  rank: string;
  title: string;
  gender: string;
  nationality: string;
  extension: string;
  mobile: string;
  address: string;
  department: string;
  classification: string;
  addressId: number;
}

/** User profile stored in the frontend after login. */
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
  // Extended fields from HRSD login
  accessToken?: string;
  refreshToken?: string;
  employeeId?: number;
  nationalId?: string;
  mobileNumber?: string;
  employeeType?: string;
  emailAddress?: string;
  workLocation?: number;
  workLocationName?: string;
  actualDepartment?: string;
  serviceYears?: number;
  rank?: string;
  title?: string;
  gender?: string;
  nationality?: string;
  department?: string;
}

/** Matches the ChatMessage shape used by the ai-gateway. */
export interface ChatMessageDto {
  role: 'system' | 'user' | 'assistant' | 'tool';
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
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
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

export async function login(
  userId: string,
  password: string,
): Promise<UserProfile> {
  const res = await fetch(`${SDP_SERVICE_URL}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: userId, password }),
  });
  const data = await handleResponse<LoginResponseDto>(res);

  // Map the HRSD login response to UserProfile
  return {
    id: userId || data.nationalId, // Use nationalId as id, fallback to supplied userId
    name: data.employeeName,
    disabled: false, // Not provided in HRSD response, default to false
    role: data.employeeType === 'Internal' ? 'GENERAL' : 'GENERAL', // Map employeeType to role
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    employeeId: data.employeeId,
    nationalId: data.nationalId,
    mobileNumber: data.mobileNumber,
    employeeType: data.employeeType,
    emailAddress: data.emailAddress,
    workLocation: data.workLocation,
    workLocationName: data.workLocationName,
    actualDepartment: data.actualDepartment,
    serviceYears: data.serviceYears,
    rank: data.rank,
    title: data.title,
    gender: data.gender,
    nationality: data.nationality,
    department: data.department,
  };
}

/* ------------------------------------------------------------------ */
/*  File Upload (via files-svc)                                       */
/* ------------------------------------------------------------------ */

export async function uploadFile(file: File): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${FILES_SVC_URL}/upload`, {
    method: 'POST',
    headers: {
      'X-Bypass-Interceptor': 'true',
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
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
