import { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SCENARIOS } from '@/constants/scenarios';
import { SCENARIO_STYLE, COLORS } from '@/constants/scenarioStyles';
import { isPremiumUser, purchasePremium } from '@/lib/purchases';

export default function HomeScreen() {
  const router = useRouter();

  // GUN 11: GECICI test bolumu - RevenueCat entitlement/purchase akisini
  // dogrulamak icin. Gun 12'de gercek Superwall paywall'i gelince bu
  // bolum tamamen kaldirilacak, sadece test amacli burada.
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  async function handleCheckStatus() {
    setCheckingStatus(true);
    const premium = await isPremiumUser();
    setCheckingStatus(false);
    Alert.alert('Entitlement durumu', premium ? 'Premium AKTIF ✅' : 'Premium aktif degil ❌');
  }

  async function handleTestPurchase() {
    setPurchasing(true);
    const success = await purchasePremium();
    setPurchasing(false);
    Alert.alert(
        'Test satin alma sonucu',
        success ? 'Basarili! Entitlement aktif oldu ✅' : 'Basarisiz oldu ya da iptal edildi ❌'
    );
  }

  return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Practice today</Text>
          <Text style={styles.subtitle}>Pick a real-life moment and speak it out loud</Text>
        </View>

        {/* GUN 11 GECICI TEST BOLUMU - Gun 12'de kaldirilacak */}
        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>🧪 RevenueCat Test (geçici)</Text>
          <View style={styles.debugRow}>
            <Pressable style={styles.debugButton} onPress={handleCheckStatus} disabled={checkingStatus}>
              <Text style={styles.debugButtonText}>
                {checkingStatus ? 'Kontrol ediliyor...' : 'Entitlement Durumu'}
              </Text>
            </Pressable>
            <Pressable style={styles.debugButton} onPress={handleTestPurchase} disabled={purchasing}>
              <Text style={styles.debugButtonText}>
                {purchasing ? 'Satın alınıyor...' : 'Test Satın Al'}
              </Text>
            </Pressable>
          </View>
        </View>

        <FlatList
            data={SCENARIOS}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const style = SCENARIO_STYLE[item.id];
              return (
                  <Pressable
                      style={styles.card}
                      onPress={() => router.push({ pathname: '/scenario/[id]', params: { id: item.id } })}
                  >
                    <View style={[styles.iconWrap, { backgroundColor: style.color + '1A' }]}>
                      <MaterialCommunityIcons name={style.icon as any} size={28} color={style.color} />
                    </View>

                    <View style={styles.cardBody}>
                      <View style={styles.cardTopRow}>
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {item.isPremium && (
                            <View style={styles.premiumBadge}>
                              <MaterialCommunityIcons name="lock" size={12} color={COLORS.premium} />
                              <Text style={styles.premiumText}>Premium</Text>
                            </View>
                        )}
                      </View>
                      <Text style={styles.cardRole}>with {item.aiRole}</Text>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaText}>{item.levelLabel}</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaText}>{item.estimatedMinutes} min</Text>
                      </View>
                    </View>
                  </Pressable>
              );
            }}
        />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.ink,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.inkMuted,
    marginTop: 4,
  },
  debugBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.inkMuted,
    marginBottom: 8,
  },
  debugRow: {
    flexDirection: 'row',
    gap: 8,
  },
  debugButton: {
    flex: 1,
    backgroundColor: COLORS.ink,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.ink,
  },
  cardRole: {
    fontSize: 13,
    color: COLORS.inkMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  metaDot: {
    fontSize: 12,
    color: COLORS.inkMuted,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#C9A2271A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.premium,
  },
});