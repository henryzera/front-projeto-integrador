import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import {
  getDocumentsSummary,
  listDocuments,
  type DocumentGroup,
  type DocumentsSummary,
  type DocumentStatus,
  type UserDocument,
} from '../services';
import { useAuth } from '../store';
import { colors, spacing, typography } from '../theme';
import { configureNextLayoutAnimation } from '../utils/motion';

type StatusStyle = {
  backgroundColor: string;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const emptySummary: DocumentsSummary = {
  categoriesCount: 0,
  expiredCount: 0,
  healthPercent: 0,
  pendingCount: 0,
};

const statusStyles: Record<DocumentStatus, StatusStyle> = {
  attention: {
    backgroundColor: '#FFF3E5',
    color: colors.warning,
    icon: 'time',
    label: 'Atenção',
  },
  expired: {
    backgroundColor: '#FDEBE9',
    color: colors.error,
    icon: 'alert-circle',
    label: 'Vencido',
  },
  ok: {
    backgroundColor: '#E8F5F2',
    color: colors.primaryDark,
    icon: 'checkmark-circle',
    label: 'Em dia',
  },
  pending: {
    backgroundColor: '#EDF0F2',
    color: colors.textSecondary,
    icon: 'cloud-upload',
    label: 'Enviar',
  },
};

export function DocumentsScreen() {
  const { token } = useAuth();
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);
  const [error, setError] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<DocumentsSummary>(emptySummary);
  const healthProgress = useRef(new Animated.Value(0)).current;
  const screenProgress = useRef(new Animated.Value(0)).current;

  const loadDocuments = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const [nextSummary, documentsResponse] = await Promise.all([
        getDocumentsSummary(token),
        listDocuments(token),
      ]);

      setSummary(nextSummary);
      setDocumentGroups(documentsResponse.groups);
      setExpandedGroupId((currentGroupId) => currentGroupId || documentsResponse.groups[0]?.id);
    } catch {
      setError('Nao foi possivel carregar seus documentos agora.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleToggleGroup = (groupId: string): void => {
    configureNextLayoutAnimation();
    setExpandedGroupId((currentGroupId) => (currentGroupId === groupId ? undefined : groupId));
  };

  const handleUploadPress = (): void => {
    Alert.alert(
      'Envio de documento',
      'O fluxo de envio ainda está mockado, mas este será o atalho para anexar novas certidões.',
    );
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenProgress, {
        duration: 260,
        easing: Easing.out(Easing.cubic),
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(healthProgress, {
        delay: 120,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        toValue: summary.healthPercent,
        useNativeDriver: false,
      }),
    ]).start();
  }, [healthProgress, screenProgress, summary.healthPercent]);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const screenMotionStyle = {
    opacity: screenProgress,
    transform: [
      {
        translateY: screenProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [12, 0],
        }),
      },
    ],
  };

  const healthProgressWidth = healthProgress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Documentos</Text>
      </View>

      <Animated.View style={[styles.body, screenMotionStyle]}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              colors={[colors.primary]}
              onRefresh={loadDocuments}
              refreshing={isLoading}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}>
          <View style={styles.statusRow}>
            <View style={styles.healthCard}>
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: healthProgressWidth }]} />
              </View>
              <Text style={styles.healthText}>{summary.healthPercent}% dos documentos estão em dia</Text>
            </View>

            <AnimatedPressable
              accessibilityLabel="Enviar novo documento"
              accessibilityRole="button"
              style={({ pressed }) => [styles.uploadButton, pressed && styles.pressed]}
              onPress={handleUploadPress}>
              <Ionicons color={colors.primaryDark} name="cloud-upload-outline" size={36} />
            </AnimatedPressable>
          </View>

          <View style={styles.insightRow}>
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{summary.categoriesCount}</Text>
              <Text style={styles.insightLabel}>categorias</Text>
            </View>
            <View style={styles.insightDivider} />
            <View style={styles.insightItem}>
              <Text style={styles.insightValue}>{summary.pendingCount}</Text>
              <Text style={styles.insightLabel}>pedem ação</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {isLoading && documentGroups.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={styles.feedback} />
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {!isLoading && !error && documentGroups.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum documento cadastrado ainda.</Text>
          ) : null}

          <View style={styles.groups}>
            {documentGroups.map((group) => {
              const isExpanded = expandedGroupId === group.id;

              return (
                <View key={group.id} style={styles.groupBlock}>
                  <AnimatedPressable
                    accessibilityLabel={`${group.title}, ${group.summary}`}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                    style={({ pressed }) => [styles.groupHeader, pressed && styles.pressed]}
                    onPress={() => handleToggleGroup(group.id)}>
                    <Ionicons
                      color={colors.text}
                      name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                      size={16}
                    />
                    <View style={styles.groupTitleArea}>
                      <Text numberOfLines={1} style={styles.groupTitle}>
                        {group.title}
                      </Text>
                      <Text style={styles.groupSummary}>{group.summary}</Text>
                    </View>
                  </AnimatedPressable>

                  {isExpanded ? (
                    <View style={styles.documentList}>
                      {group.documents.map((document, index) => (
                        <DocumentRow document={document} index={index} key={document.id} />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

function DocumentRow({ document, index }: { document: UserDocument; index: number }) {
  const status = statusStyles[document.status];
  const itemProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    itemProgress.setValue(0);
    Animated.timing(itemProgress, {
      delay: index * 45,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [index, itemProgress]);

  return (
    <Animated.View
      style={[
        styles.documentRow,
        {
          opacity: itemProgress,
          transform: [
            {
              translateY: itemProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        },
      ]}>
      <View style={styles.documentIcon}>
        <Ionicons color={colors.primaryDark} name="document-text-outline" size={20} />
      </View>

      <View style={styles.documentInfo}>
        <Text numberOfLines={1} style={styles.documentName}>
          {document.name}
        </Text>
        <Text numberOfLines={1} style={styles.documentDate}>
          {getDocumentSubtitle(document)}
        </Text>
      </View>

      <View style={[styles.statusBadge, { backgroundColor: status.backgroundColor }]}>
        <Ionicons color={status.color} name={status.icon} size={13} />
        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
      </View>
    </Animated.View>
  );
}

function getDocumentSubtitle(document: UserDocument): string {
  if (document.status === 'pending') {
    return 'Aguardando envio';
  }

  if (document.expiresAt) {
    const expiresAt = formatDate(document.expiresAt);

    if (document.status === 'expired') {
      return `Venceu em ${expiresAt}`;
    }

    return `Vence em ${expiresAt}`;
  }

  if (document.updatedAt) {
    return `Atualizado em ${formatDate(document.updatedAt)}`;
  }

  return 'Sem vencimento informado';
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'data indisponível';
  }

  return Intl.DateTimeFormat('pt-BR').format(date);
}

const styles = StyleSheet.create({
  body: {
    backgroundColor: colors.white,
    flex: 1,
  },
  container: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  content: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
  },
  divider: {
    backgroundColor: colors.text,
    height: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  feedback: {
    marginBottom: spacing.md,
  },
  documentDate: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  documentIcon: {
    alignItems: 'center',
    backgroundColor: '#E8F5F2',
    borderRadius: 14,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  documentInfo: {
    flex: 1,
    minWidth: 0,
  },
  documentList: {
    marginTop: spacing.sm,
    rowGap: spacing.sm,
  },
  documentName: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  documentRow: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.surfaceMuted,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    columnGap: spacing.sm,
  },
  groupBlock: {
    marginBottom: spacing.sm,
  },
  groupHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    flexDirection: 'row',
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    columnGap: spacing.md,
  },
  groupSummary: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
  },
  groupTitle: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
  },
  groupTitleArea: {
    flex: 1,
    minWidth: 0,
  },
  groups: {
    paddingHorizontal: spacing.xs,
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
  healthCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    flex: 1,
    height: 64,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
  },
  healthText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 15,
    marginTop: spacing.sm,
  },
  insightDivider: {
    backgroundColor: colors.surfaceMuted,
    height: 28,
    width: 1,
  },
  insightItem: {
    alignItems: 'center',
    flex: 1,
  },
  insightLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  insightRow: {
    alignItems: 'center',
    backgroundColor: '#F8FAFA',
    borderRadius: 18,
    flexDirection: 'row',
    marginTop: spacing.sm,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  insightValue: {
    ...typography.button,
    color: colors.text,
  },
  pressed: {
    opacity: 0.7,
  },
  progressFill: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 4,
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 4,
    overflow: 'hidden',
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    flexShrink: 0,
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    columnGap: spacing.xs,
  },
  statusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    columnGap: spacing.sm,
  },
  statusText: {
    ...typography.tabLabel,
    fontSize: 11,
  },
  uploadButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 20,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
});

export default DocumentsScreen;
