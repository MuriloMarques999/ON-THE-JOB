import type { StatusAtividade } from './types';

// "2026-09-01" -> "01/09/2026"
export function formatarData(iso?: string) {
  if (!iso) return '';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

export const ROTULO_STATUS_ATIVIDADE: Record<StatusAtividade, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
  atrasada: 'Atrasada',
};
