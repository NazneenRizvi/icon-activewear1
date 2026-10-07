import { db } from './index.ts';
import { normalizeOrders } from '../lib/orders.ts';
import { orders, orderItems } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export interface OrderInput {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  currency?: string;
  subtotal: number;
  discount?: number;
  shipping?: number;
  total: number;
  status?: string;
  paymentMethod?: string;
  shippingMethod?: string;
  trackingCarrier?: string;
  trackingNumber?: string;
  notes?: string;
  items?: Array<{
    productId: string;
    name: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
}

export async function getAllOrders(email?: string) {
  try {
    const rawOrders = await db.select().from(orders).where(email ? eq(orders.email, email) : undefined).orderBy(desc(orders.createdAt));
    const allItems = await db.select().from(orderItems);

    return normalizeOrders(rawOrders.map((ord) => {
      const itemsForOrder = allItems.filter((it) => it.orderId === ord.id);
      return {
        ...ord,
        createdAt: ord.createdAt?.toISOString() || '',
        items: itemsForOrder.map((it) => ({
          productId: it.productId,
          name: it.name,
          color: it.color,
          size: it.size,
          quantity: it.quantity,
          price: it.price,
          image: it.image || '',
        })),
      };
    }));
  } catch (error) {
    console.error('Failed to get orders from PostgreSQL:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function insertOrder(data: OrderInput) {
  try {
    return await db.transaction(async tx => {
    const [insertedOrder] = await tx
      .insert(orders)
      .values({
        id: data.id,
        customerName: data.customerName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode || '', country: data.country || '', currency: data.currency || 'USD',
        subtotal: Number(data.subtotal) || 0,
        discount: Number(data.discount) || 0,
        shipping: Number(data.shipping) || 0,
        total: Number(data.total) || 0,
        status: data.status || 'confirmed',
        paymentMethod: data.paymentMethod || 'cash_on_delivery',
        shippingMethod: data.shippingMethod || 'standard',
        trackingCarrier: data.trackingCarrier || null,
        trackingNumber: data.trackingNumber || null,
        notes: data.notes || null,
      })
      .returning();

    if (data.items && data.items.length > 0) {
      await tx.insert(orderItems).values(
        data.items.map((item) => ({
          orderId: data.id,
          productId: item.productId,
          name: item.name,
          color: item.color,
          size: item.size,
          quantity: Math.max(1, Math.round(Number(item.quantity) || 1)),
          price: Number(item.price) || 0,
          image: item.image || null,
        }))
      );
    }

    return insertedOrder;
    });
  } catch (error) {
    console.error('Failed to insert order into PostgreSQL:', error);
    throw new Error('Database insert failed. Please try again later.', { cause: error });
  }
}

export async function updateOrderState(
  orderId: string,
  status: string,
  trackingCarrier?: string,
  trackingNumber?: string
) {
  try {
    const [updated] = await db
      .update(orders)
      .set({
        status,
        ...(trackingCarrier ? { trackingCarrier } : {}),
        ...(trackingNumber ? { trackingNumber } : {}),
      })
      .where(eq(orders.id, orderId))
      .returning();

    return updated;
  } catch (error) {
    console.error('Failed to update order in PostgreSQL:', error);
    throw new Error('Database update failed. Please try again later.', { cause: error });
  }
}

export async function deleteOrderById(orderId: string) {
  try {
    await db.transaction(async tx => {
      await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
      await tx.delete(orders).where(eq(orders.id, orderId));
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to delete order from PostgreSQL:', error);
    throw new Error('Database delete failed. Please try again later.', { cause: error });
  }
}

export async function getLiveDashboardStats() {
  try {
    const allOrders = await getAllOrders();

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.currency === 'PKR' ? o.total : o.total * 277.5), 0);
    const uniqueEmails = new Set(allOrders.map((o) => (o.email || '').toLowerCase().trim()).filter(Boolean));
    const totalCustomers = uniqueEmails.size;
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // Top sellers based on live actual purchases
    const productSalesMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    for (const order of allOrders) {
      for (const item of order.items) {
        const existing = productSalesMap.get(item.productId) || {
          name: item.name,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity * (order.currency === 'PKR' ? 1 : 277.5);
        productSalesMap.set(item.productId, existing);
      }
    }

    const topSellers = Array.from(productSalesMap.entries())
      .map(([id, stats]) => ({
        id,
        name: stats.name,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Revenue trend by date from actual orders
    const dateMap = new Map<string, { revenue: number; orders: number }>();
    for (const order of allOrders) {
      const dateKey = order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Recent';
      const existing = dateMap.get(dateKey) || { revenue: 0, orders: 0 };
      existing.revenue += order.total * (order.currency === 'PKR' ? 1 : 277.5);
      existing.orders += 1;
      dateMap.set(dateKey, existing);
    }

    const revenueTrend = Array.from(dateMap.entries()).map(([day, val]) => ({
      day,
      revenue: val.revenue,
      orders: val.orders,
    }));

    return {
      totalRevenue,
      totalOrders,
      totalCustomers,
      avgOrderValue,
      revenueTrend,
      topSellers,
      latestOrders: allOrders.slice(0, 5),
    };
  } catch (error) {
    console.error('Failed to calculate dashboard stats:', error);
    throw new Error('Database analytics calculation failed.', { cause: error });
  }
}
