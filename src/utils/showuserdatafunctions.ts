type User = {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  roles: string[];
  details?: Record<string, string>;
  [key: string]: any;
};

type CardField = { label: string; key: string };
type CardConfig = { key: string; title: string; fields: CardField[] };

function getDynamicUserFields(): { key: string; label: string }[] {
  return [
    { key: 'birthdate', label: 'Geburtsdatum' },
    { key: 'address', label: 'Adresse' },
    { key: 'phone', label: 'Telefon' },
  ];
}

const users: User[] = [
  {
    id: 1,
    firstname: 'Max',
    lastname: 'Mustermann',
    email: 'max.mustermann@example.com',
    birthdate: '01.01.1990',
    address: 'Musterstraße 1, 12345 Musterstadt',
    phone: '01234 567890',
    roles: ['student'],
    details: {
      matrikelnummer: '123456',
      studiengang: 'Informatik',
      fachsemester: '3',
    },
  },
  {
    id: 2,
    firstname: 'Anna',
    lastname: 'Muster',
    email: 'anna.muster@example.com',
    birthdate: '02.02.1992',
    address: 'Beispielweg 2, 23456 Beispielstadt',
    phone: '02345 678901',
    roles: ['mitarbeiter'],
    details: {
      personalnummer: '987654',
      abteilung: 'IT',
    },
  },
  {
    id: 3,
    firstname: 'Josef',
    lastname: 'Furt',
    email: 'josef.furt@example.com',
    birthdate: '03.03.1993',
    address: 'Musterweg 3, 45678 Musterstadt',
    phone: '03456 789012',
    roles: ['student', 'mitarbeiter'],
    details: {
      matrikelnummer: '654321',
      studiengang: 'Mathematik',
      fachsemester: '2',
      personalnummer: '123987',
      abteilung: 'Mathe',
    },
  },
];

const roleCardsConfig: Record<string, CardConfig[]> = {
  student: [
    {
      key: 'student',
      title: 'Student',
      fields: [
        { label: 'Matrikelnummer', key: 'matrikelnummer' },
        { label: 'Studiengang', key: 'studiengang' },
        { label: 'Fachsemester', key: 'fachsemester' },
      ],
    },
  ],
  mitarbeiter: [
    {
      key: 'mitarbeiter',
      title: 'Mitarbeiter',
      fields: [
        { label: 'Personalnummer', key: 'personalnummer' },
        { label: 'Abteilung', key: 'abteilung' },
      ],
    },
  ],
};

function getAllUsers(): User[] {
  return users;
}

function getAllRoles(): string[] {
  return Array.from(new Set(users.flatMap((user) => user.roles)));
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
    if (roleCardsConfig[role]) {
      cards.push(...roleCardsConfig[role]);
    }
  });
  return cards;
}

function updateUserData(id: number, updatedFields: Record<string, string>) {
  const user = users.find((u) => u.id === id);
  if (!user) return false;
  Object.keys(updatedFields).forEach((key) => {
    if (
      key === 'id' ||
      key === 'firstname' ||
      key === 'lastname' ||
      key === 'roles' ||
      key === 'email'
    ) {
      if (key in user) user[key] = updatedFields[key];
    } else if (getDynamicUserFields().some((f) => f.key === key)) {
      user[key] = updatedFields[key];
    } else {
      if (!user.details) user.details = {};
      user.details[key] = updatedFields[key];
    }
  });
  return true;
}

// NEU: User löschen
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