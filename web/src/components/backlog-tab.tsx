"use client";

import { useCallback, useEffect, useState } from "react";
import { Task, TaskStatus, TaskUser } from "@/types/task";
import TaskPanel from "./task-panel";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

type Props = {
  projectId: string;
  currentUser: { id: string; name: string | null };
};

type Column = { status: TaskStatus; label: string };

const COLUMNS: Column[] = [
  { status: "TODO",  label: "Todo" },
  { status: "DOING", label: "Doing" },
  { status: "DONE",  label: "Done" },
];

function formatAssignees(assignees: TaskUser[], currentUserId: string): string | null {
  if (assignees.length === 0) return null;

  const displayName = (u: TaskUser) => u.name ?? u.email ?? "Unknown";

  if (assignees.length === 1) return displayName(assignees[0]);

  if (assignees.length === 2) {
    return `${displayName(assignees[0])} and ${displayName(assignees[1])}`;
  }

  // 3+: prefer current user as the named person
  const first = assignees.find((a) => a.id === currentUserId) ?? assignees[0];
  return `${displayName(first)} and ${assignees.length - 1} others`;
}

export default function BacklogTab({ projectId, currentUser }: Props) {
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [loading, setLoading]         = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Drag-and-drop state (Todo list only)
  const [draggedId, setDraggedId]   = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/tasks`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { tasks: Task[] };
      setTasks(data.tasks);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const todoTasks = tasks
    .filter((t) => t.status === "TODO")
    .sort((a, b) => a.position - b.position);

  const doingTasks = tasks
    .filter((t) => t.status === "DOING")
    .sort((a, b) => new Date(b.statusAt).getTime() - new Date(a.statusAt).getTime());

  const doneTasks = tasks
    .filter((t) => t.status === "DONE")
    .sort((a, b) => new Date(b.statusAt).getTime() - new Date(a.statusAt).getTime());

  // ── Drag-and-drop handlers ──────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedId(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (taskId !== draggedId) setDragOverId(taskId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation(); // prevent bubbling to handleDropOnList
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }

    const newOrder = [...todoTasks];
    const fromIdx = newOrder.findIndex((t) => t.id === draggedId);
    const toIdx   = newOrder.findIndex((t) => t.id === targetId);
    const [moved] = newOrder.splice(fromIdx, 1);
    // When moving down, removing fromIdx shifts the target up by 1,
    // so we subtract 1 to keep "insert before target" semantics.
    const insertAt = fromIdx < toIdx ? toIdx - 1 : toIdx;
    newOrder.splice(insertAt, 0, moved);

    setTasks((prev) => {
      const rest = prev.filter((t) => t.status !== "TODO");
      return [...rest, ...newOrder.map((t, i) => ({ ...t, position: i }))];
    });

    void fetch(`${apiBaseUrl}/projects/${projectId}/tasks/reorder`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIds: newOrder.map((t) => t.id) }),
    });

    setDraggedId(null);
    setDragOverId(null);
  };

  // Drop onto the list background — appends dragged item to end
  const handleDropOnList = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId) return;

    const newOrder = [...todoTasks];
    const fromIdx = newOrder.findIndex((t) => t.id === draggedId);
    if (fromIdx === -1) return;
    const [moved] = newOrder.splice(fromIdx, 1);
    newOrder.push(moved);

    setTasks((prev) => {
      const rest = prev.filter((t) => t.status !== "TODO");
      return [...rest, ...newOrder.map((t, i) => ({ ...t, position: i }))];
    });

    void fetch(`${apiBaseUrl}/projects/${projectId}/tasks/reorder`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskIds: newOrder.map((t) => t.id) }),
    });

    setDraggedId(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  // ── Task CRUD callbacks ─────────────────────────────────────────────────────

  const handleTaskCreated = (task: Task) => setTasks((prev) => [...prev, task]);

  const handleTaskUpdated = (task: Task) =>
    setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setEditingTask(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const renderColumn = (status: TaskStatus, columnTasks: Task[]) => {
    const isDraggable = status === "TODO";

    return (
      <div key={status} className="overflow-hidden rounded-xl border border-slate-300">
        {/* Header */}
        <div className="border-b border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900">
          {COLUMNS.find((c) => c.status === status)!.label}
        </div>

        {/* Task list */}
        <div
          className="bg-slate-100"
          onDragOver={isDraggable ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; } : undefined}
          onDrop={isDraggable ? handleDropOnList : undefined}
        >
          {columnTasks.length === 0 ? (
            <div className="px-4 py-3 text-sm text-slate-400">No tasks</div>
          ) : (
            columnTasks.map((task) => {
              const assigneeLabel = formatAssignees(task.assignees, currentUser.id);
              const isDragging    = task.id === draggedId;
              const isDragOver    = task.id === dragOverId;

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setEditingTask(task)}
                  draggable={isDraggable}
                  onDragStart={isDraggable ? (e) => handleDragStart(e, task.id) : undefined}
                  onDragOver={isDraggable ? (e) => handleDragOver(e, task.id) : undefined}
                  onDrop={isDraggable ? (e) => handleDrop(e, task.id) : undefined}
                  onDragEnd={isDraggable ? handleDragEnd : undefined}
                  className={`w-full border-b border-slate-300 px-4 py-3 text-left last:border-b-0 transition-colors hover:bg-slate-200 ${
                    isDragging ? "opacity-40" : ""
                  } ${isDragOver ? "border-t-2 border-t-blue-500" : ""}`}
                >
                  <div className="flex min-w-0 items-baseline gap-5 text-sm">
                    <span className="shrink-0 font-medium text-slate-900">{task.name}</span>
                    {task.description && (
                      <span className="min-w-0 truncate text-slate-500 flex-1">{task.description}</span>
                    )}
                    {assigneeLabel && (
                      <span className="shrink-0 text-slate-900 ml-auto">{assigneeLabel}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-400">Loading...</div>
    );
  }

  return (
    <div className="grid grid-cols-4 items-start gap-4 p-6">
      {renderColumn("TODO",  todoTasks)}
      {renderColumn("DOING", doingTasks)}
      {renderColumn("DONE",  doneTasks)}

      <TaskPanel
        projectId={projectId}
        currentUser={currentUser}
        editingTask={editingTask}
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
        onTaskDeleted={handleTaskDeleted}
        onCancel={() => setEditingTask(null)}
      />
    </div>
  );
}
