import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import SignInButton from "@/components/sign-in-button";

export default async function SignInPage() {
  const session = await getAuthSession();

  if (session) {
    redirect("/home");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-600 text-center">Sign in</h1>
        <div className="mt-6">
          <SignInButton />
        </div>
      </div>
    </main>
  );
}
