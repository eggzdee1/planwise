import { redirect } from "next/navigation";
import { getAuthSession } from "@/auth";
import SignInButton from "@/components/sign-in-button";
import Image from "next/image";

export default async function SignInPage() {
  const session = await getAuthSession();

  if (session) {
    redirect("/home");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div>
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Planwise logo" width={50} height={50} />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 text-center">Welcome to Planwise</h1>
        <div className="mt-6">
          <SignInButton />
        </div>
      </div>
    </main>
  );
}
