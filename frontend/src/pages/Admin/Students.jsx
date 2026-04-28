import React, { useEffect, useState } from 'react';
import { Search, UserPlus, Filter, MoreVertical, Edit2, Trash2, ArrowLeft, User, Lock, TrendingUp, Phone, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../api/api';
import AddStudentModal from './AddStudentModal';
import EditStudentModal from './EditStudentModal';
import { ALL_CLASS_IDS } from '../../constants/classData';

const Students = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('roster'); // 'roster' or 'pending'
    const [pendingStudents, setPendingStudents] = useState([]);

    const [selectedStudent, setSelectedStudent] = useState(null);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [studentToEdit, setStudentToEdit] = useState(null);
    const [approvalConfirm, setApprovalConfirm] = useState({ isOpen: false, student: null, type: null });
    const filterRef = React.useRef(null);

    // Payment History States
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentToDelete, setPaymentToDelete] = useState(null);
    const [isDeletingPayment, setIsDeletingPayment] = useState(false);

    // Promotion States
    const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
    const [promotionClass, setPromotionClass] = useState('');
    const [isPromoting, setIsPromoting] = useState(false);
    const [formLoading, setFormLoading] = useState(false);

    const userRole = JSON.parse(sessionStorage.getItem('user') || '{}').role;
    const isHeadAdmin = userRole === 'head_admin';

    const fetchStudents = async () => {
        try {
            const { data } = await API.get('/students');
            // Final defensive mapping to ensure joiningDate is always a valid value
            const processedData = data.map(student => ({
                ...student,
                joiningDate: student.joiningDate || student.user?.createdAt || student.createdAt || new Date().toISOString()
            }));
            setStudents(processedData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPending = async () => {
        if (!isHeadAdmin) return;
        try {
            const { data } = await API.get('/admin/pending-approvals');
            setPendingStudents(data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchStudents();
        if (isHeadAdmin) fetchPending();
    }, [isHeadAdmin]);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = classFilter === 'all' || student.class.toString() === classFilter;
        const matchesStatus = statusFilter === 'all' || student.paymentStatus === statusFilter;
        return matchesSearch && matchesClass && matchesStatus;
    });

    const handleStatusChange = async (newStatus) => {
        if (!selectedStudent) return;
        try {
            const { data } = await API.put(`/students/${selectedStudent._id}`, {
                paymentStatus: newStatus
            });
            
            // Update the main list
            setStudents(students.map(s => s._id === selectedStudent._id ? { ...s, paymentStatus: newStatus } : s));
            
            // Update the current view
            setSelectedStudent({ ...selectedStudent, paymentStatus: newStatus });
        } catch (err) {
            console.error(err);
            alert('Failed to update fee status');
        }
    };

    const handlePromoteStudent = async () => {
        if (!selectedStudent || !promotionClass) return;
        setIsPromoting(true);
        try {
            const { data } = await API.put(`/students/${selectedStudent._id}`, {
                className: promotionClass
            });
            
            // Update local state
            setStudents(students.map(s => s._id === selectedStudent._id ? data : s));
            setSelectedStudent(data);
            setIsPromoteModalOpen(false);
            setPromotionClass('');
            alert(`Student promoted to Class ${promotionClass} successfully!`);
        } catch (err) {
            console.error(err);
            alert('Failed to promote student');
        } finally {
            setIsPromoting(false);
        }
    };

    const handleRecordPayment = async () => {
        if (!selectedStudent || !paymentDate) return;
        try {
            const { data } = await API.put(`/students/${selectedStudent._id}`, {
                paymentStatus: 'paid',
                newPayment: {
                    date: paymentDate,
                    amount: paymentAmount,
                    remarks: `Fee payment recorded on ${new Date().toLocaleDateString()}`
                }
            });

            // Update local state
            setStudents(students.map(s => s._id === selectedStudent._id ? data : s));
            setSelectedStudent(data);
            setShowPaymentForm(false);
            setPaymentAmount('');
            alert('Payment recorded successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to record payment');
        }
    };

    const handleDeletePayment = async () => {
        if (!paymentToDelete) return;
        setIsDeletingPayment(true);
        try {
            const { data } = await API.delete(`/students/${selectedStudent._id}/payments/${paymentToDelete}`);
            setStudents(students.map(s => s._id === selectedStudent._id ? data : s));
            setSelectedStudent(data);
            setPaymentToDelete(null);
        } catch (err) {
            console.error(err);
            alert('Failed to delete payment');
        } finally {
            setIsDeletingPayment(false);
        }
    };

    const handleDeleteClick = (e, student) => {
        e.stopPropagation();
        setStudentToDelete(student);
        setShowDeleteConfirm(true);
    };

    const handleFinalDelete = async () => {
        if (!studentToDelete) return;
        setIsDeleting(true);
        try {
            await API.delete(`/students/${studentToDelete._id}`);
            setStudents(students.filter(s => s._id !== studentToDelete._id));
            setShowDeleteConfirm(false);
            setStudentToDelete(null);
            if (selectedStudent?._id === studentToDelete._id) setSelectedStudent(null);
        } catch (err) {
            console.error(err);
            alert('Failed to delete student');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleApproveClick = (student) => {
        setApprovalConfirm({ isOpen: true, student, type: 'approve' });
    };

    const handleRejectClick = (student) => {
        setApprovalConfirm({ isOpen: true, student, type: 'reject' });
    };

    const handleFinalStatusAction = async () => {
        const { student, type } = approvalConfirm;
        if (!student || !type) return;

        setFormLoading(true);
        try {
            if (type === 'approve') {
                await API.put(`/admin/approve-user/${student._id}`);
                setPendingStudents(pendingStudents.filter(s => s._id !== student._id));
                fetchStudents();
                alert('Student approved successfully!');
            } else {
                await API.delete(`/admin/reject-user/${student._id}`);
                setPendingStudents(pendingStudents.filter(s => s._id !== student._id));
                alert('Registration rejected and deleted permanently.');
            }
            setApprovalConfirm({ isOpen: false, student: null, type: null });
        } catch (err) {
            console.error(err);
            alert(`Failed to ${type} student`);
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading students...</div>;

    return (
        <div className="space-y-6 relative">
            {/* ===== PROMOTION MODAL ===== */}
            <AnimatePresence>
                {isPromoteModalOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => !isPromoting && setIsPromoteModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-indigo-500" />
                            
                            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <TrendingUp className="w-10 h-10" />
                            </div>
                            
                            <h3 className="text-2xl font-black text-center text-slate-800 mb-2">Promote Student</h3>
                            <p className="text-slate-500 text-center text-sm mb-8 font-medium">
                                Upgrade <span className="text-slate-800 font-bold">{selectedStudent?.user?.name}</span> to a new class level.
                            </p>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Select New Class</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {ALL_CLASS_IDS.map(cls => (
                                            <button
                                                key={cls}
                                                onClick={() => setPromotionClass(cls)}
                                                className={`py-3 rounded-2xl text-sm font-black transition-all border-2 ${
                                                    promotionClass === cls 
                                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200' 
                                                        : (selectedStudent?.class?.toString() === cls ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed opacity-50' : 'bg-white border-slate-100 text-slate-600 hover:border-primary-200 hover:text-primary-600')
                                                }`}
                                                disabled={selectedStudent?.class?.toString() === cls}
                                            >
                                                {cls}
                                            </button>
                                        ))}
                                    </div>
                                    {selectedStudent?.class && (
                                        <p className="text-[10px] text-slate-400 mt-3 italic text-center">Currently in Class {selectedStudent.class}</p>
                                    )}
                                </div>

                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                                    <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                                        Promoting will update the student's dashboard and allow them to access class-specific content.
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button 
                                        disabled={isPromoting}
                                        onClick={() => setIsPromoteModalOpen(false)}
                                        className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        disabled={isPromoting || !promotionClass}
                                        onClick={handlePromoteStudent}
                                        className="flex-[2] py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition shadow-lg shadow-primary-100 flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isPromoting ? 'Promoting...' : 'Confirm Promotion'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ===== SINGLE GLOBAL DELETE CONFIRMATION MODAL ===== */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 text-center"
                        >
                            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Student?</h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                Are you sure you want to delete <span className="font-bold text-slate-800">{studentToDelete?.user?.name}</span>? This action cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button 
                                    disabled={isDeleting}
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={isDeleting}
                                    onClick={handleFinalDelete}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? 'Deleting...' : 'Confirm'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ===== APPROVAL/REJECTION CONFIRMATION MODAL ===== */}
            <AnimatePresence>
                {approvalConfirm.isOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => !formLoading && setApprovalConfirm({ isOpen: false, student: null, type: null })}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center overflow-hidden"
                        >
                            <div className={`absolute top-0 left-0 w-full h-2 ${approvalConfirm.type === 'approve' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${approvalConfirm.type === 'approve' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {approvalConfirm.type === 'approve' ? <Check className="w-10 h-10" /> : <Trash2 className="w-10 h-10" />}
                            </div>
                            
                            <h3 className="text-2xl font-black text-slate-800 mb-2">
                                {approvalConfirm.type === 'approve' ? 'Approve Registration?' : 'Reject Registration?'}
                            </h3>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
                                {approvalConfirm.type === 'approve' 
                                    ? `Are you sure you want to approve ${approvalConfirm.student?.name}? They will gain immediate access to the student dashboard.`
                                    : `Are you sure you want to reject ${approvalConfirm.student?.name}? This will permanently delete their account request.`
                                }
                            </p>
                            
                            <div className="flex gap-4">
                                <button 
                                    disabled={formLoading}
                                    onClick={() => setApprovalConfirm({ isOpen: false, student: null, type: null })}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={formLoading}
                                    onClick={handleFinalStatusAction}
                                    className={`flex-1 py-4 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2 ${
                                        approvalConfirm.type === 'approve' 
                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                                            : 'bg-red-600 hover:bg-red-700 shadow-red-100'
                                    }`}
                                >
                                    {formLoading ? <Loader2 className="animate-spin w-4 h-4" /> : (approvalConfirm.type === 'approve' ? 'Yes, Approve' : 'Yes, Reject')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ===== PAYMENT DELETE CONFIRMATION MODAL ===== */}
            <AnimatePresence>
                {paymentToDelete && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => !isDeletingPayment && setPaymentToDelete(null)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl p-10 text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Trash2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2">Delete Record?</h3>
                            <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">
                                Are you sure you want to permanently delete this payment record? This cannot be undone.
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    disabled={isDeletingPayment}
                                    onClick={() => setPaymentToDelete(null)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    disabled={isDeletingPayment}
                                    onClick={handleDeletePayment}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-100 flex items-center justify-center"
                                >
                                    {isDeletingPayment ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ===== VIEW TOGGLE (Head Admin Only) ===== */}
            {isHeadAdmin && (
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-8 border border-slate-200/50">
                    <button 
                        onClick={() => setViewMode('roster')}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'roster' ? 'bg-white text-primary-600 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Student Roster
                    </button>
                    <button 
                        onClick={() => setViewMode('pending')}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all relative ${viewMode === 'pending' ? 'bg-white text-primary-600 shadow-md shadow-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pending Approvals
                        {pendingStudents.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white animate-bounce">
                                {pendingStudents.length}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {selectedStudent ? (

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSelectedStudent(null)}
                            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-800">Student Profile</h2>
                            <p className="text-slate-500 text-sm">Detailed information for {selectedStudent.user?.name}</p>
                        </div>
                        {isHeadAdmin && (
                            <button 
                                onClick={() => setIsPromoteModalOpen(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
                            >
                                <TrendingUp className="w-4 h-4" /> Promote Student
                            </button>
                        )}
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-24 bg-primary-50 -z-10" />
                                <div className="w-24 h-24 bg-white text-primary-600 rounded-[2rem] flex items-center justify-center text-4xl font-black mx-auto mb-4 shadow-xl shadow-primary-100 border-4 border-white">
                                    {selectedStudent.user?.name?.[0]}
                                </div>
                                <h3 className="text-xl font-black text-slate-800">{selectedStudent.user?.name}</h3>
                                <p className="text-slate-500 text-sm mb-6">{selectedStudent.user?.email}</p>
                                {isHeadAdmin && (
                                    <span className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm ${
                                        selectedStudent.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100' : 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'
                                    }`}>
                                        {selectedStudent.paymentStatus}
                                    </span>
                                )}
                            </div>

                            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Account Info</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">Member Since</span>
                                        <span className="text-slate-800 font-bold text-sm">
                                            {new Date(selectedStudent.joiningDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400 text-sm">Role</span>
                                        <span className="text-primary-600 font-bold text-sm capitalize">{selectedStudent.user?.role}</span>
                                    </div>
                                </div>
                                {isHeadAdmin && (
                                    <button 
                                        onClick={(e) => handleDeleteClick(e, selectedStudent)}
                                        className="w-full py-4 bg-red-50 text-red-600 rounded-2xl text-sm font-black hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Terminate Student
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-8">
                            {/* Personal Info */}
                            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                                <h4 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    Personal Details
                                    {isHeadAdmin && (
                                        <button 
                                            onClick={() => {
                                                setStudentToEdit(selectedStudent);
                                                setIsEditModalOpen(true);
                                            }}
                                            className="ml-auto p-2 bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"
                                            title="Edit Student"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </h4>
                                <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Full Name</label>
                                        <p className="text-slate-800 font-bold text-lg">{selectedStudent.user?.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Contact Number</label>
                                        <p className="text-slate-800 font-bold text-lg">{selectedStudent.phoneNumber}</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Class Section</label>
                                        <div className="flex items-center gap-3">
                                            <p className="text-primary-600 font-black text-lg">Grade {selectedStudent.class}</p>
                                            {isHeadAdmin && (
                                                <button 
                                                    onClick={() => setIsPromoteModalOpen(true)}
                                                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                                                    title="Promote Class"
                                                >
                                                    <TrendingUp className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Email Address</label>
                                        <p className="text-slate-600 font-medium text-sm">{selectedStudent.user?.email}</p>
                                    </div>
                                    {isHeadAdmin && (
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Current Fee Status</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                {['pending', 'paid'].map(status => (
                                                    <button
                                                        key={status}
                                                        onClick={() => handleStatusChange(status)}
                                                        className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                            selectedStudent.paymentStatus === status
                                                                ? (status === 'paid' ? 'bg-emerald-50 text-white shadow-lg shadow-emerald-100' : 'bg-orange-50 text-white shadow-lg shadow-orange-100')
                                                                : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div className="sm:col-span-2">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">School Name</label>
                                         <p className="text-slate-800 font-bold text-lg">{selectedStudent.schoolName || 'No school provided'}</p>
                                     </div>
                                     <div className="sm:col-span-2">
                                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Residential Address</label>
                                         <p className="text-slate-800 font-bold text-lg">{selectedStudent.address || 'No address provided'}</p>
                                     </div>
                                </div>
                            </div>

                            {/* Payment History */}
                            {isHeadAdmin && (
                                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                                        <h4 className="text-lg font-black text-slate-800 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                                <Lock className="w-5 h-5" /> 
                                            </div>
                                            Payment History
                                        </h4>
                                        
                                        <button 
                                            onClick={() => setShowPaymentForm(!showPaymentForm)}
                                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
                                        >
                                            {showPaymentForm ? 'Cancel' : '+ Record Payment'}
                                        </button>
                                    </div>

                                    {showPaymentForm && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                            className="bg-slate-50 p-8 rounded-3xl mb-8 border border-slate-100"
                                        >
                                            <div className="grid sm:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Payment Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={paymentDate}
                                                        onChange={(e) => setPaymentDate(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Amount (Optional)</label>
                                                    <input 
                                                        type="number" 
                                                        placeholder="Enter amount"
                                                        value={paymentAmount}
                                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary-500 outline-none font-bold text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleRecordPayment}
                                                className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-100"
                                            >
                                                Save Payment Record
                                            </button>
                                        </motion.div>
                                    )}

                                    <div className="space-y-4">
                                        {(selectedStudent.paymentHistory || []).length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                                        <tr>
                                                            <th className="pb-4 px-2">Month</th>
                                                            <th className="pb-4 px-2">Date</th>
                                                            <th className="pb-4 px-2">Amount</th>
                                                            <th className="pb-4 px-2 text-right">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {selectedStudent.paymentHistory.slice().reverse().map((pay, i) => (
                                                            <tr key={i} className="group">
                                                                <td className="py-4 px-2 font-bold text-slate-800">{pay.month}</td>
                                                                <td className="py-4 px-2 text-slate-400 text-sm">{new Date(pay.date).toLocaleDateString('en-IN')}</td>
                                                                <td className="py-4 px-2 font-bold text-slate-600">₹{pay.amount || 0}</td>
                                                                <td className="py-4 px-2 text-right flex items-center justify-end gap-3">
                                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase">Cleared</span>
                                                                    <button 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setPaymentToDelete(pay._id);
                                                                        }}
                                                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                        title="Delete record"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                                <p className="text-slate-400 font-medium italic">No payment history available yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            ) : viewMode === 'roster' ? (
                <>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search students..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none transition"
                            />
                        </div>
                        <div className="flex items-center gap-3 relative" ref={filterRef}>
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-semibold transition-all border ${
                                    isFilterOpen || classFilter !== 'all' || statusFilter !== 'all'
                                        ? 'bg-primary-50 border-primary-200 text-primary-600'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <Filter className="w-5 h-5" /> 
                                Filter
                                {(classFilter !== 'all' || statusFilter !== 'all') && (
                                    <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                                )}
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Filter by Class</label>
                                            <div className="grid grid-cols-3 gap-1.5">
                                                {['all', ...ALL_CLASS_IDS].map(c => (
                                                    <button
                                                        key={c}
                                                        onClick={() => setClassFilter(c)}
                                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                            classFilter === c 
                                                                ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                        }`}
                                                    >
                                                        {c === 'all' ? 'All' : c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>                                         {isHeadAdmin && (
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Fee Status</label>
                                                <div className="flex gap-1.5">
                                                    {['all', 'paid', 'pending'].map(s => (
                                                        <button
                                                            key={s}
                                                            onClick={() => setStatusFilter(s)}
                                                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                                                statusFilter === s 
                                                                    ? 'bg-primary-600 text-white shadow-md shadow-primary-200' 
                                                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                         )}

                                        <button 
                                            onClick={() => {
                                                setClassFilter('all');
                                                setStatusFilter('all');
                                            }}
                                            className="w-full py-1.5 text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors border-t border-slate-50 mt-1 pt-3"
                                        >
                                            Reset Filters
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isHeadAdmin && (
                                <button 
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-200"
                                >
                                    <UserPlus className="w-5 h-5" /> Add Student
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                                        <th className="px-8 py-5 font-semibold">Student Name</th>
                                        <th className="px-8 py-5 font-semibold">Class</th>
                                        <th className="px-8 py-5 font-semibold">Contact Info</th>
                                        {isHeadAdmin && <th className="px-8 py-5 font-semibold">Fee Status</th>}
                                        <th className="px-8 py-5 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                        <tr 
                                            key={student._id} 
                                            onClick={() => setSelectedStudent(student)}
                                            className="hover:bg-slate-50/50 transition cursor-pointer"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-bold">
                                                        {student.user?.name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{student.user?.name}</p>
                                                        <p className="text-xs text-slate-500">{student.user?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-4 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold">
                                                    Class {student.class}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-slate-600">
                                                <p className="text-sm font-medium">{student.phoneNumber}</p>
                                            </td>
                                            {isHeadAdmin && (
                                                <td className="px-8 py-5">
                                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                                                        student.paymentStatus === 'paid' 
                                                            ? 'bg-green-100 text-green-700' 
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${student.paymentStatus === 'paid' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                                        {student.paymentStatus}
                                                    </span>
                                                </td>
                                            )}
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isHeadAdmin && (
                                                        <button 
                                                            onClick={(e) => handleDeleteClick(e, student)}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                     {isHeadAdmin && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setStudentToEdit(student);
                                                                setIsEditModalOpen(true);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                     )}
                                                        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={isHeadAdmin ? "5" : "4"} className="px-8 py-20 text-center text-slate-500">
                                                No students found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100 text-slate-500 text-xs flex justify-between items-center">
                            <span>Showing {filteredStudents.length} of {students.length} students</span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50" disabled>Previous</button>
                                <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-50" disabled>Next</button>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-500 text-sm border-b border-slate-100">
                                        <th className="px-8 py-5 font-semibold">Applicant Details</th>
                                        <th className="px-8 py-5 font-semibold">Class</th>
                                        <th className="px-8 py-5 font-semibold">School</th>
                                        <th className="px-8 py-5 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {pendingStudents.length > 0 ? pendingStudents.map((student) => (
                                        <tr key={student._id} className="hover:bg-slate-50/50 transition">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-lg">
                                                        {student.name?.[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{student.name}</p>
                                                        <p className="text-xs text-slate-500">{student.email}</p>
                                                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium"><Phone className="w-3 h-3" /> {student.profile?.phoneNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold">
                                                    Class {student.profile?.class}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-slate-600">
                                                <p className="text-sm font-medium">{student.profile?.schoolName || 'N/A'}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => handleRejectClick(student)}
                                                        className="px-6 py-2.5 bg-red-50 text-red-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                    <button 
                                                        onClick={() => handleApproveClick(student)}
                                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                                                    >
                                                        Approve
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-20 text-center">
                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <User className="w-10 h-10 text-slate-300" />
                                                </div>
                                                <p className="text-slate-500 font-medium">No pending registrations at the moment.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}


            <AddStudentModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onStudentAdded={fetchStudents} 
            />
            <EditStudentModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                student={studentToEdit}
                onStudentUpdated={() => {
                    fetchStudents();
                    if (selectedStudent && studentToEdit && selectedStudent._id === studentToEdit._id) {
                        // Refresh selected student details
                        API.get('/students').then(res => {
                            const updated = res.data.find(s => s._id === selectedStudent._id);
                            if (updated) setSelectedStudent(updated);
                        });
                    }
                }}
            />
        </div>
    );
};

export default Students;
