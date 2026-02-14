import { NextResponse } from "next/server";
import { renderAdProject } from "@/lib/ads";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const project = await renderAdProject(params.id);
  return NextResponse.json(project);
}
