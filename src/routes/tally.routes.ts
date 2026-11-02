import { Router } from 'express';
import { TallyController } from '../controllers/tally.controller';

const router = Router();

router.get('/health', TallyController.health);
router.get('/companies', TallyController.getCompanies);
router.get('/ledgers', TallyController.getLedgers);
router.get('/stock-items', TallyController.getStockItems);
router.get('/stock-items/detailed', TallyController.getStockItemsDetailed);
router.get('/stock-item-details', TallyController.getStockItemsDetailed);
router.get('/stock-groups', TallyController.getStockGroups);
router.get('/stock-categories', TallyController.getStockCategories);
router.get('/stock-categories/detailed', TallyController.getStockCategories);
router.get('/stock-category-details', TallyController.getStockCategories);
router.get('/units', TallyController.getUnits);
router.get('/customers', TallyController.getCustomers);
router.get('/customer-ledgers', TallyController.getCustomerLedgers);
router.get('/customers/detailed', TallyController.getCustomerLedgers);
router.get('/suppliers', TallyController.getSuppliers);
router.get('/receivables', TallyController.getReceivables);
router.get('/sales', TallyController.getSales);
router.get('/sales/register', TallyController.getSalesRegister);
router.get('/sales-register', TallyController.getSalesRegister);
router.get('/purchases', TallyController.getPurchases);
router.get('/receipts', TallyController.getReceipts);
router.get('/payments', TallyController.getPayments);
router.get('/journals', TallyController.getJournals);
router.get('/credit-notes', TallyController.getCreditNotes);
router.get('/debit-notes', TallyController.getDebitNotes);
router.get('/sales-orders', TallyController.getSalesOrders);
router.get('/purchase-orders', TallyController.getPurchaseOrders);
router.get('/order-acceptances', TallyController.getOrderAcceptances);
router.get('/daybook', TallyController.getDayBook);
router.get('/stock-summary', TallyController.getStockSummary);
router.get('/inventory-summary', TallyController.getInventorySummary);
router.get('/balance-sheet', TallyController.getBalanceSheet);
router.get('/profit-loss', TallyController.getProfitLoss);

// Debug Endpoints
router.get('/debug/raw-stock-items', TallyController.getDebugRawStockItems);
router.get('/debug/request-stock-items', TallyController.getDebugRequestStockItems);

export default router;
