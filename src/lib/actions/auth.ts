"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { isRateLimited } from "@/lib/rateLimit";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function safeNext(value: FormDataEntryValue | null): string {
  const v = typeof value === "string" ? value : "";
  // Open Redirect対策: 同一オリジンの絶対パスのみ許可する。
  return v.startsWith("/") && !v.startsWith("//") ? v : "/";
}

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function signupAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  // §57 Rate Limit: 同一IPからの大量アカウント作成を抑止
  const ip = await clientIp();
  if (isRateLimited(`signup:${ip}`, 10, 60 * 60 * 1000)) {
    return { error: "しばらく時間をおいてから再度お試しください" };
  }

  if (!isValidEmail(email)) return { error: "メールアドレスの形式が正しくありません" };
  if (!isValidUsername(username)) return { error: "ユーザー名は英数字とアンダースコアで3〜20文字にしてください" };
  if (password.length < 8) return { error: "パスワードは8文字以上にしてください" };

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) return { error: "このメールアドレスまたはユーザー名は既に使われています" };

  const passwordHash = await hashPassword(password);
  const userCount = await prisma.user.count();
  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      // §102 段階的ローンチ: 最初のユーザーを管理者にする
      isAdmin: userCount === 0,
      subscription: { create: { status: "free" } },
    },
  });

  await createSession(user.id);
  redirect(next);
}

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const emailOrUsername = String(formData.get("emailOrUsername") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!emailOrUsername || !password) return { error: "入力してください" };

  // §57 Rate Limit / §56 Security: ブルートフォース対策。IP単位・アカウント単位の両方で制限する。
  const ip = await clientIp();
  if (isRateLimited(`login-ip:${ip}`, 20, 5 * 60 * 1000) || isRateLimited(`login-id:${emailOrUsername}`, 10, 5 * 60 * 1000)) {
    return { error: "試行回数が多すぎます。5分ほど待ってから再度お試しください" };
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
  });
  if (!user) return { error: "メールアドレス/ユーザー名またはパスワードが違います" };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "メールアドレス/ユーザー名またはパスワードが違います" };

  await createSession(user.id);
  redirect(next);
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
