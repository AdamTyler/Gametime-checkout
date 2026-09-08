import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import type {
  ApiErrorCode,
  ConfirmIntentRequest,
  CreateIntentRequest,
  PaymentIntent,
} from '../src/api/contract.ts';

const PORT = 4000;
const LATENCY_MS = 400;

const intents = new Map<string, PaymentIntent>();
const idempotencyKeys = new Map<string, string>(); // key -> intent id

class HttpError extends Error {
  status: number;
  code: ApiErrorCode;
  constructor(status: number, code: ApiErrorCode, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const app = express();
app.use(express.json());
app.use(async (req, res, next) => {
  res.on('finish', () => console.log(`${req.method} ${req.url} -> ${res.statusCode}`));
  await sleep(LATENCY_MS);
  next();
});

app.post('/v1/payment-intents', (req, res) => {
  const key = req.header('idempotency-key');
  if (!key) throw new HttpError(400, 'invalid_request', 'idempotency-key header required');

  const existingId = idempotencyKeys.get(key);
  if (existingId) {
    const existing = intents.get(existingId)!;
    if (existing.amountCents !== req.body.amountCents) {
      throw new HttpError(409, 'idempotency_key_reuse', 'key already used with a different amount');
    }
    res.status(200).json(existing);
    return;
  }

  const { orderId, method, amountCents } = req.body as CreateIntentRequest;
  const intent: PaymentIntent = {
    id: `pi_${randomUUID()}`,
    orderId,
    method,
    amountCents,
    status: 'requires_authorization',
    declineCode: null,
    receiptId: null,
  };
  intents.set(intent.id, intent);
  idempotencyKeys.set(key, intent.id);
  res.status(201).json(intent);
});

app.post('/v1/payment-intents/:id/confirm', async (req, res) => {
  const intent = intents.get(req.params.id);
  if (!intent) throw new HttpError(404, 'not_found', 'no such intent');

  // Replay-safe: if we already settled this, just say so.
  if (intent.status !== 'requires_authorization') {
    res.status(intent.status === 'processing' ? 202 : 200).json(intent);
    return;
  }

  const { amountCents, authorization } = req.body as ConfirmIntentRequest;
  if (amountCents !== intent.amountCents) {
    throw new HttpError(409, 'amount_mismatch', 'cart changed since intent was created');
  }

  intent.status = 'processing';
  await sleep(LATENCY_MS); // the window a force-quit lands in

  if (authorization.token.includes('decline')) {
    intent.status = 'declined';
    intent.declineCode = 'do_not_honor';
  } else {
    intent.status = 'succeeded';
    intent.receiptId = `rcpt_${randomUUID()}`;
  }
  res.json(intent);
});

app.get('/v1/payment-intents/:id', (req, res) => {
  const intent = intents.get(req.params.id);
  if (!intent) throw new HttpError(404, 'not_found', 'no such intent');
  res.json(intent);
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'invalid_request', message: 'server error' } });
});

app.listen(PORT, () => console.log(`mock payments on :${PORT}`));