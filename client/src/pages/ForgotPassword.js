import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineMail } from 'react-icons/hi';
import api from '../utils/axios';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });
        setLoading(true);

        try {
            // Placeholder for Supabase auth integration
            // await api.post('/auth/forgot-password', { email });

            // Simulating API call for UI demonstration
            await new Promise(resolve => setTimeout(resolve, 1500));

            setStatus({
                type: 'success',
                message: 'Password reset link has been sent to your email address.'
            });
            setEmail('');
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.message || 'Failed to send reset link. Please try again.'
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
                        src="/assets/Forgot password-pana.png"
                        alt="Forgot Password illustration"
                        className="w-[80%] h-auto object-contain relative z-10"
                    />
                    {/* Decorative circles */}
                    <div className="absolute top-10 left-10 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
                    <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-12 px-8 sm:px-16 lg:px-20 relative">
                {/* Back Button */}
                <Link
                    to="/login"
                    className="absolute top-8 left-8 sm:left-16 lg:left-20 flex items-center gap-2 text-[#0C3834] font-medium hover:underline transition-all"
                >
                    <HiOutlineArrowLeft className="text-xl" />
                    Back to Login
                </Link>

                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-3xl font-black text-[#0C3834] mb-3">
                            FORGOT YOUR PASSWORD ?
                        </h1>
                        <p className="text-[#0C3834]/70 font-medium">
                            Enter the e-mail address that associated with your account
                        </p>
                    </div>

                    {/* Status Message */}
                    {status.message && (
                        <div className={`mb-6 p-4 rounded-xl text-sm font-medium ${status.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {status.message}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-5 py-4 bg-white/50 border border-[#0C3834]/20 rounded-xl text-[#0C3834] placeholder-[#0C3834]/40 focus:outline-none focus:border-[#0C3834] focus:bg-white transition-all pl-12"
                                />
                                <HiOutlineMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0C3834]/40 text-xl" />
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
                                    Sending Link...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
