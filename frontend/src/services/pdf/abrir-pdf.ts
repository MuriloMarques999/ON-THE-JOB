import * as Print from 'expo-print';

import type { Bloco, DocumentoPdf } from './modelo';

/*
 * Celular: monta o HTML do documento, gera o PDF com o expo-print e abre a visualização do sistema,
 * de onde dá para salvar ou compartilhar. No navegador, quem desenha é o abrir-pdf.web.ts.
 */

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function html(b: Bloco): string {
  switch (b.tipo) {
    case 'marca':
      return `<div class="marca">${esc(b.texto)}</div>`;
    case 'titulo':
      return `<h1>${esc(b.texto)}</h1>`;
    case 'subtitulo':
      return `<div class="sub">${esc(b.texto)}</div>`;
    case 'secao':
      return `<h2>${esc(b.texto)}</h2>`;
    case 'subsecao':
      return `<h3>${esc(b.texto)}</h3>`;
    case 'texto':
      return `<p class="${b.pequeno ? 'pequeno' : ''}">${esc(b.texto)}</p>`;
    case 'campos':
      return `<div class="campos">${b.itens.map(([r, v]) => `<div><b>${esc(r)}:</b> ${esc(v)}</div>`).join('')}</div>`;
    case 'tabela':
      return `<table><thead><tr>${b.colunas
        .map((c) => `<th style="width:${Math.round(c.largura * 100)}%">${esc(c.titulo)}</th>`)
        .join('')}</tr></thead><tbody>${b.linhas
        .map((l) => `<tr>${l.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;
    case 'assinaturas':
      return `<div class="assinaturas">${b.itens
        .map(
          (a) =>
            `<div class="assinatura"><div class="nome">${esc(a.nome)}</div><div class="papel">${esc(a.papel)}</div><div class="data">Assinado digitalmente em ${esc(a.data)}</div></div>`
        )
        .join('')}</div>`;
    case 'separador':
      return '<hr />';
  }
}

export async function abrirPdf(documento: DocumentoPdf) {
  const pagina = `<html><head><meta charset="utf-8" /><style>
    body { font-family: Helvetica, Arial, sans-serif; margin: 28px; color: #111; font-size: 12px; }
    .marca { font-weight: bold; color: #25626B; } h1 { font-size: 20px; margin: 4px 0; }
    .sub { color: #5a5a5a; font-size: 11px; margin-bottom: 14px; }
    h2 { font-size: 14px; color: #25626B; margin: 18px 0 6px; } h3 { font-size: 12px; margin: 12px 0 4px; }
    p { line-height: 1.5; } .pequeno { font-size: 10px; color: #5a5a5a; } .campos div { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 10px; }
    th { background: #25626B; color: #fff; text-align: left; } th, td { border: 1px solid #bebebe; padding: 4px; }
    hr { border: 0; border-top: 1px solid #25626B; margin: 16px 0; }
    .assinaturas { display: flex; gap: 16px; margin-top: 8px; }
    .assinatura { flex: 1; border: 1px dashed #25626B; border-radius: 6px; padding: 10px; text-align: center; }
    .assinatura .nome { font-style: italic; font-size: 16px; color: #25626B; border-bottom: 1px solid #777; padding-bottom: 4px; }
    .assinatura .papel { font-weight: bold; margin-top: 4px; } .assinatura .data { font-size: 10px; color: #555; }
  </style></head><body>${documento.blocos.map(html).join('')}</body></html>`;

  const { uri } = await Print.printToFileAsync({ html: pagina });
  await Print.printAsync({ uri });
}
