import crypto from "crypto";
import { decryptToken, encryptToken } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

const baseScopes = ["read_products", "read_content"];

export function shopifyAuthUrl(shopDomain: string, writeEnabled = false, themeEnabled = false) {
  const scopes = [...baseScopes];
  if (writeEnabled) scopes.push("write_products");
  if (themeEnabled) scopes.push("write_themes");

  const state = crypto.randomUUID();
  const redirectUri = `${process.env.APP_URL}/api/connect/callback`;
  const params = new URLSearchParams({
    client_id: process.env.SHOPIFY_API_KEY ?? "",
    scope: scopes.join(","),
    redirect_uri: redirectUri,
    state
  });

  return {
    url: `https://${shopDomain}/admin/oauth/authorize?${params.toString()}`,
    state,
    scopes
  };
}

export async function exchangeCode(shop: string, code: string) {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code
    })
  });
  if (!response.ok) throw new Error("Failed to exchange OAuth code.");
  const data = await response.json();

  return prisma.shop.upsert({
    where: { shopDomain: shop },
    update: { accessTokenEncrypted: encryptToken(data.access_token) },
    create: { shopDomain: shop, accessTokenEncrypted: encryptToken(data.access_token) }
  });
}

export async function updateProductTitle(shopId: string, productId: string, title: string) {
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } });
  const token = decryptToken(shop.accessTokenEncrypted);
  const query = `mutation productUpdate($input: ProductInput!) { productUpdate(input: $input) { product { id title } userErrors { field message } } }`;

  const res = await fetch(`https://${shop.shopDomain}/admin/api/2024-07/graphql.json`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-shopify-access-token": token
    },
    body: JSON.stringify({ query, variables: { input: { id: productId, title } } })
  });

  const payload = await res.json();
  await prisma.actionLog.create({
    data: {
      shopId,
      actionType: "UPDATE_PRODUCT_TITLE",
      payloadJson: { productId, title, payload }
    }
  });

  return payload;
}
