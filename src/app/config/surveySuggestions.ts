// "Kinnit suggests, based on what you picked": a curated map from a picked
// chip to related chips. Smarter suggestions can replace this later.
// Keys and values are chip labels; matching ignores case.

export const SURVEY_SUGGESTIONS: Record<string, string[]> = {
  // Food and drink: cuisines
  japanese: ["Sushi", "Ramen", "Izakaya", "Udon", "Matcha"],
  persian: ["Kebab", "Saffron rice", "Tahdig", "Ghormeh sabzi"],
  italian: ["Pasta", "Pizza", "Risotto", "Gelato", "Negroni"],
  mexican: ["Tacos", "Mole", "Margarita", "Elote"],
  korean: ["Korean BBQ", "Bibimbap", "Kimchi", "Fried chicken"],
  thai: ["Pad thai", "Green curry", "Thai iced tea"],
  indian: ["Curry", "Biryani", "Dosa", "Chai"],
  mediterranean: ["Hummus", "Falafel", "Grilled fish"],
  french: ["Bakeries", "Croissants", "Steak frites", "Red wine"],
  ethiopian: ["Injera", "Doro wat"],
  vietnamese: ["Pho", "Banh mi", "Vietnamese coffee"],
  lebanese: ["Shawarma", "Tabbouleh", "Manakish"],
  chinese: ["Dumplings", "Dim sum", "Hot pot", "Peking duck"],
  "american bbq": ["Brisket", "Ribs", "Mac and cheese"],
  // Food and drink: dishes, coffee, drinks, breakfast
  sushi: ["Omakase", "Hand rolls", "Sashimi"],
  ramen: ["Tonkotsu", "Gyoza"],
  tacos: ["Al pastor", "Birria", "Food trucks"],
  pizza: ["Neapolitan", "New York slice"],
  "brunch spots": ["Eggs", "Pancakes", "Mimosas"],
  bakeries: ["Croissants", "Sourdough", "Pastries"],
  espresso: ["Cortado", "Macchiato"],
  "oat milk latte": ["Cappuccino", "Chai"],
  "cold brew": ["Iced coffee", "Vietnamese coffee"],
  "green tea": ["Matcha", "Jasmine tea"],
  "red wine": ["Pinot noir", "Rioja", "Natural wine"],
  "white wine": ["Sauvignon blanc", "Chablis"],
  margarita: ["Mezcal", "Paloma"],
  negroni: ["Aperol spritz", "Mezcal negroni"],
  mocktails: ["Kombucha", "Sparkling water", "Shrub soda"],
  pancakes: ["Waffles", "French toast"],
  bagels: ["Lox", "Everything bagel"],
  // Gift preferences
  "cozy clothes": ["Wool socks", "A good sweater", "Slippers"],
  "kitchen tools": ["A good knife", "Cast iron pan", "Cookbook stand"],
  "coffee gear": ["Pour-over set", "Nice beans", "A travel mug"],
  "art supplies": ["Sketchbook", "Watercolors", "Nice pens"],
  stationery: ["Nice pens", "A planner", "Letterpress cards"],
  "games and puzzles": ["Jigsaw puzzles", "Board games", "Crosswords"],
  "outdoor gear": ["Hiking socks", "A water bottle", "Trail maps"],
  "garden things": ["Seeds", "Garden gloves", "A nice trowel"],
  music: ["Vinyl records", "Concert tickets"],
  "dinner out": ["Omakase", "A new restaurant", "Tasting menu"],
  "a class": ["Cooking class", "Pottery class", "Dance class"],
  "a day away": ["Weekend trip", "Spa day", "A cabin"],
  "concert tickets": ["Theater", "Comedy show"],
  "a framed photo": ["A photo book", "A printed favorite"],
  "a letter in the mail": ["Postcards", "A recorded message"],
  peonies: ["Garden roses", "Ranunculus"],
  tulips: ["Ranunculus", "Daffodils"],
  sunflowers: ["Wildflowers", "Dahlias"],
};

export function suggestionsFor(picked: string[], exclude: string[], limit = 5): string[] {
  const taken = new Set([...picked, ...exclude].map((s) => s.toLowerCase()));
  const out: string[] = [];
  for (const p of picked) {
    for (const s of SURVEY_SUGGESTIONS[p.toLowerCase()] ?? []) {
      if (!taken.has(s.toLowerCase()) && !out.some((o) => o.toLowerCase() === s.toLowerCase())) out.push(s);
      if (out.length >= limit) return out;
    }
  }
  return out;
}
