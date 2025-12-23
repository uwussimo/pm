import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Layers,
  Users,
  Zap,
  Shield,
  CheckCircle2,
  Star,
  GithubIcon,
} from "lucide-react";

async function getGitHubStars() {
  try {
    const res = await fetch("https://api.github.com/repos/uwussimo/pm.ai", {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.stargazers_count;
  } catch (error) {
    console.error("Failed to fetch GitHub stars:", error);
    return null;
  }
}

async function getUserStats() {
  try {
    const userCount = await prisma.user.count();

    // Get last 3 users for avatars
    const recentUsers = await prisma.user.findMany({
      take: 3,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return {
      count: userCount,
      recentUsers: recentUsers.map((user) => ({
        id: user.id,
        name: user.name || user.email.split("@")[0],
        initials: (user.name || user.email.split("@")[0])
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      })),
    };
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    return {
      count: 100,
      recentUsers: [],
    };
  }
}

export default async function Home() {
  const session = await getSession();

  if (session?.userId) {
    redirect("/dashboard");
  }

  const stars = await getGitHubStars();
  const userStats = await getUserStats();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between max-w-[980px]">
          <div className="text-xl font-semibold tracking-tight text-foreground">
            PM
          </div>
          <div className="flex items-center gap-3">
            <Link href="/signin">
              <Button variant="ghost" className="text-sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="text-sm gap-2">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-24 pb-16 max-w-[980px]">
        <div className="text-center space-y-6">
          <h1 className="text-[56px] font-semibold leading-[1.1] tracking-[-0.015em] text-foreground">
            Project management
            <br />
            made simple
          </h1>
          <p className="text-[21px] leading-[1.4] text-muted-foreground max-w-[600px] mx-auto">
            Keep your team aligned with a clean, focused workspace designed for
            clarity and speed
          </p>

          {/* Social Proof - Real User Avatars */}
          {userStats && userStats.count > 0 && (
            <div className="flex items-center justify-center gap-2 text-[15px] text-muted-foreground">
              <div className="flex -space-x-2">
                {userStats.recentUsers && userStats.recentUsers.length > 0 ? (
                  userStats.recentUsers.map((user: any, index: number) => {
                    const colors = [
                      "from-blue-500 to-purple-500",
                      "from-purple-500 to-pink-500",
                      "from-pink-500 to-orange-500",
                    ];
                    return (
                      <div
                        key={user.id}
                        className={`h-7 w-7 rounded-full bg-gradient-to-br ${colors[index]} border-2 border-background flex items-center justify-center text-[10px] font-semibold text-white shadow-sm`}
                        title={user.name}
                      >
                        {user.initials}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-background" />
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-background" />
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 border-2 border-background" />
                  </>
                )}
              </div>
              <span className="font-medium">
                <span className="text-foreground">{userStats.count}+</span>{" "}
                users joined
              </span>
            </div>
          )}

          <div className="pt-4 flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="text-base h-12 px-8 gap-2">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a
              href="https://github.com/uwussimo/pm.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 h-12 rounded-md border bg-background text-[15px] font-medium transition-colors hover:bg-muted"
            >
              <GithubIcon className="h-4 w-4" />
              <span>Star on GitHub</span>
              {stars !== null && (
                <span className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 rounded-full bg-foreground text-background text-[11px] font-semibold">
                  {stars}+
                </span>
              )}
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-16 max-w-[980px]">
        <div className="grid gap-8">
          {/* Feature 1 */}
          <div className="flex items-start gap-6 p-8 rounded-2xl border bg-card">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-foreground dark:bg-white flex items-center justify-center">
              <Layers className="h-6 w-6 text-background dark:text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-[24px] font-semibold tracking-tight text-foreground">
                Visual project boards
              </h3>
              <p className="text-[17px] leading-[1.5] text-muted-foreground">
                Organize work with intuitive kanban boards. Move tasks through
                stages and track progress at a glance
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start gap-6 p-8 rounded-2xl border bg-card">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-foreground dark:bg-primary flex items-center justify-center">
              <Users className="h-6 w-6 text-background dark:text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-[24px] font-semibold tracking-tight text-foreground">
                Team collaboration
              </h3>
              <p className="text-[17px] leading-[1.5] text-muted-foreground">
                Invite team members, assign tasks, and keep everyone on the same
                page with real-time updates
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start gap-6 p-8 rounded-2xl border bg-card">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-foreground dark:bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-background dark:text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-[24px] font-semibold tracking-tight text-foreground">
                Built for speed
              </h3>
              <p className="text-[17px] leading-[1.5] text-muted-foreground">
                Fast, responsive interface that keeps up with your workflow. No
                lag, no friction, just work
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-start gap-6 p-8 rounded-2xl border bg-card">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-foreground dark:bg-primary flex items-center justify-center">
              <Shield className="h-6 w-6 text-background dark:text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-[24px] font-semibold tracking-tight text-foreground">
                Secure by design
              </h3>
              <p className="text-[17px] leading-[1.5] text-muted-foreground">
                Your data is protected with enterprise-grade security. Focus on
                your work, not on worry
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="container mx-auto px-6 py-16 max-w-[980px]">
        <div className="rounded-2xl border bg-card p-12">
          <h2 className="text-[28px] font-semibold tracking-tight text-foreground mb-8 text-center">
            Everything you need
          </h2>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-4 max-w-[600px] mx-auto">
            {[
              "Unlimited projects",
              "Kanban boards",
              "Team collaboration",
              "Task assignments",
              "Custom statuses",
              "Due dates & tracking",
              "Comments & threads",
              "Real-time updates",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-foreground flex-shrink-0" />
                <span className="text-[17px] text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 max-w-[980px]">
        <div className="text-center space-y-6">
          <h2 className="text-[48px] font-semibold leading-[1.1] tracking-[-0.015em] text-foreground">
            Start building today
          </h2>
          <p className="text-[19px] text-muted-foreground">
            No credit card required. Get started in seconds
          </p>
          <div className="pt-4">
            <Link href="/signup">
              <Button size="lg" className="text-base h-12 px-8 gap-2">
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-6 py-8 max-w-[980px]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2024 PM. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/uwussimo/pm.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://github.com/uwussimo/pm.ai/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Support
              </a>
              <Link
                href="/signin"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
