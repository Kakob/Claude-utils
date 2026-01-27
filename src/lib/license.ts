// HMAC-SHA256 license validation
// License format: base64(payload).base64(signature)
// Payload: { email: string, tier: 'pro', issuedAt: number, expiresAt?: number }

export interface LicensePayload {
  email: string;
  tier: 'pro';
  issuedAt: number;
  expiresAt?: number;
}

export interface LicenseResult {
  valid: boolean;
  payload?: LicensePayload;
  error?: string;
}

const LICENSE_SECRET = import.meta.env.VITE_LICENSE_SECRET || '';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return arrayBufferToBase64(signature);
}

export function isLicenseExpired(payload: LicensePayload): boolean {
  if (!payload.expiresAt) {
    return false;
  }
  return Date.now() > payload.expiresAt;
}

export async function validateLicense(key: string): Promise<LicenseResult> {
  if (!key || !key.trim()) {
    return { valid: false, error: 'License key is required' };
  }

  if (!LICENSE_SECRET) {
    return { valid: false, error: 'License validation not configured' };
  }

  const parts = key.trim().split('.');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid license format' };
  }

  const [payloadBase64, signatureBase64] = parts;

  let payload: LicensePayload;
  try {
    const payloadJson = atob(payloadBase64);
    payload = JSON.parse(payloadJson);
  } catch {
    return { valid: false, error: 'Invalid license format' };
  }

  // Validate payload structure
  if (!payload.email || payload.tier !== 'pro' || !payload.issuedAt) {
    return { valid: false, error: 'Invalid license data' };
  }

  // Verify signature
  try {
    const expectedSignature = await generateSignature(payloadBase64, LICENSE_SECRET);
    if (expectedSignature !== signatureBase64) {
      return { valid: false, error: 'Invalid license key' };
    }
  } catch {
    return { valid: false, error: 'License verification failed' };
  }

  // Check expiration
  if (isLicenseExpired(payload)) {
    return { valid: false, payload, error: 'License has expired' };
  }

  return { valid: true, payload };
}
