import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  if (await getSession()) redirect("/");

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4">
      <div
        aria-hidden
        className="float-blob pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle,#15cae855,transparent 70%)" }}
      />
      <div
        aria-hidden
        className="float-blob pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full"
        style={{
          background: "radial-gradient(circle,#131b6326,transparent 70%)",
          animationDelay: "-6s",
        }}
      />
      <LoginForm />
    </main>
  );
}
