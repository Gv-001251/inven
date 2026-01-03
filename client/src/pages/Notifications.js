import React, { useState } from 'react';
import { HiOutlineBell } from 'react-icons/hi';

const Notifications = () => {
    // State to simulate notifications (can be connected to backend later)
    // For now, defaulting to empty array to show the requested "No Notifications" state
    const [notifications, setNotifications] = useState([]);

    return (
        <div className="min-h-full">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-primary">Notifications</h1>
            </div>

            {/* Content Area */}
            {notifications.length === 0 ? (
                // Empty State (Matches the design)
                <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in-up">
                    {/* 
                        PLACEHOLDER FOR ILLUSTRATION 
                        ---------------------------------------------------------
                        User Instruction: 
                        Replace the src below with your uploaded illustration image path.
                        Example: src="/assets/no-notifications.png"
                        You can put the image in public/assets folder.
                    */}
                    <div className="relative mb-6">
                        {/* Circle Background Effect */}
                        <div className="absolute inset-0 bg-emerald-custom/10 blur-3xl rounded-full transform scale-150"></div>

                        <img
                            src="https://illustrations.popsy.co/emerald/success.svg" // Placeholder illustration
                            alt="No Notifications"
                            className="relative w-64 h-64 object-contain opacity-90"
                        />

                        {/* Optional: Add a "0" badge overlay if needed as per design */}
                        <div className="absolute top-1/2 right-0 translate-x-4 -translate-y-4 bg-primary text-white text-xl font-bold w-12 h-12 flex items-center justify-center rounded-full border-4 border-mint">
                            0
                        </div>
                    </div>

                    <h2 className="text-primary text-xl font-medium tracking-wide">
                        No Notifications Yet
                    </h2>
                    <p className="text-gray-500 mt-2 text-sm">
                        You're all caught up! Check back later for updates.
                    </p>
                </div>
            ) : (
                // List View (Future Proofing)
                <div className="bg-white rounded-2xl shadow-sm border border-primary/5 p-4 space-y-4">
                    {notifications.map((notif) => (
                        <div key={notif.id} className="p-4 border-l-4 border-primary bg-mint/10 rounded-r-lg flex items-start gap-4">
                            <div className="p-2 bg-white rounded-full text-primary shadow-sm">
                                <HiOutlineBell />
                            </div>
                            <div>
                                <h4 className="font-bold text-primary">{notif.title}</h4>
                                <p className="text-sm text-gray-600">{notif.message}</p>
                                <span className="text-xs text-gray-400 mt-1 block">{notif.time}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
