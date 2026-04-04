"use server";

import { getOrderDetail, getOrders, type OrderFilters } from "./queries";

export async function fetchOrderDetail(orderId: string) {
  return getOrderDetail(orderId);
}

export async function fetchFilteredOrders(filters: OrderFilters) {
  return getOrders(filters);
}
