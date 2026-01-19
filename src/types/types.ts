// User and Profile Types
export type UserRole = 'user' | 'admin';
export type KycStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  balance: number;
  total_earnings: number;
  withdrawable_balance: number;
  referral_code: string;
  referred_by: string | null;
  kyc_status: KycStatus | null;
  status: 'active' | 'blocked';
  withdrawal_blocked: boolean;
  created_at: string;
  updated_at: string;
}

// Product Types
export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  daily_earning: number;
  contract_days: number;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface VipProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  earnings: number;
  image_url: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface VipProductPurchase {
  id: string;
  user_id: string;
  vip_product_id: string;
  product_name: string;
  price_paid: number;
  earnings_received: number;
  created_at: string;
}

export interface UserProduct {
  id: string;
  user_id: string;
  product_id: string;
  purchase_price: number;
  daily_earning: number;
  contract_days: number;
  days_remaining: number;
  total_earned: number;
  is_active: boolean;
  purchased_at: string;
  expires_at: string;
  last_earning_date: string | null;
  product?: Product;
  user?: Profile;
}

// Transaction Types
export type TransactionType = 'recharge' | 'withdrawal' | 'purchase' | 'earning' | 'referral' | 'lucky_draw';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
  user?: Profile;
}

// Request Types
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface RechargeRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_screenshot_url: string;
  transaction_id: string | null;
  status: RequestStatus;
  admin_note: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  user?: Profile;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  bank_details: string;
  status: RequestStatus;
  admin_note: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  user?: Profile;
}

// Earnings Types
export interface DailyEarning {
  id: string;
  user_id: string;
  user_product_id: string;
  amount: number;
  earning_date: string;
  created_at: string;
}

// Referral Types
export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  commission_earned: number;
  created_at: string;
  referrer?: Profile;
  referred_user?: Profile;
}

// Lucky Draw Types
export interface LuckyDrawConfig {
  id: string;
  reward_name: string;
  reward_amount: number;
  probability: number;
  is_active: boolean;
  created_at: string;
}

export interface LuckyDrawHistory {
  id: string;
  user_id: string;
  reward_name: string;
  reward_amount: number;
  spin_date: string;
  created_at: string;
}

// KYC Types
export interface KycSubmission {
  id: string;
  user_id: string;
  id_front_url: string;
  id_back_url: string;
  bank_name: string;
  account_number: string;
  account_holder_name: string;
  ifsc_code: string;
  upi_id: string | null;
  status: KycStatus;
  admin_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  user?: Profile;
}

// Company Settings Types
export interface CompanySetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

// Form Types
export interface LoginFormData {
  username: string;
  password: string;
}

export interface SignupFormData {
  username: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
}

export interface RechargeFormData {
  amount: number;
  paymentScreenshot: File | null;
}

export interface WithdrawalFormData {
  amount: number;
  bankDetails: string;
}

export interface KycFormData {
  idFront: File | null;
  idBack: File | null;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  image: File | null;
  price: number;
  daily_earning: number;
  contract_days: number;
  status: ProductStatus;
}

// Notification Types
export type NotificationType = 'general' | 'important';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  notification?: Notification;
}

export interface NotificationWithReadStatus extends Notification {
  is_read: boolean;
  read_at: string | null;
}
