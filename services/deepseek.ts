// Service to handle DeepSeek API calls
// Note: In a production environment, API keys should never be stored in frontend code.
// This is for demonstration purposes only as requested.

import { ChatMessage, Post, Merchant } from '../types';
import { ADMIN_CONTACT } from '../constants';

// Default Configuration
const DEFAULT_CONFIG = {
    apiKey: '', // Security: Removed hardcoded key. User must set this in Admin Dashboard.
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000
};

const BASE_URL = 'https://api.deepseek.com';

interface DeepSeekMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

// Helper to get current config
export const getLLMConfig = () => {
    try {
        const saved = localStorage.getItem('cityinfo_llm_config');
        return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch (e) {
        return DEFAULT_CONFIG;
    }
};

export const callDeepSeek = async (messages: DeepSeekMessage[], systemPrompt?: string): Promise<string> => {
    const config = getLLMConfig();

    if (!config.apiKey) {
        return '请先在【管理员控制台 -> 系统设置】中配置 DeepSeek API Key。';
    }

    try {
        const payloadMessages = systemPrompt 
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : messages;

        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: payloadMessages,
                stream: false,
                temperature: config.temperature,
                max_tokens: config.maxTokens
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '抱歉，我现在无法回答。';
    } catch (error) {
        console.error('DeepSeek API Call Failed:', error);
        return 'AI 服务暂时不可用，请检查网络或 API Key 配置。';
    }
};

export const generateDescription = async (title: string, category: string, keywords: string): Promise<string> => {
    const prompt = `我正在“CityInfo”同城信息平台上发布一条信息。
    分类：${category}
    标题：${title}
    关键词：${keywords}
    
    请帮我生成一段吸引人、条理清晰的描述文案，包含必要的细节（如联系方式提示、优势介绍），字数在100字左右。语气要真诚、热情。`;

    return callDeepSeek([{ role: 'user', content: prompt }]);
};

// New function for Support Chat Auto-Reply
export const generateSupportReply = async (
    history: ChatMessage[], 
    posts: Post[], 
    merchants: Record<string, Merchant>
): Promise<string> => {
    // 1. Prepare Context Data (Summarize to save tokens)
    const postsContext = posts.slice(0, 15).map(p => 
        `- [${p.category}] ${p.title} (价格: ${p.price}, 位置: ${p.location})`
    ).join('\n');

    const merchantsContext = Object.values(merchants).map(m => 
        `- [商户] ${m.name} (评分: ${m.rating}, 主营: ${m.description})`
    ).join('\n');

    const systemPrompt = `你现在是“CityInfo”同城信息平台的【总管理员助手】。
    
    【你的身份】：
    1. 你代表平台唯一的管理员（Admin）。
    2. 如果需要联系管理员，请直接提供管理员的电话：${ADMIN_CONTACT.phone} 或 微信：${ADMIN_CONTACT.wechat}。
    3. 你不需要编造其他客服身份，所有咨询最终解释权归 Admin 所有。

    【任务目标】：
    由于管理员当前繁忙（超过10秒未回复），你需要接管对话，为用户提供温暖、专业、像人一样的服务。
    
    【平台当前数据摘要】：
    ${postsContext}
    ${merchantsContext}
    
    请根据上述数据和上下文历史，回复用户的最后一条消息。`;

    // 2. Convert ChatMessage to DeepSeekMessage
    // We map 'admin' role to 'assistant' so the AI knows the context of previous support replies
    const apiMessages: DeepSeekMessage[] = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant', 
        content: msg.content
    }));

    return callDeepSeek(apiMessages, systemPrompt);
};