# Excellence Coaching Centre

A full-stack coaching centre management application built with React, Node.js, and MongoDB.

## Features
- **Admin Dashboard**: Manage students, assign homework, update schedules, and post announcements.
- **Student Dashboard**: View assigned homework, class schedules, test results, and payment status.
- **Secure Authentication**: JWT-based login and registration system.
- **Modern UI**: Responsive design with Tailwind CSS and premium aesthetics.

## Prerequisites
- Node.js (v16 or higher)
- MongoDB installed and running locally on `mongodb://localhost:27017`

## Setup Instructions

### 1. Backend Setup
1. Open a terminal in the `backend` directory.
2. The dependencies are already installed. If not, run:
   ```bash
   npm install
   ```
3. Seed the initial admin user and sample data:
   ```bash
   node seed.js
   ```
   *Default Admin Login: `admin@tuition.com` / `adminpassword`*
4. Start the backend server:
   ```bash
   npm start
   ```
   The server will run on `http://localhost:5000`.

### 2. Frontend Setup
1. Open another terminal in the `frontend` directory.
2. The dependencies are already installed. If not, run:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the URL shown in the terminal (usually `http://localhost:5173`).

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide React, Axios, Framer Motion.
- **Backend**: Node.js, Express, Mongoose, JWT, Bcrypt.
- **Database**: MongoDB (Local).
