import { useState } from "react";
import { View, Text, Image, Pressable, FlatList, Dimensions } from "react-native";
import { ImageIcon, Play, Expand } from "lucide-react-native";
import MediaViewer from "./MediaViewer";
import { getThumbnailUrl } from "../lib/videoUtils";

const { width } = Dimensions.get("window");
const HERO_H = 300;

/**
 * The detail page hero. Swipes through photos, surfaces a media-count pill
 * and a video chip (both mirroring the web's "N photos • N videos" preview),
 * and hands off to the full-screen MediaViewer on tap.
 */
export default function Gallery({ images = [], videos = [], title, location }) {
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState({ open: false, tab: "images", index: 0 });

  const open = (tab, i) => setViewer({ open: true, tab, index: i });

  return (
    <View>
      <View style={{ height: HERO_H }} className="bg-primary-soft">
        {images.length > 0 ? (
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `hero-${i}`}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            renderItem={({ item, index: i }) => (
              <Pressable onPress={() => open("images", i)}>
                <Image source={{ uri: item }} style={{ width, height: HERO_H }} resizeMode="cover" />
              </Pressable>
            )}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ImageIcon size={26} color="#5c7268" />
            <Text className="text-muted text-sm mt-2">No photos yet</Text>
          </View>
        )}

        {/* Scrims keep the floating back button (top) and the media pills
            (bottom) legible over a bright photo. */}
        <View className="absolute inset-x-0 top-0 h-24 bg-black/25" pointerEvents="none" />
        <View className="absolute inset-x-0 bottom-0 h-24 bg-black/25" pointerEvents="none" />

        {/* Dot pagination */}
        {images.length > 1 && (
          <View className="absolute bottom-16 left-0 right-0 flex-row justify-center gap-1.5">
            {images.slice(0, 8).map((_, i) => (
              <View
                key={i}
                className={`h-1.5 rounded-full ${i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </View>
        )}

        <View className="absolute bottom-3 left-4 right-4 flex-row items-center gap-2">
          {images.length > 0 && (
            <Pressable
              onPress={() => open("images", index)}
              className="flex-row items-center gap-1.5 bg-black/60 px-3 py-2 rounded-full"
            >
              <ImageIcon size={13} color="#fff" />
              <Text className="text-white text-xs font-semibold">{images.length} Photos</Text>
            </Pressable>
          )}

          {videos.length > 0 && (
            <Pressable
              onPress={() => open("videos", 0)}
              className="flex-row items-center gap-1.5 bg-primary px-3 py-2 rounded-full"
            >
              <Play size={12} color="#fff" fill="#fff" />
              <Text className="text-white text-xs font-semibold">{videos.length} Videos</Text>
            </Pressable>
          )}

          <View className="flex-1" />

          {images.length > 0 && (
            <Pressable
              onPress={() => open("images", index)}
              className="w-9 h-9 rounded-full bg-black/60 items-center justify-center"
            >
              <Expand size={15} color="#fff" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Video rail — the web shows videos as a first-class tab, so they get a
          visible entry point here rather than hiding behind the photo pill. */}
      {videos.length > 0 && (
        <View className="px-5 pt-4">
          <Text className="text-sm font-bold text-secondary mb-2">Video Tour</Text>
          <FlatList
            data={videos}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `vid-${i}`}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item, index: i }) => {
              const thumb = getThumbnailUrl(item);
              return (
                <Pressable onPress={() => open("videos", i)} className="w-40 h-24 rounded-xl overflow-hidden bg-secondary">
                  {thumb ? <Image source={{ uri: thumb }} className="w-full h-full" resizeMode="cover" /> : null}
                  <View className="absolute inset-0 items-center justify-center bg-black/35">
                    <View className="w-9 h-9 rounded-full bg-white/90 items-center justify-center">
                      <Play size={14} color="#17855a" fill="#17855a" />
                    </View>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      )}

      <MediaViewer
        visible={viewer.open}
        onClose={() => setViewer((v) => ({ ...v, open: false }))}
        images={images}
        videos={videos}
        title={title}
        location={location}
        initialTab={viewer.tab}
        initialIndex={viewer.index}
      />
    </View>
  );
}
