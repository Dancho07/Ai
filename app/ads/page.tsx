import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdsPage() {
  const projects = (await prisma.adProject.findMany({ orderBy: { createdAt: "desc" }, take: 30 })) as any[];

  return (
    <div>
      <h1>Video Ads Studio</h1>
      <Link href="/ads/new">Create New Ad</Link>
      {projects.map((project) => (
        <div className="card" key={project.id}>
          <p><strong>{project.productRef}</strong> — {project.template} ({project.format})</p>
          <p>Status: {project.status}</p>
          {project.outputFilePath ? <a href={project.outputFilePath}>Download MP4</a> : null}
        </div>
      ))}
    </div>
  );
}
