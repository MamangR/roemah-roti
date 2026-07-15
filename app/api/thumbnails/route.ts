import { NextResponse } from 'next/server';
import { readdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { extname } from 'path';

export async function GET() {
  try {
    const thumbnailsDir = join(process.cwd(), 'public', 'thumbnails');
    const files = await readdir(thumbnailsDir);
    
    // Filter only image files
    const imageFiles = files.filter(f => {
      const ext = extname(f).toLowerCase();
      return ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext);
    });

    return NextResponse.json({ files: imageFiles.map(f => `/thumbnails/${f}`) });
  } catch (error) {
    console.error('Error reading thumbnails directory:', error);
    return NextResponse.json({ files: [] });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const name = formData.get('name') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let filename = file.name;
    if (name) {
      const ext = extname(file.name);
      const safeName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      filename = `${safeName}${ext}`;
    }

    const finalFilename = `${Date.now()}_${filename}`;
    const filePath = join(process.cwd(), 'public', 'thumbnails', finalFilename);

    await writeFile(filePath, buffer);

    return NextResponse.json({ url: `/thumbnails/${finalFilename}` });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return NextResponse.json({ error: 'Failed to upload' }, { status: 500 });
  }
}
