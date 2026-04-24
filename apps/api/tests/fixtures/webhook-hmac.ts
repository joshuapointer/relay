import { createHmac } from 'crypto';

export const DEFAULT_WEBHOOK_SECRET = 'test-secret-local';

/**
 * Signs a webhook payload using HMAC-SHA256 in the EasyPost format.
 * Returns the value to set as the X-Hmac-Signature header.
 */
export function signWebhook(
  payload: string | Buffer,
  secret: string = DEFAULT_WEBHOOK_SECRET
): string {
  const body = typeof payload === 'string' ? payload : payload.toString('utf-8');
  const hmac = createHmac('sha256', secret);
  hmac.update(body);
  return `hmac-sha256-hex=${hmac.digest('hex')}`;
}

/**
 * Verifies an HMAC-SHA256 signature (mirrors server verification logic).
 */
export function verifyWebhook(
  payload: string | Buffer,
  signature: string,
  secret: string = DEFAULT_WEBHOOK_SECRET
): boolean {
  const expected = signWebhook(payload, secret);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}
