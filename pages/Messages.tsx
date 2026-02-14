import React from 'react';
import { MOCK_CHATS } from '../constants';
import { ChatSession } from '../types';

interface MessagesProps {
    onOpenAI: () => void;
    onChatClick: (chat: ChatSession) => void;
}

const Messages: React.FC<MessagesProps> = ({ onOpenAI, onChatClick }) => {
    const formatTime = (ts: number) => {
        const date = new Date(ts);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
        }
        return date.toLocaleDateString();
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
                <h1 className="text-xl font-bold">消息</h1>
                <button className="text-sm text-gray-500">清除未读</button>
            </div>

            <div className="bg-white">
                {/* AI Assistant Entry */}
                <div 
                    onClick={onOpenAI}
                    className="flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer bg-blue-50/50"
                >
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full border border-blue-200 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                            <i className="fa-solid fa-robot"></i>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">AI 智能助手 (DeepSeek)</h3>
                            <span className="text-xs text-blue-500 font-bold">LIVE</span>
                        </div>
                        <p className="text-sm text-gray-500 truncate">有什么可以帮您的吗？</p>
                    </div>
                </div>

                {MOCK_CHATS.map(chat => (
                    <div 
                        key={chat.id} 
                        onClick={() => onChatClick(chat)}
                        className="flex items-center gap-3 p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <div className="relative">
                            <img src={chat.avatarUrl} className="w-12 h-12 rounded-full border border-gray-100" alt="avatar" />
                            {chat.unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                                    <span className="text-[10px] text-white font-bold">{chat.unreadCount}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-semibold text-gray-900 truncate">{chat.targetName}</h3>
                                <span className="text-xs text-gray-400 flex-shrink-0">{formatTime(chat.lastTime)}</span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{chat.lastMessage}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-8 text-center text-gray-400 text-xs">
                <i className="fa-solid fa-shield-halved mb-2 text-lg"></i>
                <p>平台已开启隐私保护，请勿轻信转账汇款信息</p>
            </div>
        </div>
    );
};

export default Messages;