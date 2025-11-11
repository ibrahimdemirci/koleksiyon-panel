import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { maestroApi } from "@/lib/api";

type FiltersResponse = {
  status: number;
  data?: unknown[];
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json([], { status: 400 });
  }

  const session = await auth().catch(() => null);
  const sessionTokens =
    session && typeof session === "object" && "tokens" in session
      ? (session as { tokens?: { accessToken?: unknown } }).tokens
      : undefined;
  const accessToken =
    sessionTokens && typeof sessionTokens.accessToken === "string"
      ? sessionTokens.accessToken
      : undefined;

  try {
    const apiRes = await maestroApi<FiltersResponse>(
      `/Collection/${id}/GetFiltersForConstants`,
      {
        method: "GET",
        token: accessToken,
      },
    );

    const filters = Array.isArray(apiRes?.data) ? apiRes.data! : [];
    return NextResponse.json(filters, { status: 200 });
  } catch (error) {
    console.error("[filters route] failed", error);
    return NextResponse.json([], { status: 200 });
  }
}
