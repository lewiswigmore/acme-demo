import { getOrders, postOrder } from "../../../lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = getOrders;
export const POST = postOrder;
