import { useEffect, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router";
import { MoreHorizontal, Plus, Search, Users, X } from "lucide-react";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

interface Person {
  id: string;
  name: string;
  relationship: string;
  initials: string;
  colorClass: string;
}

interface Invite extends Omit<Person, "colorClass"> {
  colorClass: string;
}

interface Group {
  id: string;
  name: string;
  memberIds: string[];
}

type DirectoryFilter = "all" | "pending" | "sent";

const INITIAL_PEOPLE: Person[] = [
  { id: "1", name: "Sarah Johnson", relationship: "Friend", initials: "SJ", colorClass: "bg-amber-100 text-amber-700" },
  { id: "2", name: "Michael Chen", relationship: "Partner", initials: "MC", colorClass: "bg-blue-100 text-blue-700" },
  { id: "3", name: "Emma Davis", relationship: "Sister", initials: "ED", colorClass: "bg-violet-100 text-violet-700" },
  { id: "6", name: "James Wilson", relationship: "Brother", initials: "JW", colorClass: "bg-emerald-100 text-emerald-700" },
  { id: "5", name: "Lisa Anderson", relationship: "Friend", initials: "LA", colorClass: "bg-orange-100 text-orange-700" },
  { id: "7", name: "Jen Zambrano", relationship: "Friend", initials: "JZ", colorClass: "bg-pink-100 text-pink-700" },
  { id: "8", name: "Tom Becker", relationship: "Neighbor", initials: "TB", colorClass: "bg-slate-200 text-slate-600" },
  { id: "9", name: "Priya Patel", relationship: "Friend", initials: "PP", colorClass: "bg-purple-100 text-purple-700" },
  { id: "10", name: "Elena Garcia", relationship: "Friend", initials: "EG", colorClass: "bg-rose-100 text-rose-700" },
  { id: "11", name: "Marco Rossi", relationship: "Friend", initials: "MR", colorClass: "bg-red-100 text-red-700" },
  { id: "12", name: "Aiko Tanaka", relationship: "Friend", initials: "AT", colorClass: "bg-lime-100 text-lime-700" },
  { id: "4", name: "David Martinez", relationship: "Coworker", initials: "DM", colorClass: "bg-cyan-100 text-cyan-700" },
];

const INITIAL_PENDING_INVITES: Invite[] = [
  { id: "pending-1", name: "Nora Lewis", relationship: "Friend", initials: "NL", colorClass: "bg-indigo-100 text-indigo-700" },
];

const SENT_INVITES: Invite[] = [
  { id: "sent-1", name: "Owen Brooks", relationship: "Friend", initials: "OB", colorClass: "bg-teal-100 text-teal-700" },
  { id: "sent-2", name: "Maya Singh", relationship: "Coworker", initials: "MS", colorClass: "bg-fuchsia-100 text-fuchsia-700" },
];

const DEFAULT_GROUPS: Group[] = [
  { id: "family", name: "Family", memberIds: ["2", "3", "6"] },
  { id: "nyc-friends", name: "NYC friends", memberIds: ["1", "5", "7", "8"] },
  { id: "college-friends", name: "College friends", memberIds: ["1", "7", "9"] },
  { id: "international-friends", name: "International friends", memberIds: ["11", "12"] },
];

const GROUPS_STORAGE_KEY = "kinnit-people-groups";

function loadGroups(): Group[] {
  const stored = localStorage.getItem(GROUPS_STORAGE_KEY);
  if (!stored) return DEFAULT_GROUPS;

  try {
    return JSON.parse(stored) as Group[];
  } catch {
    return DEFAULT_GROUPS;
  }
}

function PersonAvatar({ person, size = "card" }: { person: Person | Invite; size?: "card" | "group" | "modal" }) {
  const sizeClass =
    size === "group"
      ? "size-[26px]"
      : size === "modal"
        ? "size-[30px]"
        : "size-[42px] md:size-11";

  return (
    <Avatar className={sizeClass}>
      <AvatarFallback className={person.colorClass}>
        <span className={size === "card" ? "text-xs font-medium" : "text-[9px] font-medium"}>
          {person.initials}
        </span>
      </AvatarFallback>
    </Avatar>
  );
}

function GroupAvatarStack({ group, people }: { group: Group; people: Person[] }) {
  const members = group.memberIds
    .map((id) => people.find((person) => person.id === id))
    .filter((person): person is Person => Boolean(person))
    .slice(0, 4);

  return (
    <div className="flex items-center">
      {members.map((person, index) => (
        <span key={person.id} className={index > 0 ? "-ml-1.5" : ""}>
          <PersonAvatar person={person} size="group" />
        </span>
      ))}
    </div>
  );
}

function GroupTile({
  group,
  people,
  selected,
  onClick,
}: {
  group: Group;
  people: Person[];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      aria-pressed={selected}
      className={`h-[118px] w-[150px] flex-none md:w-full md:min-w-0 flex-col items-start justify-between rounded-[var(--request-card-radius)] px-4 py-3 text-left whitespace-normal ${
        selected
          ? "border-[1.5px] border-foreground bg-muted/40 hover:bg-muted/50"
          : "border-border bg-card hover:bg-accent"
      }`}
    >
      <span>
        <span className="block text-sm font-medium text-foreground">{group.name}</span>
        <span className="block text-xs font-normal text-muted-foreground mt-0.5">
          {group.memberIds.length} {group.memberIds.length === 1 ? "person" : "people"}
        </span>
      </span>
      <GroupAvatarStack group={group} people={people} />
    </Button>
  );
}

function NewGroupTile({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-[118px] w-[150px] flex-none md:w-full md:min-w-0 flex-col gap-2 rounded-[var(--request-card-radius)] border-dashed border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
    >
      <Plus size={18} />
      <span className="text-sm font-normal">New group</span>
    </Button>
  );
}

function PersonGroupMenu({
  person,
  groups,
  openId,
  setOpenId,
  onToggleMembership,
  onNewGroup,
}: {
  person: Person;
  groups: Group[];
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onToggleMembership: (groupId: string, personId: string) => void;
  onNewGroup: (personId: string) => void;
}) {
  const isOpen = openId === person.id;

  return (
    <Popover open={isOpen} onOpenChange={(open) => setOpenId(open ? person.id : null)}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Manage groups for ${person.name}`}
          onClick={(event) => event.stopPropagation()}
          className={`absolute right-2 top-2 size-7 rounded-md text-muted-foreground ${isOpen ? "bg-muted" : "hover:bg-muted"}`}
        >
          <MoreHorizontal size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={4}
        collisionPadding={24}
        onClick={(event) => event.stopPropagation()}
        className="w-[210px] max-w-[calc(100vw-3rem)] rounded-[var(--request-card-radius)] border-border bg-card p-3 shadow-lg"
      >
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-2">
          Groups
        </p>
        <div className="space-y-1">
          {groups.map((group) => {
            const checked = group.memberIds.includes(person.id);
            return (
              <div key={group.id} className="flex items-center gap-2 rounded-md px-1 py-1.5 hover:bg-muted/50">
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggleMembership(group.id, person.id)}
                  aria-label={`${checked ? "Remove" : "Add"} ${person.name} ${checked ? "from" : "to"} ${group.name}`}
                />
                <span className="text-sm text-foreground">{group.name}</span>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border mt-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpenId(null);
              onNewGroup(person.id);
            }}
            className="w-full justify-start h-8 px-1 text-sm font-normal"
          >
            <Plus size={14} />
            New group
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PersonCard({
  person,
  groups,
  menuOpenId,
  setMenuOpenId,
  onToggleMembership,
  onNewGroup,
}: {
  person: Person;
  groups: Group[];
  menuOpenId: string | null;
  setMenuOpenId: (id: string | null) => void;
  onToggleMembership: (groupId: string, personId: string) => void;
  onNewGroup: (personId: string) => void;
}) {
  const navigate = useNavigate();
  const personGroups = groups.filter((group) => group.memberIds.includes(person.id));
  const firstGroup = personGroups[0];
  const extraGroupCount = personGroups.length - 1;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigate(`/app/people/${person.id}`);
    }
  };

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={`Open ${person.name}`}
      onClick={() => navigate(`/app/people/${person.id}`)}
      onKeyDown={handleKeyDown}
      className="relative h-[74px] rounded-[var(--request-card-radius)] border border-border bg-card px-4 py-2 flex items-center gap-3 cursor-pointer transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
    >
      <PersonAvatar person={person} />
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-[length:var(--people-card-name-size)] leading-tight font-medium text-foreground truncate">
          {person.name}
        </p>
        <p className="text-[length:var(--people-card-relationship-size)] leading-tight text-muted-foreground mt-0.5 truncate">
          {person.relationship}
        </p>
        {firstGroup && (
          <p className="text-[length:var(--people-card-group-size)] leading-tight text-muted-foreground mt-1 flex items-center gap-1 truncate">
            <Users size={10} className="flex-shrink-0" />
            <span className="truncate">
              {firstGroup.name}{extraGroupCount > 0 ? ` +${extraGroupCount}` : ""}
            </span>
          </p>
        )}
      </div>
      <PersonGroupMenu
        person={person}
        groups={groups}
        openId={menuOpenId}
        setOpenId={setMenuOpenId}
        onToggleMembership={onToggleMembership}
        onNewGroup={onNewGroup}
      />
    </div>
  );
}

function InviteCard({
  invite,
  pending,
  onAccept,
  onDecline,
}: {
  invite: Invite;
  pending: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}) {
  return (
    <div className="rounded-[var(--request-card-radius)] border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <PersonAvatar person={invite} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{invite.name}</p>
          <p className="text-xs text-muted-foreground truncate">{invite.relationship}</p>
        </div>
      </div>
      {pending ? (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button type="button" size="sm" onClick={onAccept}>Accept</Button>
          <Button type="button" variant="outline" size="sm" onClick={onDecline}>Decline</Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mt-3">Pending acceptance</p>
      )}
    </div>
  );
}

function NewGroupDialog({
  open,
  onOpenChange,
  people,
  defaultPersonId,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people: Person[];
  defaultPersonId: string | null;
  onCreate: (name: string, memberIds: string[]) => void;
}) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setName("");
    setSearch("");
    setSelectedPeople(defaultPersonId ? [defaultPersonId] : []);
  }, [open, defaultPersonId]);

  const filteredPeople = people.filter((person) =>
    person.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  const togglePerson = (personId: string) => {
    setSelectedPeople((current) =>
      current.includes(personId)
        ? current.filter((id) => id !== personId)
        : [...current, personId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 shadow-xl sm:max-w-[var(--people-group-modal-width)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <DialogTitle>New group</DialogTitle>
            <DialogDescription className="sr-only">
              Name a group and optionally choose people to add.
            </DialogDescription>
          </div>
          <DialogClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 rounded-full bg-muted text-muted-foreground hover:text-foreground"
              aria-label="Close new group dialog"
            >
              <X size={16} />
            </Button>
          </DialogClose>
        </div>

        <div className="px-6 py-5">
          <label htmlFor="group-name" className="block text-sm text-muted-foreground mb-2">
            Group name
          </label>
          <Input
            id="group-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
            required
          />

          <p className="text-sm text-muted-foreground mt-5 mb-2">Add people (optional)</p>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search people..."
              className="pl-9"
            />
          </div>

          <div className="max-h-64 overflow-y-auto -mx-1 px-1">
            {filteredPeople.map((person) => (
              <div key={person.id} className="flex items-center gap-3 py-2">
                <PersonAvatar person={person} size="modal" />
                <span className="flex-1 min-w-0 truncate text-sm text-foreground">{person.name}</span>
                <Checkbox
                  checked={selectedPeople.includes(person.id)}
                  onCheckedChange={() => togglePerson(person.id)}
                  aria-label={`${selectedPeople.includes(person.id) ? "Remove" : "Add"} ${person.name}`}
                  className="border-border bg-card"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-border px-6 py-4">
          <Button
            type="button"
            disabled={!name.trim()}
            onClick={() => onCreate(name.trim(), selectedPeople)}
          >
            Create group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PeopleList() {
  const navigate = useNavigate();
  const [connectedPeople, setConnectedPeople] = useState<Person[]>(INITIAL_PEOPLE);
  const [pendingInvites, setPendingInvites] = useState<Invite[]>(INITIAL_PENDING_INVITES);
  const [groups, setGroups] = useState<Group[]>(loadGroups);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<DirectoryFilter>("all");
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [defaultGroupPersonId, setDefaultGroupPersonId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  const handleAcceptInvite = (invite: Invite) => {
    setConnectedPeople((current) => [...current, invite]);
    setPendingInvites((current) => current.filter((item) => item.id !== invite.id));
  };

  const handleDeclineInvite = (inviteId: string) => {
    setPendingInvites((current) => current.filter((invite) => invite.id !== inviteId));
  };

  const openNewGroup = (personId: string | null = null) => {
    setDefaultGroupPersonId(personId);
    setGroupDialogOpen(true);
  };

  const handleCreateGroup = (name: string, memberIds: string[]) => {
    const idBase = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "group";
    const id = `${idBase}-${Date.now()}`;
    setGroups((current) => [...current, { id, name, memberIds }]);
    setGroupDialogOpen(false);
  };

  const handleToggleMembership = (groupId: string, personId: string) => {
    setGroups((current) =>
      current.map((group) => {
        if (group.id !== groupId) return group;
        const isMember = group.memberIds.includes(personId);
        return {
          ...group,
          memberIds: isMember
            ? group.memberIds.filter((id) => id !== personId)
            : [...group.memberIds, personId],
        };
      })
    );
  };

  const selectFilter = (filter: DirectoryFilter) => {
    setActiveFilter(filter);
    setActiveGroupId(null);
  };

  const selectGroup = (groupId: string) => {
    setActiveFilter("all");
    setActiveGroupId((current) => (current === groupId ? null : groupId));
  };

  const activeGroup = groups.find((group) => group.id === activeGroupId) ?? null;
  const query = searchQuery.trim().toLowerCase();
  const filteredPeople = connectedPeople.filter((person) => {
    const matchesSearch = person.name.toLowerCase().includes(query);
    const matchesGroup = !activeGroup || activeGroup.memberIds.includes(person.id);
    return matchesSearch && matchesGroup;
  });
  const filteredPending = pendingInvites.filter((invite) => invite.name.toLowerCase().includes(query));
  const filteredSent = SENT_INVITES.filter((invite) => invite.name.toLowerCase().includes(query));

  const listLabel = activeGroup
    ? `${activeGroup.name} · ${filteredPeople.length} ${filteredPeople.length === 1 ? "person" : "people"}`
    : "Everyone";

  return (
    <div className="px-6 py-6 md:px-8 mobile-scroll-pb overflow-x-hidden">
      <NewGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        people={connectedPeople}
        defaultPersonId={defaultGroupPersonId}
        onCreate={handleCreateGroup}
      />

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1>People</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your trusted network, {connectedPeople.length} people
          </p>
        </div>
        <Button type="button" onClick={() => navigate("/connection-setup")}>
          <Plus size={15} />
          Invite
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
        <div className="relative w-full md:w-[var(--people-search-width)] flex-shrink-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5 -mb-0.5">
          <Button
            type="button"
            variant={activeFilter === "all" && !activeGroup ? "default" : "outline"}
            size="sm"
            onClick={() => selectFilter("all")}
            className="rounded-full"
          >
            All
          </Button>
          <Button
            type="button"
            variant={activeFilter === "pending" ? "default" : "outline"}
            size="sm"
            aria-label={`Pending invites ${pendingInvites.length}`}
            onClick={() => selectFilter("pending")}
            className="rounded-full"
          >
            <span className="md:hidden">Pending {pendingInvites.length}</span>
            <span className="hidden md:inline">Pending invites {pendingInvites.length}</span>
          </Button>
          <Button
            type="button"
            variant={activeFilter === "sent" ? "default" : "outline"}
            size="sm"
            aria-label={`Sent invites ${SENT_INVITES.length}`}
            onClick={() => selectFilter("sent")}
            className="rounded-full"
          >
            <span className="md:hidden">Sent {SENT_INVITES.length}</span>
            <span className="hidden md:inline">Sent invites {SENT_INVITES.length}</span>
          </Button>
        </div>
      </div>

      <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">
        Groups
      </p>
      <div className="-mx-6 px-6 md:mx-0 md:px-0 overflow-x-auto scrollbar-none mb-7">
        <div className="flex md:grid md:grid-cols-5 gap-3 min-w-max md:min-w-0">
          {groups.map((group) => (
            <GroupTile
              key={group.id}
              group={group}
              people={connectedPeople}
              selected={activeGroupId === group.id}
              onClick={() => selectGroup(group.id)}
            />
          ))}
          <NewGroupTile onClick={() => openNewGroup()} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-3">
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          {activeFilter === "pending"
            ? `Pending invites · ${filteredPending.length}`
            : activeFilter === "sent"
              ? `Sent invites · ${filteredSent.length}`
              : listLabel}
        </p>
        {activeGroup && (
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setActiveGroupId(null)}
            className="h-auto p-0 text-xs text-muted-foreground"
          >
            Clear filter
          </Button>
        )}
      </div>

      {activeFilter === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {filteredPeople.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              groups={groups}
              menuOpenId={menuOpenId}
              setMenuOpenId={setMenuOpenId}
              onToggleMembership={handleToggleMembership}
              onNewGroup={openNewGroup}
            />
          ))}
        </div>
      )}

      {activeFilter === "pending" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredPending.map((invite) => (
            <InviteCard
              key={invite.id}
              invite={invite}
              pending
              onAccept={() => handleAcceptInvite(invite)}
              onDecline={() => handleDeclineInvite(invite.id)}
            />
          ))}
        </div>
      )}

      {activeFilter === "sent" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredSent.map((invite) => (
            <InviteCard key={invite.id} invite={invite} pending={false} />
          ))}
        </div>
      )}
    </div>
  );
}
