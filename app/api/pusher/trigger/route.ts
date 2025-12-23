import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getPusherServer } from "@/lib/pusher-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channel, event, data } = await request.json();

    if (!channel || !event) {
      return NextResponse.json(
        { error: "Missing channel or event" },
        { status: 400 }
      );
    }

    // Extract project ID from channel name (format: project-{projectId})
    const projectIdMatch = channel.match(/^project-(.+)$/);
    if (!projectIdMatch) {
      return NextResponse.json(
        { error: "Invalid channel name" },
        { status: 400 }
      );
    }

    const projectId = projectIdMatch[1];

    // Verify user has access to this project
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

    const pusher = getPusherServer();
    await pusher.trigger(channel, event, {
      ...data,
      userId: session.userId,
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher trigger error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
