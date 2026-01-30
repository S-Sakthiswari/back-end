
const express = require('express');
const router = express.Router();
const taxController = require('../controllers/taxController'); 

// ============================================
// TAX SLABS ROUTES
// ============================================

// Get all slabs (enhanced with better response structure)
router.get('/slabs', taxController.getAllSlabs);

// 🆕 NEW: Get only active slabs (for billing dropdown)
router.get('/slabs/active/list', taxController.getActiveSlabs);

// 🆕 NEW: Get default slab (for billing initial rate)
router.get('/slabs/default/get', taxController.getDefaultSlab);

// 🆕 NEW: Get slab by ID
router.get('/slabs/:id', taxController.getSlabById);

// Create new slab
router.post('/slabs', taxController.createSlab);

// 🆕 NEW: Bulk create default slabs (for initial setup)
router.post('/slabs/bulk-create', taxController.bulkCreateSlabs);

// Update slab
router.put('/slabs/:id', taxController.updateSlab);

// Delete slab
router.delete('/slabs/:id', taxController.deleteSlab);

// Toggle slab status (active/inactive)
router.patch('/slabs/:id/toggle-status', taxController.toggleSlabStatus);

// ============================================
// TAX ENTRIES ROUTES
// ============================================

// Get all entries
router.get('/entries', taxController.getAllEntries);

// Create new entry
router.post('/entries', taxController.createEntry);

// Update entry
router.put('/entries/:id', taxController.updateEntry);

// Delete entry
router.delete('/entries/:id', taxController.deleteEntry);

// Update entry status
router.patch('/entries/:id/status', taxController.updateEntryStatus);

// ============================================
// SUMMARY & REPORTS ROUTES
// ============================================

// Get summary
router.get('/summary', taxController.getSummary);

// Generate GSTR-1 report
router.post('/reports/gstr1', taxController.generateGSTR1);

// Generate GSTR-2 report
router.post('/reports/gstr2', taxController.generateGSTR2);

module.exports = router;