# Tally Gateway SDK & Read API

A reusable Node.js TypeScript SDK and REST API for reading data from TallyPrime via its XML API.

## Features

- strongly-typed SDK for Tally Gateway
- Express REST API wrapping the SDK
- Helper functions to generate Tally XML queries
- Fast XML parser to convert Tally XML responses to JSON
- Zod validators to ensure data integrity

## Requirements

- Node.js v16+
- TallyPrime running with ODBC/XML Gateway enabled (usually port 9000)

## Quick Start

1. Install dependencies

   ```bash
   npm install
   ```

2. Configure environment
   Edit the `.env` file to set your Tally Host and Port.

   ```env
   PORT=3000
   TALLY_HOST=localhost
   TALLY_PORT=9000
   ```

3. Run in Development Mode

   ```bash
   npm run dev
   ```

4. Build for Production

   ```bash
   npm run build
   npm start
   ```

## SDK Usage Example

```typescript
import { TallyGatewayClient, TallyCollections } from './sdk/tally';

const client = new TallyGatewayClient({ host: 'localhost', port: 9000 });
const collections = new TallyCollections(client);

async function fetchItems() {
  const stockItems = await collections.getStockItems();
  console.log(stockItems);
}
```

## REST API Endpoints

- `GET /api/tally/health`
- `GET /api/tally/companies`
- `GET /api/tally/ledgers`
- `GET /api/tally/stock-items`
- `GET /api/tally/stock-groups`
- `GET /api/tally/stock-categories`
- `GET /api/tally/units`
- `GET /api/tally/customers`
- `GET /api/tally/suppliers`
- `GET /api/tally/sales`
- `GET /api/tally/purchases`
- `GET /api/tally/receipts`
- `GET /api/tally/payments`
- `GET /api/tally/journals`
