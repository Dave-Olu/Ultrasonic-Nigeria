import { NextResponse } from 'next/server';
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE, verifyAdmin } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const body = await request.json();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  if (!(await verifyAdmin(email, password))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

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