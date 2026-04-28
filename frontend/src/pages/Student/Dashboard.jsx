import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { BookText, Calendar, Bell, Award, CheckCircle, Clock } from 'lucide-react';
import API from '../../api/api';

const StudentDashboard = () => {
    const [data, setData] = useState({
        homework: [],
        schedule: [],
        results: [],
        announcements: []
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [hw, sch, res, ann] = await Promise.all([
                    API.get('/homework/my'),
                    API.get('/schedule/my'),
                    API.get('/results/my'),
                    API.get('/announcements')
                ]);
                setData({
                    homework: hw.data,
                    schedule: sch.data,
                    results: res.data,
                    announcements: ann.data
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const stats = [
        { label: 'Total Homework', value: data.homework.length, icon: BookText, color: 'bg-indigo-50 text-indigo-600' },
        { label: 'Classes Today', value: data.schedule.length, icon: Calendar, color: 'bg-emerald-50 text-emerald-600' },
        { label: 'Total Results', value: data.results.length, icon: Award, color: 'bg-amber-50 text-amber-600' },
        { label: 'Recent Notices', value: data.announcements.length, icon: Bell, color: 'bg-primary-50 text-primary-600' },
    ];

    return (
        <div className="space-y-8">
            {/* Stats Header */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className={`w-12 h-12 ${stat.color} rounded-2xl flex items-center justify-center`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Recent Homework */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <BookText className="text-primary-600" /> Recent Homework
                        </h2>
                        <div className="grid gap-4">
                            {data.homework.length > 0 ? data.homework.slice(0, 3).map(hw => (
                                <div key={hw._id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                    <h3 className="font-bold text-slate-800 mb-1">{hw.title}</h3>
                                    <p className="text-slate-600 text-sm mb-4">{hw.description}</p>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                                            <Clock className="w-3.5 h-3.5" /> Due: {new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <span className="bg-primary-50 text-primary-600 px-3 py-1 rounded-full font-black uppercase tracking-widest text-[9px]">New</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center">
                                    <p className="text-slate-400 font-medium italic">No homework assigned yet.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Test Results */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Award className="text-primary-600" /> Recent Results
                        </h2>
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                    <tr>
                                        <th className="px-8 py-5 font-black">Subject</th>
                                        <th className="px-8 py-5 font-black">Marks</th>
                                        <th className="px-8 py-5 font-black">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.results.length > 0 ? data.results.slice(0, 5).map(res => (
                                        <tr key={res._id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-8 py-5 font-bold text-slate-800">{res.testName}</td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-primary-600 font-black text-lg">{res.marksObtained}</span>
                                                    <span className="text-slate-300 text-sm">/ {res.totalMarks}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-slate-500 text-sm font-medium">
                                                {res.testDate ? new Date(res.testDate).toLocaleDateString('en-IN') : new Date(res.createdAt).toLocaleDateString('en-IN')}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="px-8 py-12 text-center text-slate-400 italic">No results recorded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>

                {/* Sidebar Content */}
                <div className="space-y-8">
                    {/* Schedule */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="text-primary-600" /> Today's Schedule
                        </h2>
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                            {data.schedule.length > 0 ? data.schedule.map(sch => (
                                <div key={sch._id} className="flex items-start gap-5 group cursor-pointer">
                                    <div className="w-1.5 h-12 bg-primary-500 rounded-full group-hover:scale-y-110 transition-transform"></div>
                                    <div>
                                        <p className="font-black text-slate-800 group-hover:text-primary-600 transition-colors">{sch.subject}</p>
                                        <p className="text-slate-400 text-sm font-bold mt-0.5">{sch.time}</p>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6">
                                    <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium italic text-sm">No classes for today.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Notice Board */}
                    <section>
                        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Bell className="text-primary-600" /> Notice Board
                        </h2>
                        <div className="space-y-4">
                            {data.announcements.length > 0 ? data.announcements.slice(0, 3).map(ann => (
                                <div key={ann._id} className="bg-primary-50/50 p-6 rounded-[2rem] border border-primary-100 shadow-sm hover:shadow-md transition-all">
                                    <h3 className="font-black text-primary-900 text-sm mb-2">{ann.title}</h3>
                                    <p className="text-primary-800 text-xs leading-relaxed font-medium">{ann.content}</p>
                                </div>
                            )) : (
                                <p className="text-slate-400 text-center py-4 italic text-sm">No new announcements.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
