/*
 * Modelo dos PDFs gerados pelo app (termos aceitos, termo de conclusão do onboarding).
 * Cada documento é uma lista de blocos; quem desenha é o abrir-pdf.web.ts (navegador, jspdf)
 * ou o abrir-pdf.ts (celular, expo-print). Assim os dois ficam com o mesmo conteúdo.
 */

export type Bloco =
  | { tipo: 'marca'; texto: string } // "On the job", no topo
  | { tipo: 'titulo'; texto: string }
  | { tipo: 'subtitulo'; texto: string } // linha cinza logo abaixo do título
  // `reservar` (mm): espaço mínimo para o que vem depois; se não couber, a seção começa na próxima página
  | { tipo: 'secao'; texto: string; reservar?: number }
  | { tipo: 'subsecao'; texto: string; reservar?: number }
  | { tipo: 'texto'; texto: string; pequeno?: boolean }
  | { tipo: 'campos'; itens: [string, string][] } // "Rótulo: valor", um por linha
  | { tipo: 'tabela'; colunas: { titulo: string; largura: number }[]; linhas: string[][] } // largura em fração (soma 1)
  | { tipo: 'assinaturas'; itens: { papel: string; nome: string; data: string }[] }
  | { tipo: 'separador' };

export type DocumentoPdf = {
  titulo: string; // título da janela / propriedades do arquivo
  arquivo: string; // nome do arquivo ao baixar
  blocos: Bloco[];
};

// "2026-10-29 14:03:11" -> "29/10/2026 às 14:03"  |  "2026-10-29" -> "29/10/2026"
export function dataHora(valor?: string) {
  if (!valor) return '-';
  const [data, hora] = valor.split(/[ T]/);
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}${hora ? ` às ${hora.slice(0, 5)}` : ''}`;
}
