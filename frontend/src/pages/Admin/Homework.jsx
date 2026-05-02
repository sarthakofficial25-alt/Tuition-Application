import React, { useState, useEffect } from 'react';
import API from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookText, Plus, Pencil, Trash2, X, Check, ChevronDown,
    CalendarDays, BookOpen, Users, AlertCircle, Loader2
} from 'lucide-react';
import { CLASS_DATA, ALL_SUBJECTS, ALL_CLASS_IDS } from '../../constants';

// CLASS_OPTIONS: 'All' + every class ID from the landing page
const CLASS_OPTIONS = ['All', ...ALL_CLASS_IDS];

const token = () => sessionStorage.getItem('token');

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const isOverdue = (d) => d && new Date(d) < new Date();

// ── Class Badge ───────────────────────────────────────────────────────────────
const ClassBadge = ({ cls }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold
        ${cls === 'All' ? 'bg-violet-100 text-violet-700' : 'bg-primary-100 text-primary-700'}`}>
        {cls === 'All' ? 'All Classes' : `Class ${cls}`}
    </span>
);

// ── Multi-select class picker ─────────────────────────────────────────────────
const ClassPicker = ({ selected, onChange }) => {
    const [open, setOpen] = useState(false);

    const toggle = (cls) => {
        if (cls === 'All') { onChange(['All']); setOpen(false); return; }
        let next = selected.filter(c => c !== 'All');
        if (next.includes(cls)) next = next.filter(c => c !== cls);
        else next = [...next, cls];
        onChange(next.length ? next : []);
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between gap-2 px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm text-slate-700 hover:border-primary-400 transition-colors"
            >
                <span className="flex flex-wrap gap-1 min-h-[1.5rem]">
                    {selected.length === 0 ? <span className="text-slate-400">Select classes…</span>
                        : selected.map(c => <ClassBadge key={c} cls={c} />)}
                </span>
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl p-2 grid grid-cols-4 gap-1"
                    >
                        {CLASS_OPTIONS.map(cls => (
                            <button
                                key={cls} type="button" onClick={() => toggle(cls)}
                                className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold transition-all
                                    ${selected.includes(cls)
                                        ? cls === 'All' ? 'bg-violet-600 text-white' : 'bg-primary-600 text-white'
                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                            >
                                {selected.includes(cls) && <Check className="w-3 h-3" />}
                                {cls === 'All' ? 'All' : `Cls ${cls}`}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── Form Modal ────────────────────────────────────────────────────────────────
const HomeworkModal = ({ initial, onClose, onSave }) => {
    const editing = !!initial;
    const [form, setForm] = useState({
        title: initial?.title || '',
        subject: initial?.subject || (ALL_SUBJECTS.length > 0 ? ALL_SUBJECTS[0] : ''),
        description: initial?.description || '',
        targetClasses: initial?.targetClasses || [],
        dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
    });
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const submit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) { setErr('Title is required.'); return; }
        if (!form.subject) { setErr('Subject is required.'); return; }
        if (form.targetClasses.length === 0) { setErr('Select at least one class.'); return; }
        setLoading(true); setErr('');
        try {
            if (editing) {
                const { data } = await API.put(`/homework/${initial._id}`, form);
                onSave(data, true);
            } else {
                const { data } = await API.post('/homework', form);
                onSave(data, false);
            }
            onClose();
        } catch (e) {
            setErr(e.response?.data?.message || 'Something went wrong.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                            <BookText className="w-5 h-5" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">
                            {editing ? 'Edit Homework' : 'Assign New Homework'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={submit} className="p-6 space-y-4">
                    {err && (
                        <div className="flex items-center gap-2 bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
                            <AlertCircle className="w-4 h-4 shrink-0" /> {err}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
                        <input value={form.title} onChange={e => set('title', e.target.value)}
                            placeholder="e.g. Chapter 3 Exercise"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Subject *</label>
                        <select value={form.subject} onChange={e => set('subject', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition bg-white">
                            {/* Show subjects available in the selected classes; always include 'Others' */}
                            {(form.targetClasses.length === 0 || form.targetClasses.includes('All')
                                ? ALL_SUBJECTS
                                : [...new Set(CLASS_DATA
                                    .filter(c => form.targetClasses.includes(c.id))
                                    .flatMap(c => c.subjects)), 'Others']
                            ).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Assign To *</label>
                        <ClassPicker selected={form.targetClasses} onChange={v => set('targetClasses', v)} />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                        <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition" />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Description / Instructions</label>
                        <textarea value={form.description} onChange={e => set('description', e.target.value)}
                            rows={3} placeholder="Describe what students need to do…"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 transition resize-none" />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {editing ? 'Save Changes' : 'Assign Homework'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

// ── Delete Confirm ────────────────────────────────────────────────────────────
const DeleteConfirm = ({ hw, onClose, onDelete }) => {
    const [loading, setLoading] = useState(false);
    const confirm = async (e) => {
        e.stopPropagation();
        setLoading(true);
        try {
            await API.delete(`/homework/${hw._id}`);
            onDelete(hw._id);
            onClose();
        } catch { setLoading(false); }
    };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center">
                <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">Delete Homework?</h3>
                <p className="text-sm text-slate-500 mb-6">
                    "<span className="font-semibold text-slate-700">{hw.title}</span>" will be permanently removed.
                </p>
                <div className="flex gap-3">
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition">
                        Cancel
                    </button>
                    <button onClick={confirm} disabled={loading}
                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned To</p>
                            <div className="flex flex-wrap gap-2">
                                {(hw.targetClasses || []).map(c => <ClassBadge key={c} cls={c} />)}
                            </div>
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
                            {hw.description || 'No description provided.'}
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

// ── Homework Card ─────────────────────────────────────────────────────────────
const HomeworkCard = ({ hw, onEdit, onDelete, onClick }) => {
    const overdue = isOverdue(hw.dueDate);
    return (
        <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => onClick(hw)}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all cursor-pointer p-5 flex flex-col gap-3 group">

            {/* Top row */}
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300">
                        <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-slate-800 truncate group-hover:text-primary-600 transition-colors">{hw.title}</h3>
                        <p className="text-xs text-slate-500">{hw.subject}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onEdit(hw); }}
                        className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(hw); }}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Description */}
            {hw.description && (
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{hw.description}</p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
                {/* Classes */}
                <div className="flex items-center gap-1 flex-wrap">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {(hw.targetClasses || []).map(c => <ClassBadge key={c} cls={c} />)}
                </div>
                {/* Due date */}
                {hw.dueDate && (
                    <div className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full
                        ${overdue ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                        <CalendarDays className="w-3.5 h-3.5" />
                        {overdue ? 'Overdue · ' : 'Due · '}{fmt(hw.dueDate)}
                    </div>
                )}
            </div>

            {/* Posted date */}
            <p className="text-[11px] text-slate-400">Posted {fmt(hw.createdAt)}</p>
        </motion.div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const AdminHomework = () => {
    const [homeworks, setHomeworks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [viewTarget, setViewTarget] = useState(null);
    const [filterClass, setFilterClass] = useState('All');
    const [filterSubject, setFilterSubject] = useState('All');

    useEffect(() => {
        fetchHomework();
    }, []);

    const fetchHomework = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/homework');
            setHomeworks(data);
        } catch (err) { /* silent */ }
        finally { setLoading(false); }
    };

    const handleSave = (hw, isEdit) => {
        if (isEdit) setHomeworks(prev => prev.map(h => h._id === hw._id ? hw : h));
        else setHomeworks(prev => [hw, ...prev]);
    };

    const handleDelete = (id) => setHomeworks(prev => prev.filter(h => h._id !== id));

    const openEdit = (hw) => { setEditTarget(hw); setShowModal(true); };
    const openAdd = () => { setEditTarget(null); setShowModal(true); };

    // Filtering
    const filtered = homeworks.filter(hw => {
        const clsMatch = filterClass === 'All' || (hw.targetClasses || []).includes(filterClass) || (hw.targetClasses || []).includes('All');
        const subMatch = filterSubject === 'All' || hw.subject === filterSubject;
        return clsMatch && subMatch;
    });

    const subjects = ['All', ...new Set(homeworks.map(h => h.subject).filter(Boolean))];

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <BookText className="w-6 h-6 text-primary-600" /> Homework Management
                    </h2>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {homeworks.length} total assignment{homeworks.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button onClick={openAdd}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-200 transition-all hover:scale-105 active:scale-95">
                    <Plus className="w-4 h-4" /> Assign Homework
                </button>
            </div>

            {/* Filter bar */}
            <div className="flex gap-3 flex-wrap">
                {/* Class filter */}
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-sm">
                    <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">Class:</span>
                    {['All', ...CLASS_OPTIONS.filter(c => c !== 'All')].map(c => (
                        <button key={c} onClick={() => setFilterClass(c)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all
                                ${filterClass === c ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                            {c === 'All' ? 'All' : c}
                        </button>
                    ))}
                </div>
                {/* Subject filter */}
                <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
                    className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-300">
                    {subjects.map(s => <option key={s}>{s}</option>)}
                </select>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-24 text-slate-400">
                    <BookText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">No homework found</p>
                    <p className="text-sm">Click "Assign Homework" to get started.</p>
                </div>
            ) : (
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {filtered.map(hw => (
                            <HomeworkCard key={hw._id} hw={hw} onEdit={openEdit} onDelete={setDeleteTarget} onClick={setViewTarget} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showModal && (
                    <HomeworkModal
                        key="hw-modal"
                        initial={editTarget}
                        onClose={() => setShowModal(false)}
                        onSave={handleSave}
                    />
                )}
                {deleteTarget && (
                    <DeleteConfirm
                        key="del-modal"
                        hw={deleteTarget}
                        onClose={() => setDeleteTarget(null)}
                        onDelete={handleDelete}
                    />
                )}
                {viewTarget && (
                    <HomeworkDetailModal
                        key="view-modal"
                        hw={viewTarget}
                        onClose={() => setViewTarget(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminHomework;
