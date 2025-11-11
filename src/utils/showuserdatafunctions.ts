import axios from 'axios';
import {
  persondataclass as page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableRoles,
  fixedFieldNames,
} from './userdataclass';
import useAxiosInstance from '../hooks/useAxiosInstance';

// Typen für dynamische Felder und Karten
type User = Record<string, unknown>;

type CardField = { label: string; key: string };
type CardConfig = { key: string; title: string; fields: CardField[] };

// --- interne User-Cache (ersetzt bisherigen mockUsers) ---
let cachedUsers: User[] = [];

// Axios-Instance für API-Aufrufe (Basis-URL wie gewünscht)
const axiosInstance = useAxiosInstance('https://sau-portal.de/team-11-api');

// Hintergrund-Fetch beim Modul-Import (nicht-blockierend)
async function fetchUsersFromApi(): Promise<void> {
  try {
    const res = await axiosInstance.get('/api/v1/users', {
      params: { flag: true },
    });
    if (res && res.data && Array.isArray(res.data)) {
      cachedUsers = res.data;
      console.debug(
        'fetchUsersFromApi: loaded users from API, count=',
        cachedUsers.length
      );
    } else {
      console.warn(
        'fetchUsersFromApi: unexpected API response shape, falling back to empty list'
      );
      cachedUsers = [];
    }
  } catch (err) {
    console.error('fetchUsersFromApi: error fetching users from API', err);
    cachedUsers = [];
  }
}
void fetchUsersFromApi();

// Utility: synchroner Zugriff auf aktuelle Users (wird von Komponenten genutzt)
function getAllUsers(): User[] {
  return cachedUsers;
}

function getAllRoles(): string[] {
  return availableRoles;
}

/**
 * Rolle(n) aus Benutzerdaten ableiten.
 */
function inferRolesFromUser(user: Record<string, unknown>): string[] {
  const isLecturer =
    Boolean(user.field_chair) ||
    Boolean(user.title) ||
    Boolean(user.employment_status);

  if (isLecturer) {
    return ['Lecturer'];
  }

  const roles = new Set<string>();

  if (
    user.employee_number ||
    user.employee_id ||
    user.department ||
    user.office_number ||
    user.working_time_model
  ) {
    roles.add('Employees');
  }

  if (
    user.matriculation_number ||
    user.degree_program ||
    user.semester !== undefined ||
    user.study_status ||
    user.cohort
  ) {
    roles.add('Student');
  }

  if (roles.size === 0) roles.add('Person');

  return Array.from(roles);
}

// Karten-Konfiguration für Rollen (bleibt unverändert)
function getDynamicUserFields(): CardField[] {
  return (page1DynamicFieldsConfig ?? []).map((f: any) => ({
    key: f.name,
    label: f.label,
  }));
}

function getCardsForRoles(roles: string[]): CardConfig[] {
  const dynamicFields = getDynamicUserFields();
  const cards: CardConfig[] = [
    {
      key: 'basis',
      title: 'Basis',
      fields: [
        { label: 'Vorname', key: 'firstname' },
        { label: 'Nachname', key: 'lastname' },
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

function getCardsForUser(user: User): CardConfig[] {
  const inferredRoles = inferRolesFromUser(user);
  return getCardsForRoles(inferredRoles);
}

// --- API-gestützte Update- und Delete-Operationen ---
// updateUserData: sendet PUT /api/v1/users/{userid} mit payload (Änderungen)
async function updateUserData(
  id: string,
  updatedFields: Record<string, string>
): Promise<boolean> {
  try {
    const res = await axiosInstance.put(
      `/api/v1/users/${encodeURIComponent(id)}`,
      updatedFields
    );
    if (res && (res.status === 200 || res.status === 204)) {
      // lokal cache updaten: merge changes in cachedUsers
      const idx = cachedUsers.findIndex(
        (u) => String((u as unknown).id) === String(id)
      );
      if (idx !== -1) {
        cachedUsers[idx] = { ...(cachedUsers[idx] || {}), ...updatedFields };
      } else if (res.data) {
        // falls API das aktualisierte Objekt zurückgibt, ersetzen
        if (typeof res.data === 'object') cachedUsers.push(res.data);
      }
      return true;
    }
    console.warn('updateUserData: unexpected response', res?.status);
    return false;
  } catch (err) {
    console.error('updateUserData: api error', err);
    return false;
  }
}

// deleteUserById: sendet POST /api/v1/users/delete mit Body {"user-id": "string"}
async function deleteUserById(id: string): Promise<boolean> {
  //const userid = String(id);
  try {
    const res = await axiosInstance.post(
      `/api/v1/users/delete/${encodeURIComponent(id)}`
    );
    if (res && (res.status === 200 || res.status === 204)) {
      // aus lokalem Cache entfernen
      cachedUsers = cachedUsers.filter(
        (u) => String((u as unknown).id) !== String(id)
      );
      return true;
    }
    console.warn('deleteUserById: unexpected response', res?.status);
    return false;
  } catch (err) {
    console.error('deleteUserById: api error', err);
    return false;
  }
}

// Falls Komponenten weiterhin synchronen Aufruf erwarten, zusätzliche helper:
// refreshUsers: neue Liste vom API laden (async)
async function refreshUsers(): Promise<void> {
  await fetchUsersFromApi();
}

// Hilfsfunktion: Datum für die UI anzeigen im Format tt.mm.jjjj
function formatDateForDisplay(raw?: string | null): string {
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

export type { User, CardConfig, CardField };
export {
  getAllUsers,
  getAllRoles,
  getCardsForRoles,
  getCardsForUser,
  inferRolesFromUser,
  updateUserData,
  getDynamicUserFields,
  deleteUserById,
  formatDateForDisplay,
  refreshUsers, // optional: kann von Komponenten genutzt werden, um neu zu laden
};
