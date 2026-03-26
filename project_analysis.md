# CU Harvest Project Analysis

## Overview
CU Harvest is a full-stack web application designed for e-commerce or delivery services (as indicated by User, Admin, and Rider roles). It consists of a React frontend and a Node.js/Express backend. 

## 1. Frontend Architecture
- **Framework**: React (v19) with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS (inferred from class names like `min-h-screen`, `bg-gray-50` in [App.tsx](file:///c:/Users/molli/Downloads/cu-harvest%20%281%29/App.tsx))
- **Key Components**:
  - [App.tsx](file:///c:/Users/molli/Downloads/cu-harvest%20%281%29/App.tsx): Main entry point handling routing, state management (products, cart, orders), and rendering dashboards based on user role (`USER`, `ADMIN`, `RIDER`).
  - [contexts/AuthContext.tsx](file:///c:/Users/molli/Downloads/cu-harvest%20%281%29/contexts/AuthContext.tsx): Manages authentication state.
  - [services/api.ts](file:///c:/Users/molli/Downloads/cu-harvest%20%281%29/services/api.ts): Centralized API client for communicating with the backend.
  - `components/`: Contains role-specific dashboards (`AdminDashboard`, `RiderDashboard`, `UserDashboard`) and shared components (`Navbar`, `CartModal`, `ProductCard`).

## 2. Backend Architecture
- **Framework**: Node.js with Express
- **Entry Point**: [backend/src/app.js](file:///c:/Users/molli/Downloads/cu-harvest%20%281%29/backend/src/app.js)
- **Routing**: API routes are modularized under `backend/src/routes/` for `auth`, `users`, `products`, `cart`, `orders`, `admin`, `rider`, and `feedback`.
- **Database**: 
  - **MongoDB**: Used via Mongoose (`backend/src/config/database.js`). Models define the schema (e.g., `User.js`, `Feedback.js`).
  - **MySQL**: The presence of `mysql2` in `package.json` and a `backend/sql/migrations` folder suggests MySQL is or was also used, perhaps during a transition phase or for specific tabular data.
- **Authentication**: JWT-based authentication (using `jsonwebtoken` and `bcryptjs`). Firebase Admin SDK is also present, likely for push notifications or legacy auth.

## 3. Directory Structure
```
c:\Users\molli\Downloads\cu-harvest (1)\
├── backend/                  # Node.js/Express backend source code
│   ├── src/
│   │   ├── config/           # Database and environment configurations
│   │   ├── controllers/      # Route logic handlers
│   │   ├── middleware/       # Custom Express middleware (e.g., auth checks)
│   │   ├── models/           # Mongoose schemas/models
│   │   ├── routes/           # Express API route definitions
│   │   ├── services/         # Business logic or external integrations
│   │   └── utils/            # Helper functions
│   ├── sql/migrations/       # Database migration scripts (SQL)
│   └── package.json          # Backend dependencies
├── components/               # React UI components
├── contexts/                 # React Contexts (e.g., AuthContext)
├── services/                 # Frontend services (API calls)
├── App.tsx                   # Main React application component
├── package.json              # Root/Frontend dependencies
└── vite.config.ts            # Vite bundler configuration
```

## Summary
The project is well-structured into a clear client-server architecture. The frontend uses a role-based access control system to render different views. The backend provides a RESTful API covering the entire e-commerce flow (auth, products, cart, orders, users), backed primarily by MongoDB.
