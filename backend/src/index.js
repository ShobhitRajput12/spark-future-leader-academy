const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).send('Server is running');
});

app.use('/ai', aiRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`[server] running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

start();
