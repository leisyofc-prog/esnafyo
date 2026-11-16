import { NextResponse } from "next/server";
import { clearSession, getCurrentUser } from "@/lib/auth";
import { writeActivity } from "@/lib/activity";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user) await writeActivity({ userId: user.id, area: "giris", action: "Çıkış yaptı", detail: user.email });
  await clearSession();
  return NextResponse.redirect(new URL("/", request.url), 303);
}
