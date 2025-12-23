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

    const {
      title,
      description,
      statusId,
      assigneeId,
      startDate,
      dueDate,
      imageUrl,
    } = await request.json();

    if (!title || !statusId) {
      return NextResponse.json(
        { error: "Title and status are required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        users: {
          some: {
            id: session.userId,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        statusId,
        projectId,
        ...(assigneeId && { assigneeId }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(imageUrl && { imageUrl }),
      },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
            name: true,
            githubUrl: true,
          },
        },
        status: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
