/**
 * Cleans a price string by removing currency symbols like ₹, KES, and Rs.
 * @param {string|number} price 
 * @returns {string} Cleaned price string
 */
export const cleanPrice = (price) => {
  if (price === null || price === undefined) return "0";
  return String(price).replace(/[₹\u20b9]|KES|Rs\.|Rs/g, "").trim();
};
