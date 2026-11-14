// Ported verbatim from the web app's src/utils/formatPrice.js so a listing
// never shows a different price string on phone than it does on the site.
export function formatPrice(price) {
  if (!price) return "Price on request";

  if (typeof price === "string") {
    const numericPrice = parseFloat(price);
    if (!isNaN(numericPrice) && numericPrice.toString() === price) {
      if (numericPrice >= 10000000) return `₹${(numericPrice / 10000000).toFixed(1)}Cr`;
      if (numericPrice >= 100000) return `₹${(numericPrice / 100000).toFixed(1)}L`;
      return `₹${numericPrice.toLocaleString()}`;
    }
    return price.includes("₹") ? price : `₹${price}`;
  }

  if (typeof price === "number") {
    if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)}Cr`;
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    return `₹${price.toLocaleString()}`;
  }

  return `₹${price}`;
}

export function typeLabel(type) {
  return (type || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function modeLabel(mode) {
  if (mode === "rent") return "For Rent";
  return "For Sale";
}

export function firstImage(gallery) {
  return Array.isArray(gallery) && gallery.length > 0 ? gallery[0] : null;
}

// Used by the EMI calculator's own result panel, where we always hold a real
// number rather than the free-text price string a listing carries.
export function formatCurrency(amount) {
  if (!amount || isNaN(amount)) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} Lac`;
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}
