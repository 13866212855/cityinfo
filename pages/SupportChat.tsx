import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, User } from '../types';

interface SupportChatProps {
    user: User | null;
    chatHistory: ChatMessage[];
    onSendMessage: (content: string) => void;
    onBack: () => void;
    onLoginReq: () => void;
    targetName?: string; // Optional target name, defaults to "人工客服"
}

const SupportChat: React.FC<SupportChatProps> = ({ user, chatHistory, onSendMessage, onBack, onLoginReq, targetName = "人工客服" }) => {
    const [inputValue, setInputValue] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSend = () => {
        if (!user) {
            onLoginReq();
            return;
        }
        if (!inputValue.trim()) return;
        onSendMessage(inputValue);
        setInputValue('');
    };

    const formatTime = (ts: number) => {
        const date = new Date(ts);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();
        
        return date.toLocaleString('zh-CN', { 
            month: isToday ? undefined : 'numeric', 
            day: isToday ? undefined : 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center">
                    <i className="fa-solid fa-arrow-left text-gray-700"></i>
                </button>
                <div className="flex-1">
                    <h1 className="font-bold text-gray-900">{targetName}</h1>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-xs text-gray-400">在线</span>
                    </div>
                </div>
                <button className="text-gray-400">
                    <i className="fa-solid fa-ellipsis"></i>
                </button>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Default Welcome Message (Only show for Support) */}
                {targetName === "人工客服" && (
                    <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 mr-2 mt-1">
                            <i className="fa-solid fa-headset text-xs"></i>
                        </div>
                        <div className="max-w-[80%] rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm text-sm leading-relaxed bg-white text-gray-800 border border-gray-100">
                            您好，我是人工客服。请问有什么可以帮您？
                        </div>
                    </div>
                )}

                {chatHistory.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                            {msg.role !== 'user' && (
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-1 text-white ${targetName === '人工客服' ? 'bg-blue-100 text-blue-600' : 'bg-gray-300'}`}>
                                    {targetName === '人工客服' ? <i className="fa-solid fa-headset text-xs"></i> : <i className="fa-solid fa-user text-xs"></i>}
                                </div>
                            )}
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-primary text-white rounded-tr-none' 
                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                        <span className={`text-[10px] text-gray-300 mt-1 px-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                            {formatTime(msg.timestamp)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t border-gray-100 safe-area-bottom">
                {!user ? (
                    <button 
                        onClick={onLoginReq}
                        className="w-full bg-primary text-white py-3 rounded-xl font-bold"
                    >
                        登录后开始聊天
                    </button>
                ) : (
                    <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-primary transition-colors">
                        <textarea 
                            className="flex-1 bg-transparent max-h-24 outline-none text-sm p-1.5 resize-none"
                            rows={1}
                            placeholder="发送消息..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                        ></textarea>
                        <button 
                            onClick={handleSend}
                            disabled={!inputValue.trim()}
                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                                !inputValue.trim() 
                                ? 'bg-gray-200 text-gray-400' 
                                : 'bg-primary text-white shadow-md active:scale-95'
                            }`}
                        >
                            <i className="fa-solid fa-paper-plane text-xs"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SupportChat;