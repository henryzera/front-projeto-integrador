import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  HomeFilterTabs,
  HomeSearchBar,
  OpportunityCard,
  type HomeFilter,
  type OpportunityCardVariant,
} from '../components/home';
import { listContratacoes, type Contratacao } from '../services';
import { useAuth } from '../store';
import { colors, spacing, typography } from '../theme';

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
  const { token } = useAuth();
  const [activeFilter, setActiveFilter] = useState<HomeFilter>('mei');
  const [contratacoes, setContratacoes] = useState<Contratacao[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [total, setTotal] = useState(0);

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
        municipio: activeFilter === 'location' ? 'Recife' : undefined,
        uf: activeFilter === 'location' ? 'PE' : undefined,
      });
      setContratacoes(response.data);
      setTotal(response.total || response.data.length);
    } catch {
      setError('Nao foi possivel carregar as licitacoes agora.');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, token]);

  useEffect(() => {
    void loadContratacoes();
  }, [loadContratacoes]);

  const filteredContratacoes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');

    if (!normalizedQuery) {
      return contratacoes;
    }

    return contratacoes.filter((item) => {
      const searchableText = [
        item.objetoCompra,
        item.modalidadeNome,
        item.orgaoEntidade?.razaoSocial,
        item.unidadeOrgao?.nomeUnidade,
        item.unidadeOrgao?.municipioNome,
        item.unidadeOrgao?.ufSigla,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR');

      return searchableText.includes(normalizedQuery);
    });
  }, [contratacoes, query]);

  const columns = useMemo(() => splitIntoColumns(filteredContratacoes), [filteredContratacoes]);

  const handleClearSearch = (): void => {
    setQuery('');
  };

  const visibleCount = total || contratacoes.length;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Existem {visibleCount} novos editais para o seu CNAE hoje</Text>
      </View>

      <View style={styles.body}>
        <HomeSearchBar query={query} onChangeQuery={setQuery} onClear={handleClearSearch} />
        <HomeFilterTabs activeFilter={activeFilter} onChangeFilter={setActiveFilter} />

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

          {!isLoading && !error && filteredContratacoes.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum edital encontrado para os filtros selecionados.</Text>
          ) : null}

          <View style={styles.grid}>
            <View style={styles.column}>
              {columns.left.map(({ item, originalIndex, variant }) => (
                <OpportunityCard
                  compatibility={getCompatibilityScore(originalIndex, item)}
                  item={item}
                  key={item._id}
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
  rightColumn: {
    marginLeft: spacing.md,
  },
});

export default HomeScreen;
