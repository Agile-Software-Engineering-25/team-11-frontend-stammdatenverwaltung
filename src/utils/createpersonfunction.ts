'use server'
// Testdaten für die dynamischen Felder, wird später durch API-Aufruf ersetzt
const jsonConfigStudent = {
  fields: [
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
    }
  ]
};

const jsonConfigMitarbeiter = {
  fields: [
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
    }
  ]
};

const jsonConfigDozent = {
  fields: [
    {
      name: 'dozentennummer',
      label: 'Dozentennummer',
      type: 'text',
      required: true,
    },
    { name: 'fakultaet', label: 'Fakultät', type: 'text', required: true },
    {
      name: 'titel',
      label: 'Titel',
      type: 'text',
      required: false,
    }
  ]
};

// Dynamische Felder für Seite 1 (außer Vorname, Nachname, Email, Rolle)
const page1DynamicFieldsConfig = [
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

const fixedFieldNames = [
  'firstname',
  'lastname',
  'email',
  'roles', // Mehrfachauswahl!
];

export function getPage1DynamicFields() {
  return page1DynamicFieldsConfig;
}

export function dynamicInputFields(role: string) {
  // Rückgabe unterschiedlicher Felder basierend auf der Rolle
  if (role === 'Student') {
    return jsonConfigStudent;
  }
  if (role === 'Mitarbeiter') {
    return jsonConfigMitarbeiter;
  }
  if (role === 'Dozent') {
    return jsonConfigDozent;
  }
  return { fields: [] };
}

export function getAvailableRoles() {
  // Rückgabe unterschiedlicher Rollen
  return ['Student', 'Mitarbeiter', 'Dozent'];
}

export function createPerson(data: string[]) {
  // Hole die Rollen aus den Daten (letztes festes Feld)
  const rolesString = data[fixedFieldNames.indexOf('roles')] ?? '';
  const roles = rolesString.split(',').map(r => r.trim()).filter(Boolean);

  // Dynamische Felder für alle Rollen bestimmen (ohne Duplikate)
  const dynamicFields = Array.from(
    new Map(
      roles.flatMap((role) =>
        dynamicInputFields(role).fields.map((field) => [field.name, field])
      )
    ).values()
  );
  const dynamicFieldNames = dynamicFields.map((field) => field.name);

  // Alle Feldnamen in der richtigen Reihenfolge
  const allFieldNames = [
    ...fixedFieldNames,
    ...page1DynamicFieldsConfig.map(f => f.name),
    ...dynamicFieldNames
  ];

  // Objekt mit Namen und Wert aus dem Array erzeugen
  const result: Record<string, string> = {};
  allFieldNames.forEach((name, idx) => {
    result[name] = data[idx] ?? '';
  });

  // Ausgabe in der Konsole
  console.log('createPerson:', result);

  return result;
}
