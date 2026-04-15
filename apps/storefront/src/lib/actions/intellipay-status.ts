"use server";

import {
  db,
  orders,
  payments,
  tenantPaymentConfigs,
  queryPayment,
  eq,
  and,
} from "@macau-pos/database";
import { resolveTenant } from "@/lib/tenant-resolver";

export type OnlinePaymentStatus = {
  orderStatus: "pending" | "completed" | "refunded" | "voided";
  intellipayStatus: number | null;
  intellipayStatusDesc: string | null;
  paymentUrl: string | null;
};

function mapIpStatusToOrderStatus(
  status: number | null | undefined,
): "completed" | "refunded" | "voided" | null {
  if (status == null) return null;
  switch (status) {
    case 2:
    case 3:
    case 4:
      return "completed";
    case 10:
    case 11:
      return "refunded";
    case 5:
    case 6:
    case 8:
    case 13:
      return "voided";
    default:
      return null;
  }
}

export async function getOnlinePaymentStatus(
  orderNumber: string,
): Promise<
  | { success: true; data: OnlinePaymentStatus }
  | { success: false; error: string }
> {
  const tenant = await resolveTenant();
  if (!tenant) return { success: false, error: "Tenant not found" };

  const [row] = await db
    .select({
      paymentId: payments.id,
      orderId: orders.id,
      orderStatus: orders.status,
      intellipayPaymentId: payments.intellipayPaymentId,
      intellipayStatus: payments.intellipayStatus,
      intellipayStatusDesc: payments.intellipayStatusDesc,
      intellipayPaymentUrl: payments.intellipayPaymentUrl,
    })
    .from(orders)
    .innerJoin(payments, eq(payments.orderId, orders.id))
    .where(
      and(
        eq(orders.tenantId, tenant.id),
        eq(orders.orderNumber, orderNumber),
        eq(orders.channel, "online"),
      ),
    )
    .limit(1);

  if (!row) return { success: false, error: "Order not found" };

  if (row.orderStatus !== "pending" || !row.intellipayPaymentId) {
    return {
      success: true,
      data: {
        orderStatus: row.orderStatus as OnlinePaymentStatus["orderStatus"],
        intellipayStatus: row.intellipayStatus,
        intellipayStatusDesc: row.intellipayStatusDesc,
        paymentUrl: row.intellipayPaymentUrl,
      },
    };
  }

  const [paymentConfig] = await db
    .select()
    .from(tenantPaymentConfigs)
    .where(eq(tenantPaymentConfigs.tenantId, tenant.id))
    .limit(1);
  if (!paymentConfig?.accessKeyId || !paymentConfig.privateKeyPemEncrypted) {
    return {
      success: true,
      data: {
        orderStatus: row.orderStatus as OnlinePaymentStatus["orderStatus"],
        intellipayStatus: row.intellipayStatus,
        intellipayStatusDesc: row.intellipayStatusDesc,
        paymentUrl: row.intellipayPaymentUrl,
      },
    };
  }

  const ipRes = await queryPayment(
    {
      accessKeyId: paymentConfig.accessKeyId,
      privateKeyPemEncrypted: paymentConfig.privateKeyPemEncrypted,
    },
    row.intellipayPaymentId,
    { timeoutMs: 5_000 },
  );

  if (!ipRes.ok) {
    console.warn(
      `[getOnlinePaymentStatus] query failed: ${ipRes.errorCode} ${ipRes.message}`,
    );
    return {
      success: true,
      data: {
        orderStatus: row.orderStatus as OnlinePaymentStatus["orderStatus"],
        intellipayStatus: row.intellipayStatus,
        intellipayStatusDesc: row.intellipayStatusDesc,
        paymentUrl: row.intellipayPaymentUrl,
      },
    };
  }

  const ipStatus = ipRes.data.status ?? null;
  const mapped = mapIpStatusToOrderStatus(ipStatus);
  if (!mapped) {
    return {
      success: true,
      data: {
        orderStatus: row.orderStatus as OnlinePaymentStatus["orderStatus"],
        intellipayStatus: ipStatus,
        intellipayStatusDesc:
          ipRes.data.status_desc ?? row.intellipayStatusDesc,
        paymentUrl: row.intellipayPaymentUrl,
      },
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(payments)
      .set({
        intellipayStatus: ipStatus,
        intellipayStatusDesc: ipRes.data.status_desc ?? null,
        intellipayLastEventAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, row.paymentId));
    await tx
      .update(orders)
      .set({ status: mapped })
      .where(and(eq(orders.id, row.orderId), eq(orders.tenantId, tenant.id)));
  });

  return {
    success: true,
    data: {
      orderStatus: mapped,
      intellipayStatus: ipStatus,
      intellipayStatusDesc: ipRes.data.status_desc ?? null,
      paymentUrl: row.intellipayPaymentUrl,
    },
  };
}
