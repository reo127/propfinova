import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import Svg, { Circle } from "react-native-svg";
import { Calculator } from "lucide-react-native";
import { computeEmi } from "../lib/emi";
import { formatCurrency } from "../lib/format";

function SliderRow({ label, value, unit, onValueChange, minimumValue, maximumValue, step, valueLabel }) {
  return (
    <View className="bg-background rounded-xl p-4 mb-3 border border-border">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        <Text className="text-sm font-bold text-primary">{valueLabel}</Text>
      </View>
      <Slider
        value={value}
        onValueChange={onValueChange}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        minimumTrackTintColor="#17855a"
        maximumTrackTintColor="#dceae2"
        thumbTintColor="#17855a"
      />
      <View className="flex-row justify-between">
        <Text className="text-xs text-muted">{minimumValue}{unit}</Text>
        <Text className="text-xs text-muted">{maximumValue}{unit}</Text>
      </View>
    </View>
  );
}

function EmiPieChart({ principalPercent, interestPercent }) {
  const radius = 42;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const principalDash = (principalPercent / 100) * circumference;
  const interestDash = (interestPercent / 100) * circumference;

  return (
    <Svg width={100} height={100} viewBox="0 0 100 100">
      <Circle cx={50} cy={50} r={radius} stroke="#dceae2" strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={50}
        cy={50}
        r={radius}
        stroke="#10251b"
        strokeWidth={strokeWidth}
        strokeDasharray={`${principalDash} ${circumference}`}
        fill="none"
        rotation={-90}
        origin="50,50"
      />
      <Circle
        cx={50}
        cy={50}
        r={radius}
        stroke="#17855a"
        strokeWidth={strokeWidth}
        strokeDasharray={`${interestDash} ${circumference}`}
        strokeDashoffset={-principalDash}
        fill="none"
        rotation={-90}
        origin="50,50"
      />
    </Svg>
  );
}

export default function EMICalculator({ defaultPrice = 5000000 }) {
  const [price, setPrice] = useState(defaultPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(8.5);
  const [tenureYears, setTenureYears] = useState(20);

  useEffect(() => {
    if (defaultPrice && !isNaN(defaultPrice)) {
      queueMicrotask(() => setPrice(defaultPrice));
    }
  }, [defaultPrice]);

  const result = computeEmi({ price, downPaymentPercent, interestRate, tenureYears });
  const minPrice = 1000000;
  const maxPrice = 50000000;

  return (
    <View className="bg-surface rounded-2xl border border-border p-5">
      <View className="flex-row items-center gap-2 mb-4">
        <Calculator size={20} color="#17855a" />
        <Text className="text-lg font-bold text-secondary">EMI Calculator</Text>
      </View>

      <SliderRow
        label="Property Price"
        value={price}
        onValueChange={setPrice}
        minimumValue={minPrice}
        maximumValue={maxPrice}
        step={100000}
        valueLabel={formatCurrency(price)}
      />
      <SliderRow
        label="Down Payment"
        value={downPaymentPercent}
        onValueChange={setDownPaymentPercent}
        minimumValue={0}
        maximumValue={50}
        step={0.5}
        unit="%"
        valueLabel={`${downPaymentPercent}% (${formatCurrency((price * downPaymentPercent) / 100)})`}
      />
      <SliderRow
        label="Interest Rate"
        value={interestRate}
        onValueChange={setInterestRate}
        minimumValue={6.5}
        maximumValue={15}
        step={0.1}
        unit="%"
        valueLabel={`${interestRate.toFixed(1)}% p.a.`}
      />
      <SliderRow
        label="Loan Tenure"
        value={tenureYears}
        onValueChange={setTenureYears}
        minimumValue={1}
        maximumValue={30}
        step={1}
        unit=" yrs"
        valueLabel={`${tenureYears} years`}
      />

      {result && (
        <>
          <View className="bg-primary rounded-xl p-4 mt-2 mb-3">
            <Text className="text-white/80 text-xs font-medium">Monthly EMI</Text>
            <Text className="text-white text-3xl font-bold mt-1">{formatCurrency(result.monthlyEMI)}</Text>
            <Text className="text-white/70 text-xs mt-1">
              for {tenureYears} years @ {interestRate.toFixed(1)}% p.a.
            </Text>
          </View>

          <View className="flex-row gap-3 mb-3">
            <View className="flex-1 bg-secondary/5 rounded-xl p-3 border border-secondary/10">
              <Text className="text-xs text-secondary/70 font-medium">Principal</Text>
              <Text className="text-base font-bold text-secondary mt-1">{formatCurrency(result.principal)}</Text>
            </View>
            <View className="flex-1 bg-primary-soft rounded-xl p-3 border border-primary/10">
              <Text className="text-xs text-primary font-medium">Total Interest</Text>
              <Text className="text-base font-bold text-primary mt-1">{formatCurrency(result.totalInterest)}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between bg-background rounded-xl p-4 border border-border mb-3">
            <Text className="text-sm font-semibold text-foreground">Total Payable</Text>
            <Text className="text-lg font-bold text-secondary">{formatCurrency(result.totalAmount)}</Text>
          </View>

          <View className="flex-row items-center gap-5 justify-center mb-2">
            <EmiPieChart principalPercent={result.principalPercent} interestPercent={result.interestPercent} />
            <View>
              <View className="flex-row items-center gap-2 mb-1.5">
                <View className="w-3 h-3 rounded-full bg-secondary" />
                <Text className="text-xs text-foreground">Principal {result.principalPercent.toFixed(0)}%</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 rounded-full bg-primary" />
                <Text className="text-xs text-foreground">Interest {result.interestPercent.toFixed(0)}%</Text>
              </View>
            </View>
          </View>

          <Text className="text-xs text-muted text-center mt-2">
            Approximate. Actual EMI may vary based on fees and lender policies.
          </Text>
        </>
      )}
    </View>
  );
}
