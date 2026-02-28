import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

const LINE_LOGIN_CHANNEL_ID = process.env.LINE_LOGIN_CHANNEL_ID!;
const LINE_LOGIN_CHANNEL_SECRET = process.env.LINE_LOGIN_CHANNEL_SECRET!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${APP_URL}/api/auth/line`,
        client_id: LINE_LOGIN_CHANNEL_ID,
        client_secret: LINE_LOGIN_CHANNEL_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("LINE token error:", errorData);
      throw new Error(
        `Failed to get access token: ${JSON.stringify(errorData)}`,
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error("No access token in response:", tokenData);
      throw new Error("No access token received");
    }

    // Get user profile
    const profileResponse = await fetch("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.error("LINE profile error:", errorData);
      throw new Error(
        `Failed to get user profile: ${JSON.stringify(errorData)}`,
      );
    }

    const profile = await profileResponse.json();
    console.log("LINE profile received:", {
      userId: profile.userId,
      displayName: profile.displayName,
    });

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { lineUserId: profile.userId },
      update: {
        name: profile.displayName,
        avatarUrl: profile.pictureUrl,
      },
      create: {
        lineUserId: profile.userId,
        name: profile.displayName,
        avatarUrl: profile.pictureUrl,
      },
    });

    console.log("User created/updated:", user.id);

    // Create session
    await createSession(user.id, user.lineUserId);

    console.log("Session created, redirecting to dashboard");

    // Redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", APP_URL));
  } catch (error) {
    console.error("LINE login error:", error);
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
