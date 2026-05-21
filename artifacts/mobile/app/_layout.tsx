import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoginScreen } from "@/components/LoginScreen";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CautelaProvider } from "@/contexts/CautelaContext";
import { SettingsProvider } from "@/contexts/SettingsContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="cautela/[id]"
        options={{ headerShown: false, presentation: "card" }}
      />
    </Stack>
  );
}

/** Mostra LoginScreen enquanto não autenticado, app normal após login */
function AppGate() {
  const { user } = useAuth();
  if (!user) return <LoginScreen />;
  return <RootLayoutNav />;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SettingsProvider>
            <AuthProvider>
              <CautelaProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <AppGate />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </CautelaProvider>
            </AuthProvider>
          </SettingsProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
