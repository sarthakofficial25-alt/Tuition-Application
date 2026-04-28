import React from 'react';
import { NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    BookText, 
    Calendar, 
    Bell, 
    Settings, 
    GraduationCap, 
    CreditCard,
    User,
    LogOut,
    ShieldCheck,
    BookOpen,
    X
} from 'lucide-react';

const Sidebar = ({ role, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = role === 'admin' || role === 'head_admin';
    const isHeadAdmin = role === 'head_admin';
    
    const menuItems = isAdmin 
        ? [
            { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/admin/students', icon: Users, label: 'Students' },
            ...(isHeadAdmin ? [{ path: '/admin/teachers', icon: ShieldCheck, label: 'Admin Teachers' }] : []),
            { path: '/admin/homework', icon: BookText, label: 'Homework' },
            { path: '/admin/schedule', icon: Calendar, label: 'Schedule' },
            {path: '/admin/announcements', icon: Bell, label: 'Notice' },
            { path: '/admin/results', icon: GraduationCap, label: 'Results' },
            { path: '/admin/teachers-list', icon: BookOpen, label: 'Our Teachers' },
        ]
        : [
            { path: '/student', icon: LayoutDashboard, label: 'Dashboard' },
            { path: '/student/profile', icon: User, label: 'My Profile' },
            { path: '/student/homework', icon: BookText, label: 'My Homework' },
            { path: '/student/schedule', icon: Calendar, label: 'My Schedule' },
            { path: '/student/announcements', icon: Bell, label: 'Notice' },
            { path: '/student/results', icon: GraduationCap, label: 'My Results' },
            { path: '/student/teachers', icon: BookOpen, label: 'Our Teachers' },
        ];

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        navigate('/');
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 h-full flex flex-col transition-colors duration-300">
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={onClose}>
                    <BookOpen className="w-8 h-8 text-primary-600 shrink-0" />
                    <span className="text-lg font-bold text-slate-900 leading-tight">Excellence</span>
                </Link>
                <button 
                    onClick={onClose}
                    className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition lg:hidden"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                                isActive 
                                    ? 'bg-primary-50 text-primary-600 font-semibold' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
