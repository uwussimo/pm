import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getSession();
    const { projectId } = await params;

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Check if current user is the project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.userId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you are not the owner" },
        { status: 403 }
      );
    }

    // Prevent owner from removing themselves
    if (userId === session.userId) {
      return NextResponse.json(
        { error: "Cannot remove yourself from your own project" },
        { status: 400 }
      );
    }

    // Remove user from project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        users: {
          disconnect: { id: userId },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Remove user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

