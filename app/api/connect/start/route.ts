import { NextResponse } from "next/server";
import { shopifyAuthUrl } from "@/lib/shopify";

export async function POST(req: Request) {
  const { shopDomain, writeProducts, writeThemes } = await req.json();
  if (!shopDomain?.endsWith(".myshopify.com")) {
    return NextResponse.json({ error: "Please provide a valid myshopify domain." }, { status: 400 });
  }
  const { url, scopes } = shopifyAuthUrl(shopDomain, Boolean(writeProducts), Boolean(writeThemes));
  return NextResponse.json({ url, scopes });
}
