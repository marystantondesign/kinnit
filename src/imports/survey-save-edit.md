Edit the existing **Flowers, Plants & Objects survey** so that survey responses can be saved and edited.

Do not redesign the survey layout. Only add saving behavior and completion state.

---

### 1. Save Behavior

When the user taps **Save Survey**:

• All responses should persist
• The survey should display a brief confirmation state
• The button should change to **Saved**

Show a small confirmation message:

“Your survey responses have been saved.”

---

### 2. Completed Survey State (About Me screen)

If the user has already completed the survey:

The survey should NOT open automatically.

Instead show a **survey card** that displays:

Flowers, Plants & Objects
Status: Completed

Include two actions:

• **View Responses**
• **Edit Survey**

---

### 3. Viewing Responses

When the user opens a completed survey:

• All previously selected responses should appear pre-filled
• Sliders, checkboxes, and image selections should reflect saved choices

At the bottom show:

Save Changes

---

### 4. Unsaved Changes State

If the user edits a response:

• Change the button to **Save Changes**
• Show small helper text:

“Changes autosave when you tap Save.”

---

### 5. About Me Survey List

On the About Me screen, survey cards should show:

Survey Title
Completion status

Example:

Flowers, Plants & Objects
Completed

Tapping the card opens the saved responses.

---

This behavior should apply to all surveys in the system so future surveys inherit the same save and edit logic.
