import type { PropsWithChildren } from 'react';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    setParams: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  Redirect: () => null,
  Link: ({ children }: PropsWithChildren) => children ?? null,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: PropsWithChildren) => children ?? null,
  SafeAreaView: ({ children }: PropsWithChildren) => children ?? null,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

const armazenamento = new Map<string, string>();
const localStorageFake = {
  get length() {
    return armazenamento.size;
  },
  clear: () => armazenamento.clear(),
  getItem: (chave: string) => armazenamento.get(chave) ?? null,
  key: (indice: number) => Array.from(armazenamento.keys())[indice] ?? null,
  removeItem: (chave: string) => armazenamento.delete(chave),
  setItem: (chave: string, valor: string) => armazenamento.set(chave, String(valor)),
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorageFake,
});

beforeEach(() => {
  localStorageFake.clear();
  jest.clearAllMocks();
});
