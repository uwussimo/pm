import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ProjectBoard } from "@/components/features/kanban/project-board";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await getSession();
  const { projectId } = await params;

  if (!session?.userId) {
    redirect("/signin");
  }

  return <ProjectBoard projectId={projectId} />;
}
