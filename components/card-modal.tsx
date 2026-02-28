"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Checklist from "./checklist";
import ConfirmDialog from "./confirm-dialog";
import { Trash2, X } from "lucide-react";
import { colors, priorityConfig } from "@/lib/design-system";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  assignedToUserId: string | null;
  assignedTo: { id: string; name: string; avatarUrl: string | null } | null;
}

interface CardModalProps {
  card: {
    id: string;
    title: string;
    description: string | null;
    priority: "LOW" | "MEDIUM" | "HIGH";
    checklists: ChecklistItem[];
  };
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export default function CardModal({
  card,
  isOpen,
  onClose,
  onRefresh,
}: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [priority, setPriority] = useState(card.priority);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || "");
    setPriority(card.priority);
  }, [card]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await fetch("/api/cards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: card.id, title, description, priority }),
      });
      await onRefresh();
    } catch (error) {
      console.error("Failed to update card:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await fetch(`/api/cards?id=${card.id}`, { method: "DELETE" });
      await onRefresh();
      onClose();
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  }

  const tagColors = colors.tags[priorityConfig[priority].tagKey];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto border-0 p-0"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        }}
      >
        {/* ── Modal Header ── */}
        <DialogHeader
          className="px-6 pt-6 pb-4"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-md"
                style={{ backgroundColor: tagColors.bg, color: tagColors.text }}
              >
                {priorityConfig[priority].label}
              </span>
              <DialogTitle
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Edit Card
              </DialogTitle>
            </div>
            {isSaving && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Saving…
              </span>
            )}
          </div>
        </DialogHeader>

        {/* ── Modal Body ── */}
        <div className="px-6 py-5 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label
              htmlFor="card-title"
              className="text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              TITLE
            </Label>
            <Input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSave}
              className="text-sm"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="card-desc"
              className="text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              DESCRIPTION
            </Label>
            <textarea
              id="card-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSave}
              rows={3}
              placeholder="Add a description..."
              className="w-full px-3 py-2.5 rounded-lg text-sm resize-none outline-none transition-all"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontFamily: "inherit",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--border-focus)")
              }
              onBlurCapture={(e) =>
                (e.target.style.borderColor = "var(--border-subtle)")
              }
            />
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label
              htmlFor="card-priority"
              className="text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              PRIORITY
            </Label>
            <Select
              value={priority}
              onValueChange={async (value: "LOW" | "MEDIUM" | "HIGH") => {
                setPriority(value);
                try {
                  await fetch("/api/cards", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      id: card.id,
                      title,
                      description,
                      priority: value,
                    }),
                  });
                  await onRefresh();
                } catch (error) {
                  console.error("Failed to update priority:", error);
                }
              }}
            >
              <SelectTrigger
                className="text-sm"
                style={{
                  backgroundColor: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                style={{
                  backgroundColor: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                {(["LOW", "MEDIUM", "HIGH"] as const).map((p) => {
                  const tc = colors.tags[priorityConfig[p].tagKey];
                  return (
                    <SelectItem key={p} value={p}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tc.text }}
                        />
                        <span style={{ color: "var(--text-primary)" }}>
                          {priorityConfig[p].label}
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Checklist */}
          <div
            className="pt-4"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <Checklist
              cardId={card.id}
              items={card.checklists}
              onRefresh={onRefresh}
            />
          </div>

          {/* Footer actions */}
          <div
            className="flex items-center justify-between pt-4"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: colors.status.dangerBg,
                color: colors.status.danger,
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete Card
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: "var(--bg-overlay)",
                color: "var(--text-secondary)",
              }}
            >
              <X className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      </DialogContent>

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          handleDelete();
          setIsDeleteDialogOpen(false);
        }}
        title="Delete Card"
        description={`Are you sure you want to delete "${card.title}"? This will also delete all checklist items. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </Dialog>
  );
}
