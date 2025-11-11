import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { maestroApi } from "@/lib/api";

// Backend'den gelen gerçek response'a uygun tip
type MaestroCollectionsResponse = {
  meta?: unknown;
  data?: unknown[]; // asıl listemiz burada
};

export async function GET() {
  const session = await auth();
  const tokens =
    session && typeof session === "object" && "tokens" in session
      ? (session as { tokens?: { accessToken?: unknown } }).tokens
      : undefined;
  const accessToken =
    tokens && typeof tokens.accessToken === "string"
      ? tokens.accessToken
      : undefined;

  try {
    const response = await maestroApi<MaestroCollectionsResponse>(
      "/Collection/GetAll",
      {
        method: "GET",
        token: accessToken,
      },
    );

    const collections = Array.isArray(response?.data) ? response.data : [];

    return NextResponse.json({ data: collections }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch collections", error);
    return NextResponse.json(
      { error: "Failed to fetch collections", data: [] },
      { status: 500 },
    );
  }
}
