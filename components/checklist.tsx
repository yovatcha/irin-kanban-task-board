"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Check } from "lucide-react";
import { colors } from "@/lib/design-system";

interface User {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignedToUserId: string | null;
  assignedTo: { id: string; name: string; avatarUrl: string | null } | null;
}

interface ChecklistProps {
  cardId: string;
  items: ChecklistItem[];
  onRefresh: () => void;
}

export default function Checklist({
  cardId,
  items,
  onRefresh,
}: ChecklistProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newItemText, setNewItemText] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemText.trim()) return;
    try {
      await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, text: newItemText }),
      });
      await onRefresh();
      setNewItemText("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add checklist item:", error);
    }
  }

  async function toggleComplete(item: ChecklistItem) {
    try {
      await fetch("/api/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, completed: !item.completed }),
      });
      await onRefresh();
    } catch (error) {
      console.error("Failed to toggle checklist item:", error);
    }
  }

  async function assignUser(itemId: string, userId: string | null) {
    try {
      await fetch("/api/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, assignedToUserId: userId || null }),
      });
      await onRefresh();
    } catch (error) {
      console.error("Failed to assign user:", error);
    }
  }

  async function deleteItem(itemId: string) {
    try {
      await fetch(`/api/checklist?id=${itemId}`, { method: "DELETE" });
      await onRefresh();
    } catch (error) {
      console.error("Failed to delete checklist item:", error);
    }
  }

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="space-y-3">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Checklist
          </span>
          {items.length > 0 && (
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-md"
              style={{
                backgroundColor: "var(--bg-overlay)",
                color: "var(--text-muted)",
              }}
            >
              {completedCount}/{items.length}
            </span>
          )}
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{
              backgroundColor: "var(--bg-overlay)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </button>
        )}
      </div>

      {/* ── Progress bar ── */}
      {items.length > 0 && (
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: "var(--border-subtle)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(completedCount / items.length) * 100}%`,
              backgroundColor:
                completedCount === items.length
                  ? colors.status.success
                  : colors.accent.amber,
            }}
          />
        </div>
      )}

      {/* ── Add item form ── */}
      {isAdding && (
        <form onSubmit={addItem} className="flex gap-2">
          <Input
            placeholder="Checklist item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            autoFocus
            className="flex-1 text-sm"
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-focus)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-90 transition-all"
            style={{ backgroundColor: "var(--accent-amber)", color: "#1C1A18" }}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setNewItemText("");
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium hover:opacity-80 transition-all"
            style={{
              backgroundColor: "var(--bg-overlay)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {/* ── Checklist items ── */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg transition-all"
            style={{
              backgroundColor: "var(--bg-overlay)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {/* Checkbox */}
            <button
              onClick={() => toggleComplete(item)}
              className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all"
              style={{
                backgroundColor: item.completed
                  ? colors.status.success
                  : "transparent",
                borderColor: item.completed
                  ? colors.status.success
                  : "var(--border-focus)",
              }}
            >
              {item.completed && (
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              )}
            </button>

            {/* Text + assignee */}
            <div className="flex-1 min-w-0 space-y-2">
              <p
                className="text-sm leading-snug"
                style={{
                  color: item.completed
                    ? "var(--text-disabled)"
                    : "var(--text-primary)",
                  textDecoration: item.completed ? "line-through" : "none",
                }}
              >
                {item.text}
              </p>

              {/* Assignee select */}
              <Select
                value={item.assignedToUserId || "unassigned"}
                onValueChange={(value) =>
                  assignUser(item.id, value === "unassigned" ? null : value)
                }
              >
                <SelectTrigger
                  className="h-7 text-xs w-full max-w-[180px]"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                >
                  <SelectItem value="unassigned">
                    <span style={{ color: "var(--text-muted)" }}>
                      Unassigned
                    </span>
                  </SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name}
                            className="w-4 h-4 rounded-full"
                          />
                        ) : (
                          <div
                            className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              backgroundColor: colors.accent.amber,
                              color: "#1C1A18",
                              fontSize: "9px",
                            }}
                          >
                            {user.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <span>{user.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delete */}
            <button
              onClick={() => deleteItem(item.id)}
              className="flex-shrink-0 mt-0.5 transition-all hover:opacity-80"
              style={{ color: "var(--text-disabled)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = colors.status.danger)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-disabled)")
              }
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ── Empty state ── */}
      {items.length === 0 && !isAdding && (
        <p
          className="text-xs text-center py-4"
          style={{ color: "var(--text-disabled)" }}
        >
          No checklist items yet
        </p>
      )}
    </div>
  );
}
