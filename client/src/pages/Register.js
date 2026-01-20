import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import api from '../utils/axios';

function Register() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            // Placeholder for Supabase auth integration
            // await api.post('/auth/register', formData);

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Navigate to mail confirmation page
            navigate('/mail-confirmation', { state: { email: formData.email } });

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#e8f5e9]">
            {/* Left Side - Illustration (Hidden on mobile) */}
            <div className="w-1/2 hidden lg:flex items-center justify-center p-8">
                <div className="bg-[#06302C] rounded-[2.5rem] w-full h-[90%] flex items-center justify-center relative overflow-hidden">
                    <img
                        src="/assets/Mobile login-amico.png"
                        alt="Register illustration"
                        className="w-[80%] h-auto object-contain relative z-10"
                    />
                    {/* Decorative circles */}
                    <div className="absolute top-20 right-20 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                    <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-12 px-8 sm:px-16 lg:px-20 relative">

                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-[#0C3834] mb-3 text-center">
                            WELCOME !
                        </h1>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl text-sm font-medium bg-red-50 text-red-700 border border-red-200">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-bold text-[#0C3834] mb-1">
                                Full Name
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    required
                                    className="w-full px-5 py-3.5 bg-white/50 border border-[#0C3834]/20 rounded-xl text-[#0C3834] placeholder-[#0C3834]/40 focus:outline-none focus:border-[#0C3834] focus:bg-white transition-all pl-12"
                                />
                                <HiOutlineUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0C3834]/40 text-xl" />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-bold text-[#0C3834] mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="w-full px-5 py-3.5 bg-white/50 border border-[#0C3834]/20 rounded-xl text-[#0C3834] placeholder-[#0C3834]/40 focus:outline-none focus:border-[#0C3834] focus:bg-white transition-all pl-12"
                                />
                                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0C3834]/40 text-xl" />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold text-[#0C3834] mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="w-full px-5 py-3.5 bg-white/50 border border-[#0C3834]/20 rounded-xl text-[#0C3834] placeholder-[#0C3834]/40 focus:outline-none focus:border-[#0C3834] focus:bg-white transition-all pl-12 pr-12"
                                />
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0C3834]/40 text-xl" />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0C3834]/40 hover:text-[#0C3834] transition-colors"
                                >
                                    {showPassword ? <HiOutlineEyeOff className="text-xl" /> : <HiOutlineEye className="text-xl" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-bold text-[#0C3834] mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    className="w-full px-5 py-3.5 bg-white/50 border border-[#0C3834]/20 rounded-xl text-[#0C3834] placeholder-[#0C3834]/40 focus:outline-none focus:border-[#0C3834] focus:bg-white transition-all pl-12"
                                />
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0C3834]/40 text-xl" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-[#06302C] text-white font-bold rounded-xl hover:bg-[#0a453f] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#06302C]/20 flex items-center justify-center gap-2 mt-4"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Registering...
                                </>
                            ) : (
                                'Register'
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-[#0C3834]/70">
                            Already Have an Account ?{' '}
                            <Link to="/login" className="font-bold text-[#0C3834] hover:underline">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
