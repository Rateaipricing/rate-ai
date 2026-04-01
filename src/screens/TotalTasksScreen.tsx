import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { ArrowLeft, Plus, Trash2, ShoppingCart } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, spacing, fontSize } from '../theme';
import { useAppTheme } from '../context/AppTheme';
import { CartItem } from '../types';
import { Logo } from '../components/Logo';

interface TotalTasksScreenProps {
  cartItems: CartItem[];
  onRemoveItem: (id: string) => void;
  onBack: () => void;
  onAddMore: () => void;
}

export default function TotalTasksScreen({
  cartItems,
  onRemoveItem,
  onBack,
  onAddMore,
}: TotalTasksScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const subtotal = cartItems.reduce((sum, item) => sum + item.task.price, 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <ArrowLeft size={24} color={colors.white} />
        </TouchableOpacity>
        <Logo width={90} variant="white" />
        <View style={{ width: 24 }} />
      </View>

      {/* Subtotal bar */}
      <View style={styles.subtotalBar}>
        <View style={styles.subtotalLeft}>
          <View style={styles.badgeWrap}>
            <ShoppingCart size={20} color={colors.brandBlack} />
            {cartItems.length > 0 && (
              <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                <Text style={styles.badgeText}>{cartItems.length}</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtotalText}>
            Subtotal: <Text style={[styles.subtotalAmount, { color: theme.primary }]}>${subtotal.toLocaleString()}</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addMoreBtn, { backgroundColor: theme.primary }]}
          onPress={onAddMore}
          activeOpacity={0.8}
        >
          <Plus size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Task list */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.base },
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <ShoppingCart size={48} color={colors.brandPlatinum} />
            <Text style={styles.emptyTitle}>No tasks added yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to browse and add tasks</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <View style={[styles.taskCardBar, { backgroundColor: theme.primary }]} />
            <View style={styles.taskCardContent}>
              <View style={styles.taskCardLeft}>
                <Text style={styles.taskPrefix}>{item.levelPrefix}</Text>
                <Text style={styles.taskServiceLevel} numberOfLines={1}>
                  {item.task.service_level}
                </Text>
                <Text style={styles.taskCodeName} numberOfLines={1}>
                  {item.task.task_code} {item.task.task_name}
                </Text>
              </View>
              <View style={styles.taskCardRight}>
                <Text style={[styles.taskPrice, { color: theme.primary }]}>
                  ${item.task.price.toLocaleString()}
                </Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => onRemoveItem(item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={18} color={colors.errorText} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brandPlatinum,
  },
  header: {
    backgroundColor: colors.brandBlack,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  subtotalBar: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.brandPlatinum,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  subtotalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  badgeWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontFamily: fonts.sansBlack,
    fontSize: 9,
    color: colors.white,
  },
  subtotalText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  subtotalAmount: {
    fontSize: fontSize.lg,
  },
  addMoreBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.brandBlack + '66',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  emptySubtitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '44',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  taskCard: {
    backgroundColor: colors.white,
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  taskCardBar: {
    width: 6,
    flexShrink: 0,
  },
  taskCardContent: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taskCardLeft: {
    flex: 1,
    gap: 3,
  },
  taskPrefix: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '55',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  taskServiceLevel: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  taskCodeName: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.brandBlack + '88',
    textTransform: 'uppercase',
    letterSpacing: -0.2,
  },
  taskCardRight: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  taskPrice: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.lg,
    letterSpacing: -0.5,
  },
  deleteBtn: {
    padding: 4,
  },
});
