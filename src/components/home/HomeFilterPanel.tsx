import { Ionicons } from '@expo/vector-icons';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '../../theme';

export type ValueRangePreset = 'all' | 'upTo50k' | '50kTo150k' | 'above150k';

export type HomeFilters = {
  municipio: string;
  uf: string;
  modalidadeNome: string;
  valorRange: ValueRangePreset;
  meOnly: boolean;
  compatibleCnae: boolean;
};

export const defaultHomeFilters: HomeFilters = {
  municipio: '',
  uf: '',
  modalidadeNome: '',
  valorRange: 'all',
  meOnly: false,
  compatibleCnae: false,
};

type ModalidadeOption = {
  label: string;
  value: string;
};

const modalidadeOptions: ModalidadeOption[] = [
  { label: 'Todas', value: '' },
  { label: 'Pregão - Eletrônico', value: 'Pregão - Eletrônico' },
  { label: 'Dispensa Eletrônica', value: 'Dispensa Eletrônica' },
  { label: 'Concorrência', value: 'Concorrência' },
];

type ValueRangeOption = {
  label: string;
  value: ValueRangePreset;
};

const valueRangeOptions: ValueRangeOption[] = [
  { label: 'Qualquer valor', value: 'all' },
  { label: 'Até R$ 50 mil', value: 'upTo50k' },
  { label: 'R$ 50–150 mil', value: '50kTo150k' },
  { label: 'Acima de R$ 150 mil', value: 'above150k' },
];

export function resolveValueRange(preset: ValueRangePreset): {
  valorMin?: number;
  valorMax?: number;
} {
  switch (preset) {
    case 'upTo50k':
      return { valorMax: 50000 };
    case '50kTo150k':
      return { valorMax: 150000, valorMin: 50000 };
    case 'above150k':
      return { valorMin: 150000 };
    default:
      return {};
  }
}

export function countActiveFilters(filters: HomeFilters): number {
  let count = 0;

  if (filters.municipio.trim()) {
    count += 1;
  }

  if (filters.uf.trim()) {
    count += 1;
  }

  if (filters.modalidadeNome) {
    count += 1;
  }

  if (filters.valorRange !== 'all') {
    count += 1;
  }

  if (filters.meOnly) {
    count += 1;
  }

  if (filters.compatibleCnae) {
    count += 1;
  }

  return count;
}

export interface HomeFilterPanelProps {
  visible: boolean;
  filters: HomeFilters;
  hasCnae: boolean;
  onChange: (filters: HomeFilters) => void;
  onClear: () => void;
  onClose: () => void;
}

export function HomeFilterPanel({
  visible,
  filters,
  hasCnae,
  onChange,
  onClear,
  onClose,
}: HomeFilterPanelProps) {
  const update = <K extends keyof HomeFilters>(key: K, value: HomeFilters[K]): void => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filtros</Text>
            <TouchableOpacity accessibilityRole="button" hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.text} name="close" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.field}>
              <Text style={styles.label}>Localização</Text>
              <View style={styles.row}>
                <TextInput
                  autoCapitalize="words"
                  onChangeText={(value) => update('municipio', value)}
                  placeholder="Município"
                  placeholderTextColor={colors.textSecondary}
                  style={styles.input}
                  value={filters.municipio}
                />
                <TextInput
                  autoCapitalize="characters"
                  maxLength={2}
                  onChangeText={(value) => update('uf', value.toLocaleUpperCase('pt-BR'))}
                  placeholder="UF"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.input, styles.ufInput]}
                  value={filters.uf}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Modalidade</Text>
              <View style={styles.chips}>
                {modalidadeOptions.map((option) => {
                  const isActive = option.value === filters.modalidadeNome;

                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      activeOpacity={0.75}
                      key={option.value || 'todas'}
                      onPress={() => update('modalidadeNome', option.value)}
                      style={[styles.chip, isActive && styles.chipActive]}>
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Faixa de valor</Text>
              <View style={styles.chips}>
                {valueRangeOptions.map((option) => {
                  const isActive = option.value === filters.valorRange;

                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      activeOpacity={0.75}
                      key={option.value}
                      onPress={() => update('valorRange', option.value)}
                      style={[styles.chip, isActive && styles.chipActive]}>
                      <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>Oportunidades MEI</Text>
                <Text style={styles.toggleHint}>Apenas editais exclusivos ou compatíveis com MEI.</Text>
              </View>
              <Switch
                onValueChange={(value) => update('meOnly', value)}
                thumbColor={colors.white}
                trackColor={{ false: colors.grayLight, true: colors.primary }}
                value={filters.meOnly}
              />
            </View>

            <View style={styles.toggleRow}>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>Compatível com meu CNAE</Text>
                <Text style={styles.toggleHint}>
                  {hasCnae
                    ? 'Ordena a lista pela aderência ao seu CNAE.'
                    : 'Cadastre um CNAE no seu perfil para usar este filtro.'}
                </Text>
              </View>
              <Switch
                disabled={!hasCnae}
                onValueChange={(value) => update('compatibleCnae', value)}
                thumbColor={colors.white}
                trackColor={{ false: colors.grayLight, true: colors.primary }}
                value={filters.compatibleCnae}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.75}
              onPress={onClear}
              style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={onClose}
              style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Ver resultados</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  applyButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: spacing.lg,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  applyButtonText: {
    ...typography.button,
    color: colors.white,
  },
  backdrop: {
    backgroundColor: 'rgba(17, 17, 17, 0.4)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  body: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    rowGap: spacing.lg,
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.surfaceMuted,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.tabLabel,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.white,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  clearButton: {
    alignItems: 'center',
    borderColor: colors.surfaceMuted,
    borderRadius: spacing.lg,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  clearButtonText: {
    ...typography.button,
    color: colors.text,
  },
  field: {
    rowGap: spacing.sm,
  },
  footer: {
    borderTopColor: colors.surfaceMuted,
    borderTopWidth: 1,
    columnGap: spacing.sm,
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  input: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderColor: colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  label: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  row: {
    columnGap: spacing.sm,
    flexDirection: 'row',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    maxHeight: '88%',
    paddingTop: spacing.md,
  },
  sheetHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sheetTitle: {
    ...typography.title,
    color: colors.text,
  },
  toggleCopy: {
    flex: 1,
    paddingRight: spacing.md,
    rowGap: spacing.xs,
  },
  toggleHint: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  ufInput: {
    flex: 0.4,
    textAlign: 'center',
  },
});

export default HomeFilterPanel;
