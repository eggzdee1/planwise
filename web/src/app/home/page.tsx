import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAuthSession } from "@/auth";
import SignOutButton from "@/components/sign-out-button";

export default async function HomePage() {
  const session = await getAuthSession();

  if (!session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-300 bg-slate-50">
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
            My Projects
          </h1>
          <div>
            <SignOutButton />
          </div>
        </div>
      </header>
    </main>
  );
}
