"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CalendarDays, AlertCircle, Inbox } from "lucide-react";
import { priorityConfig, colors, boardColor } from "@/lib/design-system";

// ── Types ────────────────────────────────────────────────────────────────────
interface Card {
  id: string;
  title: string;
  priority: number;
  dueDate: string | null;
  laneId: string;
}
interface Lane {
  id: string;
  title: string;
  cards: Card[];
}
interface Board {
  id: string;
  name: string;
  color: string | null;
  lanes: Lane[];
}

interface PlottedCard {
  card: Card;
  board: Board;
  laneTitle: string;
}

const NO_DUE_DATE_ID = "no-due-date";
const DAYS_AHEAD = 30;

// ── Date helpers ─────────────────────────────────────────────────────────────
function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function addDays(d: Date, n: number): Date {
  const r = startOfDay(d);
  r.setDate(r.getDate() + n);
  return r;
}
function dayKey(d: Date): string {
  return startOfDay(d).toISOString().slice(0, 10);
}
function dayKeyToDate(key: string): Date {
  // Use noon UTC so timezone shifts don't bump it to a different day locally.
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}
function daysBetween(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86400000);
}
function formatDayLabel(d: Date): { weekday: string; date: string } {
  return {
    weekday: d.toLocaleDateString(undefined, { weekday: "short" }),
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  };
}

// ── Component ────────────────────────────────────────────────────────────────
export default function TimelineView() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiddenBoards, setHiddenBoards] = useState<Set<string>>(new Set());
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  useEffect(() => {
    fetch("/api/boards")
      .then((r) => r.json())
      .then((data) => setBoards(data.boards || []))
      .catch((err) => console.error("Failed to load boards:", err))
      .finally(() => setLoading(false));
  }, []);

  const today = useMemo(() => startOfDay(new Date()), []);

  // Flatten cards with their board context, filtered by hidden boards.
  const allCards: PlottedCard[] = useMemo(() => {
    const out: PlottedCard[] = [];
    for (const board of boards) {
      if (hiddenBoards.has(board.id)) continue;
      for (const lane of board.lanes) {
        for (const card of lane.cards) {
          out.push({ card, board, laneTitle: lane.title });
        }
      }
    }
    return out;
  }, [boards, hiddenBoards]);

  // Bucket cards: Overdue / per-day / Later / No-due-date.
  const { overdue, byDay, later, noDueDate } = useMemo(() => {
    const overdue: PlottedCard[] = [];
    const later: PlottedCard[] = [];
    const noDueDate: PlottedCard[] = [];
    const byDay = new Map<string, PlottedCard[]>();

    for (const pc of allCards) {
      if (!pc.card.dueDate) {
        noDueDate.push(pc);
        continue;
      }
      const due = startOfDay(new Date(pc.card.dueDate));
      const diff = daysBetween(today, due);
      if (diff < 0) {
        overdue.push(pc);
      } else if (diff > DAYS_AHEAD) {
        later.push(pc);
      } else {
        const k = dayKey(due);
        const arr = byDay.get(k) ?? [];
        arr.push(pc);
        byDay.set(k, arr);
      }
    }

    overdue.sort(
      (a, b) =>
        new Date(b.card.dueDate!).getTime() -
        new Date(a.card.dueDate!).getTime(),
    );
    later.sort(
      (a, b) =>
        new Date(a.card.dueDate!).getTime() -
        new Date(b.card.dueDate!).getTime(),
    );

    return { overdue, byDay, later, noDueDate };
  }, [allCards, today]);

  const dayColumns = useMemo(
    () => Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => addDays(today, i)),
    [today],
  );

  // Active card for DragOverlay.
  const activeCard = useMemo<PlottedCard | null>(() => {
    if (!activeCardId) return null;
    return allCards.find((p) => p.card.id === activeCardId) ?? null;
  }, [activeCardId, allCards]);

  function toggleBoard(boardId: string) {
    setHiddenBoards((prev) => {
      const next = new Set(prev);
      if (next.has(boardId)) next.delete(boardId);
      else next.add(boardId);
      return next;
    });
  }

  // Optimistic local update + PUT to /api/cards.
  function rescheduleCard(cardId: string, newDueDate: string | null) {
    setBoards((prev) =>
      prev.map((b) => ({
        ...b,
        lanes: b.lanes.map((l) => ({
          ...l,
          cards: l.cards.map((c) =>
            c.id === cardId ? { ...c, dueDate: newDueDate } : c,
          ),
        })),
      })),
    );
    fetch("/api/cards", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cardId, dueDate: newDueDate }),
    }).catch((err) => console.error("Failed to reschedule:", err));
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveCardId(String(e.active.id));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveCardId(null);
    const { active, over } = e;
    if (!over) return;

    const cardId = String(active.id);
    const target = String(over.id);

    // Skip if dropped on its current bucket.
    const pc = allCards.find((p) => p.card.id === cardId);
    if (!pc) return;
    const currentKey = pc.card.dueDate
      ? dayKey(new Date(pc.card.dueDate))
      : NO_DUE_DATE_ID;
    if (target === currentKey) return;

    if (target === NO_DUE_DATE_ID) {
      rescheduleCard(cardId, null);
    } else {
      // target is a YYYY-MM-DD day key.
      const newDate = dayKeyToDate(target);
      rescheduleCard(cardId, newDate.toISOString());
    }
  }

  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        Loading timeline…
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div
        className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center"
        style={{ color: "var(--text-muted)" }}
      >
        <CalendarDays className="w-10 h-10 opacity-50" />
        <p className="text-sm">No boards yet — create one to see it here.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ── Page header ── */}
        <div
          className="px-6 pt-6 pb-4 shrink-0 border-b"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1
                className="text-xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Timeline
              </h1>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                Drag a card to a new day to reschedule
              </p>
            </div>
            <div
              className="text-xs flex items-center gap-3"
              style={{ color: "var(--text-muted)" }}
            >
              <span>
                <strong style={{ color: "var(--text-secondary)" }}>
                  {allCards.length}
                </strong>{" "}
                cards
              </span>
              {overdue.length > 0 && (
                <span
                  className="flex items-center gap-1"
                  style={{ color: colors.status.danger }}
                >
                  <AlertCircle className="w-3 h-3" />
                  {overdue.length} overdue
                </span>
              )}
              {noDueDate.length > 0 && (
                <span className="flex items-center gap-1">
                  <Inbox className="w-3 h-3" />
                  {noDueDate.length} no date
                </span>
              )}
            </div>
          </div>

          {/* Board filter chips */}
          <div className="flex flex-wrap gap-2">
            {boards.map((b) => {
              const color = boardColor(b);
              const hidden = hiddenBoards.has(b.id);
              return (
                <button
                  key={b.id}
                  onClick={() => toggleBoard(b.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity"
                  style={{
                    backgroundColor: "var(--bg-overlay)",
                    color: hidden
                      ? "var(--text-disabled)"
                      : "var(--text-secondary)",
                    border: `1px solid ${hidden ? "var(--border-subtle)" : "var(--border-medium)"}`,
                    opacity: hidden ? 0.45 : 1,
                  }}
                  title={hidden ? `Show ${b.name}` : `Hide ${b.name}`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {b.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Day strip ── */}
        <div className="flex-1 overflow-x-auto overflow-y-auto px-6 py-4">
          <div className="flex gap-3 items-start min-h-full">
            {/* Overdue — read-only (not droppable) */}
            {overdue.length > 0 && (
              <StaticColumn
                label="Overdue"
                subLabel={`${overdue.length} cards`}
                isOverdue={true}
                cards={overdue}
                onCardClick={(boardId) => router.push(`/boards/${boardId}`)}
              />
            )}

            {/* Per-day columns (droppable) */}
            {dayColumns.map((d, idx) => {
              const k = dayKey(d);
              const cards = byDay.get(k) ?? [];
              const { weekday, date } = formatDayLabel(d);
              const isToday = idx === 0;
              return (
                <DroppableDayColumn
                  key={k}
                  id={k}
                  label={isToday ? "Today" : weekday}
                  subLabel={date}
                  cards={cards}
                  isToday={isToday}
                  onCardClick={(boardId) => router.push(`/boards/${boardId}`)}
                />
              );
            })}

            {/* Later — read-only */}
            {later.length > 0 && (
              <StaticColumn
                label="Later"
                subLabel={`${later.length} cards`}
                isOverdue={false}
                cards={later}
                onCardClick={(boardId) => router.push(`/boards/${boardId}`)}
              />
            )}
          </div>
        </div>

        {/* ── No-due-date drawer (droppable) ── */}
        <DroppableNoDueDate
          cards={noDueDate}
          onCardClick={(boardId) => router.push(`/boards/${boardId}`)}
        />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <CardChip pc={activeCard} dragging onClick={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

// ── Static (non-droppable) column for Overdue/Later ──────────────────────────
function StaticColumn({
  label,
  subLabel,
  cards,
  isOverdue,
  onCardClick,
}: {
  label: string;
  subLabel: string;
  cards: PlottedCard[];
  isOverdue: boolean;
  onCardClick: (boardId: string) => void;
}) {
  const accent = isOverdue ? colors.status.danger : "var(--border-medium)";
  return (
    <div className="shrink-0 flex flex-col" style={{ width: "180px" }}>
      <ColumnHeader
        label={label}
        subLabel={subLabel}
        accent={accent}
        labelColor={isOverdue ? colors.status.danger : "var(--text-secondary)"}
      />
      <div className="flex flex-col gap-1.5 mt-2 min-h-[40px]">
        {cards.length === 0 ? (
          <EmptyCell />
        ) : (
          cards.map((pc) => (
            <DraggableCardChip
              key={pc.card.id}
              pc={pc}
              onClick={() => onCardClick(pc.board.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Droppable day column ─────────────────────────────────────────────────────
function DroppableDayColumn({
  id,
  label,
  subLabel,
  cards,
  isToday,
  onCardClick,
}: {
  id: string;
  label: string;
  subLabel: string;
  cards: PlottedCard[];
  isToday: boolean;
  onCardClick: (boardId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const accent = isToday ? "var(--accent-amber)" : "var(--border-medium)";
  const labelColor = isToday
    ? "var(--accent-amber)"
    : "var(--text-secondary)";

  return (
    <div
      ref={setNodeRef}
      className="shrink-0 flex flex-col rounded-md"
      style={{
        width: "180px",
        backgroundColor: isOver
          ? "var(--accent-amber-subtle)"
          : "transparent",
        outline: isOver ? "2px dashed var(--accent-amber)" : "none",
        outlineOffset: "2px",
        transition: "background-color 120ms ease",
      }}
    >
      <ColumnHeader
        label={label}
        subLabel={subLabel}
        accent={accent}
        labelColor={labelColor}
        highlight={isToday}
      />
      <div className="flex flex-col gap-1.5 mt-2 min-h-[60px] p-0.5">
        {cards.length === 0 ? (
          <EmptyCell />
        ) : (
          cards.map((pc) => (
            <DraggableCardChip
              key={pc.card.id}
              pc={pc}
              onClick={() => onCardClick(pc.board.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Column header ────────────────────────────────────────────────────────────
function ColumnHeader({
  label,
  subLabel,
  accent,
  labelColor,
  highlight,
}: {
  label: string;
  subLabel: string;
  accent: string;
  labelColor: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-t-md px-2.5 py-2 border"
      style={{
        backgroundColor: highlight
          ? "var(--accent-amber-subtle)"
          : "var(--bg-surface)",
        borderColor: accent,
        borderBottomWidth: "2px",
      }}
    >
      <div className="text-xs font-semibold" style={{ color: labelColor }}>
        {label}
      </div>
      <div
        className="text-[10px] mt-0.5"
        style={{ color: "var(--text-muted)" }}
      >
        {subLabel}
      </div>
    </div>
  );
}

function EmptyCell() {
  return (
    <div
      className="text-[10px] italic px-2 py-1"
      style={{ color: "var(--text-disabled)" }}
    >
      —
    </div>
  );
}

// ── Card chip (presentational) ───────────────────────────────────────────────
function CardChip({
  pc,
  dragging,
  onClick,
}: {
  pc: PlottedCard;
  dragging?: boolean;
  onClick: () => void;
}) {
  const { card, board } = pc;
  const color = boardColor(board);
  const priority = priorityConfig[card.priority] ?? priorityConfig[3];
  const tag = colors.tags[priority.tagKey];

  return (
    <button
      onClick={onClick}
      className="text-left rounded-md p-2 transition-all w-full"
      style={{
        backgroundColor: "var(--bg-card)",
        borderLeft: `3px solid ${color}`,
        boxShadow: dragging
          ? "0 8px 20px rgba(0,0,0,0.5)"
          : "0 1px 2px rgba(0,0,0,0.3)",
        cursor: dragging ? "grabbing" : "grab",
        opacity: dragging ? 0.95 : 1,
      }}
      title={`${card.title} — ${board.name} / ${pc.laneTitle}`}
    >
      <div
        className="text-xs font-medium leading-snug line-clamp-2"
        style={{ color: "var(--text-primary)" }}
      >
        {card.title}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
          style={{ backgroundColor: tag.bg, color: tag.text }}
        >
          {priority.label}
        </span>
        <span
          className="text-[10px] truncate"
          style={{ color: "var(--text-muted)" }}
        >
          {board.name}
        </span>
      </div>
    </button>
  );
}

// ── Draggable card chip ──────────────────────────────────────────────────────
function DraggableCardChip({
  pc,
  onClick,
}: {
  pc: PlottedCard;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: pc.card.id,
  });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{ opacity: isDragging ? 0.25 : 1 }}
    >
      <CardChip pc={pc} onClick={onClick} />
    </div>
  );
}

// ── Droppable "No due date" drawer ───────────────────────────────────────────
function DroppableNoDueDate({
  cards,
  onCardClick,
}: {
  cards: PlottedCard[];
  onCardClick: (boardId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: NO_DUE_DATE_ID });
  const [open, setOpen] = useState(false);
  const showPanel = open || cards.length > 0;
  if (!showPanel) return null;

  return (
    <div
      ref={setNodeRef}
      className="shrink-0 border-t"
      style={{
        borderColor: isOver ? "var(--accent-amber)" : "var(--border-subtle)",
        backgroundColor: isOver
          ? "var(--accent-amber-subtle)"
          : "var(--bg-surface)",
        transition: "background-color 120ms ease, border-color 120ms ease",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-2.5 flex items-center justify-between text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        <span className="flex items-center gap-2">
          <Inbox className="w-3.5 h-3.5" />
          Cards without due date ({cards.length}) — drop here to clear due date
        </span>
        <span style={{ color: "var(--text-muted)" }}>
          {open ? "Hide" : "Show"}
        </span>
      </button>
      {open && (
        <div className="px-6 pb-4 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {cards.length === 0 ? (
            <span
              className="text-xs italic"
              style={{ color: "var(--text-disabled)" }}
            >
              No cards without a due date.
            </span>
          ) : (
            cards.map((pc) => (
              <div key={pc.card.id} style={{ width: "180px" }}>
                <DraggableCardChip
                  pc={pc}
                  onClick={() => onCardClick(pc.board.id)}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
