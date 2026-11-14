import { useEffect, useRef, useState } from "react";
import { View, Text, Image, Pressable, Modal, FlatList, Dimensions, StatusBar } from "react-native";
import { WebView } from "react-native-webview";
import { X, ImageIcon, Video as VideoIcon, ChevronLeft, ChevronRight, Play } from "lucide-react-native";
import { getEmbedUrl, getThumbnailUrl, isDirectVideo } from "../lib/videoUtils";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// A direct file URL has no player chrome of its own, so wrap it in a minimal
// HTML document; an embed URL (YouTube/Vimeo/Dailymotion) is already a player.
function videoSource(url) {
  const embed = getEmbedUrl(url);
  if (!embed) return { uri: url };
  if (!isDirectVideo(url)) return { uri: embed };
  return {
    html: `<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100%">
      <video src="${embed}" controls playsinline style="width:100%;height:100%;object-fit:contain"></video>
    </body>`,
  };
}

/**
 * Full-screen media viewer matching the web's modal: Images/Videos tabs, a
 * thumbnail strip, an index counter and prev/next arrows. Videos play inline
 * rather than kicking the user out to a browser.
 */
export default function MediaViewer({ visible, onClose, images = [], videos = [], title, location, initialIndex = 0, initialTab = "images" }) {
  const [tab, setTab] = useState(initialTab);
  const [index, setIndex] = useState(initialIndex);
  const listRef = useRef(null);
  const stripRef = useRef(null);

  const items = tab === "images" ? images : videos;

  useEffect(() => {
    if (!visible) return;
    setTab(initialTab);
    setIndex(initialIndex);
  }, [visible, initialTab, initialIndex]);

  // Keep the thumbnail strip centred on whatever is on screen.
  useEffect(() => {
    if (!visible || items.length === 0) return;
    stripRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0.5 });
  }, [index, visible, tab]);

  const goTo = (next) => {
    if (next < 0 || next >= items.length) return;
    setIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  const switchTab = (nextTab) => {
    setTab(nextTab);
    setIndex(0);
    listRef.current?.scrollToIndex({ index: 0, animated: false });
  };

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-black">
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View className="pt-14 px-4 pb-3">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-white text-base font-semibold" numberOfLines={1}>
                {title}
              </Text>
              {location ? (
                <Text className="text-white/60 text-xs mt-0.5" numberOfLines={1}>
                  {location}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10} className="w-9 h-9 rounded-full bg-white/15 items-center justify-center">
              <X size={18} color="#fff" />
            </Pressable>
          </View>

          {videos.length > 0 && (
            <View className="flex-row mt-3 bg-white/10 rounded-full p-1 self-start">
              <Pressable
                onPress={() => switchTab("images")}
                className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full ${tab === "images" ? "bg-white" : ""}`}
              >
                <ImageIcon size={13} color={tab === "images" ? "#10251b" : "rgba(255,255,255,0.75)"} />
                <Text className={`text-xs font-semibold ${tab === "images" ? "text-secondary" : "text-white/75"}`}>
                  Photos ({images.length})
                </Text>
              </Pressable>
              <Pressable
                onPress={() => switchTab("videos")}
                className={`flex-row items-center gap-1.5 px-3.5 py-1.5 rounded-full ${tab === "videos" ? "bg-white" : ""}`}
              >
                <VideoIcon size={13} color={tab === "videos" ? "#10251b" : "rgba(255,255,255,0.75)"} />
                <Text className={`text-xs font-semibold ${tab === "videos" ? "text-secondary" : "text-white/75"}`}>
                  Videos ({videos.length})
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Stage */}
        <View className="flex-1">
          <FlatList
            ref={listRef}
            data={items}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `${tab}-${i}`}
            getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
            initialScrollIndex={initialIndex < items.length ? initialIndex : 0}
            onScrollToIndexFailed={() => {}}
            onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))}
            renderItem={({ item, index: i }) =>
              tab === "images" ? (
                <View style={{ width: SCREEN_W }} className="items-center justify-center">
                  <Image source={{ uri: item }} style={{ width: SCREEN_W, height: SCREEN_H * 0.55 }} resizeMode="contain" />
                </View>
              ) : (
                <View style={{ width: SCREEN_W }} className="items-center justify-center px-3">
                  {/* Only the visible video gets a live WebView, so three
                      players don't all buffer at once on a mobile connection. */}
                  {i === index ? (
                    <WebView
                      source={videoSource(item)}
                      style={{ width: SCREEN_W - 24, height: (SCREEN_W - 24) * 0.5625, backgroundColor: "#000" }}
                      allowsFullscreenVideo
                      allowsInlineMediaPlayback
                      mediaPlaybackRequiresUserAction={false}
                      javaScriptEnabled
                    />
                  ) : (
                    <View
                      style={{ width: SCREEN_W - 24, height: (SCREEN_W - 24) * 0.5625 }}
                      className="bg-white/5 items-center justify-center rounded-xl"
                    >
                      <Play size={28} color="rgba(255,255,255,0.5)" />
                    </View>
                  )}
                </View>
              )
            }
          />

          {items.length > 1 && (
            <>
              <Pressable
                onPress={() => goTo(index - 1)}
                className="absolute left-3 top-1/2 -mt-5 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
                style={{ opacity: index === 0 ? 0.3 : 1 }}
              >
                <ChevronLeft size={22} color="#fff" />
              </Pressable>
              <Pressable
                onPress={() => goTo(index + 1)}
                className="absolute right-3 top-1/2 -mt-5 w-10 h-10 rounded-full bg-black/50 items-center justify-center"
                style={{ opacity: index === items.length - 1 ? 0.3 : 1 }}
              >
                <ChevronRight size={22} color="#fff" />
              </Pressable>
            </>
          )}
        </View>

        {/* Counter + thumbnails */}
        <View className="pb-10 pt-2">
          <Text className="text-white/70 text-xs text-center mb-3">
            {items.length > 0 ? `${index + 1} / ${items.length}` : "Nothing to show"}
          </Text>
          <FlatList
            ref={stripRef}
            data={items}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `thumb-${tab}-${i}`}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            getItemLayout={(_, i) => ({ length: 64, offset: 64 * i, index: i })}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item, index: i }) => {
              const thumb = tab === "images" ? item : getThumbnailUrl(item);
              return (
                <Pressable
                  onPress={() => goTo(i)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${
                    i === index ? "border-primary" : "border-white/15"
                  }`}
                >
                  {thumb ? (
                    <Image source={{ uri: thumb }} className="w-full h-full" resizeMode="cover" />
                  ) : (
                    <View className="w-full h-full bg-white/10 items-center justify-center">
                      <VideoIcon size={16} color="rgba(255,255,255,0.8)" />
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}
