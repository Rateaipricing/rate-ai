import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, fonts, spacing, fontSize, radius } from '../theme';

interface ColorPickerProps {
  label: string;
  currentColor: string;
  presets: string[];
  onSelect: (hex: string) => void;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const ColorPicker: React.FC<ColorPickerProps> = ({
  label,
  currentColor,
  presets,
  onSelect,
}) => {
  const [input, setInput] = useState(currentColor);

  // Keep input in sync when currentColor changes externally
  useEffect(() => {
    setInput(currentColor);
  }, [currentColor]);

  const handleInputChange = (text: string) => {
    // Auto-prepend # if user starts typing without it
    const val = text.startsWith('#') ? text : '#' + text;
    setInput(val);
    if (HEX_RE.test(val)) {
      onSelect(val.toLowerCase());
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Section label */}
      <Text style={styles.label}>{label}</Text>

      {/* Preset swatches */}
      <View style={styles.swatchGrid}>
        {presets.map((hex) => {
          const active = currentColor.toLowerCase() === hex.toLowerCase();
          return (
            <TouchableOpacity
              key={hex}
              style={[styles.swatch, { backgroundColor: hex }, active && styles.swatchActive]}
              onPress={() => { onSelect(hex); setInput(hex); }}
              activeOpacity={0.75}
            >
              {active && <Check size={13} color="#fff" strokeWidth={3} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom hex input */}
      <View style={styles.inputRow}>
        <View style={[styles.preview, { backgroundColor: HEX_RE.test(input) ? input : '#ccc' }]} />
        <TextInput
          style={styles.hexInput}
          value={input}
          onChangeText={handleInputChange}
          placeholder="#a70707"
          placeholderTextColor={colors.brandBlack + '44'}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={7}
        />
        <Text style={styles.hexHint}>custom hex</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fonts.sansBlack,
    fontSize: fontSize.xs,
    color: colors.brandBlack + '99',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: colors.brandBlack,
    transform: [{ scale: 1.1 }],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.brandPlatinum + '66',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brandPlatinum,
  },
  preview: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    flexShrink: 0,
  },
  hexInput: {
    flex: 1,
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.brandBlack,
    letterSpacing: 1,
  },
  hexHint: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.brandBlack + '55',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
