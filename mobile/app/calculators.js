import { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Calculator, Home, TrendingUp, PiggyBank } from "lucide-react-native";
import Screen from "../components/Screen";
import EMICalculator from "../components/EMICalculator";
import { formatCurrency } from "../lib/format";
import Slider from "@react-native-community/slider";

const CALCULATORS = [
  { id: "emi", name: "EMI Calculator", desc: "Monthly loan repayment", icon: Calculator, available: true },
  { id: "affordability", name: "Affordability", desc: "What you can borrow", icon: Home, available: true },
  { id: "roi", name: "Property ROI", desc: "Coming soon", icon: TrendingUp, available: false },
  { id: "savings", name: "Down Payment", desc: "Coming soon", icon: PiggyBank, available: false },
];

export default function Calculators() {
  const [active, setActive] = useState("emi");

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-secondary">Property Calculators</Text>
        <Text className="text-muted text-sm mt-1 mb-5">
          Plan your purchase before you talk numbers with a builder.
        </Text>

        <View className="flex-row flex-wrap gap-3 mb-6">
          {CALCULATORS.map(({ id, name, desc, icon: Icon, available }) => {
            const selected = active === id;
            return (
              <Pressable
                key={id}
                onPress={() => available && setActive(id)}
                className={`w-[47%] rounded-2xl p-4 border ${
                  selected ? "bg-primary border-primary" : "bg-surface border-border"
                } ${available ? "" : "opacity-50"}`}
              >
                <Icon size={20} color={selected ? "#fff" : "#17855a"} />
                <Text className={`font-bold text-sm mt-2 ${selected ? "text-white" : "text-secondary"}`}>{name}</Text>
                <Text className={`text-[11px] mt-0.5 ${selected ? "text-white/70" : "text-muted"}`}>{desc}</Text>
              </Pressable>
            );
          })}
        </View>

        {active === "emi" && <EMICalculator defaultPrice={5000000} />}
        {active === "affordability" && <Affordability />}
      </ScrollView>
    </Screen>
  );
}

/**
 * Reverse of the EMI formula: given what a buyer can pay monthly, solve for
 * the loan the bank would approve, then add the down payment back on to get
 * the property budget.
 */
function Affordability() {
  const [monthly, setMonthly] = useState(50000);
  const [rate, setRate] = useState(8.5);
  const [years, setYears] = useState(20);
  const [downPct, setDownPct] = useState(20);

  const r = rate / 12 / 100;
  const n = years * 12;
  const loan = r === 0 ? monthly * n : (monthly * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
  const budget = downPct >= 100 ? loan : loan / (1 - downPct / 100);
  const downPayment = budget - loan;

  return (
    <View className="bg-surface rounded-2xl border border-border p-5">
      <View className="flex-row items-center gap-2 mb-4">
        <Home size={19} color="#17855a" />
        <Text className="text-lg font-bold text-secondary">Home Affordability</Text>
      </View>

      <Row label="Monthly EMI you can pay" value={formatCurrency(monthly)}>
        <Slider
          value={monthly}
          onValueChange={setMonthly}
          minimumValue={10000}
          maximumValue={500000}
          step={5000}
          minimumTrackTintColor="#17855a"
          maximumTrackTintColor="#dceae2"
          thumbTintColor="#17855a"
        />
      </Row>

      <Row label="Interest rate" value={`${rate.toFixed(1)}% p.a.`}>
        <Slider
          value={rate}
          onValueChange={setRate}
          minimumValue={6.5}
          maximumValue={15}
          step={0.1}
          minimumTrackTintColor="#17855a"
          maximumTrackTintColor="#dceae2"
          thumbTintColor="#17855a"
        />
      </Row>

      <Row label="Loan tenure" value={`${years} years`}>
        <Slider
          value={years}
          onValueChange={setYears}
          minimumValue={1}
          maximumValue={30}
          step={1}
          minimumTrackTintColor="#17855a"
          maximumTrackTintColor="#dceae2"
          thumbTintColor="#17855a"
        />
      </Row>

      <Row label="Down payment" value={`${downPct}%`}>
        <Slider
          value={downPct}
          onValueChange={setDownPct}
          minimumValue={10}
          maximumValue={50}
          step={1}
          minimumTrackTintColor="#17855a"
          maximumTrackTintColor="#dceae2"
          thumbTintColor="#17855a"
        />
      </Row>

      <View className="bg-primary rounded-xl p-4 mt-3">
        <Text className="text-white/80 text-xs font-medium">You can afford a property worth</Text>
        <Text className="text-white text-3xl font-bold mt-1">{formatCurrency(budget)}</Text>
      </View>

      <View className="flex-row gap-3 mt-3">
        <View className="flex-1 bg-background rounded-xl p-3 border border-border">
          <Text className="text-xs text-muted">Loan amount</Text>
          <Text className="text-base font-bold text-secondary mt-1">{formatCurrency(loan)}</Text>
        </View>
        <View className="flex-1 bg-background rounded-xl p-3 border border-border">
          <Text className="text-xs text-muted">Down payment</Text>
          <Text className="text-base font-bold text-secondary mt-1">{formatCurrency(downPayment)}</Text>
        </View>
      </View>

      <Text className="text-xs text-muted text-center mt-4">
        Indicative only. Banks also weigh income, credit score and existing EMIs.
      </Text>
    </View>
  );
}

function Row({ label, value, children }) {
  return (
    <View className="bg-background rounded-xl p-4 mb-3 border border-border">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        <Text className="text-sm font-bold text-primary">{value}</Text>
      </View>
      {children}
    </View>
  );
}
