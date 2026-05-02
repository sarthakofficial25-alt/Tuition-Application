import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, User, Mail, Phone, Lock, Hash, Loader2, MapPin, School, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        className: '',
        phoneNumber: '',
        address: '',
        schoolName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [emailTouched, setEmailTouched] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordTouched, setPasswordTouched] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const navigate = useNavigate();

    const isValidEmail = (email) => {
        return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'email') {
            setEmailTouched(true);
            if (value && !isValidEmail(value)) {
                setEmailError('Please enter a valid email (e.g. yourname@gmail.com)');
            } else {
                setEmailError('');
            }
        }
        if (name === 'password') {
            setPasswordTouched(true);
            if (value && value.length < 8) {
                setPasswordError('Password must be at least 8 characters');
            } else {
                setPasswordError('');
            }
        }
    };

    const handleEmailBlur = () => {
        setEmailTouched(true);
        if (!formData.email) {
            setEmailError('Email is required');
        } else if (!isValidEmail(formData.email)) {
            setEmailError('Please enter a valid email (e.g. yourname@gmail.com)');
        } else {
            setEmailError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Final check before submission
        if (!isValidEmail(formData.email)) {
            setEmailTouched(true);
            setEmailError('Please enter a valid email address before submitting');
            return;
        }
        if (formData.password.length < 8) {
            setPasswordTouched(true);
            setPasswordError('Password must be at least 8 characters long');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { data } = await API.post('/auth/register', formData);
            setShowSuccessModal(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12 transition-colors">
            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 text-center">
                            <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">✓</div></div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">Registration Submitted!</h3>
                            <p className="text-slate-500 mb-8 leading-relaxed">
                                Your application has been received successfully.
                                <br/><br/>
                                <span className="font-bold text-slate-800">Note:</span> Your account is currently pending approval from the Head Admin. You will be able to log in once your account is activated.
                            </p>
                            <button onClick={() => navigate('/login')} className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary-700 transition shadow-lg shadow-primary-200">Got it, Take me to Login</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl mb-4">
                        <BookOpen className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800">Student Registration</h1>
                    <p className="text-slate-500 mt-2">Join Excellence Coaching Centre as a student and start learning</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm text-center border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                name="name"
                                type="text"
                                required
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-slate-800"
                                placeholder="John Doe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                name="email"
                                type="email"
                                required
                                onChange={handleChange}
                                onBlur={handleEmailBlur}
                                className={`w-full pl-12 pr-10 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition text-slate-800 ${
                                    emailTouched && emailError
                                        ? 'border-red-400 focus:ring-red-300'
                                        : emailTouched && formData.email && !emailError
                                        ? 'border-green-400 focus:ring-green-300'
                                        : 'border-slate-200 focus:ring-primary-500'
                                }`}
                                placeholder="yourname@gmail.com"
                            />
                            {emailTouched && formData.email && !emailError && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg font-bold" title="Valid email">✓</span>
                            )}
                            {emailTouched && emailError && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-lg font-bold" title="Invalid email">✗</span>
                            )}
                        </div>
                        {emailTouched && emailError && (
                            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                <span>⚠</span> {emailError}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                name="phoneNumber"
                                type="tel"
                                required
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-slate-800"
                                placeholder="+91 98765 43210"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Residential Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                name="address"
                                type="text"
                                required
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-slate-800"
                                placeholder="Full residential address"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">School Name</label>
                        <div className="relative">
                            <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                name="schoolName"
                                type="text"
                                required
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition text-slate-800"
                                placeholder="Name of your school"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Class</label>
                        <div className="relative">
                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <select
                                name="className"
                                required
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition appearance-none text-slate-800"
                            >
                                <option value="">Select Class</option>
                                {[4, 5, 6, 7, 8].map(cls => (
                                    <option key={cls} value={cls}>Class {cls}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                onChange={handleChange}
                                onBlur={() => setPasswordTouched(true)}
                                className={`w-full pl-12 pr-12 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none transition text-slate-800 ${
                                    passwordTouched && passwordError
                                        ? 'border-red-400 focus:ring-red-300'
                                        : passwordTouched && formData.password && !passwordError
                                        ? 'border-green-400 focus:ring-green-300'
                                        : 'border-slate-200 focus:ring-primary-500'
                                }`}
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {passwordTouched && passwordError && (
                            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                                <span>⚠</span> {passwordError}
                            </p>
                        )}
                    </div>

                    <div className="md:col-span-2 pt-4">
                        <button
                            type="submit"
                            disabled={loading || (emailTouched && !!emailError) || (passwordTouched && !!passwordError)}
                            className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-primary-200"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Register'}
                        </button>
                    </div>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-slate-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 font-bold hover:underline">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
