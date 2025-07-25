import { apiRequest } from '@/config/api';

interface RedeemedCoupon {
  code: string;
  balance: number;
  created_at: string;
}

interface RedeemCouponResponse {
  success: boolean;
  message: string;
  value: number;
  new_balance: number;
}

interface Referral {
  promoter_card_code: string;
  promoter_user: {
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface ReferralResponse {
  referral: Referral | null;
}

interface RegisterReferralResponse {
  success: boolean;
  message: string;
  reward_amount: number;
}

// Obtener cupones redimidos por el usuario
export const getRedeemedCoupons = async (): Promise<{ success: boolean; data?: RedeemedCoupon[]; error?: string }> => {
  try {
    const response = await apiRequest('/cupones/redeemed');
    return {
      success: true,
      data: response.redeemed_coupons || []
    };
  } catch (error) {
    console.error('Error getting redeemed coupons:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener cupones redimidos'
    };
  }
};

// Redimir cupón
export const redeemCoupon = async (code: string): Promise<{ success: boolean; data?: RedeemCouponResponse; error?: string }> => {
  try {
    const response = await apiRequest('/cupones/redeem', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error redeeming coupon:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al redimir cupón'
    };
  }
};

// Obtener información del referido del usuario
export const getReferralInfo = async (): Promise<{ success: boolean; data?: ReferralResponse; error?: string }> => {
  try {
    const response = await apiRequest('/cupones/referral');
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error getting referral info:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener información de referido'
    };
  }
};

// Registrar código de referido
export const registerReferral = async (code: string): Promise<{ success: boolean; data?: RegisterReferralResponse; error?: string }> => {
  try {
    const response = await apiRequest('/cupones/register-referral', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    return {
      success: true,
      data: response
    };
  } catch (error) {
    console.error('Error registering referral:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al registrar referido'
    };
  }
};
