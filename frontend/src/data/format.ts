import type { FiltroJornada, StatusAssinatura, StatusAtividade, StatusJornada } from './types';

// "2026-09-01" -> "01/09/2026"
export function formatarData(iso?: string) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

// "2026-10-03" -> "03/10"
export function formatarDataCurta(iso: string) {
  const [, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}`;
}

// Texto do prazo no card da atividade: "até 03/10", "vence hoje", "venceu em 03/10"
export function textoPrazo(prazo: string, hoje: string) {
  if (prazo === hoje) return 'vence hoje';
  if (prazo < hoje) return `venceu em ${formatarDataCurta(prazo)}`;
  return `até ${formatarDataCurta(prazo)}`;
}

export const STATUS_ATIVIDADE: Record<StatusAtividade, { label: string; cor: string }> = {
  concluida: { label: 'Concluído', cor: '#8FB59A' },
  em_andamento: { label: 'Em andamento', cor: '#8F95B4' },
  pendente: { label: 'Pendente', cor: '#D9DE8F' },
  atrasada: { label: 'Atrasado', cor: '#B79A9C' },
};

export const STATUS_JORNADA: Record<StatusJornada, { label: string; cor: string }> = {
  atrasada: { label: 'Atrasado', cor: '#B79A9C' },
  em_andamento: { label: 'Em andamento', cor: '#8F95B4' },
  pendente: { label: 'Pendente', cor: '#D9DE8F' },
  concluida: { label: 'Concluída', cor: '#8FB59A' },
};

export const ROTULO_FILTRO_JORNADA: Record<FiltroJornada, string> = {
  em_onboarding: 'Colaboradores em onboarding',
  concluidas: 'Jornadas concluídas',
  atrasadas: 'Jornadas atrasadas',
};

export const STATUS_ASSINATURA: Record<StatusAssinatura, { label: string; cor: string }> = {
  concluido: { label: 'Concluído', cor: '#8FB59A' },
  pendente: { label: 'Pendente', cor: '#D9DE8F' },
};