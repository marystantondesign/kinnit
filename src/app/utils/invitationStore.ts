// Outgoing plan invitations.
//
// Kinnit has no backend for other users yet, so invitations are recorded here.
// Each record carries exactly what the recipient's notification needs
// ("Mary invited you to Chris's birthday" + Review invitation → the plan),
// matching the plan-invitation action item in notificationStore.

export interface SentInvitation {
  id: string;
  planId: string;
  planName: string;
  toPersonId: string;
  toName: string;
  inviterName: string;
  sentAt: string;
}

const STORAGE_KEY = "kinnit_sent_invitations";

export function getSentInvitations(): SentInvitation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SentInvitation[]) : [];
  } catch {
    return [];
  }
}

export function sendPlanInvitation(invite: Omit<SentInvitation, "id" | "sentAt">): SentInvitation {
  const record: SentInvitation = {
    ...invite,
    id: `inv-${Date.now()}-${invite.toPersonId}`,
    sentAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...getSentInvitations(), record]));
  } catch {}
  return record;
}
