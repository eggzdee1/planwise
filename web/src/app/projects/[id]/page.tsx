import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/sign-out-button";
import ProjectTabs from "@/components/project-tabs";

type ProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id,
      memberships: { some: { userId: session.user.id } },
    },
    select: { name: true },
  });

  if (!project) {
    redirect("/home");
  }

  return (
    <main className="h-screen overflow-hidden bg-slate-200">
      <header className="border-b border-slate-300 bg-white">
        <div className="relative flex h-16 items-center justify-between px-4">
          <div className="flex h-full items-center">
            <Link href="/home" className="flex h-full items-center" aria-label="Go to home">
              <Image
                src="/logo.png"
                alt="Planwise logo"
                width={40}
                height={40}
                priority
                className="block"
              />
            </Link>
          </div>
          <h1 className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-base font-semibold text-slate-900 sm:text-lg">
            {project.name}
          </h1>
          <div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <ProjectTabs projectId={id} currentUser={{ id: session.user.id, name: session.user.name ?? null }} />
    </main>
  );
}
