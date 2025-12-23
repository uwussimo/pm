import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SettingsContent } from "@/components/features/settings/settings-content";

export default async function SettingsPage() {
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
      description: true,
      githubUrl: true,
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-6 py-4 max-w-[980px]">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="h-8 w-px bg-border" />
            <h1 className="text-[21px] font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
              Settings
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-[980px]">
        <SettingsContent user={user} />
      </main>
    </div>
  );
}
