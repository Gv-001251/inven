import React from 'react';
import { HiOutlineX, HiOutlineExclamation, HiOutlineCheckCircle, HiOutlineInformationCircle } from 'react-icons/hi';

const AlertModal = ({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'Confirm', cancelText = 'Cancel' }) => {
    if (!isOpen) return null;

    // Icons based on type
    const icons = {
        success: <HiOutlineCheckCircle className="text-emerald-400 text-5xl mb-4" />,
        error: <HiOutlineExclamation className="text-red-400 text-5xl mb-4" />,
        warning: <HiOutlineExclamation className="text-amber-400 text-5xl mb-4" />,
        info: <HiOutlineInformationCircle className="text-blue-400 text-5xl mb-4" />
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-primary w-full max-w-sm rounded-3xl p-8 shadow-2xl transform transition-all scale-100 text-center border border-white/10">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <HiOutlineX className="text-xl" />
                </button>

                <div className="flex flex-col items-center">
                    {icons[type] || icons.info}

                    <h3 className="text-xl font-bold text-white mb-2">
                        {title}
                    </h3>

                    <p className="text-white/70 mb-8 text-sm leading-relaxed">
                        {message}
                    </p>

                    <div className="flex gap-3 w-full">
                        {onConfirm ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 ${type === 'error' ? 'bg-red-500 hover:bg-red-600' :
                                            type === 'warning' ? 'bg-amber-500 hover:bg-amber-600' :
                                                'bg-emerald-500 hover:bg-emerald-600'
                                        }`}
                                >
                                    {confirmText}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onClose}
                                className="w-full px-4 py-3 rounded-xl bg-white text-primary font-bold hover:bg-gray-100 transition-colors shadow-lg"
                            >
                                Okay, Got it
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
