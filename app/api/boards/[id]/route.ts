import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/boards/[id] - Get board with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;

    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        lanes: {
          orderBy: { order: "asc" },
          include: {
            cards: {
              orderBy: { order: "asc" },
              include: {
                checklists: {
                  include: {
                    assignedTo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json({ board });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// PUT /api/boards/[id] - Update board
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    const board = await prisma.board.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json({ board });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update board" },
      { status: 500 },
    );
  }
}

// DELETE /api/boards/[id] - Delete board
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;

    await prisma.board.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete board" },
      { status: 500 },
    );
  }
}
