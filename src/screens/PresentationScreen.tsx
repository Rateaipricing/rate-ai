import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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
      <Header onMenuPress={() => setIsMenuOpen(true)} cartCount={cartCount} onCartPress={onCartPress} />

      <View style={styles.cardsContainer}>
        {sortedTasks.map((task) => {
          const tierCfg = getTierConfig(task.tier);
          const isE = task.tier.toUpperCase() === 'E';
          const selected = !!getCartItem(task.task_code);

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
              {/* Left color bar — wider when selected */}
              <View style={[styles.colorBar, { backgroundColor: tierCfg.bar, width: selected ? 12 : 7 }]} />

              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <View style={styles.serviceLevelRow}>
                    {isE && !selected && (
                      <CheckCircle2 size={18} color={tierCfg.bar} fill={tierCfg.bar} />
                    )}
                    <Text style={styles.serviceLevel} numberOfLines={1}>{task.service_level}</Text>
                  </View>

                  <Text style={styles.taskCodeName} numberOfLines={1}>
                    {task.task_code} {task.task_name}
                  </Text>

                  <View style={styles.descriptionLines}>
                    {task.task_description.split('\n').slice(0, 3).map((line, i) => (
                      <Text key={i} style={styles.descriptionLine} numberOfLines={1}>{line}</Text>
                    ))}
                  </View>
                </View>

                <View style={styles.cardRight}>
                  <View style={[styles.priceBox, selected && { backgroundColor: tierCfg.bar, borderColor: tierCfg.bar }]}>
                    <Text style={[styles.price, selected && { color: colors.white }]}>
                      ${task.price}
                    </Text>
                  </View>
                  <Text style={styles.warranty} numberOfLines={2}>{task.warranty}</Text>
                </View>
              </View>

              {/* Checkmark badge — top-right corner when selected */}
              {selected && (
                <View style={[styles.checkBadge, { backgroundColor: tierCfg.bar }]}>
                  <CheckCircle2 size={16} color={colors.white} fill={tierCfg.bar} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

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
  card: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
    borderWidth: 0,
  },
  colorBar: {
    flexShrink: 0,
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardLeft: {
    flex: 1,
    gap: 3,
  },
  serviceLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  serviceLevel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    flex: 1,
  },
  taskCodeName: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  descriptionLines: {
    gap: 2,
  },
  descriptionLine: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.brandBlack + 'cc',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 80,
  },
  priceBox: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
  },
  price: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.lg,
    color: colors.brandBlack,
    letterSpacing: -0.5,
  },
  warranty: {
    fontFamily: fonts.sansBlack,
    fontSize: 9,
    color: colors.brandBlack + '99',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  checkBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 6,
  },
});
