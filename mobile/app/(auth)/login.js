import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Mail, Lock } from "lucide-react-native";
import AuthHero from "../../components/AuthHero";
import AuthField from "../../components/AuthField";
import Button from "../../components/Button";
import { useAuthStore } from "../../lib/auth-store";

export default function Login() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/");
    } catch (e) {
      setError(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" bounces={false}>
          <AuthHero
            eyebrow
            title={"Find your space.\nUnlock your possibilities."}
            subtitle="Verified listings, direct builder deals, no brokerage layered on top."
          />

          <View className="flex-1 bg-background -mt-10 rounded-t-[28px] px-6 pt-8 pb-10">
            <View
              className="bg-surface rounded-[22px] border border-border p-6"
              style={{ shadowColor: "#10251b", shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } }}
            >
              <Text className="text-[26px] font-bold text-secondary">Sign in</Text>
              <Text className="text-muted mt-1.5 mb-6">
                Pick up where you left off — your saved properties and enquiries.
              </Text>

              <AuthField
                label="Email"
                icon={Mail}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
              />
              <AuthField
                label="Password"
                icon={Lock}
                isPassword
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
              />

              {error ? <Text className="text-red-500 text-sm mb-3">{error}</Text> : null}

              <Button title="Sign In" onPress={onSubmit} loading={loading} className="mt-2" />
            </View>

            <View className="flex-row justify-center mt-6">
              <Text className="text-muted">New to PropFinova? </Text>
              <Link href="/register" asChild>
                <Pressable>
                  <Text className="text-secondary font-bold underline">Create an account</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
