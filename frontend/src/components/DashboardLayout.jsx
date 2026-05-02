import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X as CloseIcon, LogOut } from 'lucide-react';
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
            // Try to get from sessionStorage first
            const cachedName = sessionStorage.getItem('headAdminName');
            if (cachedName) {
                setHeadAdminName(cachedName);
                return;
            }

            try {
                const { data } = await API.get('/auth/head-admin');
                setHeadAdminName(data.name);
                sessionStorage.setItem('headAdminName', data.name);
            } catch (err) {
                console.error('Failed to fetch head admin name');
            }
        };
        if (role === 'admin' || role === 'head_admin') {
            fetchHeadAdmin();
        }
    }, [role]);

    React.useEffect(() => {
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

            <main className="flex-1 overflow-y-auto w-full flex flex-col">
                {/* Unified Header */}
                <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="hamburger-btn p-2.5 bg-slate-50 text-slate-600 rounded-xl lg:hidden hover:bg-primary-50 hover:text-primary-600 transition"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <div className="hidden sm:block lg:hidden font-bold text-slate-900 truncate max-w-[150px]">
                            Excellence
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-slate-800 leading-none mb-1">{user.name}</p>
                            <p className="text-[10px] text-primary-600 font-black uppercase tracking-widest">{user.role?.replace('_', ' ')}</p>
                        </div>
                        
                        <div className="relative" ref={profileRef}>
                            <button 
                                onClick={() => setShowProfile(!showProfile)}
                                className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold hover:scale-105 transition shadow-sm"
                            >
                                {user.name?.[0]}
                            </button>

                            <AnimatePresence>
                                {showProfile && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-3 z-50"
                                    >
                                        <div className="p-3 border-b border-slate-50 mb-2">
                                            <p className="font-bold text-slate-800 text-sm truncate">{user.name}</p>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{user.role?.replace('_', ' ')}</p>
                                        </div>
                                        {user.role === 'student' && (
                                            <button 
                                                onClick={() => { setShowProfile(false); navigate('/student/profile'); }}
                                                className="w-full flex items-center gap-2 text-sm text-slate-600 hover:bg-slate-50 p-2.5 rounded-xl transition-all"
                                            >
                                                My Profile
                                            </button>
                                        )}
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 p-2.5 rounded-xl transition-all"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>
                
                <div className="p-5 md:p-10 flex-1">
                    <div className="mb-8">
                        <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Welcome, {user.name}</h2>
                        {(role === 'admin' || role === 'head_admin') && headAdminName && (
                            <p className="text-primary-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mt-1.5">
                                <span className="w-1.5 h-1.5 bg-primary-600 rounded-full animate-pulse"></span>
                                Principal Authority: {headAdminName} 
                            </p>
                        )}
                        <p className="text-slate-400 text-sm font-medium mt-1">Here's your summary for today</p>
                    </div>
                
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
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
