# 🪖 Smart Helmet Monitoring System

A **full-stack IoT system** that prevents drunk riding and enforces helmet use on motorcycles.

The system combines **embedded hardware** (Arduino Nano + ESP32), a **Node.js backend**, a **PostgreSQL database**, and a **React dashboard** to monitor helmet status, detect alcohol, and control the motorcycle's starter circuit in real time.

---

## 🎯 Core Logic (AND Gate)

```
Engine Allowed = (Helmet ID Match) AND (Helmet Worn) AND (No Alcohol)
```

The motorcycle **cannot start** unless **all three conditions** are TRUE.

**Safety First:** The system only prevents **unsafe starts**. It does **not** cut the engine mid-ride.

---

## 🏗️ Architecture

```
┌──────────────────┐    Bluetooth    ┌──────────────────┐
│  HELMET UNIT     │ ───────────────▶│   BIKE UNIT      │
│  Arduino Nano    │                 │   ESP32          │
│  + MQ-3          │                 │   + Relay        │
│  + IR Sensor     │                 │   + HC-05        │
│  + HC-05         │                 │   + WiFi         │
└──────────────────┘                 └────────┬─────────┘
                                              │
                                              │ HTTP POST
                                              ▼
                                     ┌──────────────────┐
                                     │   BACKEND        │
                                     │   Node.js        │
                                     │   + PostgreSQL   │
                                     │   + Socket.IO    │
                                     └────────┬─────────┘
                                              │
                                              │ WebSocket
                                              ▼
                                     ┌──────────────────┐
                                     │   FRONTEND       │
                                     │   React + Vite   │
                                     │   + Tailwind     │
                                     └──────────────────┘
```

---

## 📂 Project Structure

```
smart-helmet-system/
├── backend/                    # Node.js + Express + Prisma + PostgreSQL
│   ├── src/
│   │   ├── config/             # Database + env config
│   │   ├── controllers/        # API logic
│   │   ├── middleware/         # Auth + validation
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic (AND gate)
│   │   ├── sockets/            # Socket.IO real-time
│   │   └── utils/              # Helpers
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.js             # Seed data
│   └── package.json
│
├── frontend/                   # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/         # UI components
│   │   ├── contexts/           # Auth + Socket contexts
│   │   ├── pages/              # Route pages
│   │   ├── services/           # API calls
│   │   └── utils/              # Constants + formatters
│   └── package.json
│
└── firmware/                   # Arduino code
    ├── bike_unit_esp32/
    │   └── bike_unit_esp32.ino
    └── helmet_unit_nano/
        └── helmet_unit_nano.ino
```

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Helmet Hardware** | Arduino Nano, MQ-3, IR Sensor, HC-05 |
| **Bike Hardware** | ESP32, HC-05, 5V Relay, LM2596 |
| **Backend** | Node.js, Express, Prisma, Socket.IO |
| **Database** | PostgreSQL |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts |
| **Auth** | JWT + bcrypt |
| **Real-time** | Socket.IO |
| **Firmware** | Arduino (C++) |

---

## 🛠️ Installation

### Prerequisites

- Node.js 18+ (or 20 LTS)
- PostgreSQL 14+
- Arduino IDE (for firmware)

### Backend Setup

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run prisma:seed
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### Firmware Setup

1. Open `firmware/helmet_unit_nano/helmet_unit_nano.ino` in Arduino IDE
2. Open `firmware/bike_unit_esp32/bike_unit_esp32.ino` in Arduino IDE
3. Update WiFi credentials and server URL in the ESP32 code
4. Upload to respective boards

---

## 🔐 Default Credentials (from seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@smarthelmet.com | admin123 |
| Owner | owner@smarthelmet.com | owner123 |
| Rider | rider@smarthelmet.com | rider123 |

**Device API Keys:** Generated during seeding — check the seed output.

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register        Register new user
POST   /api/auth/login           Login (returns JWT)
GET    /api/auth/profile         Get current user
```

### Helmets
```
GET    /api/helmets              List all helmets
GET    /api/helmets/stats        Statistics
GET    /api/helmets/:id          Get one helmet
POST   /api/helmets              Create (admin/owner)
PUT    /api/helmets/:id          Update
DELETE /api/helmets/:id          Delete (admin)
```

### Bikes
```
GET    /api/bikes                List all bikes
GET    /api/bikes/stats          Statistics
POST   /api/bikes                Create
PUT    /api/bikes/:id            Update
DELETE /api/bikes/:id            Delete
```

### Sensor (IoT)
```
POST   /api/sensor/data          Receive device data (x-api-key)
GET    /api/sensor/live/:code    Live data
GET    /api/sensor/history/:code Historical data
GET    /api/sensor/stats/:code   Statistics
```

### Violations
```
GET    /api/violations           List violations
GET    /api/violations/stats     Statistics
PUT    /api/violations/:id/resolve  Mark as resolved
```

### Dashboard
```
GET    /api/dashboard/overview      Overview stats
GET    /api/dashboard/violations/trends  Trend data
```

---

## 🔌 Socket.IO Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `sensor:update` | Server → Client | Real-time sensor data |
| `violation:new` | Server → Client | New violation alert |
| `ride:start` | Server → Client | Ride started |
| `ride:end` | Server → Client | Ride ended |
| `join:helmet` | Client → Server | Subscribe to helmet room |

---

## 🔒 Security Features

- JWT-based authentication
- bcrypt password hashing
- Device API key authentication for ESP32
- Input validation on all endpoints
- Helmet + CORS security headers
- Fail-safe design (engine OFF by default)

---

## 📊 Dashboard Features

- **Real-time monitoring** of helmet status via Socket.IO
- **Alcohol gauge** with threshold indicator
- **Worn status** detection
- **Engine state** display (allowed / blocked)
- **Violation tracking** with severity levels
- **Historical analytics** with charts
- **Helmet and bike management** (CRUD)
- **User authentication** with role-based access

---

## 🧪 Testing

### Test the backend health
```bash
curl http://localhost:5000/health
```

### Test sensor data ingestion
```bash
curl -X POST http://localhost:5000/api/sensor/data \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_HELMET_API_KEY" \
  -d '{"helmetCode":"H001","bikeCode":"B001","worn":true,"alcoholLevel":150}'
```

Expected response: `{"success":true,"data":{"engineAllowed":true,...}}`

---

## 🚧 Roadmap

- [x] Core AND gate logic
- [x] Backend API + database
- [x] React dashboard
- [x] ESP32 firmware
- [x] Arduino Nano firmware
- [ ] GPS tracking
- [ ] SMS alerts (SIM800L)
- [ ] Mobile app
- [ ] AI-based fatigue detection

---

## 📄 License

MIT License — see [LICENSE](LICENSE) file for details.

---

## 👤 Author

[Your Name]
[Your Email]
[Your Institution]

---

## 🙏 Acknowledgments

- World Health Organization — Road Safety Reports
- Arduino Documentation
- Prisma, Socket.IO, and React communities