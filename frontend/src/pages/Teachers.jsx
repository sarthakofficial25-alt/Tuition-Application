import React, { useState, useEffect } from 'react';
import API from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Users, 
    Search, 
    Mail, 
    Phone, 
    X, 
    Loader2,
    BookOpen
} from 'lucide-react';

const Teachers = () => {
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState(null);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/admin/all-faculty');
            setTeachers(data);
        } catch (err) {
            console.error('Failed to fetch teachers');
        } finally {
            setLoading(false);
        }
    };

    const safeTeachers = Array.isArray(teachers) ? teachers : [];
    const filteredTeachers = safeTeachers.filter(t => 
        (t.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (t.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <BookOpen className="w-8 h-8 text-primary-600" /> Our Teachers
                    </h1>
                    <p className="text-slate-500 mt-1">Get in touch with our expert educators</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Search teachers..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-primary-500 transition shadow-sm"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                    <p className="text-slate-500 font-medium">Loading teacher directory...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeachers.map((teacher, idx) => (
                        <motion.div
                            key={teacher._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            onClick={() => setSelectedTeacher(teacher)}
                            className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-primary-100/30 transition-all cursor-pointer group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center text-2xl font-bold transition-transform group-hover:scale-110">
                                    {teacher.name?.[0] || '?'}
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${teacher.role === 'head_admin' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                    {teacher.role === 'head_admin' ? 'Principal Authority' : 'Teacher'}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2">{teacher.name}</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-slate-500 text-sm">
                                    <Mail className="w-4 h-4 text-slate-400" />
                                    <span>{teacher.email}</span>
                                </div>
                                {teacher.profile?.phoneNumber && (
                                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span>{teacher.profile.phoneNumber}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-end">
                                <div className="text-primary-600 font-bold text-xs group-hover:translate-x-1 transition-transform">
                                    Details →
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Teacher Details Modal */}
            <AnimatePresence>
                {selectedTeacher && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative"
                        >
                            <button 
                                onClick={() => setSelectedTeacher(null)}
                                className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition text-slate-400"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="h-32 bg-primary-600 w-full" />
                            <div className="px-10 pb-10 -mt-16 text-center">
                                <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl p-2 mx-auto mb-6">
                                    <div className="w-full h-full bg-primary-50 text-primary-600 rounded-[2rem] flex items-center justify-center text-4xl font-black">
                                        {selectedTeacher.name?.[0] || '?'}
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black text-slate-800 mb-1">{selectedTeacher.name}</h2>
                                <p className="text-primary-600 font-bold text-xs uppercase tracking-[0.2em] mb-8">
                                    {selectedTeacher.role === 'head_admin' ? 'Principal Authority' : 'Teacher'}
                                </p>

                                <div className="space-y-4 text-left bg-slate-50 rounded-[2rem] p-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                            <p className="text-slate-700 font-bold">{selectedTeacher.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-primary-600">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                            <p className="text-slate-700 font-bold">{selectedTeacher.profile?.phoneNumber || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setSelectedTeacher(null)}
                                    className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition"
                                >
                                    Close Profile
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Teachers;
