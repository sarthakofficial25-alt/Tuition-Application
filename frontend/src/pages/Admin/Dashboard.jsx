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
        recentStudents: []
    });
    const [loading, setLoading] = useState(true);

    const [headAdminName, setHeadAdminName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [statsRes, studentsRes, headAdminRes] = await Promise.all([
                    API.get('/admin/stats'),
                    API.get('/students'),
                    API.get('/auth/head-admin')
                ]);
                
                setStats({
                    ...statsRes.data,
                    recentStudents: studentsRes.data.slice(0, 5).reverse()
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
            {/* Header with Head Admin Name */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Admin Overview</h1>
                    <p className="text-slate-500 font-medium">Monitoring tuition activities and student progress</p>
                </div>
                <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black">
                        {headAdminName?.[0]}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Management Authority</p>
                        <p className="text-sm font-bold text-slate-800">{headAdminName}</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {cards.map((card, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                    >
                        <div className="flex flex-col items-center text-center gap-3">
                            <div className={`w-14 h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                                <card.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{card.label}</p>
                                <p className="text-2xl font-black text-slate-800">{card.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Recent Students Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary-600" /> Recent Registrations
                    </h2>
                    <span className="text-xs font-bold text-slate-400">Latest 5 Students</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                            <tr>
                                <th className="px-8 py-5">Name</th>
                                <th className="px-8 py-5">Class</th>
                                <th className="px-8 py-5">Phone</th>
                                {isHeadAdmin && <th className="px-8 py-5 text-right">Fee Status</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {stats.recentStudents.map((student, idx) => (
                                <motion.tr 
                                    key={student._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="hover:bg-slate-50/50 transition-colors group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                                                {student.user?.name?.[0] || 'S'}
                                            </div>
                                            <span className="font-bold text-slate-800">{student.user?.name || 'Unknown Student'}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-black text-primary-600 bg-primary-50 px-2 py-1 rounded-md">Class {student.class}</span>
                                    </td>
                                    <td className="px-8 py-5 text-slate-500 text-sm font-medium">{student.phoneNumber}</td>
                                    {isHeadAdmin && (
                                        <td className="px-8 py-5 text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                                                student.paymentStatus === 'paid' 
                                                ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' 
                                                : 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                                            }`}>
                                                {student.paymentStatus}
                                            </span>
                                        </td>
                                    )}
                                </motion.tr>
                            ))}
                            {stats.recentStudents.length === 0 && (
                                <tr>
                                    <td colSpan={isHeadAdmin ? "4" : "3"} className="px-8 py-20 text-center text-slate-400 italic">No students registered yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
