import { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Modal } from "react-native";
import Slider from "@react-native-community/slider";
import {
  Landmark, Percent, Clock, Wallet, Check, ArrowRight, Calculator, Info, ShieldCheck, X,
} from "lucide-react-native";
import Screen from "../../components/Screen";
import ErrorState from "../../components/ErrorState";
import LoanApplySheet from "../../components/LoanApplySheet";
import SignInPrompt from "../../components/SignInPrompt";
import { loansApi } from "../../lib/api";
import { useAuthStore } from "../../lib/auth-store";
import { calculateEmi, estimateEligibility, processingFee, formatMoney } from "../../lib/loanMath";

export default function LoansScreen() {
  const token = useAuthStore((s) => s.token);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applyFor, setApplyFor] = useState(null);
  const [showSignIn, setShowSignIn] = useState(false);

  // Applying needs an account — the KYC/employment profile it builds up is
  // saved against the user, so there is nowhere to save it for a guest.
  const handleApply = (product) => {
    if (!token) { setShowSignIn(true); return; }
    setApplyFor(product);
  };

  const [calc, setCalc] = useState({
    loanAmount: 4000000,
    tenureYears: 20,
    monthlyIncome: "80000",
    existingEmi: "0",
    propertyValue: "5000000",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await loansApi.list();
      setProducts(data || []);
      setError(null);
    } catch (e) {
      setProducts([]);
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const eligibility = useMemo(
    () =>
      estimateEligibility({
        monthlyIncome: Number(calc.monthlyIncome) || 0,
        existingEmi: Number(calc.existingEmi) || 0,
        tenureYears: calc.tenureYears,
        propertyValue: Number(calc.propertyValue) || 0,
        annualRatePercent: products[0]?.interestRateMin || 8.5,
      }),
    [calc, products]
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View className="mx-4 mt-2 rounded-3xl bg-secondary px-5 py-6">
          <View className="flex-row items-center gap-1.5 bg-white/10 self-start px-3 py-1.5 rounded-full">
            <Landmark size={13} color="#6fcf9a" />
            <Text className="text-accent text-[11px] font-bold">LOANS</Text>
          </View>
          <Text className="text-white text-[22px] leading-7 font-bold mt-3">
            Compare offers from trusted lenders
          </Text>
          <Text className="text-white/65 text-sm mt-2 leading-5">
            Check what you qualify for, compare EMIs, and apply in minutes. Our team handles the
            paperwork with the bank.
          </Text>
        </View>

        {/* Eligibility calculator */}
        <View className="mx-4 mt-5 bg-surface rounded-2xl border border-border p-5">
          <View className="flex-row items-center gap-2 mb-4">
            <Calculator size={17} color="#17855a" />
            <Text className="font-bold text-secondary">What can I borrow?</Text>
          </View>

          <NumField
            label="Monthly income (₹)"
            value={calc.monthlyIncome}
            onChange={(v) => setCalc((p) => ({ ...p, monthlyIncome: v }))}
          />
          <NumField
            label="Existing EMIs (₹)"
            hint="Car loan, personal loan, credit card EMIs"
            value={calc.existingEmi}
            onChange={(v) => setCalc((p) => ({ ...p, existingEmi: v }))}
          />
          <NumField
            label="Property value (₹)"
            value={calc.propertyValue}
            onChange={(v) => setCalc((p) => ({ ...p, propertyValue: v }))}
          />

          <Text className="text-[11px] font-bold text-muted uppercase mb-1">
            Tenure — {calc.tenureYears} years
          </Text>
          <Slider
            value={calc.tenureYears}
            onValueChange={(v) => setCalc((p) => ({ ...p, tenureYears: Math.round(v) }))}
            minimumValue={5}
            maximumValue={30}
            step={1}
            minimumTrackTintColor="#17855a"
            maximumTrackTintColor="#dceae2"
            thumbTintColor="#17855a"
          />

          <View className="bg-primary rounded-2xl p-4 mt-3">
            <Text className="text-white/80 text-[11px] font-bold uppercase">You could borrow up to</Text>
            <Text className="text-white text-3xl font-bold mt-1">
              {formatMoney(eligibility.eligibleAmount)}
            </Text>
            <Text className="text-white/75 text-xs mt-1">
              Affordable EMI about {formatMoney(eligibility.affordableEmi)}/month
            </Text>
          </View>

          <View className="flex-row justify-between mt-3 pt-3 border-t border-border">
            <Text className="text-xs text-muted">Down payment needed</Text>
            <Text className="text-xs font-bold text-secondary">
              {formatMoney(eligibility.downPaymentNeeded)}
            </Text>
          </View>

          <View className="flex-row items-start gap-1.5 bg-background rounded-xl p-3 mt-3">
            <Info size={13} color="#5c7268" style={{ marginTop: 1 }} />
            <Text className="text-[11px] text-muted flex-1 leading-4">
              An estimate based on standard lender rules. Your actual offer depends on credit
              history and the lender&apos;s assessment.
            </Text>
          </View>
        </View>

        {/* Offers */}
        <View className="px-4 mt-7">
          <Text className="text-xl font-bold text-secondary">
            {loading ? "Loading offers…" : `${products.length} ${products.length === 1 ? "offer" : "offers"} available`}
          </Text>
          <Text className="text-xs text-muted mt-0.5 mb-3">
            EMI shown for {formatMoney(calc.loanAmount)} over {calc.tenureYears} years
          </Text>

          <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
            <Text className="text-[11px] font-bold text-muted uppercase mb-1">
              Compare for a loan of {formatMoney(calc.loanAmount)}
            </Text>
            <Slider
              value={calc.loanAmount}
              onValueChange={(v) => setCalc((p) => ({ ...p, loanAmount: Math.round(v / 100000) * 100000 }))}
              minimumValue={500000}
              maximumValue={30000000}
              step={100000}
              minimumTrackTintColor="#17855a"
              maximumTrackTintColor="#dceae2"
              thumbTintColor="#17855a"
            />
          </View>

          {loading ? (
            <View className="items-center py-12">
              <ActivityIndicator color="#17855a" />
            </View>
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : products.length === 0 ? (
            <View className="border border-dashed border-border rounded-2xl py-12 items-center">
              <Landmark size={26} color="#9ca8a2" />
              <Text className="text-secondary font-semibold mt-2.5">No loan offers listed yet</Text>
              <Text className="text-muted text-sm mt-1">Please check back shortly.</Text>
            </View>
          ) : (
            products.map((p) => (
              <OfferCard
                key={p._id}
                product={p}
                amount={calc.loanAmount}
                tenure={calc.tenureYears}
                onApply={() => handleApply(p)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {applyFor && (
        <LoanApplySheet
          product={applyFor}
          prefill={calc}
          onClose={() => setApplyFor(null)}
        />
      )}

      {showSignIn && (
        <Modal visible transparent animationType="slide" onRequestClose={() => setShowSignIn(false)}>
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-surface rounded-t-3xl" style={{ maxHeight: "92%" }}>
              <View className="flex-row justify-end px-5 pt-5">
                <Pressable onPress={() => setShowSignIn(false)} hitSlop={10}>
                  <X size={20} color="#5c7268" />
                </Pressable>
              </View>
              <SignInPrompt
                title="Sign in to apply"
                message="Your KYC and employment details are saved to your account, so you never have to fill this out twice."
              />
            </View>
          </View>
        </Modal>
      )}
    </Screen>
  );
}

function NumField({ label, hint, value, onChange }) {
  return (
    <View className="mb-3">
      <Text className="text-[11px] font-bold text-muted uppercase mb-1">{label}</Text>
      <TextInput
        value={String(value)}
        onChangeText={(v) => onChange(v.replace(/[^\d]/g, ""))}
        keyboardType="number-pad"
        placeholderTextColor="#9ca8a2"
        className="border border-border rounded-xl px-4 py-3 text-foreground bg-background font-semibold"
      />
      {hint ? <Text className="text-[10px] text-muted mt-1">{hint}</Text> : null}
    </View>
  );
}

function OfferCard({ product, amount, tenure, onApply }) {
  const cappedTenure = Math.min(tenure, product.maxTenureYears);
  const emi = calculateEmi(amount, product.interestRateMin, cappedTenure);
  const fee = processingFee(amount, product);
  const tooLarge = amount > product.maxLoanAmount;

  return (
    <View className="bg-surface rounded-2xl border border-border overflow-hidden mb-4">
      <View className="p-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-bold text-secondary flex-1" numberOfLines={1}>
            {product.lenderName}
          </Text>
          {product.isFeatured && (
            <View className="bg-primary-soft px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold text-primary uppercase">Popular</Text>
            </View>
          )}
        </View>
        <Text className="text-sm text-muted mt-0.5">{product.productName}</Text>

        <View className="flex-row flex-wrap gap-x-5 gap-y-2 mt-3">
          <Stat icon={Percent} label="Interest" value={`${product.interestRateMin}–${product.interestRateMax}%`} />
          <Stat icon={Clock} label="Max tenure" value={`${product.maxTenureYears} yrs`} />
          <Stat icon={Wallet} label="Fee" value={formatMoney(fee)} />
        </View>

        {product.features?.length > 0 && (
          <View className="mt-3 gap-1">
            {product.features.slice(0, 3).map((f) => (
              <View key={f} className="flex-row items-center gap-1.5">
                <Check size={12} color="#17855a" />
                <Text className="text-xs text-muted flex-1">{f}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="border-t border-border p-4 bg-background/50">
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-[10px] font-bold text-muted uppercase">EMI from</Text>
            <Text className="text-2xl font-bold text-secondary">
              {formatMoney(emi)}
              <Text className="text-xs font-medium text-muted">/mo</Text>
            </Text>
            {tooLarge ? (
              <Text className="text-[11px] font-semibold text-amber-600 mt-0.5">
                Above this lender&apos;s {formatMoney(product.maxLoanAmount)} cap
              </Text>
            ) : (
              <Text className="text-[11px] text-muted mt-0.5">
                over {cappedTenure} yrs at {product.interestRateMin}%
              </Text>
            )}
          </View>

          <Pressable
            onPress={onApply}
            className="flex-row items-center gap-1.5 bg-primary px-5 py-3 rounded-xl"
          >
            <Text className="text-white font-bold text-sm">Apply</Text>
            <ArrowRight size={15} color="#fff" />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-center gap-1 mt-2.5">
          <ShieldCheck size={11} color="#5c7268" />
          <Text className="text-[10px] text-muted">No fee to apply</Text>
        </View>
      </View>
    </View>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <View>
      <View className="flex-row items-center gap-1">
        <Icon size={11} color="#5c7268" />
        <Text className="text-[10px] font-bold text-muted uppercase">{label}</Text>
      </View>
      <Text className="text-sm font-bold text-secondary mt-0.5">{value}</Text>
    </View>
  );
}
