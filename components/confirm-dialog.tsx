"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
}: ConfirmDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: "var(--text-primary)" }}>
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription style={{ color: "var(--text-muted)" }}>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isConfirming}
            style={{
              backgroundColor: "var(--bg-overlay)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border-subtle)",
              opacity: isConfirming ? 0.5 : 1,
            }}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isConfirming}
            style={
              variant === "destructive"
                ? {
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    opacity: isConfirming ? 0.5 : 1,
                  }
                : {
                    backgroundColor: "var(--accent-amber)",
                    color: "#1C1A18",
                    opacity: isConfirming ? 0.5 : 1,
                  }
            }
          >
            {isConfirming ? "Processing..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
