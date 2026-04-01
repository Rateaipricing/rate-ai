import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Shield, HelpCircle, Smartphone, Mail, FileText } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../components/Header';
import { MenuOverlay } from '../components/MenuOverlay';
import { colors, fonts, spacing, fontSize, radius } from '../theme';
import { Screen, AppUser } from '../types';
import { auth, sendPasswordResetEmail } from '../firebase';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onLogout: () => void;
  user: AppUser | null;
  isLoggingOut: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function SettingsScreen({
  onBack,
  onNavigate,
  onLogout,
  user,
  isLoggingOut,
  onRefresh,
  isRefreshing,
}: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleChangePassword = async () => {
    const email = user?.email ?? auth.currentUser?.email;
    if (!email) {
      Alert.alert('Error', 'No email address found for your account.');
      return;
    }
    Alert.alert(
      'Reset Password',
      `A password reset link will be sent to:\n\n${email}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            setIsSendingReset(true);
            try {
              await sendPasswordResetEmail(auth, email);
              Alert.alert(
                'Email Sent',
                'Check your inbox for the password reset link.',
              );
            } catch {
              Alert.alert('Error', 'Failed to send reset email. Please try again.');
            } finally {
              setIsSendingReset(false);
            }
          },
        },
      ]
    );
  };

  const handleHelpAndSupport = () => {
    Linking.openURL('mailto:support@rateai.app?subject=Rate%20AI%20Support');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://shehbazali1639.github.io/a-team-electricians/privacy-policy.html');
  };

  return (
    <View style={styles.container}>
      <Header onMenuPress={() => setIsMenuOpen(true)} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Security</Text>

        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={handleChangePassword}
            disabled={isSendingReset}
          >
            <View style={styles.settingIconBox}>
              {isSendingReset
                ? <ActivityIndicator size="small" color={colors.brandBlack} />
                : <Shield size={20} color={colors.brandBlack + '66'} />
              }
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Change Password</Text>
              <Text style={styles.settingDesc}>Send a reset link to your email</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Support</Text>

        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={handleHelpAndSupport}
          >
            <View style={styles.settingIconBox}>
              <HelpCircle size={20} color={colors.brandBlack + '66'} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Help & Support</Text>
              <Text style={styles.settingDesc}>Email us at support@rateai.app</Text>
            </View>
            <Mail size={16} color={colors.brandBlack + '44'} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={handlePrivacyPolicy}
          >
            <View style={styles.settingIconBox}>
              <FileText size={20} color={colors.brandBlack + '66'} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
              <Text style={styles.settingDesc}>How we handle your data</Text>
            </View>
            <Mail size={16} color={colors.brandBlack + '44'} />
          </TouchableOpacity>

          <View style={[styles.settingRow, styles.settingRowBorder]}>
            <View style={styles.settingIconBox}>
              <Smartphone size={20} color={colors.brandBlack + '66'} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>App Version</Text>
              <Text style={styles.settingDesc}>1.0.0 (Build 1)</Text>
            </View>
          </View>
        </View>
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
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.xl,
    gap: spacing.base,
  },
  sectionTitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: spacing.base,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  settingRow: {
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
  },
  settingRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.brandPlatinum,
  },
  settingIconBox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(224,227,232,0.3)',
    borderRadius: radius.lg,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
  },
  settingDesc: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '66',
    marginTop: 2,
  },
});
