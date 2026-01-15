import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/axios';
import { HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data } = await api.post('/auth/login', { email, password });

            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.employee));

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 500);
            } else {
                setError(data.message || 'Login failed - no token received');
                setLoading(false);
            }
        } catch (err) {
            if (err.response) {
                setError(err.response.data?.message || 'Invalid email or password');
            } else if (err.request) {
                setError('Network error - is server running?');
            } else {
                setError('An unexpected error occurred');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#e8f5e9]">
            {/* Left Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-12 px-8 sm:px-16 lg:px-20">
                <div className="w-full max-w-sm">
                    {/* Title */}
                    <h1 className="text-3xl font-black text-[#0C3834] mb-10 text-center">
                        WELCOME BACK !
                    </h1>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-semibold text-[#0C3834] mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-5 py-3.5 bg-transparent border border-[#0C3834]/40 rounded-full text-[#0C3834] placeholder-[#0C3834]/40 text-sm focus:outline-none focus:border-[#0C3834] transition-colors"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-sm font-semibold text-[#0C3834] mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full px-5 py-3.5 bg-transparent border border-[#0C3834]/40 rounded-full text-[#0C3834] placeholder-[#0C3834]/40 text-sm focus:outline-none focus:border-[#0C3834] transition-colors pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0C3834]/50 hover:text-[#0C3834] transition-colors"
                                >
                                    {showPassword ? (
                                        <HiOutlineEyeOff className="w-5 h-5" />
                                    ) : (
                                        <HiOutlineEye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password Link */}
                        <div className="text-right">
                            <Link
                                to="/forgot-password"
                                className="text-sm font-medium text-[#0C3834] hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        {/* Login Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-[#0C3834] text-white font-semibold rounded-full hover:bg-[#0a2d2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Logging in...
                                </span>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>
                </div>

                {/* Register Link - At bottom */}
                <div className="mt-8">
                    <p className="text-sm text-[#0C3834]/70">
                        Don't Have an Account ?{' '}
                        <Link to="/register" className="font-bold text-[#0C3834] hover:underline">
                            Register Now
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="w-1/2 hidden lg:flex items-center">
                <div className="bg-[#06302C] rounded-[2.5rem] py-44 px-36 flex items-center justify-center overflow-visible">

                    {/* Main Illustration */}
                    <div className="relative z-10">
                        <img
                            src="/assets/Computer login-cuate.png"
                            alt="Login illustration"
                            className="w-[450px] h-auto object-contain"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
