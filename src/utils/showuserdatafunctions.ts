import {
  mockUsers as users,
  persondataclass as page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableRoles,
  fixedFieldNames,
} from './userdataclass';

// Typen für dynamische Felder und Karten
type User = (typeof users)[number];

type CardField = { label: string; key: string };
type CardConfig = { key: string; title: string; fields: CardField[] };

// Dynamische Felder für die Kartenansicht (außer feste Felder)
function getDynamicUserFields(): CardField[] {
  return page1DynamicFieldsConfig.map((f) => ({
    key: f.name,
    label: f.label,
  }));
}

function getAllUsers(): User[] {
  return users;
}

function getAllRoles(): string[] {
  return availableRoles;
}

/**
 * Rolle(n) aus Benutzerdaten ableiten.
 * - Liefert Array mit möglichen Rollen: 'Student', 'Employees', 'Lecturer' oder 'Person' (Fallback)
 * - Entscheidet anhand vorhandener Felder (Matriculation, employee_id/employee_number, lecturer-spezifisch ...)
 */
function inferRolesFromUser(user: Record<string, unknown>): string[] {
  // Priorität: Lecturer → wenn Lecturer-Felder vorhanden sind,
  // gilt der User ausschließlich als Lecturer.
  const isLecturer =
    Boolean(user.field_chair) ||
    Boolean(user.title) ||
    Boolean(user.employment_status);

  if (isLecturer) {
    return ['Lecturer'];
  }

  const roles = new Set<string>();

  // Employees
  if (
    user.employee_number ||
    user.employee_id ||
    user.department ||
    user.office_number ||
    user.working_time_model
  ) {
    roles.add('Employees');
  }

  // Students
  if (
    user.matriculation_number ||
    user.degree_program ||
    user.semester !== undefined ||
    user.study_status ||
    user.cohort
  ) {
    roles.add('Student');
  }

  // Falls nichts erkennbar: Person
  if (roles.size === 0) roles.add('Person');

  return Array.from(roles);
}

// Karten-Konfiguration für Rollen (bleibt unverändert)
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
    // Typisierung für roleFieldConfigs
    const config = (
      roleFieldConfigs as Record<string, { name: string; label: string }[]>
    )[role];
    if (config) {
      cards.push({
        key: role.toLowerCase(),
        title: role,
        fields: config.map((f) => ({
          label: f.label,
          key: f.name,
        })),
      });
    }
  });
  return cards;
}

// Neue Convenience-Funktion: Karten basierend auf einem User-Objekt zurückgeben
function getCardsForUser(user: User): CardConfig[] {
  const inferredRoles = inferRolesFromUser(user);
  return getCardsForRoles(inferredRoles);
}

// Userdaten aktualisieren
function updateUserData(
  id: string,
  updatedFields: Record<string, string>
): boolean {
  const user = users.find((u) => String(u.id) === String(id));
  if (!user) return false;

  // Debug: Eingangsdaten und aktueller Zustand
  console.debug('updateUserData: input updatedFields', updatedFields);
  console.debug(
    'updateUserData: before user snapshot',
    JSON.parse(JSON.stringify(user))
  );

  const roleFieldNames = Object.values(roleFieldConfigs)
    .flat()
    .map((f) => f.name);

  Object.keys(updatedFields).forEach((key) => {
    const value = updatedFields[key];

    // Fixed top-level fields
    if (fixedFieldNames.includes(key)) {
      (user as Record<string, unknown>)[key] = value;
      return;
    }

    // page1 dynamic fields -> top-level
    if (page1DynamicFieldsConfig.some((f) => f.name === key)) {
      (user as Record<string, unknown>)[key] = value;
      return;
    }

    // rollenspezifische Felder -> in details ablegen; Typkonvertierung für number Felder
    if (roleFieldNames.includes(key)) {
      if (!user.details) user.details = {};
      // Versuche Typ-Konvertierung: falls in roleFieldConfigs als number definiert -> Number
      let converted: unknown = value;
      const roleFieldDef = Object.values(roleFieldConfigs)
        .flat()
        .find((f) => f.name === key);
      if (roleFieldDef && roleFieldDef.type === 'number') {
        const n = Number(value);
        converted = Number.isNaN(n) ? value : n;
      }
      (user.details as Record<string, unknown>)[key] = converted;
      return;
    }

    // Fallback: setze top-level
    (user as Record<string, unknown>)[key] = value;
  });

  // Debug: After snapshot und welche Keys nun in details stehen
  console.debug(
    'updateUserData: after user snapshot',
    JSON.parse(JSON.stringify(user))
  );
  return true;
}

// User löschen
function deleteUserById(id: string): boolean {
  const idx = users.findIndex((u) => String(u.id) === String(id));
  if (idx !== -1) {
    users.splice(idx, 1);
    return true;
  }
  return false;
}

// Hilfsfunktion: Datum für die UI anzeigen im Format tt.mm.jjjj
function formatDateForDisplay(raw?: string | null): string {
  if (!raw) return '';
  const s = String(raw).trim();

  // already dd.mm.yyyy or dd-mm-yyyy or dd/mm/yyyy
  const dmy = s.match(/^(\d{2})[.\-\/](\d{2})[.\-\/](\d{4})$/);
  if (dmy) return `${dmy[1]}.${dmy[2]}.${dmy[3]}`;

  // ISO yyyy-mm-dd
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[3]}.${iso[2]}.${iso[1]}`;

  // fallback: versuche generisches Parsen und formatiere
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  // sonst Originalstring zurückgeben
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
  formatDateForDisplay, // <-- hinzugefügt
};
