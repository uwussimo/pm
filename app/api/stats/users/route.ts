import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching user count:", error);
    // Return a default value if DB fails
    return NextResponse.json({
      count: 100,
      recentUsers: [],
    });
  }
}
