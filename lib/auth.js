// Stateless signed session cookie using Web Crypto (works in both the
// Node runtime and Next's Edge middleware runtime, so one implementation
// covers both API routes and middleware.js).

export const SESSION_COOKIE = "sharpen_session";
const SESSION_DAYS = 30;

function getSecret() {
  const secret = process.env.APP_SECRET;
  if (!secret) {
    throw new Error("APP_SECRET is not set. See .env.example.");
  }
  return secret;
}

async function hmacKey() {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const str = atob(b64);
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i);
  return bytes;
}

export async function createSessionToken() {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = JSON.stringify({ exp });
  const payloadB64 = toBase64Url(new TextEncoder().encode(payload));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64));
  const sigB64 = toBase64Url(new Uint8Array(sig));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(token) {
  if (!token || !token.includes(".")) return false;
  const [payloadB64, sigB64] = token.split(".");
  try {
    const key = await hmacKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      fromBase64Url(sigB64),
      new TextEncoder().encode(payloadB64)
    );
    if (!valid) return false;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function checkPin(candidate) {
  const pin = process.env.APP_PIN;
  if (!pin) throw new Error("APP_PIN is not set. See .env.example.");
  return candidate === pin;
}
