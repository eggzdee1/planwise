"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectRetrospective } from "@/types/project-retrospective";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

type Props = {
  projectId: string;
};

type RetrospectiveForm = Pick<ProjectRetrospective, "start" | "stop" | "continue">;
type RetrospectiveField = keyof RetrospectiveForm;

const emptyForm: RetrospectiveForm = {
  start: "",
  stop: "",
  continue: "",
};

const COLUMNS: { field: RetrospectiveField; label: string; colorClass: string }[] = [
  { field: "start", label: "Start", colorClass: "text-green-700" },
  { field: "stop", label: "Stop", colorClass: "text-red-700" },
  { field: "continue", label: "Continue", colorClass: "text-yellow-600" },
];

const createFormFromRetrospective = (
  retrospective: ProjectRetrospective | null,
): RetrospectiveForm => ({
  start: retrospective?.start ?? "",
  stop: retrospective?.stop ?? "",
  continue: retrospective?.continue ?? "",
});

export default function RetrospectiveTab({ projectId }: Props) {
  const [savedForm, setSavedForm] = useState<RetrospectiveForm>(emptyForm);
  const [form, setForm] = useState<RetrospectiveForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);
  const textareaRefs = useRef<Record<RetrospectiveField, HTMLTextAreaElement | null>>({
    start: null,
    stop: null,
    continue: null,
  });
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resizeTextareas = useCallback(() => {
    const textareas = COLUMNS.flatMap((column) => {
      const textarea = textareaRefs.current[column.field];
      return textarea ? [textarea] : [];
    });
    if (textareas.length === 0) return;

    textareas.forEach((textarea) => {
      textarea.style.height = "auto";
    });

    const maxHeight = Math.max(...textareas.map((textarea) => textarea.scrollHeight));
    textareas.forEach((textarea) => {
      textarea.style.height = `${maxHeight}px`;
    });
  }, []);

  const showToast = useCallback((message: string) => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    setToast({ message, visible: true });
    fadeTimerRef.current = setTimeout(() => {
      setToast((current) => current ? { ...current, visible: false } : current);
    }, 1600);
    clearTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const fetchRetrospective = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/retrospective`, {
        credentials: "include",
      });

      if (!res.ok) return;

      const data = (await res.json()) as { retrospective: ProjectRetrospective };
      const nextForm = createFormFromRetrospective(data.retrospective);
      setSavedForm(nextForm);
      setForm(nextForm);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchRetrospective();
  }, [fetchRetrospective]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  useEffect(() => {
    resizeTextareas();
  }, [form, resizeTextareas]);

  const handleFieldChange = (field: RetrospectiveField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleCancel = () => {
    setForm(savedForm);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/retrospective`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) return;

      const data = (await res.json()) as { retrospective: ProjectRetrospective };
      const nextForm = createFormFromRetrospective(data.retrospective);
      setSavedForm(nextForm);
      setForm(nextForm);
      showToast("Retrospective successfully saved!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="relative flex min-h-10 items-center justify-end">
        {toast && (
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm transition-opacity duration-500 ${
              toast.visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-sm text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 items-start gap-4">
        {COLUMNS.map((column) => (
          <div key={column.field} className="overflow-hidden rounded-xl border border-slate-300">
            <div className={`border-b border-slate-300 bg-white px-4 py-3 text-sm font-semibold ${column.colorClass}`}>
              {column.label}
            </div>
            <textarea
              ref={(textarea) => {
                textareaRefs.current[column.field] = textarea;
                if (textarea) resizeTextareas();
              }}
              value={form[column.field]}
              onChange={(e) => {
                handleFieldChange(column.field, e.target.value);
              }}
              className={`block min-h-20 w-full resize-none overflow-hidden bg-white px-4 py-3 font-medium text-sm outline-none transition-colors placeholder:text-slate-400 text-slate-900`}
              aria-label={column.label}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
