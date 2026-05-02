import React, { useEffect, useState } from 'react';
import { Search, UserPlus, Trash2, ShieldCheck, Mail, Lock, Loader2, X, Phone, MapPin, ArrowLeft, CreditCard, Calendar, Eye, EyeOff, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api';

const EditTeacherModal = ({ isOpen, onClose, onTeacherUpdated, teacher }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        address: '',
        isHidden: false
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (teacher) {
            setFormData({
                name: teacher.name || '',
                email: teacher.email || '',
                phoneNumber: teacher.profile?.phoneNumber || '',
                address: teacher.profile?.address || '',
                isHidden: teacher.profile?.isHidden || false
            });
        }
    }, [teacher]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await API.put(`/admin/teachers/${teacher._id}`, formData);
            onTeacherUpdated(); 
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update teacher');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Edit Teacher Account</h3>
                                <p className="text-slate-500 text-sm">Modify administrative access for {teacher?.name}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-center border border-red-100">{error}</div>}
                            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Teacher Name</label>
                                    <div className="relative">
                                        <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        <input name="name" type="text" value={formData.name} required onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-slate-800 font-bold" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                                    <div className="relative"><Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input name="email" type="email" value={formData.email} required onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-slate-800" /></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                                    <div className="relative"><Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input name="phoneNumber" type="tel" value={formData.phoneNumber} required onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-slate-800" /></div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Residential Address</label>
                                    <div className="relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input name="address" type="text" value={formData.address} required onChange={handleChange} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-slate-800" /></div>
                                </div>
                                <div className="md:col-span-2">
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${formData.isHidden ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                                            {formData.isHidden ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1"><p className="text-sm font-bold text-slate-800">Public Visibility</p><p className="text-xs text-slate-500">{formData.isHidden ? 'Hidden from Landing Page' : 'Visible on Landing Page'}</p></div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" name="isHidden" checked={formData.isHidden} onChange={handleChange} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                        </label>
                                    </div>
                                </div>
                                <div className="md:col-span-2 pt-4">
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-primary-200">{loading ? <Loader2 className="animate-spin w-5 h-5" /> : 'Update Teacher Account'}</button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const Teachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [teacherToEdit, setTeacherToEdit] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, teacherId: null, teacherName: '' });

    const userRole = JSON.parse(sessionStorage.getItem('user') || '{}').role;
    const isHeadAdmin = userRole === 'head_admin';
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    
    // Payment States
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [isDeletingPayment, setIsDeletingPayment] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phoneNumber: '', address: '' });
    const [resetPassword, setResetPassword] = useState('');
    const [showTransferConfirm, setShowTransferConfirm] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [showAddPassword, setShowAddPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);

    const fetchTeachers = async () => {
        try {
            const { data } = await API.get('/admin/teachers');
            setTeachers(data);
            if (selectedTeacher) {
                const updated = data.find(t => t._id === selectedTeacher._id);
                if (updated) setSelectedTeacher(updated);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleAddTeacher = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        setFormError('');
        try {
            const { data } = await API.post('/admin/teachers', formData);
            setTeachers([...teachers, data]);
            setIsAddModalOpen(false);
            setFormData({ name: '', email: '', password: '', phoneNumber: '', address: '' });
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to add teacher');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteTeacher = async () => {
        if (!deleteConfirm.teacherId) return;
        setFormLoading(true);
        try {
            await API.delete(`/admin/teachers/${deleteConfirm.teacherId}`);
            setTeachers(teachers.filter(t => t._id !== deleteConfirm.teacherId));
            if (selectedTeacher?._id === deleteConfirm.teacherId) setSelectedTeacher(null);
            setDeleteConfirm({ isOpen: false, teacherId: null, teacherName: '' });
        } catch (err) {
            alert('Failed to delete teacher');
        } finally {
            setFormLoading(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!selectedTeacher) return;
        try {
            const { data } = await API.put(`/admin/teachers/${selectedTeacher._id}`, {
                paymentStatus: newStatus
            });
            setTeachers(teachers.map(t => t._id === selectedTeacher._id ? data : t));
            setSelectedTeacher(data);
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleResetPassword = async () => {
        if (!resetPassword || !selectedTeacher) return;
        setFormLoading(true);
        try {
            await API.put(`/admin/teachers/${selectedTeacher._id}`, {
                password: resetPassword
            });
            alert('Password reset successfully!');
            setResetPassword('');
            setShowResetConfirm(false);
        } catch (err) {
            alert('Failed to reset password');
        } finally {
            setFormLoading(false);
        }
    };

    const handleTransferRole = async () => {
        if (!selectedTeacher) return;
        setFormLoading(true);
        try {
            await API.post('/admin/transfer-head-role', { targetUserId: selectedTeacher._id });
            alert('Role transferred successfully! You will now be logged out.');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to transfer role');
        } finally {
            setFormLoading(false);
        }
    };

    const handleRecordPayment = async () => {
        if (!selectedTeacher || !paymentDate) return;
        try {
            const { data } = await API.put(`/admin/teachers/${selectedTeacher._id}`, {
                paymentStatus: 'paid',
                newPayment: {
                    date: paymentDate,
                    amount: paymentAmount,
                    remarks: `Teacher payment recorded on ${new Date().toLocaleDateString()}`
                }
            });
            setTeachers(teachers.map(t => t._id === selectedTeacher._id ? data : t));
            setSelectedTeacher(data);
            setShowPaymentForm(false);
            setPaymentAmount('');
            alert('Payment recorded successfully!');
        } catch (err) {
            alert('Failed to record payment');
        }
    };

    const handleDeletePayment = async () => {
        if (!paymentToDelete) return;
        setIsDeletingPayment(true);
        try {
            const { data } = await API.delete(`/admin/teachers/${selectedTeacher._id}/payments/${paymentToDelete}`);
            setTeachers(teachers.map(t => t._id === selectedTeacher._id ? data : t));
            setSelectedTeacher(data);
            setPaymentToDelete(null);
        } catch (err) {
            alert('Failed to delete payment');
        } finally {
            setIsDeletingPayment(false);
        }
    };

    const filteredTeachers = teachers.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading Admin Teachers...</div>;

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm.isOpen && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => !formLoading && setDeleteConfirm({ ...deleteConfirm, isOpen: false })}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Remove Access?</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                Are you sure you want to remove all administrative access for <span className="font-bold text-slate-800">{deleteConfirm.teacherName}</span>? This action cannot be undone.
                            </p>

                            <div className="flex gap-4">
                                <button onClick={() => setDeleteConfirm({ ...deleteConfirm, isOpen: false })} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">Cancel</button>
                                <button onClick={handleDeleteTeacher} disabled={formLoading} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-200 flex items-center justify-center gap-2">
                                    {formLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Yes, Remove'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Payment Delete Confirmation Modal */}
            <AnimatePresence>
                {paymentToDelete && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isDeletingPayment && setPaymentToDelete(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-10 text-center">
                            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><Trash2 className="w-10 h-10" /></div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Delete Record?</h3>
                            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Are you sure you want to permanently delete this payment record? This cannot be undone.</p>
                            <div className="flex gap-4">
                                <button disabled={isDeletingPayment} onClick={() => setPaymentToDelete(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">Cancel</button>
                                <button disabled={isDeletingPayment} onClick={handleDeletePayment} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-100 flex items-center justify-center">{isDeletingPayment ? 'Deleting...' : 'Delete'}</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Role Transfer Confirmation Modal */}
            <AnimatePresence>
                {showTransferConfirm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !formLoading && setShowTransferConfirm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center">
                            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><ShieldCheck className="w-10 h-10" /></div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Transfer Authority?</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                You are about to transfer the **Head Admin** role to <span className="font-bold text-slate-800">{selectedTeacher.name}</span>. 
                                <br/><br/>
                                You will become a regular **Admin Teacher** and lose full control over management features. **This action is irreversible.**
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowTransferConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">Cancel</button>
                                <button onClick={handleTransferRole} disabled={formLoading} className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition shadow-lg shadow-primary-200 flex items-center justify-center gap-2">
                                    {formLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Yes, Transfer'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            
            {/* Reset Password Confirmation Modal */}
            <AnimatePresence>
                {showResetConfirm && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !formLoading && setShowResetConfirm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center">
                            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><Lock className="w-10 h-10" /></div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Reset Password?</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                Are you sure you want to change the password for <span className="font-bold text-slate-800">{selectedTeacher.name}</span>? 
                                <br/><br/>
                                They will need to use the new password to log in next time.
                            </p>
                            <div className="flex gap-4">
                                <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition">Cancel</button>
                                <button onClick={handleResetPassword} disabled={formLoading} className="flex-1 py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition shadow-lg shadow-primary-200 flex items-center justify-center gap-2">
                                    {formLoading ? <Loader2 className="animate-spin w-4 h-4" /> : 'Yes, Reset'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {selectedTeacher ? (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedTeacher(null)} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-800">Teacher Profile</h2>
                            <p className="text-slate-500 text-sm">Manage payments and info for {selectedTeacher.name}</p>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-24 bg-primary-50 -z-10" />
                                <div className="w-24 h-24 bg-white text-primary-600 rounded-[2rem] flex items-center justify-center text-4xl font-black mx-auto mb-4 shadow-xl shadow-primary-100 border-4 border-white">{selectedTeacher.name[0]}</div>
                                <h3 className="text-xl font-black text-slate-800">{selectedTeacher.name}</h3>
                                <p className="text-slate-500 text-sm mb-6">{selectedTeacher.email}</p>
                                <span className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm ${selectedTeacher.profile?.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'}`}>
                                    Fees: {selectedTeacher.profile?.paymentStatus || 'pending'}
                                </span>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Actions</h4>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type={showResetPassword ? "text" : "password"}
                                            placeholder="New Password" 
                                            value={resetPassword}
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowResetPassword(!showResetPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition"
                                        >
                                            {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => setShowResetConfirm(true)}
                                        disabled={!resetPassword || formLoading}
                                        className="w-full py-3 bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition disabled:opacity-50"
                                    >
                                        {formLoading ? 'Resetting...' : 'Reset Password'}
                                    </button>
                                </div>
                                <div className="pt-4 border-t border-slate-50 space-y-4">
                                    <button 
                                        onClick={() => setShowTransferConfirm(true)}
                                        className="w-full py-4 bg-amber-50 text-amber-600 rounded-2xl text-sm font-black hover:bg-amber-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck className="w-4 h-4" /> Transfer Head Role
                                    </button>
                                    <button onClick={() => setDeleteConfirm({ isOpen: true, teacherId: selectedTeacher._id, teacherName: selectedTeacher.name })} className="w-full py-4 bg-red-50 text-red-600 rounded-2xl text-sm font-black hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Terminate Access</button>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                                <h4 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600"><ShieldCheck className="w-5 h-5" /></div>
                                    Professional Details
                                    {isHeadAdmin && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setTeacherToEdit(selectedTeacher);
                                                setIsEditModalOpen(true);
                                            }}
                                            className="p-2.5 bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"
                                            title="Edit Teacher"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                    )}
                                </h4>
                                <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Teacher Name</label><p className="text-slate-800 font-bold text-lg">{selectedTeacher.name}</p></div>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address</label><p className="text-slate-600 font-medium text-sm">{selectedTeacher.email}</p></div>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label><p className="text-slate-800 font-bold text-lg">{selectedTeacher.profile?.phoneNumber}</p></div>
                                    <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Current Status</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            {['pending', 'paid'].map(status => (
                                                <button key={status} onClick={() => handleStatusChange(status)} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedTeacher.profile?.paymentStatus === status ? (status === 'paid' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-orange-600 text-white shadow-lg shadow-orange-100') : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>{status}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Residential Address</label><p className="text-slate-800 font-bold text-lg">{selectedTeacher.profile?.address}</p></div>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                    <h4 className="text-lg font-black text-slate-800 flex items-center gap-3"><div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><CreditCard className="w-5 h-5" /></div>Payment History</h4>
                                    <button onClick={() => setShowPaymentForm(!showPaymentForm)} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2">{showPaymentForm ? 'Cancel' : '+ Record Payment'}</button>
                                </div>

                                {showPaymentForm && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-50 p-8 rounded-3xl mb-8 border border-slate-100">
                                        <div className="grid sm:grid-cols-2 gap-6">
                                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Payment Date</label><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm" /></div>
                                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount</label><input type="number" placeholder="Enter amount" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm" /></div>
                                        </div>
                                        <button onClick={handleRecordPayment} className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100">Save Payment Record</button>
                                    </motion.div>
                                )}

                                <div className="space-y-4">
                                    {(selectedTeacher.profile?.paymentHistory || []).length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left">
                                                <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                                    <tr><th className="pb-4 px-2">Month</th><th className="pb-4 px-2">Date</th><th className="pb-4 px-2">Amount</th><th className="pb-4 px-2 text-right">Status</th></tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {selectedTeacher.profile.paymentHistory.slice().reverse().map((pay, i) => (
                                                        <tr key={i} className="group">
                                                            <td className="py-4 px-2 font-bold text-slate-800">{pay.month}</td>
                                                            <td className="py-4 px-2 text-slate-400 text-sm">{new Date(pay.date).toLocaleDateString('en-IN')}</td>
                                                            <td className="py-4 px-2 font-bold text-slate-600">₹{pay.amount || 0}</td>
                                                            <td className="py-4 px-2 text-right flex items-center justify-end gap-3">
                                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Paid</span>
                                                                <button onClick={(e) => { e.stopPropagation(); setPaymentToDelete(pay._id); }} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Delete record"><Trash2 className="w-3.5 h-3.5" /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200"><p className="text-slate-400 font-medium italic">No payment history available yet.</p></div>}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ) : (
                <>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Admin Teachers</h2>
                            <p className="text-slate-500">Manage secondary administrative accounts and payments</p>
                        </div>
                        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-200"><UserPlus className="w-5 h-5" /> Add Admin Teacher</button>
                    </div>

                    <div className="relative max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition" />
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {filteredTeachers.map((teacher) => (
                                <motion.div key={teacher._id} onClick={() => setSelectedTeacher(teacher)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-[4rem] -z-10 group-hover:bg-primary-100 transition-colors" />
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-white text-primary-600 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg shadow-primary-100 border border-primary-50">{teacher.name[0]}</div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{teacher.name}</h3>
                                            <div className="flex items-center gap-1 text-primary-600 text-[10px] font-black uppercase tracking-widest"><ShieldCheck className="w-3 h-3" /> Admin Teacher</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-slate-500 text-sm"><Mail className="w-4 h-4" />{teacher.email}</div>
                                        <div className="flex items-center gap-3 text-slate-500 text-sm"><Phone className="w-4 h-4" />{teacher.profile?.phoneNumber || 'N/A'}</div>
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${teacher.profile?.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${teacher.profile?.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-orange-500'}`} />
                                            Fees: {teacher.profile?.paymentStatus || 'pending'}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Click to manage payments</span>
                                        <div className="flex items-center gap-1">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setTeacherToEdit(teacher); 
                                                    setIsEditModalOpen(true); 
                                                }} 
                                                className="p-2 text-slate-300 hover:text-primary-600 transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setDeleteConfirm({ isOpen: true, teacherId: teacher._id, teacherName: teacher.name }); 
                                                }} 
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </>
            )}

            {/* Add Teacher Modal */}
            <AnimatePresence>{isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !formLoading && setIsAddModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden overflow-y-auto max-h-[90vh]">
                        <div className="flex items-center justify-between mb-8"><h3 className="text-2xl font-bold text-slate-800">Add Admin Teacher</h3><button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl transition"><X className="w-6 h-6 text-slate-400" /></button></div>
                        {formError && <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium">{formError}</div>}
                        <form onSubmit={handleAddTeacher} className="grid md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Teacher Name</label><input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-800" placeholder="Full Name" /></div>
                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address</label><input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-800" placeholder="email@example.com" /></div>
                            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Phone Number</label><input type="tel" required value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-800" placeholder="+91 98765 43210" /></div>
                            <div className="md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Residential Address</label><input type="text" required value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-800" placeholder="Full residential address" /></div>
                            <div className="md:col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Initial Password</label>
                                <div className="relative">
                                    <input 
                                        type={showAddPassword ? "text" : "password"}
                                        required 
                                        value={formData.password} 
                                        onChange={(e) => setFormData({...formData, password: e.target.value})} 
                                        className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold text-slate-800" 
                                        placeholder="••••••••" 
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAddPassword(!showAddPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition"
                                    >
                                        {showAddPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" disabled={formLoading} className="md:col-span-2 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary-700 transition shadow-lg shadow-primary-200 flex items-center justify-center gap-2">{formLoading ? <Loader2 className="animate-spin" /> : 'Create Teacher Account'}</button>
                        </form>
                    </motion.div>
                </div>
            )}</AnimatePresence>
            <EditTeacherModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                teacher={teacherToEdit}
                onTeacherUpdated={() => {
                    fetchTeachers();
                    if (selectedTeacher && teacherToEdit && selectedTeacher._id === teacherToEdit._id) {
                        API.get('/admin/teachers').then(res => {
                            const updated = res.data.find(t => t._id === selectedTeacher._id);
                            if (updated) setSelectedTeacher(updated);
                        });
                    }
                }}
            />
        </div>
    );
};

export default Teachers;
