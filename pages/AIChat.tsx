import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { callDeepSeek } from '../services/deepseek';

interface AIChatProps {
    onBack: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ onBack }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'assistant', content: '您好！我是 CityInfo 的智能助手（DeepSeek内核）。我可以帮您查询本地信息、提供生活建议，或解答平台相关问题。', timestamp: Date.now() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputValue,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            // Prepare context for DeepSeek
            const history = messages.map(m => ({ role: m.role, content: m.content })).slice(-10) as any; // Last 10 context
            history.push({ role: 'user', content: userMsg.content });

            const aiResponseText = await callDeepSeek(history, "你是一个本地生活信息平台的智能助手，名字叫 CityInfo Bot。请用亲切、乐于助人的语气回答用户关于生活服务、租房、招聘等问题。");

            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponseText,
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (e) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "抱歉，我好像断网了，请稍后再试。",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white p-4 border-b border-gray-100 flex items-center gap-3 sticky top-0 z-10">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center">
                    <i className="fa-solid fa-arrow-left text-gray-700"></i>
                </button>
                <div className="flex-1">
                    <h1 className="font-bold text-gray-900">智能助手</h1>
                    <div className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="text-xs text-gray-400">DeepSeek Online</span>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white mr-2 mt-1">
                                <i className="fa-solid fa-robot text-xs"></i>
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
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white mr-2 mt-1">
                            <i className="fa-solid fa-robot text-xs"></i>
                        </div>
                        <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-gray-100 flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="bg-white p-3 border-t border-gray-100 safe-area-bottom">
                <div className="flex gap-2 items-end bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-primary transition-colors">
                    <textarea 
                        className="flex-1 bg-transparent max-h-24 outline-none text-sm p-1.5 resize-none"
                        rows={1}
                        placeholder="输入您的问题..."
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
                        disabled={!inputValue.trim() || isLoading}
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            !inputValue.trim() || isLoading 
                            ? 'bg-gray-200 text-gray-400' 
                            : 'bg-primary text-white shadow-md active:scale-95'
                        }`}
                    >
                        <i className="fa-solid fa-paper-plane text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIChat;