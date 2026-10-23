// What a dish is, and the "show me only..." preference that filters what people see.

export type DishDiet = "veg" | "vegan" | "egg" | "non_veg";
export const DISH_DIETS: { value: DishDiet; label: string }[] = [
  { value: "veg", label: "Veg" },
  { value: "vegan", label: "Vegan" },
  { value: "egg", label: "Egg" },
  { value: "non_veg", label: "Non-veg" },
];

// 'all' = everything, 'vegan' = vegan only, 'veg' = vegetarian (vegan counts), 'egg' = vegetarian and egg.
export type ShowDiet = "all" | "vegan" | "veg" | "egg";
export const SHOW_DIETS: { value: ShowDiet; label: string; hint: string }[] = [
  { value: "all", label: "Everything", hint: "Veg, vegan, egg and non-veg" },
  { value: "vegan", label: "Vegan only", hint: "Only dishes marked vegan" },
  { value: "veg", label: "Vegetarian only", hint: "Veg and vegan; no egg or meat" },
  { value: "egg", label: "Vegetarian + egg", hint: "Everything except non-veg" },
];

export const isVegetarian = (diet: DishDiet) => diet === "veg" || diet === "vegan";

export function allows(show: ShowDiet, diet: DishDiet) {
  if (show === "vegan") return diet === "vegan";
  if (show === "veg") return isVegetarian(diet);
  if (show === "egg") return diet !== "non_veg";
  return true;
}

// The dish diets a preference lets through, for filtering in a query.
export const dietsFor = (show: ShowDiet) => DISH_DIETS.map((d) => d.value).filter((diet) => allows(show, diet));

// Places keep their page, but only list the dishes this person wants to see.
export function filterMenus<R extends { dishes: { diet: DishDiet }[] }>(restaurants: R[], show: ShowDiet): R[] {
  if (show === "all") return restaurants;
  return restaurants.map((r) => ({ ...r, dishes: r.dishes.filter((d) => allows(show, d.diet)) }));
}
