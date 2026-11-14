import "../global.css";
import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../lib/auth-store";
import { useWishlistStore } from "../lib/wishlist-store";

function AuthGate({ children }) {
  const { token, isHydrated, hydrate } = useAuthStore();
  const loadWishlist = useWishlistStore((s) => s.load);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!token && !inAuthGroup) {
      router.replace("/login");
    } else if (token && inAuthGroup) {
      router.replace("/");
    }
  }, [token, isHydrated, segments]);

  useEffect(() => {
    if (token) loadWishlist(token);
  }, [token]);

  if (!isHydrated) return null;
  return children;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            {/* Transparent header so the gallery runs full-bleed to the top
                edge with just a floating back button over it. */}
            <Stack.Screen
              name="property/[id]"
              options={{
                headerShown: true,
                headerTransparent: true,
                title: "",
                headerTintColor: "#ffffff",
                headerShadowVisible: false,
                headerStyle: { backgroundColor: "transparent" },
              }}
            />
            <Stack.Screen name="about" options={{ headerShown: true, title: "About" }} />
            <Stack.Screen name="contact" options={{ headerShown: true, title: "Contact Us" }} />
            <Stack.Screen name="calculators" options={{ headerShown: true, title: "Calculators" }} />
            <Stack.Screen name="legal" options={{ headerShown: true, title: "Privacy & Terms" }} />
            <Stack.Screen name="blog/index" options={{ headerShown: true, title: "Blog" }} />
            <Stack.Screen name="blog/[slug]" options={{ headerShown: true, title: "" }} />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
