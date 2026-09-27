import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { changeAdminPassword, readSession, SESSION_COOKIE } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const session = readSession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: 'Admin authentication is required.' }, { status: 401 });
  }

  const body = await request.json();
  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must contain at least 8 characters.' }, { status: 400 });
  }

  const changed = await changeAdminPassword(session.email, currentPassword, newPassword);
  if (!changed) {
    return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 403 });
  }

  return NextResponse.json({ success: true });
}