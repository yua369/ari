import "dotenv/config";
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const SESSION_COOKIE = "fxpm_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30日

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET が未設定です（.env を確認してください）");
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function buildToken(userId: string, expiresAt: number) {
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(token: string | undefined): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAtRaw, sig] = parts;
  const payload = `${userId}.${expiresAtRaw}`;
  const expected = sign(payload);
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() >= expiresAt) return null;
  return userId;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const token = buildToken(userId, expiresAt);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

// 個人利用専用アプリのため、ログイン画面を廃止し常に唯一のオーナーアカウントとして動作する。
// セッションCookieがあればそれを優先するが(将来の拡張用に残す)、無ければDB内の最初のUserを自動的に使う。
let ownerUserPromise: Promise<Awaited<ReturnType<typeof getOrCreateOwnerUser>>> | null = null;

async function getOrCreateOwnerUser() {
  const existing = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return existing;
  const passwordHash = await hashPassword(sign(`owner-seed-${Date.now()}`));
  return prisma.user.create({
    data: {
      email: "owner@local",
      username: "yua",
      passwordHash,
      isAdmin: true,
    },
  });
}

export async function getCurrentUser() {
  const userId = await getCurrentUserId();
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) return user;
  }
  if (!ownerUserPromise) ownerUserPromise = getOrCreateOwnerUser();
  return ownerUserPromise;
}

/**
 * Server Component / Server Action の冒頭で呼ぶ。未認証なら /login へリダイレクト。
 * §37 Auth Redirect: Pageから呼ぶ場合はnextPathを渡すと、Login成功後に元の画面へ戻れる。
 */
export async function requireAuth(nextPath?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login");
  return user;
}

export async function requireAdmin(nextPath?: string) {
  const user = await requireAuth(nextPath);
  if (!user.isAdmin) redirect("/");
  return user;
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
