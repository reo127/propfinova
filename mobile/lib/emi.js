// Same price-string parsing as the web app's PropertyDetails.jsx, so "2.08 Cr
// - 2.78 Cr" style strings seed the calculator with a sane starting number.
export function parsePriceToNumber(price) {
  if (!price) return 5000000;
  if (typeof price === "number") return price;

  const priceStr = price.toString().toLowerCase();
  const chunk = priceStr.includes("-") ? priceStr.split("-")[0].trim() : priceStr;
  const numMatch = chunk.match(/[\d.]+/);
  if (!numMatch) return 5000000;

  const value = parseFloat(numMatch[0]);
  if (chunk.includes("cr")) return value * 10000000;
  if (chunk.includes("l")) return value * 100000;
  return value;
}

// Same formula as the web app's EMICalculatorV2 (src/app/components/EMICalculatorV2.jsx)
// so the two surfaces always agree on the number shown to a buyer.
export function computeEmi({ price, downPaymentPercent, interestRate, tenureYears }) {
  if (!price || isNaN(price) || price <= 0) return null;

  const downPayment = (price * downPaymentPercent) / 100;
  const principal = price - downPayment;
  const monthlyRate = interestRate / 12 / 100;
  const tenureMonths = tenureYears * 12;

  if (principal <= 0 || tenureMonths <= 0) return null;

  const emi =
    monthlyRate === 0
      ? principal / tenureMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  const totalAmount = emi * tenureMonths;
  const totalInterest = totalAmount - principal;

  if (isNaN(emi) || isNaN(totalAmount)) return null;

  return {
    monthlyEMI: emi,
    principal,
    downPayment,
    totalInterest,
    totalAmount,
    principalPercent: (principal / totalAmount) * 100,
    interestPercent: (totalInterest / totalAmount) * 100,
  };
}
