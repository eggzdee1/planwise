"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { FiEdit2, FiMoreHorizontal, FiTrash2 } from "react-icons/fi";

type ProjectOwner = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

type Project = {
  id: string;
  name: string;
  createdAt: string;
  owner: ProjectOwner;
};

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function ProjectsDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectName, setProjectName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
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
        const response = await fetch(`${apiBaseUrl}/projects`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load projects");
        }

        const payload = (await response.json()) as { projects: Project[] };
        setProjects(payload.projects);
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
    if (!name) {
      return;
    }

    try {
      if (!apiBaseUrl) {
        throw new Error("Missing NEXT_PUBLIC_API_URL");
      }

      setIsCreating(true);
      setErrorMessage(null);

      const response = await fetch(`${apiBaseUrl}/projects`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const payload = (await response.json()) as { project: Project };
      setProjects((current) => [payload.project, ...current]);
      setProjectName("");
    } catch {
      setErrorMessage("Could not create project right now.");
    } finally {
      setIsCreating(false);
    }
  };

  const onRenameProject = (project: Project) => {
    setEditingProjectId(project.id);
    setEditingName(project.name);
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

      if (!response.ok) {
        throw new Error("Failed to rename project");
      }

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
      if (!apiBaseUrl) {
        throw new Error("Missing NEXT_PUBLIC_API_URL");
      }
      setIsUpdating(true);
      setErrorMessage(null);
      const response = await fetch(`${apiBaseUrl}/projects/${project.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete project");
      }

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
                  <tr
                    key={project.id}
                    className="border-b border-slate-300 text-sm text-slate-900 hover:bg-slate-200 cursor-pointer"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <td className="px-5 py-3 font-medium">
                      {project.name}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {/*
                        Loading pfp doesn't always work because of Google Auth API rate limits so just commenting this out for now. 
                        TODO: cache the image to get around this issue
                        {project.owner.image ? (
                          <img
                            src={project.owner.image}
                            alt={project.owner.name ?? "Owner profile image"}
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                            {(project.owner.name?.[0] ?? "U").toUpperCase()}
                          </div>
                        )}                       
                        */}
                        <span>{project.owner.name ?? project.owner.email ?? "Unknown owner"}</span>
                      </div>
                    </td>
                    <td className="relative px-5 py-3 text-right">
                      <div ref={openMenuProjectId === project.id ? menuRef : undefined} className="relative inline-block">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuProjectId((id) => (id === project.id ? null : project.id));
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-slate-500 hover:bg-slate-200"
                          aria-label={`More actions for ${project.name}`}
                          aria-expanded={openMenuProjectId === project.id}
                        >
                          <FiMoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenuProjectId === project.id && (
                          <div className="absolute right-0 top-full z-10 mt-1 min-w-[10rem] rounded-lg border border-slate-300 bg-white py-1 shadow-lg">
                            {editingProjectId === project.id ? (
                              <div className="space-y-2 px-3 py-2" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="text"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      void submitRename(project.id);
                                    }
                                    if (e.key === "Escape") {
                                      cancelRename();
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
                                    onClick={() => {
                                      cancelRename();
                                      closeMenu();
                                    }}
                                    className="rounded px-2 py-1 text-sm text-slate-900 hover:bg-slate-200"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void submitRename(project.id)}
                                    disabled={isUpdating || !editingName.trim()}
                                    className="rounded px-2 py-1 text-sm font-medium text-slate-900 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 border border-slate-300"
                                  >
                                    OK
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); onRenameProject(project); }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-900 hover:bg-slate-100"
                                >
                                  <FiEdit2 className="h-4 w-4 shrink-0" />
                                  Rename
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); void onDeleteProject(project); }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-700 hover:bg-slate-100"
                                >
                                  <FiTrash2 className="h-4 w-4 shrink-0" />
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="w-full rounded-xl border border-slate-300 bg-white p-5 shadow-sm lg:ml-auto lg:h-full lg:w-60">
        <h2 className="text-lg font-semibold text-slate-900">Create a new project</h2>
        <form onSubmit={onCreateProject} className="mt-3 space-y-3">
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            placeholder="Project name"
            autoComplete="off"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={isCreating || projectName.trim().length === 0}
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-400"
          >
            {isCreating ? "Creating..." : "Create"}
          </button>
        </form>
        {errorMessage ? <p className="mt-3 text-sm text-red-600">{errorMessage}</p> : null}
      </aside>
    </section>
  );
}
