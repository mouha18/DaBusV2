# 🚌 DaBus - Student Transportation Booking Platform

The Magic Bus is a student transportation booking platform that allows students to easily reserve bus seats from campus dormitories to their home regions.

## ✨ Features

### Student
- View available bus rides
- Book a seat on a bus
- View bus departure details
- Request booking cancellation
- View personal booking history

### Admin (School Government)
- Create and manage bus rides
- Set booking deadlines and capacities
- View real-time booking statistics
- Approve or reject cancellation requests
- Cancel bus rides and issue refunds
- Export trip history as PDF / Excel
- Archive trip data while keeping long-term records

## 🧑‍💻 Tech Stack

### Frontend
- **Next.js** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Backend
- **Node.js** - Runtime
- **Express** - API framework
- **TypeScript** - Type safety
- **Supabase** - PostgreSQL database (full API)

### Payments
- **Naboopay** - Payment processing (Wave & Orange Money)

## 📁 Project Structure

```
DaBus/
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── pages/     
│   │   ├── components/
│   │   ├── styles/
│   │   └── ...
│   ├── package.json
│   └── ...
├── backend/           # Express API
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic + DB queries via Supabase
│   │   ├── middlewares/    
│   │   └── index.ts        # Entry point for Express server
│   ├── supabase/           # Supabase client setup
│   │   └── client.ts       # Initialize Supabase connection
│   ├── package.json
│   └── ...
├── package.json
├── .env.example
└── README.md

```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account (PostgreSQL + Auth)
- Naboopay account (for payments)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DaBus
```

2. Install all dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
# Copy the example env file
cp .env.example .env

# Also set up backend/.env
cp backend/.env.example backend/.env
```

4. Update the `.env` files with your configuration:
- Database URL
- JWT secret
- Naboopay API credentials

5. Initialize the database:
```bash
cd backend
npm run prisma:migrate
npm run prisma:generate
```

6. Start the development servers:
```bash
cd ..
npm run dev
```

The frontend will be available at `http://localhost:3000`
The backend API will be available at `http://localhost:4000`

## 🔐 Authentication & Roles

The platform uses JWT-based authentication with role-based access control (RBAC):

- **student** - Can view trips, make bookings, manage own bookings
- **admin** - Full access to manage trips, bookings, and view statistics

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Trips
- `GET /api/trips` - List all trips
- `POST /api/trips` - Create trip (admin only)
- `GET /api/trips/:id` - Get trip details
- `PUT /api/trips/:id` - Update trip (admin only)
- `DELETE /api/trips/:id` - Delete trip (admin only)

### Bookings
- `GET /api/bookings` - List user's bookings
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings/:id/cancel` - Request cancellation

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/bookings` - All bookings
- `POST /api/admin/bookings/:id/approve` - Approve cancellation
- `GET /api/admin/export` - Export data

## 💳 Payment Integration

Payments are processed through Naboopay API:
- **Wave** - Mobile money
- **Orange Money** - Mobile money

For sandbox testing, use your Naboopay sandbox credentials.

## 📝 Environment Variables

See `.env.example` for all required variables.

## 📄 License

This project is intended for educational and institutional use.
