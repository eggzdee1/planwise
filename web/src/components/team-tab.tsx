"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiCopy } from "react-icons/fi";
import type { ProjectMember } from "@/types/project-update";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

type Props = {
  projectId: string;
  currentUser: { id: string; name: string | null };
};

type MembersResponse = {
  members: ProjectMember[];
  ownerId: string;
};

const formatMemberName = (member: ProjectMember) => member.name ?? member.email ?? "Unknown";

export default function TeamTab({ projectId, currentUser }: Props) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingMemberId, setWorkingMemberId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean } | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOwner = ownerId === currentUser.id;

  const showToast = useCallback((message: string) => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    setToast({ message, visible: true });
    fadeTimerRef.current = setTimeout(() => {
      setToast((current) => current ? { ...current, visible: false } : current);
    }, 1600);
    clearTimerRef.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/members`, {
        credentials: "include",
      });

      if (!res.ok) return;

      const data = (await res.json()) as MembersResponse;
      setMembers(data.members);
      setOwnerId(data.ownerId);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  const handleGenerateCode = async () => {
    if (!isOwner || generating) return;

    setGenerating(true);
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/invites`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) return;

      const data = (await res.json()) as { code: string; expiresAt: string };
      await copyText(data.code);
      showToast(`Join code ${data.code} copied to your clipboard!`);
    } finally {
      setGenerating(false);
    }
  };

  const handleRemoveMember = async (member: ProjectMember) => {
    if (!isOwner || member.id === ownerId || workingMemberId) return;

    if (!confirm(`Remove ${formatMemberName(member)} from this project?`)) {
      return;
    }

    setWorkingMemberId(member.id);
    try {
      const res = await fetch(`${apiBaseUrl}/projects/${projectId}/members/${member.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) return;

      setMembers((current) => current.filter((item) => item.id !== member.id));
    } finally {
      setWorkingMemberId(null);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-400">Loading...</div>;
  }

  return (
    <div className="flex min-h-full flex-col gap-4">
      <div className="relative flex min-h-10 items-center">
        {toast && (
          <div
            className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 shadow-sm transition-opacity duration-500 ${
              toast.visible ? "opacity-100" : "opacity-0"
            }`}
          >
            {toast.message}
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerateCode}
          disabled={!isOwner || generating}
          className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:border-slate-300 disabled:text-slate-500"
        >
          {generating ? "Generating..." : "Generate join code"}
          <FiCopy className="h-[1.1em] w-[1.1em] shrink-0" />
        </button>
      </div>

      <div className="overflow-hidden">
        <table className="min-w-full table-fixed">
          <colgroup>
            <col />
            <col className="w-80" />
            <col className="w-18" />
          </colgroup>
          <thead className="border-b border-slate-300">
            <tr className="text-left text-sm font-semibold tracking-wide text-slate-900">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-5 py-4 text-sm text-slate-400">
                  No members
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const memberIsOwner = member.id === ownerId;

                return (
                  <tr
                    key={member.id}
                    className="border-b border-slate-300 text-sm text-slate-900"
                  >
                    <td className="px-5 py-3 font-medium">{formatMemberName(member)}</td>
                    <td className="px-5 py-3">{memberIsOwner ? "Owner" : "Member"}</td>
                    <td className="px-5 py-3 text-right">
                      {isOwner && !memberIsOwner ? (
                        <button
                          type="button"
                          onClick={() => void handleRemoveMember(member)}
                          disabled={workingMemberId === member.id}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          {workingMemberId === member.id ? "Removing..." : "Remove"}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
