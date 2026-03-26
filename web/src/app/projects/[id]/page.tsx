import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";

type ProjectPageProps = {
  params: {
    id: string;
  };
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  const { id } = params;

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Project workspace</h1>
        <p className="mt-2 text-sm text-slate-500">Project ID: {id}</p>
      </div>
    </main>
  );
}

