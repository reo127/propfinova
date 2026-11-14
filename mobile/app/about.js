import { View, Text, ScrollView } from "react-native";
import { ShieldCheck, Building2, Users, Award } from "lucide-react-native";
import Screen from "../components/Screen";

const POINTS = [
  { icon: ShieldCheck, title: "RERA Registered", desc: "Every listing on PropFinova is compliant and verified." },
  { icon: Building2, title: "5,000+ Properties", desc: "Apartments, villas, plots and new launches across Bangalore." },
  { icon: Users, title: "5,000+ Happy Clients", desc: "Trusted by buyers, renters and builders alike." },
  { icon: Award, title: "Expert Guidance", desc: "Our team helps you through every step of buying, selling or renting." },
];

export default function About() {
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text className="text-2xl font-bold text-secondary mb-2">About PropFinova</Text>
        <Text className="text-muted leading-6 mb-6">
          PropFinova helps you buy, sell and rent verified properties in Bangalore — built on trust,
          backed by real builders and a team that actually picks up the phone.
        </Text>

        {POINTS.map(({ icon: Icon, title, desc }) => (
          <View key={title} className="flex-row bg-surface border border-border rounded-xl p-4 mb-3">
            <View className="w-10 h-10 rounded-lg bg-primary-soft items-center justify-center mr-3">
              <Icon size={20} color="#17855a" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-foreground">{title}</Text>
              <Text className="text-muted text-sm mt-0.5">{desc}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
