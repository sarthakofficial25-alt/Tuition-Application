# Excellence Coaching Centre

A full-stack coaching centre management application built with React, Node.js, and MongoDB.

## Features
- **Admin Dashboard**: Manage students, assign homework, update schedules, and post announcements.
- **Student Dashboard**: View assigned homework, class schedules, test results, and payment status.
- **Secure Authentication**: JWT-based login and registration system.
- **Modern UI**: Responsive design with Tailwind CSS and premium aesthetics.
- **Auto-Approval**: Admin Teachers are automatically approved upon creation.
- **SPA Routing Fix**: Enhanced support for page reloads without 404 errors.

## Prerequisites
- Node.js (v18 or higher)
- MongoDB installed and running locally on `mongodb://localhost:27017`

## Setup Instructions

### 1. Backend Setup
1. Open a terminal in the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example` and fill in your details.
4. Start the backend server:
   ```bash
   npm start
   ```
   *Note: The Head Admin is automatically seeded using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from your `.env` file.*

### 2. Frontend Setup
1. Open another terminal in the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

## Deployment

### Frontend (Vercel)
The project includes a `vercel.json` file to handle client-side routing. To deploy:
1. Push the code to GitHub.
2. Connect your repository to Vercel.
3. Set the "Output Directory" to `dist` (if using Vite build).

### Backend
Ensure you set the environment variables on your hosting platform (Render, Heroku, etc.):
- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Lucide React, Axios, Framer Motion.
- **Backend**: Node.js, Express, Mongoose, JWT, Bcrypt.
- **Database**: MongoDB.
