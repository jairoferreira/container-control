import { Platform } from "react-native";

// No app nativo, o padding de área segura já vem de useSafeAreaInsets().
// No web, quando instalado como PWA em tela cheia no iOS/Android, a área
// segura (notch, barra de status) só é respeitada via env(safe-area-inset-*)
// no CSS — por isso usamos calc() em vez de somar números diretamente.
export function safeTop(insetsTop: number, extra: number): number | string {
  if (Platform.OS === "web") return `calc(env(safe-area-inset-top, 0px) + ${extra}px)`;
  return insetsTop + extra;
}

export function safeBottom(insetsBottom: number, extra: number): number | string {
  if (Platform.OS === "web") return `calc(env(safe-area-inset-bottom, 0px) + ${extra}px)`;
  return insetsBottom + extra;
}
