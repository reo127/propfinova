import { useEffect, useRef, useState } from "react";
import { View, Text, Image, Pressable, FlatList, Dimensions, Linking, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { resolveImageUrl } from "../lib/api";

const { width } = Dimensions.get("window");
const SLIDE_DURATION = 5000;
const HEIGHT = 210;

/**
 * Mirrors the web Banner (src/app/components/Banner.jsx): auto-advancing
 * slides, an ink gradient, bottom-left title/subtitle, and progress-bar
 * indicators. Slides whose image fails to load are dropped rather than
 * leaving an empty band — a banner row can outlive its uploaded file.
 */
export default function BannerSlider({ banners = [] }) {
  const [broken, setBroken] = useState([]);
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const progress = useRef(new Animated.Value(0)).current;

  const slides = banners.filter((b) => !broken.includes(b._id));
  const count = slides.length;
  const active = index < count ? index : 0;

  // Auto-advance
  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % count;
        listRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [count]);

  // Restart the progress bar whenever the visible slide changes.
  useEffect(() => {
    if (count === 0) return;
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: SLIDE_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    anim.start();
    return () => anim.stop();
  }, [active, count]);

  if (count === 0) return null;

  return (
    <View style={{ height: HEIGHT }} className="mx-4 rounded-2xl overflow-hidden bg-secondary">
      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(b, i) => b._id ?? String(i)}
        getItemLayout={(_, i) => ({ length: width - 32, offset: (width - 32) * i, index: i })}
        onScrollToIndexFailed={() => {}}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (width - 32)))}
        renderItem={({ item }) => (
          <Pressable
            disabled={!item.link}
            onPress={() => item.link && Linking.openURL(item.link)}
            style={{ width: width - 32, height: HEIGHT }}
          >
            <Image
              source={{ uri: resolveImageUrl(item.image) }}
              style={{ width: width - 32, height: HEIGHT }}
              resizeMode="cover"
              onError={() => setBroken((prev) => (prev.includes(item._id) ? prev : [...prev, item._id]))}
            />

            {/* Same cinematic scrim as the web banner */}
            <LinearGradient
              colors={["transparent", "rgba(16,37,27,0.15)", "rgba(16,37,27,0.85)"]}
              locations={[0, 0.45, 1]}
              style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            />

            {(item.title || item.subtitle) && (
              <View className="absolute inset-x-0 bottom-0 px-5 pb-7">
                {item.title ? (
                  <Text className="text-white text-xl font-bold leading-7" numberOfLines={2}>
                    {item.title}
                  </Text>
                ) : null}
                {item.subtitle ? (
                  <Text className="text-white/75 text-sm mt-1" numberOfLines={2}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
            )}
          </Pressable>
        )}
      />

      {count > 1 && (
        <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
          {slides.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => {
                setIndex(i);
                listRef.current?.scrollToIndex({ index: i, animated: true });
              }}
              className="h-1 w-8 rounded-full bg-white/25 overflow-hidden"
            >
              {i === active ? (
                <Animated.View
                  className="h-full bg-white rounded-full"
                  style={{ width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) }}
                />
              ) : i < active ? (
                <View className="h-full w-full bg-white rounded-full" />
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
