import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import SignOutButton from "@/components/sign-out-button";

export default async function HomePage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-white p-8">
      <div className="mx-auto flex max-w-5xl items-start justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Home</h1>
        <SignOutButton />
      </div>
    </main>
  );
}
