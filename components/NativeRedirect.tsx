'use client';

import Script from 'next/script';

export function NativeRedirect() {
  return (
    <Script id="native-redirect" strategy="beforeInteractive">
      {`(function(){if(typeof window==='undefined')return;var c=window.Capacitor;var n=(c&&c.isNativePlatform&&c.isNativePlatform())||!!window.electronAPI;if(n&&(location.pathname==='/'||location.pathname==='/index.html')){location.replace('/app/');}})();`}
    </Script>
  );
}
