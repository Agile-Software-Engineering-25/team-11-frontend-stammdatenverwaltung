import {
  users,
  page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableRoles,
  fixedFieldNames,
} from './mockupdata';

type User = (typeof users)[number];

type CardField = { label: string; key: string };
type CardConfig = { key: string; title: string; fields: CardField[] };

// Dynamische Felder für die Kartenansicht (außer feste Felder)
function getDynamicUserFields(): { key: string; label: string }[] {
  return page1DynamicFieldsConfig.map((f) => ({ key: f.name, label: f.label }));
}

function getAllUsers(): User[] {
  return users;
}

function getAllRoles(): string[] {
  return availableRoles;
}

// Karten-Konfiguration für Rollen
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
    const config = roleFieldConfigs[role];
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

// Userdaten aktualisieren
function updateUserData(id: number, updatedFields: Record<string, string>) {
  const user = users.find((u) => u.id === id);
  if (!user) return false;
  Object.keys(updatedFields).forEach((key) => {
    if (fixedFieldNames.includes(key)) {
      user[key] = updatedFields[key];
    } else if (page1DynamicFieldsConfig.some((f) => f.name === key)) {
      user[key] = updatedFields[key];
    } else {
      if (!user.details) user.details = {};
      user.details[key] = updatedFields[key];
    }
  });
  return true;
}

// User löschen
function deleteUserById(id: number): boolean {
  const idx = users.findIndex((u) => u.id === id);
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
  updateUserData,
  getDynamicUserFields,
  deleteUserById,
};