"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Task, TaskStatus, TaskUser } from "@/types/task";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

type Props = {
  projectId: string;
  currentUser: { id: string; name: string | null };
  editingTask: Task | null;
  onTaskCreated: (task: Task) => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
  onCancel: () => void;
};

export default function TaskPanel({
  projectId,
  currentUser,
  editingTask,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onCancel,
}: Props) {
  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus]           = useState<TaskStatus>("TODO");
  const [assignees, setAssignees]     = useState<TaskUser[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting]   = useState(false);

  // User-search popup
  const [showSearch, setShowSearch]   = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<TaskUser[]>([]);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef        = useRef<HTMLTextAreaElement>(null);

  // Sync form when editingTask changes
  useEffect(() => {
    if (editingTask) {
      setName(editingTask.name);
      setDescription(editingTask.description);
      setStatus(editingTask.status);
      setAssignees(editingTask.assignees);
    } else {
      setName("");
      setDescription("");
      setStatus("TODO");
      setAssignees([]);
    }
    setShowSearch(false);
    setSearchQuery("");
  }, [editingTask]);

  // Auto-resize textarea whenever description changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [description]);

  // Close search popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch suggestions whenever popup is open or query / assignees change
  useEffect(() => {
    if (!showSearch) return;

    const assigneeIds = new Set(assignees.map((a) => a.id));

    const run = async () => {
      try {
        const qs = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
        const res = await fetch(`${apiBaseUrl}/projects/${projectId}/members${qs}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { members: TaskUser[] };
        const filtered = data.members.filter((m) => !assigneeIds.has(m.id));

        if (!searchQuery) {
          const me = filtered.find((m) => m.id === currentUser.id);
          setSuggestions(me ? [me] : []);
        } else {
          setSuggestions(filtered);
        }
      } catch {
        // ignore
      }
    };

    void run();
  }, [showSearch, searchQuery, assignees, projectId, currentUser.id]);

  const addAssignee = (user: TaskUser) => {
    setAssignees((prev) => [...prev, user]);
    setSearchQuery("");
    setShowSearch(false);
  };

  const removeAssignee = (userId: string) =>
    setAssignees((prev) => prev.filter((a) => a.id !== userId));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      setIsSubmitting(true);

      if (editingTask) {
        const res = await fetch(`${apiBaseUrl}/projects/${projectId}/tasks/${editingTask.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            description,
            status,
            assigneeIds: assignees.map((a) => a.id),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { task: Task };
        onTaskUpdated(data.task);
        onCancel();
      } else {
        const res = await fetch(`${apiBaseUrl}/projects/${projectId}/tasks`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: trimmedName,
            description,
            status,
            assigneeIds: assignees.map((a) => a.id),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { task: Task };
        onTaskCreated(data.task);
        setName("");
        setDescription("");
        setStatus("TODO");
        setAssignees([]);
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTask) return;
    if (!confirm(`Delete task "${editingTask.name}"? This cannot be undone.`)) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/tasks/${editingTask.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) return;
      onTaskDeleted(editingTask.id);
    } catch {
      // ignore
    } finally {
      setIsDeleting(false);
    }
  };

  const displayName = (u: TaskUser) => u.name ?? u.email ?? "Unknown";

  return (
    <div className="rounded-xl border border-slate-300 bg-white p-5 shadow-sm">
      {/* Header */}
      <h2 className="text-lg font-semibold text-slate-900">
        {editingTask ? "Edit task" : "Create a new task"}
      </h2>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-3 space-y-3">
        {/* Name */}
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Task name"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
        />

        {/* Description — auto-grows */}
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          rows={3}
          className="w-full resize-none overflow-hidden rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
        />

        {/* Status */}
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-semibold text-slate-900">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 hover:bg-slate-100"
          >
            <option value="TODO">Todo</option>
            <option value="DOING">Doing</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        {/* People */}
        <div>
          <div className="flex items-center justify-between border-b pb-2 border-slate-300">
            <p className="text-sm font-semibold text-slate-900">People</p>

            {/* Add-person button + popup */}
            <div ref={searchContainerRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSearch((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-sm leading-none text-slate-900 transition-colors hover:bg-slate-100"
              >
                +
              </button>

              {showSearch && (
                <div className="absolute right-0 top-full z-10 mt-1 w-56 overflow-hidden rounded-lg border border-slate-300 bg-white shadow-lg">
                  <div className="border-b border-slate-200 p-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search people…"
                      autoFocus
                      className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    {suggestions.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-slate-400">No suggestions</p>
                    ) : (
                      suggestions.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => addAssignee(u)}
                          className="w-full px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:bg-slate-100"
                        >
                          {displayName(u)}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {assignees.length > 0 && (
            <div className="mt-2 space-y-1">
              {assignees.map((a) => (
                <div key={a.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-900">{displayName(a)}</span>
                  <button
                    type="button"
                    onClick={() => removeAssignee(a.id)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-900 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className={`flex items-center pt-1 ${editingTask ? "justify-between" : "justify-end"}`}>
          {editingTask && (
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          )}

          <div className="flex items-center gap-2">
            {editingTask && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
            >
              {isSubmitting
                ? editingTask ? "Saving…" : "Creating…"
                : editingTask ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
