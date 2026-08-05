"use client";

import { ReactNode, useEffect } from "react";

type QuickActionModalProps = {
  children: ReactNode;
  onCancel: () => void;
  title: string;
};

export default function QuickActionModal({
  children,
  onCancel,
  title,
}: QuickActionModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[94vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-slate-200 bg-slate-100 shadow-xl"
      >
        <div className="sticky top-0 z-20 flex justify-end border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <button type="button" onClick={onCancel} className="app-button-secondary">
            Cancel
          </button>
        </div>

        <div className="[&_.app-page]:min-h-0 [&_.app-page]:p-4 sm:[&_.app-page]:p-6">
          {children}
        </div>
      </section>
    </div>
  );
}
