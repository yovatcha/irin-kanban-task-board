"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CardModal from "./card-modal";
import { CheckSquare, MessageSquare } from "lucide-react";
import { colors, priorityConfig } from "@/lib/design-system";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignedToUserId: string | null;
  assignedTo: { id: string; name: string; avatarUrl: string | null } | null;
}

interface CardProps {
  card: {
    id: string;
    title: string;
    description: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH";
    order: number;
    checklists: ChecklistItem[];
  };
  onRefresh: () => void;
}

/** Generate a deterministic avatar color from a string */
function stringToColor(str: string): string {
  const palette = [
    "#7DD3FC",
    "#86EFAC",
    "#FDE68A",
    "#D8B4FE",
    "#FCA5A5",
    "#5EEAD4",
    "#A5B4FC",
    "#F9A8D4",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

export default function CardComponent({ card, onRefresh }: CardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const completedCount = card.checklists.filter((c) => c.completed).length;
  const totalCount = card.checklists.length;
  const config = priorityConfig[card.priority];
  const tagColors = colors.tags[config.tagKey];

  // Unique assignees from checklists
  const assignees = card.checklists
    .filter((c) => c.assignedTo !== null)
    .map((c) => c.assignedTo!)
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .slice(0, 3);

  return (
    <>
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div
          className="rounded-xl p-3.5 cursor-pointer transition-all duration-200 group"
          style={{
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "var(--border-medium)";
            el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.55)";
            el.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.borderColor = "var(--border-subtle)";
            el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.4)";
            el.style.transform = "translateY(0)";
          }}
          onClick={() => setIsModalOpen(true)}
        >
          {/* ── Tag / Priority pill ── */}
          <div className="flex items-center gap-1.5 mb-2.5">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: tagColors.bg,
                color: tagColors.text,
              }}
            >
              {config.label}
            </span>
            {card.priority === "HIGH" && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{
                  backgroundColor: colors.tags.high.bg,
                  color: colors.tags.high.text,
                }}
              >
                High
              </span>
            )}
          </div>

          {/* ── Title ── */}
          <h4
            className="font-medium text-sm leading-snug mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {card.title}
          </h4>

          {/* ── Description (if any) ── */}
          {card.description && (
            <p
              className="text-xs leading-relaxed mb-2.5 line-clamp-2"
              style={{ color: "var(--text-muted)" }}
            >
              {card.description}
            </p>
          )}

          {/* ── Checklist progress bar ── */}
          {totalCount > 0 && (
            <div className="mb-3">
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--border-subtle)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(completedCount / totalCount) * 100}%`,
                    backgroundColor:
                      completedCount === totalCount
                        ? colors.status.success
                        : colors.accent.amber,
                  }}
                />
              </div>
            </div>
          )}

          {/* ── Footer: assignees + metadata ── */}
          <div className="flex items-center justify-between mt-1">
            {/* Assignee avatars */}
            <div className="flex items-center">
              {assignees.length > 0 ? (
                <div className="flex -space-x-1.5">
                  {assignees.map((a) => (
                    <div
                      key={a.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ring-1"
                      style={
                        {
                          backgroundColor: stringToColor(a.name),
                          color: "#1C1A18",
                          ringColor: "var(--bg-card)",
                        } as React.CSSProperties
                      }
                      title={a.name}
                    >
                      {a.avatarUrl ? (
                        <img
                          src={a.avatarUrl}
                          alt={a.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        a.name[0]?.toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-6 h-6" /> /* spacer */
              )}
            </div>

            {/* Checklist count + (future) comment count */}
            <div className="flex items-center gap-2.5">
              {totalCount > 0 && (
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{
                    color:
                      completedCount === totalCount
                        ? colors.status.success
                        : "var(--text-muted)",
                  }}
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>
                    {completedCount}/{totalCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CardModal
        card={card}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={onRefresh}
      />
    </>
  );
}
