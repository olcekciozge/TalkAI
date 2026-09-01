import Purchases, { type PurchasesOffering } from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;
const PREMIUM_ENTITLEMENT_ID = 'premium';

export function initPurchases() {
    if (!REVENUECAT_API_KEY) {
        console.error(
            'EXPO_PUBLIC_REVENUECAT_API_KEY is not defined - add your Test Store API key to your .env file.'
        );
        return;
    }
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
}

export async function isPremiumUser(): Promise<boolean> {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== 'undefined';
    } catch (err) {
        console.error('isPremiumUser error:', err);
        return false;
    }
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
    try {
        const offerings = await Purchases.getOfferings();
        return offerings.current;
    } catch (err) {
        console.error('getCurrentOffering error:', err);
        return null;
    }
}

export async function purchasePremium(): Promise<boolean> {
    try {
        const offering = await getCurrentOffering();
        if (!offering || offering.availablePackages.length === 0) {
            console.error(
                'No packages found - check whether a product has been added to the Offering in the RevenueCat dashboard.'
            );
            return false;
        }

        const { customerInfo } = await Purchases.purchasePackage(offering.availablePackages[0]);
        return typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== 'undefined';
    } catch (err: any) {
        if (err.userCancelled) {
            console.log('User cancelled the purchase.');
        } else {
            console.error('purchasePremium error:', err);
        }
        return false;
    }
}

export async function restorePurchases(): Promise<boolean> {
    try {
        const customerInfo = await Purchases.restorePurchases();
        return typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== 'undefined';
    } catch (err) {
        console.error('restorePurchases error:', err);
        return false;
    }
}

export async function identifyPurchasesUser(userId: string): Promise<void> {
    try {
        await Purchases.logIn(userId);
    } catch (err) {
        console.error('identifyPurchasesUser error:', err);
    }
}

export async function resetPurchasesUser(): Promise<void> {
    try {
        await Purchases.logOut();
    } catch (err) {
        console.error('resetPurchasesUser error:', err);
    }
}