import { cookies } from "next/headers";
import { prisma } from "./prisma";

const SESSION_COOKIE_NAME = "session";

export interface SessionData {
  userId: string;
  lineUserId: string;
}

// Create session
export async function createSession(userId: string, lineUserId: string) {
  const sessionData: SessionData = { userId, lineUserId };
  const sessionString = JSON.stringify(sessionData);

  // In production, you should encrypt this and use a proper session store
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionString, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

// Get session
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie) {
    return null;
  }

  try {
    const sessionData = JSON.parse(sessionCookie.value) as SessionData;
    return sessionData;
  } catch {
    return null;
  }
}

// Delete session
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Get current user from session
export async function getCurrentUser() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  return user;
}

// Require authentication (throws if not authenticated)
export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
