import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LogIn, Mail, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Logo } from '../components/Logo';
import { colors, fonts, spacing, fontSize, radius } from '../theme';
import { useAppTheme } from '../context/AppTheme';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
  externalError?: string | null;
  isLoggingIn?: boolean;
}

export default function LoginScreen({
  onLogin,
  externalError,
  isLoggingIn,
}: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    const success = await onLogin(email, password);
    if (!success && !externalError) {
      setError('Invalid email or password.');
    }
  };

  const displayError = error || externalError;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo + title */}
        <View style={styles.logoArea}>
          <Logo width={160} />
          <Text style={styles.subtitle}>SIGN IN</Text>
        </View>

        {/* Error */}
        {!!displayError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrapper}>
              <Mail size={16} color={colors.brandBlack + '66'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.brandBlack + '44'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <View style={styles.inputWrapper}>
              <Lock size={16} color={colors.brandBlack + '66'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.brandBlack + '44'}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary }, isLoggingIn && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={isLoggingIn}
            activeOpacity={0.85}
          >
            {isLoggingIn ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.submitBtnText}>SIGNING IN...</Text>
              </>
            ) : (
              <>
                <LogIn size={20} color={colors.white} />
                <Text style={styles.submitBtnText}>SIGN IN</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2026 RATE AI</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.brandPlatinum },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  subtitle: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.brandBlack,
    marginTop: spacing.base,
    letterSpacing: 1,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#f87171',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.base,
  },
  errorText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: '#b91c1c',
    textAlign: 'center',
  },
  form: {
    gap: spacing.xl,
  },
  fieldGroup: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack,
    letterSpacing: 1,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
  },
  submitBtn: {
    backgroundColor: colors.brandRed,
    borderRadius: radius.lg,
    padding: spacing.base + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    shadowColor: colors.brandRed,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.base,
    color: colors.white,
    letterSpacing: 1,
  },
  footer: {
    fontFamily: fonts.sansBlack,
    fontSize: 10,
    color: colors.brandBlack + '66',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: spacing.xl,
  },
});
