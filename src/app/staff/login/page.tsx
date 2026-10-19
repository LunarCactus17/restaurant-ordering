import { StaffLoginForm } from "@/components/ordering/staff-login-form";
import { getAuthenticatedManager } from "@/lib/auth";
import { redirect } from "next/navigation";

type StaffLoginPageProps = {
  searchParams?: Promise<{
    next?: string;
  }>;
};

export default async function StaffLoginPage({ searchParams }: StaffLoginPageProps) {
  const manager = await getAuthenticatedManager();

  if (manager) {
    redirect("/staff");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const nextPath = resolvedSearchParams?.next?.startsWith("/staff")
    ? resolvedSearchParams.next
    : "/staff";

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center gap-6">
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Staff access
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Manager sign in
          </h1>
          <p className="text-sm leading-6 text-slate-600">
            This staff website is protected. Sign in with the owner manager account to continue.
          </p>
        </div>

        <StaffLoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
