import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import {
  getContratacao,
  type ContratacaoDetail,
  type OfficialLink,
} from '../services';
import { useAuth } from '../store';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types/navigation';

type OpportunityDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'OpportunityDetail'>;

export function OpportunityDetailScreen({ navigation, route }: OpportunityDetailScreenProps) {
  const { token } = useAuth();
  const [contratacao, setContratacao] = useState<ContratacaoDetail | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const response = await getContratacao(token, route.params.id);
      setContratacao(response);
    } catch {
      setError('Nao foi possivel carregar os detalhes desta oportunidade.');
    } finally {
      setIsLoading(false);
    }
  }, [route.params.id, token]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const officialLinks = useMemo(() => getOfficialLinks(contratacao), [contratacao]);

  const handleOpenLink = async (link: OfficialLink): Promise<void> => {
    const canOpen = await Linking.canOpenURL(link.url);

    if (!canOpen) {
      Alert.alert('Link indisponivel', 'Nao foi possivel abrir o portal oficial desta oportunidade.');
      return;
    }

    await Linking.openURL(link.url);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <AnimatedPressable
          accessibilityLabel="Voltar"
          accessibilityRole="button"
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          onPress={navigation.goBack}>
          <Ionicons color={colors.text} name="chevron-back" size={24} />
        </AnimatedPressable>
        <Text numberOfLines={1} style={styles.headerTitle}>
          Detalhe do edital
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={loadDetail}
            refreshing={isLoading}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}>
        {isLoading && !contratacao ? (
          <ActivityIndicator color={colors.primary} style={styles.feedback} />
        ) : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {contratacao ? (
          <>
            <View style={styles.summaryBlock}>
              <View style={styles.scoreBadge}>
                <Ionicons color={colors.primaryDark} name="sparkles-outline" size={16} />
                <Text style={styles.scoreText}>{getCompatibilityScore(contratacao)}% de aderencia</Text>
              </View>
              <Text style={styles.title}>{contratacao.objetoCompra || 'Objeto nao informado'}</Text>
              <Text style={styles.helperText}>
                Aderencia e apenas uma indicacao para priorizar sua leitura. Confira o edital oficial antes de participar.
              </Text>
            </View>

            <View style={styles.infoGrid}>
              <InfoCard icon="cash-outline" label="Valor estimado" value={formatCurrency(getEstimatedValue(contratacao))} />
              <InfoCard icon="time-outline" label="Prazo" value={formatDate(contratacao.dataEncerramentoProposta)} />
              <InfoCard icon="business-outline" label="Orgao" value={getIssuer(contratacao)} />
              <InfoCard icon="location-outline" label="Local" value={getLocation(contratacao)} />
              <InfoCard icon="albums-outline" label="Modalidade" value={contratacao.modalidadeNome || 'Nao informada'} />
              <InfoCard icon="flag-outline" label="Situacao" value={contratacao.statusOportunidade || contratacao.situacaoCompraNome || 'A confirmar'} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>O que conferir</Text>
              <Text style={styles.sectionDescription}>
                Use esta lista como ponto de partida para se preparar. Ela nao substitui a leitura do edital.
              </Text>
              <View style={styles.checkList}>
                {getSuggestedDocuments(contratacao).map((documentName) => (
                  <View key={documentName} style={styles.checkItem}>
                    <Ionicons color={colors.primaryDark} name="checkmark-circle-outline" size={20} />
                    <Text style={styles.checkText}>{documentName}</Text>
                  </View>
                ))}
              </View>
            </View>

            {officialLinks.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Portal oficial</Text>
                {officialLinks.map((link) => (
                  <AnimatedPressable
                    accessibilityRole="link"
                    key={`${link.type || link.label}-${link.url}`}
                    style={({ pressed }) => [styles.officialLink, pressed && styles.pressed]}
                    onPress={() => {
                      void handleOpenLink(link);
                    }}>
                    <View style={styles.officialLinkIcon}>
                      <Ionicons color={colors.primaryDark} name="open-outline" size={20} />
                    </View>
                    <Text style={styles.officialLinkText}>{link.label || 'Abrir no portal oficial'}</Text>
                    <Ionicons color={colors.text} name="chevron-forward" size={20} />
                  </AnimatedPressable>
                ))}
              </View>
            ) : (
              <View style={styles.sectionMuted}>
                <Ionicons color={colors.textSecondary} name="information-circle-outline" size={20} />
                <Text style={styles.mutedText}>Link oficial nao informado para esta oportunidade.</Text>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCard}>
      <Ionicons color={colors.primaryDark} name={icon} size={18} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text numberOfLines={3} style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function getOfficialLinks(contratacao: ContratacaoDetail | null): OfficialLink[] {
  if (!contratacao) {
    return [];
  }

  const links = contratacao.linksOficiais?.filter((link) => link.url) || [];
  const fallbackLinkCandidates: (OfficialLink | null)[] = [
    contratacao.linkOficial ? { label: 'Abrir edital oficial', type: 'oficial', url: contratacao.linkOficial } : null,
    contratacao.linkSistemaOrigem ? { label: 'Portal de origem', type: 'sistema_origem', url: contratacao.linkSistemaOrigem } : null,
    contratacao.linkProcessoEletronico ? { label: 'Processo eletronico', type: 'processo_eletronico', url: contratacao.linkProcessoEletronico } : null,
  ];
  const fallbackLinks = fallbackLinkCandidates.filter((link): link is OfficialLink => Boolean(link));

  const allLinks = [...links, ...fallbackLinks];
  const seenUrls = new Set<string>();

  return allLinks.filter((link) => {
    if (seenUrls.has(link.url)) {
      return false;
    }

    seenUrls.add(link.url);
    return true;
  });
}

function getSuggestedDocuments(contratacao: ContratacaoDetail): string[] {
  if (contratacao.documentosExigidos?.length) {
    return contratacao.documentosExigidos.slice(0, 6);
  }

  return [
    'CNPJ ativo e regular',
    'Certidoes fiscais em dia',
    'Documento de habilitacao juridica',
    'Atividade/CNAE compativel com o objeto',
  ];
}

function getCompatibilityScore(contratacao: ContratacaoDetail): number {
  return contratacao.compatibilityScore ?? 0;
}

function getEstimatedValue(contratacao: ContratacaoDetail): number | undefined {
  return contratacao.valorEstimado || contratacao.valorTotalEstimado;
}

function getIssuer(contratacao: ContratacaoDetail): string {
  return (
    contratacao.dadosOrgao?.razaoSocial ||
    contratacao.orgaoEntidade?.razaoSocial ||
    contratacao.unidadeOrgao?.nomeUnidade ||
    'Orgao nao informado'
  );
}

function getLocation(contratacao: ContratacaoDetail): string {
  const municipio = contratacao.municipioNome || contratacao.unidadeOrgao?.municipioNome || contratacao.dadosOrgao?.municipio;
  const uf = contratacao.uf || contratacao.unidadeOrgao?.ufSigla || contratacao.dadosOrgao?.uf;

  return [municipio, uf?.toLocaleUpperCase('pt-BR')].filter(Boolean).join('/') || 'Local nao informado';
}

function formatCurrency(value?: number): string {
  if (typeof value !== 'number') {
    return 'Nao informado';
  }

  return Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value);
}

function formatDate(value?: string): string {
  if (!value) {
    return 'A confirmar';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'A confirmar';
  }

  return Intl.DateTimeFormat('pt-BR').format(date);
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  checkItem: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 38,
    columnGap: spacing.sm,
  },
  checkList: {
    marginTop: spacing.sm,
    rowGap: spacing.xs,
  },
  checkText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  container: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  content: {
    backgroundColor: colors.white,
    padding: spacing.md,
    rowGap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  feedback: {
    marginTop: spacing.xl,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    flexDirection: 'row',
    minHeight: 78,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    columnGap: spacing.sm,
  },
  headerTitle: {
    ...typography.title,
    color: colors.text,
    flex: 1,
  },
  helperText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    flexBasis: '48%',
    flexGrow: 1,
    minHeight: 112,
    padding: spacing.md,
    rowGap: spacing.xs,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  infoValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 19,
  },
  mutedText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  officialLink: {
    alignItems: 'center',
    borderColor: colors.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    columnGap: spacing.sm,
  },
  officialLinkIcon: {
    alignItems: 'center',
    backgroundColor: '#E8F5F2',
    borderRadius: 14,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  officialLinkText: {
    ...typography.button,
    color: colors.text,
    flex: 1,
  },
  pressed: {
    opacity: 0.74,
  },
  scoreBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5F2',
    borderRadius: 999,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    columnGap: spacing.xs,
  },
  scoreText: {
    ...typography.tabLabel,
    color: colors.primaryDark,
  },
  section: {
    backgroundColor: colors.white,
    borderColor: colors.surfaceMuted,
    borderRadius: 18,
    borderWidth: 1,
    padding: spacing.md,
  },
  sectionDescription: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  sectionMuted: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    flexDirection: 'row',
    padding: spacing.md,
    columnGap: spacing.sm,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  summaryBlock: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.md,
    rowGap: spacing.md,
  },
  title: {
    ...typography.title,
    color: colors.text,
    lineHeight: 31,
  },
});

export default OpportunityDetailScreen;
