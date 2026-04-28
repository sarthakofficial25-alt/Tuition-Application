import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BookText, BookOpen, CalendarDays, Clock, AlertCircle, Loader2, X } from 'lucide-react';

import { API_BASE_URL as API } from '../../config';

const token = () => sessionStorage.getItem('token');

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const isOverdue = (d) => d && new Date(d) < new Date();

// ── Detail Modal ──────────────────────────────────────────────────────────────
const HomeworkDetailModal = ({ hw, onClose }) => {
    if (!hw) return null;
    const overdue = isOverdue(hw.dueDate);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="relative p-8 md:p-10">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center">
                            <BookOpen className="w-7 h-7" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{hw.title}</h2>
                            <p className="text-primary-600 font-semibold">{hw.subject}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</p>
                            <p className="text-sm font-bold text-slate-700">{hw.subject}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</p>
                            <div className={`flex items-center gap-2 font-bold ${overdue ? 'text-red-600' : 'text-emerald-600'}`}>
                                <CalendarDays className="w-5 h-5" />
                                {fmt(hw.dueDate)} {overdue && '(Overdue)'}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 mb-8">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instructions</p>
                        <div className="bg-slate-50 p-6 rounded-3xl text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                            {hw.description || 'No detailed instructions provided.'}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <p className="text-xs text-slate-400 italic">Posted on {new Date(hw.createdAt).toLocaleString('en-IN')}</p>
                        <button onClick={onClose} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition shadow-lg shadow-slate-200">
                            Close
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const StudentHomework = () => {
    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewTarget, setViewTarget] = useState(null);

    useEffect(() => {
        fetchHomework();
    }, []);

    const fetchHomework = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.get(`${API}/homework/my`, {
                headers: { Authorization: `Bearer ${token()}` }
            });
            setHomeworks(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load homework.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <BookText className="w-8 h-8 text-primary-600" /> My Homework
                </h1>
                <p className="text-slate-500 mt-2">View and track your assignments across all subjects</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Loading State */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading your assignments...</p>
                </div>
            ) : homeworks.length === 0 ? (
                <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">All Caught Up!</h3>
                    <p className="text-slate-500">No homework assigned to your class at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {homeworks.map((hw, idx) => {
                            const overdue = isOverdue(hw.dueDate);
                            return (
                                <motion.div
                                    key={hw._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => setViewTarget(hw)}
                                    className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col h-full cursor-pointer"
                                >
                                    {/* Subject Tag */}
                                    <div className="mb-4">
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-600 uppercase tracking-wider">
                                            {hw.subject}
                                        </span>
                                    </div>

                                    {/* Title & Description */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-primary-600 transition-colors">
                                            {hw.title}
                                        </h3>
                                        <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-4">
                                            {hw.description || 'No detailed instructions provided.'}
                                        </p>
                                    </div>

                                    {/* Footer Info */}
                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <CalendarDays className="w-4 h-4" />
                                            <span className="text-xs font-medium">Due {fmt(hw.dueDate)}</span>
                                        </div>
                                        {hw.dueDate && (
                                            <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight
                                                ${overdue ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                <Clock className="w-3 h-3" />
                                                {overdue ? 'Overdue' : 'Active'}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence>
                {viewTarget && (
                    <HomeworkDetailModal
                        hw={viewTarget}
                        onClose={() => setViewTarget(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default StudentHomework;
