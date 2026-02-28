import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// POST /api/lanes - Create new lane
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { boardId, title } = body;

    if (!boardId || !title) {
      return NextResponse.json(
        { error: "boardId and title are required" },
        { status: 400 },
      );
    }

    // Get the highest order number for this board
    const lastLane = await prisma.lane.findFirst({
      where: { boardId },
      orderBy: { order: "desc" },
    });

    const order = lastLane ? lastLane.order + 1 : 0;

    const lane = await prisma.lane.create({
      data: {
        boardId,
        title,
        order,
      },
    });

    return NextResponse.json({ lane }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create lane" },
      { status: 500 },
    );
  }
}

// PUT /api/lanes - Update lane (rename or reorder)
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { id, title, order } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (order !== undefined) updateData.order = order;

    const lane = await prisma.lane.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ lane });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update lane" },
      { status: 500 },
    );
  }
}

// DELETE /api/lanes - Delete lane
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.lane.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete lane" },
      { status: 500 },
    );
  }
}
