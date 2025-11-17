import {
  page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableRoles,
} from './mockupdata';

// Typen für dynamische Felder und Karten
export interface User {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  roles: string[];
  birthdate?: string;
  street?: string;
  housenumber?: string;
  zipcode?: string;
  city?: string;
  phone?: string;
  details?: Record<string, any>;
}

type CardField = { label: string; key: string };
type CardConfig = { key: string; title: string; fields: CardField[] };

// Dynamische Felder für die Kartenansicht (außer feste Felder)
function getDynamicUserFields(): CardField[] {
  return page1DynamicFieldsConfig.map((f) => ({
    key: f.name,
    label: f.label,
  }));
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

export type { CardConfig, CardField };
export { getAllRoles, getCardsForRoles, getDynamicUserFields };
