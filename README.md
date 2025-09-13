# 📈 Stocky Backend Assignment

This project is a backend system for **Stocky**, a hypothetical platform where users earn shares of Indian stocks (e.g., Reliance, TCS, Infosys) as rewards for onboarding, referrals, or trading milestones.  

The backend records rewards, manages user holdings, fetches stock prices, calculates portfolio INR values, and maintains historical snapshots of user portfolios.  

---

## 🚀 Project Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/tausif2907/stocky-backend.git
   cd stocky-backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Database (Postgres via Docker)**
   ```bash
   docker-compose up -d
   ```

4. **Run Migrations**
   ```bash
   npx knex migrate:latest
   ```

5. **Start the Server**
   ```bash
   npm run dev
   ```

Server will be available at:  
👉 [http://localhost:4000](http://localhost:4000)

---

## 📌 API Endpoints

### 1️⃣ `POST /reward`  
Record that a user has been rewarded X shares of a stock.  

**Request**
```json
{
  "user_id": "50cc1fed-464f-46f7-bb53-e8b1178eb96d",
  "symbol": "RELIANCE",
  "quantity": 2.5
}
```

**Response**
```json
{ "message": "Reward recorded successfully" }
```

---

### 2️⃣ `GET /today-stocks/:userId`  
Fetch all rewards a user received today.  

**Response**
```json
{
  "user_id": "50cc1fed-464f-46f7-bb53-e8b1178eb96d",
  "date": "2025-09-13",
  "events": [
    {
      "reward_id": "xyz-123",
      "symbol": "RELIANCE",
      "quantity": "2.500000",
      "price_per_share": "2650.1234",
      "fees_total": "17.5000",
      "rewarded_at": "2025-09-13T07:15:22.123Z"
    }
  ]
}
```

---

### 3️⃣ `GET /stats/:userId`  
Show today’s total shares (per symbol) and current INR value of the portfolio.  

**Response**
```json
{
  "user_id": "50cc1fed-464f-46f7-bb53-e8b1178eb96d",
  "today": {
    "RELIANCE": "2.500000"
  },
  "portfolio_value_inr": "6102.3000"
}
```

---

### 4️⃣ `GET /historical-inr/:userId`  
Return the daily portfolio INR values (snapshots) for all past days (up to yesterday).  

**Response**
```json
{
  "user_id": "50cc1fed-464f-46f7-bb53-e8b1178eb96d",
  "historical": [
    {
      "date": "2025-09-12",
      "portfolio_inr": "6102.3000",
      "stale": false
    },
    {
      "date": "2025-09-11",
      "portfolio_inr": "12500.1234",
      "stale": false
    }
  ]
}
```

---

### 5️⃣ `GET /portfolio/:userId` (Bonus)  
Show current holdings per stock, average acquisition price, and current value.  

**Response**
```json
{
  "user_id": "50cc1fed-464f-46f7-bb53-e8b1178eb96d",
  "holdings": [
    {
      "symbol": "RELIANCE",
      "quantity": "2.500000",
      "avg_price_inr": "2650.1234",
      "current_price_inr": "2440.9200",
      "current_value_inr": "6102.3000"
    }
  ]
}
```

---

## 🗄️ Database Schema

**Tables Used:**
- `users` → user records  
- `reward_events` → records of each reward given (who, what, when, how many)  
- `holdings` → current user holdings with average acquisition price  
- `stock_prices` → latest stock prices (mock data fetched hourly)  
- `daily_portfolio_snapshots` → portfolio INR snapshots for each day  
- `ledger` → company brokerage, STT, GST fees (internal tracking)  

**Data Types:**
- Stock quantities → `NUMERIC(18,6)`  
- INR amounts → `NUMERIC(18,4)`  

---

## 🛡️ Edge Cases & Reliability

- ✅ Duplicate reward events → avoided using unique IDs and validation  
- ✅ Stock splits / mergers / delisting → design supports adjustments in holdings  
- ✅ Rounding errors → prevented using NUMERIC instead of floats  
- ✅ Price API downtime → fallback to last known stock price  
- ✅ Refunds / Adjustments → supported by inserting corrective reward events  

---

## ⚡ Scaling & Background Jobs

- **Hourly Price Updater** → mock service inserts random stock prices into `stock_prices`  
- **Daily Snapshot Job** → saves each user’s portfolio INR value into `daily_portfolio_snapshots`  
- **Indexes & Optimized Queries** → efficient lookups for stats & history  

**Future Improvements →**
- Redis cache for portfolio queries  
- Real stock price integration (instead of mock)  
- Support for corporate actions (splits, dividends)  

---

## 📦 Deliverables

- ✅ Backend source code (this repo)  
- ✅ API implementations (reward, today-stocks, stats, historical-inr, portfolio)  
- ✅ Database schema (Postgres)  
- ✅ Postman collection (`Stocky Backend.postman_collection.json`)  
- ✅ Assignment answers (`answer.docx`)  
- ✅ README.md (this file)  

---

## 🎯 Conclusion

This backend project demonstrates a complete working system for **stock reward tracking** with:  

- Reward recording  
- User holdings tracking  
- Portfolio INR calculations  
- Historical valuations  
- Bonus `/portfolio` endpoint  

It is designed for **correctness, extensibility, and scalability**.  
