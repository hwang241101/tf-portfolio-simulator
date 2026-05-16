import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function getTargetBase(): string | null {
  const raw = process.env.API_PROXY_TARGET?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

async function proxy(
  request: NextRequest,
  pathSegments: string[],
): Promise<NextResponse> {
  const targetBase = getTargetBase();
  if (!targetBase) {
    return NextResponse.json(
      { error: "API_PROXY_TARGET is not set on the server" },
      { status: 503 },
    );
  }

  const path = pathSegments.join("/");
  const url = `${targetBase}/${path}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  const upstream = await fetch(url, init);
  const body = await upstream.text();
  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) responseHeaders.set("content-type", upstreamType);

  return new NextResponse(body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function withPath(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return withPath(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return withPath(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return withPath(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return withPath(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return withPath(request, context);
}
