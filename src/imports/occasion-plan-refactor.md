Refactor the relationship between Occasions and Plans in the existing prototype.

Do not redesign the visual UI. Do not introduce new visual styles. Only modify the structure and content logic of existing pages so the distinction between Occasions and Plans is clear.

In this product, Occasions and Plans represent two different types of objects.

OCCASIONS

Occasions represent meaningful life moments or events connected to people.

Examples include:
- birthdays
- anniversaries
- graduations
- memorial anniversaries
- surgeries
- illness or recovery
- breakups
- loss or grief
- trips
- gatherings
- major milestones
- living will or end-of-life arrangements

Occasions can be recurring (such as birthdays or anniversaries) or situational (such as a surgery or trip).

Occasions should primarily contain:
- the people connected to the occasion
- important dates or timing
- contextual information about the moment
- references to relevant preferences from About Me sections

Occasions should NOT contain detailed logistics or task coordination.


PLANS

Plans represent collaborative coordination spaces that help people organize something related to an occasion or shared activity.

Examples include:
- planning a birthday dinner
- coordinating a group trip
- organizing hospital care support
- pooling money for a gift
- planning a memorial gathering

Plans may optionally be connected to an Occasion but they remain a separate object.

Plans should contain:
- participants
- organizers or leaders
- tasks
- notes
- links or resources


REFACTOR THE CURRENT SCREENS

Update the Occasions pages so they focus on life events and people involved, rather than planning logistics.

Update the Plans pages so they clearly represent collaborative workspaces rather than event definitions.

On the Plans index page:
replace the "linked to" emphasis with clearer context showing:

- who created or leads the plan
- who the plan is for
- participants involved
- plan status

Plans should appear as collaborative items rather than simple references to occasions.

Occasion pages should display any related plans as optional associated items.

Do not add new pages yet. Only refactor the meaning and relationships between the existing Occasions and Plans pages so the system clearly separates:

Occasion = life moment
Plan = coordination workspace