import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StreamingNotice } from '../components/StreamingNotice';
import {
  HomeFilterPanel,
  HomeSearchBar,
  OpportunityCard,
  countActiveFilters,
  defaultHomeFilters,
  resolveValueRange,
  type HomeFilters,
} from '../components/home';
import type { StreamingLicitacao } from '../hooks';
import { listContratacoes, type Contratacao } from '../services';
import { useAuth, useLicitacoesStream } from '../store';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types/navigation';
import { configureNextLayoutAnimation } from '../utils/motion';

const opportunitiesLimit = 12;

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { token, user } = useAuth();
  const { eventSequence, isConnected, novaLicitacao } = useLicitacoesStream();
  const [contratacoes, setContratacoes] = useState<Contratacao[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  // Filtros iniciam vazios (sem valores chumbados); o usuario refina pelo painel.
  const [filters, setFilters] = useState<HomeFilters>(defaultHomeFilters);
  const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
  const [streamNotice, setStreamNotice] = useState<{ description: string; title: string } | null>(null);
  const [total, setTotal] = useState(0);
  const processedStreamSequence = useRef(0);

  const hasCnae = Boolean(user?.cnae);
  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters]);

  const loadContratacoes = useCallback(async () => {
    if (!token) {
      return;
    }

    const { valorMax, valorMin } = resolveValueRange(filters.valorRange);

    try {
      setError('');
      setIsLoading(true);
      const response = await listContratacoes(token, {
        cnae: filters.compatibleCnae ? user?.cnae : undefined,
        limit: opportunitiesLimit,
        meOnly: filters.meOnly ? true : undefined,
        modalidadeNome: filters.modalidadeNome || undefined,
        municipio: filters.municipio.trim() || undefined,
        q: query.trim() || undefined,
        skip: 0,
        uf: filters.uf.trim() ? filters.uf.trim().toLocaleUpperCase('pt-BR') : undefined,
        valorMax,
        valorMin,
      });
      setContratacoes(response.data);
      setTotal(response.total || response.data.length);
    } catch {
      setError('Nao foi possivel carregar as licitacoes agora.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, query, token, user?.cnae]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadContratacoes();
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [loadContratacoes]);

  useEffect(() => {
    if (!novaLicitacao || eventSequence === 0 || processedStreamSequence.current === eventSequence) {
      return;
    }

    processedStreamSequence.current = eventSequence;

    if (contratacoes.some((item) => item._id === novaLicitacao._id)) {
      return;
    }

    const nextContratacao = mapStreamingToContratacao(novaLicitacao);
    configureNextLayoutAnimation();
    setContratacoes((currentContratacoes) => [nextContratacao, ...currentContratacoes]);
    setTotal((currentTotal) => Math.max(currentTotal + 1, contratacoes.length + 1));
    setStreamNotice({
      description: formatStreamingNoticeDescription(novaLicitacao),
      title: 'Nova licitação recebida em tempo real',
    });
  }, [contratacoes, eventSequence, novaLicitacao]);

  useEffect(() => {
    if (!streamNotice) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setStreamNotice(null);
    }, 4500);

    return () => clearTimeout(timeoutId);
  }, [streamNotice]);

  const handleClearSearch = (): void => {
    setQuery('');
  };

  const handleClearFilters = (): void => {
    setFilters(defaultHomeFilters);
  };

  const visibleCount = total || contratacoes.length;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Encontramos {visibleCount} oportunidades para o seu perfil</Text>
      </View>

      <View style={styles.body}>
        <HomeSearchBar query={query} onChangeQuery={setQuery} onClear={handleClearSearch} />
        <View style={styles.filterBar}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.8}
            onPress={() => setIsFilterPanelVisible(true)}
            style={styles.filterButton}>
            <Ionicons color={colors.primaryDark} name="options-outline" size={18} />
            <Text style={styles.filterButtonText}>Filtros</Text>
            {activeFilterCount > 0 ? (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
          {activeFilterCount > 0 ? (
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.7}
              onPress={handleClearFilters}
              style={styles.clearFiltersButton}>
              <Text style={styles.clearFiltersText}>Limpar filtros</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.liveStatus}>
          <View style={[styles.liveDot, isConnected ? styles.liveDotOn : styles.liveDotOff]} />
          <Text style={styles.liveStatusText}>
            {isConnected ? 'Streaming PNCP conectado' : 'Reconectando streaming PNCP'}
          </Text>
        </View>
        {streamNotice ? (
          <StreamingNotice description={streamNotice.description} title={streamNotice.title} />
        ) : null}

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={loadContratacoes}
              refreshing={isLoading}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}>
          {isLoading && contratacoes.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={styles.feedback} />
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!isLoading && !error && contratacoes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum edital encontrado para os filtros selecionados.</Text>
          ) : null}

          <View style={styles.list}>
            {contratacoes.map((item) => (
              <OpportunityCard
                compatibility={item.compatibilityScore}
                item={item}
                key={item._id}
                onPress={() => navigation.navigate('OpportunityDetail', { id: item._id })}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <HomeFilterPanel
        filters={filters}
        hasCnae={hasCnae}
        onChange={setFilters}
        onClear={handleClearFilters}
        onClose={() => setIsFilterPanelVisible(false)}
        visible={isFilterPanelVisible}
      />
    </SafeAreaView>
  );
}

function mapStreamingToContratacao(licitacao: StreamingLicitacao): Contratacao {
  return {
    _id: licitacao._id,
    anoCompra: licitacao.anoCompra ?? undefined,
    codigoIbge: licitacao.codigoIbge ?? undefined,
    dataAtualizacao: licitacao.dataAtualizacao ?? undefined,
    modalidadeNome: 'Streaming PNCP',
    municipioNome: licitacao.municipioNome ?? undefined,
    numeroCompra: licitacao.numeroCompra ?? undefined,
    objetoCompra: licitacao.objetoCompra ?? undefined,
    situacaoCompraNome: 'Nova oportunidade',
    uf: licitacao.uf ?? undefined,
    unidadeOrgao: {
      codigoIbge: licitacao.codigoIbge ?? undefined,
      municipioNome: licitacao.municipioNome ?? undefined,
      ufSigla: licitacao.uf ?? undefined,
    },
    valorTotalEstimado: licitacao.valorTotalEstimado ?? undefined,
  };
}

function formatStreamingNoticeDescription(licitacao: StreamingLicitacao): string {
  const location = [licitacao.municipioNome, licitacao.uf].filter(Boolean).join('/');
  const title = licitacao.objetoCompra || 'Novo edital publicado';

  return location ? `${title} - ${location}` : title;
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: colors.white,
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    rowGap: spacing.lg,
  },
  container: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.lg,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  feedback: {
    marginTop: spacing.xl,
  },
  clearFiltersButton: {
    paddingVertical: spacing.sm,
  },
  clearFiltersText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  filterBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  filterBadgeText: {
    ...typography.tabLabel,
    color: colors.white,
    fontWeight: '700',
  },
  filterBar: {
    alignItems: 'center',
    columnGap: spacing.md,
    flexDirection: 'row',
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    columnGap: spacing.sm,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterButtonText: {
    ...typography.tabLabel,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  list: {
    paddingTop: spacing.xl,
  },
  hero: {
    backgroundColor: colors.primary,
    justifyContent: 'flex-end',
    minHeight: 72,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  heroTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  liveDot: {
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  liveDotOff: {
    backgroundColor: colors.warning,
  },
  liveDotOn: {
    backgroundColor: colors.primaryDark,
  },
  liveStatus: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 999,
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    columnGap: spacing.sm,
  },
  liveStatusText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

export default HomeScreen;
