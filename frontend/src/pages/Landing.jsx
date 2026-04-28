import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Clock, Mail, Phone, MapPin, ChevronRight } from 'lucide-react';
import { CLASS_DATA } from '../constants/classData';
import { API_BASE_URL as API } from '../config';

const Landing = () => {
    const token = sessionStorage.getItem('token');
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const dashboardLink = (user.role === 'admin' || user.role === 'head_admin') ? '/admin' : '/student';

    const classData = CLASS_DATA;

    const [activeClass, setActiveClass] = React.useState(null);
    const [isLocked, setIsLocked] = React.useState(false);
    const [teachers, setTeachers] = React.useState([]);
    const classesRef = React.useRef(null);

    React.useEffect(() => {
        const fetchPublicTeachers = async () => {
            try {
                const response = await fetch(`${API}/public/teachers`);
                const data = await response.json();
                setTeachers(data);
            } catch (err) {
                console.error('Failed to fetch teachers:', err);
            }
        };
        fetchPublicTeachers();

        const handleClickOutside = (event) => {
            if (classesRef.current && !classesRef.current.contains(event.target)) {
                setActiveClass(null);
                setIsLocked(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMouseEnter = (id) => {
        if (!isLocked) {
            setActiveClass(id);
        }
    };

    const handleMouseLeave = () => {
        if (!isLocked) {
            setActiveClass(null);
        }
    };

    const handleClassClick = (id) => {
        if (activeClass === id && isLocked) {
            setIsLocked(false);
            setActiveClass(null);
        } else {
            setActiveClass(id);
            setIsLocked(true);
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <header className="relative bg-gradient-to-br from-primary-600 to-primary-900 text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <nav className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
                    <div className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="w-8 h-8" />
                        <span>Excellence Coaching Centre</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => document.querySelector('footer').scrollIntoView({ behavior: 'smooth' })}
                            className="text-primary-100 hover:text-white transition font-medium hidden md:block"
                        >
                            Contact
                        </button>
                        <div className="space-x-4">
                            {token ? (
                                <Link to={dashboardLink} className="px-6 py-2 rounded-full bg-white text-primary-700 font-semibold hover:bg-primary-50 transition">Dashboard</Link>
                            ) : (
                                <>
                                    <Link to="/login" className="px-6 py-2 rounded-full border border-white hover:bg-white hover:text-primary-700 transition">Login</Link>
                                    <Link to="/register" className="px-6 py-2 rounded-full bg-white text-primary-700 font-semibold hover:bg-primary-50 transition">Get Started</Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>
                
                <div className="container mx-auto px-6 py-20 md:py-32 text-center relative z-10">
                    <h1 className="text-4xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
                        Excellence in <span className="text-primary-200">Education</span>
                    </h1>
                    <p className="text-lg md:text-2xl mb-10 text-primary-100 max-w-2xl mx-auto px-4">
                        Providing top-tier coaching for Classes 4 to 8. Empowering students to achieve their academic goals with personalized attention.
                    </p>
                    <Link to={token ? dashboardLink : "/register"} className="inline-flex items-center gap-2 px-8 md:px-10 py-4 bg-white text-primary-700 rounded-full text-lg md:text-xl font-bold hover:scale-105 transition shadow-2xl">
                        {token ? 'Go to Dashboard' : 'Get Started'} <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>
            </header>

            {/* Classes Section */}
            <section className="py-20 bg-slate-50">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-800">Our Classes</h2>
                    <p className="text-slate-600 mb-12 md:mb-16 text-sm md:text-base">Click on a class to see the subjects we teach</p>
                    <div ref={classesRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                        {classData.map((cls) => (
                            <div 
                                key={cls.id} 
                                onMouseEnter={() => handleMouseEnter(cls.id)}
                                onMouseLeave={handleMouseLeave}
                                onClick={() => handleClassClick(cls.id)}
                                className={`
                                    cursor-pointer p-8 rounded-3xl transition-all duration-500 border-2 min-h-[160px] flex flex-col justify-center relative overflow-hidden
                                    ${activeClass === cls.id 
                                        ? 'bg-primary-600 border-primary-600 text-white shadow-2xl scale-105' 
                                        : 'bg-white border-slate-100 text-slate-800 hover:border-primary-300 hover:shadow-xl'}
                                `}
                            >
                                {isLocked && activeClass === cls.id && (
                                    <div className="absolute top-4 right-4 animate-pulse">
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                )}
                                <span className={`text-3xl font-bold block transition-all duration-300 ${activeClass === cls.id ? 'text-white mb-4' : 'text-primary-600'}`}>{cls.label}</span>
                                {activeClass === cls.id && (
                                    <div className="space-y-2 text-left animate-in fade-in zoom-in-95 duration-500">
                                        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">Subjects:</p>
                                        {cls.subjects.map((sub, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs font-semibold">
                                                <div className="w-1 h-1 bg-white rounded-full"></div>
                                                {sub}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:rotate-6 transition-transform">
                                <Users className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Personalized Mentorship</h3>
                            <p className="text-slate-600 leading-relaxed">Nurturing young minds with individual attention and tailored learning paths for every student.</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:rotate-6 transition-transform">
                                <Clock className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Flexible Schedule</h3>
                            <p className="text-slate-600 leading-relaxed">Well-planned classes that fit perfectly into your academic calendar and goals.</p>
                        </div>
                        <div className="text-center group">
                            <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:rotate-6 transition-transform">
                                <BookOpen className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Quality Material</h3>
                            <p className="text-slate-600 leading-relaxed">Get access to comprehensive notes, daily homework, and regular mock tests.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Teachers Section */}
            {teachers.length > 0 && (
                <section className="py-24 bg-slate-50">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-4xl font-bold mb-4 text-slate-800">Meet Our Experts</h2>
                        <p className="text-slate-600 mb-16">Dedicated educators committed to student success</p>
                        <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
                            {teachers.map((teacher, index) => (
                                <div key={index} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 group">
                                    <div className="w-20 h-20 bg-primary-100 text-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl font-black group-hover:scale-110 transition-transform">
                                        {teacher.name[0]}
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800 mb-1">{teacher.name}</h4>
                                    <p className="text-primary-600 text-xs font-black uppercase tracking-widest mb-4">Senior Faculty</p>
                                    <div className="pt-4 border-t border-slate-50 flex items-center justify-center gap-4 text-slate-400">
                                        <Mail className="w-4 h-4" />
                                        <Phone className="w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Contact Section */}
            <footer className="bg-slate-900 text-white py-24 border-t border-slate-800">
                <div className="container mx-auto px-6">
                    <div className="grid lg:grid-cols-3 gap-12 lg:gap-16 items-start">
                        <div>
                            <h2 className="text-3xl font-bold mb-10">Get in Touch</h2>
                            <div className="space-y-8">
                                <div className="flex items-center gap-5 group">
                                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                                        <Phone className="w-5 h-5 text-primary-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-lg text-slate-300">+91 9123741641</span>
                                </div>
                                <div className="flex items-center gap-5 group">
                                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                                        <Mail className="w-5 h-5 text-primary-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-lg text-slate-300">sarthakofficial25@gmail.com</span>
                                </div>
                                <div className="flex items-center gap-5 group">
                                    <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-primary-600 transition-colors">
                                        <MapPin className="w-5 h-5 text-primary-400 group-hover:text-white" />
                                    </div>
                                    <span className="text-lg text-slate-300">27/10, Kabardanga, Nepalgunge road, Krishnanagar, Kolkata - 700104</span>
                                </div>
                            </div>
                        </div>

                        {/* Google Maps Integration */}
                        <div className="w-full h-80 lg:h-full min-h-[320px] rounded-[2.5rem] overflow-hidden border border-slate-700/50 shadow-2xl relative group">
                            <div className="absolute inset-0 bg-primary-600/10 pointer-events-none group-hover:bg-transparent transition-colors z-10" />
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d731.656440387746!2d88.33476562117595!3d22.454722852039033!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1777372825778!5m2!1sen!2sin" 
                                width="100%" 
                                height="100%" 
                                style={{ border: 0 }} 
                                allowFullScreen="" 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                                className="relative z-0"
                            />
                        </div>

                        <div className="bg-slate-800/50 p-10 rounded-[40px] backdrop-blur-sm border border-slate-700/50 shadow-2xl">
                            <h3 className="text-2xl font-bold mb-4">Start Your Journey</h3>
                            <p className="text-slate-400 mb-10 text-lg">Join Excellence Coaching Centre today and experience a new era of education designed for success.</p>
                            <Link to="/register" className="block text-center w-full py-5 bg-primary-600 hover:bg-primary-500 rounded-2xl font-bold text-xl transition-all hover:scale-[1.02] shadow-xl">Register Now</Link>
                        </div>
                    </div>
                    <div className="mt-24 pt-10 border-t border-slate-800 text-center text-slate-500">
                        &copy; 2026 Excellence Coaching Centre. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
