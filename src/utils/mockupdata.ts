// Dynamische Felder für Seite 1 (außer Vorname, Nachname, Email, Rolle)
export const page1DynamicFieldsConfig = [
  { name: 'phone', label: 'Telefon', type: 'text', required: true },
  { name: 'birthdate', label: 'Geburtsdatum', type: 'text', required: true },
  { name: 'placeofbirth', label: 'Geburtsort', type: 'text', required: true },
  { name: 'city', label: 'Stadt', type: 'text', required: true },
  { name: 'street', label: 'Straße', type: 'text', required: true },
  { name: 'housenumber', label: 'Hausnummer', type: 'text', required: true },
  { name: 'zipcode', label: 'PLZ', type: 'text', required: true },
  { name: 'country', label: 'Land', type: 'text', required: true },
  { name: 'nationality', label: 'Nationalität', type: 'text', required: true },
];

// Konfiguration für rollenbasierte Felder
export const roleFieldConfigs = {
  Student: [
    {
      name: 'matrikelnummer',
      label: 'Matrikelnummer',
      type: 'text',
      required: true,
    },
    { name: 'studiengang', label: 'Studiengang', type: 'text', required: true },
    {
      name: 'fachsemester',
      label: 'Fachsemester',
      type: 'text',
      required: true,
    },
  ],
  Mitarbeiter: [
    {
      name: 'personalnummer',
      label: 'Personalnummer',
      type: 'text',
      required: true,
    },
    { name: 'abteilung', label: 'Abteilung', type: 'text', required: true },
    {
      name: 'eintrittsdatum',
      label: 'Eintrittsdatum',
      type: 'text',
      required: false,
    },
  ],
  Dozent: [
    {
      name: 'dozentennummer',
      label: 'Dozentennummer',
      type: 'text',
      required: true,
    },
    { name: 'fakultaet', label: 'Fakultät', type: 'text', required: true },
    { name: 'titel', label: 'Titel', type: 'text', required: false },
  ],
};

// Alle verfügbaren Rollen
export const availableRoles = ['Student', 'Mitarbeiter', 'Dozent'];

// Die festen Felder (immer vorhanden)
export const fixedFieldNames = [
  'firstname',
  'lastname',
  'email',
  'roles', // Mehrfachauswahl!
];

// Beispiel-Mockupdaten für User
export const users = [
  {
    id: 1,
    firstname: 'Max',
    lastname: 'Mustermann',
    email: 'max.mustermann@example.com',
    roles: ['Student'],
    phone: '01234 567890',
    birthdate: '01.01.1990',
    placeofbirth: 'Musterstadt',
    city: 'Musterstadt',
    street: 'Musterstraße',
    housenumber: '1',
    zipcode: '12345',
    country: 'Deutschland',
    nationality: 'Deutsch',
    details: {
      matrikelnummer: '123456',
      studiengang: 'Informatik',
      fachsemester: '3',
      // Index-Signatur: alle Felder als string
    } as Record<string, string>,
  },
  {
    id: 2,
    firstname: 'Anna',
    lastname: 'Muster',
    email: 'anna.muster@example.com',
    roles: ['Mitarbeiter'],
    phone: '02345 678901',
    birthdate: '02.02.1992',
    placeofbirth: 'Beispielstadt',
    city: 'Beispielstadt',
    street: 'Beispielweg',
    housenumber: '2',
    zipcode: '23456',
    country: 'Deutschland',
    nationality: 'Deutsch',
    details: {
      personalnummer: '987654',
      abteilung: 'IT',
      eintrittsdatum: '01.01.2020',
    } as Record<string, string>,
  },
  {
    id: 3,
    firstname: 'Josef',
    lastname: 'Furt',
    email: 'josef.furt@example.com',
    roles: ['Student', 'Mitarbeiter'],
    phone: '03456 789012',
    birthdate: '03.03.1993',
    placeofbirth: 'Musterstadt',
    city: 'Musterstadt',
    street: 'Musterweg',
    housenumber: '3',
    zipcode: '45678',
    country: 'Deutschland',
    nationality: 'Deutsch',
    details: {
      matrikelnummer: '654321',
      studiengang: 'Mathematik',
      fachsemester: '2',
      personalnummer: '123987',
      abteilung: 'Mathe',
      eintrittsdatum: '01.10.2021',
    } as Record<string, string>,
  },
  {
    id: 4,
    firstname: 'Doris',
    lastname: 'Dozent',
    email: 'doris.dozent@example.com',
    roles: ['Dozent'],
    phone: '04567 890123',
    birthdate: '04.04.1985',
    placeofbirth: 'Dozentenstadt',
    city: 'Dozentenstadt',
    street: 'Dozentenweg',
    housenumber: '4',
    zipcode: '56789',
    country: 'Deutschland',
    nationality: 'Deutsch',
    details: {
      dozentennummer: 'D-2024',
      fakultaet: 'Wirtschaft',
      titel: 'Prof. Dr.',
    } as Record<string, string>,
  },
];
