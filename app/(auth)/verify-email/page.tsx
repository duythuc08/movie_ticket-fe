"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { VerifyEmailForm } from "@/components/auth/components/VerifyEmailForm";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") ?? "";

  return (
    <VerifyEmailForm
      email={email}
      onClose={() => router.push("/login")}
    />
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
