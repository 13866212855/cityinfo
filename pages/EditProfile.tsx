import React, { useState } from 'react';
import { User } from '../types';

interface EditProfileProps {
    user: User;
    onUpdate: (updatedUser: User) => void;
    onBack: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ user, onUpdate, onBack }) => {
    const [formData, setFormData] = useState({
        nickname: user.nickname || '',
        avatarUrl: user.avatarUrl || '',
        realName: user.realName || '',
        qq: user.qq || '',
        wechat: user.wechat || '',
        address: user.address || ''
    });

    const handleChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        const updatedUser: User = {
            ...user,
            ...formData
        };
        onUpdate(updatedUser);
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-safe">
            {/* Header */}
            <div className="bg-white p-4 border-b border-gray-100 flex items-center sticky top-0 z-10">
                <button onClick={onBack} className="w-8 h-8 flex items-center justify-center -ml-2">
                    <i className="fa-solid fa-arrow-left text-gray-700"></i>
                </button>
                <h1 className="text-lg font-bold text-gray-900 flex-1 text-center pr-6">编辑个人信息</h1>
                <button 
                    onClick={handleSave}
                    className="text-primary font-bold text-sm"
                >
                    保存
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Avatar */}
                <div className="bg-white rounded-xl p-4 flex flex-col items-center">
                    <div className="relative">
                        <img src={formData.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-gray-100" />
                        <div className="absolute bottom-0 right-0 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                            <i className="fa-solid fa-camera text-[10px]"></i>
                        </div>
                    </div>
                    <span className="text-xs text-gray-400 mt-2">点击修改头像</span>
                </div>

                {/* Basic Info Form */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-50">
                        <label className="block text-xs text-gray-400 mb-1">昵称</label>
                        <input 
                            type="text" 
                            className="w-full outline-none text-gray-800 font-medium"
                            value={formData.nickname}
                            onChange={(e) => handleChange('nickname', e.target.value)}
                        />
                    </div>
                    <div className="p-4 border-b border-gray-50">
                        <label className="block text-xs text-gray-400 mb-1">真实姓名 (仅实名认证时使用)</label>
                        <input 
                            type="text" 
                            className="w-full outline-none text-gray-800 font-medium"
                            placeholder="未填写"
                            value={formData.realName}
                            onChange={(e) => handleChange('realName', e.target.value)}
                        />
                    </div>
                    <div className="p-4 border-b border-gray-50">
                        <label className="block text-xs text-gray-400 mb-1">手机号 (ID)</label>
                        <div className="text-gray-500 font-medium">{user.phone} <i className="fa-solid fa-lock text-xs text-gray-300 ml-1"></i></div>
                    </div>
                </div>

                {/* Contact Info Form */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                     <div className="p-4 border-b border-gray-50">
                        <label className="block text-xs text-gray-400 mb-1">QQ号</label>
                        <input 
                            type="text" 
                            className="w-full outline-none text-gray-800 font-medium"
                            placeholder="请输入QQ号"
                            value={formData.qq}
                            onChange={(e) => handleChange('qq', e.target.value)}
                        />
                    </div>
                    <div className="p-4 border-b border-gray-50">
                        <label className="block text-xs text-gray-400 mb-1">微信号</label>
                        <input 
                            type="text" 
                            className="w-full outline-none text-gray-800 font-medium"
                            placeholder="请输入微信号"
                            value={formData.wechat}
                            onChange={(e) => handleChange('wechat', e.target.value)}
                        />
                    </div>
                    <div className="p-4">
                        <label className="block text-xs text-gray-400 mb-1">联系地址</label>
                        <textarea 
                            className="w-full outline-none text-gray-800 font-medium resize-none bg-transparent"
                            placeholder="请输入常用联系地址"
                            rows={2}
                            value={formData.address}
                            onChange={(e) => handleChange('address', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProfile;