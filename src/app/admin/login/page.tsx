import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Admin sign in", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center bg-linen px-5">
      <div className="w-full max-w-sm">
        <p className="font-display text-3xl">
          Moon<span className="mx-1 inline-block h-2 w-2 rounded-full bg-sun align-middle" />Thread
        </p>
        <h1 className="mt-6 font-display text-2xl">Sign in to the shop admin</h1>
        <LoginForm next={next ?? "/admin"} />
      </div>
    </main>
  );
}
