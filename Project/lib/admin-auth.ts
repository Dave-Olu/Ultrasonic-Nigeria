import { mkdirSync, readFileSync, writeFileSync, promises as fs } from 'fs';
import path from 'path';
import { createHash, createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { neon } from '@neondatabase/serverless';

const scrypt = promisify(nodeScrypt);
const AUTH_FILE = path.join(process.cwd(), 'data', 'admin-auth.json');
const EMAIL_LOGIN_TOKEN_FILE = path.join(process.cwd(), 'data', 'admin-email-login-token.json');
const DEVELOPMENT_SESSION_SECRET_FILE = path.join(process.cwd(), 'data', 'admin-session-secret');
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
let databaseSchema: Promise<void> | undefined;

type AdminRecord = {
  email: string;
  salt: string;
  passwordHash: string;
};

type SessionPayload = {
  email: string;
  expiresAt: number;
};

const isProduction = process.env.NODE_ENV === 'production';

function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) return neon(connectionString);
  if (isProduction) {
    throw new Error('DATABASE_URL must be configured in production.');
  }
  return null;
}

function ensureDatabaseSchema() {
  if (!databaseSchema) {
    const sql = getDatabase();
    if (!sql) throw new Error('DATABASE_URL must be configured to initialize the production auth database.');
    databaseSchema = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS admin_auth (
          id SMALLINT PRIMARY KEY CHECK (id = 1),
          email TEXT NOT NULL,
          salt TEXT NOT NULL,
          password_hash TEXT NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS admin_email_login_tokens (
          token_hash TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL
        )
      `;
    })().catch((error: unknown) => {
      databaseSchema = undefined;
      throw error;
    });
  }
  return databaseSchema;
}

function sessionSecret() {
  const configuredSecret = process.env.ADMIN_SESSION_SECRET;
  if (configuredSecret) {
    if (isProduction && Buffer.byteLength(configuredSecret, 'utf8') < 32) {
      throw new Error('ADMIN_SESSION_SECRET must be at least 32 bytes in production.');
    }
    return configuredSecret;
  }

  if (isProduction) {
    throw new Error('ADMIN_SESSION_SECRET must be configured in production.');
  }

  if (developmentSessionSecret) return developmentSessionSecret;

  try {
    developmentSessionSecret = readFileSync(DEVELOPMENT_SESSION_SECRET_FILE, 'utf8').trim();
    if (developmentSessionSecret) return developmentSessionSecret;
  } catch {}

  mkdirSync(path.dirname(DEVELOPMENT_SESSION_SECRET_FILE), { recursive: true });
  const generatedSecret = randomBytes(32).toString('base64url');
  try {
    writeFileSync(DEVELOPMENT_SESSION_SECRET_FILE, generatedSecret, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    developmentSessionSecret = generatedSecret;
  } catch {
    try {
      developmentSessionSecret = readFileSync(DEVELOPMENT_SESSION_SECRET_FILE, 'utf8').trim();
    } catch {
      developmentSessionSecret = generatedSecret;
    }
  }
  return developmentSessionSecret;
}

async function readAdmin() {
  const sql = getDatabase();
  if (sql) {
    await ensureDatabaseSchema();
    const rows = await sql`SELECT email, salt, password_hash AS "passwordHash" FROM admin_auth WHERE id = 1`;
    const admin = (rows[0] as AdminRecord | undefined)?? null;
    return admin;
  }

  // Local dev only - file fallback
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
  const salt = randomBytes(16).toString('hex');
  const passwordHash = await hashPassword(password, salt);
  const record: AdminRecord = { email, salt, passwordHash };
  const sql = getDatabase();

  if (sql) {
    await ensureDatabaseSchema();
    const rows = await sql`
      INSERT INTO admin_auth (id, email, salt, password_hash)
      VALUES (1, ${record.email}, ${record.salt}, ${record.passwordHash})
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;
    if (rows.length === 0) throw new Error('An admin account already exists.');
    return;
  }

  if (await hasAdmin()) throw new Error('An admin account already exists.');
  await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true });
  await fs.writeFile(AUTH_FILE, JSON.stringify(record, null, 2), 'utf8');
}

export async function verifyAdmin(email: string, password: string) {
  const admin = await readAdmin();
  if (!admin || admin.email.toLowerCase()!== email.toLowerCase()) return false;
  const expected = Buffer.from(admin.passwordHash, 'hex');
  const actual = Buffer.from(await hashPassword(password, admin.salt), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function changeAdminPassword(email: string, currentPassword: string, newPassword: string) {
  if (!(await verifyAdmin(email, currentPassword))) return false;
  const salt = randomBytes(16).toString('hex');
  const passwordHash = await hashPassword(newPassword, salt);
  const sql = getDatabase();
  if (sql) {
    await ensureDatabaseSchema();
    const rows = await sql`
      UPDATE admin_auth SET salt = ${salt}, password_hash = ${passwordHash}
      WHERE id = 1 AND email = ${email}
      RETURNING id
    `;
    return rows.length > 0;
  }
  await fs.writeFile(AUTH_FILE, JSON.stringify({ email, salt, passwordHash }, null, 2), 'utf8');
  return true;
}

export async function createAdminEmailLoginToken() {
  const admin = await readAdmin();
  if (!admin) return { status: 'no-admin' as const };

  const now = Date.now();
  emailLoginRequests = emailLoginRequests.filter((timestamp) => timestamp > now - 60 * 60 * 1000);
  if (emailLoginRequests.length >= 5 || (emailLoginRequests.at(-1)?? 0) > now - 60 * 1000) {
    return { status: 'rate-limited' as const };
  }
  emailLoginRequests.push(now);

  const token = randomBytes(32).toString('base64url');
  const record: EmailLoginTokenRecord = {
    email: admin.email,
    tokenHash: createHash('sha256').update(token).digest('hex'),
    expiresAt: now + EMAIL_LOGIN_TOKEN_MAX_AGE,
  };
  const sql = getDatabase();
  if (sql) {
    await ensureDatabaseSchema();
    await sql`DELETE FROM admin_email_login_tokens WHERE expires_at <= NOW()`;
    await sql`
      INSERT INTO admin_email_login_tokens (token_hash, email, expires_at)
      VALUES (${record.tokenHash}, ${record.email}, ${new Date(record.expiresAt)})
    `;
    return { status: 'created' as const, email: admin.email, token };
  }

  await fs.mkdir(path.dirname(EMAIL_LOGIN_TOKEN_FILE), { recursive: true });
  const temporaryPath = `${EMAIL_LOGIN_TOKEN_FILE}.${randomBytes(8).toString('hex')}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(record), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
  await fs.rename(temporaryPath, EMAIL_LOGIN_TOKEN_FILE);
  return { status: 'created' as const, email: admin.email, token };
}

export async function consumeAdminEmailLoginToken(token: string) {
  if (!token || token.length > 200) return null;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const sql = getDatabase();
  if (sql) {
    await ensureDatabaseSchema();
    const rows = await sql`
      DELETE FROM admin_email_login_tokens
      WHERE token_hash = ${tokenHash} AND expires_at > NOW()
      RETURNING email
    `;
    return typeof rows[0]?.email === 'string'? rows[0].email : null;
  }

  let stored: EmailLoginTokenRecord;
  try {
    stored = JSON.parse(await fs.readFile(EMAIL_LOGIN_TOKEN_FILE, 'utf8')) as EmailLoginTokenRecord;
  } catch {
    return null;
  }
  const expected = Buffer.from(stored.tokenHash, 'hex');
  const actual = Buffer.from(tokenHash, 'hex');
  if (expected.length!== actual.length ||!timingSafeEqual(expected, actual) || stored.expiresAt <= Date.now()) {
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
    if (claimed.expiresAt <= Date.now() || claimedHash.length!== actual.length ||!timingSafeEqual(claimedHash, actual)) {
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
  if (!encodedPayload ||!signature) return null;
  const expectedSignature = createHmac('sha256', sessionSecret()).update(encodedPayload).digest('base64url');
  const expected = Buffer.from(expectedSignature);
  const actual = Buffer.from(signature);
  if (expected.length!== actual.length ||!timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as SessionPayload;
    return payload.expiresAt > Date.now()? payload : null;
  } catch {
    return null;
  }
}

export { SESSION_COOKIE, SESSION_MAX_AGE };


// import { mkdirSync, readFileSync, writeFileSync, promises as fs } from 'fs';
// import path from 'path';
// import { createHash, createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'crypto';
// import { promisify } from 'util';
// import { neon } from '@neondatabase/serverless';

// const scrypt = promisify(nodeScrypt);
// const AUTH_FILE = path.join(process.cwd(), 'data', 'admin-auth.json');
// const EMAIL_LOGIN_TOKEN_FILE = path.join(process.cwd(), 'data', 'admin-email-login-token.json');
// const DEVELOPMENT_SESSION_SECRET_FILE = path.join(process.cwd(), 'data', 'admin-session-secret');
// const SESSION_COOKIE = 'admin_session';
// const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
// const EMAIL_LOGIN_TOKEN_MAX_AGE = 10 * 60 * 1000;

// type EmailLoginTokenRecord = {
//   email: string;
//   tokenHash: string;
//   expiresAt: number;
// };

// let emailLoginRequests: number[] = [];
// let developmentSessionSecret: string | undefined;
// let databaseSchema: Promise<void> | undefined;

// type AdminRecord = {
//   email: string;
//   salt: string;
//   passwordHash: string;
// };

// type SessionPayload = {
//   email: string;
//   expiresAt: number;
// };

// function getDatabase() {
//   const connectionString = process.env.DATABASE_URL;
//   if (connectionString) return neon(connectionString);
//   if (process.env.NODE_ENV === 'production') {
//     throw new Error('DATABASE_URL must be configured in production.');
//   }
//   return null;
// }

// function ensureDatabaseSchema() {
//   if (!databaseSchema) {
//     const sql = getDatabase();
//     if (!sql) throw new Error('DATABASE_URL must be configured to initialize the production auth database.');
//     databaseSchema = (async () => {
//       await sql`
//         CREATE TABLE IF NOT EXISTS admin_auth (
//           id SMALLINT PRIMARY KEY CHECK (id = 1),
//           email TEXT NOT NULL,
//           salt TEXT NOT NULL,
//           password_hash TEXT NOT NULL
//         )
//       `;
//       await sql`
//         CREATE TABLE IF NOT EXISTS admin_email_login_tokens (
//           token_hash TEXT PRIMARY KEY,
//           email TEXT NOT NULL,
//           expires_at TIMESTAMPTZ NOT NULL
//         )
//       `;
//     })().catch((error: unknown) => {
//       databaseSchema = undefined;
//       throw error;
//     });
//   }
//   return databaseSchema;
// }

// function sessionSecret() {
//   const configuredSecret = process.env.ADMIN_SESSION_SECRET;
//   if (configuredSecret) {
//     if (process.env.NODE_ENV === 'production' && Buffer.byteLength(configuredSecret, 'utf8') < 32) {
//       throw new Error('ADMIN_SESSION_SECRET must be at least 32 bytes in production.');
//     }
//     return configuredSecret;
//   }

//   if (process.env.NODE_ENV === 'production') {
//     throw new Error('ADMIN_SESSION_SECRET must be configured in production.');
//   }

//   if (developmentSessionSecret) return developmentSessionSecret;

//   try {
//     developmentSessionSecret = readFileSync(DEVELOPMENT_SESSION_SECRET_FILE, 'utf8').trim();
//     if (developmentSessionSecret) return developmentSessionSecret;
//   } catch {}

//   mkdirSync(path.dirname(DEVELOPMENT_SESSION_SECRET_FILE), { recursive: true });
//   const generatedSecret = randomBytes(32).toString('base64url');
//   try {
//     writeFileSync(DEVELOPMENT_SESSION_SECRET_FILE, generatedSecret, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
//     developmentSessionSecret = generatedSecret;
//   } catch {
//     developmentSessionSecret = readFileSync(DEVELOPMENT_SESSION_SECRET_FILE, 'utf8').trim();
//   }
//   return developmentSessionSecret;
// }

// async function readAdmin() {
//   const sql = getDatabase();
//   if (sql) {
//     await ensureDatabaseSchema();
//     const rows = await sql`SELECT email, salt, password_hash AS "passwordHash" FROM admin_auth WHERE id = 1`;
//     const admin = (rows[0] as AdminRecord | undefined) ?? null;
//     if (admin) return admin;

//     // If database table is empty, auto-migrate from local auth file if available
//     try {
//       const localAdmin = JSON.parse(await fs.readFile(AUTH_FILE, 'utf8')) as AdminRecord;
//       if (localAdmin?.email && localAdmin?.salt && localAdmin?.passwordHash) {
//         await sql`
//           INSERT INTO admin_auth (id, email, salt, password_hash)
//           VALUES (1, ${localAdmin.email}, ${localAdmin.salt}, ${localAdmin.passwordHash})
//           ON CONFLICT (id) DO NOTHING
//         `;
//         return localAdmin;
//       }
//     } catch {
//       // Local auth file does not exist or cannot be read
//     }
//     return null;
//   }

//   try {
//     return JSON.parse(await fs.readFile(AUTH_FILE, 'utf8')) as AdminRecord;
//   } catch {
//     return null;
//   }
// }

// async function hashPassword(password: string, salt: string) {
//   const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
//   return derivedKey.toString('hex');
// }

// export async function hasAdmin() {
//   return Boolean(await readAdmin());
// }

// export async function createAdmin(email: string, password: string) {
//   const salt = randomBytes(16).toString('hex');
//   const passwordHash = await hashPassword(password, salt);
//   const record: AdminRecord = { email, salt, passwordHash };
//   const sql = getDatabase();

//   if (sql) {
//     await ensureDatabaseSchema();
//     const rows = await sql`
//       INSERT INTO admin_auth (id, email, salt, password_hash)
//       VALUES (1, ${record.email}, ${record.salt}, ${record.passwordHash})
//       ON CONFLICT (id) DO NOTHING
//       RETURNING id
//     `;
//     if (rows.length === 0) throw new Error('An admin account already exists.');
//     try {
//       await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true });
//       await fs.writeFile(AUTH_FILE, JSON.stringify(record, null, 2), 'utf8');
//     } catch {}
//     return;
//   }

//   if (await hasAdmin()) throw new Error('An admin account already exists.');

//   await fs.mkdir(path.dirname(AUTH_FILE), { recursive: true });
//   await fs.writeFile(AUTH_FILE, JSON.stringify(record, null, 2), 'utf8');
// }

// export async function verifyAdmin(email: string, password: string) {
//   const admin = await readAdmin();
//   if (!admin || admin.email.toLowerCase() !== email.toLowerCase()) return false;

//   const expected = Buffer.from(admin.passwordHash, 'hex');
//   const actual = Buffer.from(await hashPassword(password, admin.salt), 'hex');
//   return expected.length === actual.length && timingSafeEqual(expected, actual);
// }

// export async function changeAdminPassword(email: string, currentPassword: string, newPassword: string) {
//   if (!(await verifyAdmin(email, currentPassword))) return false;

//   const salt = randomBytes(16).toString('hex');
//   const passwordHash = await hashPassword(newPassword, salt);
//   const sql = getDatabase();
//   if (sql) {
//     await ensureDatabaseSchema();
//     const rows = await sql`
//       UPDATE admin_auth SET salt = ${salt}, password_hash = ${passwordHash}
//       WHERE id = 1 AND email = ${email}
//       RETURNING id
//     `;
//     try {
//       await fs.writeFile(AUTH_FILE, JSON.stringify({ email, salt, passwordHash }, null, 2), 'utf8');
//     } catch {}
//     return rows.length > 0;
//   }

//   await fs.writeFile(AUTH_FILE, JSON.stringify({ email, salt, passwordHash }, null, 2), 'utf8');
//   return true;
// }

// export async function createAdminEmailLoginToken() {
//   const admin = await readAdmin();
//   if (!admin) return { status: 'no-admin' as const };

//   const now = Date.now();
//   emailLoginRequests = emailLoginRequests.filter((timestamp) => timestamp > now - 60 * 60 * 1000);
//   if (emailLoginRequests.length >= 5 || (emailLoginRequests.at(-1) ?? 0) > now - 60 * 1000) {
//     return { status: 'rate-limited' as const };
//   }
//   emailLoginRequests.push(now);

//   const token = randomBytes(32).toString('base64url');
//   const record: EmailLoginTokenRecord = {
//     email: admin.email,
//     tokenHash: createHash('sha256').update(token).digest('hex'),
//     expiresAt: now + EMAIL_LOGIN_TOKEN_MAX_AGE,
//   };
//   const sql = getDatabase();
//   if (sql) {
//     await ensureDatabaseSchema();
//     await sql`DELETE FROM admin_email_login_tokens WHERE expires_at <= NOW()`;
//     await sql`
//       INSERT INTO admin_email_login_tokens (token_hash, email, expires_at)
//       VALUES (${record.tokenHash}, ${record.email}, ${new Date(record.expiresAt)})
//     `;
//     return { status: 'created' as const, email: admin.email, token };
//   }

//   await fs.mkdir(path.dirname(EMAIL_LOGIN_TOKEN_FILE), { recursive: true });
//   const temporaryPath = `${EMAIL_LOGIN_TOKEN_FILE}.${randomBytes(8).toString('hex')}.tmp`;
//   await fs.writeFile(temporaryPath, JSON.stringify(record), { encoding: 'utf8', flag: 'wx', mode: 0o600 });
//   await fs.rename(temporaryPath, EMAIL_LOGIN_TOKEN_FILE);

//   return { status: 'created' as const, email: admin.email, token };
// }

// export async function consumeAdminEmailLoginToken(token: string) {
//   if (!token || token.length > 200) return null;

//   const tokenHash = createHash('sha256').update(token).digest('hex');
//   const sql = getDatabase();
//   if (sql) {
//     await ensureDatabaseSchema();
//     const rows = await sql`
//       DELETE FROM admin_email_login_tokens
//       WHERE token_hash = ${tokenHash} AND expires_at > NOW()
//       RETURNING email
//     `;
//     return typeof rows[0]?.email === 'string' ? rows[0].email : null;
//   }

//   let stored: EmailLoginTokenRecord;
//   try {
//     stored = JSON.parse(await fs.readFile(EMAIL_LOGIN_TOKEN_FILE, 'utf8')) as EmailLoginTokenRecord;
//   } catch {
//     return null;
//   }

//   const expected = Buffer.from(stored.tokenHash, 'hex');
//   const actual = Buffer.from(tokenHash, 'hex');
//   if (expected.length !== actual.length || !timingSafeEqual(expected, actual) || stored.expiresAt <= Date.now()) {
//     return null;
//   }

//   const claimedPath = `${EMAIL_LOGIN_TOKEN_FILE}.${randomBytes(8).toString('hex')}.used`;
//   try {
//     await fs.rename(EMAIL_LOGIN_TOKEN_FILE, claimedPath);
//   } catch {
//     return null;
//   }

//   try {
//     const claimed = JSON.parse(await fs.readFile(claimedPath, 'utf8')) as EmailLoginTokenRecord;
//     const claimedHash = Buffer.from(claimed.tokenHash, 'hex');
//     if (claimed.expiresAt <= Date.now() || claimedHash.length !== actual.length || !timingSafeEqual(claimedHash, actual)) {
//       return null;
//     }
//     return claimed.email;
//   } catch {
//     return null;
//   } finally {
//     await fs.unlink(claimedPath).catch(() => undefined);
//   }
// }

// export function createSession(email: string) {
//   const payload: SessionPayload = { email, expiresAt: Date.now() + SESSION_MAX_AGE * 1000 };
//   const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
//   const signature = createHmac('sha256', sessionSecret()).update(encodedPayload).digest('base64url');
//   return `${encodedPayload}.${signature}`;
// }

// export function readSession(token: string | undefined) {
//   if (!token) return null;

//   const [encodedPayload, signature] = token.split('.');
//   if (!encodedPayload || !signature) return null;

//   const expectedSignature = createHmac('sha256', sessionSecret()).update(encodedPayload).digest('base64url');
//   const expected = Buffer.from(expectedSignature);
//   const actual = Buffer.from(signature);
//   if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

//   try {
//     const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString()) as SessionPayload;
//     return payload.expiresAt > Date.now() ? payload : null;
//   } catch {
//     return null;
//   }
// }

// export { SESSION_COOKIE, SESSION_MAX_AGE };