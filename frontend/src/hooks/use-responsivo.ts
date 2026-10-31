import { useSyncExternalStore } from 'react';
import { useWindowDimensions, type ViewStyle } from 'react-native';

/*
 * Layout responsivo (celular, tablet e computador).
 * O app foi desenhado para o celular: abaixo de 768px NADA muda (os estilos extras ficam vazios).
 * Em telas maiores o conteúdo ganha largura e os cartões passam a ficar lado a lado.
 *
 * Na web as páginas são pré-renderizadas no servidor (app.json: web.output "static"), onde não existe
 * tamanho de tela. Por isso a largura real só é usada depois que a página "acorda" no navegador:
 * a primeira renderização é igual à do servidor (layout de celular) e logo em seguida se ajusta.
 */

const nada = () => () => {};
// false no servidor e durante a hidratação; true depois, no navegador (e sempre no celular)
const useNoCliente = () => useSyncExternalStore(nada, () => true, () => false);

export const LARGURA_TABLET = 768;
export const LARGURA_DESKTOP = 1100;

export function useResponsivo() {
  const janela = useWindowDimensions();
  const width = useNoCliente() ? janela.width : 0;
  const largo = width >= LARGURA_TABLET; // tablet ou computador
  const desktop = width >= LARGURA_DESKTOP;

  // Área de conteúdo das telas internas (no celular continua o maxWidth 480 de cada tela)
  const conteudo: ViewStyle = largo
    ? { maxWidth: desktop ? 1120 : 760, paddingHorizontal: desktop ? 40 : 28, paddingTop: 32 }
    : {};

  // Telas de leitura ou formulário: mais largas que no celular, mas sem esticar demais
  const conteudoEstreito: ViewStyle = largo ? { maxWidth: 760, paddingHorizontal: 28, paddingTop: 32 } : {};

  // Formulários soltos (login, conclusão de conta, termos): painel branco centralizado
  const painel: ViewStyle = largo
    ? {
        maxWidth: 560,
        flexGrow: 0,
        marginVertical: 40,
        paddingHorizontal: 40,
        borderRadius: 18,
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
      }
    : {};

  return {
    largo,
    desktop,
    conteudo,
    conteudoEstreito,
    painel,
    // Quantas colunas usar, até `maximo` (celular: sempre 1; tablet: até 2)
    colunas: (maximo: number) => (desktop ? maximo : largo ? Math.min(maximo, 2) : 1),
  };
}
