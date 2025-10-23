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
  Object.keys(updatedFields).forEach((key) => {
    if (fixedFieldNames.includes(key)) {
      (user as Record<string, unknown>)[key] = updatedFields[key];
    } else if (page1DynamicFieldsConfig.some((f) => f.name === key)) {
      (user as Record<string, unknown>)[key] = updatedFields[key];
    } else {
      if (!user.details) user.details = {};
      (user.details as Record<string, string>)[key] = updatedFields[key];
    }
  });
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
};
