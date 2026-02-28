import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/users - Get all users (for assignment dropdown)
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        lineUserId: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
