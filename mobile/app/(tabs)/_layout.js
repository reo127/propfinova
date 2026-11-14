import { Tabs } from "expo-router";
import { Home, Search, Heart, PlusCircle, User } from "lucide-react-native";
import TabBar from "../../components/TabBar";
import { useAuthStore } from "../../lib/auth-store";

export default function TabsLayout() {
  const isBroker = useAuthStore((s) => s.user?.role === "builder");

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Home color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: "Search", tabBarIcon: ({ color, size }) => <Search color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size, focused }) => (
            <Heart color={color} size={size} fill={focused ? color : "transparent"} />
          ),
        }}
      />
      <Tabs.Screen
        name="list-property"
        options={{
          title: "List",
          href: isBroker ? undefined : null,
          tabBarIcon: ({ color, size }) => <PlusCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }}
      />
    </Tabs>
  );
}
