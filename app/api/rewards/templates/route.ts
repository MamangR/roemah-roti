import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const templates = await prisma.rewardTemplate.findMany({
      where: {
        status: "Aktif",
        OR: [
          { expiryDate: null },
          { expiryDate: { gt: new Date() } }
        ]
      },
      orderBy: {
        visitsRequired: "asc"
      }
    });

    return Response.json(templates);
  } catch (error) {
    console.error("Failed to fetch reward templates:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
