import { NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteParams,
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Missing collection id" },
      { status: 400 },
    );
  }

  return NextResponse.json(
    { error: `No handler implemented for collection ${id}` },
    { status: 501 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Method not implemented" },
    { status: 405 },
  );
}

