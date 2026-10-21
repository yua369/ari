"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { startMockCheckout, cancelMockSubscription, isMockBillingEnabled } from "@/lib/billing";

export async function startCheckoutAction(region: "JP" | "GLOBAL") {
  const user = await requireAuth();
  if (!isMockBillingEnabled()) {
    throw new Error("Stripeが未設定です。本番のCheckoutはまだ有効化されていません。");
  }
  await startMockCheckout(user.id, region);
  revalidatePath("/pricing");
  revalidatePath("/mypage");
}

export async function cancelSubscriptionAction() {
  const user = await requireAuth();
  await cancelMockSubscription(user.id);
  revalidatePath("/pricing");
  revalidatePath("/mypage");
}
