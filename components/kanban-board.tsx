"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import Lane from "./lane";
import CardComponent from "./card";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignedToUserId: string | null;
  assignedTo: { id: string; name: string; avatarUrl: string | null } | null;
}

interface Card {
  id: string;
  title: string;
  description: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  order: number;
  checklists: ChecklistItem[];
}

interface Lane {
  id: string;
  title: string;
  order: number;
  cards: Card[];
}

interface Board {
  id: string;
  name: string;
  lanes: Lane[];
}

export default function KanbanBoard({ boardId }: { boardId: string }) {
  const [board, setBoard] = useState<Board | null>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isAddingLane, setIsAddingLane] = useState(false);
  const [newLaneTitle, setNewLaneTitle] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  async function fetchBoard() {
    try {
      const res = await fetch(`/api/boards/${boardId}`);
      const data = await res.json();
      setBoard(data.board);
    } catch (error) {
      console.error("Failed to fetch board:", error);
    }
  }

  async function createLane(e: React.FormEvent) {
    e.preventDefault();
    if (!newLaneTitle.trim()) return;

    try {
      const res = await fetch("/api/lanes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boardId, title: newLaneTitle }),
      });

      if (res.ok) {
        await fetchBoard();
        setNewLaneTitle("");
        setIsAddingLane(false);
      }
    } catch (error) {
      console.error("Failed to create lane:", error);
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const card = board?.lanes
      .flatMap((lane) => lane.cards)
      .find((c) => c.id === active.id);
    setActiveCard(card || null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || active.id === over.id) return;

    const activeCardId = active.id as string;
    const overId = over.id as string;

    let activeCard: Card | undefined;
    let sourceLane: Lane | undefined;

    board?.lanes.forEach((lane) => {
      const card = lane.cards.find((c) => c.id === activeCardId);
      if (card) {
        activeCard = card;
        sourceLane = lane;
      }
    });

    if (!activeCard || !sourceLane) return;

    let targetLane: Lane | undefined;
    let targetCard: Card | undefined;
    let newOrder: number;

    board?.lanes.forEach((lane) => {
      const card = lane.cards.find((c) => c.id === overId);
      if (card) {
        targetCard = card;
        targetLane = lane;
      }
    });

    if (!targetCard) {
      targetLane = board?.lanes.find((l) => l.id === overId);
    }

    if (!targetLane) return;

    newOrder = targetCard ? targetCard.order : targetLane.cards.length;

    if (sourceLane.id === targetLane.id && activeCard.order === newOrder)
      return;

    try {
      await fetch("/api/cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeCardId,
          laneId: targetLane.id,
          order: newOrder,
        }),
      });
      await fetchBoard();
    } catch (error) {
      console.error("Failed to move card:", error);
    }
  }

  if (!board) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ color: "var(--text-muted)" }}
      >
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--accent-amber)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Board header */}
      <div
        className="px-6 py-3 border-b shrink-0 flex items-center gap-3"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {board.name}
        </h2>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: "var(--bg-overlay)",
            color: "var(--text-muted)",
          }}
        >
          {board.lanes.length} lanes
        </span>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full items-start">
            <SortableContext
              items={board.lanes.map((l) => l.id)}
              strategy={horizontalListSortingStrategy}
            >
              {board.lanes.map((lane) => (
                <Lane key={lane.id} lane={lane} onRefresh={fetchBoard} />
              ))}
            </SortableContext>

            {/* Add Lane */}
            {isAddingLane ? (
              <div
                className="flex-shrink-0 rounded-xl p-4"
                style={{
                  width: "280px",
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <form onSubmit={createLane} className="space-y-2">
                  <Input
                    placeholder="Lane title..."
                    value={newLaneTitle}
                    onChange={(e) => setNewLaneTitle(e.target.value)}
                    autoFocus
                    style={{
                      backgroundColor: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition-all"
                      style={{
                        backgroundColor: "var(--accent-amber)",
                        color: "#1C1A18",
                      }}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingLane(false);
                        setNewLaneTitle("");
                      }}
                      className="flex-1 py-1.5 rounded-lg text-sm font-medium hover:opacity-80 transition-all"
                      style={{
                        backgroundColor: "var(--bg-overlay)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingLane(true)}
                className="flex-shrink-0 rounded-xl p-4 flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
                style={{
                  width: "280px",
                  backgroundColor: "transparent",
                  border: "2px dashed var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-focus)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-subtle)";
                  e.currentTarget.style.color = "var(--text-muted)";
                }}
              >
                <Plus className="w-4 h-4" />
                Add Lane
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="rotate-2 opacity-90">
              <CardComponent card={activeCard} onRefresh={fetchBoard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
