import { NextResponse } from 'next/server';
import { createAdmin, createSession, hasAdmin, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!email || !email.includes('@') || password.length < 8) {
    return NextResponse.json({ error: 'Use a valid email and a password with at least 8 characters.' }, { status: 400 });
  }

  if (await hasAdmin()) {
    return NextResponse.json({ error: 'An admin account already exists. Please log in.' }, { status: 409 });
  }

  await createAdmin(email, password);
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, createSession(email), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return response;
}