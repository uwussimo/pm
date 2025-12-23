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

    const body = await request.text();
    const params = new URLSearchParams(body);
    const socketId = params.get("socket_id");
    const channelName = params.get("channel_name");

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: "Missing socket_id or channel_name" },
        { status: 400 }
      );
    }

    // Extract project ID from channel name (format: presence-project-{projectId})
    const projectIdMatch = channelName.match(/^presence-project-(.+)$/);
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
      include: {
        users: {
          where: {
            id: session.userId,
          },
          select: {
            id: true,
            email: true,
            name: true,
            githubUrl: true,
          },
        },
      },
    });

    if (!project || project.users.length === 0) {
      return NextResponse.json(
        { error: "Project not found or unauthorized" },
        { status: 404 }
      );
    }

    const user = project.users[0];
    const pusher = getPusherServer();

    // Create presence data with user info
    const presenceData = {
      user_id: user.id,
      user_info: {
        email: user.email,
        name: user.name || user.email.split("@")[0],
        githubUrl: user.githubUrl,
      },
    };

    const authResponse = pusher.authorizeChannel(
      socketId,
      channelName,
      presenceData
    );

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
