import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Plus, Pencil, Trash2, X, Check, 
    AlertCircle, Loader2, Clock, User 
} from 'lucide-react';
import { CLASS_DATA, ALL_CLASS_IDS } from '../../constants/classData';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const token = () => sessionStorage.getItem('token');

const AdminSchedule = () => {
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [form, setForm] = useState({ className: '', subject: '', day: '', time: '', teacher: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    const [filterClass, setFilterClass] = useState('All');

    useEffect(() => {
        fetchSchedules();
    }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/schedule');
            setSchedules(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditing(null);
        setForm({ className: '', subject: '', day: '', time: '', teacher: '' });
        setError('');
        setShowModal(true);
    };

    const handleOpenEdit = (sch) => {
        setEditing(sch);
        setForm({ 
            className: sch.class, 
            subject: sch.subject, 
            day: sch.day, 
            time: sch.time, 
            teacher: sch.teacher || '' 
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.className || !form.subject || !form.day || !form.time) {
            setError('Please fill in all required fields.');
            return;
        }

        setFormLoading(true);
        try {
            if (editing) {
                const { data } = await API.put(`/schedule/${editing._id}`, form);
                setSchedules(prev => prev.map(s => s._id === data._id ? data : s));
            } else {
                const { data } = await API.post('/schedule', form);
                setSchedules(prev => [...prev, data]);
            }
            setShowModal(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save schedule.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            await API.delete(`/schedule/${deleting._id}`);
            setSchedules(prev => prev.filter(s => s._id !== deleting._id));
            setDeleting(null);
        } catch (err) {
            setError('Failed to delete schedule.');
        } finally {
            setFormLoading(false);
        }
    };

    const filteredSchedules = schedules.filter(s => filterClass === 'All' || s.class === filterClass);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-primary-600" /> Class Schedule
                    </h1>
                    <p className="text-slate-500 mt-1">Manage weekly timetables for all classes</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition shadow-lg shadow-primary-200"
                >
                    <Plus className="w-5 h-5" /> Add Class
                </button>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 w-fit">
                <span className="text-xs font-bold text-slate-400 px-3 uppercase tracking-wider">Filter Class:</span>
                <div className="flex gap-1">
                    {['All', ...ALL_CLASS_IDS].map(c => (
                        <button 
                            key={c}
                            onClick={() => setFilterClass(c)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${filterClass === c ? 'bg-primary-600 text-white shadow-md shadow-primary-100' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {c === 'All' ? 'All' : `Class ${c}`}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                    <p className="text-slate-500 font-medium">Loading schedule...</p>
                </div>
            ) : filteredSchedules.length === 0 ? (
                <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Classes Found</h3>
                    <p className="text-slate-500">Start by adding a class to the schedule.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredSchedules.map((sch, idx) => (
                            <motion.div
                                key={sch._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button onClick={() => handleOpenEdit(sch)} className="p-2 bg-white/80 backdrop-blur shadow-sm rounded-lg text-slate-400 hover:text-primary-600 transition">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setDeleting(sch)} className="p-2 bg-white/80 backdrop-blur shadow-sm rounded-lg text-slate-400 hover:text-red-600 transition">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="mb-4">
                                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-md uppercase tracking-wider">Class {sch.class}</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-4">{sch.subject}</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <span className="font-semibold text-slate-700">{sch.day}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <span className="font-medium">{sch.time}</span>
                                    </div>
                                    {sch.teacher && (
                                        <div className="flex items-center gap-3 text-slate-500 text-sm">
                                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium italic">{sch.teacher}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {editing ? 'Edit Schedule Item' : 'Add New Class'}
                                    </h2>
                                    <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-50 rounded-full transition">
                                        <X className="w-6 h-6 text-slate-400" />
                                    </button>
                                </div>

                                {error && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
                                        <AlertCircle className="w-5 h-5" />
                                        <p className="text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Class</label>
                                        <select 
                                            value={form.className}
                                            onChange={e => setForm({...form, className: e.target.value})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition appearance-none"
                                        >
                                            <option value="">Select Class</option>
                                            {ALL_CLASS_IDS.map(c => <option key={c} value={c}>Class {c}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                                        <select 
                                            value={form.subject}
                                            onChange={e => setForm({...form, subject: e.target.value})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition appearance-none"
                                        >
                                            <option value="">Select Subject</option>
                                            {CLASS_DATA.find(c => c.id === form.className)?.subjects.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            )) || (
                                                <option value="" disabled>Select a class first</option>
                                            )}
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Day</label>
                                        <select 
                                            value={form.day}
                                            onChange={e => setForm({...form, day: e.target.value})}
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition appearance-none"
                                        >
                                            <option value="">Select Day</option>
                                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Time</label>
                                        <input 
                                            type="text" 
                                            value={form.time}
                                            onChange={e => setForm({...form, time: e.target.value})}
                                            placeholder="e.g. 4:00 PM - 5:30 PM"
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Teacher (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={form.teacher}
                                            onChange={e => setForm({...form, teacher: e.target.value})}
                                            placeholder="Name of the instructor"
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition"
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={formLoading}
                                        className="col-span-2 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition shadow-lg shadow-primary-200 flex items-center justify-center gap-2 mt-2"
                                    >
                                        {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                        {editing ? 'Update Timetable' : 'Save to Schedule'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation */}
            <AnimatePresence>
                {deleting && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Remove class?</h2>
                            <p className="text-slate-500 mb-8 text-sm">This will remove this class entry from the student's timetable.</p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setDeleting(null)}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    disabled={formLoading}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-200"
                                >
                                    {formLoading ? 'Removing...' : 'Remove'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSchedule;
