import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { sendTaskAssignmentNotification } from "@/lib/line";

// POST /api/checklist - Create new checklist item
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { cardId, text, assignedToUserId } = body;

    if (!cardId || !text) {
      return NextResponse.json(
        { error: "cardId and text are required" },
        { status: 400 },
      );
    }

    const checklist = await prisma.checklistItem.create({
      data: {
        cardId,
        text,
        assignedToUserId: assignedToUserId || null,
      },
      include: {
        assignedTo: true,
        card: true,
      },
    });

    // Send LINE notification if assigned to a user
    if (assignedToUserId) {
      const user = await prisma.user.findUnique({
        where: { id: assignedToUserId },
      });

      if (user) {
        try {
          await sendTaskAssignmentNotification(
            user.lineUserId,
            checklist.card.title,
            checklist.text,
          );
        } catch (error) {
          console.error("Failed to send notification:", error);
          // Don't fail the request if notification fails
        }
      }
    }

    return NextResponse.json({ checklist }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create checklist item" },
      { status: 500 },
    );
  }
}

// PUT /api/checklist - Update checklist item
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { id, text, completed, assignedToUserId } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Get the current checklist item
    const currentItem = await prisma.checklistItem.findUnique({
      where: { id },
      include: { card: true },
    });

    const updateData: any = {};
    if (text !== undefined) updateData.text = text;
    if (completed !== undefined) updateData.completed = completed;
    if (assignedToUserId !== undefined) {
      updateData.assignedToUserId = assignedToUserId || null;
    }

    const checklist = await prisma.checklistItem.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: true,
        card: true,
      },
    });

    // Send LINE notification if newly assigned to a user
    if (
      assignedToUserId &&
      currentItem &&
      currentItem.assignedToUserId !== assignedToUserId
    ) {
      const user = await prisma.user.findUnique({
        where: { id: assignedToUserId },
      });

      if (user) {
        try {
          await sendTaskAssignmentNotification(
            user.lineUserId,
            checklist.card.title,
            checklist.text,
          );
        } catch (error) {
          console.error("Failed to send notification:", error);
        }
      }
    }

    return NextResponse.json({ checklist });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update checklist item" },
      { status: 500 },
    );
  }
}

// DELETE /api/checklist - Delete checklist item
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.checklistItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete checklist item" },
      { status: 500 },
    );
  }
}
