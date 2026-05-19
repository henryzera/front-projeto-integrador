import { useEffect, useRef, useState } from 'react';

import { STREAMING_WS_URL } from '../config/streaming';

export type StreamingLicitacao = {
  _id: string;
  anoCompra: number | null;
  codigoIbge: string | null;
  dataAtualizacao: string | null;
  municipioNome: string | null;
  numeroCompra: string | null;
  objetoCompra: string | null;
  uf: string | null;
  valorTotalEstimado: number | null;
};

export type LicitacoesStreamingState = {
  eventSequence: number;
  isConnected: boolean;
  lastError: string | null;
  novaLicitacao: StreamingLicitacao | null;
};

const reconnectDelayMs = 5000;

export function useLicitacoesStreaming(enabled: boolean): LicitacoesStreamingState {
  const [eventSequence, setEventSequence] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [novaLicitacao, setNovaLicitacao] = useState<StreamingLicitacao | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!enabled) {
      setEventSequence(0);
      setIsConnected(false);
      setLastError(null);
      setNovaLicitacao(null);
      return;
    }

    let shouldReconnect = true;

    const clearReconnectTimeout = () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
    };

    const connect = () => {
      clearReconnectTimeout();

      const socket = new WebSocket(STREAMING_WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        setLastError(null);
      };

      socket.onmessage = (event) => {
        const parsed = parseStreamingLicitacao(event.data);

        if (!parsed) {
          setLastError('Evento de streaming recebido em formato invalido.');
          return;
        }

        setNovaLicitacao(parsed);
        setEventSequence((currentSequence) => currentSequence + 1);
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (!shouldReconnect) {
          return;
        }

        setIsConnected(false);
        reconnectTimeout.current = setTimeout(connect, reconnectDelayMs);
      };

      socket.onerror = () => {
        setLastError('Conexao em tempo real indisponivel.');
        socket.close();
      };
    };

    connect();

    return () => {
      shouldReconnect = false;
      clearReconnectTimeout();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled]);

  return {
    eventSequence,
    isConnected,
    lastError,
    novaLicitacao,
  };
}

function parseStreamingLicitacao(data: unknown): StreamingLicitacao | null {
  try {
    const value = typeof data === 'string' ? JSON.parse(data) : data;

    if (!isRecord(value) || typeof value._id !== 'string') {
      return null;
    }

    return {
      _id: value._id,
      anoCompra: toNullableNumber(value.anoCompra),
      codigoIbge: toNullableString(value.codigoIbge),
      dataAtualizacao: toNullableString(value.dataAtualizacao),
      municipioNome: toNullableString(value.municipioNome),
      numeroCompra: toNullableString(value.numeroCompra),
      objetoCompra: toNullableString(value.objetoCompra),
      uf: normalizeUf(value.uf),
      valorTotalEstimado: toNullableNumber(value.valorTotalEstimado),
    };
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeUf(value: unknown): string | null {
  const uf = toNullableString(value);

  return uf ? uf.toLocaleUpperCase('pt-BR') : null;
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}
