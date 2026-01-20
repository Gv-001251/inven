import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import api from '../utils/axios';

function ResetPassword() {
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (formData.password !== formData.confirmPassword) {
            setStatus({ type: 'error', message: 'Passwords do not match' });
            return;
        }

        if (formData.password.length < 6) {
            setStatus({ type: 'error', message: 'Password must be at least 6 characters long' });
            return;
        }

        setLoading(true);

        try {
            // Placeholder for Supabase auth integration
            // await api.post('/auth/reset-password', { password: formData.password });

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            setStatus({
                type: 'success',
                message: 'Password successfully updated! You can now login.'
            });
            setFormData({ password: '', confirmPassword: '' });
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to update password. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#e8f5e9]">
            {/* Left Side - Illustration (Hidden on mobile) */}
            <div className="w-1/2 hidden lg:flex items-center justify-center p-8">
                <div className="bg-[#06302C] rounded-[2.5rem] w-full h-[90%] flex items-center justify-center relative overflow-hidden">
                    <img
                        src="/assets/My password-cuate.png"
                        alt="Reset Password illustration"
                        className="w-[80%] h-auto object-contain relative z-10"
                    />
                    {/* Decorative circles */}
                    <div className="absolute top-20 right-20 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                    <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-12 px-8 sm:px-16 lg:px-20 relative">
                {/* Back Button */}
                <Link
                    to="/forgot-password"
                    className="absolute top-8 left-8 sm:left-16 lg:left-20 flex items-center gap-2 text-[#0C3834] font-medium hover:underline transition-all"
                >
                    <HiOutlineArrowLeft className="text-xl" />
                    Back
                </Link>

                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-3xl font-black text-[#0C3834] mb-3">
                            RESET YOUR PASSWORD
                        </h1>
                        <p className="text-[#0C3834]/70 font-medium">
                            Enter the new password
                        </p>
                    </div>

                    {/* Status Message */}
                    {status.message && (
                        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${status.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {status.message}
                            {status.type === 'success' && (
                                <Link to="/login" className="block mt-2 font-bold underline">
                                    Click here to Login
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="New password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    className="w-full px-5 py-4 bg-white/50 border border-[#0C3834]/20 rounded-xl text-[#0C3834] placeholder-[#0C3834]/40 focus:outline-none focus:border-[#0C3834] focus:bg-white transition-all pl-12 pr-12"
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

                        <div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    className="w-full px-5 py-4 bg-white/50 border border-[#0C3834]/20 rounded-xl text-[#0C3834] placeholder-[#0C3834]/40 focus:outline-none focus:border-[#0C3834] focus:bg-white transition-all pl-12"
                                />
                                <HiOutlineLockClosed className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0C3834]/40 text-xl" />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full sm:w-auto px-8 py-3.5 bg-[#06302C] text-white font-bold rounded-xl hover:bg-[#0a453f] transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#06302C]/20 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Updating...
                                </>
                            ) : (
                                'Change Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
