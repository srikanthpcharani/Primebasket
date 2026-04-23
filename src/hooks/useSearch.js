import { useEffect, useState } from "react";
import { database } from "../firebase";
import { ref, get } from "firebase/database";
import { KENYA_ALL_PRODUCTS } from "../data/kenya_products";

const ALL_CATS = [
  { value: "rice",               label: "Rice" },
  { value: "oil",                label: "Oil" },
  { value: "wheat-flour",        label: "Wheat Flour" },
  { value: "salt",               label: "Salt" },
  { value: "sugar",              label: "Sugar" },
  { value: "chilli-powder",      label: "Chilli Powder" },
  { value: "turmeric-powder",    label: "Turmeric Powder" },
  { value: "pulses",             label: "Pulses" },
  { value: "masala",             label: "Masala" },
  { value: "fruits",             label: "Fruits" },
  { value: "vegetables",         label: "Vegetables" },
  { value: "dairyProducts",      label: "Dairy Products" },
  { value: "feminineHygiene",    label: "Feminine Hygiene" },
  { value: "homeNeeds",          label: "Home Needs" },
  { value: "babyCare",           label: "Baby Care" },
  { value: "instantFood",        label: "Instant Food" },
  { value: "milkPowders",        label: "Milk Powders" },
  { value: "chipsAndNamkeens",   label: "Chips & Namkeens" },
  { value: "oralCare",           label: "Oral Care" },
  { value: "biscuitsAndCookies", label: "Biscuits & Cookies" },
  { value: "coolDrinks",         label: "Cool Drinks" },
  { value: "bodyCare",           label: "Body Care" },
];

// Caches for different regions
let indexes = { en: null, ke: null };
let promises = { en: null, ke: null };

async function buildIndex(lang) {
  const region = lang === "ke" ? "ke" : "en";
  if (indexes[region]) return indexes[region];
  if (promises[region]) return promises[region];

  if (region === "ke") {
    indexes.ke = { products: KENYA_ALL_PRODUCTS, categories: ALL_CATS };
    return indexes.ke;
  }

  promises.en = Promise.all(
    ALL_CATS.map((cat) =>
      get(ref(database, "categories/" + cat.value)).then((snap) => {
        const val = snap.val();
        if (!val) return [];
        return Object.values(val).map((p, i) => ({
          ...p,
          _cat:   cat.value,
          _catLabel: cat.label,
          _index: i,
          _uid:   `${cat.value}_${i}`,
        }));
      })
    )
  ).then((results) => {
    indexes.en = { products: results.flat(), categories: ALL_CATS };
    return indexes.en;
  });

  return promises.en;
}

export function useSearch(language = "en") {
  const [indexReady, setIndexReady] = useState(false);
  const region = language === "ke" ? "ke" : "en";

  useEffect(() => {
    setIndexReady(!!indexes[region]);
    if (!indexes[region]) {
      buildIndex(language).then(() => setIndexReady(true));
    }
  }, [language, region]);

  const search = (query) => {
    const activeIndex = indexes[region];
    if (!activeIndex || !query || query.trim().length < 1) {
      return { categories: [], products: [] };
    }

    const q = query.trim().toLowerCase();

    const categories = activeIndex.categories.filter((c) =>
      c.label.toLowerCase().includes(q)
    );

    const products = activeIndex.products.filter((p) => {
      const name  = (p.name  || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      return name.includes(q) || brand.includes(q);
    }).slice(0, 8);

    return { categories, products };
  };

  return { search, indexReady };
}