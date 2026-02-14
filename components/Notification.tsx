import React, { useEffect, useState } from 'react';

interface NotificationProps {
    message: string;
    visible: boolean;
    onClose: () => void;
    type?: 'sms' | 'info';
}

const Notification: React.FC<NotificationProps> = ({ message, visible, onClose, type = 'info' }) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                onClose();
            }, 5000); // Auto hide after 5s
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <div className={`fixed top-4 left-4 right-4 z-[100] p-4 rounded-xl shadow-2xl transition-all transform duration-500 ease-in-out ${visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'} ${type === 'sms' ? 'bg-gray-800/95 text-white backdrop-blur' : 'bg-blue-500 text-white'}`}>
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${type === 'sms' ? 'bg-green-500' : 'bg-white/20'}`}>
                    <i className={`fa-solid ${type === 'sms' ? 'fa-message' : 'fa-bell'}`}></i>
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-sm mb-0.5">{type === 'sms' ? '新短信' : '提示'}</h4>
                    <p className="text-sm opacity-90 leading-tight">{message}</p>
                </div>
                <button onClick={onClose} className="text-white/50 hover:text-white">
                    <i className="fa-solid fa-xmark"></i>
                </button>
            </div>
        </div>
    );
};

export default Notification;