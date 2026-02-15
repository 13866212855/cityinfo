import React, { useState, useRef, useEffect } from 'react';
import { CategoryType, Post, PostAttribute, SysCategory } from '../types';
import { generateDescription } from '../services/deepseek';
import { api } from '../services/supabase';
import MapViewer from '../components/MapViewer';

interface PublishProps {
    onBack: () => void;
    onPublish: (post: Post) => void;
    categoryConfig: Record<string, SysCategory>;
}

const Publish: React.FC<PublishProps> = ({ onBack, onPublish, categoryConfig }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Debug logging for mobile
    useEffect(() => {
        console.log('[Publish] Component mounted');
        console.log('[Publish] categoryConfig:', categoryConfig);
        console.log('[Publish] categoryConfig keys:', Object.keys(categoryConfig));
    }, []);

    useEffect(() => {
        console.log('[Publish] step changed to:', step);
        console.log('[Publish] selectedCategory:', selectedCategory);
    }, [step, selectedCategory]);
    
    // Form State
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [desc, setDesc] = useState('');
    const [images, setImages] = useState<string[]>([]);
    
    // Mocking specific attributes to simple state variables for demo
    const [attr1, setAttr1] = useState('');
    const [attr2, setAttr2] = useState('');

    // Location State
    const [locationText, setLocationText] = useState('请选择位置');
    const [lat, setLat] = useState<number | undefined>(undefined);
    const [lng, setLng] = useState<number | undefined>(undefined);
    const [showMap, setShowMap] = useState(false);
    const [isLoadingLoc, setIsLoadingLoc] = useState(false);
    
    // Image Upload State
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handlePublish = () => {
        if (!title || !selectedCategory) return;

        const attributes: PostAttribute[] = [];
        if (selectedCategory === CategoryType.HOUSING) {
            attributes.push({ key: 'layout', label: '户型', value: attr1 || '1室0厅' });
            attributes.push({ key: 'size', label: '面积', value: (attr2 || '0') + '㎡' });
        } else if (selectedCategory === CategoryType.JOBS) {
            attributes.push({ key: 'exp', label: '经验要求', value: attr1 || '不限' });
        }

        const newPost: Post = {
            id: 'p_' + Date.now(),
            title: title,
            description: desc || '暂无描述',
            category: selectedCategory,
            price: price || '面议',
            images: images, // Use real uploaded images
            tags: ['新发布'],
            location: locationText === '请选择位置' ? '未知位置' : locationText,
            lat: lat,
            lng: lng,
            distance: '0.1km',
            contactPhone: '13800000000',
            publishTime: Date.now(),
            viewCount: 0,
            isSticky: false,
            authorName: '我',
            avatarUrl: 'https://ui-avatars.com/api/?name=Me&background=random',
            attributes: attributes
        };

        onPublish(newPost);
        onBack();
    };

    const handleAIGenerate = async () => {
        if (!title) {
            alert('请先输入标题，AI才能帮您写描述哦');
            return;
        }
        setIsGenerating(true);
        try {
            const catLabel = categoryConfig[selectedCategory!]?.label || '通用';
            const result = await generateDescription(title, catLabel, `${attr1} ${attr2}`);
            setDesc(result);
        } catch (e) {
            alert('AI 正在开小差，请稍后再试');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGetLocation = () => {
        setIsLoadingLoc(true);
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    setLat(latitude);
                    setLng(longitude);
                    // Mock Reverse Geocoding
                    setLocationText(`已定位 (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
                    setIsLoadingLoc(false);
                },
                (error) => {
                    console.error(error);
                    alert("获取定位失败，请确保已授权位置权限。");
                    setIsLoadingLoc(false);
                }
            );
        } else {
            alert("您的浏览器不支持地理定位");
            setIsLoadingLoc(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Simple validation
        if (!file.type.startsWith('image/')) {
            alert('请上传图片格式的文件');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('图片大小不能超过 5MB');
            return;
        }

        setIsUploading(true);
        try {
            const publicUrl = await api.uploadImage(file);
            setImages(prev => [...prev, publicUrl]);
        } catch (error: any) {
            console.error(error);
            // Enhanced error message matching
            if (error.message?.includes('violates row-level security') || error.message?.includes('security policy')) {
                alert('【权限错误】上传失败。\n\n您的数据库权限受限，SQL脚本可能无法执行。请直接在 Supabase 后台操作：\n1. 点击左侧 "Storage"\n2. 点击 "pic" 桶的 "Configuration"\n3. 在 Policies 中添加 "Allow public uploads"');
            } else {
                alert(`上传出错: ${error.message || '网络错误'}`);
            }
        } finally {
            setIsUploading(false);
            // Reset input value to allow selecting same file again if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const renderDynamicFields = () => {
        switch (selectedCategory) {
            case CategoryType.HOUSING:
                return (
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">户型</label>
                                <select 
                                    className="w-full p-2 bg-gray-50 rounded border border-gray-200 text-sm"
                                    value={attr1}
                                    onChange={(e) => setAttr1(e.target.value)}
                                >
                                    <option value="">请选择</option>
                                    <option value="1室1厅">1室1厅</option>
                                    <option value="2室1厅">2室1厅</option>
                                    <option value="3室以上">3室以上</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">面积 (㎡)</label>
                                <input 
                                    type="number" 
                                    className="w-full p-2 bg-gray-50 rounded border border-gray-200 text-sm" 
                                    placeholder="例如 50" 
                                    value={attr2}
                                    onChange={(e) => setAttr2(e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                );
            case CategoryType.JOBS:
                return (
                    <div className="mb-4">
                         <label className="block text-xs font-medium text-gray-500 mb-1">经验要求</label>
                         <div className="flex gap-2">
                            {['应届生', '1-3年', '3-5年', '5年以上'].map(l => (
                                <button 
                                    key={l} 
                                    onClick={() => setAttr1(l)}
                                    className={`px-3 py-1 border rounded text-sm ${attr1 === l ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200'}`}
                                >
                                    {l}
                                </button>
                            ))}
                         </div>
                    </div>
                );
            default:
                return <div className="text-xs text-gray-400 mb-4 italic">当前分类无需特殊属性</div>;
        }
    };

    if (step === 1) {
        // Add error boundary for step 1
        try {
            const categoryList = Object.values(categoryConfig) as SysCategory[];
            console.log('[Publish] Step 1 - categoryList length:', categoryList.length);
            
            if (categoryList.length === 0) {
                return (
                    <div className="bg-white min-h-screen flex flex-col items-center justify-center p-4">
                        <i className="fa-solid fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                        <p className="text-gray-600 mb-4">分类数据加载失败</p>
                        <button 
                            onClick={onBack}
                            className="px-6 py-2 bg-primary text-white rounded-lg"
                        >
                            返回首页
                        </button>
                    </div>
                );
            }

            return (
                <div className="bg-white min-h-screen">
                    <div className="p-4 flex items-center border-b border-gray-100">
                        <button onClick={onBack}><i className="fa-solid fa-xmark text-xl text-gray-500"></i></button>
                        <span className="ml-4 font-bold text-lg">选择分类</span>
                    </div>
                    {/* Updated to grid-cols-3 for better visual on step 1 */}
                    <div className="grid grid-cols-3 gap-3 p-4">
                        {/* Sort based on sort_order if available */}
                        {categoryList
                            .filter(cat => cat && cat.key && cat.label) // Filter out invalid entries
                            .sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0))
                            .map((cat) => (
                            <button 
                                key={cat.key}
                                onClick={() => { 
                                    console.log('[Publish] Category selected:', cat.key);
                                    setSelectedCategory(cat.key as CategoryType); 
                                    setStep(2); 
                                }}
                                className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-gray-50 active:scale-95 transition-all"
                            >
                                 <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${cat.color}`}>
                                    <i className={`fa-solid ${cat.icon} text-xl`}></i>
                                </div>
                                <span className="font-semibold text-gray-700 text-xs">{cat.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            );
        } catch (error) {
            console.error('[Publish] Error in step 1:', error);
            return (
                <div className="bg-white min-h-screen flex flex-col items-center justify-center p-4">
                    <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                    <p className="text-gray-600 mb-2">页面加载出错</p>
                    <p className="text-xs text-gray-400 mb-4">{String(error)}</p>
                    <button 
                        onClick={onBack}
                        className="px-6 py-2 bg-primary text-white rounded-lg"
                    >
                        返回首页
                    </button>
                </div>
            );
        }
    }

    // Safety check: if selectedCategory is not in config, go back to step 1
    const currentCategory = selectedCategory ? categoryConfig[selectedCategory] : null;
    if (!currentCategory) {
        return (
            <div className="bg-white min-h-screen flex flex-col items-center justify-center p-4">
                <i className="fa-solid fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                <p className="text-gray-600 mb-4">分类配置加载失败</p>
                <button 
                    onClick={() => setStep(1)}
                    className="px-6 py-2 bg-primary text-white rounded-lg"
                >
                    返回选择分类
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen flex flex-col">
            {showMap && lat && lng && (
                <MapViewer 
                    lat={lat} 
                    lng={lng} 
                    title="当前位置" 
                    onClose={() => setShowMap(false)} 
                />
            )}

            <div className="p-4 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => setStep(1)}><i className="fa-solid fa-arrow-left text-gray-500"></i></button>
                <span className="font-bold text-lg">发布{currentCategory.label}信息</span>
                <button onClick={handlePublish} className="text-primary font-bold text-sm">发布</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Core Fields */}
                <div className="mb-4">
                    <input 
                        type="text" 
                        placeholder="请输入标题..." 
                        className="w-full text-xl font-bold placeholder-gray-300 outline-none"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="mb-6 relative">
                    <textarea 
                        placeholder="描述具体详情（成色、要求、位置等）..." 
                        className="w-full h-32 text-base placeholder-gray-400 outline-none resize-none bg-gray-50 p-3 rounded-lg"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                    ></textarea>
                    
                    {/* DeepSeek Integration Button */}
                    <button 
                        onClick={handleAIGenerate}
                        disabled={isGenerating}
                        className="absolute bottom-3 right-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md active:opacity-80 transition-all"
                    >
                        {isGenerating ? (
                            <><i className="fa-solid fa-circle-notch fa-spin"></i> 正在生成...</>
                        ) : (
                            <><i className="fa-solid fa-wand-magic-sparkles"></i> AI 帮我写</>
                        )}
                    </button>
                </div>

                {/* Media Upload Area - Optimized UI */}
                <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-800 mb-2">图片上传</h3>
                    <div className="grid grid-cols-4 gap-2">
                        {/* Hidden Input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                        />
                        
                        {/* Image Previews */}
                        {images.map((imgUrl, idx) => (
                            <div key={idx} className="aspect-square rounded-lg relative group overflow-hidden border border-gray-100">
                                <img src={imgUrl} alt="preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => handleRemoveImage(idx)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center shadow-md active:scale-95 backdrop-blur-sm"
                                >
                                    <i className="fa-solid fa-xmark text-xs"></i>
                                </button>
                            </div>
                        ))}

                        {/* Upload Button */}
                        {images.length < 9 && (
                            <div 
                                onClick={() => !isUploading && fileInputRef.current?.click()}
                                className="aspect-square bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 active:bg-gray-200 transition-colors relative"
                            >
                                {isUploading ? (
                                    <>
                                        <i className="fa-solid fa-circle-notch fa-spin text-xl text-primary mb-1"></i>
                                        <span className="text-[10px] text-primary">上传中...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-camera mb-1 text-xl"></i>
                                        <span className="text-[10px]">添加 ({images.length}/9)</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Location Picker */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="text-sm font-bold text-gray-800">位置信息</h3>
                         {lat && lng && (
                            <button 
                                onClick={() => setShowMap(true)} 
                                className="text-xs text-blue-500"
                            >
                                查看地图
                            </button>
                         )}
                    </div>
                    <div 
                        className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg active:bg-gray-100 transition-colors cursor-pointer"
                        onClick={handleGetLocation}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${lat ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                            {isLoadingLoc ? (
                                <i className="fa-solid fa-spinner fa-spin text-xs"></i>
                            ) : (
                                <i className="fa-solid fa-location-dot text-xs"></i>
                            )}
                        </div>
                        <div className="flex flex-col flex-1">
                            <span className={`text-sm font-medium ${lat ? 'text-gray-900' : 'text-gray-400'}`}>
                                {locationText}
                            </span>
                            <span className="text-[10px] text-gray-400">点击获取当前定位</span>
                        </div>
                        <i className="fa-solid fa-chevron-right text-xs text-gray-300"></i>
                    </div>
                </div>

                {/* Dynamic Fields Section */}
                <div className="border-t border-gray-100 pt-4">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">属性信息</h3>
                    
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            {selectedCategory === CategoryType.JOBS ? '薪资范围' : '价格 / 租金'}
                        </label>
                        <input 
                            type="text" 
                            className="w-full p-2 bg-gray-50 rounded border border-gray-200 text-sm" 
                            placeholder={selectedCategory === CategoryType.JOBS ? "例如 10k-15k" : "¥"}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>
                    
                    {renderDynamicFields()}
                </div>

                {/* Contact Info */}
                <div className="border-t border-gray-100 pt-4 mt-2">
                    <div className="flex justify-between items-center mb-2">
                         <h3 className="text-sm font-bold text-gray-800">联系方式</h3>
                         <span className="text-xs text-primary">自动填充</span>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <i className="fa-solid fa-phone text-xs"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">138****0000</span>
                            <span className="text-[10px] text-gray-400">仅对方可见/虚拟号保护</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Marketing Context Upsell */}
            <div className="p-3 bg-yellow-50 border-t border-yellow-100">
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="sticky" className="rounded text-yellow-600 focus:ring-yellow-500" />
                    <label htmlFor="sticky" className="text-sm text-yellow-800 font-medium flex-1">
                        置顶推广 (Boost)
                        <span className="block text-[10px] text-yellow-600 font-normal">获取10倍曝光，仅需 ¥2.99</span>
                    </label>
                </div>
            </div>
        </div>
    );
};

export default Publish;