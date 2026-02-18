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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.get("/db-test", async (_req, res) => {
  await prisma.$connect();
  res.json({ status: "Database connected" });
});
