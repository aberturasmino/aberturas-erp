/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ERPPage from '../app/page';
import LoginPage from '../app/login/page';
import Loading from '../app/loading';
import { getSessionUser, logoutUser, UserSession } from '../lib/supabase';

// Tiempo de carga calibrado: 1.3 segundos (1300 ms)
const LOADING_DURATION_MS = 1300;

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [loadingTitle, setLoadingTitle] = useState<string>('Iniciando Plataforma de Depósito');
  const [loadingSubtitle, setLoadingSubtitle] = useState<string>('Conectando con Supabase y calculando balance de stock...');

  // 1. Carga inicial: exactamente 1,3 segundos al ingresar a la herramienta
  useEffect(() => {
    checkInitialAuth();
  }, []);

  const checkInitialAuth = async () => {
    const startTime = Date.now();
    try {
      const user = await getSessionUser();
      setCurrentUser(user);
    } finally {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, LOADING_DURATION_MS - elapsed);
      setTimeout(() => {
        setIsCheckingAuth(false);
      }, remaining);
    }
  };

  // 2. Control automático de expiración de sesión por seguridad (2 horas en segundo plano)
  useEffect(() => {
    if (!currentUser?.expiresAt) return;

    const checkExpiration = () => {
      const now = Date.now();
      if (now >= currentUser.expiresAt) {
        logoutUser(true);
        setCurrentUser(null);
      }
    };

    const interval = setInterval(checkExpiration, 10000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Pantalla de carga (1,3 segundos al entrar o tras el login)
  if (isCheckingAuth) {
    return <Loading titulo={loadingTitle} subtitulo={loadingSubtitle} />;
  }

  // Vista de Login si no hay usuario autenticado
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={async () => {
          // Carga de 1,3 segundos tras el login
          setLoadingTitle('Verificando Credenciales de Operador');
          setLoadingSubtitle('Iniciando sesión segura y sincronizando depósito...');
          setIsCheckingAuth(true);

          const startTime = Date.now();
          const user = await getSessionUser();
          setCurrentUser(user);

          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, LOADING_DURATION_MS - elapsed);

          setTimeout(() => {
            setIsCheckingAuth(false);
          }, remaining);
        }}
      />
    );
  }

  // Dashboard del ERP para usuarios autenticados
  return (
    <ERPPage
      currentUser={currentUser}
      onLogout={() => {
        setCurrentUser(null);
      }}
    />
  );
}
