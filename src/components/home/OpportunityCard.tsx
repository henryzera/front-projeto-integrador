import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedPressable } from '../AnimatedPressable';
import type { Contratacao } from '../../services';
import { colors, spacing, typography } from '../../theme';

export interface OpportunityCardProps {
  item: Contratacao;
  compatibility?: number;
  onPress?: () => void;
}

type CompatibilityTier = {
  badgeColor: string;
  textColor: string;
  label: string;
};

// Faixas de aderencia: alto (>=80), medio (>=60) e baixo (<60).
function getCompatibilityTier(score: number): CompatibilityTier {
  if (score >= 80) {
    return { badgeColor: '#E2F7EE', label: 'Alta', textColor: '#0F8A57' };
  }

  if (score >= 60) {
    return { badgeColor: '#FFF1D6', label: 'Média', textColor: '#9A6700' };
  }

  return { badgeColor: '#FDE3E1', label: 'Baixa', textColor: colors.error };
}

export function OpportunityCard({ item, compatibility, onPress }: OpportunityCardProps) {
  const title = item.objetoCompra || 'Objeto da licitação';
  const issuer = getIssuer(item);
  // Exibimos somente o score real vindo da API. Quando ausente, mostramos um estado neutro.
  const hasScore = typeof compatibility === 'number' && Number.isFinite(compatibility);
  const tier = hasScore ? getCompatibilityTier(compatibility as number) : null;
  const scoreLabel = hasScore
    ? `${compatibility}% compatível, aderência ${tier?.label}`
    : 'sem score de compatibilidade';

  return (
    <AnimatedPressable
      accessibilityLabel={`${title}. ${scoreLabel}`}
      accessibilityRole="button"
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}>
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
          {hasScore && tier ? (
            <View style={[styles.compatibilityPill, { backgroundColor: tier.badgeColor }]}>
              <Ionicons color={tier.textColor} name="sparkles" size={12} />
              <Text style={[styles.compatibilityPillText, { color: tier.textColor }]}>
                {compatibility}% compatível · {tier.label}
              </Text>
            </View>
          ) : (
            <View style={styles.neutralPill}>
              <Text style={styles.neutralPillText}>Sem score</Text>
            </View>
          )}
        </View>

        <Ionicons color={colors.text} name="arrow-forward" size={24} />
      </View>
    </AnimatedPressable>
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

  if (item.municipioNome) {
    return `${item.municipioNome} ${item.uf || ''}`.trim();
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
    return 'Prazo a confirmar';
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
  compatibilityPill: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 999,
    columnGap: 4,
    flexDirection: 'row',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  compatibilityPillText: {
    ...typography.tabLabel,
    fontWeight: '700',
  },
  container: {
    marginBottom: spacing.xl,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
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
  neutralPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 999,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  neutralPillText: {
    ...typography.tabLabel,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.78,
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
