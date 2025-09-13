require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');

const db = require('./db');
const rewardRouter = require('./routes/reward');
const userRouter = require('./routes/user');
const todayStocksRouter = require('./routes/todayStocks');
const statsRouter = require('./routes/stats');
const historicalInrRouter = require('./routes/historicalInr');
const portfolioRouter = require('./routes/portfolio');

const app = express();

// 🔧 Global middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use('/historical-inr', historicalInrRouter);
app.use('/portfolio', portfolioRouter);

// 🟢 Health check route
app.get('/health', async (req, res) => {
  try {
    await db.raw('select 1+1 as result');
    res.json({ status: 'ok', db: 'reachable' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// 🟢 API routes
app.use('/users', userRouter);
app.use('/reward', rewardRouter);
app.use('/today-stocks', todayStocksRouter);
app.use('/stats', statsRouter);

// 🟢 Start server AFTER registering routes
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
