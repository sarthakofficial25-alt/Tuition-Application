import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X as CloseIcon } from 'lucide-react';
import API from '../api/api';

const DashboardLayout = ({ children, role }) => {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const [showProfile, setShowProfile] = React.useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const profileRef = React.useRef(null);
    const sidebarRef = React.useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const [headAdminName, setHeadAdminName] = React.useState('');

    React.useEffect(() => {
        const fetchHeadAdmin = async () => {
            try {
                const { data } = await API.get('/auth/head-admin');
                setHeadAdminName(data.name);
            } catch (err) {
                console.error('Failed to fetch head admin name');
            }
        };
        if (role === 'admin' || role === 'head_admin') {
            fetchHeadAdmin();
        }

        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setShowProfile(false);
            }
            if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target) && !event.target.closest('.hamburger-btn')) {
                setIsSidebarOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isSidebarOpen]);

    // Close sidebar on route change
    React.useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="flex min-h-screen bg-slate-50 w-full relative">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div 
                ref={sidebarRef}
                className={`fixed inset-y-0 left-0 z-[100] transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <Sidebar role={role} onClose={() => setIsSidebarOpen(false)} />
            </div>

            <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="hamburger-btn p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-primary-600 transition shadow-sm lg:hidden"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Welcome back, {user.name}</h1>
                        {(role === 'admin' || role === 'head_admin') && headAdminName && (
                            <p className="text-primary-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse"></span>
                                Principal Authority: {headAdminName}
                            </p>
                        )}
                        <p className="text-slate-500">Here's what's happening today</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div 
                            ref={profileRef}
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-4 cursor-pointer hover:bg-white p-2 rounded-2xl transition-all relative"
                        >
                            <div className="text-right hidden md:block">
                                <p className="font-semibold text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{user.role?.replace('_', ' ')}</p>
                            </div>
                            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                                {user.name?.[0]}
                            </div>

                            {showProfile && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="border-b border-slate-50 pb-3 mb-3 text-center">
                                        <p className="font-bold text-slate-800 break-words">{user.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{user.role?.replace('_', ' ')}</p>
                                    </div>
                                    {user.role === 'student' && (
                                        <button 
                                            onClick={() => { setShowProfile(false); navigate('/student/profile'); }}
                                            className="w-full flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-50 p-2 rounded-xl transition-all mb-1"
                                        >
                                            View Profile
                                        </button>
                                    )}
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 p-2 rounded-xl transition-all"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default DashboardLayout;
