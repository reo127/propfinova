import { useState } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import Screen from "../components/Screen";
import { API_URL } from "../lib/api";

// Legal copy is served from the website rather than duplicated here: a
// privacy policy that silently drifts from the published one is worse than
// no in-app copy at all.
const TABS = [
  { key: "privacy", label: "Privacy Policy" },
  { key: "terms", label: "Terms of Use" },
];

export default function Legal() {
  const [tab, setTab] = useState("privacy");
  const [loading, setLoading] = useState(true);

  return (
    <Screen>
      <View className="flex-row gap-2 px-5 py-3">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => {
              setTab(t.key);
              setLoading(true);
            }}
            className={`flex-1 py-2.5 rounded-xl items-center ${tab === t.key ? "bg-primary" : "bg-surface border border-border"}`}
          >
            <Text className={`text-sm font-semibold ${tab === t.key ? "text-white" : "text-muted"}`}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View className="flex-1">
        <WebView
          key={tab}
          source={{ uri: `${API_URL}/${tab}` }}
          onLoadEnd={() => setLoading(false)}
          style={{ backgroundColor: "#f3faf6" }}
        />
        {loading && (
          <View className="absolute inset-0 items-center justify-center bg-background">
            <ActivityIndicator color="#17855a" />
          </View>
        )}
      </View>
    </Screen>
  );
}
