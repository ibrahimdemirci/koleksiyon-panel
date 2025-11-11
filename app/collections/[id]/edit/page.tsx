import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { EditWorkspace } from "@/components/edit/EditWorkspace";
import { auth } from "@/lib/auth";

const DEFAULT_PRODUCTS_BODY = {
  additionalFilters: [],
  page: 1,
  pageSize: 36,
};

const DEFAULT_CONSTANT_LIMIT = 9;

type MaestroCollectionProduct = Record<string, unknown>;

type MaestroCollectionDetail = {
  id?: number | string;
  info?: {
    name?: string | null;
    description?: string | null;
    url?: string | null;
    [key: string]: unknown;
  };
  products?: MaestroCollectionProduct[] | null;
  [key: string]: unknown;
};

async function getBaseUrl() {
  const headerStore = await headers();
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  return (
    process.env.NEXTAUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (host ? `${protocol}://${host}` : null)
  );
}

async function fetchFilters(collectionId: string) {
  const baseUrl = await getBaseUrl();
  if (!baseUrl) return [];

  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? "";

  const response = await fetch(
    `${baseUrl}/api/collections/${collectionId}/filters`,
    {
      headers: {
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.warn("[filters] api not ok:", response.status);
    return [];
  }

  const json = await response.json();
  return Array.isArray(json) ? json : [];
}

async function fetchProducts(collectionId: string) {
  const baseUrl = await getBaseUrl();
  if (!baseUrl) return [];

  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? "";

  const response = await fetch(
    `${baseUrl}/api/collections/${collectionId}/products`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      body: JSON.stringify(DEFAULT_PRODUCTS_BODY),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    console.warn("[products] api not ok:", response.status);
    return [];
  }

  const json = await response.json();

  return Array.isArray(json) ? json : [];
}

async function fetchCollectionDetail(collectionId: string) {
  const baseUrl = await getBaseUrl();
  if (!baseUrl) return null;

  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? "";

  const response = await fetch(`${baseUrl}/api/collections`, {
    headers: {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.warn("[collection detail] api not ok:", response.status);
    return null;
  }

  const json = (await response.json()) as {
    data?: MaestroCollectionDetail[];
  };

  const collections = Array.isArray(json?.data) ? json.data : [];
  return (
    collections.find(
      (item) =>
        item &&
        typeof item === "object" &&
        String(item.id ?? "") === collectionId,
    ) ?? null
  );
}

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [filters, products, collectionDetail] = await Promise.all([
    fetchFilters(id),
    fetchProducts(id),
    fetchCollectionDetail(id),
  ]);

  const availableProducts = Array.isArray(products) ? products : [];
  const collectionProducts = Array.isArray(collectionDetail?.products)
    ? collectionDetail?.products ?? []
    : [];

  const initialConstants =
    collectionProducts.length > 0
      ? collectionProducts
      : availableProducts.slice(0, DEFAULT_CONSTANT_LIMIT);

  const collectionName =
    collectionDetail?.info?.name ??
    (typeof collectionDetail?.id === "number" ||
    typeof collectionDetail?.id === "string"
      ? `Koleksiyon ${collectionDetail?.id}`
      : "Koleksiyon Sabitleri");

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 container-7xl">
        <div className="rounded-3xl border border-white/60 bg-white/80 px-8 py-6 shadow-xl shadow-slate-900/10 backdrop-blur">
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            Koleksiyon #{id}
          </span>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">
            {collectionName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Ürünleri sürükleyip bırakarak sıralayın, filtreleri uygulayın ve
            kaydet butonuna basın.
          </p>
          <a
            href="/collections"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-900/5 transition hover:border-slate-300 hover:text-slate-900"
          >
            ← Koleksiyon listesine dön
          </a>
        </div>

        <EditWorkspace
          collectionId={id}
          initialFilters={filters}
          initialAvailableProducts={availableProducts}
          initialConstants={initialConstants}
          collectionInfo={{
            id: collectionDetail?.id,
            name: collectionName,
            totalProducts: Array.isArray(collectionDetail?.products)
              ? collectionDetail?.products?.length ?? undefined
              : undefined,
          }}
        />
      </div>
    </div>
  );
}
