import 'dotenv/config';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { STORE_OWNER_EMAIL } from './src/config.ts';
import { databaseConfigured } from './src/db/index.ts';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllOrders,
  insertOrder,
  updateOrderState,
  deleteOrderById,
  getLiveDashboardStats,
} from './src/db/orders.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '256kb' }));
const isOwner = (req: AuthRequest) => req.user?.email?.toLowerCase() === STORE_OWNER_EMAIL.toLowerCase();
const requireOwner = (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  if (!isOwner(req)) return res.status(403).json({ error: 'Store owner access required.' });
  next();
};
const databaseError = (res: express.Response, error: any) => {
  let cause = error;
  for (let depth = 0; depth < 5 && cause?.cause && !cause?.code; depth++) cause = cause.cause;
  const code = typeof cause?.code === 'string' ? cause.code : 'DATABASE_UNAVAILABLE';
  console.error('[Database query]', { code, message: cause?.message });
  const message = code === '42P01' ? 'Database table is missing. Apply the project schema.' :
    code === '42703' ? 'Database column is missing. Apply the project schema migration.' :
    'Database unavailable. Check server connection settings and logs.';
  return res.status(503).json({ error: message, code });
};
app.use('/api', (req, res, next) => {
  if (!databaseConfigured) return res.status(503).json({ error: 'Database is not configured. Set DATABASE_URL on the server.', code: 'DATABASE_CONFIG_MISSING' });
  next();
});

// Health check endpoints for Cloud Run
app.get(['/healthz', '/livez', '/readyz', '/startup', '/liveness'], (req, res) => {
  res.status(200).send('OK');
});

// API Routes
app.get('/api/orders', requireAuth, async (req: AuthRequest, res) => {
  try {
    const ordersList = await getAllOrders(isOwner(req) ? undefined : req.user?.email || '__no_email__');
    res.json(ordersList);
  } catch (error: any) {
    console.error('Failed to retrieve orders from database, returning empty list fallback:', error);
    databaseError(res, error);
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData || !['id', 'customerName', 'email', 'phone', 'address', 'city'].every(key => typeof orderData[key] === 'string' && orderData[key].trim()) ||
        !Array.isArray(orderData.items) || !orderData.items.length || orderData.items.some((item: any) => !item || typeof item.productId !== 'string' || typeof item.name !== 'string' || typeof item.color !== 'string' || typeof item.size !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isFinite(item.price) || item.price < 0) ||
        !['subtotal', 'discount', 'shipping', 'total'].every(key => Number.isFinite(orderData[key]) && orderData[key] >= 0) || !['USD', 'PKR'].includes(orderData.currency)) {
      return res.status(400).json({ error: 'Invalid order details.' });
    }
    if (orderData.paymentMethod !== 'cash_on_delivery') return res.status(400).json({ error: 'Only cash on delivery is configured.' });
    orderData.email = orderData.email.trim().toLowerCase();
    orderData.status = 'confirmed';
    const newOrder = await insertOrder(orderData);
    console.log(`[LIVE ORDER LOGGED IN DATABASE] #${orderData.id} - ${orderData.customerName} - Rs. ${orderData.total}`);
    res.status(201).json({ success: true, order: newOrder });
  } catch (error: any) {
    console.error('Failed to create order in database:', error);
    databaseError(res, error);
  }
});

app.patch('/api/orders/:id/status', requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingCarrier, trackingNumber } = req.body;
    if (!['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
    const updated = await updateOrderState(String(id), status, trackingCarrier, trackingNumber);
    if (!updated) return res.status(404).json({ error: 'Order not found.' });
    res.json({ success: true, order: updated });
  } catch (error: any) {
    console.error('Failed to update order status:', error);
    databaseError(res, error);
  }
});

app.delete('/api/orders/:id', requireAuth, requireOwner, async (req, res) => {
  try {
    const { id } = req.params;
    await deleteOrderById(String(id));
    res.json({ success: true });
  } catch (error: any) {
    databaseError(res, error);
  }
});

// Live Dashboard Stats Route
app.get('/api/dashboard/stats', requireAuth, requireOwner, async (req, res) => {
  try {
    const stats = await getLiveDashboardStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Failed to calculate live stats, returning zero-state fallback:', error);
    databaseError(res, error);
  }
});

app.use('/api', (req, res) => { res.status(404).json({ error: 'API route not found.' }); });

// Static or Vite Middleware
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const indexHtml = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && fs.existsSync(indexHtml)) {
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(indexHtml);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // In production (Cloud Run), listen on process.env.PORT. In dev, listen on port 3000 (behind Nginx proxy)
  const targetPort = PORT;

  const server = app.listen(targetPort, '0.0.0.0', () => {
    console.log(`ICON ACTIVEWEAR Full-Stack server running at http://0.0.0.0:${targetPort}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && targetPort !== 3000) {
      console.log(`Port ${targetPort} in use, falling back to 3000...`);
      app.listen(3000, '0.0.0.0', () => {
        console.log(`ICON ACTIVEWEAR Full-Stack server running at http://0.0.0.0:3000`);
      });
    }
  });
}

startServer();
