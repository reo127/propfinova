import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator, useWindowDimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import { Clock } from "lucide-react-native";
import Screen from "../../components/Screen";
import { contentApi, resolveImageUrl } from "../../lib/api";

// Blog bodies are TinyMCE HTML, so they render in a WebView with the app's
// own type scale and brand colours injected to match the rest of the app.
const wrap = (html) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  body{margin:0;padding:0 20px;font-family:-apple-system,system-ui,sans-serif;color:#16241d;font-size:16px;line-height:1.7;background:#f3faf6}
  h1,h2,h3{color:#10251b;line-height:1.3;margin:1.4em 0 .5em}
  h1{font-size:1.5em}h2{font-size:1.3em}h3{font-size:1.1em}
  p{margin:0 0 1em}
  a{color:#17855a}
  img{max-width:100%;height:auto;border-radius:12px}
  ul,ol{padding-left:1.2em}
  blockquote{margin:1em 0;padding:.6em 1em;border-left:3px solid #17855a;background:#e8f7ef;border-radius:8px}
  table{width:100%;border-collapse:collapse}td,th{border:1px solid #dceae2;padding:8px}
</style></head><body>${html || ""}</body></html>`;

export default function BlogPost() {
  const { slug } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [height, setHeight] = useState(600);

  useEffect(() => {
    contentApi
      .blog(slug)
      .then(({ data }) => setBlog(data))
      .catch(() => setBlog(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#17855a" />
        </View>
      </Screen>
    );
  }

  if (!blog) {
    return (
      <Screen>
        <Text className="text-muted text-center mt-10">Article not found.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {blog.featuredImage ? (
          <Image source={{ uri: resolveImageUrl(blog.featuredImage) }} className="w-full h-52" resizeMode="cover" />
        ) : null}

        <View className="px-5 pt-5">
          <Text className="text-2xl font-bold text-secondary leading-8">{blog.title}</Text>
          <View className="flex-row items-center gap-1.5 mt-2.5">
            <Clock size={13} color="#5c7268" />
            <Text className="text-xs text-muted">
              {blog.readingTime ? `${blog.readingTime} min read` : "Quick read"}
            </Text>
          </View>
        </View>

        <WebView
          originWhitelist={["*"]}
          source={{ html: wrap(blog.content) }}
          style={{ width, height, backgroundColor: "transparent", marginTop: 12 }}
          scrollEnabled={false}
          injectedJavaScript="window.ReactNativeWebView.postMessage(document.body.scrollHeight.toString());true;"
          onMessage={(e) => setHeight(Number(e.nativeEvent.data) + 40)}
        />
      </ScrollView>
    </Screen>
  );
}
