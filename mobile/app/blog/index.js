import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Clock, Newspaper } from "lucide-react-native";
import Screen from "../../components/Screen";
import { contentApi, resolveImageUrl } from "../../lib/api";

export default function BlogList() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi
      .blogs(1, 20)
      .then(({ data }) => setBlogs(data?.blogs || []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#17855a" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={blogs}
        keyExtractor={(b) => b._id}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-4 px-1">
            <Text className="text-2xl font-bold text-secondary">Blog & Insights</Text>
            <Text className="text-muted text-sm mt-1">Market trends, buying guides and locality deep-dives.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/blog/${item.slug}`)}
            className="bg-surface border border-border rounded-2xl overflow-hidden mb-4"
          >
            {item.featuredImage ? (
              <Image
                source={{ uri: resolveImageUrl(item.featuredImage) }}
                className="w-full h-40"
                resizeMode="cover"
              />
            ) : null}
            <View className="p-4">
              <Text className="text-base font-bold text-secondary" numberOfLines={2}>
                {item.title}
              </Text>
              {item.excerpt ? (
                <Text className="text-sm text-muted mt-1.5 leading-5" numberOfLines={3}>
                  {item.excerpt}
                </Text>
              ) : null}
              <View className="flex-row items-center gap-1.5 mt-3">
                <Clock size={12} color="#5c7268" />
                <Text className="text-xs text-muted">
                  {item.readingTime ? `${item.readingTime} min read` : "Quick read"}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center mt-20">
            <Newspaper size={28} color="#9ca8a2" />
            <Text className="text-muted mt-3 text-center">No articles published yet.</Text>
          </View>
        }
      />
    </Screen>
  );
}
