type User = {
  id: number;
  firstname: string;
  lastname: string;
  birthdate: string;
  address: string;
  phone: string;
  roles: string[];
  details?: Record<string, string>;
};

type CardField = { label: string; key: string };
type CardConfig = { key: string; title: string; fields: CardField[] };

const users: User[] = [
  {
    id: 1,
    firstname: 'Max',
    lastname: 'Mustermann',
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
  const cards: CardConfig[] = [
    {
      key: 'basis',
      title: 'Basis',
      fields: [
        { label: 'Vorname', key: 'firstname' },
        { label: 'Nachname', key: 'lastname' },
        { label: 'Geburtsdatum', key: 'birthdate' },
        { label: 'Adresse', key: 'address' },
        { label: 'Telefon', key: 'phone' },
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

export type { User, CardConfig, CardField };
export { getAllUsers, getAllRoles, getCardsForRoles };