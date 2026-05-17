import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const authPrisma = prisma as any;

app.use(
  cors({
    origin: process.env.WEB_APP_URL ?? "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("API running");
});

type AuthenticatedRequest = express.Request & {
  userId?: string;
};

const getCookieValue = (rawCookie: string | undefined, key: string): string | null => {
  if (!rawCookie) {
    return null;
  }

  const match = rawCookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${key}=`));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(key.length + 1));
};

const getSessionTokenFromRequest = (req: express.Request): string | null => {
  const bearerToken = req.header("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (bearerToken) {
    return bearerToken;
  }

  const rawCookie = req.header("cookie");

  return (
    getCookieValue(rawCookie, "__Secure-authjs.session-token") ??
    getCookieValue(rawCookie, "authjs.session-token") ??
    getCookieValue(rawCookie, "__Secure-next-auth.session-token") ??
    getCookieValue(rawCookie, "next-auth.session-token")
  );
};

const requireSession = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction,
) => {
  const sessionToken = getSessionTokenFromRequest(req);

  if (!sessionToken) {
    return res.status(401).json({ error: "Missing session token" });
  }

  const session = await authPrisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expires <= new Date()) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  req.userId = session.userId;
  return next();
};

app.get("/auth/me", requireSession, async (req: AuthenticatedRequest, res) => {
  const user = await authPrisma.user.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ user });
});

app.get("/auth/users", async (_req, res) => {
  const users = await authPrisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    orderBy: { id: "asc" },
  });

  return res.json({ users });
});

app.get("/projects", requireSession, async (req: AuthenticatedRequest, res) => {
  const user = await authPrisma.user.findUnique({
    where: { id: req.userId },
    select: {
      activeProjects: {
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ projects: user.activeProjects });
});

app.post("/projects", requireSession, async (req: AuthenticatedRequest, res) => {
  const rawName = typeof req.body?.name === "string" ? req.body.name : "";
  const name = rawName.trim();

  if (!name) {
    return res.status(400).json({ error: "Project name is required" });
  }

  const project = await authPrisma.project.create({
    data: {
      name,
      ownerId: req.userId,
      members: {
        connect: [{ id: req.userId }],
      },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
        },
      },
    },
  });

  return res.status(201).json({ project });
});

app.patch("/projects/:id", requireSession, async (req: AuthenticatedRequest, res) => {
  const projectId = req.params.id;
  const rawName = typeof req.body?.name === "string" ? req.body.name : "";
  const name = rawName.trim();

  if (!name) {
    return res.status(400).json({ error: "Project name is required" });
  }

  const project = await authPrisma.project.findFirst({
    where: {
      id: projectId,
      members: { some: { id: req.userId } },
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
        },
      },
    },
  });

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const updated = await authPrisma.project.update({
    where: { id: projectId },
    data: { name },
    select: {
      id: true,
      name: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
        },
      },
    },
  });

  return res.json({ project: updated });
});

app.delete("/projects/:id", requireSession, async (req: AuthenticatedRequest, res) => {
  const projectId = req.params.id;

  const project = await authPrisma.project.findFirst({
    where: { id: projectId, ownerId: req.userId },
  });

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  await authPrisma.project.delete({
    where: { id: projectId },
  });

  return res.status(204).send();
});

// ── Task helpers ──────────────────────────────────────────────────────────────

const TASK_INCLUDE = {
  assignees: { select: { id: true, name: true, email: true } },
} as const;

const UPDATE_INCLUDE = {
  entries: {
    select: {
      memberId: true,
      did: true,
      willDo: true,
      blockers: true,
    },
  },
} as const;

const isMember = async (projectId: string | string[] | undefined, userId: string) =>
  authPrisma.project.findFirst({
    where: { id: projectId, members: { some: { id: userId } } },
  });

type ProjectUpdateInput = {
  memberId: string;
  did: string;
  willDo: string;
  blockers: string;
};

const parseProjectUpdateEntries = (body: unknown): ProjectUpdateInput[] => {
  const entries = Array.isArray((body as { entries?: unknown })?.entries)
    ? (body as { entries: unknown[] }).entries
    : [];

  return entries
    .map((entry) => {
      const value = entry as Record<string, unknown>;
      return {
        memberId: typeof value.memberId === "string" ? value.memberId : "",
        did: typeof value.did === "string" ? value.did : "",
        willDo: typeof value.willDo === "string" ? value.willDo : "",
        blockers: typeof value.blockers === "string" ? value.blockers : "",
      };
    })
    .filter((entry) => entry.memberId);
};

const keepMemberEntries = (
  entries: ProjectUpdateInput[],
  memberIds: Set<string>,
): ProjectUpdateInput[] => {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    if (!memberIds.has(entry.memberId) || seen.has(entry.memberId)) {
      return false;
    }
    seen.add(entry.memberId);
    return true;
  });
};

// ── Task routes ───────────────────────────────────────────────────────────────

app.get("/projects/:id/members", requireSession, async (req: AuthenticatedRequest, res) => {
  const projectId = req.params.id;
  const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : "";

  const project = await authPrisma.project.findFirst({
    where: { id: projectId, members: { some: { id: req.userId } } },
    select: { members: { select: { id: true, name: true, email: true } } },
  });

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const members = search
    ? project.members.filter((m: { name: string | null; email: string | null }) =>
        m.name?.toLowerCase().startsWith(search) ||
        m.email?.toLowerCase().startsWith(search),
      )
    : project.members;

  return res.json({ members });
});

app.get("/projects/:id/updates", requireSession, async (req: AuthenticatedRequest, res) => {
  const projectId = req.params.id;

  if (!(await isMember(projectId, req.userId!))) {
    return res.status(404).json({ error: "Project not found" });
  }

  const updates = await authPrisma.projectUpdate.findMany({
    where: { projectId },
    include: UPDATE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  return res.json({ updates });
});

app.post("/projects/:id/updates", requireSession, async (req: AuthenticatedRequest, res) => {
  const projectId = req.params.id;

  const project = await authPrisma.project.findFirst({
    where: { id: projectId, members: { some: { id: req.userId } } },
    select: { members: { select: { id: true } } },
  });

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const projectMembers = project.members as { id: string }[];
  const memberIds = new Set<string>(projectMembers.map((member) => member.id));
  const entries = keepMemberEntries(parseProjectUpdateEntries(req.body), memberIds);

  const update = await authPrisma.projectUpdate.create({
    data: {
      projectId,
      entries: {
        create: entries,
      },
    },
    include: UPDATE_INCLUDE,
  });

  return res.status(201).json({ update });
});

app.patch("/projects/:id/updates/:updateId", requireSession, async (req: AuthenticatedRequest, res) => {
  const { id: projectId, updateId } = req.params;

  const project = await authPrisma.project.findFirst({
    where: { id: projectId, members: { some: { id: req.userId } } },
    select: { members: { select: { id: true } } },
  });

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const existingUpdate = await authPrisma.projectUpdate.findFirst({
    where: { id: updateId, projectId },
    select: { id: true },
  });

  if (!existingUpdate) {
    return res.status(404).json({ error: "Update not found" });
  }

  const projectMembers = project.members as { id: string }[];
  const memberIds = new Set<string>(projectMembers.map((member) => member.id));
  const entries = keepMemberEntries(parseProjectUpdateEntries(req.body), memberIds);

  const update = await prisma.$transaction(async (tx) => {
    const txAny = tx as any;

    await txAny.projectUpdateEntry.deleteMany({ where: { updateId } });
    await txAny.projectUpdate.update({
      where: { id: updateId },
      data: {
        entries: {
          create: entries,
        },
      },
    });

    return txAny.projectUpdate.findUnique({
      where: { id: updateId },
      include: UPDATE_INCLUDE,
    });
  });

  return res.json({ update });
});

app.get("/projects/:id/tasks", requireSession, async (req: AuthenticatedRequest, res) => {
  const projectId = req.params.id;

  if (!(await isMember(projectId, req.userId!))) {
    return res.status(404).json({ error: "Project not found" });
  }

  const tasks = await authPrisma.task.findMany({
    where: { projectId },
    include: TASK_INCLUDE,
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  return res.json({ tasks });
});

app.post("/projects/:id/tasks", requireSession, async (req: AuthenticatedRequest, res) => {
  const projectId = req.params.id;

  if (!(await isMember(projectId, req.userId!))) {
    return res.status(404).json({ error: "Project not found" });
  }

  const rawName = typeof req.body?.name === "string" ? req.body.name : "";
  const name = rawName.trim();
  if (!name) {
    return res.status(400).json({ error: "Task name is required" });
  }

  const description = typeof req.body?.description === "string" ? req.body.description : "";
  const statusInput = req.body?.status;
  const status = ["TODO", "DOING", "DONE"].includes(statusInput) ? statusInput : "TODO";
  const assigneeIds: string[] = Array.isArray(req.body?.assigneeIds) ? req.body.assigneeIds : [];

  const agg = await authPrisma.task.aggregate({
    where: { projectId, status: "TODO" },
    _max: { position: true },
  });
  const position = status === "TODO" ? ((agg._max.position ?? -1) + 1) : 0;

  const task = await authPrisma.task.create({
    data: {
      name,
      description,
      status,
      statusAt: new Date(),
      position,
      projectId,
      assignees: { connect: assigneeIds.map((id: string) => ({ id })) },
    },
    include: TASK_INCLUDE,
  });

  return res.status(201).json({ task });
});

app.post("/projects/:id/tasks/reorder", requireSession, async (req: AuthenticatedRequest, res) => {
  const projectId = req.params.id;

  if (!(await isMember(projectId, req.userId!))) {
    return res.status(404).json({ error: "Project not found" });
  }

  const taskIds: string[] = Array.isArray(req.body?.taskIds) ? req.body.taskIds : [];

  await prisma.$transaction(
    taskIds.map((id: string, index: number) =>
      authPrisma.task.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  return res.status(204).send();
});

app.patch("/projects/:id/tasks/:taskId", requireSession, async (req: AuthenticatedRequest, res) => {
  const { id: projectId, taskId } = req.params;

  if (!(await isMember(projectId, req.userId!))) {
    return res.status(404).json({ error: "Project not found" });
  }

  const task = await authPrisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const updateData: Record<string, unknown> = {};

  if (typeof req.body?.name === "string") {
    const name = req.body.name.trim();
    if (!name) return res.status(400).json({ error: "Task name is required" });
    updateData.name = name;
  }

  if (typeof req.body?.description === "string") {
    updateData.description = req.body.description;
  }

  if (req.body?.status && ["TODO", "DOING", "DONE"].includes(req.body.status)) {
    if (req.body.status !== task.status) {
      updateData.status = req.body.status;
      updateData.statusAt = new Date();

      if (req.body.status === "TODO") {
        const agg = await authPrisma.task.aggregate({
          where: { projectId, status: "TODO" },
          _max: { position: true },
        });
        updateData.position = (agg._max.position ?? -1) + 1;
      }
    }
  }

  if (typeof req.body?.position === "number") {
    updateData.position = req.body.position;
  }

  const assigneesUpdate = Array.isArray(req.body?.assigneeIds)
    ? { assignees: { set: (req.body.assigneeIds as string[]).map((id) => ({ id })) } }
    : {};

  const updated = await authPrisma.task.update({
    where: { id: taskId },
    data: { ...updateData, ...assigneesUpdate },
    include: TASK_INCLUDE,
  });

  return res.json({ task: updated });
});

app.delete("/projects/:id/tasks/:taskId", requireSession, async (req: AuthenticatedRequest, res) => {
  const { id: projectId, taskId } = req.params;

  if (!(await isMember(projectId, req.userId!))) {
    return res.status(404).json({ error: "Project not found" });
  }

  const task = await authPrisma.task.findFirst({ where: { id: taskId, projectId } });
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  await authPrisma.task.delete({ where: { id: taskId } });

  return res.status(204).send();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/db-test", async (_req, res) => {
  await prisma.$connect();
  res.json({ status: "Database connected" });
});
