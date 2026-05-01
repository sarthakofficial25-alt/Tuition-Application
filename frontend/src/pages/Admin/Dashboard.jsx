import React, { useEffect, useState } from 'react';
import { Users, BookText, Calendar, Bell, DollarSign, Wallet } from 'lucide-react';
import API from '../../api/api';
import { motion } from 'framer-motion';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        homeworkAssigned: 0,
        classesToday: 0,
        totalAnnouncements: 0,
        feesPaidCount: 0,
        feesPendingCount: 0,
        recentStudents: [],
        announcements: []
    });
    const [loading, setLoading] = useState(true);

    const [headAdminName, setHeadAdminName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsRes, studentsRes, headAdminRes, announcementsRes] = await Promise.all([
                    API.get('/admin/stats'),
                    API.get('/students'),
                    API.get('/auth/head-admin'),
                    API.get('/announcements')
                ]);
                
                setStats({
                    ...statsRes.data,
                    recentStudents: studentsRes.data.slice(0, 5).reverse(),
                    announcements: announcementsRes.data.slice(0, 3)
                });
                setHeadAdminName(headAdminRes.data.name);
            } catch (err) {
                console.error('Failed to fetch dashboard stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isHeadAdmin = user.role === 'head_admin';

    const cards = [
        { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Homework Assigned', value: stats.homeworkAssigned, icon: BookText, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Classes Today', value: stats.classesToday, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Notice Board', value: stats.totalAnnouncements, icon: Bell, color: 'text-rose-600', bg: 'bg-rose-50' },
        ...(isHeadAdmin ? [
            { label: 'Fees Paid', value: stats.feesPaidCount, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Fees Pending', value: stats.feesPendingCount, icon: Wallet, color: 'text-orange-600', bg: 'bg-orange-50' },
        ] : []),
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header with Management Authority */}
            <div className="bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black shadow-inner">
                        {headAdminName?.[0]}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Management Authority</p>
                        <p className="text-base font-bold text-slate-800">{headAdminName}</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></span>
                    Live Dashboard
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
                {cards.map((card, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white p-5 md:p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 flex flex-col items-center text-center"
                    >
                        <div className={`w-12 h-12 md:w-14 md:h-14 mb-3 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                            <card.icon className="w-6 h-6 md:w-7 md:h-7" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-0.5">{card.label}</p>
                            <p className="text-xl md:text-2xl font-black text-slate-800">{card.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>


            {/* Notice Board Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Registrations (Moved into grid) */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <Users className="w-6 h-6 text-primary-600" /> Recent Registrations
                        </h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                                <tr>
                                    <th className="px-8 py-5">Name</th>
                                    <th className="px-8 py-5">Class</th>
                                    {isHeadAdmin && <th className="px-8 py-5 text-right">Fee</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {stats.recentStudents.slice(0, 4).map((student, idx) => (
                                    <tr key={student._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                                                    {student.user?.name?.[0] || 'S'}
                                                </div>
                                                <span className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{student.user?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-md">Class {student.class}</span>
                                        </td>
                                        {isHeadAdmin && (
                                            <td className="px-8 py-4 text-right">
                                                <div className={`w-2 h-2 rounded-full ml-auto ${student.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-orange-500'}`}></div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Live Notice Board */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                            <Bell className="w-6 h-6 text-primary-600" /> Recent Notices
                        </h2>
                        <a href="/admin/announcements" className="text-[10px] font-black text-primary-600 hover:underline uppercase tracking-widest">View All</a>
                    </div>
                    <div className="p-8 space-y-4 flex-1">
                        {stats.announcements.length > 0 ? stats.announcements.map((ann, idx) => (
                            <motion.div 
                                key={ann._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary-200 transition-colors group cursor-default"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-slate-800 text-sm group-hover:text-primary-600 transition-colors">{ann.title}</h3>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-slate-100">
                                        {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{ann.content}</p>
                            </motion.div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                <Bell className="w-10 h-10 text-slate-200 mb-3" />
                                <p className="text-slate-400 text-sm font-medium italic">No notices posted yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
