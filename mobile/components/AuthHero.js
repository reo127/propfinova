import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "../lib/api";

// Same fallback the web AuthLayout uses, so the very first paint already
// matches the web brand panel before /api/hero-image resolves (or on dev
// boxes where it 404s).
const FALLBACK_PHOTO =
  "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=1200&h=1600&fit=crop&crop=center";

export default function AuthHero({ eyebrow, title, subtitle }) {
  const [photo, setPhoto] = useState(FALLBACK_PHOTO);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/hero-image`)
      .then((r) => r.json())
      .then((d) => {
        if (active && d?.success && d.data?.image) setPhoto(d.data.image);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return (
    <View className="h-72 overflow-hidden rounded-b-[32px]">
      {/* Absolutely positioned Image rather than ImageBackground, which RN
          has deprecated. */}
      <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} resizeMode="cover" />

      {/* Ink scrim approximating the web's top-to-bottom gradient */}
      <View className="absolute inset-0 bg-secondary opacity-35" />
      <View className="absolute bottom-0 left-0 right-0 h-2/3 bg-secondary opacity-80" />

      <View className="flex-1 px-6 justify-between" style={{ paddingTop: insets.top + 12 }}>
        <Image source={require("../assets/propfinova-logo.png")} className="h-9 w-32" resizeMode="contain" />

        <View className="pb-10">
          {eyebrow ? <View className="h-px w-10 bg-primary mb-4" /> : null}
          <Text className="text-white text-[28px] leading-[34px] font-bold">{title}</Text>
          {subtitle ? <Text className="text-white/70 text-sm mt-2 leading-5">{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}
