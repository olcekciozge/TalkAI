import Purchases, { type PurchasesOffering } from 'react-native-purchases';

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY;

// RevenueCat panelinde olusturdugun entitlement'in tam adi.
// Panelde "premium" oldugunu soylemistin, o yuzden burada sabit tutuyoruz.
const PREMIUM_ENTITLEMENT_ID = 'premium';

// Uygulama acilirken BIR KERE cagrilmasi gereken fonksiyon.
// SDK'yi Test Store API key'i ile baslatir.
export function initPurchases() {
    if (!REVENUECAT_API_KEY) {
        console.error(
            'EXPO_PUBLIC_REVENUECAT_API_KEY tanimli degil - .env dosyana Test Store API key\'ini eklemen lazim.'
        );
        return;
    }
    Purchases.configure({ apiKey: REVENUECAT_API_KEY });
}

// Kodun her yerinde soracagimiz asil soru: "bu kullanicinin premium'u aktif mi?"
// Hangi urunun satildigiyla degil, sadece bu etiketle ilgileniyoruz.
export async function isPremiumUser(): Promise<boolean> {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== 'undefined';
    } catch (err) {
        console.error('isPremiumUser error:', err);
        return false;
    }
}

// RevenueCat panelindeki "default" offering'i ceker (icinde premium_monthly var).
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
    try {
        const offerings = await Purchases.getOfferings();
        return offerings.current;
    } catch (err) {
        console.error('getCurrentOffering error:', err);
        return null;
    }
}

// Test Store uzerinden bir satin alma baslatir. Test Store bir dialog
// gosterecek: basarili / basarisiz / iptal - hangisini secersen o sonuc doner.
// Basarili donerse entitlement da aninda aktif olur.
export async function purchasePremium(): Promise<boolean> {
    try {
        const offering = await getCurrentOffering();
        if (!offering || offering.availablePackages.length === 0) {
            console.error(
                'Hicbir paket bulunamadi - RevenueCat panelinde Offering\'e urun eklenmis mi kontrol et.'
            );
            return false;
        }

        // MVP icin tek bir paket (premium_monthly) bekliyoruz, ilkini kullaniyoruz.
        const { customerInfo } = await Purchases.purchasePackage(offering.availablePackages[0]);
        return typeof customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== 'undefined';
    } catch (err: any) {
        if (err.userCancelled) {
            console.log('Kullanici satin almayi iptal etti.');
        } else {
            console.error('purchasePremium error:', err);
        }
        return false;
    }
}