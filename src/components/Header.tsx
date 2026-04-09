import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Menu, ClipboardList, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing } from '../theme';
import { useAppTheme } from '../context/AppTheme';
import { Logo } from './Logo';

interface HeaderProps {
  onMenuPress: () => void;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  cartCount?: number;
  onCartPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuPress, onBack, rightElement, cartCount, onCartPress }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <TouchableOpacity
        onPress={onBack ?? onMenuPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {onBack ? (
          <ArrowLeft size={24} color={theme.primary} />
        ) : (
          <Menu size={24} color={theme.primary} />
        )}
      </TouchableOpacity>

      <Logo width={150} variant="white" />

      <TouchableOpacity
        style={styles.rightSlot}
        onPress={cartCount !== undefined ? onCartPress : undefined}
        disabled={cartCount === undefined}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {cartCount !== undefined ? (
          <View style={styles.cartBtn}>
            <ClipboardList size={22} color={theme.primary} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </View>
        ) : (
          rightElement ?? null
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.brandBlack,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  rightSlot: {
    width: 36,
    alignItems: 'flex-end',
  },
  cartBtn: {
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: colors.brandRed,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    fontFamily: fonts.sansBlack,
    fontSize: 9,
    color: colors.white,
  },
});
