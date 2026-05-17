"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ProjectMember, ProjectUpdate, ProjectUpdateEntry } from "@/types/project-update";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
const NEW_UPDATE_ID = "new";

type Props = {
  projectId: string;
};

type UpdateForm = Record<string, Omit<ProjectUpdateEntry, "memberId">>;

const createEmptyForm = (members: ProjectMember[]): UpdateForm =>
  members.reduce<UpdateForm>((form, member) => {
    form[member.id] = { did: "", willDo: "", blockers: "" };
    return form;
  }, {});

const createFormFromUpdate = (members: ProjectMember[], update: ProjectUpdate | undefined): UpdateForm => {
  const form = createEmptyForm(members);

  update?.entries.forEach((entry) => {
    if (form[entry.memberId]) {
      form[entry.memberId] = {
        did: entry.did,
        willDo: entry.willDo,
        blockers: entry.blockers,
      };
    }
  });

  return form;
};

const formatMemberName = (member: ProjectMember) => member.name ?? member.email ?? "Unknown";

const formatUpdateDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  }).format(new Date(value));

export default function UpdatesTab({ projectId }: Props) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [selectedUpdateId, setSelectedUpdateId] = useState(NEW_UPDATE_ID);
  const [form, setForm] = useState<UpdateForm>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedUpdate = updates.find((update) => update.id === selectedUpdateId);
  const isNewUpdate = selectedUpdateId === NEW_UPDATE_ID;
  const hasNewUpdateText = members.some((member) => {
    const entry = form[member.id];
    return Boolean(
      entry?.did.trim() ||
      entry?.willDo.trim() ||
      entry?.blockers.trim(),
    );
  });

  const showToast = useCallback((message: string) => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    setToast({ message, visible: true });
    fadeTimerRef.current = setTimeout(() => {
      setToast((current) => current ? { ...current, visible: false } : current);
    }, 1600);
    clearTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [membersRes, updatesRes] = await Promise.all([
        fetch(`${apiBaseUrl}/projects/${projectId}/members`, { credentials: "include" }),
        fetch(`${apiBaseUrl}/projects/${projectId}/updates`, { credentials: "include" }),
      ]);

      if (!membersRes.ok || !updatesRes.ok) return;

      const membersData = (await membersRes.json()) as { members: ProjectMember[] };
      const updatesData = (await updatesRes.json()) as { updates: ProjectUpdate[] };

      setMembers(membersData.members);
      setUpdates(updatesData.updates);
      setForm(createEmptyForm(membersData.members));
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const resizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  useEffect(() => {
    Object.values(textareaRefs.current).forEach((textarea) => {
      if (textarea) resizeTextarea(textarea);
    });
  }, [form]);

  const handleSelectUpdate = (updateId: string) => {
    setSelectedUpdateId(updateId);
    setForm(
      updateId === NEW_UPDATE_ID
        ? createEmptyForm(members)
        : createFormFromUpdate(members, updates.find((update) => update.id === updateId)),
    );
  };

  const handleCellChange = (
    memberId: string,
    field: keyof Omit<ProjectUpdateEntry, "memberId">,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      [memberId]: {
        ...(current[memberId] ?? { did: "", willDo: "", blockers: "" }),
        [field]: value,
      },
    }));
  };

  const buildEntries = (): ProjectUpdateEntry[] =>
    members.map((member) => ({
      memberId: member.id,
      did: form[member.id]?.did ?? "",
      willDo: form[member.id]?.willDo ?? "",
      blockers: form[member.id]?.blockers ?? "",
    }));

  const resetToNewUpdate = () => {
    setSelectedUpdateId(NEW_UPDATE_ID);
    setForm(createEmptyForm(members));
  };

  const handleAddUpdate = async () => {
    if (!hasNewUpdateText) return;

    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/updates`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: buildEntries() }),
      });

      if (!res.ok) return;

      const data = (await res.json()) as { update: ProjectUpdate };
      setUpdates((current) => [data.update, ...current]);
      resetToNewUpdate();
      showToast("Update successfully added!");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUpdate = async () => {
    if (!selectedUpdate) return;

    setSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/updates/${selectedUpdate.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: buildEntries() }),
      });

      if (!res.ok) return;

      const data = (await res.json()) as { update: ProjectUpdate };
      setUpdates((current) => current.map((update) => update.id === data.update.id ? data.update : update));
      resetToNewUpdate();
      showToast("Update successfully saved!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="relative flex min-h-10 items-center justify-between gap-4">
        <select
          value={selectedUpdateId}
          onChange={(e) => handleSelectUpdate(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-3 font-medium py-2 text-sm text-slate-900 outline-none transition-colors hover:bg-slate-200 focus:border-blue-500"
        >
          <option value={NEW_UPDATE_ID}>New Update</option>
          {updates.map((update) => (
            <option key={update.id} value={update.id}>
              {formatUpdateDate(update.createdAt)}
            </option>
          ))}
        </select>

        {toast && (
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm transition-opacity duration-500 ${
              toast.visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {toast.message}
          </div>
        )}

        {isNewUpdate ? (
          <button
            type="button"
            onClick={handleAddUpdate}
            disabled={saving || !hasNewUpdateText}
            className="rounded-lg px-4 py-2 text-sm text-slate-900 bg-white border border-slate-300 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300 disabled:text-slate-500"
          >
            Add Update
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetToNewUpdate}
              disabled={saving}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveUpdate}
              disabled={saving}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-sm text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              Save
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-300 bg-white">
        <div className="grid grid-cols-[minmax(10rem,14rem)_repeat(3,minmax(12rem,1fr))] border-b border-slate-300 bg-white text-sm font-semibold text-slate-900">
          <div className="border-r border-slate-300 px-4 py-3">Member</div>
          <div className="border-r border-slate-300 px-4 py-3">Did</div>
          <div className="border-r border-slate-300 px-4 py-3">Will Do</div>
          <div className="px-4 py-3">Blockers</div>
        </div>

        {members.length === 0 ? (
          <div className="px-4 py-3 text-sm text-slate-400">No members</div>
        ) : (
          members.map((member) => (
            <div
              key={member.id}
              className="grid grid-cols-[minmax(10rem,14rem)_repeat(3,minmax(12rem,1fr))] border-b border-slate-300 last:border-b-0"
            >
              <div className="flex items-start border-r border-slate-300 px-4 py-3 text-sm font-medium text-slate-900">
                {formatMemberName(member)}
              </div>
              {(["did", "willDo", "blockers"] as const).map((field, index) => (
                <div
                  key={field}
                  className={index < 2 ? "border-r border-slate-300" : ""}
                >
                  <textarea
                    ref={(textarea) => {
                      textareaRefs.current[`${member.id}-${field}`] = textarea;
                      if (textarea) resizeTextarea(textarea);
                    }}
                    value={form[member.id]?.[field] ?? ""}
                    onChange={(e) => {
                      handleCellChange(member.id, field, e.target.value);
                      resizeTextarea(e.currentTarget);
                    }}
                    className="block min-h-20 w-full resize-none overflow-hidden px-4 py-3 font-medium text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400"
                    aria-label={`${formatMemberName(member)} ${field}`}
                  />
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
