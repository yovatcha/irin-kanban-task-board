import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/boards - List all boards
export async function GET() {
  try {
    await requireAuth();

    const boards = await prisma.board.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        lanes: {
          orderBy: { order: "asc" },
          include: {
            cards: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    return NextResponse.json({ boards });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST /api/boards - Create new board
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const board = await prisma.board.create({
      data: { name },
    });

    return NextResponse.json({ board }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
