import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { DeadlineAlert } from '../services';

const isWeb = Platform.OS === 'web';

// Quantos dias antes da data critica devemos avisar o usuario.
const defaultDaysBeforeDeadline = 2;
// Prefixo usado para identificar e cancelar agendamentos antes de reagendar.
const scheduledNotificationPrefix = 'deadline-';

let handlerConfigured = false;

/**
 * Configura o handler global de notificacoes (como elas aparecem com o app aberto).
 * Idempotente e seguro em web (no-op).
 */
export function configureNotificationHandler(): void {
  if (isWeb || handlerConfigured) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  handlerConfigured = true;
}

/**
 * Pede permissao para enviar notificacoes locais.
 * Retorna false em web ou quando o usuario nega.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (isWeb) {
    return false;
  }

  try {
    const current = await Notifications.getPermissionsAsync();

    if (current.granted) {
      return true;
    }

    if (!current.canAskAgain) {
      return false;
    }

    const requested = await Notifications.requestPermissionsAsync();

    return requested.granted;
  } catch {
    return false;
  }
}

type ScheduleDeadlineOptions = {
  id: string;
  title: string;
  body: string;
  date: Date;
};

/**
 * Agenda uma notificacao local para a data informada.
 * - Em web e no-op (retorna null).
 - Evita duplicar: cancela qualquer agendamento previo com o mesmo id antes de reagendar.
 * - Ignora datas no passado (retorna null).
 */
export async function scheduleDeadlineNotification(
  opts: ScheduleDeadlineOptions,
): Promise<string | null> {
  if (isWeb) {
    return null;
  }

  const triggerDate = opts.date;

  if (Number.isNaN(triggerDate.getTime()) || triggerDate.getTime() <= Date.now()) {
    return null;
  }

  const identifier = `${scheduledNotificationPrefix}${opts.id}`;

  try {
    configureNotificationHandler();

    // Cancela um agendamento anterior com o mesmo id para nao duplicar.
    await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => undefined);

    await Notifications.scheduleNotificationAsync({
      content: {
        body: opts.body,
        title: opts.title,
      },
      identifier,
      trigger: {
        date: triggerDate,
        type: Notifications.SchedulableTriggerInputTypes.DATE,
      },
    });

    return identifier;
  } catch {
    return null;
  }
}

/**
 * Recebe a lista de alertas/editais e agenda avisos locais para os que tem
 * data critica futura. Por padrao agenda o aviso `defaultDaysBeforeDeadline`
 * dias antes da data; se isso ja tiver passado, agenda para a propria data.
 * Retorna os identificadores efetivamente agendados.
 */
export async function scheduleAlertsDeadlineNotifications(
  alerts: DeadlineAlert[],
  daysBeforeDeadline: number = defaultDaysBeforeDeadline,
): Promise<string[]> {
  if (isWeb || alerts.length === 0) {
    return [];
  }

  const scheduledIds: string[] = [];

  for (const alert of alerts) {
    const criticalDate = parseAlertDate(alert.date);

    if (!criticalDate) {
      continue;
    }

    const reminderDate = new Date(criticalDate);
    reminderDate.setDate(reminderDate.getDate() - daysBeforeDeadline);

    // Se o aviso antecipado ja passou, tenta usar a propria data critica.
    const targetDate = reminderDate.getTime() > Date.now() ? reminderDate : criticalDate;

    const identifier = await scheduleDeadlineNotification({
      body: alert.description || 'Confira os detalhes desta oportunidade.',
      date: targetDate,
      id: alert.id,
      title: alert.title || 'Prazo de proposta se aproximando',
    });

    if (identifier) {
      scheduledIds.push(identifier);
    }
  }

  return scheduledIds;
}

function parseAlertDate(value: string): Date | null {
  if (!value) {
    return null;
  }

  // As datas dos alertas chegam como "YYYY-MM-DD"; ancoramos no fim do dia local.
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isoDateOnly ? `${value}T23:59:59` : value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}
