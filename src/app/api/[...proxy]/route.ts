import { NextRequest } from "next/server";

const WORKER_BASE = process.env.WORKER_BASE_URL || "http://127.0.0.1:3000";

export async function POST(req: NextRequest, { params }: { params: { proxy: string[] } }) {
  const path = params.proxy.join("/");
  const url = `${WORKER_BASE}/${path}`;
  const init: RequestInit = {
    method: "POST",
    headers: {
      "content-type": req.headers.get("content-type") || "application/json",
    },
    body: await req.text(),
  };
  const res = await fetch(url, init);
  return new Response(await res.text(), { status: res.status, headers: res.headers });
}

export async function GET(_req: NextRequest, { params }: { params: { proxy: string[] } }) {
  const path = params.proxy.join("/");
  const url = `${WORKER_BASE}/${path}`;
  const res = await fetch(url);
  return new Response(await res.text(), { status: res.status, headers: res.headers });
}




