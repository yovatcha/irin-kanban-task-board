"use client";

import { useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import CardComponent from "./card";
import ConfirmDialog from "./confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Trash2, ArrowUpDown } from "lucide-react";

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

interface LaneProps {
  lane: {
    id: string;
    title: string;
    cards: Card[];
  };
  onRefresh: () => void;
}

const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };

export default function Lane({ lane, onRefresh }: LaneProps) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(false);

  const { setNodeRef } = useDroppable({ id: lane.id });

  const sortedCards = useMemo(() => {
    if (!sortByPriority) {
      return [...lane.cards].sort((a, b) => a.order - b.order);
    }
    return [...lane.cards].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );
  }, [lane.cards, sortByPriority]);

  async function createCard(e: React.FormEvent) {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          laneId: lane.id,
          title: newCardTitle,
          description: "",
          priority: "MEDIUM",
        }),
      });

      if (res.ok) {
        await onRefresh();
        setNewCardTitle("");
        setIsAddingCard(false);
      }
    } catch (error) {
      console.error("Failed to create card:", error);
    }
  }

  async function handleDeleteLane() {
    try {
      const res = await fetch(`/api/lanes?id=${lane.id}`, { method: "DELETE" });
      if (res.ok) await onRefresh();
    } catch (error) {
      console.error("Failed to delete lane:", error);
    }
  }

  return (
    <>
      <div
        ref={setNodeRef}
        className="flex-shrink-0 flex flex-col rounded-xl"
        style={{
          width: "280px",
          maxHeight: "calc(100vh - 160px)",
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
        }}
      >
        {/* ── Column Header ── */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-2">
            <h3
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {lane.title}
            </h3>
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: "var(--bg-overlay)",
                color: "var(--text-muted)",
              }}
            >
              {lane.cards.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Sort by priority toggle */}
            <button
              onClick={() => setSortByPriority(!sortByPriority)}
              className="w-7 h-7 rounded-md flex items-center justify-center transition-all"
              title={
                sortByPriority ? "Switch to manual order" : "Sort by priority"
              }
              style={{
                backgroundColor: sortByPriority
                  ? "var(--accent-amber-subtle)"
                  : "transparent",
                color: sortByPriority
                  ? "var(--accent-amber)"
                  : "var(--text-muted)",
              }}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>

            {/* Lane menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-7 h-7 rounded-md flex items-center justify-center transition-all hover:opacity-80"
                  style={{
                    backgroundColor: "transparent",
                    color: "var(--text-muted)",
                  }}
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-400 focus:text-red-400 focus:bg-red-400/10 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Lane
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ── Cards area ── */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          <SortableContext
            items={sortedCards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            {sortedCards.map((card) => (
              <CardComponent key={card.id} card={card} onRefresh={onRefresh} />
            ))}
          </SortableContext>
        </div>

        {/* ── Add Card ── */}
        <div
          className="px-3 pb-3 shrink-0"
          style={{
            borderTop:
              sortedCards.length > 0
                ? "1px solid var(--border-subtle)"
                : "none",
            paddingTop: "8px",
          }}
        >
          {isAddingCard ? (
            <form onSubmit={createCard} className="space-y-2">
              <Input
                placeholder="Card title..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                autoFocus
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-focus)",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                }}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-all"
                  style={{
                    backgroundColor: "var(--accent-amber)",
                    color: "#1C1A18",
                  }}
                >
                  Add Card
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCard(false);
                    setNewCardTitle("");
                  }}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-all"
                  style={{
                    backgroundColor: "var(--bg-overlay)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingCard(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all"
              style={{ color: "var(--text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-overlay)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Add a card</span>
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          handleDeleteLane();
          setIsDeleteDialogOpen(false);
        }}
        title="Delete Lane"
        description={`Are you sure you want to delete "${lane.title}"? This will also delete all ${lane.cards.length} card(s) in this lane. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
