import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { readSession, SESSION_COOKIE } from '@/lib/admin-auth';

export async function GET() {
  const cookieStore = await cookies();
  const session = readSession(cookieStore.get(SESSION_COOKIE)?.value);
  return NextResponse.json({ authenticated: Boolean(session), email: session?.email ?? null });
}