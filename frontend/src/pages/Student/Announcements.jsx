import React, { useState, useEffect } from 'react';
import API from '../../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Megaphone, Loader2, Calendar } from 'lucide-react';


const token = () => sessionStorage.getItem('token');

const StudentNotice = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnnouncements();
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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Megaphone className="w-8 h-8 text-primary-600" /> Notice Board
                </h1>
                <p className="text-slate-500 mt-1">Stay updated with the latest news from Excellence Coaching Centre</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                    <p className="text-slate-500 font-medium">Loading notices...</p>
                </div>
            ) : announcements.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-20 text-center border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Bell className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Recent Updates</h3>
                    <p className="text-slate-500">Check back later for any new announcements or notices.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    <AnimatePresence>
                        {announcements.map((ann, idx) => (
                            <motion.div
                                key={ann._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                            >
                                <div className="absolute top-0 left-0 w-2 h-full bg-primary-500"></div>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center">
                                            <Bell className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-slate-800 text-xl">{ann.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl text-sm font-semibold">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(ann.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                </div>
                                <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
                                    {ann.content}
                                </p>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default StudentNotice;
