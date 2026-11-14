import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Lock } from "lucide-react-native";

/**
 * Shown in place of a gated screen's content. Browsing is open to everyone,
 * so this only appears for the few things tied to an account — saving a
 * property, listing one, the account tab.
 */
export default function SignInPrompt({
  icon: Icon = Lock,
  title = "Sign in to continue",
  message,
}) {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-8 pb-24">
      <View className="w-16 h-16 rounded-full bg-primary-soft items-center justify-center mb-4">
        <Icon size={26} color="#17855a" />
      </View>

      <Text className="text-secondary font-bold text-lg text-center">{title}</Text>
      {message ? (
        <Text className="text-muted text-sm text-center mt-1.5 leading-5">{message}</Text>
      ) : null}

      <Pressable
        onPress={() => router.push("/login")}
        className="bg-primary rounded-xl py-3.5 items-center w-full mt-6"
      >
        <Text className="text-white font-bold">Sign in</Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/register")}
        className="border border-border rounded-xl py-3.5 items-center w-full mt-2.5"
      >
        <Text className="text-secondary font-semibold">Create an account</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/")} className="mt-5 py-2">
        <Text className="text-muted text-sm underline">Keep browsing instead</Text>
      </Pressable>
    </View>
  );
}
