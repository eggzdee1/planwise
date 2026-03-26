"use client";

import { FiEdit2, FiMoreHorizontal, FiTrash2 } from "react-icons/fi";
import { Project } from "@/types/project";

type Props = {
  project: Project;
  isOpen: boolean;
  isEditing: boolean;
  editingName: string;
  isUpdating: boolean;
  onToggleMenu: () => void;
  onEditingNameChange: (name: string) => void;
  onStartRename: () => void;
  onSubmitRename: () => void;
  onCancelRename: () => void;
  onClose: () => void;
  onDelete: () => void;
};

export default function ProjectActionsMenu({
  project,
  isOpen,
  isEditing,
  editingName,
  isUpdating,
  onToggleMenu,
  onEditingNameChange,
  onStartRename,
  onSubmitRename,
  onCancelRename,
  onClose,
  onDelete,
}: Props) {
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu();
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-slate-500 hover:bg-slate-300"
        aria-label={`More actions for ${project.name}`}
        aria-expanded={isOpen}
      >
        <FiMoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-1 min-w-[10rem] rounded-lg border border-slate-300 bg-white py-1 shadow-lg">
          {isEditing ? (
            <div className="space-y-2 px-3 py-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={editingName}
                onChange={(e) => onEditingNameChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSubmitRename();
                  }
                  if (e.key === "Escape") {
                    onCancelRename();
                  }
                }}
                disabled={isUpdating}
                autoFocus
                placeholder="Project name"
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  onClick={() => onClose()}
                  className="rounded px-2 py-1 text-sm text-slate-900 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSubmitRename}
                  disabled={isUpdating || !editingName.trim()}
                  className="rounded border border-slate-300 px-2 py-1 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  OK
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onStartRename(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-100"
              >
                <FiEdit2 className="h-4 w-4 shrink-0" />
                Rename
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-slate-100"
              >
                <FiTrash2 className="h-4 w-4 shrink-0" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
