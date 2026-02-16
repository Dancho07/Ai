import { NextResponse } from "next/server";
import { createAdProject } from "@/lib/ads";

export async function POST(req: Request) {
  const body = await req.json();
  const project = await createAdProject(body);
  return NextResponse.json({ id: project.id });
}
