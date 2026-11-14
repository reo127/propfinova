import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable } from "react-native";
import { Link, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { User2, Mail, Lock, Building2, Check } from "lucide-react-native";
import AuthHero from "../../components/AuthHero";
import AuthField from "../../components/AuthField";
import Button from "../../components/Button";
import { useAuthStore } from "../../lib/auth-store";

export default function Register() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const [accountType, setAccountType] = useState("user"); // 'user' = customer, 'builder' = broker
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await registerUser(name.trim(), email.trim().toLowerCase(), password, accountType);
      router.replace("/");
    } catch (e) {
      setError(e.message || "Registration failed");
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
            title={"Join PropFinova."}
            subtitle="Create an account to save properties, enquire instantly, or list your own."
          />

          <View className="flex-1 bg-background -mt-10 rounded-t-[28px] px-6 pt-8 pb-10">
            <View
              className="bg-surface rounded-[22px] border border-border p-6"
              style={{ shadowColor: "#10251b", shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } }}
            >
              <Text className="text-[26px] font-bold text-secondary">Create account</Text>
              <Text className="text-muted mt-1.5 mb-5">Tell us a bit about yourself.</Text>

              <View className="flex-row gap-3 mb-5">
                <AccountTypeCard
                  icon={User2}
                  label="Customer"
                  desc="Buy or rent"
                  active={accountType === "user"}
                  onPress={() => setAccountType("user")}
                />
                <AccountTypeCard
                  icon={Building2}
                  label="Broker"
                  desc="List properties"
                  active={accountType === "builder"}
                  onPress={() => setAccountType("builder")}
                />
              </View>

              <AuthField label="Full Name" icon={User2} value={name} onChangeText={setName} placeholder="Your name" />
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
                placeholder="At least 6 characters"
              />

              {error ? <Text className="text-red-500 text-sm mb-3">{error}</Text> : null}

              <Button title="Create Account" onPress={onSubmit} loading={loading} className="mt-2" />
            </View>

            <View className="flex-row justify-center mt-6">
              <Text className="text-muted">Already have an account? </Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text className="text-secondary font-bold underline">Sign in</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function AccountTypeCard({ icon: Icon, label, desc, active, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-2xl border p-3.5 ${active ? "border-primary bg-primary-soft" : "border-border bg-surface"}`}
    >
      <View className="flex-row items-center justify-between">
        <View className={`w-9 h-9 rounded-full items-center justify-center ${active ? "bg-primary" : "bg-border"}`}>
          <Icon size={17} color={active ? "#fff" : "#5c7268"} />
        </View>
        {active ? (
          <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
            <Check size={12} color="#fff" />
          </View>
        ) : null}
      </View>
      <Text className={`mt-2.5 font-semibold ${active ? "text-primary" : "text-foreground"}`}>{label}</Text>
      <Text className="text-xs text-muted mt-0.5">{desc}</Text>
    </Pressable>
  );
}
