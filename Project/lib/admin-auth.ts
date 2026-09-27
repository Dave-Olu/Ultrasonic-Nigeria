import { promises as fs } from 'fs';
import path from 'path';
import { createHash, createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(nodeScrypt);
const AUTH_FILE = path.join(process.cwd(), 'data', 'admin-auth.json');
const EMAIL_LOGIN_TOKEN_FILE = path.join(process.cwd(), 'data', 'admin-email-login-token.json');
const SESSION_COOKIE = 'admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const EMAIL_LOGIN_TOKEN_MAX_AGE = 10 * 60 * 1000;

type EmailLoginTokenRecord = {
  email: string;
  tokenHash: string;
  expiresAt: number;
};

let emailLoginRequests: number[] = [];
let developmentSessionSecret: string | undefined;

type AdminRecord = {
  email: string;
  salt: string;
  passwordHash: string;
};

type SessionPayload = {
  email: string;
  expiresAt: number;
};

function sessionSecret() {
  const configuredSecret = process.env.ADMIN_SESSION_SECRET;
  if (configuredSecret) {
    if (process.env.NODE_ENV === 'production' && Buffer.byteLength(configuredSecret, 'utf8') < 32) {
      throw new Error('ADMIN_SESSION_SECRET must be at least 32 bytes in production.');
    }
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_SESSION_SECRET must be configured in production.');
  }

  developmentSessionSecret ??= randomBytes(32).toString('base64url');
  return developmentSessionSecret;
}

async function readAdmin() {
  try {
    return JSON.parse(await fs.readFile(AUTH_FILE, 'utf8')) as AdminRecord;
  } catch {
    return null;
  }
}

async function hashPassword(password: string, salt: string) {
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return derivedKey.toString('hex');
}

export async function hasAdmin() {
  return Boolean(await readAdmin());
}

export async function createAdmin(email: string, password: string) {
  if (await hasAdmin()) {
    throw new Error('An admin account already exists.');
  }

  const salt = randomBytes(16).toString('hex');
  const passwordHash = await hashPassword(password, salt);
  const record: AdminRecord = { email, salt, passwordHash };

  await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true });
  await fs.writeFile(AUTH_FILE, JSON.stringify(record, null, 2), 'utf8');
}

export async function verifyAdmin(email: string, password: string) {
  const admin = await readAdmin();
  if (!admin || admin.email !== email) return false;

  const expected = Buffer.from(admin.passwordHash, 'hex');
  const actual = Buffer.from(await hashPassword(password, admin.salt), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function changeAdminPassword(email: string, currentPassword: string, newPassword: string) {
  if (!(await verifyAdmin(email, currentPassword))) return false;

  const salt = randomBytes(16).toString('hex');
  const passwordHash = await hashPassword(newPassword, salt);
  await fs.writeFile(AUTH_FILE, JSON.stringify({ email, salt, passwordHash }, null, 2), 'utf8');
  return true;
}

export async function createAdminEmailLoginToken() {
  const admin = await readAdmin();
  if (!admin) return { status: 'no-admin' as const };

  const now = Date.now();
  emailLoginRequests = emailLoginRequests.filter((timestamp) => timestamp > now - 60 * 60 * 1000);
  if (emailLoginRequests.length >= 5 || (emailLoginRequests.at(-1) ?? 0) > now - 60 * 1000) {
    return { status: 'rate-limited' as const };
  }
  emailLoginRequests.push(now);

  const token = randomBytes(32).toString('base64url');
  const record: EmailLoginTokenRecord = {
    email: admin.email,
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt: now + EMAIL_LOGIN_TOKEN_MAX_AGE,
  };
  await fs.mkdir(path.dirname(EMAIL_LOGIN_TOKEN_FILE), { recursive: true });
  const temporaryPath = `${EMAIL_LOGIN_TOKEN_FILE}.${randomBytes(8).toString('hex')}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(record), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  await fs.rename(temporaryPath, EMAIL_LOGIN_TOKEN_FILE);

  return { status: 'created' as const, email: admin.email, token };
}

export async function consumeAdminEmailLoginToken(token: string) {
  if (!token || token.length > 200) return null;

  let stored: EmailLoginTokenRecord;
  try {
    stored = JSON.parse(await fs.readFile(EMAIL_LOGIN_TOKEN_FILE, 'utf8')) as EmailLoginTokenRecord;
  } catch {
    return null;
  }

  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expected = Buffer.from(stored.tokenHash, 'hex');
  const actual = Buffer.from(tokenHash, 'hex');
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual) || stored.expiresAt <= Date.now()) {
    return null;
  }

  const claimedPath = `${EMAIL_LOGIN_TOKEN_FILE}.${randomBytes(8).toString('hex')}.used`;
  try {
    await fs.rename(EMAIL_LOGIN_TOKEN_FILE, claimedPath);
  } catch {
    return null;
  }

  try {
    const claimed = JSON.parse(await fs.readFile(claimedPath, 'utf8')) as EmailLoginTokenRecord;
    const claimedHash = Buffer.from(claimed.tokenHash, 'hex');
    if (claimed.expiresAt <= Date.now() || claimedHash.length !== actual.length || !timingSafeEqual(claimedHash, actual)) {
      return null;
    }
    return claimed.email;
  } catch {
    return null;
  } finally {
    await fs.unlink(claimedPath).catch(() => undefined);
  }
}

export function createSession(email: string) {
  const payload: SessionPayload = { email, expiresAt: Date.now() + SESSION_MAX_AGE * 1000 };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', sessionSecret()).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function readSession(token: string | undefined) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = createHmac('sha256', sessionSecret()).update(encodedPayload).digest('base64url');
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as SessionPayload;
    return payload.expiresAt > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_MAX_AGE };