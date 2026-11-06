// Utility function to format price for display
export function formatPrice(price) {
  if (!price) return 'Price not available';
  
  // If price is already a string and contains non-numeric characters, return as is
  if (typeof price === 'string') {
    // Check if it's a pure number string
    const numericPrice = parseFloat(price);
    if (!isNaN(numericPrice) && numericPrice.toString() === price) {
      // It's a numeric string, format it
      if (numericPrice >= 10000000) {
        return `₹${(numericPrice / 10000000).toFixed(1)}Cr`;
      } else if (numericPrice >= 100000) {
        return `₹${(numericPrice / 100000).toFixed(1)}L`;
      } else {
        return `₹${numericPrice.toLocaleString()}`;
      }
    }
    
    // It's a descriptive string (like "1cr - 1.5cr"), return as is with currency symbol if not present
    if (price.includes('₹')) {
      return price;
    } else {
      return `₹${price}`;
    }
  }
  
  // If it's a number, format it properly
  if (typeof price === 'number') {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(1)}L`;
    } else {
      return `₹${price.toLocaleString()}`;
    }
  }
  
  return `₹${price}`;
}

export default formatPrice;