import { prisma } from "@/lib/prisma";
import { normalizePhoneToken } from "@/lib/member-session";
import type { NextRequest } from "next/server";

// ─── GET /api/members?phoneToken=... ─────────────────────────────────────────
// Fetch a single member by their phone token.
export async function GET(request: NextRequest) {
  const phoneToken = request.nextUrl.searchParams.get("phoneToken");

  if (!phoneToken) {
    return Response.json({ error: "phoneToken query param is required" }, { status: 400 });
  }

  const member = await prisma.member.findUnique({
    where: { id: normalizePhoneToken(phoneToken) },
  });

  if (!member) {
    return Response.json(null, { status: 200 });
  }

  // Map Prisma row to the Member type shape (phoneToken = id, createdAt/updatedAt as ISO strings)
  return Response.json({
    ...member,
    phoneToken: member.id,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  });
}

// ─── POST /api/members ────────────────────────────────────────────────────────
// Register a new member or update an existing one (upsert by phoneToken).
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    id: string;
    name: string;
    firstName: string;
    initials: string;
    phone: string;
    rawPhone: string;
    birthday: string;
    birthdayInput: string;
    since: string;
    referralCode: string;
    totalVisits: number;
    rewardsEarned: number;
    memberDurationLabel: string;
    favorites: string[];
    uid?: string;
  };

  const member = await prisma.member.upsert({
    where: { id: body.id },
    create: {
      id: body.id,
      name: body.name,
      firstName: body.firstName,
      initials: body.initials,
      phone: body.phone,
      rawPhone: body.rawPhone,
      birthday: body.birthday,
      birthdayInput: body.birthdayInput,
      since: body.since,
      referralCode: body.referralCode,
      totalVisits: body.totalVisits,
      rewardsEarned: body.rewardsEarned,
      memberDurationLabel: body.memberDurationLabel,
      favorites: body.favorites,
      uid: body.uid ?? null,
    },
    update: {
      name: body.name,
      firstName: body.firstName,
      initials: body.initials,
      phone: body.phone,
      rawPhone: body.rawPhone,
      birthday: body.birthday,
      birthdayInput: body.birthdayInput,
      since: body.since,
      referralCode: body.referralCode,
      memberDurationLabel: body.memberDurationLabel,
      favorites: body.favorites,
      uid: body.uid ?? undefined,
    },
  });

  return Response.json(
    {
      ...member,
      phoneToken: member.id,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    },
    { status: 201 },
  );
}
