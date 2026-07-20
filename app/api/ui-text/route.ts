import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Public endpoint — no auth required. Returns all UI text overrides for client consumption.
export async function GET() {
  try {
    const rows = await prisma.uiTextOverride.findMany();
    const overrides: Record<string, string> = {};
    for (const row of rows) {
      overrides[row.key] = row.value;
    }
    return NextResponse.json(overrides);
  } catch (error) {
    console.error('UI Text GET Error:', error);
    // Return empty overrides on error so pages still work with defaults
    return NextResponse.json({});
  }
}
