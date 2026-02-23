"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export default function SignInButton() {
  return (
    <button
      type="button"
      onClick={() => signIn("google", { callbackUrl: "/home" })}
      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-200"
    >
      <span className="flex items-center justify-center gap-2">
        <FcGoogle className="h-7 w-7" />
        <span>Sign in with Google</span>
      </span>
    </button>
  );
}
