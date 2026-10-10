Perform a structural integrity pass on the prototype to ensure that navigation, object references, and list interactions work correctly.

Do not redesign the visual interface. Do not introduce new UI styles. Only correct interaction logic, object binding, and structural consistency.

PEOPLE DIRECTORY BEHAVIOR

Each person card in the People directory must link to that specific person’s detail page.

Currently multiple people link to the same profile. This must be corrected so each person object opens its own detail page.

Example:
Sarah Johnson card → Sarah Johnson detail page  
Michael Chen card → Michael Chen detail page  
Emma Davis card → Emma Davis detail page

Person pages must reflect the correct name and avatar for the selected person.

Pending invite cards must have working Accept and Decline interactions.

Accept should move the person into the People section.
Decline should remove the invite.


PERSON DETAIL NAVIGATION

Add a simple back navigation option on person detail pages so users can return to the People list without relying on the sidebar.

This may be a back arrow or simple navigation control at the top of the page.


PLANS INDEX IMPROVEMENTS

Replace the participant name text with participant avatars.

Each plan card should show:
- small participant avatars
- hover tooltip showing each participant’s name
- the organizer or leader of the plan

The purpose is to visually represent the group involved in the plan.


OCCASIONS LAYOUT CORRECTIONS

Normalize the spacing and padding of the Occasion Types grid so cards are evenly spaced and visually aligned.

Do not redesign the card style.

Occasion Types should clearly function as creation templates.

The All Occasions section should list actual occasions the user is connected to.


OCCASION CARD BEHAVIOR

Occasion cards should link to their corresponding occasion detail page.

Example:
Sarah's Birthday card → Sarah's Birthday page


CARD WIDTH NORMALIZATION

Recurring occasions should not use excessively wide cards.

Ensure cards are appropriately sized so that large numbers of occasions do not create an overly tall page.

Maintain consistent spacing between cards.


PROTOTYPE CONSISTENCY

Ensure that all list items, cards, and links reference the correct objects.

Avoid using placeholder objects that cause multiple cards to open the same page.

Each person, occasion, and plan should behave as its own instance in the prototype.