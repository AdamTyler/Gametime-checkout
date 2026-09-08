import { Platform } from 'react-native';
import type {
  ApiErrorBody,
  ApiErrorCode,
  ConfirmIntentRequest,
  CreateIntentRequest,
  PaymentIntent,
} from './contract';

const HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const BASE_URL = `http://${HOST}:4000/v1`;
const TIMEOUT = 8000;

export class ApiError extends Error {
  constructor(
    public outcomeUnknown: boolean,
    public code: ApiErrorCode | null,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<Response & { data: T }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  let res: Response;
  try {
    res = await fetch(BASE_URL + path, {
      ...init,
      signal: controller.signal,
      headers: { 'content-type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError(true, null, controller.signal.aborted ? 'timed out' : 'network error');
  } finally {
    clearTimeout(timer);
  }

  const data = await res.json();
  console.log('--- API data rx: ', data);
  if (!res.ok) {
    console.log('--- API res not ok');
    const body = data as ApiErrorBody;
    // 5xx: the server broke mid-request. It may have written. Unknown, not rejected.
    throw new ApiError(res.status >= 500, body.error?.code ?? null, body.error?.message ?? res.statusText);
  }
  return Object.assign(res, { data: data as T });
}

export const api = {
  createIntent: (body: CreateIntentRequest, idempotencyKey: string) =>
    request<PaymentIntent>('/payment-intents', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'idempotency-key': idempotencyKey },
    }).then((r) => r.data),

  confirmIntent: (id: string, body: ConfirmIntentRequest) =>
    request<PaymentIntent>(`/payment-intents/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(body),
    }).then((r) => ({ intent: r.data, pending: r.status === 202 })),

  getIntent: (id: string) => request<PaymentIntent>(`/payment-intents/${id}`).then((r) => r.data),
};