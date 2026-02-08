import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("API running");
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const prisma = new PrismaClient();

app.get("/db-test", async (_req, res) => {
  await prisma.$connect();
  res.json({ status: "Database connected" });
});