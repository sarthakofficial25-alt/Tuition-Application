import React, { useState, useEffect } from 'react';
import API from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    GraduationCap, Plus, Pencil, Trash2, X, Check, 
    AlertCircle, Loader2, Search, User, Filter, MoreVertical, BookOpen,
    TrendingUp, Target, Users, Award, FileText
} from 'lucide-react';
import { ALL_SUBJECTS, ALL_CLASS_IDS } from '../../constants';

const AdminResults = () => {
    const [results, setResults] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [form, setForm] = useState({ 
        studentId: '', 
        testName: '',
        subjects: [], 
        marksObtained: '', 
        totalMarks: '', 
        testDate: new Date().toISOString().split('T')[0],
        remarks: '' 
    });
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [studentSearch, setStudentSearch] = useState('');
    const [activeTab, setActiveTab] = useState('list'); // 'list', 'overview', or 'rankings'
    
    // Rankings State
    const [rankingClass, setRankingClass] = useState('10');
    const [rankingTest, setRankingTest] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resData, studentData] = await Promise.all([
                API.get('/results'),
                API.get('/students')
            ]);
            setResults(resData.data);
            setStudents(studentData.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenAdd = () => {
        setEditing(null);
        setForm({ 
            studentId: '', 
            testName: '',
            subjects: [], 
            marksObtained: '', 
            totalMarks: '', 
            testDate: new Date().toISOString().split('T')[0],
            remarks: '' 
        });
        setStudentSearch('');
        setError('');
        setShowModal(true);
    };

    const handleOpenEdit = (res) => {
        setEditing(res);
        setForm({ 
            studentId: res.student?._id || '', 
            testName: res.testName,
            subjects: res.subjects || [], 
            marksObtained: res.marksObtained, 
            totalMarks: res.totalMarks, 
            testDate: res.testDate ? new Date(res.testDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            remarks: res.remarks || '' 
        });
        setStudentSearch(res.student?.name || '');
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.studentId || !form.testName || form.subjects.length === 0 || form.marksObtained === '' || !form.totalMarks) {
            setError('Please fill in all required fields.');
            return;
        }

        setFormLoading(true);
        try {
            if (editing) {
                const { data } = await API.put(`/results/${editing._id}`, form);
                setResults(prev => prev.map(r => r._id === data._id ? data : r));
            } else {
                const { data } = await API.post('/results', form);
                setResults(prev => [data, ...prev]);
            }
            setShowModal(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save result.');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            await API.delete(`/results/${deleting._id}`);
            setResults(prev => prev.filter(r => r._id !== deleting._id));
            setDeleting(null);
        } catch (err) {
            setError('Failed to delete result.');
        } finally {
            setFormLoading(false);
        }
    };

    const toggleSubject = (sub) => {
        setForm(f => ({
            ...f,
            subjects: f.subjects.includes(sub)
                ? f.subjects.filter(s => s !== sub)
                : [...f.subjects, sub]
        }));
    };

    const filteredResults = results.filter(r => 
        r.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.testName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subjects?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const filteredStudents = studentSearch.length > 0 ? students.filter(s => 
        s.user?.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.user?.email?.toLowerCase().includes(studentSearch.toLowerCase())
    ).slice(0, 5) : [];

    const autoPercentage = form.marksObtained && form.totalMarks 
        ? Math.round((form.marksObtained / form.totalMarks) * 10000) / 100 
        : 0;

    // Calculate Student-wise aggregate performance
    const studentPerformance = Object.values(results.reduce((acc, r) => {
        const sid = r.student?._id || r.student;
        if (!sid) return acc;
        const sidStr = sid.toString();
        if (!acc[sidStr]) {
            acc[sidStr] = { 
                student: r.student, 
                studentClass: r.studentClass,
                totalPercentage: 0, 
                count: 0 
            };
        }
        acc[sidStr].totalPercentage += r.percentage;
        acc[sidStr].count += 1;
        return acc;
    }, {})).map(s => ({
        ...s,
        avg: (s.totalPercentage / s.count).toFixed(1)
    })).sort((a, b) => b.avg - a.avg);

    // Filtered performance for Ranking tab
    const filteredRankings = Object.values(results.filter(r => 
        r.studentClass.toString() === rankingClass && (rankingTest === 'all' || r.testName === rankingTest)
    ).reduce((acc, r) => {
        const sid = r.student?._id || r.student;
        if (!sid) return acc;
        const sidStr = sid.toString();
        if (!acc[sidStr]) {
            acc[sidStr] = { student: r.student, totalPercentage: 0, count: 0, marksObtained: 0, totalMarks: 0 };
        }
        acc[sidStr].totalPercentage += r.percentage;
        acc[sidStr].marksObtained += r.marksObtained;
        acc[sidStr].totalMarks += r.totalMarks;
        acc[sidStr].count += 1;
        return acc;
    }, {})).map(s => ({
        ...s,
        avg: (s.totalPercentage / s.count).toFixed(1)
    })).sort((a, b) => b.avg - a.avg);

    // Get available tests for selected class
    const availableTests = [...new Set(results.filter(r => r.studentClass.toString() === rankingClass).map(r => r.testName))];

    // Performance Analytics
    const stats = {
        avgScore: results.length > 0 ? (results.reduce((acc, r) => acc + r.percentage, 0) / results.length).toFixed(1) : 0,
        totalTests: results.length,
        dist: {
            excellent: results.filter(r => r.percentage >= 80).length,
            good: results.filter(r => r.percentage >= 60 && r.percentage < 80).length,
            average: results.filter(r => r.percentage >= 40 && r.percentage < 60).length,
            needsWork: results.filter(r => r.percentage < 40).length,
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-primary-600" /> Results Management
                    </h1>
                    <p className="text-slate-500 mt-1">Track and update student performance records</p>
                </div>
                <button 
                    onClick={handleOpenAdd}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition shadow-lg shadow-primary-200"
                >
                    <Plus className="w-5 h-5" /> Record Marks
                </button>
            </div>

            {/* Performance Insights */}
            {!loading && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Average Score</p>
                            <p className="text-2xl font-black text-slate-800">{stats.avgScore}%</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tests</p>
                            <p className="text-2xl font-black text-slate-800">{stats.totalTests}</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High Performers</p>
                            <p className="text-2xl font-black text-slate-800">{stats.dist.excellent}</p>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Needs Work</p>
                            <p className="text-2xl font-black text-slate-800">{stats.dist.needsWork}</p>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200/50">
                <button 
                    onClick={() => setActiveTab('list')}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-white text-primary-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Individual Results
                </button>
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-white text-primary-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Student Overview
                </button>
                <button 
                    onClick={() => setActiveTab('rankings')}
                    className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'rankings' ? 'bg-white text-primary-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Class Rankings
                </button>
            </div>

            {/* Content Rendering based on tab */}
            {activeTab === 'rankings' ? (
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Select Class</label>
                            <div className="flex flex-wrap gap-2">
                                {ALL_CLASS_IDS.map(c => (
                                    <button 
                                        key={c} onClick={() => { setRankingClass(c); setRankingTest('all'); }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${rankingClass === c ? 'bg-primary-600 text-white border-primary-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                                    >
                                        Class {c}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Select Test</label>
                            <div className="flex flex-wrap gap-2">
                                <button 
                                    onClick={() => setRankingTest('all')}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${rankingTest === 'all' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                                >
                                    Cumulative
                                </button>
                                {availableTests.map(t => (
                                    <button 
                                        key={t} onClick={() => setRankingTest(t)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${rankingTest === t ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-slate-500 text-sm">
                                    <tr>
                                        <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Rank</th>
                                        <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Student Name</th>
                                        <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">{rankingTest === 'all' ? 'Tests' : 'Score'}</th>
                                        <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Average %</th>
                                        <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredRankings.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-8 py-20 text-center text-slate-400 font-medium italic">
                                                No results found for Class {rankingClass} {rankingTest !== 'all' ? ` - ${rankingTest}` : ''}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRankings.map((s, idx) => {
                                            const colorClass = s.avg >= 80 ? 'text-emerald-600 bg-emerald-50' : s.avg >= 40 ? 'text-primary-600 bg-primary-50' : 'text-red-600 bg-red-50';
                                            return (
                                                <motion.tr key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}>
                                                    <td className="px-8 py-6">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                                                            idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-slate-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 text-slate-400'
                                                        }`}>
                                                            #{idx + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">
                                                                {s.student?.name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800">{s.student?.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-medium">{s.student?.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="font-bold text-slate-700">
                                                            {rankingTest === 'all' ? `${s.count} Tests` : `${s.marksObtained}/${s.totalMarks}`}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 font-black text-slate-800 text-lg">
                                                        {s.avg}%
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colorClass}`}>
                                                            {s.avg >= 80 ? 'Excellent' : s.avg >= 60 ? 'Good' : s.avg >= 40 ? 'Average' : 'Critical'}
                                                        </span>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Search and Filters (Visible only in List and Overview) */}
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input 
                                type="text" 
                                placeholder="Search by student, test or subject..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary-500 transition shadow-sm"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                            <p className="text-slate-500 font-medium">Loading results...</p>
                        </div>
                    ) : filteredResults.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-20 text-center">
                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                                <GraduationCap className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No Results Found</h3>
                            <p className="text-slate-500">Record marks for a student to see their performance here.</p>
                        </div>
                    ) : activeTab === 'list' ? (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 text-slate-500 text-sm">
                                        <tr>
                                            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Student / Class</th>
                                            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Test Name / Date</th>
                                            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Subjects</th>
                                            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Score / %</th>
                                            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredResults.map((res, idx) => {
                                            const colorClass = res.percentage >= 80 ? 'text-emerald-600 bg-emerald-50' : res.percentage >= 40 ? 'text-primary-600 bg-primary-50' : 'text-red-600 bg-red-50';
                                            
                                            return (
                                                <motion.tr 
                                                    key={res._id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.03 }}
                                                    className="group hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">
                                                                {res.student?.name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800">{res.student?.name}</p>
                                                                <p className="text-[10px] font-bold text-primary-600 uppercase tracking-tighter">Class {res.studentClass}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="font-bold text-slate-700">{res.testName}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                                                            {(res.testDate || res.createdAt) ? new Date(res.testDate || res.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                        </p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-wrap gap-1">
                                                            {(res.subjects || []).map(s => (
                                                                <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold">
                                                                    {s}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-3 py-1 rounded-lg font-bold text-sm ${colorClass}`}>
                                                                {res.marksObtained} / {res.totalMarks}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-bold">{res.percentage}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleOpenEdit(res)} className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition">
                                                                <Pencil className="w-5 h-5" />
                                                            </button>
                                                            <button onClick={() => setDeleting(res)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition">
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50/50 text-slate-500 text-sm">
                                        <tr>
                                            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Rank</th>
                                            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Student / Class</th>
                                            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Tests Taken</th>
                                            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Average Score</th>
                                            <th className="px-8 py-5 font-bold uppercase tracking-wider text-[10px]">Performance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {studentPerformance.map((s, idx) => {
                                            const colorClass = s.avg >= 80 ? 'text-emerald-600 bg-emerald-50' : s.avg >= 40 ? 'text-primary-600 bg-primary-50' : 'text-red-600 bg-red-50';
                                            
                                            return (
                                                <motion.tr 
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="hover:bg-slate-50/50 transition-colors"
                                                >
                                                    <td className="px-8 py-6">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}`}>
                                                            #{idx + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-500">
                                                                {s.student?.name?.[0]}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800">{s.student?.name}</p>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Class {s.studentClass}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold text-xs">
                                                            {s.count} Tests
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 font-black text-slate-800 text-lg">
                                                        {s.avg}%
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden w-24">
                                                                <div 
                                                                    className={`h-full rounded-full ${s.avg >= 80 ? 'bg-emerald-500' : s.avg >= 40 ? 'bg-primary-500' : 'bg-red-500'}`}
                                                                    style={{ width: `${s.avg}%` }}
                                                                />
                                                            </div>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${colorClass}`}>
                                                                {s.avg >= 80 ? 'Excellent' : s.avg >= 60 ? 'Good' : s.avg >= 40 ? 'Average' : 'Critical'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {editing ? 'Edit Test Result' : 'Record New Result'}
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
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Student Selector */}
                                        <div className="col-span-2 relative">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Select Student</label>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                                <input 
                                                    type="text" 
                                                    disabled={!!editing}
                                                    placeholder="Search student by name or email..."
                                                    value={studentSearch}
                                                    onChange={e => {
                                                        setStudentSearch(e.target.value);
                                                        if (!e.target.value) setForm({...form, studentId: ''});
                                                    }}
                                                    className={`w-full pl-11 pr-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition ${editing ? 'opacity-60' : ''}`}
                                                />
                                            </div>
                                            {filteredStudents.length > 0 && !form.studentId && (
                                                <div className="absolute z-10 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl p-2 space-y-1">
                                                    {filteredStudents.map(s => (
                                                        <button
                                                            key={s._id} type="button"
                                                            onClick={() => {
                                                                setForm({...form, studentId: s.user?._id || s.user});
                                                                setStudentSearch(s.user?.name || 'Unknown');
                                                            }}
                                                            className="w-full flex items-center gap-3 p-3 hover:bg-primary-50 rounded-xl transition text-left"
                                                        >
                                                            <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-bold text-xs">{s.user?.name?.[0]}</div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">{s.user?.name}</p>
                                                                <p className="text-xs text-slate-400">Class {s.class} • {s.user?.email}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Test Name</label>
                                            <input 
                                                type="text" 
                                                value={form.testName}
                                                onChange={e => setForm({...form, testName: e.target.value})}
                                                placeholder="e.g. Unit Test I, Final Exam"
                                                className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition"
                                            />
                                        </div>

                                        {/* Subject Multi-Select */}
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Subjects</label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                {ALL_SUBJECTS.map(s => (
                                                    <button
                                                        key={s} type="button"
                                                        onClick={() => toggleSubject(s)}
                                                        className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${
                                                            form.subjects.includes(s)
                                                            ? 'border-primary-600 bg-primary-50 text-primary-600'
                                                            : 'border-transparent bg-slate-50 text-slate-400'
                                                        }`}
                                                    >
                                                        {s}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Marks Obtained</label>
                                            <input 
                                                type="number" 
                                                value={form.marksObtained}
                                                onChange={e => setForm({...form, marksObtained: e.target.value})}
                                                placeholder="Score"
                                                className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition"
                                            />
                                        </div>
                                        <div className="col-span-1">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Total Marks</label>
                                            <input 
                                                type="number" 
                                                value={form.totalMarks}
                                                onChange={e => setForm({...form, totalMarks: e.target.value})}
                                                placeholder="Max Score"
                                                className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Test Taken Date</label>
                                            <input 
                                                type="date" 
                                                value={form.testDate}
                                                onChange={e => setForm({...form, testDate: e.target.value})}
                                                className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition"
                                            />
                                        </div>
                                    </div>

                                    {/* Auto Percentage Display */}
                                    <div className="p-4 bg-primary-50 rounded-2xl flex justify-between items-center">
                                        <span className="text-sm font-bold text-primary-700">Calculated Percentage</span>
                                        <span className="text-xl font-black text-primary-600">{autoPercentage}%</span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Remarks (Optional)</label>
                                        <textarea 
                                            value={form.remarks}
                                            onChange={e => setForm({...form, remarks: e.target.value})}
                                            placeholder="e.g. Excellent conceptual clarity. Keep it up!"
                                            rows={2}
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white rounded-2xl outline-none transition resize-none"
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={formLoading}
                                        className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
                                    >
                                        {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                        {editing ? 'Update Result' : 'Publish Result'}
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
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Delete record?</h2>
                            <p className="text-slate-500 mb-8 text-sm">This will permanently remove the test record for this student.</p>
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

export default AdminResults;
