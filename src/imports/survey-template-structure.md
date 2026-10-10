Edit the existing **About Me → Surveys** experience to create a **structured survey template** that can be reused for all preference surveys in the Celebrations app.

Use **“Flowers, Plants & Objects”** as the example survey that establishes the pattern.

Do not create a new product area. This should extend the existing survey flow.

---

### Survey Design Goals

The survey pattern should support three layers:

1. **Interest signal** (quick preference level)
2. **Nuance** (reasons, constraints, conditions)
3. **Style preferences** (visual taste with image selections)

Every survey in the system will follow this structure.

The UI should feel **interactive, friendly, and visual**, not like a boring form.

Include:

• sliders
• image selection grids
• checkboxes
• optional text fields
• conditional follow-up questions

Use generous spacing and keep the experience lightweight and scrollable.

---

# Survey Example: Flowers, Plants & Objects

### Intro block

At the top of the survey show a short explanation:

"These questions help people know what small gestures you enjoy receiving.
Think bouquets, houseplants, cards, sweets, or little tokens people might bring when celebrating you."

---

# Section 1 — Flowers

### Question 1

**Do you like receiving flowers?**

Component: slider scale from 1–5

Labels:

1 — Please don’t give me flowers
2 — Usually no
3 — Occasionally
4 — Yes
5 — I love receiving flowers

If the user selects **1 or 2**, reveal an optional follow-up block:

**Why not?** (checkboxes)

• I’m allergic to many flowers
• I think cut flowers are wasteful
• Pets could get into them
• I prefer plants instead
• They’re hard for me to maintain
• Other (text field)

---

### Question 2

**If someone gives you flowers, what styles do you prefer?**

Component: image selection grid (multi-select)

Each option should display a photo tile.

Options:

• Classic bouquet (roses and baby's breath)
• Wildflowers / meadow style
• Minimal modern bouquet
• Single-flower bouquets (all tulips, all lilies)
• Dramatic or unusual flowers
• Seasonal / locally grown flowers
• Hand-picked flowers

---

### Question 3

**Flower preferences**

Component: tags + optional text field

Prompt examples:

• favorite flowers
• flowers you dislike
• color preferences
• color combinations you love

Include an open text field:

"Anything else people should know?"

---

# Section 2 — Plants

### Question 4

**Do you like receiving houseplants?**

Slider 1–5

1 — Please don’t give me plants
2 — Rarely
3 — Sometimes
4 — Yes
5 — I love getting plants

If 1–2 selected show optional reasons:

• I don’t have enough light
• I travel too often
• I already have too many plants
• I struggle to keep them alive
• Pets could eat them
• I prefer flowers instead
• Other (text field)

---

### Question 5

**What kind of plant person are you?**

Image or illustrated selection tiles (single select)

• Beginner plant parent — easy plants only
• Casual plant person — a few plants, moderate care
• Plant enthusiast — I enjoy caring for them
• Plant collector — rare plants welcome

---

### Question 6

**Types of plants you’d enjoy receiving**

Image grid (multi-select)

• Pothos / trailing plants
• Snake plant
• Monstera / statement plants
• Herbs
• Succulents
• Propagation cuttings
• Outdoor plants
• Small desk plants

---

### Question 7

**Helpful extras**

Checkbox list:

• Include a pot
• No pot needed
• Care instructions appreciated
• I enjoy propagation cuttings
• Please avoid toxic plants for pets

Optional text field:

"Plant wishlist or notes"

---

# Section 3 — Small Objects

These represent casual gifts or tokens people might bring.

---

### Question 8

**Do you enjoy small surprise gifts?**

Slider 1–5

1 — Please don’t give me things
2 — Rarely
3 — Sometimes
4 — Yes
5 — I love thoughtful little gifts

---

### Question 9

**Things you’d enjoy receiving**

Illustrated checklist (multi-select)

• Chocolate or sweets
• Postcards
• Letters
• Birthday cards
• Books
• Candles
• Cozy socks
• Tea
• Coffee
• Homemade treats

---

### Question 10

**Things to avoid**

Checklist

• Candles
• Scented items
• Books
• Food gifts
• Trinkets
• Decorations

Include optional text:

"Anything you’d rather not receive"

---

### Final Question

**Thoughtful gestures you especially love**

Open text field.

Placeholder examples:

"A handwritten note means a lot to me."
"Wildflowers picked during a walk."
"A simple birthday card."

---

# Interaction behavior

• Sliders update labels dynamically
• Conditional questions appear smoothly when relevant
• Image tiles support multi-select states
• All text fields optional
• Survey progress autosaves

---

# Component System (important)

Create reusable components:

• survey section container
• slider preference question
• image selection grid
• conditional follow-up block
• checkbox list question
• open text reflection question

These components should power future surveys such as food, celebrations, hosting, hobbies, and experiences.

The **Flowers, Plants & Objects survey acts as the first implementation of the survey framework**.
