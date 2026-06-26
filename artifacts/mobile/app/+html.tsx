import { ScrollViewStyleReset } from "expo-router/html";

// Documento HTML raiz usado pelo Expo Router na build web.
// Acrescenta o manifest PWA e os ícones para "Adicionar à tela inicial"
// funcionar como app nativo (tela cheia, ícone próprio, sem barra do navegador).
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <title>Cautela de Movimentação de Container</title>
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <ScrollViewStyleReset />

        {/* PWA — "Adicionar à tela inicial" */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a2361" />
        <link rel="icon" href="/favicon-32.png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* iOS: comportamento de app em tela cheia ao abrir da tela inicial */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Cautelas" />

        {/* Android/Chrome: mesmo comportamento de app instalado */}
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
