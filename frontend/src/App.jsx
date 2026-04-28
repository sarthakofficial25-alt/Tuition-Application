import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminStudents from './pages/Admin/Students';
import AdminHomework from './pages/Admin/Homework';
import AdminTeachers from './pages/Admin/Teachers';
import AdminNotice from './pages/Admin/Announcements';
import AdminSchedule from './pages/Admin/Schedule';
import AdminResults from './pages/Admin/Results';
import StudentDashboard from './pages/Student/Dashboard';
import StudentHomework from './pages/Student/Homework';
import StudentNotice from './pages/Student/Announcements';
import StudentSchedule from './pages/Student/Schedule';
import StudentResults from './pages/Student/Results';
import StudentProfile from './pages/Student/Profile';
import Teachers from './pages/Teachers';
import DashboardLayout from './components/DashboardLayout';

// Protected Route Component
const ProtectedRoute = ({ children, role }) => {
    const token = sessionStorage.getItem('token');
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    if (!token) return <Navigate to="/login" />;
    
    if (role) {
        const roles = Array.isArray(role) ? role : [role];
        if (!roles.includes(user.role)) return <Navigate to="/" />;
    }

    return children;
};

const PageTransition = ({ children }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
    >
        {children}
    </motion.div>
);

const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<PageTransition><Landing /></PageTransition>} />
                <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
                <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
                
                {/* Admin Routes */}
                <Route 
                    path="/admin/*" 
                    element={
                        <ProtectedRoute role={['admin', 'head_admin']}>
                            <DashboardLayout role={JSON.parse(sessionStorage.getItem('user') || '{}').role}>
                                <Routes>
                                    <Route path="/" element={<AdminDashboard />} />
                                    <Route path="/students" element={<AdminStudents />} />
                                    <Route path="/teachers" element={<AdminTeachers />} />
                                    <Route path="/homework" element={<AdminHomework />} />
                                    <Route path="/schedule" element={<AdminSchedule />} />
                                    <Route path="/announcements" element={<AdminNotice />} />
                                    <Route path="/results" element={<AdminResults />} />
                                    <Route path="/teachers-list" element={<Teachers />} />
                                </Routes>
                            </DashboardLayout>
                        </ProtectedRoute>
                    } 
                />

                {/* Student Routes */}
                <Route 
                    path="/student/*" 
                    element={
                        <ProtectedRoute role="student">
                            <DashboardLayout role="student">
                                <Routes>
                                    <Route path="/" element={<StudentDashboard />} />
                                    <Route path="/homework" element={<StudentHomework />} />
                                    <Route path="/schedule" element={<StudentSchedule />} />
                                    <Route path="/announcements" element={<StudentNotice />} />
                                    <Route path="/results" element={<StudentResults />} />
                                    <Route path="/profile" element={<StudentProfile />} />
                                    <Route path="/teachers" element={<Teachers />} />
                                </Routes>
                            </DashboardLayout>
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </AnimatePresence>
    );
};

function App() {
    return (
        <Router>
            <AnimatedRoutes />
        </Router>
    );
}

export default App;
