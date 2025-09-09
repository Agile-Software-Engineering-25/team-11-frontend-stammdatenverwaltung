'use server'
//Testdaten für die dynamischen Felder, wird später durch API-Aufruf ersetzt
const jsonConfig = {
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

const fixedFieldNames = [
  'firstname',
  'lastname',
  'email',
  'phone',
  'birthdate',
  'placeofbirth',
  'city',
  'street',
  'housenumber',
  'zipcode',
  'country',
  'nationality',
  'role',
  ];

export function dynamicInputFields(role: string){
  // Beispielhafte Logik zur Rückgabe unterschiedlicher Felder basierend auf der Rolle
  if (role === 'Student') {
    return jsonConfig;
  }
  return { fields: [] };
}

export function getAvailableRoles() {
  // Beispielhafte Logik zur Rückgabe unterschiedlicher Rollen
  return ['Student', 'Mitarbeiter', 'Dozent'];
}

export function createPerson(data: string[]){

  // Hole die Rolle aus den Daten (letztes festes Feld)
  const role = data[fixedFieldNames.indexOf('role')] ?? '';

  // Dynamische Felder für die Rolle bestimmen
  const dynamicFields = dynamicInputFields(role).fields;
  const dynamicFieldNames = dynamicFields.map((field) => field.name);

  // Alle Feldnamen in der richtigen Reihenfolge
  const allFieldNames = [...fixedFieldNames, ...dynamicFieldNames];

  // Objekt mit Namen und Wert aus dem Array erzeugen
  const result: Record<string, string> = {};
  allFieldNames.forEach((name, idx) => {
    result[name] = data[idx] ?? '';
  });

  // Ausgabe in der Konsole
  //console.log('createPerson:', result);
  

  return result;
}
