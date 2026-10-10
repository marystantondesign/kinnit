Refactor the architecture of the existing prototype. Do not redesign the UI. Do not create new visual layouts. Do not generate additional screens. Only adjust the conceptual structure of the product so that all current and future screens are based on the correct system objects.

This application is a private, invitation-only platform that helps people document how they want to be known, celebrated, supported, and remembered by their trusted network.

It is NOT a social media platform. There is no public discovery, no follower system, and no content feed.

Users only interact with people they have mutually connected with.

The system must be structured around four primary object types.

OBJECT 1 — PEOPLE

Represents real individuals connected through mutual invitation.

People include:
- the user
- connected people
- pending invites
- sent invites

People objects store relationship-level information such as:
- name
- avatar
- connection status
- shared visibility permissions

People are not contacts imported from a phone. They are intentional trusted connections.


OBJECT 2 — OCCASIONS

Occasions represent meaningful life events or moments.

Occasions can be recurring or situational.

Recurring examples:
- birthdays
- anniversaries
- memorial anniversaries

Situational examples:
- surgery
- breakup
- grief or loss
- illness or recovery
- trips
- gatherings
- major milestones

Occasions may include one or more people.

Occasions can optionally have collaborative planning attached to them.


OBJECT 3 — PLANS

Plans represent collaborative coordination spaces connected to occasions or shared experiences.

Plans are NOT the occasion itself.

Plans exist to organize logistics around an occasion or moment.

Examples:
- birthday dinner planning
- group trip coordination
- hospital care schedule
- gift pooling
- event preparation

Plans may include:
- participants
- organizers or leaders
- tasks
- notes
- links or resources

Plans can be connected to an Occasion but are separate objects.


OBJECT 4 — ABOUT ME

About Me represents structured knowledge about a person.

This replaces the concept of a simple "profile."

About Me stores structured preference information that trusted connections can reference.

Examples of About Me information include:
- basic info
- important dates
- gift preferences
- clothing or shoe sizes
- food and drink preferences
- allergies or restrictions
- flowers, plants, or object preferences
- celebration preferences
- care preferences
- communication preferences
- survey responses

This information is organized into separate sections that can be shared with different people.


OBJECT 5 — LIFE & LEGACY

The system must include a structured place for end-of-life preferences and after-death instructions.

This includes:
- living will information
- funeral or memorial preferences
- music or readings
- burial or cremation wishes
- instructions for belongings
- celebration of life preferences

This object exists to normalize planning for death as part of life and should be treated as a standard part of the system rather than hidden or excluded.


ARCHITECTURE REQUIREMENTS

Do not generate UI layouts.

Do not create visual components.

Do not modify the current page designs.

Only ensure that the system architecture clearly supports these five object types:
- People
- Occasions
- Plans
- About Me
- Life & Legacy

Ensure that future screens and flows can reference these objects correctly.

Return the prototype structure aligned to this object model without introducing new visual design decisions.