Refactor the global navigation structure of the current prototype.

Do not redesign the visual style of the interface. Only change the navigation architecture and page naming.

The application should use a left sidebar navigation that behaves as follows:

The sidebar must support two states:
1. Expanded state showing icons and labels
2. Collapsed state showing icons only

Each navigation item must include an icon positioned to the left of the label so that when the sidebar collapses the icons remain visible.

The sidebar must be narrower than it currently is and should not occupy excessive horizontal space.

Update the navigation structure to the following sections in this exact order:

Home
People
Occasions
Plans
About Me
Settings

Rename the existing "Profile" section to "About Me".

Do not place preference inputs directly inside the About Me page. That page will later act as a hub for multiple cards representing sections about the user.

Keep all existing screens but reorganize them under the correct navigation section.

People should contain:
- People directory
- Pending invites
- Sent invites
- Individual person pages

Occasions should contain:
- Occasion categories
- Individual occasion pages

Plans should contain:
- Plans index
- Individual plan workspaces

About Me should contain:
- the user's personal information sections and preference areas

Settings should contain:
- account
- privacy
- integrations
- notification preferences
- data export and deletion

Do not create new visual UI patterns. Only reorganize the existing pages and navigation so the system structure matches this architecture.