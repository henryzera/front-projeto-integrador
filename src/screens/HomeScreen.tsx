import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StreamingNotice } from '../components/StreamingNotice';
import {
  HomeFilterTabs,
  HomeSearchBar,
  OpportunityCard,
  type HomeFilter,
  type OpportunityCardVariant,
} from '../components/home';
import type { StreamingLicitacao } from '../hooks';
import { listContratacoes, type Contratacao } from '../services';
import { useAuth, useLicitacoesStream } from '../store';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types/navigation';
import { configureNextLayoutAnimation } from '../utils/motion';

type OpportunityColumnItem = {
  item: Contratacao;
  originalIndex: number;
  variant: OpportunityCardVariant;
};

type OpportunityColumns = {
  left: OpportunityColumnItem[];
  right: OpportunityColumnItem[];
};

const opportunitiesLimit = 12;
const compatibilityScores = [80, 76, 92, 84, 88, 72];

export function HomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const { eventSequence, isConnected, novaLicitacao } = useLicitacoesStream();
  const [activeFilter, setActiveFilter] = useState<HomeFilter>('mei');
  const [contratacoes, setContratacoes] = useState<Contratacao[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [municipioFilter, setMunicipioFilter] = useState('Recife');
  const [query, setQuery] = useState('');
  const [streamNotice, setStreamNotice] = useState<{ description: string; title: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [ufFilter, setUfFilter] = useState('PE');
  const processedStreamSequence = useRef(0);

  const loadContratacoes = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const response = await listContratacoes(token, {
        limit: opportunitiesLimit,
        meOnly: activeFilter === 'mei' ? true : undefined,
        municipio: activeFilter === 'location' ? municipioFilter.trim() : undefined,
        q: query.trim() || undefined,
        skip: 0,
        status: statusFilter.trim() || undefined,
        uf: activeFilter === 'location' ? ufFilter.trim().toLocaleUpperCase('pt-BR') : undefined,
      });
      setContratacoes(response.data);
      setTotal(response.total || response.data.length);
    } catch {
      setError('Nao foi possivel carregar as licitacoes agora.');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, municipioFilter, query, statusFilter, token, ufFilter]);

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

  const columns = useMemo(() => splitIntoColumns(contratacoes), [contratacoes]);

  const handleClearSearch = (): void => {
    setQuery('');
  };

  const visibleCount = total || contratacoes.length;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Encontramos {visibleCount} oportunidades para o seu perfil</Text>
      </View>

      <View style={styles.body}>
        <HomeSearchBar query={query} onChangeQuery={setQuery} onClear={handleClearSearch} />
        <HomeFilterTabs activeFilter={activeFilter} onChangeFilter={setActiveFilter} />
        <View style={styles.filterRow}>
          <TextInput
            autoCapitalize="words"
            onChangeText={setMunicipioFilter}
            placeholder="Cidade"
            placeholderTextColor={colors.textSecondary}
            style={styles.filterInput}
            value={municipioFilter}
          />
          <TextInput
            autoCapitalize="characters"
            maxLength={2}
            onChangeText={(value) => setUfFilter(value.toLocaleUpperCase('pt-BR'))}
            placeholder="UF"
            placeholderTextColor={colors.textSecondary}
            style={[styles.filterInput, styles.ufInput]}
            value={ufFilter}
          />
          <TextInput
            autoCapitalize="words"
            onChangeText={setStatusFilter}
            placeholder="Status"
            placeholderTextColor={colors.textSecondary}
            style={styles.filterInput}
            value={statusFilter}
          />
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

          <View style={styles.grid}>
            <View style={styles.column}>
              {columns.left.map(({ item, originalIndex, variant }) => (
                <OpportunityCard
                  compatibility={getCompatibilityScore(originalIndex, item)}
                  item={item}
                  key={item._id}
                  onPress={() => navigation.navigate('OpportunityDetail', { id: item._id })}
                  variant={variant}
                />
              ))}
            </View>

            <View style={[styles.column, styles.rightColumn]}>
              {columns.right.map(({ item, originalIndex, variant }) => (
                <OpportunityCard
                  compatibility={getCompatibilityScore(originalIndex, item)}
                  item={item}
                  key={item._id}
                  onPress={() => navigation.navigate('OpportunityDetail', { id: item._id })}
                  variant={variant}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function splitIntoColumns(items: Contratacao[]): OpportunityColumns {
  return items.reduce<OpportunityColumns>(
    (columns, item, index) => {
      const columnItem: OpportunityColumnItem = {
        item,
        originalIndex: index,
        variant: index % 3 === 0 ? 'compact' : 'media',
      };

      if (index % 2 === 0) {
        columns.left.push(columnItem);
      } else {
        columns.right.push(columnItem);
      }

      return columns;
    },
    {
      left: [],
      right: [],
    },
  );
}

function getCompatibilityScore(index: number, item?: Contratacao): number {
  return item?.compatibilityScore || compatibilityScores[index % compatibilityScores.length];
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
  column: {
    flex: 1,
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
  filterInput: {
    ...typography.caption,
    backgroundColor: colors.surface,
    borderColor: colors.surfaceMuted,
    borderRadius: 14,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    minHeight: 44,
    paddingHorizontal: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
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
  rightColumn: {
    marginLeft: spacing.md,
  },
  ufInput: {
    flex: 0.46,
    textAlign: 'center',
  },
});

export default HomeScreen;
