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
  getContratacaoChecklist,
  updateContratacaoChecklist,
  type Checklist,
  type ChecklistItem,
  type ContratacaoDetail,
  type OfficialLink,
  type ParticipationStatus,
} from '../services';
import { useAuth } from '../store';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types/navigation';

type OpportunityDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'OpportunityDetail'>;

type ParticipationOption = {
  value: ParticipationStatus;
  label: string;
};

const participationOptions: ParticipationOption[] = [
  { label: 'Em preparação', value: 'preparing' },
  { label: 'Enviada', value: 'submitted' },
  { label: 'Ganha', value: 'won' },
  { label: 'Perdida', value: 'lost' },
];

export function OpportunityDetailScreen({ navigation, route }: OpportunityDetailScreenProps) {
  const { token } = useAuth();
  const opportunityId = route.params.id;
  const [contratacao, setContratacao] = useState<ContratacaoDetail | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [checklistError, setChecklistError] = useState('');
  const [savingItemIds, setSavingItemIds] = useState<string[]>([]);
  const [isSavingParticipation, setIsSavingParticipation] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const response = await getContratacao(token, opportunityId);
      setContratacao(response);
    } catch {
      setError('Nao foi possivel carregar os detalhes desta oportunidade.');
    } finally {
      setIsLoading(false);
    }
  }, [opportunityId, token]);

  const loadChecklist = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setChecklistError('');
      setIsLoadingChecklist(true);
      const response = await getContratacaoChecklist(token, opportunityId);
      setChecklist(response);
    } catch {
      setChecklistError('Nao foi possivel carregar seu checklist de participacao.');
    } finally {
      setIsLoadingChecklist(false);
    }
  }, [opportunityId, token]);

  useEffect(() => {
    void loadDetail();
    void loadChecklist();
  }, [loadDetail, loadChecklist]);

  const handleRefresh = useCallback(() => {
    void loadDetail();
    void loadChecklist();
  }, [loadDetail, loadChecklist]);

  const handleToggleItem = useCallback(
    async (item: ChecklistItem) => {
      // Salvamento por item: somente o item em transito fica bloqueado.
      if (!token || !checklist || savingItemIds.includes(item.id)) {
        return;
      }

      const nextChecked = !item.checked;
      const previousItems = checklist.items;

      // Atualizacao otimista: refletimos a mudanca de imediato na UI.
      setChecklist((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) =>
                entry.id === item.id ? { ...entry, checked: nextChecked } : entry,
              ),
            }
          : current,
      );

      try {
        setSavingItemIds((current) => [...current, item.id]);
        setChecklistError('');
        const updated = await updateContratacaoChecklist(token, opportunityId, {
          items: [{ checked: nextChecked, id: item.id }],
        });
        setChecklist(updated);
      } catch {
        // Em caso de erro revertemos para o estado anterior.
        setChecklist((current) => (current ? { ...current, items: previousItems } : current));
        setChecklistError('Nao foi possivel salvar este item. Tente novamente.');
      } finally {
        setSavingItemIds((current) => current.filter((id) => id !== item.id));
      }
    },
    [checklist, opportunityId, savingItemIds, token],
  );

  const handleChangeParticipation = useCallback(
    async (status: ParticipationStatus) => {
      if (!token || !checklist || isSavingParticipation || checklist.participationStatus === status) {
        return;
      }

      const previousStatus = checklist.participationStatus;

      setChecklist((current) =>
        current ? { ...current, participationStatus: status } : current,
      );

      try {
        setIsSavingParticipation(true);
        setChecklistError('');
        const updated = await updateContratacaoChecklist(token, opportunityId, {
          participationStatus: status,
        });
        setChecklist(updated);
      } catch {
        setChecklist((current) =>
          current ? { ...current, participationStatus: previousStatus } : current,
        );
        setChecklistError('Nao foi possivel atualizar o status de participacao.');
      } finally {
        setIsSavingParticipation(false);
      }
    },
    [checklist, isSavingParticipation, opportunityId, token],
  );

  const officialLinks = useMemo(() => getOfficialLinks(contratacao), [contratacao]);

  const checklistProgress = useMemo(() => {
    const items = checklist?.items ?? [];
    const total = items.length;
    const completed = items.filter((item) => item.checked).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, percent, total };
  }, [checklist]);

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
            onRefresh={handleRefresh}
            refreshing={isLoading || isLoadingChecklist}
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
              {typeof contratacao.compatibilityScore === 'number' ? (
                <View style={styles.scoreBadge}>
                  <Ionicons color={colors.primaryDark} name="sparkles-outline" size={16} />
                  <Text style={styles.scoreText}>{contratacao.compatibilityScore}% de aderência</Text>
                </View>
              ) : (
                <View style={styles.scoreBadgeNeutral}>
                  <Text style={styles.scoreTextNeutral}>Sem score de aderência</Text>
                </View>
              )}
              <Text style={styles.title}>{contratacao.objetoCompra || 'Objeto nao informado'}</Text>
              <Text style={styles.helperText}>
                Aderencia e apenas uma indicacao para priorizar sua leitura. Confira o edital oficial antes de participar.
              </Text>
            </View>

            {contratacao.elegibilidade ? (
              <View
                style={[
                  styles.eligibilityCard,
                  contratacao.elegibilidade.dentroLimiteMei
                    ? styles.eligibilityCardOk
                    : styles.eligibilityCardWarn,
                ]}>
                <Ionicons
                  color={
                    contratacao.elegibilidade.dentroLimiteMei ? colors.primaryDark : colors.warning
                  }
                  name={
                    contratacao.elegibilidade.dentroLimiteMei
                      ? 'checkmark-circle-outline'
                      : 'alert-circle-outline'
                  }
                  size={22}
                />
                <View style={styles.eligibilityCopy}>
                  <Text style={styles.eligibilityTitle}>Elegibilidade</Text>
                  <Text style={styles.eligibilityMessage}>{contratacao.elegibilidade.mensagem}</Text>
                  {contratacao.elegibilidade.exclusivaMeEpp ? (
                    <Text style={styles.eligibilityTag}>Exclusiva para ME/EPP</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {contratacao.resumoSimplificado && contratacao.resumoSimplificado.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Entenda este edital</Text>
                <Text style={styles.sectionDescription}>
                  Resumo em linguagem simples para facilitar sua leitura.
                </Text>
                <View style={styles.bulletList}>
                  {contratacao.resumoSimplificado.map((frase, index) => (
                    <View key={`resumo-${index}`} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>{frase}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.infoGrid}>
              <InfoCard icon="cash-outline" label="Valor estimado" value={formatCurrency(getEstimatedValue(contratacao))} />
              <InfoCard icon="time-outline" label="Prazo" value={formatDate(contratacao.dataEncerramentoProposta)} />
              <InfoCard icon="business-outline" label="Orgao" value={getIssuer(contratacao)} />
              <InfoCard icon="location-outline" label="Local" value={getLocation(contratacao)} />
              <InfoCard icon="albums-outline" label="Modalidade" value={contratacao.modalidadeNome || 'Nao informada'} />
              <InfoCard icon="flag-outline" label="Situacao" value={contratacao.statusOportunidade || contratacao.situacaoCompraNome || 'A confirmar'} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cronograma</Text>
              <Text style={styles.sectionDescription}>
                Datas oficiais informadas para esta oportunidade.
              </Text>
              <View style={styles.timeline}>
                <TimelineRow
                  icon="play-outline"
                  label="Abertura das propostas"
                  value={formatDateTime(contratacao.datasImportantes?.aberturaProposta)}
                />
                <TimelineRow
                  icon="flag-outline"
                  label="Encerramento das propostas"
                  value={formatDateTime(contratacao.datasImportantes?.encerramentoProposta)}
                />
                <TimelineRow
                  icon="megaphone-outline"
                  label="Publicação no PNCP"
                  value={formatDateTime(contratacao.datasImportantes?.publicacaoPncp)}
                />
                <TimelineRow
                  icon="refresh-outline"
                  label="Última atualização"
                  value={formatDateTime(contratacao.datasImportantes?.ultimaAtualizacao)}
                />
              </View>
            </View>

            {contratacao.requisitos && contratacao.requisitos.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Requisitos</Text>
                <Text style={styles.sectionDescription}>
                  Condições de participação previstas no edital.
                </Text>
                <View style={styles.bulletList}>
                  {contratacao.requisitos.map((requisito, index) => (
                    <View key={`requisito-${index}`} style={styles.bulletRow}>
                      <View style={styles.bulletDot} />
                      <Text style={styles.bulletText}>{requisito}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status da participacao</Text>
              <Text style={styles.sectionDescription}>
                Acompanhe em que etapa do funil esta a sua proposta para esta oportunidade.
              </Text>
              <View style={styles.statusSelector}>
                {participationOptions.map((option) => {
                  const isActive = checklist?.participationStatus === option.value;

                  return (
                    <AnimatedPressable
                      accessibilityRole="button"
                      accessibilityState={{ selected: isActive }}
                      disabled={!checklist || isSavingParticipation}
                      key={option.value}
                      style={({ pressed }) => [
                        styles.statusOption,
                        isActive && styles.statusOptionActive,
                        pressed && styles.pressed,
                      ]}
                      onPress={() => {
                        void handleChangeParticipation(option.value);
                      }}>
                      <Text style={[styles.statusOptionText, isActive && styles.statusOptionTextActive]}>
                        {option.label}
                      </Text>
                    </AnimatedPressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.checklistHeader}>
                <Text style={styles.sectionTitle}>Checklist de habilitacao</Text>
                {savingItemIds.length > 0 ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : null}
              </View>
              <Text style={styles.sectionDescription}>
                Marque cada item conforme for reunindo os documentos. As alteracoes sao salvas automaticamente.
              </Text>

              {checklist && checklistProgress.total > 0 ? (
                <View style={styles.progressBlock}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>
                      {checklistProgress.completed} de {checklistProgress.total} concluídos
                    </Text>
                    <Text style={styles.progressPercent}>{checklistProgress.percent}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${checklistProgress.percent}%` }]} />
                  </View>
                </View>
              ) : null}

              {isLoadingChecklist && !checklist ? (
                <ActivityIndicator color={colors.primary} style={styles.checklistFeedback} />
              ) : null}

              {checklistError ? <Text style={styles.checklistError}>{checklistError}</Text> : null}

              {checklist && checklist.items.length > 0 ? (
                <View style={styles.checkList}>
                  {checklist.items.map((item) => {
                    const isItemSaving = savingItemIds.includes(item.id);

                    return (
                      <AnimatedPressable
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: item.checked }}
                        disabled={isItemSaving}
                        key={item.id}
                        style={({ pressed }) => [styles.checkItem, pressed && styles.pressed]}
                        onPress={() => {
                          void handleToggleItem(item);
                        }}>
                        <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                          {item.checked ? (
                            <Ionicons color={colors.white} name="checkmark" size={16} />
                          ) : null}
                        </View>
                        <View style={styles.checkItemCopy}>
                          <Text style={styles.checkText}>{item.label}</Text>
                          {item.required ? (
                            <Text style={styles.checkRequired}>Obrigatorio</Text>
                          ) : (
                            <Text style={styles.checkOptional}>Opcional</Text>
                          )}
                        </View>
                        {isItemSaving ? (
                          <ActivityIndicator color={colors.primary} size="small" />
                        ) : null}
                      </AnimatedPressable>
                    );
                  })}
                </View>
              ) : null}

              {checklist && checklist.items.length === 0 && !isLoadingChecklist ? (
                <Text style={styles.sectionDescription}>
                  Nenhum item de checklist disponivel para esta oportunidade ainda.
                </Text>
              ) : null}
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

function TimelineRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.timelineRow}>
      <View style={styles.timelineIcon}>
        <Ionicons color={colors.primaryDark} name={icon} size={16} />
      </View>
      <View style={styles.timelineCopy}>
        <Text style={styles.timelineLabel}>{label}</Text>
        <Text style={styles.timelineValue}>{value}</Text>
      </View>
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

function formatDateTime(value?: string): string {
  if (!value) {
    return 'Não informado';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Não informado';
  }

  return Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
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
    minHeight: 48,
    columnGap: spacing.sm,
  },
  checkItemCopy: {
    flex: 1,
    minWidth: 0,
  },
  checkList: {
    marginTop: spacing.sm,
    rowGap: spacing.xs,
  },
  checkOptional: {
    ...typography.tabLabel,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkRequired: {
    ...typography.tabLabel,
    color: colors.primaryDark,
    marginTop: 2,
  },
  checkText: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 20,
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.grayMedium,
    borderRadius: 8,
    borderWidth: 2,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checklistError: {
    ...typography.caption,
    color: colors.error,
    marginTop: spacing.sm,
  },
  checklistFeedback: {
    marginTop: spacing.md,
  },
  checklistHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: spacing.sm,
  },
  bulletDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 7,
    marginTop: 7,
    width: 7,
  },
  bulletList: {
    marginTop: spacing.sm,
    rowGap: spacing.sm,
  },
  bulletRow: {
    columnGap: spacing.sm,
    flexDirection: 'row',
  },
  bulletText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    lineHeight: 21,
  },
  eligibilityCard: {
    alignItems: 'flex-start',
    borderRadius: 18,
    borderWidth: 1,
    columnGap: spacing.sm,
    flexDirection: 'row',
    padding: spacing.md,
  },
  eligibilityCardOk: {
    backgroundColor: '#E8F5F2',
    borderColor: colors.primary,
  },
  eligibilityCardWarn: {
    backgroundColor: '#FCF3E7',
    borderColor: colors.warning,
  },
  eligibilityCopy: {
    flex: 1,
    rowGap: spacing.xs,
  },
  eligibilityMessage: {
    ...typography.caption,
    color: colors.text,
    lineHeight: 20,
  },
  eligibilityTag: {
    ...typography.tabLabel,
    color: colors.primaryDark,
  },
  eligibilityTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  progressBlock: {
    marginTop: spacing.sm,
    rowGap: spacing.xs,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: '100%',
  },
  progressHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  progressPercent: {
    ...typography.caption,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  scoreBadgeNeutral: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.surfaceMuted,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scoreTextNeutral: {
    ...typography.tabLabel,
    color: colors.textSecondary,
  },
  timeline: {
    marginTop: spacing.sm,
    rowGap: spacing.md,
  },
  timelineCopy: {
    flex: 1,
    rowGap: 2,
  },
  timelineIcon: {
    alignItems: 'center',
    backgroundColor: '#E8F5F2',
    borderRadius: 12,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  timelineLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  timelineRow: {
    alignItems: 'center',
    columnGap: spacing.sm,
    flexDirection: 'row',
  },
  timelineValue: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  statusOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.surfaceMuted,
    borderRadius: 999,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  statusOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusOptionText: {
    ...typography.tabLabel,
    color: colors.text,
  },
  statusOptionTextActive: {
    color: colors.white,
  },
  statusSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
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
