import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { FileText, User } from "lucide-react-native";
import Screen from "../../components/Screen";
import SignInPrompt from "../../components/SignInPrompt";
import ErrorState from "../../components/ErrorState";
import { loansApi } from "../../lib/api";
import { useAuthStore } from "../../lib/auth-store";
import { formatMoney } from "../../lib/loanMath";
import { STAGE_MAP } from "../../lib/loanStages";

export default function MyLoanApplicationsScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    loansApi
      .myApplications(token)
      .then(({ data }) => { setApps(data || []); setError(null); })
      .catch((e) => setError(e.message || "Request failed"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (!token) {
    return (
      <Screen>
        <SignInPrompt icon={User} title="Sign in to your account" message="Track your loan applications here." />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator color="#17855a" />
          </View>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : apps.length === 0 ? (
          <View className="border border-dashed border-border rounded-2xl py-16 items-center">
            <FileText size={26} color="#9ca8a2" />
            <Text className="text-secondary font-semibold mt-2.5">You haven&apos;t applied for a loan yet</Text>
            <Pressable onPress={() => router.push("/loans")} className="bg-primary px-5 py-2.5 rounded-xl mt-4">
              <Text className="text-white font-semibold text-sm">Browse loan offers</Text>
            </Pressable>
          </View>
        ) : (
          apps.map((a) => (
            <View key={a._id} className="flex-row items-center justify-between gap-3 bg-surface border border-border rounded-2xl p-4 mb-2.5">
              <View className="flex-1">
                <Text className="font-semibold text-secondary" numberOfLines={1}>
                  {a.lenderNameSnapshot} · {a.productNameSnapshot}
                </Text>
                <Text className="text-sm text-muted mt-0.5">
                  {formatMoney(a.loanAmount)} · {a.tenureYears} years
                </Text>
              </View>
              <Text className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase ${STAGE_MAP[a.status]?.cls || "bg-slate-100 text-slate-700"}`}>
                {STAGE_MAP[a.status]?.label || a.status}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}
