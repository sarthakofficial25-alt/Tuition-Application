import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Calendar, CreditCard, History, CheckCircle2, AlertCircle, MapPin, School, ShieldCheck } from 'lucide-react';
import API from '../../api';

const StudentProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await API.get('/students/me');
                setProfile(data);
            } catch (err) {
                console.error('Failed to fetch profile:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!profile) return (
        <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800">Profile Not Found</h3>
            <p className="text-slate-500">We couldn't load your profile information. Please contact support.</p>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            {/* Header / Basic Info */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 rounded-full -mr-32 -mt-32 -z-10" />
                
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 bg-primary-600 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-xl shadow-primary-100">
                        {profile.user?.name?.[0]}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{profile.user?.name}</h1>
                        <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4" /> {profile.user?.email}
                        </p>
                        <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                            <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest">
                                Grade {profile.class}
                            </span>
                            <span className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${
                                profile.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                            }`}>
                                {profile.paymentStatus === 'paid' ? 'Fees Paid' : 'Fees Pending'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
                {/* Contact Details */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                            <User className="w-5 h-5" />
                        </div>
                        Personal Details
                    </h2>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Phone className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                                <p className="font-bold text-slate-800">{profile.phoneNumber}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                <School className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">School Name</p>
                                <p className="font-bold text-slate-800">{profile.schoolName || 'No school provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                <Mail className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                                <p className="font-bold text-slate-800">{profile.user?.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residential Address</p>
                                <p className="font-bold text-slate-800">{profile.address || 'No address provided'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User Role</p>
                                <p className="font-bold text-slate-800 capitalize">{profile.user?.role}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                <Calendar className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joining Date</p>
                                <p className="font-bold text-slate-800">
                                    {new Date(profile.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Status */}
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        Current Fee Status
                    </h2>
                    <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-3xl space-y-4">
                        {profile.paymentStatus === 'paid' ? (
                            <>
                                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Status: Paid</h3>
                                    <p className="text-slate-500 text-sm">Your fees are up to date. Thank you!</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertCircle className="w-16 h-16 text-orange-500" />
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Status: Pending</h3>
                                    <p className="text-slate-500 text-sm">Your current month's fee is pending. Please clear it soon.</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                        <History className="w-5 h-5" />
                    </div>
                    Payment History
                </h2>
                
                {profile.paymentHistory && profile.paymentHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50">
                                <tr>
                                    <th className="pb-4 px-2">Paid Month</th>
                                    <th className="pb-4 px-2">Transaction Date</th>
                                    <th className="pb-4 px-2">Amount</th>
                                    <th className="pb-4 px-2 text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {profile.paymentHistory.slice().reverse().map((pay, i) => (
                                    <tr key={i} className="group">
                                        <td className="py-6 px-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-slate-800">{pay.month}</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-2 text-slate-500 font-medium">
                                            {new Date(pay.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="py-6 px-2 font-black text-slate-700 text-lg">
                                            ₹{pay.amount || '0'}
                                        </td>
                                        <td className="py-6 px-2 text-right">
                                            <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                Confirmed
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="py-20 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                        <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-medium italic">No previous payments recorded yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProfile;
