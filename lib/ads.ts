import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getAiProvider } from "@/lib/ai";

export const adTemplates = {
  problemSolutionCta: { name: "Problem → Solution → CTA", duration: "15-25s" },
  benefits3: { name: "3 Benefits", duration: "12-18s" },
  minimalPremium: { name: "Minimal Premium", duration: "10-15s" }
} as const;

export async function buildAdScript(product: string, template: keyof typeof adTemplates) {
  const ai = getAiProvider();
  return ai.generateCopy(`Create ${adTemplates[template].name} short ad script for ${product}. Include hook, captions, CTA.`);
}

export async function createAdProject(input: {
  storeUrl: string;
  productRef: string;
  template: keyof typeof adTemplates;
  format: "9:16" | "1:1" | "16:9";
  shopIdNullable?: string;
}) {
  const script = await buildAdScript(input.productRef, input.template);
  return prisma.adProject.create({
    data: {
      ...input,
      script,
      captionsJson: { lines: script.split("\n").slice(0, 5) }
    }
  });
}

export async function renderAdProject(projectId: string) {
  const project = await prisma.adProject.findUniqueOrThrow({ where: { id: projectId } });
  await prisma.adProject.update({ where: { id: projectId }, data: { status: "RENDERING" } });

  const output = path.join(process.cwd(), "public", `ads-${projectId}.mp4`);
  await fs.writeFile(output, Buffer.from("placeholder-video"));

  return prisma.adProject.update({
    where: { id: projectId },
    data: {
      status: "COMPLETE",
      outputFilePath: `/ads-${projectId}.mp4`
    }
  });
}
