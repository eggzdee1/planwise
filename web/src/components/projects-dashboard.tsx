"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Project } from "@/types/project";
import CreateProjectSidebar from "./create-project-sidebar";
import ProjectRow from "./project-row";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function ProjectsDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [openMenuProjectId, setOpenMenuProjectId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setOpenMenuProjectId(null);
    setEditingProjectId(null);
    setEditingName("");
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeMenu]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        if (!apiBaseUrl) {
          throw new Error("Missing NEXT_PUBLIC_API_URL");
        }

        setErrorMessage(null);
        const [projectsResponse, meResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/projects`, {
            method: "GET",
            credentials: "include",
          }),
          fetch(`${apiBaseUrl}/auth/me`, {
            method: "GET",
            credentials: "include",
          }),
        ]);

        if (!projectsResponse.ok || !meResponse.ok) {
          throw new Error("Failed to load projects");
        }

        const payload = (await projectsResponse.json()) as { projects: Project[] };
        const mePayload = (await meResponse.json()) as { user: { id: string } };
        setProjects(payload.projects);
        setCurrentUserId(mePayload.user.id);
      } catch {
        setErrorMessage("Could not load projects right now.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadProjects();
  }, []);

  const onCreateProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = projectName.trim();
    if (!name) return;

    try {
      if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_URL");

      setIsCreating(true);
      setErrorMessage(null);

      const response = await fetch(`${apiBaseUrl}/projects`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to create project");

      const payload = (await response.json()) as { project: Project };
      setProjects((current) => [payload.project, ...current]);
      setProjectName("");
    } catch {
      setErrorMessage("Could not create project right now.");
    } finally {
      setIsCreating(false);
    }
  };

  const onJoinProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const code = joinCode.trim();
    if (!code) return;

    try {
      if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_URL");

      setIsJoining(true);
      setErrorMessage(null);

      const response = await fetch(`${apiBaseUrl}/projects/join`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) throw new Error("Failed to join project");

      const payload = (await response.json()) as { project: Project };
      setProjects((current) => {
        if (current.some((project) => project.id === payload.project.id)) {
          return current;
        }

        return [payload.project, ...current];
      });
      setJoinCode("");
    } catch {
      setErrorMessage("Could not join project with that code.");
    } finally {
      setIsJoining(false);
    }
  };

  const cancelRename = () => {
    setEditingProjectId(null);
    setEditingName("");
  };

  const submitRename = async (projectId: string) => {
    const name = editingName.trim();
    if (!name || !apiBaseUrl) {
      cancelRename();
      return;
    }

    try {
      setIsUpdating(true);
      setErrorMessage(null);
      const response = await fetch(`${apiBaseUrl}/projects/${projectId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error("Failed to rename project");

      const payload = (await response.json()) as { project: Project };
      setProjects((current) =>
        current.map((p) => (p.id === projectId ? payload.project : p)),
      );
      cancelRename();
      closeMenu();
    } catch {
      setErrorMessage("Could not rename project.");
    } finally {
      setIsUpdating(false);
    }
  };

  const onDeleteProject = async (project: Project) => {
    closeMenu();
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) {
      return;
    }

    try {
      if (!apiBaseUrl) throw new Error("Missing NEXT_PUBLIC_API_URL");
      setIsUpdating(true);
      setErrorMessage(null);
      const response = await fetch(`${apiBaseUrl}/projects/${project.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to delete project");

      setProjects((current) => current.filter((p) => p.id !== project.id));
    } catch {
      setErrorMessage("Could not delete project.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="flex h-[calc(100vh-4rem)] w-full flex-col gap-6 overflow-hidden p-4 sm:p-6 lg:flex-row lg:gap-8">
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <table className="min-w-full table-fixed">
            <colgroup>
              <col />
              <col className="w-80" />
              <col className="w-18" />
            </colgroup>
            <thead className="border-b border-slate-300">
              <tr className="text-left text-s font-semibold tracking-wide text-slate-900">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Owner</th>
                <th className="w-18 px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-4 text-sm text-slate-400">
                    Loading projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-4 text-sm text-slate-400">
                    No projects
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <ProjectRow
                    key={project.id}
                    project={project}
                    currentUserId={currentUserId}
                    menuRef={menuRef}
                    isMenuOpen={openMenuProjectId === project.id}
                    isEditing={editingProjectId === project.id}
                    editingName={editingName}
                    isUpdating={isUpdating}
                    onNavigate={() => router.push(`/projects/${project.id}`)}
                    onToggleMenu={() =>
                      setOpenMenuProjectId((id) =>
                        id === project.id ? null : project.id,
                      )
                    }
                    onEditingNameChange={setEditingName}
                    onStartRename={() => {
                      setEditingProjectId(project.id);
                      setEditingName(project.name);
                    }}
                    onSubmitRename={() => void submitRename(project.id)}
                    onCancelRename={cancelRename}
                    onClose={closeMenu}
                    onDelete={() => void onDeleteProject(project)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateProjectSidebar
        projectName={projectName}
        joinCode={joinCode}
        isCreating={isCreating}
        isJoining={isJoining}
        errorMessage={errorMessage}
        onChange={setProjectName}
        onJoinCodeChange={setJoinCode}
        onSubmit={onCreateProject}
        onJoinSubmit={onJoinProject}
      />
    </section>
  );
}
