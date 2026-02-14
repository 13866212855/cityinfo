import React from 'react';
import { ViewState } from '../types';

interface NavBarProps {
    currentView: ViewState;
    onChange: (view: ViewState) => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentView, onChange }) => {
    const navItems: { view: ViewState, label: string, icon: string }[] = [
        { view: 'HOME', label: '首页', icon: 'fa-house' },
        { view: 'EXPLORE', label: '发现', icon: 'fa-compass' },
        { view: 'PUBLISH', label: '发布', icon: 'fa-plus-circle' },
        { view: 'MESSAGES', label: '消息', icon: 'fa-comment-dots' },
        { view: 'PROFILE', label: '我的', icon: 'fa-user' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 pb-safe flex justify-around items-center z-50">
            {navItems.map((item) => {
                const isActive = currentView === item.view || (currentView === 'POST_DETAIL' && item.view === 'HOME');
                const isPublish = item.view === 'PUBLISH';
                
                if (isPublish) {
                    return (
                        <button 
                            key={item.view}
                            onClick={() => onChange(item.view)}
                            className="flex flex-col items-center justify-center -mt-6"
                        >
                            <div className="w-12 h-12 bg-primary rounded-full shadow-lg flex items-center justify-center text-white text-xl">
                                <i className={`fa-solid ${item.icon}`}></i>
                            </div>
                            <span className="text-[10px] mt-1 text-gray-500 font-medium">{item.label}</span>
                        </button>
                    )
                }

                return (
                    <button 
                        key={item.view}
                        onClick={() => onChange(item.view)}
                        className={`flex flex-col items-center justify-center w-12 ${isActive ? 'text-primary' : 'text-gray-400'}`}
                    >
                        <i className={`fa-solid ${item.icon} text-xl mb-1`}></i>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default NavBar;