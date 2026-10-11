import {
  Ban,
  CakeSlice,
  Calendar,
  Coffee,
  Croissant,
  Gift,
  Heart,
  HeartCrack,
  Leaf,
  Martini,
  Salad,
  Sparkles,
  Tag,
  Ticket,
  UtensilsCrossed,
  Globe,
  type LucideIcon,
} from "lucide-react";

// Survey definitions: the framework reads these, so a new survey is a new entry
// here plus its suggestions in surveySuggestions.ts.

export type Sentiment = "love" | "like" | "avoid";
export type Severity = "slight" | "moderate" | "severe";

export const SENTIMENT_LABEL: Record<Sentiment, string> = { love: "Love", like: "Like", avoid: "Not for me" };
export const SEVERITIES: Severity[] = ["slight", "moderate", "severe"];

interface SectionBase {
  id: string;
  title: string;
  /** One line on the overview, written to jog memory */
  prompt: string;
  /** What Kinnit asks when this area's chip is tapped in the talk panel */
  ask: string;
  icon: LucideIcon;
  optional?: boolean;
}

/** Tap chips in a mode. One mode hides the mode switch. */
export interface ChipSection extends SectionBase {
  kind: "chips";
  modes: Sentiment[];
  /** Label for a single-mode section's chips, e.g. "Gifts to skip" */
  singleLabel?: string;
  /** Mobile talk panel: group this section's answers under its own heading ("Coffee") instead of by Love/Like */
  heardGroup?: string;
  chips: string[];
}

export interface AllergySection extends SectionBase {
  kind: "allergies";
  chips: string[];
}

export interface DatesSection extends SectionBase {
  kind: "dates";
  /** Quick starts: a label, and a fixed MM-DD when the day doesn't move */
  starters: { label: string; date?: string; who?: string }[];
}

export interface FieldsSection extends SectionBase {
  kind: "fields";
  fields: string[];
}

export type SurveySection = ChipSection | AllergySection | DatesSection | FieldsSection;

export type IntegrationTile =
  | { kind: "connect"; id: string; title: string; detail: string; icon: "cart" | "board" | "restaurant" | "recipe" }
  | { kind: "link" | "photo"; id: string; title: string; detail: string };

export interface SurveyDef {
  id: string;
  title: string;
  /** Sentence under the title on the overview */
  intro: string;
  /** Sentence under the title behind the talk panel */
  talkBackdrop: string;
  /** Kinnit's opening line in the talk panel */
  talkIntro: string;
  /** Placeholder for typing when there's no microphone */
  typedExample: string;
  /** Shorter area names for the talk panel's prompt chips */
  talkAreas: { sectionId: string; label: string }[];
  sections: SurveySection[];
  integrations: IntegrationTile[];
  /** Short name for the integration card in the tap route */
  bringItIn?: { title: string; detail: string; mobileTitle: string; mobileDetail: string };
  /** Where free answers land when Kinnit can't tell the section */
  fallbackSection: string;
  /** Show a free text box under each section's chips */
  freeText?: boolean;
}

export const SURVEYS: SurveyDef[] = [
  {
    id: "gift-preferences",
    title: "Gift guide",
    intro: "Help the people who love you give well. Skip anything you like.",
    talkBackdrop: "Think about the best gifts you've gotten, and the ones that missed. Just say it out loud.",
    typedExample: "I'd love a framed photo or something handmade. Please skip candles…",
    talkIntro: "Tell me what you'd love to get, what you'd rather not, and what feels meaningful to you.",
    talkAreas: [
      { sectionId: "love", label: "Things I'd love" },
      { sectionId: "dont", label: "Gifts to skip" },
      { sectionId: "experiences", label: "Experiences" },
      { sectionId: "sentimental", label: "Sentimental" },
      { sectionId: "flowers", label: "Flowers" },
      { sectionId: "sizes", label: "Sizes" },
    ],
    fallbackSection: "love",
    freeText: true,
    sections: [
      {
        id: "love",
        kind: "chips",
        title: "Things you'd love",
        prompt: "What's in your online carts, or what you keep eyeing.",
        ask: "What's something you keep eyeing but never buy for yourself?",
        icon: Gift,
        modes: ["love", "like"],
        chips: [
          "Cozy clothes",
          "Kitchen tools",
          "Coffee gear",
          "Art supplies",
          "Jewelry",
          "Skincare",
          "Stationery",
          "Games and puzzles",
          "Tech gadgets",
          "Garden things",
          "Music",
          "Outdoor gear",
        ],
      },
      {
        id: "dont",
        kind: "chips",
        title: "Gifts to skip",
        prompt: "Books, houseplants, candles. What do you have plenty of?",
        ask: "Is there anything you'd rather people didn't get you?",
        icon: Ban,
        modes: ["avoid"],
        singleLabel: "Gifts to skip",
        chips: [
          "Books",
          "Houseplants",
          "Candles",
          "Gift cards",
          "Mugs",
          "Clothes",
          "Scented things",
          "Home decor",
          "Chocolate",
          "Novelty items",
        ],
      },
      {
        id: "experiences",
        kind: "chips",
        title: "Experiences",
        prompt: "Dinners, tickets, classes, a day away.",
        ask: "What kind of outing or experience would make your day?",
        icon: Ticket,
        modes: ["love", "like", "avoid"],
        chips: [
          "Dinner out",
          "Concert tickets",
          "Theater",
          "A class",
          "A day away",
          "Spa day",
          "Sports game",
          "Museum",
          "Cooking together",
          "Weekend trip",
        ],
      },
      {
        id: "sentimental",
        kind: "chips",
        title: "Something sentimental",
        prompt: "A letter in the mail, a photo, something handmade.",
        ask: "What's a small, meaningful thing someone has given you that stuck with you?",
        icon: Heart,
        modes: ["love", "like"],
        chips: [
          "A letter in the mail",
          "A framed photo",
          "Something handmade",
          "A playlist",
          "A photo book",
          "A recorded message",
          "A memory jar",
        ],
      },
      {
        id: "flowers",
        kind: "chips",
        title: "Flowers and plants",
        prompt: "Favorites, and what you'd rather not receive.",
        ask: "Do you like getting flowers? Any favorites, or ones you'd skip?",
        icon: Leaf,
        optional: true,
        modes: ["love", "like", "avoid"],
        chips: [
          "Peonies",
          "Tulips",
          "Roses",
          "Sunflowers",
          "Hydrangeas",
          "Wildflowers",
          "Orchids",
          "Lilies",
          "Succulents",
          "Dried flowers",
        ],
      },
      {
        id: "sizes",
        kind: "fields",
        title: "Sizes and fits",
        prompt: "A boot size friends keep asking about? Add it here.",
        ask: "Any sizes people should know, like shoes, tops, or a ring?",
        icon: Tag,
        optional: true,
        fields: ["Tops", "Bottoms", "Dress", "Shoes", "Ring", "Hat"],
      },
    ],
    integrations: [
      { kind: "connect", id: "wishlists", title: "Online wish lists", detail: "Carts and saved items", icon: "cart" },
      { kind: "connect", id: "boards", title: "Saved boards", detail: "Pinboards", icon: "board" },
      { kind: "link", id: "link", title: "Paste a link", detail: "A product or page" },
      { kind: "photo", id: "photo", title: "Add a photo", detail: "Something you love" },
    ],
    bringItIn: {
      title: "Bring it in",
      detail: "Wish lists, saved boards, links, and photos help fill this in.",
      mobileTitle: "Bring in saved items",
      mobileDetail: "Wish lists, boards",
    },
  },
  {
    id: "food-drink",
    title: "Feed me",
    intro: "What you love to eat and drink, and what to steer clear of. Skip anything you like.",
    talkBackdrop: "Picture your favorite meal, your usual coffee order, the dish you always skip. Just say it out loud.",
    talkIntro: "Tell me what you love, what you avoid, and how you take your coffee.",
    typedExample: "I love Japanese food, sushi especially. I take my coffee as an oat flat white…",
    talkAreas: [
      { sectionId: "cuisines", label: "Cuisines" },
      { sectionId: "coffee", label: "Coffee" },
      { sectionId: "drinks", label: "Drinks" },
      { sectionId: "dietary", label: "Diet" },
    ],
    fallbackSection: "dishes",
    sections: [
      {
        id: "cuisines",
        kind: "chips",
        title: "Cuisines",
        prompt: "The kinds of food you always come back to, and the ones you skip.",
        ask: "What cuisines do you always come back to?",
        icon: Globe,
        modes: ["love", "like", "avoid"],
        chips: [
          "Japanese",
          "Persian",
          "Italian",
          "Mexican",
          "Korean",
          "Thai",
          "Indian",
          "Mediterranean",
          "French",
          "Ethiopian",
          "Vietnamese",
          "Lebanese",
          "American BBQ",
          "Chinese",
        ],
      },
      {
        id: "dishes",
        kind: "chips",
        title: "Dishes and places",
        prompt: "The order you never change, and the dish you'd send back.",
        ask: "Is there a dish or a spot you'd pick every time?",
        icon: UtensilsCrossed,
        modes: ["love", "like", "avoid"],
        chips: [
          "Sushi",
          "Ramen",
          "Tacos",
          "Pizza",
          "Pho",
          "Dumplings",
          "Burgers",
          "Pasta",
          "Curry",
          "Brunch spots",
          "Bakeries",
          "Food trucks",
        ],
      },
      {
        id: "coffee",
        kind: "chips",
        title: "Coffee and tea",
        prompt: "How you take it, so a coffee run comes back right.",
        ask: "How do you take your coffee or tea?",
        icon: Coffee,
        heardGroup: "Coffee",
        modes: ["love", "like", "avoid"],
        chips: [
          "Black coffee",
          "Oat milk latte",
          "Cappuccino",
          "Espresso",
          "Cold brew",
          "Iced coffee",
          "Decaf",
          "Green tea",
          "Chai",
          "Matcha",
          "Herbal tea",
          "Earl Grey",
        ],
      },
      {
        id: "drinks",
        kind: "chips",
        title: "Drinks and cocktails",
        prompt: "What you'd order at the bar, or the bottle to bring over.",
        ask: "What would you order if someone else was buying the round?",
        icon: Martini,
        modes: ["love", "like", "avoid"],
        chips: [
          "Red wine",
          "White wine",
          "Sparkling wine",
          "Beer",
          "Margarita",
          "Negroni",
          "Old fashioned",
          "Mocktails",
          "Kombucha",
          "Sparkling water",
          "Whiskey",
        ],
      },
      {
        id: "breakfast",
        kind: "chips",
        title: "Breakfast",
        prompt: "The perfect slow morning, or what gets you out the door.",
        ask: "What does a perfect breakfast look like for you?",
        icon: Croissant,
        modes: ["love", "like", "avoid"],
        chips: [
          "Eggs",
          "Pancakes",
          "Bagels",
          "Avocado toast",
          "Oatmeal",
          "Smoothies",
          "Pastries",
          "Yogurt and granola",
          "Skip breakfast",
        ],
      },
      {
        id: "dietary",
        kind: "chips",
        title: "Dietary choices",
        prompt: "Vegetarian, kosher, and so on. Anything a host should plan around.",
        ask: "Is there anything a host should plan around when they cook for you?",
        icon: Salad,
        heardGroup: "Diet",
        modes: ["like"],
        singleLabel: "Applies to me",
        chips: [
          "Vegetarian",
          "Vegan",
          "Pescatarian",
          "Gluten-free",
          "Dairy-free",
          "Halal",
          "Kosher",
          "Low sugar",
          "No pork",
          "No red meat",
          "No alcohol",
        ],
      },
    ],
    integrations: [
      { kind: "connect", id: "resy", title: "Resy", detail: "Saved restaurants", icon: "restaurant" },
      { kind: "connect", id: "corner", title: "Corner", detail: "Saved places", icon: "restaurant" },
      { kind: "connect", id: "recipes", title: "Recipe apps", detail: "Saved recipes", icon: "recipe" },
    ],
    bringItIn: {
      title: "Bring it in",
      detail: "Saved restaurants and recipes help fill this in.",
      mobileTitle: "Bring in saved restaurants",
      mobileDetail: "Resy, Corner",
    },
  },
  {
    id: "important-dates",
    title: "Dates that matter",
    intro: "The days that matter to you, and how you like them marked.",
    talkBackdrop: "Look over your year. Anything come to mind? Say it out loud and it lands on the calendar.",
    typedExample: "My birthday is March 4th, and I don't like a big fuss…",
    talkIntro: "Let's go through your year. Tell me the dates that matter to you, and how you like them marked.",
    talkAreas: [
      { sectionId: "birthdays", label: "Birthdays" },
      { sectionId: "anniversaries", label: "Anniversaries" },
      { sectionId: "holidays", label: "Holidays I celebrate" },
      { sectionId: "hard", label: "Hard days" },
      { sectionId: "cultural", label: "Cultural or religious days" },
    ],
    fallbackSection: "birthdays",
    sections: [
      {
        id: "birthdays",
        kind: "dates",
        title: "Birthdays",
        prompt: "Yours, and how you like it celebrated. Big party or low-key?",
        ask: "When's your birthday, and how do you like it marked?",
        icon: CakeSlice,
        starters: [{ label: "My birthday", who: "Yours" }],
      },
      {
        id: "anniversaries",
        kind: "dates",
        title: "Anniversaries",
        prompt: "Weddings, first dates, the day you moved in.",
        ask: "Are there anniversaries you like to mark?",
        icon: Heart,
        starters: [{ label: "Wedding anniversary" }, { label: "Dating anniversary" }, { label: "Work anniversary" }],
      },
      {
        id: "holidays",
        kind: "dates",
        title: "Holidays you celebrate",
        prompt: "The ones you go all out for, and the ones you skip.",
        ask: "Which holidays do you celebrate?",
        icon: Sparkles,
        starters: [
          { label: "New Year's Day", date: "01-01" },
          { label: "Valentine's Day", date: "02-14" },
          { label: "Fourth of July", date: "07-04" },
          { label: "Halloween", date: "10-31" },
          { label: "Thanksgiving" },
          { label: "Christmas", date: "12-25" },
        ],
      },
      {
        id: "hard",
        kind: "dates",
        title: "Hard days",
        prompt: "Days that are heavy, so people can check in gently.",
        ask: "Are there days in the year that are hard for you, when a check-in would help?",
        icon: HeartCrack,
        starters: [{ label: "Anniversary of a loss" }, { label: "A tough day" }],
      },
      {
        id: "cultural",
        kind: "dates",
        title: "Cultural or religious days",
        prompt: "Observances and traditions that matter to you.",
        ask: "Are there cultural or religious days you observe?",
        icon: Calendar,
        starters: [
          { label: "Lunar New Year" },
          { label: "Diwali" },
          { label: "Eid al-Fitr" },
          { label: "Passover" },
          { label: "Easter" },
          { label: "Hanukkah" },
          { label: "St. Patrick's Day", date: "03-17" },
          { label: "Day of the Dead", date: "11-02" },
        ],
      },
    ],
    integrations: [],
  },
];

export function getSurvey(id: string | undefined): SurveyDef | undefined {
  return SURVEYS.find((s) => s.id === id);
}

