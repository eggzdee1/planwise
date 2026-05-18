"use client";

import { FormEvent } from "react";

type Props = {
  projectName: string;
  joinCode: string;
  isCreating: boolean;
  isJoining: boolean;
  errorMessage: string | null;
  onChange: (name: string) => void;
  onJoinCodeChange: (code: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onJoinSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function CreateProjectSidebar({
  projectName,
  joinCode,
  isCreating,
  isJoining,
  errorMessage,
  onChange,
  onJoinCodeChange,
  onSubmit,
  onJoinSubmit,
}: Props) {
  return (
    <aside className="w-full rounded-xl border border-slate-300 bg-white p-5 shadow-sm lg:ml-auto lg:h-full lg:w-70">
      <h2 className="text-lg font-semibold text-slate-900">Create a new project</h2>
      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <input
          id="project-name"
          type="text"
          value={projectName}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Project name"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isCreating || projectName.trim().length === 0}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
        >
          {isCreating ? "Creating..." : "Create"}
        </button>
      </form>

      <div className="my-5 flex items-center justify-center text-sm font-medium text-slate-400">
        or
      </div>

      <h2 className="text-lg font-semibold text-slate-900">Join an existing project</h2>
      <form onSubmit={onJoinSubmit} className="mt-3 space-y-3">
        <input
          id="join-code"
          type="text"
          value={joinCode}
          onChange={(event) => onJoinCodeChange(event.target.value)}
          placeholder="Code"
          autoComplete="off"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={isJoining || joinCode.trim().length === 0}
          className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
        >
          {isJoining ? "Joining..." : "Join"}
        </button>
      </form>
      {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
    </aside>
  );
}
