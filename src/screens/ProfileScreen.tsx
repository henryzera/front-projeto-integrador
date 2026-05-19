import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import { useAuth } from '../store';
import { colors, spacing, typography } from '../theme';

type ProfileAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

export function ProfileScreen() {
  const { signOut, user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const fullName = useMemo(() => {
    const name = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();

    return name || 'Usuário Projeto Integrador';
  }, [user?.firstName, user?.lastName]);

  const avatarUrl = `https://api.dicebear.com/9.x/initials/png?backgroundColor=27AE9E&fontWeight=700&seed=${encodeURIComponent(
    fullName,
  )}`;
  const notificationSummary = getNotificationSummary(user?.notificationPreferences);
  const profileActions = useMemo<ProfileAction[]>(
    () => [
      {
        icon: 'business-outline',
        label: 'Dados da empresa',
        value: user?.cnae ? `CNAE ${user.cnae}` : 'Cadastro e CNAE',
      },
      {
        icon: 'notifications-outline',
        label: 'Preferências de alerta',
        value: notificationSummary,
      },
      {
        icon: 'shield-checkmark-outline',
        label: 'Segurança',
        value: 'Sessão protegida',
      },
      {
        icon: 'help-circle-outline',
        label: 'Ajuda e suporte',
        value: 'Central de atendimento',
      },
    ],
    [notificationSummary, user?.cnae],
  );

  const handleSignOutPress = async (): Promise<void> => {
    setIsSigningOut(true);
    await signOut();
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
      </View>

      <View style={styles.body}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profileCard}>
            <View style={styles.avatarFrame}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
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
              <View style={styles.companyTypeBadge}>
                <Text style={styles.companyTypeText}>MEI</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <InfoTile label="CNPJ" value={formatCnpj(user?.cnpj)} />
              <InfoTile label="CNAE principal" value={user?.cnae || 'Não informado'} />
            </View>
          </View>

          <View style={styles.metricsRow}>
            <MetricTile label="editais" value="18" />
            <MetricTile label="docs em dia" value="80%" />
            <MetricTile label="alertas" value="5" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conta</Text>
            <View style={styles.actionList}>
              {profileActions.map((action) => (
                <ProfileActionRow action={action} key={action.label} />
              ))}
            </View>
          </View>

          <View style={styles.planCard}>
            <View style={styles.planIcon}>
              <Ionicons color={colors.primaryDark} name="sparkles-outline" size={24} />
            </View>
            <View style={styles.planCopy}>
              <Text style={styles.planTitle}>Plano Essencial</Text>
              <Text style={styles.planDescription}>
                Perfil ativo para acompanhar licitações, documentos e prazos.
              </Text>
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
    </SafeAreaView>
  );
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
      onPress={() => undefined}>
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

function getNotificationSummary(
  preferences?: {
    daysBeforeDeadline: number;
    documentAlerts: boolean;
    email: boolean;
    proposalAlerts: boolean;
    push: boolean;
  },
): string {
  if (!preferences) {
    return 'Preferências padrão';
  }

  const activeChannels = [preferences.email, preferences.push].filter(Boolean).length;
  const activeRules = [preferences.documentAlerts, preferences.proposalAlerts].filter(Boolean).length;

  return `${activeRules} regras, ${activeChannels} canais`;
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
  avatar: {
    height: 84,
    width: 84,
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
  companyTypeBadge: {
    backgroundColor: '#E8F5F2',
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  companyTypeText: {
    ...typography.tabLabel,
    color: colors.primaryDark,
  },
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
