// server.js - Complete Billing System with Inventory Management

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/productRoutes');
const customerRoutes = require('./routes/customerRoutes');
const discountRoutes = require('./routes/discountRoutes');
const couponRoutes = require('./routes/couponRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const taxRoutes = require('./routes/taxRoutes');
const coinRoutes = require('./routes/coinRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const whatsappRoutes = require('./routes/whatsapp');
const ordersRoutes = require('./routes/orders');
const billsRoutes = require('./routes/bills');
const notificationRoutes = require('./routes/notifications');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
  }
});

// ============================================
// MIDDLEWARE
// ============================================

// CORS Configuration
app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:3000"
  ],
  credentials: true
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' })); // For base64 images
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Request Logger (Development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ============================================
// MONGODB CONNECTION
// ============================================

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/billing-system';

mongoose
  .connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4
  })
  .then(async () => {
    console.log('✅ MongoDB Connected Successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    await createDefaultUsers();
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB Disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB Error:', err);
});

// ============================================================================
// AUTO-CREATE DEFAULT USERS FUNCTION
// ============================================================================
async function createDefaultUsers() {
  try {
    const User = require('./models/User');

    console.log('🔍 Checking for existing users...');

    const totalUsers = await User.countDocuments();
    console.log(`Total users in database: ${totalUsers}`);

    // Check if admin exists
    const adminExists = await User.findOne({ username: 'admin', role: 'admin' });
    if (!adminExists) {
      console.log('👤 Creating admin user...');
      const hashedAdminPassword = await bcrypt.hash('admin123', 10);
      const admin = await User.create({
        username: 'admin',
        password: hashedAdminPassword,
        role: 'admin'
      });
      console.log('✅ Admin user created successfully');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   ID:', admin._id);
    } else {
      console.log('ℹ️  Admin user already exists (ID:', adminExists._id + ')');
    }

    // Check if staff exists
    const staffExists = await User.findOne({ username: 'staff', role: 'staff' });
    if (!staffExists) {
      console.log('👤 Creating staff user...');
      const hashedStaffPassword = await bcrypt.hash('staff123', 10);
      const staff = await User.create({
        username: 'staff',
        password: hashedStaffPassword,
        role: 'staff'
      });
      console.log('✅ Staff user created successfully');
      console.log('   Username: staff');
      console.log('   Password: staff123');
      console.log('   ID:', staff._id);
    } else {
      console.log('ℹ️  Staff user already exists (ID:', staffExists._id + ')');
    }

    const finalCount = await User.countDocuments();
    console.log(`\n✅ User setup complete. Total users: ${finalCount}`);

  } catch (error) {
    console.error('❌ Error creating default users:', error.message);
    console.error('Full error:', error);
  }
}

// ============================================
// ROUTES
// ============================================

// Base route
app.get('/', (req, res) => {
  res.json({
    message: 'Billing & Inventory Management System API',
    version: '2.0.0',
    features: [
      'Customer Management',
      'Product Inventory',
      'Coin Wallet System',
      'Transaction History',
      'Invoice System',
      'Real-time Notifications',
      'Stock Management',
      'Sales Analytics',
      'Discount & Coupon Management',
      'Expense Tracking',
      'Tax Configuration',
      'WhatsApp Integration',
      'Order Management'
    ],
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      customers: '/api/customers',
      invoices: '/api/invoices',
      notifications: '/api/notifications',
      sales: '/api/sales',
      analytics: '/api/analytics',
      tax: '/api/tax',
      discounts: '/api/discounts',
      coupons: '/api/coupons',
      expenses: '/api/expenses',
      coins: '/api/coins',
      transactions: '/api/transactions',
      whatsapp: '/api/whatsapp',
      orders: '/api/orders',
      bills: '/api/bills'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '2.0.0'
  });
});

// ============================================================================
// REGISTER ALL ROUTES
// ============================================================================

// Core routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/tax', taxRoutes);
app.use('/api/coins', coinRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/notifications', notificationRoutes);

console.log('✅ Core routes registered:');
console.log('   - /api/auth');
console.log('   - /api/products');
console.log('   - /api/customers');
console.log('   - /api/discounts');
console.log('   - /api/coupons');
console.log('   - /api/expenses');
console.log('   - /api/tax');
console.log('   - /api/coins');
console.log('   - /api/transactions');
console.log('   - /api/whatsapp');
console.log('   - /api/orders');
console.log('   - /api/bills');
console.log('   - /api/notifications');

// Load optional routes safely
const loadRoutes = (routePath, routeName) => {
  try {
    const routes = require(routePath);
    app.use(`/api/${routeName}`, routes);
    console.log(`✅ ${routeName} routes loaded`);
  } catch (err) {
    console.warn(`⚠️ ${routeName} routes not found:`, err.message);
    // Create placeholder route
    const router = express.Router();
    router.get('/', (req, res) => res.json({ 
      success: true,
      message: `${routeName} module not implemented yet`,
      info: 'This endpoint is available but functionality is pending'
    }));
    app.use(`/api/${routeName}`, router);
  }
};

// Load optional routes (these files may or may not exist)
loadRoutes('./routes/invoice', 'invoices');
loadRoutes('./routes/sales', 'sales');
loadRoutes('./routes/analytics', 'analytics');

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

// Import Notification model for socket events
const Notification = require('./models/Notification');

// ============================================================================
// UPSERT NOTIFICATION FUNCTION - Prevents Duplicate Notifications
// ============================================================================
async function upsertNotification(notificationData) {
  try {
    const {
      type,
      title,
      message,
      productName,
      productId,
      currentStock,
      minStock,
      priority = 'medium',
      color = 'blue',
      icon = 'Bell',
      timestamp = new Date(),
      isRead = false
    } = notificationData;

    // Create a query to find similar notifications
    const query = {
      type,
      productId,
      isRead: false
    };

    // Check if a similar notification already exists
    let existingNotification = await Notification.findOne(query);

    if (existingNotification) {
      // Update existing notification with new data
      existingNotification.title = title;
      existingNotification.message = message;
      existingNotification.currentStock = currentStock;
      existingNotification.minStock = minStock;
      existingNotification.priority = priority;
      existingNotification.color = color;
      existingNotification.timestamp = timestamp;

      await existingNotification.save();

      console.log('✅ Updated existing notification:', existingNotification._id);
      return {
        notification: existingNotification,
        isNew: false
      };
    } else {
      // Create new notification
      const newNotification = await Notification.create({
        type,
        title,
        message,
        productName,
        productId,
        currentStock,
        minStock,
        priority,
        color,
        icon,
        timestamp,
        isRead
      });

      console.log('✅ Created new notification:', newNotification._id);
      return {
        notification: newNotification,
        isNew: true
      };
    }
  } catch (error) {
    console.error('❌ Error in upsertNotification:', error);
    throw error;
  }
}

// ============================================================================
// SOCKET.IO EVENTS - Real-time Communication
// ============================================================================
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('joinNotificationRoom', () => {
    socket.join('notifications');
    console.log(`Client ${socket.id} joined notification room`);
  });

  // Handle stock updates from Stock Management page
  socket.on('stock_updated', async (data) => {
    console.log('📦 Stock update received:', data);

    try {
      const notificationData = {
        type: data.currentStock === 0 ? 'Out of Stock' : 'Low Stock',
        title: data.currentStock === 0 ? 'Out of Stock Alert' : 'Low Stock Alert',
        message: data.currentStock === 0
          ? `${data.productName} is out of stock`
          : `${data.productName} stock is low (${data.currentStock} units remaining)`,
        productName: data.productName,
        productId: data.productId,
        currentStock: data.currentStock,
        minStock: data.minStock,
        priority: data.currentStock === 0 ? 'high' : data.currentStock <= 2 ? 'high' : 'medium',
        color: data.currentStock === 0 ? 'red' : 'orange',
        icon: 'Package'
      };

      // Use upsert to prevent duplicates
      const result = await upsertNotification(notificationData);

      // Emit to all clients in notification room
      io.to('notifications').emit('new_notification', result.notification);
      console.log(`📢 ${result.isNew ? 'Created new' : 'Updated existing'} stock notification: ${result.notification.title}`);
    } catch (error) {
      console.error('Error saving stock notification:', error);
    }
  });

  // Handle direct notifications from client
  socket.on('new_notification', async (notificationData) => {
    console.log('📢 Direct notification from client:', notificationData.title || notificationData.message);

    try {
      // Remove any custom _id and let MongoDB generate it
      const { _id, ...cleanNotificationData } = notificationData;

      // Use upsert to prevent duplicates
      const result = await upsertNotification({
        ...cleanNotificationData,
        timestamp: notificationData.timestamp || new Date(),
        isRead: notificationData.isRead || false
      });

      // Broadcast to all clients
      io.emit('new_notification', result.notification);
      console.log(`📢 ${result.isNew ? 'Created new' : 'Updated existing'} notification: ${result.notification.title}`);
    } catch (error) {
      console.error('Error saving direct notification:', error);
    }
  });

  // Handle marking notifications as read
  socket.on('mark_notification_read', async (notificationId) => {
    try {
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
      io.emit('notification_read', { id: notificationId });
      console.log(`✅ Notification marked as read: ${notificationId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  });

  // Handle marking all notifications as read
  socket.on('mark_all_read', async () => {
    try {
      await Notification.updateMany({ isRead: false }, { isRead: true });
      io.emit('all_notifications_read');
      console.log('✅ All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  });

  // Handle deleting a notification
  socket.on('delete_notification', async (notificationId) => {
    try {
      await Notification.findByIdAndDelete(notificationId);
      io.emit('notification_deleted', { id: notificationId });
      console.log(`✅ Notification deleted: ${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  });

  // Handle order updates
  socket.on('order_created', (orderData) => {
    io.emit('new_order', orderData);
    console.log('📦 New order broadcast:', orderData.orderId);
  });

  // Handle payment updates
  socket.on('payment_received', (paymentData) => {
    io.emit('new_payment', paymentData);
    console.log('💰 Payment received broadcast:', paymentData.transactionId);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler - must come after all routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableEndpoints: {
      base: '/',
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      customers: '/api/customers',
      notifications: '/api/notifications'
    }
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { 
      stack: err.stack,
      error: err 
    })
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('\n' + '='.repeat(70));
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${mongoose.connection.name}`);
  console.log(`🔔 Real-time Notifications: ws://localhost:${PORT}`);
  console.log(`📦 Stock Monitoring: http://localhost:${PORT}/api/notifications/check-stock`);
  console.log(`📄 Invoice System: http://localhost:${PORT}/api/invoices`);
  console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Duplicate notification prevention: ACTIVE`);
  console.log(`👤 Default users auto-created on startup`);
  console.log('='.repeat(70) + '\n');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = async (signal) => {
  console.log(`\n⏳ ${signal} signal received: closing HTTP server`);
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error closing MongoDB connection:', err);
      process.exit(1);
    }
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('⚠️ Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  
  server.close(async () => {
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    } catch (closeErr) {
      console.error('❌ Error closing MongoDB:', closeErr);
    }
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

module.exports = { app, server, io };
