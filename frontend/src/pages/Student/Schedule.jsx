import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, Loader2, BookOpen } from 'lucide-react';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const token = () => sessionStorage.getItem('token');

const StudentSchedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/schedule/my');
            setSchedule(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Group by day
    const grouped = DAYS.reduce((acc, day) => {
        const classes = schedule.filter(s => s.day === day);
        if (classes.length > 0) acc[day] = classes;
        return acc;
    }, {});

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-primary-600" /> Class Timetable
                    </h1>
                    <p className="text-slate-500 mt-1">Your weekly schedule at Excellence Coaching Centre</p>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                    <p className="text-slate-500 font-medium">Preparing your timetable...</p>
                </div>
            ) : Object.keys(grouped).length === 0 ? (
                <div className="bg-white rounded-[2rem] p-20 text-center border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Scheduled Classes</h3>
                    <p className="text-slate-500">Contact the center if you think your schedule is missing.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-10">
                    <AnimatePresence>
                        {DAYS.map((day, dIdx) => grouped[day] && (
                            <motion.div 
                                key={day}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: dIdx * 0.1 }}
                                className="space-y-4"
                            >
                                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 ml-2">
                                    <span className="w-1.5 h-6 bg-primary-600 rounded-full"></span>
                                    {day}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {grouped[day].map((sch, idx) => (
                                        <motion.div
                                            key={sch._id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: (dIdx * 0.1) + (idx * 0.05) }}
                                            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden"
                                        >
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white transition-colors duration-500">
                                                    <BookOpen className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">
                                                        {sch.subjects?.join(' + ') || sch.subject}
                                                    </h3>
                                                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Session</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3 pt-2">
                                                <div className="flex items-center gap-3 text-slate-600 text-sm">
                                                    <Clock className="w-4 h-4 text-primary-400" />
                                                    <span className="font-bold">{sch.time}</span>
                                                </div>
                                                {sch.teacher && (
                                                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                                                        <User className="w-4 h-4 text-slate-300" />
                                                        <span className="font-medium">{sch.teacher}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default StudentSchedule;
