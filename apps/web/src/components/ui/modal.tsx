"use client";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const el = ref.current;
    if (isOpen && !el?.open) el?.showModal();
    if (!isOpen && el?.open) el.close();
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [isOpen]);
  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? `${id}-title` : undefined}
      aria-label={title ? undefined : "Dialog"}
      aria-describedby={description ? `${id}-description` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn("rb-modal", className)}
    >
      <div className="rb-modal-heading">
        <div>
          {title && <h2 id={`${id}-title`}>{title}</h2>}
          {description && <p id={`${id}-description`}>{description}</p>}
        </div>
        <button
          className="rb-icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
