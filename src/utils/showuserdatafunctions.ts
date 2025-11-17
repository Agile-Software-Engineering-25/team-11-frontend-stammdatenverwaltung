import {
  persondataclass as page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableRoles,
} from './userdataclass';

// Typen
export type User = Record<string, unknown>;
export type CardField = { label: string; key: string };
export type CardConfig = { key: string; title: string; fields: CardField[] };

// interner Cache
let cachedUsers: User[] = [];

// API-Handler-Definitionen (werden von useUsers registriert)
type ShowApiHandlers = {
  fetch?: () => Promise<User[]>;
  update?: (id: string, payload: Record<string, any>) => Promise<boolean>;
  remove?: (id: string) => Promise<boolean>;
};
let showApiHandlers: ShowApiHandlers = {};

// Registrierung
export function registerShowUserApi(handlers: ShowApiHandlers) {
  showApiHandlers = handlers ?? {};
}

// refreshUsers: ruft registrierten fetch-Handler auf (falls vorhanden) und updatet Cache
export async function refreshUsers(): Promise<void> {
  if (!showApiHandlers.fetch) {
    // no-op falls kein Handler registriert
    return;
  }
  try {
    const res = await showApiHandlers.fetch();
    if (Array.isArray(res)) {
      cachedUsers = res;
    }
  } catch (err) {
    console.error('refreshUsers: Handler error', err);
  }
}

// synchronous getters (keine Hooks)
export function getAllUsers(): User[] {
  return cachedUsers;
}
export function getAllRoles(): string[] {
  return availableRoles;
}

// updateUserData delegiert an Handler, aktualisiert cache lokal bei Erfolg
export async function updateUserData(
  id: string,
  updatedFields: Record<string, string>
): Promise<boolean> {
  if (showApiHandlers.update) {
    try {
      const ok = await showApiHandlers.update(id, updatedFields);
      if (ok) {
        const idx = cachedUsers.findIndex((u) => String((u as any).id) === String(id));
        if (idx !== -1) {
          cachedUsers[idx] = { ...(cachedUsers[idx] || {}), ...updatedFields };
        }
      }
      return ok;
    } catch (err) {
      console.error('updateUserData: handler error', err);
      return false;
    }
  }
  // fallback: nur lokal updaten
  const idx = cachedUsers.findIndex((u) => String((u as any).id) === String(id));
  if (idx !== -1) {
    cachedUsers[idx] = { ...(cachedUsers[idx] || {}), ...updatedFields };
    return true;
  }
  return false;
}

// deleteUserById delegiert an Handler
export async function deleteUserById(id: string): Promise<boolean> {
  if (showApiHandlers.remove) {
    try {
      const ok = await showApiHandlers.remove(id);
      if (ok) {
        cachedUsers = cachedUsers.filter((u) => String((u as any).id) !== String(id));
      }
      return ok;
    } catch (err) {
      console.error('deleteUserById: handler error', err);
      return false;
    }
  }
  // lokal entfernen
  const before = cachedUsers.length;
  cachedUsers = cachedUsers.filter((u) => String((u as any).id) !== String(id));
  return cachedUsers.length < before;
}

// restliche Helfer / Karten-Logik (wie vorher)
export function inferRolesFromUser(user: Record<string, any>): string[] {
  const isLecturer =
    Boolean(user.fieldChair) ||
    Boolean(user.title) ||
    user.employeeNumber ||
    user.department ||
    user.officeNumber ||
    user.workingTimeModel ||
    Boolean(user.employmentStatus);

  if (isLecturer) {
    return ['Lecturer'];
  }

  const roles = new Set<string>();

  if (
    user.employeeNumber ||
    user.department ||
    user.officeNumber ||
    user.workingTimeModel
  ) {
    roles.add('Employees');
  }

  if (
    user.matriculationNumber ||
    user.degreeProgram ||
    user.semester !== undefined ||
    user.studyStatus ||
    user.cohort
  ) {
    roles.add('Student');
  }

  if (roles.size === 0) roles.add('Person');

  return Array.from(roles);
}

export function getDynamicUserFields(): CardField[] {
  return (page1DynamicFieldsConfig ?? []).map((f: any) => ({
    key: f.name,
    label: f.label,
  }));
}

export function getCardsForRoles(roles: string[]): CardConfig[] {
  const dynamicFields = getDynamicUserFields();
  const cards: CardConfig[] = [
    {
      key: 'basis',
      title: 'Basis',
      fields: [
        { label: 'Vorname', key: 'firstName' },
        { label: 'Nachname', key: 'lastName' },
        { label: 'E-Mail', key: 'email' },
        ...dynamicFields,
      ],
    },
  ];
  roles.forEach((role) => {
    const config = (
      roleFieldConfigs as Record<string, { name: string; label: string }[]>
    )[role];
    if (config) {
      cards.push({
        key: role.toLowerCase(),
        title: role,
        fields: config.map((f) => ({ label: f.label, key: f.name })),
      });
    }
  });
  return cards;
}

// kompatibler Alias: getCardsForUser (falls andere Module diesen Namen erwarten)
export function getCardsForUser(user: User): CardConfig[] {
  const roles = inferRolesFromUser(user as any);
  return getCardsForRoles(roles);
}

// Datum-Formatter
export function formatDateForDisplay(raw?: string | null): string {
  if (!raw) return '';
  const s = String(raw).trim();
  const dmy = s.match(/^(\d{2})[.\-\/](\d{2})[.\-\/](\d{4})$/);
  if (dmy) return `${dmy[1]}.${dmy[2]}.${dmy[3]}`;
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }
  return s;
}
