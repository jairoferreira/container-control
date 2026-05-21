import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Home, List, PlusCircle, Settings } from "lucide-react-native";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  const { user } = useAuth();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="nova-cautela">
        <Icon sf={{ default: "plus.circle", selected: "plus.circle.fill" }} />
        <Label>Nova Cautela</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="historico">
        <Icon sf={{ default: "list.bullet", selected: "list.bullet.circle.fill" }} />
        <Label>Histórico</Label>
      </NativeTabs.Trigger>
      {user?.isAdmin && (
        <NativeTabs.Trigger name="configuracoes">
          <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
          <Label>Config.</Label>
        </NativeTabs.Trigger>
      )}
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 60,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ),
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginBottom: isWeb ? 10 : 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="house" tintColor={color} size={22} />
            ) : (
              <Home size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="nova-cautela"
        options={{
          title: "Nova Cautela",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="plus.circle" tintColor={color} size={22} />
            ) : (
              <PlusCircle size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: "Histórico",
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="list.bullet" tintColor={color} size={22} />
            ) : (
              <List size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="configuracoes"
        options={{
          title: "Config.",
          // Esconde a aba visualmente para motoristas; admin vê normalmente
          tabBarButton: user?.isAdmin ? undefined : () => null,
          tabBarIcon: ({ color }) =>
            isIOS ? (
              <SymbolView name="gearshape" tintColor={color} size={22} />
            ) : (
              <Settings size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
