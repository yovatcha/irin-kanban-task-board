import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// POST /api/cards - Create new card
export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { laneId, title, description, priority } = body;

    if (!laneId || !title) {
      return NextResponse.json(
        { error: "laneId and title are required" },
        { status: 400 },
      );
    }

    // Get the highest order number for this lane
    const lastCard = await prisma.card.findFirst({
      where: { laneId },
      orderBy: { order: "desc" },
    });

    const order = lastCard ? lastCard.order + 1 : 0;

    const card = await prisma.card.create({
      data: {
        laneId,
        title,
        description: description || "",
        priority: priority || "MEDIUM",
        order,
      },
      include: {
        checklists: {
          include: {
            assignedTo: true,
          },
        },
      },
    });

    return NextResponse.json({ card }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create card" },
      { status: 500 },
    );
  }
}

// PUT /api/cards - Update card (title, description, priority, or move to different lane)
export async function PUT(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { id, title, description, priority, laneId, order } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Get the current card to check if lane is changing
    const currentCard = await prisma.card.findUnique({
      where: { id },
    });

    if (!currentCard) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;

    // Handle lane/order changes with proper reordering
    if (laneId !== undefined && order !== undefined) {
      const isChangingLane = currentCard.laneId !== laneId;
      const isChangingOrder = currentCard.order !== order;

      if (isChangingLane || isChangingOrder) {
        // If moving to a different lane, update orders in both lanes
        if (isChangingLane) {
          // Decrement order of cards after the current position in the old lane
          await prisma.card.updateMany({
            where: {
              laneId: currentCard.laneId,
              order: { gt: currentCard.order },
            },
            data: {
              order: { decrement: 1 },
            },
          });

          // Increment order of cards at or after the new position in the new lane
          await prisma.card.updateMany({
            where: {
              laneId: laneId,
              order: { gte: order },
            },
            data: {
              order: { increment: 1 },
            },
          });
        } else {
          // Moving within the same lane
          if (order > currentCard.order) {
            // Moving down: decrement cards between old and new position
            await prisma.card.updateMany({
              where: {
                laneId: currentCard.laneId,
                order: {
                  gt: currentCard.order,
                  lte: order,
                },
              },
              data: {
                order: { decrement: 1 },
              },
            });
          } else {
            // Moving up: increment cards between new and old position
            await prisma.card.updateMany({
              where: {
                laneId: currentCard.laneId,
                order: {
                  gte: order,
                  lt: currentCard.order,
                },
              },
              data: {
                order: { increment: 1 },
              },
            });
          }
        }

        updateData.laneId = laneId;
        updateData.order = order;
      }
    } else if (laneId !== undefined) {
      updateData.laneId = laneId;
    } else if (order !== undefined) {
      updateData.order = order;
    }

    const card = await prisma.card.update({
      where: { id },
      data: updateData,
      include: {
        checklists: {
          include: {
            assignedTo: true,
          },
        },
      },
    });

    return NextResponse.json({ card });
  } catch (error) {
    console.error("Card update error:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 },
    );
  }
}

// DELETE /api/cards - Delete card
export async function DELETE(request: NextRequest) {
  try {
    await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.card.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete card" },
      { status: 500 },
    );
  }
}
