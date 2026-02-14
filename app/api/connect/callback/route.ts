import { NextResponse } from "next/server";
import { exchangeCode } from "@/lib/shopify";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");
  if (!shop || !code) return NextResponse.json({ error: "Missing shop/code" }, { status: 400 });

  await exchangeCode(shop, code);
  return NextResponse.redirect(`${process.env.APP_URL}/settings?connected=1`);
}
