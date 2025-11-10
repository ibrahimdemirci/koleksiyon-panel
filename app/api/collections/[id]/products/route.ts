import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { maestroApi } from "@/lib/api";

type ProductsResponse =
  | {
      status?: number;
      message?: string | null;
      data?:
        | Array<unknown>
        | {
            meta?: unknown;
            data?: Array<unknown>;
          };
    }
  | Array<unknown>
  | null;

const DEFAULT_BODY = {
  additionalFilters: [],
  page: 1,
  pageSize: 36,
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing collection id" }, { status: 400 });
  }

  const session = await auth();
  const sessionTokens =
    session && typeof session === "object" && "tokens" in session
      ? (session as { tokens?: { accessToken?: unknown } }).tokens
      : undefined;
  const accessToken =
    sessionTokens && typeof sessionTokens.accessToken === "string"
      ? sessionTokens.accessToken
      : undefined;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientBody = await request.json().catch(() => null);
  const payload =
    clientBody && typeof clientBody === "object"
      ? clientBody
      : DEFAULT_BODY;

  try {
    const apiRes = await maestroApi<ProductsResponse>(
      `/Collection/${id}/GetProductsForConstants`,
      {
        method: "POST",
        token: accessToken,
        // senin ilk kodundaki gibi string gönderelim
        body: JSON.stringify(payload),
      },
    );
    
    console.log(
      "🔍 [products route] maestro response for id=" + id,
      JSON.stringify(apiRes, null, 2),
    );

    let products: unknown[] = [];

    if (Array.isArray(apiRes)) {
      products = apiRes as unknown[];
    } else if (apiRes && typeof apiRes === "object") {
      const rootData = (apiRes as { data?: unknown }).data;

      if (Array.isArray(rootData)) {
        products = rootData;
      } else if (
        rootData &&
        typeof rootData === "object" &&
        Array.isArray((rootData as { data?: unknown }).data)
      ) {
        products = (rootData as { data?: unknown[] }).data ?? [];
      }
    }

    // FE sadece array alsın
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    // burada 500’ü yutuyoruz ki sayfa açılabilsin
    console.error(
      "❌ [products route] failed for collection id=" + id,
      error,
    );
    return NextResponse.json([], { status: 200 });
  }
}
