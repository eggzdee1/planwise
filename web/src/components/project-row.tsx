"use client";

import { RefObject } from "react";
import { Project } from "@/types/project";
import ProjectActionsMenu from "./project-actions-menu";

type Props = {
  project: Project;
  currentUserId: string | null;
  menuRef: RefObject<HTMLDivElement | null>;
  isMenuOpen: boolean;
  isEditing: boolean;
  editingName: string;
  isUpdating: boolean;
  onNavigate: () => void;
  onToggleMenu: () => void;
  onEditingNameChange: (name: string) => void;
  onStartRename: () => void;
  onSubmitRename: () => void;
  onCancelRename: () => void;
  onClose: () => void;
  onDelete: () => void;
};

export default function ProjectRow({
  project,
  currentUserId,
  menuRef,
  isMenuOpen,
  isEditing,
  editingName,
  isUpdating,
  onNavigate,
  onToggleMenu,
  onEditingNameChange,
  onStartRename,
  onSubmitRename,
  onCancelRename,
  onClose,
  onDelete,
}: Props) {
  const isOwner = currentUserId === project.owner.id;

  return (
    <tr
      className="border-b border-slate-300 text-sm text-slate-900 hover:bg-slate-200 cursor-pointer"
      onClick={onNavigate}
    >
      <td className="px-5 py-3 font-medium">{project.name}</td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <span>{project.owner.name ?? project.owner.email ?? "Unknown owner"}</span>
        </div>
      </td>
      <td className="relative px-5 py-3 text-right">
        {isOwner ? (
          <div ref={isMenuOpen ? menuRef : undefined} className="relative inline-block">
            <ProjectActionsMenu
              project={project}
              isOpen={isMenuOpen}
              isEditing={isEditing}
              editingName={editingName}
              isUpdating={isUpdating}
              onToggleMenu={onToggleMenu}
              onEditingNameChange={onEditingNameChange}
              onStartRename={onStartRename}
              onSubmitRename={onSubmitRename}
              onCancelRename={onCancelRename}
              onClose={onClose}
              onDelete={onDelete}
            />
          </div>
        ) : null}
      </td>
    </tr>
  );
}
