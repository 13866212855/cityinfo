import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/supabase';

interface LoginProps {
    onLogin: (user: User) => void;
    onBack: () => void;
    onShowNotification: (msg: string, type: 'sms' | 'info') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack, onShowNotification }) => {
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [countdown, setCountdown] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Countdown timer logic
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendCode = () => {
        if (phone === 'admin') {
             onShowNotification(`管理员测试码: admin123`, 'info');
             return;
        }

        if (!/^1[3-9]\d{9}$/.test(phone)) {
            alert('请输入正确的11位手机号码');
            return;
        }
        
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setCountdown(60);
            onShowNotification(`【CityInfo】您的验证码是 123456，5分钟内有效。如非本人操作请忽略。`, 'sms');
        }, 1500);
    };

    const handleLogin = async () => {
        if (!phone || !code) return;
        
        // --- Admin Login Logic ---
        if (phone === 'admin' && code === 'admin123') {
             const adminUser: User = {
                id: 'admin',
                phone: 'admin',
                nickname: '超级管理员',
                avatarUrl: 'https://ui-avatars.com/api/?name=Admin&background=000&color=fff',
                isVerified: true,
                registerTime: Date.now(),
                isAdmin: true
            };
            setIsLoading(true);
            // Simulate Async
            await new Promise(r => setTimeout(r, 500));
            setIsLoading(false);
            onLogin(adminUser);
            return;
        }
        // -----------------------

        if (code !== '123456') {
            alert('验证码错误 (测试码: 123456)');
            return;
        }

        setIsLoading(true);

        // Prepare User Object for Registration if needed
        const newUser: User = {
            id: 'u_' + phone.substring(7), // In a real app, DB generates ID
            phone: phone,
            nickname: `用户${phone.substring(7)}`,
            avatarUrl: `https://ui-avatars.com/api/?name=${phone.substring(7)}&background=random&color=fff`,
            isVerified: true,
            registerTime: Date.now()
        };

        // Call Supabase API
        try {
            const loggedInUser = await api.loginOrRegister(phone, newUser);
            onLogin(loggedInUser);
        } catch (e) {
            console.error(e);
            alert('登录失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen flex flex-col p-6">
            <div className="mb-10 mt-4">
                <button onClick={onBack} className="mb-6">
                    <i className="fa-solid fa-xmark text-2xl text-gray-800"></i>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">手机号登录</h1>
                <p className="text-gray-400 text-sm">未注册手机号验证后将自动创建账号</p>
            </div>

            <div className="flex-1">
                <div className="mb-6">
                    <div className="relative border-b border-gray-200 py-3">
                        <span className="absolute left-0 top-3 text-lg font-medium text-gray-900">+86</span>
                        <input 
                            type="text" 
                            className="w-full pl-12 text-lg outline-none placeholder-gray-300"
                            placeholder="请输入手机号码"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        {phone && (
                            <button 
                                onClick={() => setPhone('')}
                                className="absolute right-0 top-4 text-gray-300"
                            >
                                <i className="fa-solid fa-circle-xmark"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-10">
                    <div className="relative border-b border-gray-200 py-3 flex justify-between items-center">
                        <input 
                            type={phone === 'admin' ? 'password' : 'number'}
                            className="w-full text-lg outline-none placeholder-gray-300 tracking-widest"
                            placeholder="请输入验证码"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <button 
                            onClick={handleSendCode}
                            disabled={countdown > 0 || !phone}
                            className={`text-sm font-medium whitespace-nowrap ml-4 ${
                                countdown > 0 || !phone ? 'text-gray-300' : 'text-primary'
                            }`}
                        >
                            {isLoading ? '发送中...' : (countdown > 0 ? `${countdown}s后重发` : '获取验证码')}
                        </button>
                    </div>
                </div>

                <button 
                    onClick={handleLogin}
                    disabled={!phone || !code || isLoading}
                    className={`w-full py-3.5 rounded-full font-bold text-white shadow-lg transition-all ${
                        !phone || !code || isLoading
                        ? 'bg-blue-300 cursor-not-allowed' 
                        : 'bg-primary active:scale-95 active:bg-blue-600'
                    }`}
                >
                    {isLoading ? <i className="fa-solid fa-circle-notch fa-spin"></i> : '登录 / 注册'}
                </button>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-400 mb-4">其他登录方式</p>
                    <div className="flex justify-center gap-6">
                        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-green-500">
                            <i className="fa-brands fa-weixin text-xl"></i>
                        </button>
                        <button className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center text-blue-400">
                            <i className="fa-brands fa-qq text-xl"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="text-center text-[10px] text-gray-400 leading-relaxed">
                登录即代表您同意 <span className="text-blue-500">《用户协议》</span> 和 <span className="text-blue-500">《隐私政策》</span>
                <br />
                并授权使用您的账号信息（如昵称、头像、地区）
            </div>
        </div>
    );
};

export default Login;