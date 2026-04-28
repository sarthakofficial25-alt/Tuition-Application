import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bell, Plus, Pencil, Trash2, X, Check, 
    AlertCircle, Loader2, Megaphone, Users, User, Layers, Search
} from 'lucide-react';
import { ALL_CLASS_IDS } from '../../constants/classData';


const token = () => sessionStorage.getItem('token');

const AdminNotice = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [form, setForm] = useState({ 
        title: '', 
        content: '', 
        targetType: 'All', 
        targetClasses: [], 
        targetStudent: '' 
    });

    useEffect(() => {
        fetchAnnouncements();
        fetchStudents();
    }, []);

    const fetchAnnouncements = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/announcements');
            setAnnouncements(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const { data } = await API.get('/students');
            setStudents(data);
        } catch (err) {
            console.error('Failed to fetch students:', err);
        }
    };

    const handleOpenAdd = () => {
        setEditing(null);
        setForm({ title: '', content: '', targetType: 'All', targetClasses: [], targetStudent: '' });
        setError('');
        setShowModal(true);
    };

    const handleOpenEdit = (ann) => {
        setEditing(ann);
        setForm({ 
            title: ann.title, 
            content: ann.content, 
            targetType: ann.targetType || 'All',
            targetClasses: ann.targetClasses || [],
            targetStudent: ann.targetStudent?._id || ann.targetStudent || ''
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.content.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        if (form.targetType === 'Class' && form.targetClasses.length === 0) {
            setError('Please select at least one class.');
            return;
        }
        if (form.targetType === 'Student' && !form.targetStudent) {
            setError('Please select a student.');
            return;
        }

        setFormLoading(true);
        try {
            const headers = { Authorization: `Bearer ${token()}` };
            const payload = { ...form };
            if (payload.targetType !== 'Class') payload.targetClasses = [];
            if (payload.targetType !== 'Student') payload.targetStudent = null;

            if (editing) {
                const { data } = await API.put(`/announcements/${editing._id}`, payload);
                setAnnouncements(prev => prev.map(a => a._id === data._id ? data : a));
            } else {
                const { data } = await API.post('/announcements', payload);
                setAnnouncements(prev => [data, ...prev]);
            }
            setShowModal(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save notice.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            await API.delete(`/announcements/${deleting._id}`);
            setAnnouncements(prev => prev.filter(a => a._id !== deleting._id));
            setDeleting(null);
        } catch (err) {
            setError('Failed to delete notice.');
        } finally {
            setFormLoading(false);
        }
    };

    const toggleClass = (clsId) => {
        setForm(f => ({
            ...f,
            targetClasses: f.targetClasses.includes(clsId)
                ? f.targetClasses.filter(c => c !== clsId)
                : [...f.targetClasses, clsId]
        }));
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Megaphone className="w-8 h-8 text-primary-600" /> Notice Board
                    </h1>
                    <p className="text-slate-500 mt-1">Broadcast updates or target specific students/classes</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition shadow-lg shadow-primary-200"
                >
                    <Plus className="w-5 h-5" /> New Notice
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                    <p className="text-slate-500 font-medium">Loading announcements...</p>
                </div>
            ) : announcements.length === 0 ? (
                <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bell className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Notices Yet</h3>
                    <p className="text-slate-500">Your broadcast history will appear here once you post an update.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    <AnimatePresence>
                        {announcements.map((ann, idx) => (
                            <motion.div
                                key={ann._id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-start group hover:shadow-md transition-shadow"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                        <h3 className="font-bold text-slate-800 text-lg">{ann.title}</h3>
                                        
                                        {/* Target Badge */}
                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                            {(!ann.targetType || ann.targetType === 'All') ? (
                                                <><Users className="w-3 h-3" /> All Students</>
                                            ) : ann.targetType === 'Class' ? (
                                                <><Layers className="w-3 h-3" /> Classes: {(ann.targetClasses || []).join(', ')}</>
                                            ) : (
                                                <><User className="w-3 h-3" /> To: {ann.targetStudent?.name || 'Specific Student'}</>
                                            )}
                                        </div>

                                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                                            {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 leading-relaxed max-w-3xl">{ann.content}</p>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => handleOpenEdit(ann)}
                                        className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"
                                    >
                                        <Pencil className="w-5 h-5" />
                                    </button>
                                    <button 
                                        onClick={() => setDeleting(ann)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Form Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {editing ? 'Edit Notice' : 'New Notice'}
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

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Targeting Section */}
                                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="w-4 h-4 text-primary-600" />
                                            <span className="text-sm font-bold text-slate-700">Send To</span>
                                        </div>
                                        <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-100">
                                            {['All', 'Class', 'Student'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setForm({...form, targetType: type})}
                                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                                        form.targetType === type 
                                                        ? 'bg-primary-600 text-white shadow-md' 
                                                        : 'text-slate-500 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Target Options */}
                                        <AnimatePresence mode="wait">
                                            {form.targetType === 'Class' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                    className="grid grid-cols-4 gap-2 pt-2"
                                                >
                                                    {ALL_CLASS_IDS.map(cls => (
                                                        <button
                                                            key={cls}
                                                            type="button"
                                                            onClick={() => toggleClass(cls)}
                                                            className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                                                                form.targetClasses.includes(cls)
                                                                ? 'border-primary-600 bg-primary-50 text-primary-600'
                                                                : 'border-transparent bg-white text-slate-400'
                                                            }`}
                                                        >
                                                            Class {cls}
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}

                                            {form.targetType === 'Student' && (
                                                <motion.div 
                                                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                    className="pt-2"
                                                >
                                                    <div className="relative">
                                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <select
                                                            value={form.targetStudent}
                                                            onChange={e => setForm({...form, targetStudent: e.target.value})}
                                                            className="w-full pl-10 pr-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none appearance-none cursor-pointer focus:border-primary-500"
                                                        >
                                                            <option value="">Select a student...</option>
                                                            {students.map(s => (
                                                                <option key={s._id} value={s.user?._id || s.user}>
                                                                    {s.user?.name || 'Unknown'} (Class {s.class})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Notice Title</label>
                                        <input 
                                            type="text" 
                                            value={form.title}
                                            onChange={e => setForm({...form, title: e.target.value})}
                                            placeholder="e.g. Tomorrow's Schedule Update"
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Message Content</label>
                                        <textarea 
                                            value={form.content}
                                            onChange={e => setForm({...form, content: e.target.value})}
                                            placeholder="Write your detailed update here..."
                                            rows={4}
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition resize-none"
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
                                    >
                                        {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                        {editing ? 'Update Notice' : 'Post Notice'}
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
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete Notice?</h2>
                            <p className="text-slate-500 mb-8 text-sm">This message will be removed for all targeted recipients.</p>
                            <div className="flex gap-4">
                                <button onClick={() => setDeleting(null)} className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition">
                                    Cancel
                                </button>
                                <button onClick={handleDelete} disabled={formLoading} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition">
                                    {formLoading ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminNotice;
