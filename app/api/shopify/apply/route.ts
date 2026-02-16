import { NextResponse } from "next/server";
import { updateProductTitle } from "@/lib/shopify";

export async function POST(req: Request) {
  const body = await req.json();
  const payload = await updateProductTitle(body.shopId, body.productId, body.title);
  return NextResponse.json({ ok: true, payload });
}
