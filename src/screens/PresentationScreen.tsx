import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { MenuOverlay } from '../components/MenuOverlay';
import { colors, fonts, spacing, fontSize } from '../theme';
import { useAppTheme } from '../context/AppTheme';
import { Task, TaskLevel, Screen, AppUser, CartItem } from '../types';

interface PresentationScreenProps {
  level: TaskLevel;
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  user: AppUser | null;
  isLoggingOut: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
  onAddToCart: (item: CartItem) => void;
  onRemoveFromCart: (id: string) => void;
  cartItems: CartItem[];
  cartCount?: number;
  onCartPress?: () => void;
  isTechHandbookMode?: boolean;
}

export default function PresentationScreen({
  level,
  onBack,
  onNavigate,
  onLogout,
  user,
  isLoggingOut,
  onRefresh,
  isRefreshing,
  onAddToCart,
  onRemoveFromCart,
  cartItems,
  cartCount,
  onCartPress,
  isTechHandbookMode = false,
}: PresentationScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const sortedTasks = [...level.tasks].sort((a, b) => b.tier.localeCompare(a.tier));

  const getTierConfig = (tier: string) => {
    const key = tier.toUpperCase() as keyof typeof theme.tiers;
    return theme.tiers[key] ?? { bg: colors.white, bar: colors.brandBlack, text: colors.brandBlack };
  };

  // Find cart item for a given task code on this level
  const getCartItem = (taskCode: string): CartItem | undefined =>
    cartItems.find(
      (item) => item.task.task_code === taskCode && item.levelPrefix === level.prefix
    );

  const handleCardPress = (task: Task) => {
    const existing = getCartItem(task.task_code);
    if (existing) {
      onRemoveFromCart(existing.id);
    } else {
      onAddToCart({ id: `${task.task_code}-${Date.now()}`, task, levelPrefix: level.prefix });
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Header onMenuPress={() => setIsMenuOpen(true)} onBack={onBack} cartCount={cartCount} onCartPress={onCartPress} />

      <ScrollView
        style={styles.cardsContainer}
        contentContainerStyle={styles.cardsContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedTasks.map((task) => {
          const tierCfg = getTierConfig(task.tier);
          const isE = task.tier.toUpperCase() === 'E';
          const selected = !!getCartItem(task.task_code);
          const descSource = isTechHandbookMode ? task.custom_handbook : task.task_description;
          const features = descSource
            .split('\n')
            .map((l) => l.trim())
            .filter(Boolean);

          return (
            <TouchableOpacity
              key={task.task_code}
              style={[
                styles.card,
                { backgroundColor: tierCfg.bg },
                selected && { borderColor: tierCfg.bar, borderWidth: 2 },
              ]}
              onPress={() => handleCardPress(task)}
              activeOpacity={0.75}
            >
              {/* Left color bar */}
              <View style={[styles.colorBar, { backgroundColor: tierCfg.bar, width: selected ? 10 : 6 }]} />

              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  {/* Tier name row */}
                  <View style={styles.serviceLevelRow}>
                    {isE && (
                      <CheckCircle2 size={15} color={tierCfg.bar} fill={tierCfg.bar} />
                    )}
                    <Text style={styles.serviceLevel}>{task.service_level}</Text>
                  </View>

                  {/* Task code + name — wraps naturally */}
                  <Text style={styles.taskCodeName}>
                    {task.task_code} {task.task_name}
                  </Text>

                  {/* Features */}
                  <View style={styles.descriptionLines}>
                    {features.map((line, i) => (
                      <Text key={i} style={styles.descriptionLine}>{line}</Text>
                    ))}
                  </View>
                </View>

                {/* Price + warranty */}
                <View style={styles.cardRight}>
                  <Text style={[styles.price, selected && { color: tierCfg.bar }]}>
                    ${task.price.toLocaleString()}
                  </Text>
                  <Text style={styles.warranty}>{task.warranty}</Text>
                </View>
              </View>

              {/* Selected checkmark badge */}
              {selected && (
                <View style={[styles.checkBadge, { backgroundColor: tierCfg.bar }]}>
                  <CheckCircle2 size={14} color={colors.white} fill={tierCfg.bar} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <MenuOverlay
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNavigate={onNavigate}
        onLogout={onLogout}
        user={user}
        isLoggingOut={isLoggingOut}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.brandPlatinum },
  cardsContainer: {
    flex: 1,
  },
  cardsContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 5,
  },
  card: {
    borderRadius: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 0,
  },
  colorBar: {
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardLeft: {
    flex: 1,
    gap: 3,
  },
  serviceLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serviceLevel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  taskCodeName: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.2,
    lineHeight: 14,
  },
  descriptionLines: {
    gap: 1,
    marginTop: 2,
  },
  descriptionLine: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.brandBlack + 'cc',
    lineHeight: 14,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 3,
    minWidth: 72,
    paddingTop: 2,
  },
  price: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.md,
    color: colors.brandBlack,
    letterSpacing: -0.5,
  },
  warranty: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: colors.brandBlack + '99',
    textAlign: 'right',
    lineHeight: 13,
  },
  checkBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 6,
  },
});
