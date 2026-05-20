"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, LayoutGrid, Calendar, Trash2 } from "lucide-react";

interface Board {
  id: string;
  name: string;
  createdAt: string;
}

export default function BoardList() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [loading, setLoading] = useState(true);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const deletePhrase = boardToDelete ? `delete ${boardToDelete.name}` : "";
  const canDelete = boardToDelete !== null && deleteConfirmText === deletePhrase;

  useEffect(() => {
    fetchBoards();
  }, []);

  async function fetchBoards() {
    try {
      const res = await fetch("/api/boards");
      const data = await res.json();
      setBoards(data.boards || []);
    } catch (error) {
      console.error("Failed to fetch boards:", error);
    } finally {
      setLoading(false);
    }
  }

  function openDeleteDialog(board: Board) {
    setBoardToDelete(board);
    setDeleteConfirmText("");
  }

  function closeDeleteDialog() {
    if (isDeleting) return;
    setBoardToDelete(null);
    setDeleteConfirmText("");
  }

  async function confirmDeleteBoard() {
    if (!boardToDelete || !canDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/boards/${boardToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBoards((prev) => prev.filter((b) => b.id !== boardToDelete.id));
        setBoardToDelete(null);
        setDeleteConfirmText("");
      }
    } catch (error) {
      console.error("Failed to delete board:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName }),
      });

      if (res.ok) {
        const data = await res.json();
        setBoards([data.board, ...boards]);
        setNewBoardName("");
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Failed to create board:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
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
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Your Boards
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {boards.length} board{boards.length !== 1 ? "s" : ""}
          </p>
        </div>

        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              backgroundColor: "var(--accent-amber)",
              color: "#1C1A18",
            }}
          >
            <Plus className="w-4 h-4" />
            New Board
          </button>
        )}
      </div>

      {/* Create board form */}
      {isCreating && (
        <div
          className="rounded-xl p-4 mb-6"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <form onSubmit={createBoard} className="flex gap-2">
            <Input
              placeholder="Board name..."
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              autoFocus
              className="flex-1"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
              style={{
                backgroundColor: "var(--accent-amber)",
                color: "#1C1A18",
              }}
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewBoardName("");
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: "var(--bg-overlay)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Board grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {boards.map((board) => (
          <div
            key={board.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/boards/${board.id}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/boards/${board.id}`);
              }
            }}
            className="group relative text-left rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-focus)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
            }}
          >
            {/* Delete button */}
            <button
              type="button"
              aria-label={`Delete board ${board.name}`}
              onClick={(e) => {
                e.stopPropagation();
                openDeleteDialog(board);
              }}
              className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
              style={{
                backgroundColor: "var(--bg-overlay)",
                color: "var(--text-muted)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#ef4444";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--bg-overlay)";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Board icon */}
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: "var(--accent-amber-subtle)" }}
            >
              <LayoutGrid
                className="w-5 h-5"
                style={{ color: "var(--accent-amber)" }}
              />
            </div>

            <h3
              className="font-semibold text-sm leading-snug mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {board.name}
            </h3>

            <div
              className="flex items-center gap-1 text-xs"
              style={{ color: "var(--text-disabled)" }}
            >
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(board.createdAt).toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={boardToDelete !== null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <AlertDialogContent
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--text-primary)" }}>
              Delete board
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--text-muted)" }}>
              This action is permanent and will remove all lanes, cards, and
              checklists in this board. To confirm, type{" "}
              <code
                className="px-1.5 py-0.5 rounded text-xs font-mono"
                style={{
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              >
                {deletePhrase}
              </code>{" "}
              below.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={deletePhrase}
            autoFocus
            disabled={isDeleting}
            style={{
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />

          <AlertDialogFooter>
            <button
              type="button"
              onClick={closeDeleteDialog}
              disabled={isDeleting}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
              style={{
                backgroundColor: "var(--bg-overlay)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
                opacity: isDeleting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeleteBoard}
              disabled={!canDelete || isDeleting}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: "#ef4444",
                color: "#fff",
                opacity: !canDelete || isDeleting ? 0.5 : 1,
                cursor: !canDelete || isDeleting ? "not-allowed" : "pointer",
              }}
            >
              {isDeleting ? "Deleting..." : "Delete board"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty state */}
      {boards.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <LayoutGrid
              className="w-8 h-8"
              style={{ color: "var(--text-disabled)" }}
            />
          </div>
          <div className="text-center">
            <p
              className="font-medium"
              style={{ color: "var(--text-secondary)" }}
            >
              No boards yet
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Create a board to get started
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium mt-2 hover:opacity-90 transition-all"
            style={{ backgroundColor: "var(--accent-amber)", color: "#1C1A18" }}
          >
            <Plus className="w-4 h-4" />
            New Board
          </button>
        </div>
      )}
    </div>
  );
}
