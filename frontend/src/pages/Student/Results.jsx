import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    GraduationCap, Award, TrendingUp, Calendar, Loader2, 
    BookOpen, Trophy, Users, Star, ArrowRight, MessageCircle
} from 'lucide-react';
import API from '../../api/api';

const StudentResults = () => {
    const [results, setResults] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my'); // 'my' or 'leaderboard'
    const [selectedTest, setSelectedTest] = useState('');
    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                const { data } = await API.get('/results/my');
                setResults(data);
                if (data.length > 0) {
                    setSelectedTest(data[0].testName);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    useEffect(() => {
        if (!selectedTest) return;
        const fetchLeaderboard = async () => {
            try {
                const { data } = await API.get(`/results/leaderboard?testName=${selectedTest}`);
                setLeaderboard(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchLeaderboard();
    }, [selectedTest]);

    const averagePercentage = results.length > 0 
        ? Math.round(results.reduce((acc, curr) => acc + curr.percentage, 0) / results.length)
        : 0;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-primary-600" /> Academic Dashboard
                    </h1>
                    <p className="text-slate-500 mt-1">Track your progress and class rankings</p>
                </div>

                <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                    <button 
                        onClick={() => setActiveTab('my')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'my' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        My Performance
                    </button>
                    <button 
                        onClick={() => setActiveTab('leaderboard')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'leaderboard' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Class Rankings
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                    <p className="text-slate-500 font-medium">Loading your academic records...</p>
                </div>
            ) : results.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Award className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Results Recorded</h3>
                    <p className="text-slate-500">Your test scores will appear here once they are published by the teacher.</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Stats Header (Only on 'my' tab) */}
                    {activeTab === 'my' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
                                    <TrendingUp className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg. Score</p>
                                    <p className="text-2xl font-black text-slate-800">{averagePercentage}%</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                    <Trophy className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Tests</p>
                                    <p className="text-2xl font-black text-slate-800">{results.length}</p>
                                </div>
                            </div>
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                                    <Star className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance</p>
                                    <p className="text-2xl font-black text-slate-800">{averagePercentage >= 80 ? 'Elite' : averagePercentage >= 50 ? 'Steady' : 'Emerging'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <AnimatePresence mode="wait">
                        {activeTab === 'my' ? (
                            <motion.div 
                                key="my" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className="grid gap-6"
                            >
                                {results.map((res, idx) => (
                                    <motion.div
                                        key={res._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row md:items-center gap-8 relative overflow-hidden"
                                    >
                                        <div className={`absolute top-0 left-0 w-2 h-full ${res.percentage >= 80 ? 'bg-emerald-500' : res.percentage >= 40 ? 'bg-primary-500' : 'bg-red-500'}`}></div>
                                        
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-2xl">{res.testName}</h3>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {(res.subjects || []).map(s => (
                                                        <span key={s} className="px-3 py-1 rounded-lg bg-slate-50 text-slate-500 text-xs font-bold border border-slate-100">
                                                            {s}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                                    <Calendar className="w-4 h-4" />
                                                    {res.testDate ? new Date(res.testDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(res.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                {res.remarks && (
                                                    <div className="flex items-center gap-2 text-primary-600 bg-primary-50 px-3 py-1 rounded-full text-xs font-bold">
                                                        <MessageCircle className="w-3.5 h-3.5" />
                                                        "{res.remarks}"
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-8 min-w-[200px] justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="text-3xl font-black text-slate-800 tracking-tight">
                                                    {res.marksObtained}<span className="text-slate-300 text-xl font-medium">/{res.totalMarks}</span>
                                                </p>
                                                <div className="flex items-center justify-end gap-2 mt-1">
                                                    <span className={`w-2 h-2 rounded-full ${res.percentage >= 80 ? 'bg-emerald-500' : 'bg-primary-500'}`}></span>
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{res.percentage}%</span>
                                                </div>
                                            </div>
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl ${res.percentage >= 80 ? 'bg-emerald-100 text-emerald-600' : 'bg-primary-100 text-primary-600'}`}>
                                                {res.percentage >= 90 ? 'A+' : res.percentage >= 80 ? 'A' : res.percentage >= 70 ? 'B+' : res.percentage >= 60 ? 'B' : 'C'}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="leaderboard" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Test Selection */}
                                <div className="flex flex-wrap gap-2">
                                    {[...new Set(results.map(r => r.testName))].map(name => (
                                        <button
                                            key={name}
                                            onClick={() => { setSelectedTest(name); fetchLeaderboard(name); }}
                                            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all border ${selectedTest === name ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-500 border-slate-100 hover:bg-slate-50'}`}
                                        >
                                            {name}
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Trophy className="w-6 h-6 text-orange-500" />
                                            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm">Top Performers - {selectedTest}</h3>
                                        </div>
                                        <span className="text-xs font-bold text-slate-400">Class {results[0]?.studentClass}</span>
                                    </div>
                                    <div className="p-4 space-y-2">
                                        {leaderboard.length === 0 ? (
                                            <p className="text-center py-10 text-slate-400 font-medium italic">Select a test to see the rankings</p>
                                        ) : (
                                            leaderboard.map((entry, idx) => (
                                                <div 
                                                    key={entry._id}
                                                    className={`flex items-center justify-between p-5 rounded-2xl transition-all ${entry.student._id === results[0]?.student ? 'bg-primary-50 ring-2 ring-primary-100' : 'hover:bg-slate-50'}`}
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                                                            #{idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800">{entry.student.name} {entry.student._id === results[0]?.student && <span className="ml-2 text-[10px] bg-primary-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-tighter">You</span>}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entry.percentage}% Marks</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="text-lg font-black text-slate-800">{entry.marksObtained}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Score</p>
                                                        </div>
                                                        <div className={`w-1.5 h-8 rounded-full ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-orange-300' : 'bg-slate-100'}`}></div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default StudentResults;
