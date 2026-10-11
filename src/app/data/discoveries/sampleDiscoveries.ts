import type { Discovery } from "./types";

// SAMPLE DATA — prototype content only, not real user data.
// Each basis names user-entered or explicitly shared information.

export const SAMPLE_DISCOVERIES: Discovery[] = [
  {
    id: "d-hiking",
    topic: "hiking",
    statement: "You, John, and Sylvia all enjoy hiking.",
    people: ["You", "John Walker", "Sylvia Park"],
    basis: "Your About Me, plus hobbies John and Sylvia shared with you.",
  },
  {
    id: "d-cooking",
    topic: "cooking",
    statement: "You and Priya both love cooking Thai food.",
    people: ["You", "Priya Patel"],
    basis: "Your About Me, plus food preferences Priya shared with you.",
  },
  {
    id: "d-music",
    topic: "music",
    statement: "Sarah and Michael both listed live jazz as a favorite night out.",
    people: ["Sarah Johnson", "Michael Chen"],
    basis: "Celebration preferences Sarah and Michael shared with you.",
  },
  {
    id: "d-art",
    topic: "art",
    statement: "You and Emma both enjoy painting.",
    people: ["You", "Emma Davis"],
    basis: "Your About Me, plus hobbies Emma shared with you.",
  },
  {
    id: "d-gardening",
    topic: "gardening",
    statement: "Lisa and Tom both grow their own tomatoes.",
    people: ["Lisa Anderson", "Tom Becker"],
    basis: "Hobbies Lisa and Tom shared with you.",
  },
  {
    id: "d-reading",
    topic: "reading",
    statement: "You, Jen, and Aiko are all into mystery novels.",
    people: ["You", "Jen Zambrano", "Aiko Tanaka"],
    basis: "Your About Me, plus favorites Jen and Aiko shared with you.",
  },
];
