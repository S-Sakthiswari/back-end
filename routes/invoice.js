const express = require('express');
const router = express.Router();
const InvoiceController = require('../controllers/invoiceController');
const { protect, authorize } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(protect);

// Invoice CRUD operations
router.route('/')
  .get(authorize('admin', 'manager', 'staff', 'accountant'), InvoiceController.getAllInvoices)
  .post(authorize('admin', 'manager', 'staff'), InvoiceController.createInvoice);

router.route('/stats')
  .get(authorize('admin', 'manager'), InvoiceController.getInvoiceStats);

router.route('/recent')
  .get(authorize('admin', 'manager', 'staff'), InvoiceController.getRecentInvoices);

router.route('/search')
  .get(authorize('admin', 'manager', 'staff'), InvoiceController.searchInvoices);

router.route('/:id')
  .get(authorize('admin', 'manager', 'staff', 'accountant'), InvoiceController.getInvoiceById)
  .put(authorize('admin', 'manager'), InvoiceController.updateInvoice)
  .delete(authorize('admin', 'manager'), InvoiceController.deleteInvoice);

// Invoice Actions
router.post('/:id/send-email', authorize('admin', 'manager', 'staff'), InvoiceController.sendInvoiceEmail);
router.post('/:id/send-whatsapp', authorize('admin', 'manager', 'staff'), InvoiceController.sendInvoiceWhatsApp);
router.get('/:id/download', authorize('admin', 'manager', 'staff'), InvoiceController.downloadInvoice);
router.get('/:id/print', authorize('admin', 'manager', 'staff'), InvoiceController.getPrintInvoice);

// Invoice Status Management
router.patch('/:id/status', authorize('admin', 'manager'), InvoiceController.updateInvoiceStatus);
router.post('/:id/payment', authorize('admin', 'manager', 'staff'), InvoiceController.recordPayment);

// Bulk Operations
router.post('/bulk/delete', authorize('admin'), InvoiceController.bulkDeleteInvoices);
router.post('/bulk/export', authorize('admin', 'manager'), InvoiceController.bulkExportInvoices);

// Reports
router.get('/reports/daily/:date', authorize('admin', 'manager'), InvoiceController.getDailyReport);
router.get('/reports/monthly/:year/:month', authorize('admin', 'manager'), InvoiceController.getMonthlyReport);
router.get('/reports/customer/:customerId', authorize('admin', 'manager'), InvoiceController.getCustomerReport);

module.exports = router;