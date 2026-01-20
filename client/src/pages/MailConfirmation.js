import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import api from '../utils/axios';

function MailConfirmation() {
    const location = useLocation();
    const email = location.state?.email || 'your email';

    const handleResend = async () => {
        try {
            // Placeholder for Supabase auth integration
            // await api.post('/auth/resend-confirmation', { email });
            alert('Confirmation mail resent!');
        } catch (err) {
            alert('Failed to resend mail. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex bg-[#e8f5e9]">
            {/* Left Side - Illustration (Hidden on mobile) */}
            <div className="w-1/2 hidden lg:flex items-center justify-center p-8">
                <div className="bg-[#06302C] rounded-[2.5rem] w-full h-[90%] flex items-center justify-center relative overflow-hidden">
                    <img
                        src="/assets/Mail sent-rafiki.png"
                        alt="Mail Confirmation illustration"
                        className="w-[80%] h-auto object-contain relative z-10"
                    />
                    {/* Decorative circles */}
                    <div className="absolute top-20 right-20 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
                    <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/5 rounded-full blur-xl"></div>
                </div>
            </div>

            {/* Right Side - Content */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center py-12 px-8 sm:px-16 lg:px-20 relative">
                {/* Back Button */}
                <Link
                    to="/login"
                    className="absolute top-8 left-8 sm:left-16 lg:left-20 flex items-center gap-2 text-[#0C3834] font-medium hover:underline transition-all"
                >
                    <HiOutlineArrowLeft className="text-xl" />
                    Back to Login
                </Link>

                <div className="w-full max-w-lg text-center">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-[#0C3834] mb-3">
                            MAIL CONFIRMATION
                        </h1>
                    </div>

                    <div className="space-y-6">
                        <p className="text-[#0C3834]/80 leading-relaxed font-medium">
                            We have sent email to <span className="font-bold text-[#0C3834]">{email}</span> to confirm the validity of our email address. After receiving the email follow the link provided to complete you registration.
                        </p>

                        <div className="w-full h-px bg-[#0C3834]/10 my-8"></div>

                        <p className="text-[#0C3834]/80 font-medium">
                            If you not got any mail{' '}
                            <button
                                onClick={handleResend}
                                className="font-bold text-[#0C3834] hover:underline focus:outline-none"
                            >
                                Resend confirmation mail
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MailConfirmation;
