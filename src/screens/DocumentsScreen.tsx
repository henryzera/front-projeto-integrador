import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  // Modal, // SUBMISSION FEATURE DISABLED
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  // TextInput, // SUBMISSION FEATURE DISABLED
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '../components/AnimatedPressable';
import {
  // createDocument, // SUBMISSION FEATURE DISABLED
  deleteDocument,
  getDocumentsSummary,
  listDocuments,
  updateDocument,
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

const statusOptions: { label: string; status: DocumentStatus }[] = [
  { label: 'Pendente', status: 'pending' },
  { label: 'Em dia', status: 'ok' },
  { label: 'Atenção', status: 'attention' },
  { label: 'Vencido', status: 'expired' },
];

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
    icon: 'ellipse-outline',
    label: 'Pendente',
  },
};

export function DocumentsScreen() {
  const { token } = useAuth();
  // SUBMISSION FEATURE DISABLED — states below belong to the document creation flow.
  // const [categoryTitle, setCategoryTitle] = useState('Regularidade Fiscal');
  // const [expiresAt, setExpiresAt] = useState('');
  // const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  // const [isSaving, setIsSaving] = useState(false);
  // const [newDocumentName, setNewDocumentName] = useState('');
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

  // SUBMISSION FEATURE DISABLED — functions below handle document creation.
  // const handleOpenCreateModal = (): void => {
  //   setCategoryTitle(documentGroups[0]?.title || 'Regularidade Fiscal');
  //   setExpiresAt('');
  //   setNewDocumentName('');
  //   setIsCreateModalVisible(true);
  // };
  //
  // const handleCreateDocument = async (): Promise<void> => {
  //   if (!token || !newDocumentName.trim()) {
  //     setError('Informe o nome do item do checklist.');
  //     return;
  //   }
  //   try {
  //     setError('');
  //     setIsSaving(true);
  //     await createDocument(token, {
  //       categoryId: slugify(categoryTitle),
  //       categoryTitle: categoryTitle.trim() || 'Checklist do MEI',
  //       expiresAt: toIsoDate(expiresAt),
  //       name: newDocumentName.trim(),
  //       status: 'pending',
  //     });
  //     setIsCreateModalVisible(false);
  //     await loadDocuments();
  //   } catch {
  //     setError('Nao foi possivel criar o item do checklist.');
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };

  const handleUpdateStatus = async (document: UserDocument, status: DocumentStatus): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      setError('');
      await updateDocument(token, document.id, { status });
      await loadDocuments();
    } catch {
      setError('Nao foi possivel atualizar este item agora.');
    }
  };

  const handleDeleteDocument = async (document: UserDocument): Promise<void> => {
    if (!token) {
      return;
    }

    try {
      setError('');
      await deleteDocument(token, document.id);
      await loadDocuments();
    } catch {
      setError('Nao foi possivel remover este item agora.');
    }
  };

  const handleDocumentPress = (document: UserDocument): void => {
    Alert.alert(
      document.name,
      'Atualize o status deste item do checklist educativo.',
      [
        ...statusOptions.map((option) => ({
          text: option.label,
          onPress: () => {
            void handleUpdateStatus(document, option.status);
          },
        })),
        {
          style: 'destructive' as const,
          text: 'Remover',
          onPress: () => {
            Alert.alert('Remover item', 'Deseja remover este item do checklist?', [
              { style: 'cancel', text: 'Cancelar' },
              {
                style: 'destructive',
                text: 'Remover',
                onPress: () => {
                  void handleDeleteDocument(document);
                },
              },
            ]);
          },
        },
        { style: 'cancel', text: 'Cancelar' },
      ],
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
          <View style={styles.healthCard}>
            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: healthProgressWidth }]} />
            </View>
            <Text style={styles.healthText}>{summary.healthPercent}% dos documentos estão em dia</Text>
          </View>
          {/* SUBMISSION FEATURE DISABLED — add-item button removed.
          <AnimatedPressable
            accessibilityLabel="Adicionar item ao checklist"
            accessibilityRole="button"
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
            onPress={handleOpenCreateModal}>
            <Ionicons color={colors.primaryDark} name="add" size={28} />
            <Text style={styles.addButtonText}>Item</Text>
          </AnimatedPressable>
          */}

          <Text style={styles.educationalNote}>
            Use este checklist para se preparar. Ele nao substitui certidoes oficiais nem valida sua habilitacao juridica.
          </Text>

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
                        <DocumentRow
                          document={document}
                          index={index}
                          key={document.id}
                          onPress={() => handleDocumentPress(document)}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* SUBMISSION FEATURE DISABLED — create-document modal removed.
        <Modal animationType="slide" transparent visible={isCreateModalVisible}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Novo item do checklist</Text>
              <TextInput
                onChangeText={setNewDocumentName}
                placeholder="Ex: Certidao municipal"
                placeholderTextColor={colors.textSecondary}
                style={styles.modalInput}
                value={newDocumentName}
              />
              <TextInput
                onChangeText={setCategoryTitle}
                placeholder="Categoria"
                placeholderTextColor={colors.textSecondary}
                style={styles.modalInput}
                value={categoryTitle}
              />
              <TextInput
                keyboardType="numbers-and-punctuation"
                onChangeText={setExpiresAt}
                placeholder="Vencimento opcional: AAAA-MM-DD"
                placeholderTextColor={colors.textSecondary}
                style={styles.modalInput}
                value={expiresAt}
              />
              <View style={styles.modalActions}>
                <AnimatedPressable
                  accessibilityRole="button"
                  disabled={isSaving}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                  onPress={() => setIsCreateModalVisible(false)}>
                  <Text style={styles.secondaryButtonText}>Cancelar</Text>
                </AnimatedPressable>
                <AnimatedPressable
                  accessibilityRole="button"
                  disabled={isSaving}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                  onPress={() => {
                    void handleCreateDocument();
                  }}>
                  {isSaving ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Criar</Text>
                  )}
                </AnimatedPressable>
              </View>
            </View>
          </View>
        </Modal>
        */}
      </Animated.View>
    </SafeAreaView>
  );
}

function DocumentRow({
  document,
  index,
  onPress,
}: {
  document: UserDocument;
  index: number;
  onPress: () => void;
}) {
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
      <AnimatedPressable
        accessibilityLabel={`${document.name}. ${status.label}`}
        accessibilityRole="button"
        style={({ pressed }) => [styles.documentAction, pressed && styles.pressed]}
        onPress={onPress}>
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
      </AnimatedPressable>
    </Animated.View>
  );
}

function getDocumentSubtitle(document: UserDocument): string {
  if (document.status === 'pending') {
    return 'Pendente de atualização';
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

// SUBMISSION FEATURE DISABLED \u2014 helpers below are used only by the create-document flow.
// function slugify(value: string): string {
//   return (
//     value
//       .trim()
//       .toLocaleLowerCase('pt-BR')
//       .normalize('NFD')
//       .replace(/[\u0300-\u036f]/g, '')
//       .replace(/[^a-z0-9]+/g, '-')
//       .replace(/(^-|-$)/g, '') || 'checklist-mei'
//   );
// }
//
// function toIsoDate(value: string): string | undefined {
//   if (!value.trim()) {
//     return undefined;
//   }
//   const date = new Date(`${value.trim()}T00:00:00`);
//   if (Number.isNaN(date.getTime())) {
//     return undefined;
//   }
//   return date.toISOString();
// }

const styles = StyleSheet.create({
  // SUBMISSION FEATURE DISABLED — addButton and addButtonText styles belong to the add-item button.
  // addButton: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: 20, height: 64, justifyContent: 'center', width: 72 },
  // addButtonText: { ...typography.tabLabel, color: colors.primaryDark },
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
  documentAction: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minHeight: 64,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    columnGap: spacing.sm,
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
    backgroundColor: colors.white,
    borderColor: colors.surfaceMuted,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  educationalNote: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
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
  // SUBMISSION FEATURE DISABLED — modal styles below belong to the create-document modal.
  // modalActions: { flexDirection: 'row', columnGap: spacing.sm },
  // modalContent: { backgroundColor: colors.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: spacing.lg, rowGap: spacing.md },
  // modalInput: { ...typography.body, backgroundColor: colors.surface, borderColor: colors.surfaceMuted, borderRadius: 14, borderWidth: 1, color: colors.text, minHeight: 50, paddingHorizontal: spacing.md },
  // modalOverlay: { backgroundColor: 'rgba(0,0,0,0.24)', flex: 1, justifyContent: 'flex-end' },
  // modalTitle: { ...typography.title, color: colors.text },
  // SUBMISSION FEATURE DISABLED
  // primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 16, flex: 1, minHeight: 50, justifyContent: 'center' },
  // primaryButtonText: { ...typography.button, color: colors.white },
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
  // SUBMISSION FEATURE DISABLED — statusRow was the row containing health card + add button.
  // statusRow: { alignItems: 'center', flexDirection: 'row', columnGap: spacing.sm },
  statusText: {
    ...typography.tabLabel,
    fontSize: 11,
  },
  // SUBMISSION FEATURE DISABLED
  // secondaryButton: { alignItems: 'center', borderColor: colors.surfaceMuted, borderRadius: 16, borderWidth: 1, flex: 1, minHeight: 50, justifyContent: 'center' },
  // secondaryButtonText: { ...typography.button, color: colors.text },
});

export default DocumentsScreen;
