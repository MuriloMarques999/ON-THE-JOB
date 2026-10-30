import type { Bloco, DocumentoPdf } from './modelo';

/*
 * Desenha o documento com o jspdf (navegador) e abre em uma nova aba; se o navegador bloquear a aba,
 * o arquivo é baixado. No celular, quem desenha é o abrir-pdf.ts (expo-print).
 *
 * O jspdf é carregado só no clique e pela versão de navegador (jspdf.es.min.js): a versão "node",
 * que o Expo Router usaria ao pré-renderizar as páginas no servidor, quebra o bundle do Metro.
 */

const MARGEM = 18;
const LARGURA = 210 - 2 * MARGEM; // A4 em mm
const TOPO = 20;
const LIMITE = 297 - 20;
const TEAL: [number, number, number] = [37, 98, 107];
const pt = (tamanho: number) => tamanho * 0.3528; // pontos -> mm

export async function abrirPdf(documento: DocumentoPdf) {
  // A aba é aberta já no clique (o navegador bloqueia abas abertas depois de uma espera)
  const aba = window.open('', '_blank');

  const { jsPDF } = await import('jspdf/dist/jspdf.es.min.js');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = TOPO;

  function cabe(altura: number) {
    if (y + altura > LIMITE) {
      doc.addPage();
      y = TOPO;
    }
  }

  function fonte(tamanho: number, estilo: 'normal' | 'bold' | 'italic' = 'normal', cor: [number, number, number] = [17, 17, 17]) {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tamanho);
    doc.setTextColor(...cor);
  }

  function escrever(texto: string, tamanho: number, estilo: 'normal' | 'bold' | 'italic' = 'normal', depois = 2, cor?: [number, number, number]) {
    fonte(tamanho, estilo, cor);
    const altura = pt(tamanho) * 1.4;
    for (const linha of doc.splitTextToSize(texto, LARGURA) as string[]) {
      cabe(altura);
      doc.text(linha, MARGEM, y);
      y += altura;
    }
    y += depois;
  }

  function tabela(b: Extract<Bloco, { tipo: 'tabela' }>) {
    const larguras = b.colunas.map((c) => c.largura * LARGURA);
    const tamanho = 8;
    const linhaAltura = pt(tamanho) * 1.3;
    const folga = 1.6;

    function linha(celulas: string[], cabecalho: boolean) {
      fonte(tamanho, cabecalho ? 'bold' : 'normal', cabecalho ? [255, 255, 255] : [17, 17, 17]);
      const quebradas = celulas.map((c, i) => doc.splitTextToSize(c, larguras[i] - 2 * folga) as string[]);
      const altura = Math.max(...quebradas.map((q) => q.length)) * linhaAltura + 2 * folga;

      if (y + altura > LIMITE) {
        doc.addPage();
        y = TOPO;
        if (!cabecalho) linha(b.colunas.map((c) => c.titulo), true); // repete o cabeçalho na nova página
        fonte(tamanho, cabecalho ? 'bold' : 'normal', cabecalho ? [255, 255, 255] : [17, 17, 17]);
      }

      let x = MARGEM;
      doc.setDrawColor(190, 190, 190);
      if (cabecalho) doc.setFillColor(...TEAL);
      doc.rect(MARGEM, y, LARGURA, altura, cabecalho ? 'FD' : 'S');
      quebradas.forEach((q, i) => {
        doc.text(q, x + folga, y + folga + pt(tamanho));
        x += larguras[i];
      });
      y += altura;
    }

    linha(b.colunas.map((c) => c.titulo), true);
    b.linhas.forEach((l) => linha(l, false));
    y += 4;
  }

  function assinaturas(b: Extract<Bloco, { tipo: 'assinaturas' }>) {
    const largura = (LARGURA - 10 * (b.itens.length - 1)) / b.itens.length;
    cabe(34);
    b.itens.forEach((a, i) => {
      const x = MARGEM + i * (largura + 10);
      doc.setDrawColor(...TEAL);
      doc.setLineDashPattern([1, 1], 0);
      doc.roundedRect(x, y, largura, 30, 2, 2, 'S');
      doc.setLineDashPattern([], 0);
      fonte(13, 'italic', TEAL);
      doc.text(a.nome, x + largura / 2, y + 11, { align: 'center', maxWidth: largura - 6 });
      doc.setDrawColor(120, 120, 120);
      doc.line(x + 6, y + 15, x + largura - 6, y + 15);
      fonte(9, 'bold');
      doc.text(a.papel, x + largura / 2, y + 20, { align: 'center' });
      fonte(8, 'normal', [80, 80, 80]);
      doc.text(`Assinado digitalmente em ${a.data}`, x + largura / 2, y + 25, { align: 'center' });
    });
    y += 36;
  }

  for (const b of documento.blocos) {
    switch (b.tipo) {
      case 'marca':
        escrever(b.texto, 10, 'bold', 1, TEAL);
        break;
      case 'titulo':
        escrever(b.texto, 17, 'bold', 1);
        break;
      case 'subtitulo':
        escrever(b.texto, 9, 'normal', 6, [90, 90, 90]);
        break;
      case 'secao':
        y += 2;
        cabe(b.reservar ?? 14);
        escrever(b.texto, 12, 'bold', 2, TEAL);
        break;
      case 'subsecao':
        if (y > TOPO) y += 3;
        cabe(b.reservar ?? 14);
        escrever(b.texto, 10, 'bold', 1.5);
        break;
      case 'texto':
        escrever(b.texto, b.pequeno ? 8.5 : 10, 'normal', 3, b.pequeno ? [90, 90, 90] : undefined);
        break;
      case 'campos':
        for (const [rotulo, valor] of b.itens) {
          fonte(10, 'bold');
          const larguraRotulo = doc.getTextWidth(`${rotulo}: `);
          const linhas = doc.splitTextToSize(valor, LARGURA - larguraRotulo) as string[];
          cabe(pt(10) * 1.4 * linhas.length);
          doc.text(`${rotulo}:`, MARGEM, y);
          fonte(10);
          doc.text(linhas, MARGEM + larguraRotulo, y);
          y += pt(10) * 1.4 * linhas.length + 0.6;
        }
        y += 3;
        break;
      case 'tabela':
        tabela(b);
        break;
      case 'assinaturas':
        assinaturas(b);
        break;
      case 'separador':
        cabe(8);
        doc.setDrawColor(...TEAL);
        doc.line(MARGEM, y, MARGEM + LARGURA, y);
        y += 7;
        break;
    }
  }

  // Numeração das páginas
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    fonte(8, 'normal', [110, 110, 110]);
    doc.text(documento.titulo, MARGEM, 297 - 10);
    doc.text(`Página ${i} de ${paginas}`, 210 - MARGEM, 297 - 10, { align: 'right' });
  }

  doc.setProperties({ title: documento.titulo });
  if (aba) aba.location.href = URL.createObjectURL(doc.output('blob'));
  else doc.save(documento.arquivo);
}
