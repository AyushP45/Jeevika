# Jeevika - Project Documentation & Pitch Deck

## 🚀 Project Overview
**Jeevika** is a modern, trust-based platform connecting skilled blue-collar workers with employers. It focuses on solving the trust deficit in the informal labor market through verified profiles, secure escrow payments, and real-time communication.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS + Vanilla CSS
- **Animations**: Framer Motion
- **UI Components**: Radix UI (Primitives), Lucide React (Icons)
- **State Management**: Zustand
- **Routing**: React Router DOM v7
- **Forms**: React Hook Form + Zod

### Backend
- **Environment**: Node.js
- **Framework**: Express.js (v5)
- **Real-time**: Socket.io (Chat & Notifications)
- **Database ORM**: Sequelize
- **Security**: JWT, Bcrypt.js, Google OAuth 2.0

### Database & Infrastructure
- **Primary Database**: PostgreSQL
- **Mapping**: Leaflet / OpenStreetMap
- **Communications**: Nodemailer (Email), Web-Push (Browser Push Notifications)
- **PWA**: Vite PWA (Offline Support)

---

## ✨ Core Features

### 1. Dual-Role Ecosystem
- **Employer Dashboard**: Tools to post jobs, manage applicants, and search for workers.
- **Worker Dashboard**: Personalized feed of jobs, application tracking, and profile management.

### 2. Verified Worker Discovery
- Advanced search and filtering engine.
- Skill-based matching.
- Location-based worker discovery using interactive maps.

### 3. Secure Escrow Payment System
- **Digital Wallet**: Every user has a linked wallet for seamless transactions.
- **Escrow Logic**: Funds are locked upon job commencement and released only after verified completion, ensuring safety for both parties.
- **Transaction History**: Transparent logging of all financial movements.

### 4. Real-time Communication
- **Integrated Chat**: Direct messaging between employers and workers.
- **Presence Indicators**: See when users are online.
- **Media Support**: Ability to discuss job requirements in real-time.

### 5. Smart Notifications
- Multi-channel alerts (In-app, Push, Email).
- Status updates for job applications and payment releases.

---

## 🔌 API Architecture

### Internal Endpoints
- **`/api/auth`**: Registration, Login, and Google OAuth flow.
- **`/api/jobs`**: CRUD operations for job postings, bidding, and status updates.
- **`/api/workers`**: Worker profile retrieval and public directory search.
- **`/api/chat`**: Message persistence and conversation management.
- **`/api/wallet`**: Balance checks, deposit/withdrawal logic, and escrow management.
- **`/api/notifications`**: Management of user alerts and delivery status.
- **`/api/admin`**: Platform-wide moderation and analytics.

### External Integrations
- **Google Identity Services**: For secure, one-tap authentication.
- **Web-Push/VAPID**: For delivering notifications even when the browser is closed.
- **PostgreSQL**: Robust relational data storage.

---

## 💡 Pitch Highlights for Hackathon
- **Problem Solved**: Addresses the "trust gap" in the informal sector.
- **Innovation**: First-of-its-kind escrow system for blue-collar work in a modern UI.
- **Scalability**: Relational database (PostgreSQL) and modular backend allow for rapid scaling.
- **Accessibility**: PWA support ensures the app works on low-end devices and poor networks.
