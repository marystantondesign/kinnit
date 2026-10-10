import { Link } from "react-router";
import {
  Heart,
  Wallet,
  ScrollText,
  Leaf,
  Droplets,
  Flame,
  Music,
  Users,
  Gift,
  Globe,
  Mail,
  Mic,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

// Person type mirrors the People directory object model
interface Person {
  id: string;
  name: string;
  initials: string;
  relationship: string;
}

// Mock responsible parties — linked Person objects, not free-text names
const responsibleParties: Person[] = [
  { id: "2", name: "Michael Chen", initials: "MC", relationship: "Partner" },
  { id: "3", name: "Emma Davis", initials: "ED", relationship: "Sister" },
];

interface LegacyItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  isResponsibleParties?: boolean;
}

interface LegacyGroup {
  id: string;
  title: string;
  subtitle: string;
  items: LegacyItem[];
}

const groups: LegacyGroup[] = [
  {
    id: "decisions",
    title: "Decisions & who decides",
    subtitle: "Healthcare, financial, and estate authority",
    items: [
      { id: "healthcare-wishes", label: "Healthcare wishes & decision-maker", icon: Heart, href: "/app/about-me/life-legacy/healthcare-wishes" },
      { id: "financial-affairs", label: "Financial affairs & decision-maker", icon: Wallet, href: "/app/about-me/life-legacy/financial-affairs" },
      { id: "will-estate", label: "Will & estate reference", icon: ScrollText, href: "/app/about-me/life-legacy/will-estate" },
    ],
  },
  {
    id: "body-service",
    title: "Body & service",
    subtitle: "Disposition, donation, and ceremony",
    items: [
      { id: "disposition", label: "Disposition preference", icon: Leaf },
      { id: "organ-donation", label: "Organ & body donation", icon: Droplets },
      { id: "service-ceremony", label: "Service & ceremony", icon: Flame },
      { id: "music-readings", label: "Music, readings & elements", icon: Music },
    ],
  },
  {
    id: "people-instructions",
    title: "People & instructions",
    subtitle: "Roles, belongings, and accounts",
    items: [
      { id: "responsible-parties", label: "Responsible parties", icon: Users, isResponsibleParties: true },
      { id: "belongings", label: "Belongings & instructions", icon: Gift },
      { id: "digital-accounts", label: "Digital accounts & online presence", icon: Globe },
    ],
  },
  {
    id: "messages-reflection",
    title: "Messages & reflection",
    subtitle: "Letters, recordings, and life review",
    items: [
      { id: "letters-messages", label: "Letters & messages to loved ones", icon: Mail },
      { id: "life-reflections", label: "Life reflections", icon: Mic },
    ],
  },
];

function NotStartedChip() {
  return (
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
      Not started
    </span>
  );
}

function CardStatus({ item }: { item: LegacyItem }) {
  if (item.isResponsibleParties && responsibleParties.length > 0) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex -space-x-1">
          {responsibleParties.map((person) => (
            <div
              key={person.id}
              title={person.name}
              className="w-5 h-5 rounded-full bg-gray-200 border border-white flex items-center justify-center text-gray-600 text-[10px] font-medium"
            >
              {person.initials}
            </div>
          ))}
        </div>
        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded whitespace-nowrap">
          {responsibleParties.length} assigned
        </span>
      </div>
    );
  }
  return <NotStartedChip />;
}

function ItemCard({ item }: { item: LegacyItem }) {
  const Icon = item.icon;
  const inner = (
    <>
      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center mb-3 flex-shrink-0">
        <Icon size={16} className="text-gray-500" />
      </div>
      <p className="text-sm leading-snug flex-1 mb-3">{item.label}</p>
      <div>
        <CardStatus item={item} />
      </div>
    </>
  );

  const cardClass =
    "border border-gray-200 rounded bg-white p-4 flex flex-col hover:bg-gray-50 transition-colors text-left";

  return item.href ? (
    <Link to={item.href} className={cardClass}>
      {inner}
    </Link>
  ) : (
    <button type="button" className={cardClass}>
      {inner}
    </button>
  );
}

export function LifeAndLegacy() {
  return (
    <div className="p-8">
      <div className="mb-2">
        <Link to="/app/about-me" className="text-sm text-gray-500 hover:text-gray-700">
          ← About Me
        </Link>
      </div>

      <h1 className="mb-8">Life & Legacy</h1>

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.id}>
            <h3 className="font-medium mb-0.5">{group.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{group.subtitle}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {group.items.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}

        {/* Additional notes — standalone full-width row, unchanged treatment */}
        <button
          type="button"
          className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded hover:bg-gray-50 text-left"
        >
          <span className="text-sm">Additional notes</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotStartedChip />
            <ChevronRight size={16} className="text-gray-400" />
          </div>
        </button>
      </div>
    </div>
  );
}
