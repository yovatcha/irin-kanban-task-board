import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth";

async function logoutAndRedirect(request: NextRequest) {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}

export async function POST(request: NextRequest) {
  return logoutAndRedirect(request);
}

export async function GET(request: NextRequest) {
  return logoutAndRedirect(request);
}
