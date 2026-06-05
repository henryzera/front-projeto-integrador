import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { StreamingNotice } from '../components/StreamingNotice';
import type { StreamingLicitacao } from '../hooks';
import {
  listAlerts,
  markAlertAsRead,
  resolveAlert,
  type AlertKind,
  type DeadlineAlert,
} from '../services';
import { useAuth, useLicitacoesStream } from '../store';
import { colors, spacing, typography } from '../theme';
import type { RootStackParamList } from '../types/navigation';
import { configureNextLayoutAnimation } from '../utils/motion';
import {
  requestNotificationPermission,
  scheduleAlertsDeadlineNotifications,
} from '../utils/notifications';

type AlertTab = 'calendar' | 'list';
type AlertFilter = 'action' | 'all';

type CalendarDay = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
};

type AlertKindStyle = {
  backgroundColor: string;
  color: string;
  dotColor: string;
  label: string;
  priority: number;
};

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const weekdayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const shortWeekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const alertKindStyles: Record<AlertKind, AlertKindStyle> = {
  documentExpired: {
    backgroundColor: '#FFE8EA',
    color: '#D92D32',
    dotColor: '#FF3B45',
    label: 'Vencido',
    priority: 1,
  },
  info: {
    backgroundColor: '#D9ECFF',
    color: '#1676D2',
    dotColor: '#349DF5',
    label: 'Informativo',
    priority: 5,
  },
  proposalCritical: {
    backgroundColor: '#FFD5DC',
    color: '#B4232A',
    dotColor: '#FF3B45',
    label: 'Urgente',
    priority: 1,
  },
  proposalSafe: {
    backgroundColor: '#CFF5D7',
    color: '#07953B',
    dotColor: '#00DD39',
    label: 'No prazo',
    priority: 4,
  },
  proposalSoon: {
    backgroundColor: '#FFF0B8',
    color: '#B27A00',
    dotColor: '#FFCC00',
    label: 'Em breve',
    priority: 2,
  },
};

const detailLabels: Partial<Record<AlertKind, string>> = {
  info: 'Informativo (ex: novo edital compatível com seu perfil)',
  proposalCritical: 'Data limite para entrega de proposta',
  proposalSafe: 'Data de publicação de edital',
  proposalSoon: 'Prazo intermediário (esclarecimentos)',
};

export function AlertsScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { token } = useAuth();
  const { eventSequence, isConnected, novaLicitacao } = useLicitacoesStream();
  const today = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState<AlertTab>('list');
  const [alerts, setAlerts] = useState<DeadlineAlert[]>([]);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<AlertFilter>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [streamNotice, setStreamNotice] = useState<{ description: string; title: string } | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const processedStreamSequence = useRef(0);
  const screenProgress = useRef(new Animated.Value(0)).current;
  const tabProgress = useRef(new Animated.Value(1)).current;
  const notificationsRequested = useRef(false);

  const visibleAlerts = useMemo(() => {
    const sortedAlerts = [...alerts].sort((firstAlert, secondAlert) => {
      const firstPriority = firstAlert.priority || alertKindStyles[firstAlert.kind].priority;
      const secondPriority = secondAlert.priority || alertKindStyles[secondAlert.kind].priority;

      if (firstPriority !== secondPriority) {
        return firstPriority - secondPriority;
      }

      return firstAlert.date.localeCompare(secondAlert.date);
    });

    if (filter === 'action') {
      return sortedAlerts.filter((alert) => (alert.priority || alertKindStyles[alert.kind].priority) <= 2);
    }

    return sortedAlerts;
  }, [alerts, filter]);

  const calendarDays = useMemo(
    () => getCalendarDays(calendarYear, calendarMonth),
    [calendarMonth, calendarYear],
  );

  const selectedDateEvents = useMemo(
    () =>
      alerts
        .filter((alert) => alert.date === selectedDate)
        .sort((firstAlert, secondAlert) => {
          const firstPriority = firstAlert.priority || alertKindStyles[firstAlert.kind].priority;
          const secondPriority = secondAlert.priority || alertKindStyles[secondAlert.kind].priority;

          return firstPriority - secondPriority;
        }),
    [alerts, selectedDate],
  );

  const actionCount = alerts.filter((alert) => (alert.priority || alertKindStyles[alert.kind].priority) <= 2).length;

  const loadAlerts = useCallback(async () => {
    if (!token) {
      return;
    }

    const { from, to } = getMonthRange(calendarYear, calendarMonth);

    try {
      setError('');
      setIsLoading(true);
      const response = await listAlerts(token, {
        from,
        to,
        view: activeTab,
      });
      setAlerts(response.data);
    } catch {
      setError('Nao foi possivel carregar seus alertas agora.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, calendarMonth, calendarYear, token]);

  const handleTabChange = (nextTab: AlertTab): void => {
    if (nextTab === activeTab) {
      return;
    }

    configureNextLayoutAnimation();
    setActiveTab(nextTab);
  };

  const handleFilterPress = (): void => {
    configureNextLayoutAnimation();
    setFilter((currentFilter) => (currentFilter === 'all' ? 'action' : 'all'));
  };

  const handlePreviousMonth = (): void => {
    configureNextLayoutAnimation();
    setCalendarMonth((currentMonth) => {
      if (currentMonth === 0) {
        setCalendarYear((currentYear) => currentYear - 1);
        return 11;
      }

      return currentMonth - 1;
    });
  };

  const handleNextMonth = (): void => {
    configureNextLayoutAnimation();
    setCalendarMonth((currentMonth) => {
      if (currentMonth === 11) {
        setCalendarYear((currentYear) => currentYear + 1);
        return 0;
      }

      return currentMonth + 1;
    });
  };

  const handleSelectDate = (date: string): void => {
    if (date !== selectedDate) {
      configureNextLayoutAnimation();
    }

    setSelectedDate(date);
  };

  const handleResolveAlert = async (alertId: string): Promise<void> => {
    if (isLocalStreamingAlert(alertId)) {
      configureNextLayoutAnimation();
      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) =>
          alert.id === alertId ? { ...alert, status: 'resolved' } : alert,
        ),
      );
      return;
    }

    if (!token) {
      return;
    }

    try {
      const response = await resolveAlert(token, alertId);
      setAlerts((currentAlerts) =>
        currentAlerts.map((alert) => (alert.id === alertId ? { ...alert, ...response.alert } : alert)),
      );
    } catch {
      setError('Nao foi possivel resolver o alerta agora.');
    }
  };

  const handleEventPress = async (alert: DeadlineAlert): Promise<void> => {
    if (isLocalStreamingAlert(alert.id) && alert.status === 'open') {
      setAlerts((currentAlerts) =>
        currentAlerts.map((currentAlert) =>
          currentAlert.id === alert.id ? { ...currentAlert, status: 'read' } : currentAlert,
        ),
      );
    } else if (token && alert.status === 'open') {
      try {
        const response = await markAlertAsRead(token, alert.id);
        setAlerts((currentAlerts) =>
          currentAlerts.map((currentAlert) =>
            currentAlert.id === alert.id ? { ...currentAlert, ...response.alert } : currentAlert,
          ),
        );
      } catch {
        // A leitura do alerta nao deve impedir o usuario de ver o conteudo.
      }
    }

    const actionButtons =
      alert.relatedType === 'contratacao' && alert.relatedId
        ? [
            {
              text: 'Ver oportunidade',
              onPress: () => navigation.navigate('OpportunityDetail', { id: alert.relatedId || '' }),
            },
          ]
        : [];

    Alert.alert(alert.title, `${alert.description}\n${alertKindStyles[alert.kind].label}`, [
      ...actionButtons,
      {
        text: 'Resolver',
        onPress: () => {
          void handleResolveAlert(alert.id);
        },
      },
      {
        style: 'cancel',
        text: 'OK',
      },
    ]);
  };

  useEffect(() => {
    Animated.timing(screenProgress, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [screenProgress]);

  useEffect(() => {
    tabProgress.setValue(0);
    Animated.timing(tabProgress, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [activeTab, tabProgress]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (alerts.length === 0) {
      return;
    }

    let isMounted = true;

    async function scheduleDeadlineReminders() {
      // Pede permissao apenas uma vez por sessao para nao incomodar o usuario.
      if (!notificationsRequested.current) {
        notificationsRequested.current = true;
        const granted = await requestNotificationPermission();

        if (!granted) {
          return;
        }
      }

      if (!isMounted) {
        return;
      }

      // Agenda lembretes apenas para alertas que pedem acao (prazos criticos/proximos).
      const actionableAlerts = alerts.filter(
        (alert) => (alert.priority || alertKindStyles[alert.kind].priority) <= 2,
      );

      const scheduledIds = await scheduleAlertsDeadlineNotifications(actionableAlerts);

      if (scheduledIds.length > 0) {
        console.log(`[Alertas] ${scheduledIds.length} lembrete(s) de prazo agendado(s).`, scheduledIds);
      }
    }

    void scheduleDeadlineReminders();

    return () => {
      isMounted = false;
    };
  }, [alerts]);

  useEffect(() => {
    if (!novaLicitacao || eventSequence === 0 || processedStreamSequence.current === eventSequence) {
      return;
    }

    processedStreamSequence.current = eventSequence;

    const nextAlert = mapStreamingToAlert(novaLicitacao);

    if (alerts.some((alert) => alert.id === nextAlert.id)) {
      return;
    }

    configureNextLayoutAnimation();
    setAlerts((currentAlerts) => [nextAlert, ...currentAlerts]);
    setStreamNotice({
      description: nextAlert.description,
      title: nextAlert.title,
    });
  }, [alerts, eventSequence, novaLicitacao]);

  useEffect(() => {
    if (!streamNotice) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setStreamNotice(null);
    }, 4500);

    return () => clearTimeout(timeoutId);
  }, [streamNotice]);

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

  const tabMotionStyle = {
    opacity: tabProgress,
    transform: [
      {
        translateX: tabProgress.interpolate({
          inputRange: [0, 1],
          outputRange: activeTab === 'list' ? [-10, 0] : [10, 0],
        }),
      },
    ],
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Prazos e Alertas</Text>
      </View>

      <Animated.View style={[styles.body, screenMotionStyle]}>
        <View style={styles.segmentedControl}>
          <SegmentedButton
            isActive={activeTab === 'list'}
            label="Lista"
            onPress={() => handleTabChange('list')}
          />
          <SegmentedButton
            isActive={activeTab === 'calendar'}
            label="Calendário"
            onPress={() => handleTabChange('calendar')}
          />
        </View>

        <View style={styles.liveStatus}>
          <View style={[styles.liveDot, isConnected ? styles.liveDotOn : styles.liveDotOff]} />
          <Text style={styles.liveStatusText}>
            {isConnected ? 'Alertas em tempo real ativos' : 'Reconectando alertas em tempo real'}
          </Text>
        </View>
        {streamNotice ? (
          <View style={styles.streamNoticeWrapper}>
            <StreamingNotice description={streamNotice.description} title={streamNotice.title} />
          </View>
        ) : null}

        <Animated.View style={[styles.tabContent, tabMotionStyle]}>
          {activeTab === 'list' ? (
            <ListTab
              actionCount={actionCount}
              error={error}
              filter={filter}
              isLoading={isLoading}
              onRefresh={loadAlerts}
              onEventPress={handleEventPress}
              onFilterPress={handleFilterPress}
              visibleAlerts={visibleAlerts}
            />
          ) : (
            <CalendarTab
              alerts={alerts}
              calendarDays={calendarDays}
              calendarMonth={calendarMonth}
              calendarYear={calendarYear}
              error={error}
              isLoading={isLoading}
              onEventPress={handleEventPress}
              onNextMonth={handleNextMonth}
              onPreviousMonth={handlePreviousMonth}
              onRefresh={loadAlerts}
              onSelectDate={handleSelectDate}
              selectedDate={selectedDate}
              selectedDateEvents={selectedDateEvents}
            />
          )}
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

function SegmentedButton({
  isActive,
  label,
  onPress,
}: {
  isActive: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      wrapperStyle={styles.segmentButtonFrame}
      style={({ pressed }) => [
        styles.segmentButton,
        isActive && styles.segmentButtonActive,
        pressed && styles.pressed,
      ]}
      onPress={onPress}>
      <Text style={[styles.segmentLabel, isActive && styles.segmentLabelActive]}>{label}</Text>
    </AnimatedPressable>
  );
}

function ListTab({
  actionCount,
  error,
  filter,
  isLoading,
  onEventPress,
  onFilterPress,
  onRefresh,
  visibleAlerts,
}: {
  actionCount: number;
  error: string;
  filter: AlertFilter;
  isLoading: boolean;
  onEventPress: (alert: DeadlineAlert) => void | Promise<void>;
  onFilterPress: () => void;
  onRefresh: () => void;
  visibleAlerts: DeadlineAlert[];
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          onRefresh={onRefresh}
          refreshing={isLoading}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}>
      <View style={styles.listHeader}>
        <View>
          <Text style={styles.sectionTitle}>Lista de Eventos</Text>
          <Text style={styles.sectionCaption}>
            {filter === 'all' ? `${actionCount} pedem atenção` : 'Mostrando prioridades'}
          </Text>
        </View>

        <AnimatedPressable
          accessibilityLabel="Alternar filtro de prioridade"
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.filterButton,
            filter === 'action' && styles.filterButtonActive,
            pressed && styles.pressed,
          ]}
          onPress={onFilterPress}>
          <Ionicons
            color={filter === 'action' ? colors.primaryDark : colors.text}
            name="filter-outline"
            size={28}
          />
        </AnimatedPressable>
      </View>

      <View style={styles.divider} />

      {isLoading && visibleAlerts.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.feedback} />
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isLoading && !error && visibleAlerts.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum alerta encontrado para este período.</Text>
      ) : null}

      <View style={styles.alertList}>
        {visibleAlerts.map((alert, index) => (
          <AlertListItem
            alert={alert}
            index={index}
            key={alert.id}
            onPress={() => onEventPress(alert)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function AlertListItem({
  alert,
  index,
  onPress,
}: {
  alert: DeadlineAlert;
  index: number;
  onPress: () => void | Promise<void>;
}) {
  const style = alertKindStyles[alert.kind];
  const itemProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    itemProgress.setValue(0);
    Animated.timing(itemProgress, {
      delay: index * 30,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [alert.id, index, itemProgress]);

  return (
    <Animated.View
      style={{
        opacity: itemProgress,
        transform: [
          {
            translateY: itemProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [8, 0],
            }),
          },
        ],
      }}>
      <AnimatedPressable
        accessibilityLabel={`${alert.title}. ${alert.description}. ${style.label}`}
        accessibilityRole="button"
        style={({ pressed }) => [styles.alertItem, pressed && styles.pressed]}
        onPress={onPress}>
        <View style={[styles.alertDot, { backgroundColor: style.dotColor }]} />
        <View style={styles.alertCopy}>
          <Text numberOfLines={1} style={styles.alertTitle}>
            {alert.title}
          </Text>
          <Text numberOfLines={1} style={[styles.alertDescription, { color: style.dotColor }]}>
            {alert.description}
          </Text>
        </View>
        <Ionicons color={colors.text} name="ellipsis-vertical" size={20} />
      </AnimatedPressable>
    </Animated.View>
  );
}

function CalendarTab({
  alerts,
  calendarDays,
  calendarMonth,
  calendarYear,
  error,
  isLoading,
  onEventPress,
  onNextMonth,
  onPreviousMonth,
  onRefresh,
  onSelectDate,
  selectedDate,
  selectedDateEvents,
}: {
  alerts: DeadlineAlert[];
  calendarDays: CalendarDay[];
  calendarMonth: number;
  calendarYear: number;
  error: string;
  isLoading: boolean;
  onEventPress: (alert: DeadlineAlert) => void | Promise<void>;
  onNextMonth: () => void;
  onPreviousMonth: () => void;
  onRefresh: () => void;
  onSelectDate: (date: string) => void;
  selectedDate: string;
  selectedDateEvents: DeadlineAlert[];
}) {
  return (
    <ScrollView
      contentContainerStyle={styles.calendarContent}
      refreshControl={
        <RefreshControl
          colors={[colors.primary]}
          onRefresh={onRefresh}
          refreshing={isLoading}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}>
      <View style={styles.calendarCard}>
        <View style={styles.calendarToolbar}>
          <AnimatedPressable
            accessibilityLabel="Mês anterior"
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.calendarArrow, pressed && styles.pressed]}
            onPress={onPreviousMonth}>
            <Ionicons color={colors.text} name="chevron-back" size={24} />
          </AnimatedPressable>

          <View style={styles.monthSelector}>
            <Text style={styles.monthSelectorText}>{monthNames[calendarMonth]}</Text>
            <Ionicons color={colors.text} name="chevron-down" size={14} />
          </View>

          <View style={styles.yearSelector}>
            <Text style={styles.monthSelectorText}>{calendarYear}</Text>
            <Ionicons color={colors.text} name="chevron-down" size={14} />
          </View>

          <AnimatedPressable
            accessibilityLabel="Próximo mês"
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.calendarArrow, pressed && styles.pressed]}
            onPress={onNextMonth}>
            <Ionicons color={colors.text} name="chevron-forward" size={24} />
          </AnimatedPressable>
        </View>

        <View style={styles.weekHeader}>
          {shortWeekdayLabels.map((weekday) => (
            <Text key={weekday} style={styles.weekdayText}>
              {weekday}
            </Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {calendarDays.map((day) => {
            const dateKey = toDateKey(day.date);
            const dayEvents = alerts.filter((alert) => alert.date === dateKey);
            const markerStyle = getDayMarkerStyle(dayEvents);
            const isSelected = selectedDate === dateKey;

            return (
              <AnimatedPressable
                accessibilityLabel={`${day.day} de ${monthNames[day.date.getMonth()]}`}
                accessibilityRole="button"
                key={dateKey}
                style={({ pressed }) => [
                  styles.calendarDay,
                  markerStyle && {
                    backgroundColor: markerStyle.dotColor,
                  },
                  isSelected && styles.calendarDaySelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => onSelectDate(dateKey)}>
                <Text
                  style={[
                    styles.calendarDayText,
                    !day.isCurrentMonth && styles.calendarDayMutedText,
                    markerStyle && styles.calendarDayMarkedText,
                    isSelected && styles.calendarDaySelectedText,
                  ]}>
                  {day.day}
                </Text>
              </AnimatedPressable>
            );
          })}
        </View>
      </View>

      {isLoading && selectedDateEvents.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={styles.feedback} />
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.dayPanel}>
        <View style={styles.selectedDateBadge}>
          <Text style={styles.selectedDateDay}>{getSelectedDay(selectedDate)}</Text>
          <Text style={styles.selectedDateWeekday}>{getWeekday(selectedDate)}</Text>
        </View>

        <View style={styles.dayEvents}>
          {selectedDateEvents.length > 0 ? (
            selectedDateEvents.map((alert, index) => (
              <CalendarEventPill
                alert={alert}
                index={index}
                key={alert.id}
                onPress={() => onEventPress(alert)}
              />
            ))
          ) : (
            <View style={styles.emptyDay}>
              <Ionicons color={colors.textSecondary} name="checkmark-circle-outline" size={22} />
              <Text style={styles.emptyDayText}>Nenhum prazo para este dia</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function CalendarEventPill({
  alert,
  index,
  onPress,
}: {
  alert: DeadlineAlert;
  index: number;
  onPress: () => void | Promise<void>;
}) {
  const style = alertKindStyles[alert.kind];
  const label = detailLabels[alert.kind] || alert.title;
  const itemProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    itemProgress.setValue(0);
    Animated.timing(itemProgress, {
      delay: index * 40,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [alert.id, index, itemProgress]);

  return (
    <Animated.View
      style={{
        opacity: itemProgress,
        transform: [
          {
            translateX: itemProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [10, 0],
            }),
          },
        ],
      }}>
      <AnimatedPressable
        accessibilityLabel={`${label}. ${style.label}`}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.calendarEventPill,
          { backgroundColor: style.backgroundColor },
          pressed && styles.pressed,
        ]}
        onPress={onPress}>
        <View style={[styles.calendarEventDot, { backgroundColor: style.dotColor }]} />
        <Text numberOfLines={2} style={styles.calendarEventText}>
          {label}
        </Text>
        <Ionicons color={colors.text} name="chevron-forward" size={20} />
      </AnimatedPressable>
    </Animated.View>
  );
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDate = new Date(year, month, 1);
  const firstWeekday = firstDate.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const visibleDays = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const startDate = new Date(year, month, 1 - firstWeekday);

  return Array.from({ length: visibleDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
    };
  });
}

function getDayMarkerStyle(dayEvents: DeadlineAlert[]): AlertKindStyle | undefined {
  return dayEvents.reduce<AlertKindStyle | undefined>((currentStyle, alert) => {
    const nextStyle = alertKindStyles[alert.kind];

    if (!currentStyle || nextStyle.priority < currentStyle.priority) {
      return nextStyle;
    }

    return currentStyle;
  }, undefined);
}

function mapStreamingToAlert(licitacao: StreamingLicitacao): DeadlineAlert {
  const location = [licitacao.municipioNome, licitacao.uf].filter(Boolean).join('/');
  const description = licitacao.objetoCompra || 'Novo edital publicado pelo PNCP';

  return {
    date: getStreamingDateKey(licitacao.dataAtualizacao),
    description: location ? `${description} - ${location}` : description,
    id: getStreamingAlertId(licitacao._id),
    kind: 'info',
    priority: 3,
    relatedId: licitacao._id,
    relatedType: 'contratacao',
    status: 'open',
    title: 'Nova oportunidade MEI/EPP',
  };
}

function getStreamingAlertId(id: string): string {
  return `stream-${id}`;
}

function isLocalStreamingAlert(id: string): boolean {
  return id.startsWith('stream-');
}

function getStreamingDateKey(value: string | null): string {
  if (!value) {
    return toDateKey(new Date());
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return toDateKey(new Date());
  }

  return toDateKey(date);
}

function getSelectedDay(dateKey: string): string {
  return String(new Date(`${dateKey}T00:00:00`).getDate());
}

function getWeekday(dateKey: string): string {
  const weekdayIndex = new Date(`${dateKey}T00:00:00`).getDay();

  return weekdayLabels[weekdayIndex].toUpperCase().replace('.', '');
}

function getMonthRange(year: number, month: number): { from: string; to: string } {
  return {
    from: toDateKey(new Date(year, month, 1)),
    to: toDateKey(new Date(year, month + 1, 0)),
  };
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const styles = StyleSheet.create({
  alertCopy: {
    flex: 1,
    minWidth: 0,
  },
  alertDescription: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
  alertDot: {
    borderRadius: 999,
    height: 32,
    width: 32,
  },
  alertItem: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: spacing.xl,
    columnGap: spacing.md,
  },
  alertList: {
    paddingTop: spacing.xs,
    rowGap: spacing.sm,
  },
  alertTitle: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '700',
  },
  body: {
    backgroundColor: colors.white,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  calendarArrow: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  calendarCard: {
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 14,
    borderWidth: 1,
    padding: spacing.lg,
  },
  calendarContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  calendarDay: {
    alignItems: 'center',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  calendarDayMarkedText: {
    color: colors.text,
    fontWeight: '700',
  },
  calendarDayMutedText: {
    color: colors.iconMuted,
  },
  calendarDaySelected: {
    backgroundColor: '#303238',
  },
  calendarDaySelectedText: {
    color: colors.white,
  },
  calendarDayText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 16,
  },
  calendarEventDot: {
    borderRadius: 999,
    height: 32,
    width: 32,
  },
  calendarEventPill: {
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: spacing.sm,
    columnGap: spacing.sm,
  },
  calendarEventText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 16,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.sm,
  },
  calendarToolbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  container: {
    backgroundColor: colors.primary,
    flex: 1,
  },
  dayEvents: {
    rowGap: spacing.sm,
  },
  dayPanel: {
    backgroundColor: '#ECECEC',
    borderRadius: 22,
    marginTop: spacing.lg,
    padding: spacing.lg,
    rowGap: spacing.md,
  },
  divider: {
    backgroundColor: colors.text,
    height: StyleSheet.hairlineWidth,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  emptyDay: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 18,
    flexDirection: 'row',
    minHeight: 48,
    paddingHorizontal: spacing.md,
    columnGap: spacing.sm,
  },
  emptyDayText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  filterButton: {
    alignItems: 'center',
    borderRadius: 16,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  filterButtonActive: {
    backgroundColor: colors.surfaceMuted,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  feedback: {
    marginTop: spacing.lg,
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
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 999,
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    columnGap: spacing.sm,
  },
  liveStatusText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  listHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: spacing.sm,
  },
  monthSelector: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    height: 36,
    justifyContent: 'center',
    minWidth: 76,
    paddingHorizontal: spacing.sm,
    columnGap: spacing.xs,
  },
  monthSelectorText: {
    ...typography.caption,
    color: colors.text,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.7,
  },
  sectionCaption: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '700',
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: colors.white,
    shadowColor: colors.text,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.07,
    shadowRadius: 6,
  },
  segmentButtonFrame: {
    flex: 1,
  },
  segmentLabel: {
    ...typography.button,
    color: colors.iconMuted,
  },
  segmentLabelActive: {
    color: '#697086',
  },
  segmentedControl: {
    alignSelf: 'center',
    backgroundColor: '#FAFAFA',
    borderColor: '#EEEEEE',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    height: 44,
    padding: 3,
    width: '90%',
    elevation: 2,
    shadowColor: colors.text,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  selectedDateBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderRadius: 999,
    flexDirection: 'row',
    minHeight: 36,
    paddingHorizontal: spacing.md,
    columnGap: spacing.sm,
  },
  selectedDateDay: {
    ...typography.title,
    color: colors.text,
  },
  selectedDateWeekday: {
    ...typography.button,
    color: colors.text,
  },
  streamNoticeWrapper: {
    marginTop: spacing.md,
  },
  tabContent: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    width: 40,
  },
  yearSelector: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.grayLight,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    height: 36,
    justifyContent: 'center',
    minWidth: 88,
    paddingHorizontal: spacing.sm,
    columnGap: spacing.xs,
  },
});

export default AlertsScreen;
