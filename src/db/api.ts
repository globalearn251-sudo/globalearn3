import { supabase } from './supabase';
import type {
  Profile,
  Product,
  VipProduct,
  VipProductPurchase,
  UserProduct,
  Transaction,
  RechargeRequest,
  WithdrawalRequest,
  DailyEarning,
  Referral,
  LuckyDrawConfig,
  LuckyDrawHistory,
  KycSubmission,
  CompanySetting,
  Notification,
  NotificationWithReadStatus,
  NotificationType,
} from '@/types/types';

// Profile API
export const profileApi = {
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) throw error;
    return data as Profile | null;
  },

  updateProfile: async (userId: string, updates: Partial<Profile>) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as Profile;
  },

  getAllUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as Profile[];
  },

  getProfileByReferralCode: async (referralCode: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, referral_code')
      .eq('referral_code', referralCode)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Admin function to update user role
  updateUserRole: async (userId: string, role: 'user' | 'admin') => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as Profile;
  },

  // Admin function to block/unblock user
  updateUserStatus: async (userId: string, status: 'active' | 'blocked') => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status })
      .eq('id', userId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as Profile;
  },

  // Admin function to delete user
  deleteUser: async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (error) throw error;
  },

  // Admin function to toggle withdrawal block
  toggleWithdrawalBlock: async (userId: string, blocked: boolean) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({ withdrawal_blocked: blocked })
      .eq('id', userId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as Profile;
  },

  // Admin function to add balance to user wallet
  addBalanceToUser: async (userId: string, amount: number, adminId: string, note?: string) => {
    const { data, error } = await supabase.rpc('admin_add_balance_to_user', {
      p_user_id: userId,
      p_amount: amount,
      p_admin_id: adminId,
      p_note: note || null
    });

    if (error) throw error;
    return data;
  },
};

// Product API
export const productApi = {
  getAllProducts: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as Product[];
  },

  getAllProductsAdmin: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as Product[];
  },

  getProduct: async (productId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .maybeSingle();
    
    if (error) throw error;
    return data as Product | null;
  },

  createProduct: async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as Product;
  },

  updateProduct: async (productId: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as Product;
  },

  deleteProduct: async (productId: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);
    
    if (error) throw error;
  },

  purchaseProduct: async (userId: string, productId: string) => {
    const { data, error } = await supabase.rpc('purchase_product', {
      p_user_id: userId,
      p_product_id: productId,
    });
    
    if (error) throw error;
    return data;
  },
};

// User Product API
export const userProductApi = {
  getUserProducts: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_products')
      .select('*, product:products(*)')
      .eq('user_id', userId)
      .order('purchased_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as UserProduct[];
  },

  getActiveUserProducts: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_products')
      .select('*, product:products(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('purchased_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as UserProduct[];
  },

  getAllUserProducts: async () => {
    const { data, error } = await supabase
      .from('user_products')
      .select('*, product:products(*), user:profiles!user_products_user_id_fkey(id, username, email)')
      .order('purchased_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as UserProduct[];
  },
};

// Transaction API
export const transactionApi = {
  getUserTransactions: async (userId: string, limit = 50) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as Transaction[];
  },

  getAllTransactions: async (limit = 100) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as Transaction[];
  },

  getAllTransactionsWithUsers: async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, user:profiles!transactions_user_id_fkey(id, username, email)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as Transaction[];
  },

  getUserTransactionsWithBalance: async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as Transaction[];
  },
};

// Recharge Request API
export const rechargeApi = {
  createRechargeRequest: async (userId: string, amount: number, screenshotUrl: string, transactionId?: string) => {
    const { data, error } = await supabase
      .from('recharge_requests')
      .insert({
        user_id: userId,
        amount,
        payment_screenshot_url: screenshotUrl,
        transaction_id: transactionId || null,
      })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as RechargeRequest;
  },

  getUserRechargeRequests: async (userId: string) => {
    const { data, error } = await supabase
      .from('recharge_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as RechargeRequest[];
  },

  getAllRechargeRequests: async () => {
    const { data, error } = await supabase
      .from('recharge_requests')
      .select('*, user:profiles!recharge_requests_user_id_fkey(username, email)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as RechargeRequest[];
  },

  getPendingRechargeRequests: async () => {
    const { data, error } = await supabase
      .from('recharge_requests')
      .select('*, user:profiles!recharge_requests_user_id_fkey(username, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as RechargeRequest[];
  },

  approveRechargeRequest: async (requestId: string, adminId: string, adminNote?: string) => {
    const { data, error } = await supabase.rpc('approve_recharge_request', {
      p_request_id: requestId,
      p_admin_id: adminId,
      p_admin_note: adminNote || null,
    });
    
    if (error) throw error;
    return data;
  },

  rejectRechargeRequest: async (requestId: string, adminId: string, adminNote: string) => {
    const { data, error } = await supabase.rpc('reject_recharge_request', {
      p_request_id: requestId,
      p_admin_id: adminId,
      p_admin_note: adminNote,
    });
    
    if (error) throw error;
    return data;
  },
};

// Withdrawal Request API
export const withdrawalApi = {
  createWithdrawalRequest: async (userId: string, amount: number, bankDetails: string) => {
    const { data, error } = await supabase.rpc('create_withdrawal_request_with_deduction', {
      p_user_id: userId,
      p_amount: amount,
      p_bank_details: bankDetails,
    });
    
    if (error) throw error;
    return data as WithdrawalRequest;
  },

  getUserWithdrawalRequests: async (userId: string) => {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as WithdrawalRequest[];
  },

  getAllWithdrawalRequests: async () => {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*, user:profiles!withdrawal_requests_user_id_fkey(username, email)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as WithdrawalRequest[];
  },

  getPendingWithdrawalRequests: async () => {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*, user:profiles!withdrawal_requests_user_id_fkey(username, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as WithdrawalRequest[];
  },

  approveWithdrawalRequest: async (requestId: string, adminId: string, adminNote?: string) => {
    const { data, error } = await supabase.rpc('approve_withdrawal_request', {
      p_request_id: requestId,
      p_admin_id: adminId,
      p_admin_note: adminNote || null,
    });
    
    if (error) throw error;
    return data;
  },

  rejectWithdrawalRequest: async (requestId: string, adminId: string, adminNote: string) => {
    const { data, error } = await supabase.rpc('reject_withdrawal_request', {
      p_request_id: requestId,
      p_admin_id: adminId,
      p_admin_note: adminNote,
    });
    
    if (error) throw error;
    return data;
  },
};

// Daily Earnings API
export const earningsApi = {
  getUserEarnings: async (userId: string, limit = 30) => {
    const { data, error } = await supabase
      .from('daily_earnings')
      .select('*')
      .eq('user_id', userId)
      .order('earning_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as DailyEarning[];
  },
};

// Referral API
export const referralApi = {
  getUserReferrals: async (userId: string) => {
    const { data, error } = await supabase
      .from('referrals')
      .select('*, referred_user:profiles!referrals_referred_id_fkey(id, username, created_at)')
      .eq('referrer_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as Referral[];
  },

  getReferralStats: async (userId: string) => {
    const { data, error } = await supabase
      .from('referrals')
      .select('commission_earned')
      .eq('referrer_id', userId);
    
    if (error) throw error;
    const referrals = Array.isArray(data) ? data : [];
    const totalCommission = referrals.reduce((sum, r) => sum + Number(r.commission_earned), 0);
    return {
      totalReferrals: referrals.length,
      totalCommission,
    };
  },

  getAllReferrals: async () => {
    const { data, error } = await supabase
      .from('referrals')
      .select('*, referrer:profiles!referrals_referrer_id_fkey(id, username, email), referred_user:profiles!referrals_referred_id_fkey(id, username, email, created_at)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as Referral[];
  },
};

// Lucky Draw API
export const luckyDrawApi = {
  getActiveRewards: async () => {
    const { data, error } = await supabase
      .from('lucky_draw_config')
      .select('*')
      .eq('is_active', true)
      .order('probability', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as LuckyDrawConfig[];
  },

  getAllRewards: async () => {
    const { data, error } = await supabase
      .from('lucky_draw_config')
      .select('*')
      .order('reward_amount', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as LuckyDrawConfig[];
  },

  canSpinToday: async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('lucky_draw_history')
      .select('id')
      .eq('user_id', userId)
      .eq('spin_date', today)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !data;
  },

  spin: async (userId: string) => {
    const { data, error } = await supabase.rpc('spin_lucky_draw', {
      p_user_id: userId,
    });
    
    if (error) throw error;
    return data;
  },

  getUserHistory: async (userId: string, limit = 20) => {
    const { data, error } = await supabase
      .from('lucky_draw_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as LuckyDrawHistory[];
  },

  updateReward: async (rewardId: string, updates: Partial<LuckyDrawConfig>) => {
    const { data, error } = await supabase
      .from('lucky_draw_config')
      .update(updates)
      .eq('id', rewardId)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as LuckyDrawConfig;
  },

  createReward: async (reward: Omit<LuckyDrawConfig, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('lucky_draw_config')
      .insert(reward)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as LuckyDrawConfig;
  },
};

// KYC API
export const kycApi = {
  submitKyc: async (
    userId: string,
    idFrontUrl: string,
    idBackUrl: string,
    bankName: string,
    accountNumber: string,
    accountHolderName: string,
    ifscCode: string,
    upiId?: string
  ) => {
    const { data, error } = await supabase
      .from('kyc_submissions')
      .insert({
        user_id: userId,
        id_front_url: idFrontUrl,
        id_back_url: idBackUrl,
        bank_name: bankName,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        ifsc_code: ifscCode,
        upi_id: upiId || null,
      })
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as KycSubmission;
  },

  getUserKyc: async (userId: string) => {
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as KycSubmission | null;
  },

  getAllKycSubmissions: async () => {
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select('*, user:profiles!kyc_submissions_user_id_fkey(username, email)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as KycSubmission[];
  },

  getPendingKycSubmissions: async () => {
    const { data, error } = await supabase
      .from('kyc_submissions')
      .select('*, user:profiles!kyc_submissions_user_id_fkey(username, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as KycSubmission[];
  },

  approveKyc: async (submissionId: string, adminId: string, adminNote?: string) => {
    const { data, error } = await supabase.rpc('approve_kyc_submission', {
      p_submission_id: submissionId,
      p_admin_id: adminId,
      p_admin_note: adminNote || null,
    });
    
    if (error) throw error;
    return data;
  },

  rejectKyc: async (submissionId: string, adminId: string, adminNote: string) => {
    const { data, error } = await supabase.rpc('reject_kyc_submission', {
      p_submission_id: submissionId,
      p_admin_id: adminId,
      p_admin_note: adminNote,
    });
    
    if (error) throw error;
    return data;
  },

  // Alias functions for admin pages
  approveKycSubmission: async (submissionId: string, adminNote?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return kycApi.approveKyc(submissionId, user.id, adminNote);
  },

  rejectKycSubmission: async (submissionId: string, adminNote: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return kycApi.rejectKyc(submissionId, user.id, adminNote);
  },
};

// Company Settings API
export const companyApi = {
  getSetting: async (key: string) => {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('key', key)
      .maybeSingle();
    
    if (error) throw error;
    return data as CompanySetting | null;
  },

  getAllSettings: async () => {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*');
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as CompanySetting[];
  },

  updateSetting: async (key: string, value: string) => {
    const { data, error } = await supabase
      .from('company_settings')
      .upsert(
        { key, value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      )
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as CompanySetting;
  },
};

// Storage API
export const storageApi = {
  uploadImage: async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('app_8ildgs548gzl_investment_images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) throw error;
    
    const { data: urlData } = supabase.storage
      .from('app_8ildgs548gzl_investment_images')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  },

  deleteImage: async (path: string) => {
    const { error } = await supabase.storage
      .from('app_8ildgs548gzl_investment_images')
      .remove([path]);
    
    if (error) throw error;
  },
};

// Admin wrapper functions that auto-inject adminId
export const adminRechargeApi = {
  approve: async (requestId: string, adminNote?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return rechargeApi.approveRechargeRequest(requestId, user.id, adminNote);
  },
  reject: async (requestId: string, adminNote: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return rechargeApi.rejectRechargeRequest(requestId, user.id, adminNote);
  },
};

export const adminWithdrawalApi = {
  approve: async (requestId: string, adminNote?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return withdrawalApi.approveWithdrawalRequest(requestId, user.id, adminNote);
  },
  reject: async (requestId: string, adminNote: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    return withdrawalApi.rejectWithdrawalRequest(requestId, user.id, adminNote);
  },
};

// Add delete function for Lucky Draw
export const adminLuckyDrawApi = {
  deleteReward: async (rewardId: string) => {
    const { error } = await supabase
      .from('lucky_draw_config')
      .delete()
      .eq('id', rewardId);
    
    if (error) throw error;
  },
};

// Notification API
export const notificationApi = {
  // Get all notifications for current user with read status
  getUserNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        user_notifications!left(is_read, read_at)
      `)
      .eq('is_active', true)
      .eq('user_notifications.user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Transform the data to flatten the structure
    const notifications = (data || []).map((notif: any) => ({
      ...notif,
      is_read: notif.user_notifications?.[0]?.is_read || false,
      read_at: notif.user_notifications?.[0]?.read_at || null,
      user_notifications: undefined,
    }));
    
    return notifications as NotificationWithReadStatus[];
  },

  // Get important notifications only
  getImportantNotifications: async (userId: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        user_notifications!left(is_read, read_at)
      `)
      .eq('is_active', true)
      .eq('type', 'important')
      .eq('user_notifications.user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const notifications = (data || []).map((notif: any) => ({
      ...notif,
      is_read: notif.user_notifications?.[0]?.is_read || false,
      read_at: notif.user_notifications?.[0]?.read_at || null,
      user_notifications: undefined,
    }));
    
    return notifications as NotificationWithReadStatus[];
  },

  // Get unread notification count
  getUnreadCount: async (userId: string) => {
    const { data, error } = await supabase.rpc('get_unread_notification_count', {
      p_user_id: userId,
    });
    
    if (error) throw error;
    return data as number;
  },

  // Mark notification as read
  markAsRead: async (userId: string, notificationId: string) => {
    const { error } = await supabase.rpc('mark_notification_as_read', {
      p_user_id: userId,
      p_notification_id: notificationId,
    });
    
    if (error) throw error;
  },

  // Mark all notifications as read
  markAllAsRead: async (userId: string) => {
    const notifications = await notificationApi.getUserNotifications(userId);
    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    await Promise.all(
      unreadNotifications.map(n => notificationApi.markAsRead(userId, n.id))
    );
  },
};

// Admin Notification API
export const adminNotificationApi = {
  // Get all notifications (admin view)
  getAllNotifications: async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as Notification[];
  },

  // Create notification for all users
  createNotification: async (
    title: string,
    message: string,
    type: NotificationType,
    createdBy: string
  ) => {
    const { data, error } = await supabase.rpc('create_notification_for_all_users', {
      p_title: title,
      p_message: message,
      p_type: type,
      p_created_by: createdBy,
    });
    
    if (error) throw error;
    return data;
  },

  // Update notification
  updateNotification: async (
    notificationId: string,
    updates: Partial<Notification>
  ) => {
    const { data, error } = await supabase
      .from('notifications')
      .update(updates)
      .eq('id', notificationId)
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  },

  // Delete notification (set inactive)
  deleteNotification: async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_active: false })
      .eq('id', notificationId);
    
    if (error) throw error;
  },

  // Get notification statistics
  getNotificationStats: async (notificationId: string) => {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('is_read')
      .eq('notification_id', notificationId);
    
    if (error) throw error;
    
    const total = data?.length || 0;
    const read = data?.filter(n => n.is_read).length || 0;
    const unread = total - read;
    
    return { total, read, unread };
  },
};

// Daily Earnings API
export const dailyEarningsApi = {
  // Trigger daily earnings calculation via edge function
  calculateDailyEarnings: async () => {
    const { data, error } = await supabase.functions.invoke('daily-earnings', {
      body: {},
    });
    
    if (error) {
      const errorMsg = await error?.context?.text();
      console.error('Edge function error in daily-earnings:', errorMsg || error?.message);
      throw new Error(errorMsg || error?.message || 'Failed to calculate daily earnings');
    }
    
    return data;
  },

  // Get user's daily earnings history
  getUserDailyEarnings: async (userId: string) => {
    const { data, error } = await supabase
      .from('daily_earnings')
      .select(`
        *,
        user_products:user_product_id (
          id,
          product_id,
          products:product_id (
            name,
            image_url
          )
        )
      `)
      .eq('user_id', userId)
      .order('earning_date', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as DailyEarning[];
  },

  // Get total earnings for a user
  getTotalEarnings: async (userId: string) => {
    const { data, error } = await supabase
      .from('daily_earnings')
      .select('amount')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const total = (Array.isArray(data) ? data : []).reduce((sum, earning) => sum + Number(earning.amount), 0);
    return total;
  },
};

// VIP Product API
export const vipProductApi = {
  // Get all active VIP products
  getAllVipProducts: async () => {
    const { data, error } = await supabase
      .from('vip_products')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as VipProduct[];
  },

  // Get all VIP products (admin)
  getAllVipProductsAdmin: async () => {
    const { data, error } = await supabase
      .from('vip_products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as VipProduct[];
  },

  // Get single VIP product
  getVipProduct: async (id: string) => {
    const { data, error } = await supabase
      .from('vip_products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (error) throw error;
    return data as VipProduct | null;
  },

  // Create VIP product (admin)
  createVipProduct: async (product: Omit<VipProduct, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('vip_products')
      .insert(product)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as VipProduct;
  },

  // Update VIP product (admin)
  updateVipProduct: async (id: string, updates: Partial<VipProduct>) => {
    const { data, error } = await supabase
      .from('vip_products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data as VipProduct;
  },

  // Delete VIP product (admin)
  deleteVipProduct: async (id: string) => {
    const { error } = await supabase
      .from('vip_products')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Purchase VIP product
  purchaseVipProduct: async (userId: string, vipProductId: string) => {
    const { data, error } = await supabase.rpc('purchase_vip_product', {
      p_user_id: userId,
      p_vip_product_id: vipProductId,
    });
    
    if (error) throw error;
    return data;
  },

  // Get user's VIP product purchases
  getUserVipPurchases: async (userId: string) => {
    const { data, error } = await supabase
      .from('vip_product_purchases')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as VipProductPurchase[];
  },

  // Get all VIP product purchases (admin)
  getAllVipPurchases: async () => {
    const { data, error } = await supabase
      .from('vip_product_purchases')
      .select('*, user:profiles!vip_product_purchases_user_id_fkey(username, email)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (Array.isArray(data) ? data : []) as VipProductPurchase[];
  },
};
