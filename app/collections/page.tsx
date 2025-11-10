// app/collections/page.tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CollectionsTable } from "@/components/collections/CollectionsTable";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { auth } from "@/lib/auth";

type MaestroCollection = {
  id: string;
  info?: {
    name?: string;
  };
  salesChannelId?: string | number;
  [key: string]: unknown;
};

type CollectionsApiResponse = {
  data?: MaestroCollection[];
};

async function fetchCollections(): Promise<MaestroCollection[]> {
  const headersList = await headers();
  const cookieHeader = headersList.get("cookie") ?? "";
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const baseUrl =
    process.env.NEXTAUTH_URL ?? (host ? `${protocol}://${host}` : null);

  if (!baseUrl) {
    throw new Error("Cannot determine base URL for internal API call.");
  }

  const response = await fetch(`${baseUrl}/api/collections`, {
    headers: {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("[Collections] API not ok:", response.status);
    return [];
  }

  // BURAYA DİKKAT: API artık { data: [...] } dönüyor
  const json = (await response.json()) as CollectionsApiResponse;
  const collections = Array.isArray(json.data) ? json.data : [];
  
  return collections;
}

export default async function CollectionsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const collections = await fetchCollections();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 lg:py-16">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
              Maestro Koleksiyonları
            </span>
            <h1 className="mt-4 text-3xl font-semibold text-slate-900">
              Koleksiyonlarınızı yönetin
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Koleksiyon sabitlerini düzenleyin, filtreleyin ve ürün
              sıralamalarını tek bir panelden yönetin.
            </p>
          </div>
          <SignOutButton />
        </div>
        <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl shadow-slate-900/10 backdrop-blur">
          <CollectionsTable collections={collections} />
        </div>
      </div>
    </div>
  );
}
