import { Ionicons } from '@expo/vector-icons';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import {
  getMeDashboard,
  type AuthUser,
  type NotificationPreferences,
  type ProfileDashboard,
  type ProfileFunnel,
  type ProfileHistoryEntry,
} from '../services';
import { useAuth } from '../store';
import { colors, spacing, typography } from '../theme';

type ProfileAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  value: string;
};

type ProfileFormState = {
  cnae: string;
  cnpj: string;
  daysBeforeDeadline: string;
  documentAlerts: boolean;
  email: string;
  emailAlerts: boolean;
  firstName: string;
  lastName: string;
  proposalAlerts: boolean;
  push: boolean;
};

const emptyDashboard: ProfileDashboard = {
  contratacoesCount: 0,
  documentHealthPercent: 0,
  expiredDocumentsCount: 0,
  openAlertsCount: 0,
  pendingDocumentsCount: 0,
};

export function ProfileScreen() {
  const { signOut, token, updateProfile, user } = useAuth();
  const [dashboard, setDashboard] = useState<ProfileDashboard>(emptyDashboard);
  const [form, setForm] = useState<ProfileFormState>(() => getInitialProfileForm(user));
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const fullName = useMemo(() => {
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

    return name || 'Usuário Projeto Integrador';
  }, [user?.firstName, user?.lastName]);

  const notificationSummary = getNotificationSummary(user?.notificationPreferences);
  const profileActions = useMemo<ProfileAction[]>(
    () => [
      {
        icon: 'business-outline',
        label: 'Dados da empresa',
        onPress: () => setIsEditModalVisible(true),
        value: user?.cnae ? `CNAE ${user.cnae}` : 'Cadastro e CNAE',
      },
      {
        icon: 'notifications-outline',
        label: 'Preferências de alerta',
        onPress: () => setIsEditModalVisible(true),
        value: notificationSummary,
      },
      {
        icon: 'shield-checkmark-outline',
        label: 'Segurança',
        onPress: () => Alert.alert('Segurança', 'Sua sessão usa token protegido e logout com revogação na API.'),
        value: 'Sessão protegida',
      },
    ],
    [notificationSummary, user?.cnae],
  );

  const loadDashboard = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setIsLoadingDashboard(true);
      const response = await getMeDashboard(token);
      setDashboard(response);
    } catch {
      // O perfil continua util mesmo se os cards resumidos falharem.
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [token]);

  useEffect(() => {
    setForm(getInitialProfileForm(user));
  }, [user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleSignOutPress = async (): Promise<void> => {
    setIsSigningOut(true);
    await signOut();
  };

  const handleSaveProfile = async (): Promise<void> => {
    try {
      setIsSavingProfile(true);
      await updateProfile({
        cnae: form.cnae.trim(),
        cnpj: form.cnpj.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        notificationPreferences: {
          daysBeforeDeadline: Number(form.daysBeforeDeadline) || 3,
          documentAlerts: form.documentAlerts,
          email: form.emailAlerts,
          proposalAlerts: form.proposalAlerts,
          push: form.push,
        },
      });
      setIsEditModalVisible(false);
      await loadDashboard();
    } catch {
      Alert.alert('Perfil', 'Nao foi possivel salvar suas alteracoes agora.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <View style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={loadDashboard}
              refreshing={isLoadingDashboard}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatarFrame}>
              <Text style={styles.avatarInitials}>{getInitials(fullName)}</Text>
            </View>

            <View style={styles.profileCopy}>
              <View style={styles.verifiedBadge}>
                <Ionicons color={colors.primaryDark} name="checkmark-circle" size={14} />
                <Text style={styles.verifiedText}>Conta verificada</Text>
              </View>
              <Text numberOfLines={1} style={styles.name}>
                {fullName}
              </Text>
              <Text numberOfLines={1} style={styles.email}>
                {user?.email || 'email@empresa.com'}
              </Text>
            </View>
          </View>

          <View style={styles.companyCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Empresa</Text>
            </View>

            <View style={styles.infoGrid}>
              <InfoTile label="CNPJ" value={formatCnpj(user?.cnpj)} />
              <InfoTile label="CNAE principal" value={user?.cnae || 'Não informado'} />
            </View>
          </View>

          <View style={styles.metricsRow}>
            <MetricTile label="editais" value={String(dashboard.contratacoesCount)} />
            <MetricTile label="docs em dia" value={`${dashboard.documentHealthPercent}%`} />
            <MetricTile label="alertas" value={String(dashboard.openAlertsCount)} />
          </View>

          <View style={styles.metricsRow}>
            <MetricTile label="pendências" value={String(dashboard.pendingDocumentsCount)} />
            <MetricTile label="vencidos" value={String(dashboard.expiredDocumentsCount)} />
          </View>

          <FunnelSection
            funnel={dashboard.funnel}
            history={dashboard.history}
            isLoading={isLoadingDashboard}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conta</Text>
            <View style={styles.actionList}>
              {profileActions.map((action) => (
                <ProfileActionRow action={action} key={action.label} />
              ))}
            </View>
          </View>

          <AnimatedPressable
            accessibilityRole="button"
            disabled={isSigningOut}
            style={({ pressed }) => [
              styles.signOutButton,
              pressed && styles.pressed,
              isSigningOut && styles.signOutButtonDisabled,
            ]}
            onPress={handleSignOutPress}>
            {isSigningOut ? (
              <ActivityIndicator color={colors.error} size="small" />
            ) : (
              <Ionicons color={colors.error} name="log-out-outline" size={22} />
            )}
            <Text style={styles.signOutText}>{isSigningOut ? 'Saindo...' : 'Sair'}</Text>
          </AnimatedPressable>
        </ScrollView>
      </View>

      <Modal animationType="slide" transparent visible={isEditModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Perfil e alertas</Text>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <ProfileInput label="Nome" value={form.firstName} onChangeText={(value) => setFormValue(setForm, 'firstName', value)} />
              <ProfileInput label="Sobrenome" value={form.lastName} onChangeText={(value) => setFormValue(setForm, 'lastName', value)} />
              <ProfileInput label="Email" value={form.email} onChangeText={(value) => setFormValue(setForm, 'email', value)} />
              <ProfileInput label="CNPJ" value={form.cnpj} onChangeText={(value) => setFormValue(setForm, 'cnpj', value)} />
              <ProfileInput label="CNAE principal" value={form.cnae} onChangeText={(value) => setFormValue(setForm, 'cnae', value)} />
              <ProfileInput
                label="Dias antes do prazo"
                value={form.daysBeforeDeadline}
                onChangeText={(value) => setFormValue(setForm, 'daysBeforeDeadline', value)}
              />

              <PreferenceRow
                label="Alertas de propostas"
                value={form.proposalAlerts}
                onValueChange={(value) => setBooleanFormValue(setForm, 'proposalAlerts', value)}
              />
              <PreferenceRow
                label="Checklist de documentos"
                value={form.documentAlerts}
                onValueChange={(value) => setBooleanFormValue(setForm, 'documentAlerts', value)}
              />
              <PreferenceRow
                label="Email"
                value={form.emailAlerts}
                onValueChange={(value) => setBooleanFormValue(setForm, 'emailAlerts', value)}
              />
              <PreferenceRow
                label="Push"
                value={form.push}
                onValueChange={(value) => setBooleanFormValue(setForm, 'push', value)}
              />
            </ScrollView>

            <View style={styles.modalActions}>
              <AnimatedPressable
                accessibilityRole="button"
                disabled={isSavingProfile}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                onPress={() => setIsEditModalVisible(false)}>
                <Text style={styles.secondaryButtonText}>Cancelar</Text>
              </AnimatedPressable>
              <AnimatedPressable
                accessibilityRole="button"
                disabled={isSavingProfile}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={() => {
                  void handleSaveProfile();
                }}>
                {isSavingProfile ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Salvar</Text>
                )}
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type FunnelStage = {
  key: keyof ProfileFunnel;
  label: string;
  color: string;
};

const funnelStages: FunnelStage[] = [
  { color: '#349DF5', key: 'preparing', label: 'Em preparação' },
  { color: colors.warning, key: 'submitted', label: 'Enviadas' },
  { color: colors.primary, key: 'won', label: 'Ganhos' },
  { color: colors.error, key: 'lost', label: 'Perdidos' },
];

const monthShortLabels = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

function FunnelSection({
  funnel,
  history,
  isLoading,
}: {
  funnel?: ProfileFunnel;
  history?: ProfileHistoryEntry[];
  isLoading: boolean;
}) {
  const hasFunnel = Boolean(funnel);
  const maxFunnelValue = funnel
    ? Math.max(funnel.preparing, funnel.submitted, funnel.won, funnel.lost, 1)
    : 1;
  const maxHistoryValue = history?.length
    ? Math.max(...history.map((entry) => entry.total), 1)
    : 1;

  return (
    <View style={styles.funnelCard}>
      <Text style={styles.sectionTitle}>Funil de participações</Text>
      <Text style={styles.funnelCaption}>
        Acompanhe a evolução das suas propostas por etapa.
      </Text>

      {!hasFunnel && isLoading ? (
        <ActivityIndicator color={colors.primary} style={styles.funnelFeedback} />
      ) : null}

      {!hasFunnel && !isLoading ? (
        <Text style={styles.funnelEmpty}>Ainda não há dados de participação para exibir.</Text>
      ) : null}

      {hasFunnel && funnel ? (
        <View style={styles.funnelStages}>
          {funnelStages.map((stage) => (
            <FunnelBar
              color={stage.color}
              key={stage.key}
              label={stage.label}
              max={maxFunnelValue}
              value={funnel[stage.key]}
            />
          ))}
        </View>
      ) : null}

      {history && history.length > 0 ? (
        <View style={styles.historyBlock}>
          <Text style={styles.historyTitle}>Histórico por mês</Text>
          <View style={styles.historyList}>
            {history.map((entry) => (
              <HistoryRow entry={entry} key={entry.month} max={maxHistoryValue} />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

function FunnelBar({
  color,
  label,
  max,
  value,
}: {
  color: string;
  label: string;
  max: number;
  value: number;
}) {
  const widthPercent = `${Math.max((value / max) * 100, value > 0 ? 8 : 4)}%` as const;

  return (
    <View style={styles.funnelRow}>
      <Text numberOfLines={1} style={styles.funnelLabel}>
        {label}
      </Text>
      <View style={styles.funnelTrack}>
        <View style={[styles.funnelFill, { backgroundColor: color, width: widthPercent }]} />
      </View>
      <Text style={styles.funnelValue}>{value}</Text>
    </View>
  );
}

function HistoryRow({ entry, max }: { entry: ProfileHistoryEntry; max: number }) {
  const widthPercent = `${Math.max((entry.total / max) * 100, entry.total > 0 ? 8 : 4)}%` as const;

  return (
    <View style={styles.historyRow}>
      <Text style={styles.historyMonth}>{formatHistoryMonth(entry.month)}</Text>
      <View style={styles.historyTrack}>
        <View style={[styles.historyFill, { width: widthPercent }]} />
      </View>
      <Text style={styles.historyValue}>{entry.total}</Text>
    </View>
  );
}

function formatHistoryMonth(value: string): string {
  const [year, month] = value.split('-');
  const monthIndex = Number(month) - 1;

  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return value;
  }

  return `${monthShortLabels[monthIndex]}/${year?.slice(2) || ''}`;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={2} style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ProfileActionRow({ action }: { action: ProfileAction }) {
  return (
    <AnimatedPressable
      accessibilityRole="button"
      style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
      onPress={action.onPress}>
      <View style={styles.actionIcon}>
        <Ionicons color={colors.primaryDark} name={action.icon} size={20} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={styles.actionLabel}>{action.label}</Text>
        <Text style={styles.actionValue}>{action.value}</Text>
      </View>
      <Ionicons color={colors.iconMuted} name="chevron-forward" size={20} />
    </AnimatedPressable>
  );
}

function ProfileInput({
  label,
  onChangeText,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.profileInputGroup}>
      <Text style={styles.profileInputLabel}>{label}</Text>
      <TextInput
        autoCapitalize={label === 'Email' ? 'none' : 'words'}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textSecondary}
        style={styles.profileInput}
        value={value}
      />
    </View>
  );
}

function PreferenceRow({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.preferenceRow}>
      <Text style={styles.preferenceLabel}>{label}</Text>
      <Switch
        onValueChange={onValueChange}
        thumbColor={colors.white}
        trackColor={{ false: colors.grayLight, true: colors.primary }}
        value={value}
      />
    </View>
  );
}

function formatCnpj(cnpj?: string): string {
  const digits = cnpj?.replace(/\D/g, '') || '';

  if (digits.length !== 14) {
    return cnpj || 'Não informado';
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(
    8,
    12,
  )}-${digits.slice(12)}`;
}

function getInitialProfileForm(user: AuthUser | null | undefined): ProfileFormState {
  const preferences = user?.notificationPreferences;

  return {
    cnae: user?.cnae || '',
    cnpj: user?.cnpj || '',
    daysBeforeDeadline: String(preferences?.daysBeforeDeadline || 3),
    documentAlerts: preferences?.documentAlerts ?? true,
    email: user?.email || '',
    emailAlerts: preferences?.email ?? true,
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    proposalAlerts: preferences?.proposalAlerts ?? true,
    push: preferences?.push ?? true,
  };
}

function getInitials(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase('pt-BR'))
    .join('');
}

function getNotificationSummary(
  preferences?: NotificationPreferences,
): string {
  if (!preferences) {
    return 'Preferências padrão';
  }

  const activeChannels = [preferences.email, preferences.push].filter(Boolean).length;
  const activeRules = [preferences.documentAlerts, preferences.proposalAlerts].filter(Boolean).length;

  return `${activeRules} regras, ${activeChannels} canais`;
}

function setFormValue(
  setForm: Dispatch<SetStateAction<ProfileFormState>>,
  key: keyof ProfileFormState,
  value: string,
): void {
  setForm((currentForm) => ({
    ...currentForm,
    [key]: value,
  }));
}

function setBooleanFormValue(
  setForm: Dispatch<SetStateAction<ProfileFormState>>,
  key: keyof ProfileFormState,
  value: boolean,
): void {
  setForm((currentForm) => ({
    ...currentForm,
    [key]: value,
  }));
}

const styles = StyleSheet.create({
  actionCopy: {
    flex: 1,
    minWidth: 0,
  },
  actionIcon: {
    alignItems: 'center',
    backgroundColor: '#E8F5F2',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  actionList: {
    backgroundColor: colors.white,
    borderColor: colors.surfaceMuted,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: {
    alignItems: 'center',
    borderBottomColor: colors.surfaceMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 66,
    paddingHorizontal: spacing.md,
    columnGap: spacing.sm,
  },
  actionValue: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  avatarFrame: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.white,
    borderRadius: 999,
    borderWidth: 4,
    height: 96,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 96,
  },
  avatarInitials: {
    ...typography.title,
    color: colors.primaryDark,
  },
  body: {
    backgroundColor: colors.white,
    flex: 1,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  companyCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.md,
    rowGap: spacing.md,
  },
  // Mock removed — company type badge was hardcoded as "MEI"; should come from user data when available.
  // companyTypeBadge: { backgroundColor: '#E8F5F2', borderRadius: 999, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  // companyTypeText: { ...typography.tabLabel, color: colors.primaryDark },
  container: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    rowGap: spacing.md,
  },
  email: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  funnelCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  funnelCard: {
    backgroundColor: colors.white,
    borderColor: colors.surfaceMuted,
    borderRadius: 22,
    borderWidth: 1,
    padding: spacing.md,
    rowGap: spacing.sm,
  },
  funnelEmpty: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  funnelFeedback: {
    marginTop: spacing.md,
  },
  funnelFill: {
    borderRadius: 999,
    height: '100%',
  },
  funnelLabel: {
    ...typography.caption,
    color: colors.text,
    fontSize: 12,
    width: 96,
  },
  funnelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  funnelStages: {
    marginTop: spacing.sm,
    rowGap: spacing.sm,
  },
  funnelTrack: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    flex: 1,
    height: 14,
    overflow: 'hidden',
  },
  funnelValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'right',
  },
  historyBlock: {
    borderTopColor: colors.surfaceMuted,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    rowGap: spacing.sm,
  },
  historyFill: {
    backgroundColor: colors.primaryDark,
    borderRadius: 999,
    height: '100%',
  },
  historyList: {
    rowGap: spacing.xs,
  },
  historyMonth: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    width: 64,
  },
  historyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  historyTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  historyTrack: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    flex: 1,
    height: 10,
    overflow: 'hidden',
  },
  historyValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'right',
  },
  header: {
    backgroundColor: colors.primary,
    justifyContent: 'flex-end',
    minHeight: 78,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerTitle: {
    ...typography.title,
    color: colors.text,
  },
  infoGrid: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  infoTile: {
    backgroundColor: colors.white,
    borderRadius: 16,
    flex: 1,
    minHeight: 74,
    padding: spacing.md,
  },
  infoValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  metricTile: {
    alignItems: 'center',
    backgroundColor: '#F8FAFA',
    borderRadius: 18,
    flex: 1,
    minHeight: 74,
    justifyContent: 'center',
  },
  metricValue: {
    ...typography.title,
    color: colors.text,
    fontSize: 22,
  },
  metricsRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  modalActions: {
    flexDirection: 'row',
    paddingTop: spacing.md,
    columnGap: spacing.sm,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
    padding: spacing.lg,
  },
  modalOverlay: {
    backgroundColor: 'rgba(0,0,0,0.24)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScroll: {
    paddingTop: spacing.md,
    rowGap: spacing.md,
  },
  modalTitle: {
    ...typography.title,
    color: colors.text,
  },
  name: {
    ...typography.title,
    color: colors.text,
    fontSize: 22,
    marginTop: spacing.sm,
  },
  planCard: {
    alignItems: 'center',
    backgroundColor: '#F8FAFA',
    borderRadius: 18,
    flexDirection: 'row',
    padding: spacing.md,
    columnGap: spacing.md,
  },
  planCopy: {
    flex: 1,
    minWidth: 0,
  },
  planDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  planIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  planTitle: {
    ...typography.button,
    color: colors.text,
  },
  pressed: {
    opacity: 0.75,
  },
  preferenceLabel: {
    ...typography.body,
    color: colors.text,
  },
  preferenceRow: {
    alignItems: 'center',
    borderColor: colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    flex: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 24,
    flexDirection: 'row',
    padding: spacing.md,
    columnGap: spacing.md,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileInput: {
    ...typography.body,
    backgroundColor: colors.surface,
    borderColor: colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  profileInputGroup: {
    rowGap: spacing.xs,
  },
  profileInputLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: colors.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.text,
  },
  section: {
    rowGap: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: '#F6C9C5',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 54,
    columnGap: spacing.sm,
  },
  signOutButtonDisabled: {
    opacity: 0.65,
  },
  signOutText: {
    ...typography.button,
    color: colors.error,
  },
  verifiedBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5F2',
    borderRadius: 999,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    columnGap: spacing.xs,
  },
  verifiedText: {
    ...typography.tabLabel,
    color: colors.primaryDark,
  },
});

export default ProfileScreen;
