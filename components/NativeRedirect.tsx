'use client';

import { useEffect, useState } from 'react';

export function useIsNativeRedirecting(): boolean {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as {
      Capacitor?: { isNativePlatform?: () => boolean };
      electronAPI?: unknown;
    };
    const isCap =
      !!w.Capacitor &&
      typeof w.Capacitor.isNativePlatform === 'function' &&
      w.Capacitor.isNativePlatform();
    const isElectron = !!w.electronAPI;
    if (isCap || isElectron) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRedirecting(true);
      window.location.replace('/app/index.html');
    }
  }, []);

  return redirecting;
}

export function NativeRedirect() {
  const redirecting = useIsNativeRedirecting();
  if (!redirecting) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid #cbd5e1',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'rcdt-spin 0.7s linear infinite',
        }}
      />
      <p style={{ fontSize: 14, color: '#64748b', fontFamily: 'system-ui, sans-serif' }}>
        Ouverture du registre...
      </p>
      <style>{`@keyframes rcdt-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
