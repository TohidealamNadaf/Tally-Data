import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import tallyRoutes from './routes/tally.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(process.cwd(), 'public')));

// Setup API routes
app.use('/api/tally', tallyRoutes);

// Fallback to frontend index.html for root if needed
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
