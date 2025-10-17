/*
// Alle verfügbaren Rollen
export const availableRoles = ['Person', 'Student', 'Lecturer', 'Employees'];
export const availableGroups = [
  'Mitarbeiter',
  'Student',
  'Dozent',
  'Reinigungskraft',
];
export const studyStatus = [
  'ENROLLED',
  'GRADUATED',
  'REGISTERED',
  'ON_LEAVE',
  'EXMATRIULATED',
];
export const employmentStatus = [
  'FULL_TIME_PERMANENT',
  'PART_TIME_PERMANENT',
  'EXTERNAL',
  'VISITING',
  'CONTRACT',
  'EMERITUS',
  'ASSISTANT',
  'ASSOCIATE',
  'PROFESSOR',
];
export const workingTimeModels = [
  'FULL_TIME',
  'PART_TIME',
  'MINI_JOB',
  'CONTRACT',
  'TEMPORARY',
  'INTERNSHIP',
];



// Die festen Felder (immer vorhanden)
export const fixedFieldNames = [
  'firstname',
  'lastname',
  'email',
  'roles', // Mehrfachauswahl!
];


// Dynamische Felder für Seite 1 (außer Vorname, Nachname, Email, Rolle)
export const persondataclass = [
  {
    name: 'phone_number',
    label: 'Telefon',
    labeleng: 'Phone',
    type: 'text',
    required: false,
  },
  {
    name: 'date_of_birth',
    label: 'Geburtsdatum',
    labeleng: 'Date of Birth',
    type: 'text',
    required: true,
  },
  {
    name: 'city',
    label: 'Stadt',
    labeleng: 'City',
    type: 'text',
    required: false,
  },
  {
    name: 'street',
    label: 'Straße',
    labeleng: 'Street',
    type: 'text',
    required: false,
  },
  {
    name: 'housenumber',
    label: 'Hausnummer',
    labeleng: 'House Number',
    type: 'text',
    required: false,
  },
  {
    name: 'zipcode',
    label: 'PLZ',
    labeleng: 'ZIP Code',
    type: 'text',
    required: false,
  },
  {
    name: 'country',
    label: 'Land',
    labeleng: 'Country',
    type: 'text',
    required: false,
  },
];

// Konfiguration für rollenbasierte Felder
export const roleFieldConfigs = {
  Student: [
    {
      name: 'matriculation_number',
      label: 'Matrikelnummer',
      labeleng: 'Matriculation Number',
      type: 'text',
      required: true,
    },
    {
      name: 'degree_program',
      label: 'Studiengang',
      labeleng: 'Degree Program',
      type: 'text',
      required: false,
    },
    {
      name: 'semester',
      label: 'Semester',
      labeleng: 'Semester',
      type: 'number',
      required: false,
    },
    {
      name: 'cohort',
      label: 'Jahrgang',
      labeleng: 'Cohort',
      type: 'text',
      required: false,
    },
    {
      name: 'study_status',
      label: 'Studienstatus',
      labeleng: 'Study Status',
      type: 'select',
      required: true,
      options: Option(studyStatus),
    }
  ],
  Employees: [
    
    
  ],
  Lecturer: [
    
  ],
};


// Beispiel-Mockupdaten für User

*/