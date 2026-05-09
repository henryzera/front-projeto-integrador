import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import type { Contratacao } from '../../services';
import { colors, spacing, typography } from '../../theme';

export type OpportunityCardVariant = 'compact' | 'media';

export interface OpportunityCardProps {
  item: Contratacao;
  compatibility: number;
  variant: OpportunityCardVariant;
}

export function OpportunityCard({ item, compatibility, variant }: OpportunityCardProps) {
  const title = item.objetoCompra || 'Objeto da licitação';
  const issuer = getIssuer(item);

  return (
    <View style={styles.container}>
      <View style={[styles.media, variant === 'compact' ? styles.compactMedia : styles.largeMedia]}>
        <Ionicons color={colors.iconMuted} name="image" size={24} />
        {variant === 'media' ? (
          <View style={styles.menuButton}>
            <Ionicons color={colors.text} name="ellipsis-horizontal" size={18} />
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text numberOfLines={4} style={styles.title}>
            {toTitleCase(title)}
          </Text>
          <Text numberOfLines={3} style={styles.issuer}>
            {issuer}
          </Text>
          <Text style={styles.detail}>• {formatCurrency(item.valorTotalEstimado)}</Text>
          <Text style={[styles.detail, styles.deadline]}>• {formatDeadline(item.dataEncerramentoProposta)}</Text>
          <Text style={[styles.detail, styles.compatibility]}>• {compatibility}% Compatível</Text>
        </View>

        <Ionicons color={colors.text} name="arrow-forward" size={24} />
      </View>
    </View>
  );
}

function getIssuer(item: Contratacao): string {
  if (item.unidadeOrgao?.nomeUnidade) {
    return item.unidadeOrgao.nomeUnidade;
  }

  if (item.orgaoEntidade?.razaoSocial) {
    return item.orgaoEntidade.razaoSocial;
  }

  if (item.unidadeOrgao?.municipioNome) {
    return `${item.unidadeOrgao.municipioNome} ${item.unidadeOrgao.ufSigla || ''}`.trim();
  }

  return 'Órgão emissor';
}

function formatCurrency(value?: number): string {
  if (typeof value !== 'number') {
    return 'Valor não informado';
  }

  return Intl.NumberFormat('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  }).format(value);
}

function formatDeadline(value?: string): string {
  if (!value) {
    return 'Data limite não informada';
  }

  const deadline = new Date(value);

  if (Number.isNaN(deadline.getTime())) {
    return 'Data limite não informada';
  }

  const formattedDate = Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(deadline);

  return `Até ${formattedDate}`;
}

function toTitleCase(value: string): string {
  return value
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toLocaleUpperCase('pt-BR')}${word.slice(1)}`)
    .join(' ');
}

const styles = StyleSheet.create({
  compactMedia: {
    height: spacing.xl,
  },
  compatibility: {
    color: colors.primary,
  },
  container: {
    marginBottom: spacing.xl,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  deadline: {
    color: colors.warning,
  },
  detail: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  issuer: {
    ...typography.body,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  largeMedia: {
    aspectRatio: 0.63,
  },
  media: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  menuButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: spacing.lg,
    height: spacing.xl,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.sm,
    top: spacing.md,
    width: spacing.xl,
  },
  textContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
    lineHeight: 24,
  },
});

export default OpportunityCard;
