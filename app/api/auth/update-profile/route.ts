import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, githubUrl } = await request.json();

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name || null,
        description: description || null,
        githubUrl: githubUrl || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        description: true,
        githubUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

