import { Request, Response } from 'express';
import { TallyGatewayClient, TallyCollections } from '../sdk/tally';
import { sendSuccess, sendError } from '../utils/response';
import * as TallyTypes from '../types/tally.types';
import dotenv from 'dotenv';

dotenv.config();

const client = new TallyGatewayClient({
  host: process.env.TALLY_HOST || 'localhost',
  port: parseInt(process.env.TALLY_PORT || '9000', 10),
  timeout: parseInt(process.env.TALLY_TIMEOUT || '10000', 10),
});

const tallyCollections = new TallyCollections(client);

export class TallyController {
  
  static async health(req: Request, res: Response) {
    try {
      const isHealthy = await client.health();
      return res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'Connected to Tally' : 'Could not connect to Tally'
      });
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getCompanies(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getCompanies();
      // The user wants exact array of objects for /api/tally/stock-items, 
      // let's return raw array for all endpoints to match their example, 
      // or wrap in our standard response. The user specifically showed raw array. 
      // I'll return raw array to match user's explicit example.
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getLedgers(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getLedgers();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getStockGroups(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getStockGroups();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getStockCategories(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getStockCategories();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getUnits(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getUnits();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getStockItems(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getStockItems();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getStockItemsDetailed(req: Request, res: Response) {
    try {
      const itemName = req.query.name ? String(req.query.name) : (req.params.name ? String(req.params.name) : undefined);
      const data = await tallyCollections.getStockItemsDetailed(itemName);
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }


  static async getCustomers(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getCustomers();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getCustomerLedgers(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getCustomerLedgers();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }


  static async getSuppliers(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getSuppliers();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getReceivables(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getReceivables();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getSales(req: Request, res: Response) {
    try {
      const options: TallyTypes.VoucherQueryOptions = {
        fromDate: (req.query.fromDate as string) || (req.query.from as string),
        toDate: (req.query.toDate as string) || (req.query.to as string),
        month: req.query.month as string,
        year: req.query.year as string,
        party: (req.query.party as string) || (req.query.particulars as string),
        vchNo: (req.query.vchNo as string) || (req.query.voucherNumber as string),
        includeOptional: req.query.includeOptional === 'true',
        includeCancelled: req.query.includeCancelled === 'true',
        detailed: req.query.detailed === 'true',
      };

      if (req.query.register === 'true' || req.query.report === 'true') {
        const data = await tallyCollections.getSalesRegister(options);
        return res.json(data);
      }

      const data = await tallyCollections.getSales(options);
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getSalesRegister(req: Request, res: Response) {
    try {
      const options: TallyTypes.VoucherQueryOptions = {
        fromDate: (req.query.fromDate as string) || (req.query.from as string),
        toDate: (req.query.toDate as string) || (req.query.to as string),
        month: req.query.month as string,
        year: req.query.year as string,
        party: (req.query.party as string) || (req.query.particulars as string),
        vchNo: (req.query.vchNo as string) || (req.query.voucherNumber as string),
        includeOptional: req.query.includeOptional === 'true',
        includeCancelled: req.query.includeCancelled === 'true',
        detailed: req.query.detailed === 'true',
      };
      const data = await tallyCollections.getSalesRegister(options);
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getPurchases(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getPurchases();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getReceipts(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getReceipts();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getPayments(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getPayments();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getJournals(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getJournals();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getCreditNotes(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getCreditNotes();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getDebitNotes(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getDebitNotes();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }
  static async getSalesOrders(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getSalesOrders();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getPurchaseOrders(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getPurchaseOrders();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getOrderAcceptances(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getOrderAcceptances();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }
  static async getDayBook(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getDayBook();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getStockSummary(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getStockSummary();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getInventorySummary(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getInventorySummary();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getBalanceSheet(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getBalanceSheet();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getProfitLoss(req: Request, res: Response) {
    try {
      const data = await tallyCollections.getProfitAndLoss();
      return res.json(data);
    } catch (error) {
      return sendError(res, error);
    }
  }

  // Debug Endpoints
  static async getDebugRawStockItems(req: Request, res: Response) {
    try {
      const { createCollectionRequest } = await import('../sdk/tally/requests');
      const xml = createCollectionRequest('Stock Item');
      const rawXml = await client.send(xml, 'getDebugRawStockItems');
      res.setHeader('Content-Type', 'text/xml');
      return res.send(rawXml);
    } catch (error) {
      return sendError(res, error);
    }
  }

  static async getDebugRequestStockItems(req: Request, res: Response) {
    try {
      const { createCollectionRequest } = await import('../sdk/tally/requests');
      const xml = createCollectionRequest('Stock Item');
      res.setHeader('Content-Type', 'text/xml');
      return res.send(xml);
    } catch (error) {
      return sendError(res, error);
    }
  }
}
