import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getSiteContent, saveSiteContent, type SiteItem } from '@/lib/site-data';

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export async function GET() {
  const content = await getSiteContent();
  return NextResponse.json(content);
}

export async function POST(request: Request) {
  const formData = await request.formData();

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const category = String(formData.get('category') ?? 'General').trim();
  const section = String(formData.get('section') ?? 'services').trim();
  const file = formData.get('image') as File | null;

  if (!title || !description) {
    return NextResponse.json({ error: 'Title and description are required.' }, { status: 400 });
  }

  const sectionKey = section === 'projects' ? 'projects' : 'services';
  let imagePath = '/Images/logo.jpg';

  if (file && file.size > 0) {
    const safeName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
    const fileName = `${Date.now()}-${safeName}`;
    const uploadPath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(uploadPath, bytes);
    imagePath = `/uploads/${fileName}`;
  }

  const newItem: SiteItem = {
    id: `${sectionKey}-${Date.now()}`,
    title,
    description,
    category,
    image: imagePath,
    createdAt: new Date().toISOString(),
  };

  const current = await getSiteContent();
  const nextContent = {
    ...current,
    [sectionKey]: [...(current[sectionKey] ?? []), newItem],
  };

  await saveSiteContent(nextContent);

  return NextResponse.json({ success: true, item: newItem });
}
