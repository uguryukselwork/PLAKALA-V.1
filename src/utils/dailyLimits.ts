export const DAILY_CONTACTS_KEY = 'plakala_daily_contacts_store';
export const MAX_DAILY_CONTACTS = 3;
export const MAX_ROOM_MESSAGES = 20;

export interface DailyContactsData {
  date: string; // YYYY-MM-DD
  contacts: string[]; // List of unique normalized plates or room counterpart ids
}

export const getTodayDateKey = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDailyContactsData = (): DailyContactsData => {
  try {
    const raw = localStorage.getItem(DAILY_CONTACTS_KEY);
    const today = getTodayDateKey();
    if (raw) {
      const parsed: DailyContactsData = JSON.parse(raw);
      if (parsed && parsed.date === today && Array.isArray(parsed.contacts)) {
        return parsed;
      }
    }
    const fresh: DailyContactsData = { date: today, contacts: [] };
    localStorage.setItem(DAILY_CONTACTS_KEY, JSON.stringify(fresh));
    return fresh;
  } catch {
    return { date: getTodayDateKey(), contacts: [] };
  }
};

export const recordDailyContact = (contactKey: string): { allowed: boolean; count: number; isNew: boolean } => {
  const normalized = contactKey.replace(/\s+/g, '').toUpperCase();
  const today = getTodayDateKey();
  const data = getDailyContactsData();

  if (data.contacts.includes(normalized)) {
    // Already contacted today, allowed
    return { allowed: true, count: data.contacts.length, isNew: false };
  }

  // Not contacted yet today
  if (data.contacts.length >= MAX_DAILY_CONTACTS) {
    // Exceeds limit! Cannot contact a 4th person today
    return { allowed: false, count: data.contacts.length, isNew: true };
  }

  const updatedContacts = [...data.contacts, normalized];
  try {
    localStorage.setItem(DAILY_CONTACTS_KEY, JSON.stringify({ date: today, contacts: updatedContacts }));
  } catch {}

  return { allowed: true, count: updatedContacts.length, isNew: true };
};

export const getDailyContactsCount = (): number => {
  return getDailyContactsData().contacts.length;
};

export const getRemainingDailyContacts = (): number => {
  return Math.max(0, MAX_DAILY_CONTACTS - getDailyContactsCount());
};
