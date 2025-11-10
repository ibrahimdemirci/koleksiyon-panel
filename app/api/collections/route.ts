// app/api/collections/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { maestroApi } from "@/lib/api";

// Backend'den gelen gerçek response'a uygun tip
type MaestroCollectionsResponse = {
  meta?: unknown;
  data?: unknown[]; // asıl listemiz burada
};

export async function GET() {
  // oturum var mı yok mu yine bakıyoruz ama bu endpoint'i 401'e düşürmeyelim,
  // çünkü Postman'de /Collection/GetAll headersız da dönüyor.
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
    // maestroApi senin wrapper'ın, aynen kullanalım
    const response = await maestroApi<MaestroCollectionsResponse>(
      "/Collection/GetAll",
      {
        method: "GET",
        // bazı ortamlarda token gerekirse göndersin, yoksa da göndersin zarar olmaz
        token: accessToken,
      },
    );

    // ASIL FİKS: backend data'yı response.data içinde veriyor
    const collections = Array.isArray(response?.data) ? response.data : [];

    // frontend'in hep aynı shape'i görmesi için objeyle dönüyoruz
    return NextResponse.json({ data: collections }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch collections", error);
    return NextResponse.json(
      { error: "Failed to fetch collections", data: [] },
      { status: 500 },
    );
  }
}
