// §48-55 Subscription。
// 本番では Stripe Checkout + Webhook でこの状態を更新する。
// 現状 STRIPE_SECRET_KEY が無いため、MOCK_BILLING=true の間はここで状態を直接書き換える
// 「モック決済」として動作する（実際の課金は一切発生しない）。
//
// 本番化の手順（概要）:
//  1. `npm i stripe` を追加し、STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / 価格IDを.envに設定
//  2. startCheckout() を Stripe Checkout Session作成 + redirect に置き換える
//  3. /api/billing/webhook で `customer.subscription.*` イベントを検証し、
//     Subscription テーブルを更新する処理に置き換える（このファイルの形はそのまま使える）
//  4. MOCK_BILLING を false にする

import { prisma } from "@/lib/db";

export function isMockBillingEnabled() {
  return process.env.MOCK_BILLING !== "false";
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function isUserPro(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({ where: { userId } });
  if (!sub) return false;
  if (sub.status === "active" || sub.status === "trialing") return true;
  if (sub.status === "canceled" && sub.currentPeriodEnd && sub.currentPeriodEnd.getTime() > Date.now()) {
    return true; // §55 解約後も期間終了までPRO
  }
  return false;
}

export async function startMockCheckout(userId: string, region: "JP" | "GLOBAL") {
  const priceId = region === "JP" ? "mock_price_jp_1000jpy" : "mock_price_global_15usd";
  const currency = region === "JP" ? "JPY" : "USD";
  await prisma.subscription.upsert({
    where: { userId },
    update: {
      status: "active",
      region,
      priceId,
      currency,
      currentPeriodEnd: new Date(Date.now() + THIRTY_DAYS_MS),
      stripeCustomerId: `mock_cus_${userId}`,
      stripeSubscriptionId: `mock_sub_${userId}_${Date.now()}`,
    },
    create: {
      userId,
      status: "active",
      region,
      priceId,
      currency,
      currentPeriodEnd: new Date(Date.now() + THIRTY_DAYS_MS),
      stripeCustomerId: `mock_cus_${userId}`,
      stripeSubscriptionId: `mock_sub_${userId}_${Date.now()}`,
    },
  });
}

export async function cancelMockSubscription(userId: string) {
  await prisma.subscription.update({
    where: { userId },
    data: { status: "canceled" },
  });
}
