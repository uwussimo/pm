import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardHeader } from "@/components/features/dashboard/dashboard-header";
import { ProjectsList } from "@/components/features/projects/projects-list";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/signin");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      githubUrl: true,
    },
  });

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={user} />
      <main className="container mx-auto px-6 py-8">
        <ProjectsList />
      </main>
    </div>
  );
}
