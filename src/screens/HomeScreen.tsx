import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/Button';
import { listContratacoes, type Contratacao } from '../services';
import { useAuth } from '../store';
import { colors, spacing, typography } from '../theme';

export function HomeScreen() {
  const { signOut, token, user } = useAuth();
  const [contratacoes, setContratacoes] = useState<Contratacao[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadContratacoes = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const response = await listContratacoes(token, 5);
      setContratacoes(response.data);
    } catch {
      setError('Nao foi possivel carregar as licitacoes agora.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadContratacoes();
  }, [loadContratacoes]);

  const handleSignOutPress = (): void => {
    void signOut();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.textGroup}>
          <Text style={styles.eyebrow}>Bem-vindo(a), {user?.firstName}</Text>
          <Text style={styles.title}>Licitações disponíveis</Text>
          <Text style={styles.description}>
            Dados carregados do MongoDB Atlas pela API autenticada.
          </Text>
        </View>

        <Button title="Atualizar" onPress={loadContratacoes} />

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loading} /> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.list}>
          {contratacoes.map((item) => (
            <View key={item._id} style={styles.item}>
              <Text numberOfLines={2} style={styles.itemTitle}>
                {item.objetoCompra || 'Objeto nao informado'}
              </Text>
              <Text style={styles.itemMeta}>
                {item.unidadeOrgao?.municipioNome || 'Municipio'} / {item.unidadeOrgao?.ufSigla || 'UF'}
              </Text>
              <Text style={styles.itemMeta}>{item.modalidadeNome || 'Modalidade nao informada'}</Text>
              <Text style={styles.itemValue}>
                Valor estimado: {formatCurrency(item.valorTotalEstimado)}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity activeOpacity={0.7} onPress={handleSignOutPress} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function formatCurrency(value?: number): string {
  if (typeof value !== 'number') {
    return 'nao informado';
  }

  return Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value);
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: spacing.lg,
  },
  errorText: {
    ...typography.body,
    color: '#B42318',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  eyebrow: {
    ...typography.body,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  item: {
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: spacing.sm,
    borderWidth: 1,
    padding: spacing.md,
    rowGap: spacing.xs,
  },
  itemMeta: {
    ...typography.body,
    color: colors.textSecondary,
  },
  itemTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  itemValue: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '700',
  },
  list: {
    marginTop: spacing.lg,
    rowGap: spacing.md,
  },
  loading: {
    marginTop: spacing.lg,
  },
  logoutButton: {
    alignSelf: 'center',
    marginTop: spacing.xl,
  },
  logoutText: {
    ...typography.button,
    color: colors.primary,
  },
  textGroup: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
  },
});

export default HomeScreen;
