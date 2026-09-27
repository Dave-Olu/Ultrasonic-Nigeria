import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { readSession, SESSION_COOKIE } from '@/lib/admin-auth';
import { getSiteContent, saveSiteContent, type SiteItem } from '@/lib/site-data';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');
type ContentSection = 'services' | 'projects' | 'products';

async function saveImage(file: File) {
  const safeName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
  const fileName = `${randomUUID()}-${safeName || 'image'}`;
  const uploadPath = path.join(uploadDir, fileName);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(uploadPath, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${fileName}`;
}

function getUploadedFiles(values: FormDataEntryValue[]) {
  return values.filter((value): value is File => typeof value !== 'string' && value.size > 0);
}

function isContentSection(value: string): value is ContentSection {
  return value === 'services' || value === 'projects' || value === 'products';
}

export async function GET() {
  const content = await getSiteContent();
  return NextResponse.json(content);
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!readSession(cookieStore.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Admin authentication is required.' }, { status: 401 });
  }

  const formData = await request.formData();

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const category = String(formData.get('category') ?? 'General').trim();
  const section = String(formData.get('section') ?? 'services').trim();
  const current = await getSiteContent();

  if (section === 'products') {
    const name = String(formData.get('name') ?? '').trim();
    const images = getUploadedFiles(formData.getAll('images'));
    if (!name || images.length === 0) {
      return NextResponse.json({ error: 'Product name and at least one image are required.' }, { status: 400 });
    }
    if (current.products.some((product) => product.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: 'A product with that name already exists.' }, { status: 409 });
    }

    const item = { name, images: await Promise.all(images.map(saveImage)) };
    await saveSiteContent({ ...current, products: [...current.products, item] });
    return NextResponse.json({ success: true, item });
  }

  if (section !== 'services' && section !== 'projects') {
    return NextResponse.json({ error: 'Choose a valid content section.' }, { status: 400 });
  }

  const file = formData.get('image') as File | null;

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
  }

  const imagePath = file && file.size > 0 ? await saveImage(file) : '/Images/logo.jpg';

  const newItem: SiteItem = {
    id: `${section}-${randomUUID()}`,
    title,
    description,
    category,
    image: imagePath,
    createdAt: new Date().toISOString(),
  };

  const nextContent = {
    ...current,
    [section]: [...current[section], newItem],
  };

  await saveSiteContent(nextContent);

  return NextResponse.json({ success: true, item: newItem });
}

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  if (!readSession(cookieStore.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Admin authentication is required.' }, { status: 401 });
  }

  const formData = await request.formData();
  const section = String(formData.get('section') ?? '').trim();
  if (!isContentSection(section)) {
    return NextResponse.json({ error: 'Choose a valid content section.' }, { status: 400 });
  }

  const current = await getSiteContent();
  if (section === 'products') {
    const originalName = String(formData.get('originalName') ?? '').trim();
    const name = String(formData.get('name') ?? '').trim();
    const existing = current.products.find((product) => product.name === originalName);
    if (!existing) return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    if (!name) return NextResponse.json({ error: 'Product name is required.' }, { status: 400 });
    if (current.products.some((product) => product.name !== originalName && product.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: 'A product with that name already exists.' }, { status: 409 });
    }

    const uploads = getUploadedFiles(formData.getAll('images'));
    const item = { name, images: uploads.length ? await Promise.all(uploads.map(saveImage)) : existing.images };
    await saveSiteContent({
      ...current,
      products: current.products.map((product) => product.name === originalName ? item : product),
    });
    return NextResponse.json({ success: true, item });
  }

  const id = String(formData.get('id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const category = String(formData.get('category') ?? 'General').trim();
  const existing = current[section].find((item) => item.id === id);
  if (!existing) return NextResponse.json({ error: 'Content item not found.' }, { status: 404 });
  if (!id || !title || !description) {
    return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
  }

  const file = formData.get('image') as File | null;
  const item: SiteItem = {
    ...existing,
    title,
    description,
    category,
    image: file && file.size > 0 ? await saveImage(file) : existing.image,
  };
  await saveSiteContent({
    ...current,
    [section]: current[section].map((entry) => entry.id === id ? item : entry),
  });
  return NextResponse.json({ success: true, item });
}

export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  if (!readSession(cookieStore.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Admin authentication is required.' }, { status: 401 });
  }

  const body = await request.json();
  const section = String(body.section ?? '').trim();
  if (!isContentSection(section)) {
    return NextResponse.json({ error: 'Choose a valid content section.' }, { status: 400 });
  }

  const current = await getSiteContent();
  if (section === 'products') {
    const name = String(body.name ?? '').trim();
    const products = current.products.filter((product) => product.name !== name);
    if (products.length === current.products.length) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }
    await saveSiteContent({ ...current, products });
    return NextResponse.json({ success: true });
  }

  const id = String(body.id ?? '').trim();
  const items = current[section].filter((item) => item.id !== id);
  if (items.length === current[section].length) {
    return NextResponse.json({ error: 'Content item not found.' }, { status: 404 });
  }
  await saveSiteContent({ ...current, [section]: items });
  return NextResponse.json({ success: true });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  if (!readSession(cookieStore.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Admin authentication is required.' }, { status: 401 });
  }

  const body = await request.json();
  const contact = {
    primaryPhone: String(body.primaryPhone ?? '').trim(),
    secondaryPhone: String(body.secondaryPhone ?? '').trim(),
    email: String(body.email ?? '').trim(),
    officeAddress: String(body.officeAddress ?? '').trim(),
  };
  if (!contact.primaryPhone || !contact.email || !contact.officeAddress || !contact.email.includes('@')) {
    return NextResponse.json({ error: 'Primary phone, valid email, and office address are required.' }, { status: 400 });
  }

  const current = await getSiteContent();
  const updated = await saveSiteContent({
    ...current,
    hero: { ...current.hero, phone: contact.primaryPhone },
    contact,
  });
  return NextResponse.json({ success: true, contact: updated.contact });
}
