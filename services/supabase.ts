import { createClient } from '@supabase/supabase-js';
import { Post, User, ChatMessage, WithdrawalRequest, WalletTransaction } from '../types';
import { MOCK_POSTS } from '../constants';

// Configuration provided by user
const SUPABASE_URL = 'https://ksstnzetvktwcoeyheqv.supabase.co';
const SUPABASE_KEY = 'sb_publishable_DxVCcUZluFDYg_e79nNu9g_-aSNSm8N';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * DB Service Wrapper
 * 智能处理数据库错误：当后端表缺失或权限不足时，自动降级为本地存储模式 (Demo Mode)
 */
export const api = {
    supabase,
    // --- Storage ---
    uploadImage: async (file: File): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { data, error: uploadError } = await supabase.storage
                .from('pic')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            const { data: urlData } = supabase.storage
                .from('pic')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error: any) {
            console.warn("⚠️ Image upload failed, switching to Local Base64 Mode:", error.message);
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error('Local file read failed'));
                reader.readAsDataURL(file);
            });
        }
    },

    // --- System Config ---
    getSystemConfig: async (key: string): Promise<string | null> => {
        const localVal = localStorage.getItem(`sys_config_${key}`);
        if (localVal) return localVal;

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('content')
                .eq('id', `config_${key}`)
                .single();
            
            if (error) throw error;
            return data?.content || null;
        } catch (error) {
            return null;
        }
    },

    saveSystemConfig: async (key: string, value: string): Promise<void> => {
        localStorage.setItem(`sys_config_${key}`, value);
        try {
            await supabase.from('messages').upsert({
                id: `config_${key}`,
                user_id: 'system',
                role: 'system',
                content: value,
                timestamp: Date.now()
            });
        } catch (e) {
             console.warn('Config synced to local only (DB offline)');
        }
    },

    // --- Wallet Transactions ---
    getWalletTransactions: async (userId: string): Promise<WalletTransaction[]> => {
        try {
            const { data, error } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('user_id', userId)
                .order('timestamp', { ascending: false });

            if (error) throw error;

            return data.map((row: any) => ({
                id: row.id,
                userId: row.user_id,
                type: row.type,
                title: row.title,
                amount: row.amount,
                balanceAfter: row.balance_after,
                status: row.status,
                timestamp: row.timestamp
            }));
        } catch (error: any) {
            console.warn('Fetching transactions failed, using LocalStorage:', error.code);
            const localDataStr = localStorage.getItem(`wallet_tx_${userId}`);
            return localDataStr ? JSON.parse(localDataStr) : [];
        }
    },

    createTransaction: async (tx: WalletTransaction): Promise<void> => {
        const row = {
            id: tx.id,
            user_id: tx.userId,
            type: tx.type,
            title: tx.title,
            amount: tx.amount,
            balance_after: tx.balanceAfter,
            status: tx.status,
            timestamp: tx.timestamp
        };

        try {
            const { error } = await supabase.from('wallet_transactions').insert(row);
            if (error) throw error;
        } catch (error) {
            console.warn('Transaction insert failed, using LocalStorage');
            // Local fallback for current user
            const key = `wallet_tx_${tx.userId}`;
            const existing = JSON.parse(localStorage.getItem(key) || '[]');
            localStorage.setItem(key, JSON.stringify([tx, ...existing]));
        }
    },

    // --- Recharge Audit (New) ---
    getPendingRecharges: async (): Promise<WalletTransaction[]> => {
        try {
            const { data, error } = await supabase
                .from('wallet_transactions')
                .select('*')
                .eq('type', 'RECHARGE')
                .eq('status', 'PENDING')
                .order('timestamp', { ascending: false });

            if (error) throw error;

            return data.map((row: any) => ({
                id: row.id,
                userId: row.user_id,
                type: row.type,
                title: row.title,
                amount: row.amount,
                balanceAfter: row.balance_after,
                status: row.status,
                timestamp: row.timestamp
            }));
        } catch (error: any) {
             const local = localStorage.getItem('global_pending_recharges_backup');
             return local ? JSON.parse(local) : [];
        }
    },

    reviewRecharge: async (txId: string, status: 'SUCCESS' | 'FAILED'): Promise<void> => {
        // Fetch the transaction first
        let tx: WalletTransaction | null = null;
        let isLocal = false;

        try {
            const { data, error } = await supabase.from('wallet_transactions').select('*').eq('id', txId).single();
            if (data) {
                 tx = {
                    id: data.id,
                    userId: data.user_id,
                    type: data.type,
                    title: data.title,
                    amount: data.amount,
                    balanceAfter: data.balance_after,
                    status: data.status,
                    timestamp: data.timestamp
                };
            } else {
                // If data is null (even if no error), treat as not found in DB
                throw new Error('Not found in DB');
            }
        } catch (e) {
            console.warn('Transaction not found in DB, checking local backup...');
            isLocal = true;
            const list = JSON.parse(localStorage.getItem('global_pending_recharges_backup') || '[]');
            tx = list.find((t: any) => t.id === txId);
        }

        if (!tx) {
            console.error('Transaction not found anywhere:', txId);
            return;
        }

        if (status === 'SUCCESS') {
            // 1. Update User Balance
            // We need to fetch the user's current balance first
            let currentBalance = 0;
            
            // Try DB User fetch only if not strictly local mode
            if (!isLocal) {
                try {
                    const { data } = await supabase.from('users').select('balance').eq('id', tx.userId).single();
                    currentBalance = data?.balance || 0;
                } catch (e) {
                    // DB user fetch failed
                }
            }

            // Fallback: read from local user if ID matches (imperfect but works for demo)
            const u = JSON.parse(localStorage.getItem('cityinfo_user') || '{}');
            if (u.id === tx.userId) {
                // Use local balance if DB fetch was skipped or failed
                if (currentBalance === 0 && u.balance) currentBalance = u.balance;
            }

            const newBalance = currentBalance + tx.amount;

            // Update User Balance in DB (Skip if local mode)
            if (!isLocal) {
                try {
                    await supabase.from('users').update({ balance: newBalance }).eq('id', tx.userId);
                } catch (e) {}
            }

            // Update Transaction in DB (Skip if local mode)
            if (!isLocal) {
                try {
                    await supabase.from('wallet_transactions').update({ status: 'SUCCESS', balance_after: newBalance }).eq('id', txId);
                } catch (e) {}
            }

            // --- Local Fallback Updates ---
            // If the user being updated is the current logged-in user (simulated), update local storage
            if (u.id === tx.userId) {
                u.balance = newBalance;
                localStorage.setItem('cityinfo_user', JSON.stringify(u));
            }
        } else {
            // Reject
            if (!isLocal) {
                try {
                    await supabase.from('wallet_transactions').update({ status: 'FAILED' }).eq('id', txId);
                } catch (e) {}
            }
        }

        // Update Global Pending List (Remove from pending fallback list)
        // Always do this to ensure local view updates
        let list = JSON.parse(localStorage.getItem('global_pending_recharges_backup') || '[]');
        list = list.filter((t: any) => t.id !== txId);
        localStorage.setItem('global_pending_recharges_backup', JSON.stringify(list));
        
        // Also update the specific user's transaction history in localStorage if it exists there
        const userTxKey = `wallet_tx_${tx.userId}`;
        let userTxList = JSON.parse(localStorage.getItem(userTxKey) || '[]');
        const targetIndex = userTxList.findIndex((t: any) => t.id === txId);
        if (targetIndex !== -1) {
            userTxList[targetIndex].status = status;
            if (status === 'SUCCESS') {
                // Approximate new balance update in history
                userTxList[targetIndex].balanceAfter = (userTxList[targetIndex].balanceAfter || 0) + tx.amount; 
            }
            localStorage.setItem(userTxKey, JSON.stringify(userTxList));
        }
    },

    // --- Withdrawals ---
    getWithdrawals: async (): Promise<WithdrawalRequest[]> => {
        try {
            const { data, error } = await supabase
                .from('withdrawals')
                .select('*')
                .order('timestamp', { ascending: false });
            
            if (error) throw error;
            
            return data.map((row: any) => ({
                 id: row.id,
                 userId: row.user_id,
                 userNickname: row.user_nickname,
                 amount: row.amount,
                 method: row.method,
                 account: row.account,
                 realName: row.real_name,
                 bankName: row.bank_name,
                 status: row.status,
                 timestamp: row.timestamp
            }));
        } catch (error: any) {
             console.warn('Fetching withdrawals from DB failed, using LocalStorage fallback.', error.code);
             const localData = localStorage.getItem('cityinfo_withdrawals_backup');
             return localData ? JSON.parse(localData) : [];
        }
    },

    createWithdrawal: async (req: WithdrawalRequest, currentBalance: number): Promise<void> => {
        // 1. Create Withdrawal Request
        const row = {
            id: req.id,
            user_id: req.userId,
            user_nickname: req.userNickname,
            amount: req.amount,
            method: req.method,
            account: req.account,
            real_name: req.realName,
            bank_name: req.bankName,
            status: req.status,
            timestamp: req.timestamp
        };

        try {
            const { error } = await supabase.from('withdrawals').insert(row);
            
            if (error) {
                if (error.code === 'PGRST205' || error.code === '42501' || error.message.includes('fetch')) {
                    throw error;
                }
                throw new Error(error.message);
            }
        } catch (error: any) {
            console.warn(`⚠️ Withdrawal DB insert failed, saving to LocalStorage.`);
            const localDataStr = localStorage.getItem('cityinfo_withdrawals_backup');
            const localData: WithdrawalRequest[] = localDataStr ? JSON.parse(localDataStr) : [];
            localData.unshift(req);
            localStorage.setItem('cityinfo_withdrawals_backup', JSON.stringify(localData));
        }

        // 2. Create Transaction Record (Deduct Balance immediately as Pending)
        const tx: WalletTransaction = {
            id: `tx_${req.id}`,
            userId: req.userId,
            type: 'WITHDRAW',
            title: '余额提现申请',
            amount: -req.amount,
            balanceAfter: currentBalance - req.amount,
            status: 'PENDING',
            timestamp: Date.now()
        };
        await api.createTransaction(tx);
    },

    updateWithdrawalStatus: async (id: string, status: 'COMPLETED' | 'REJECTED'): Promise<void> => {
        try {
            const { error } = await supabase
                .from('withdrawals')
                .update({ status: status })
                .eq('id', id);
            
            if (error) throw error;

            // Also update the related transaction status
            await supabase
                .from('wallet_transactions')
                .update({ status: status === 'COMPLETED' ? 'SUCCESS' : 'FAILED' })
                .eq('id', `tx_${id}`);

        } catch (error: any) {
            console.warn(`Update withdrawal status failed, updating local fallback.`);
            
            const localDataStr = localStorage.getItem('cityinfo_withdrawals_backup');
            if (localDataStr) {
                const localData: WithdrawalRequest[] = JSON.parse(localDataStr);
                const index = localData.findIndex(w => w.id === id);
                if (index !== -1) {
                    localData[index].status = status;
                    localStorage.setItem('cityinfo_withdrawals_backup', JSON.stringify(localData));
                }
            }
        }
    },

    // --- Posts ---
    getPosts: async (): Promise<Post[]> => {
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('publish_time', { ascending: false });
            
            if (error) throw error;
            if (!data || data.length === 0) return MOCK_POSTS;

            return data.map((row: any) => ({
                id: row.id,
                title: row.title,
                description: row.description,
                category: row.category,
                price: row.price,
                images: row.images || [],
                tags: row.tags || [],
                location: row.location,
                lat: row.lat,
                lng: row.lng,
                distance: row.distance,
                contactPhone: row.contact_phone,
                publishTime: row.publish_time,
                viewCount: row.view_count,
                isSticky: row.is_sticky,
                merchantId: row.merchant_id,
                authorName: row.author_name,
                avatarUrl: row.avatar_url,
                attributes: row.attributes || []
            }));
        } catch (error) {
            console.warn('Error fetching posts, using mocks.');
            return MOCK_POSTS; 
        }
    },

    createPost: async (post: Post): Promise<void> => {
        const row = {
            id: post.id,
            title: post.title,
            description: post.description,
            category: post.category,
            price: post.price,
            images: post.images,
            tags: post.tags,
            location: post.location,
            lat: post.lat,
            lng: post.lng,
            distance: post.distance,
            contact_phone: post.contactPhone,
            publish_time: post.publishTime,
            view_count: post.viewCount,
            is_sticky: post.isSticky,
            merchant_id: post.merchantId,
            author_name: post.authorName,
            avatar_url: post.avatarUrl,
            attributes: post.attributes
        };

        try {
            const { error } = await supabase.from('posts').insert(row);
            if (error) console.warn("Post DB insert failed");
        } catch (error) {
            console.error('Error creating post:', error);
        }
    },

    // --- Users ---
    loginOrRegister: async (phone: string, mockUser: User): Promise<User> => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('phone', phone)
                .single();

            if (data) {
                return {
                    id: data.id,
                    phone: data.phone,
                    nickname: data.nickname,
                    avatarUrl: data.avatar_url,
                    isVerified: data.is_verified,
                    registerTime: data.register_time,
                    isAdmin: data.is_admin,
                    realName: data.real_name,
                    qq: data.qq,
                    wechat: data.wechat,
                    address: data.address,
                    balance: data.balance || 0
                };
            }

            // Register
            const row = {
                id: mockUser.id,
                phone: mockUser.phone,
                nickname: mockUser.nickname,
                avatar_url: mockUser.avatarUrl,
                is_verified: mockUser.isVerified,
                register_time: mockUser.registerTime,
                is_admin: mockUser.isAdmin,
                real_name: mockUser.realName,
                qq: mockUser.qq,
                wechat: mockUser.wechat,
                address: mockUser.address,
                balance: 0
            };

            const { error: insertError } = await supabase.from('users').insert(row);
            if (insertError) throw insertError;
            
            return { ...mockUser, balance: 0 };
        } catch (error: any) {
            console.warn('Login/Register DB fallback:', error.message);
            return mockUser; 
        }
    },

    updateUser: async (user: User): Promise<void> => {
        const row = {
            nickname: user.nickname,
            avatar_url: user.avatarUrl,
            real_name: user.realName,
            qq: user.qq,
            wechat: user.wechat,
            address: user.address,
            balance: user.balance // Persist balance
        };
        try {
            await supabase.from('users').update(row).eq('id', user.id);
        } catch(e) {
             console.warn('User update local only');
        }
    },

    // --- Messages ---
    getMessages: async (): Promise<any[]> => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .order('timestamp', { ascending: true });
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            return [];
        }
    },

    saveMessage: async (msg: ChatMessage, userId: string): Promise<void> => {
        const row = {
            id: msg.id,
            user_id: userId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
        };
        try {
            await supabase.from('messages').insert(row);
        } catch (e) { console.warn('Message saved local only'); }
    }
};