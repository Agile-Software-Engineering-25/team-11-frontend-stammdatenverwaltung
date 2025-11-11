/* eslint-disable max-lines-per-function */
'use server';
import {
  persondataclass as page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableRoles,
} from './userdataclass';
import useAxiosInstance from '../hooks/useAxiosInstance';
// Typisierung für dynamische Felder
type DynamicField = {
  name: string;
  label: string;
  type: string;
  required: boolean;
};

// Typisierung für roleFieldConfigs
type RoleFieldConfigs = Record<string, DynamicField[]>;

// Gibt die dynamischen Felder für Seite 1 zurück
export function getPage1DynamicFields(): DynamicField[] {
  return page1DynamicFieldsConfig;
}

// Gibt die dynamischen Felder für eine Rolle zurück
export function dynamicInputFields(role: string): { fields: DynamicField[] } {
  const config = (roleFieldConfigs as RoleFieldConfigs)[role];
  if (config) {
    return { fields: config };
  }
  return { fields: [] };
}

// Gibt alle verfügbaren Rollen zurück
export function getAvailableRoles(): string[] {
  return availableRoles;
}

// Axios-Instance für Server-Aufrufe
//const axiosInstance = useAxiosInstance('https://sau-portal.de/team-11-api');

// eslint-disable-next-line func-style
export async function createUser(
  data: string[],
  roleFromSelection?: string
): Promise<Record<string, unknown> | null> {
  try {
    console.debug(
      'createUser: input data',
      data,
      'roleFromSelection',
      roleFromSelection
    );
    
    const selectedRole = roleFromSelection ?? '';

    const page1 = getPage1DynamicFields();
    const roleFields = dynamicInputFields(selectedRole).fields;

    // Reihenfolge der Preview-Labels MUSS mit dem Import/Manual-Form übereinstimmen
    const previewLabels = [
      'Vorname',
      'Nachname',
      'E-Mail',
      ...page1.map((f) => f.label),
      ...roleFields.map((f) => f.label),
    ];

    const normalizeLabel = (s: string) =>
      String(s ?? '')
        .replace(/^\uFEFF/, '')
        .replace(/^"(.*)"$/, (_, inner) => inner.replace(/""/g, '"'))
        .replace(/\s*\([^)]*\)\s*$/, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    const canonical = (raw: string) => {
      const n = normalizeLabel(raw);
      const noDiacritics = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const al = noDiacritics.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
      const map: Record<string, string> = {
        vorname: 'firstname',
        firstname: 'firstname',
        nachname: 'lastname',
        lastname: 'lastname',
        email: 'email',
        // groups/group entfernt
        rollen: 'roles',
        rolle: 'roles',
        role: 'roles',
        roles: 'roles',
      };
      if (al in map) return map[al];
      if (al.endsWith('en')) return al.slice(0, -2);
      if (al.endsWith('s')) return al.slice(0, -1);
      return al;
    };

    // Mappen der eingehenden Werte anhand previewLabels
    const mapped: Record<string, string> = {};
    for (let i = 0; i < Math.max(previewLabels.length, data.length); i++) {
      const label = previewLabels[i] ?? `col${i}`;
      const value = String(data[i] ?? '').trim();
      const key = canonical(label);
      if (value !== '') mapped[key] = value;
      else if (!(key in mapped)) mapped[key] = value;
    }
    console.debug('createUser: initial mapped values', mapped);

    // Baue userObj VON NULL AUF (keine Mock-Werte übernehmen)
    const userObj: Record<string, unknown> = {
      // id wird NICHT mehr vorab gesetzt
      roles: selectedRole || '',
      firstname: mapped['firstname'] ?? '',
      lastname: mapped['lastname'] ?? '',
      email: mapped['email'] ?? '',
    };

    // Seite1-Felder (telefon, geburt, adresse) TOP-LEVEL setzen
    page1.forEach((f) => {
      const key = canonical(f.label);
      (userObj as Record<string, unknown>)[f.name] = mapped[key] ?? '';
    });

    // Rollenspezifische Felder ebenfalls TOP-LEVEL setzen (falls vorhanden)
    roleFields.forEach((f) => {
      const key = canonical(f.label);
      const val = mapped[key] ?? '';
      // Falls number-Feld und als string übergeben wurde, konvertiere, sonst string belassen
      if (f.type === 'number' && val !== '') {
        const n = Number(val);
        (userObj as Record<string, unknown>)[f.name] = Number.isNaN(n)
          ? val
          : n;
      } else {
        (userObj as Record<string, unknown>)[f.name] = val;
      }
    });

    // Pflichtprüfung
    const missing: string[] = [];
    if (!String(userObj.firstname ?? '').trim()) missing.push('firstname');
    if (!String(userObj.lastname ?? '').trim()) missing.push('lastname');
    if (!String(userObj.email ?? '').trim()) missing.push('email');
    if (missing.length) {
      console.warn(
        'createUser: fehlende Pflichtfelder',
        missing,
        'mapped',
        mapped
      );
      return null;
    }

    // Baue API-Payload (keine "details"-Einbettung, keine "roles"-Eigenschaft)
    const payload: Record<string, unknown> = {
      // username wird hier mit der email belegt (Beispiel aus Vorgabe)
      username: userObj.email ?? '',
      firstName: userObj.firstname ?? '',
      lastName: userObj.lastname ?? '',
      email: userObj.email ?? '',
      // dynamische Felder (ggf. vorhandene snake_case keys auf camelCase mappen)
      dateOfBirth:
        (userObj as unknown).date_of_birth ??
        (userObj as unknown).dateOfBirth ??
        '',
      address: (userObj as unknown).address ?? '',
      phoneNumber: (userObj as unknown).phone_number ?? '',
      matriculationNumber: (userObj as unknown).matriculation_number ?? '',
      degreeProgram: (userObj as unknown).degree_program ?? '',
      semester: (userObj as unknown).semester ?? undefined,
      studyStatus: (userObj as unknown).study_status ?? '',
      cohort: (userObj as unknown).cohort ?? '',
      employmentStatus: (userObj as unknown).employment_status ?? '',
      workingTimeModel: (userObj as unknown).working_time_model ?? '',
      department: (userObj as unknown).department ?? '',
      officeNumber: (userObj as unknown).office_number ?? '',
      // weitere Felder aus userObj können bei Bedarf ergänzt werden, ohne "details" wrapper
    };

    // Entferne undefined Werte
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined || payload[k] === '') {
        // wir behalten leere Strings, aber entferne undefined
        if (payload[k] === undefined) delete payload[k];
      }
    });
    const axiosInstance = useAxiosInstance('https://sau-portal.de/team-11-api');
    // Bestimme Endpoint anhand Rolle aus dem Frontend
    const roleKey = String(selectedRole ?? '').toLowerCase();
    let endpoint = '/api/v1/users';
    if (roleKey === 'student' || roleKey === 'students') {
      endpoint = '/api/v1/users/students';
    } else if (
      roleKey === 'lecturer' ||
      roleKey === 'dozent' ||
      roleKey === 'lecturers'
    ) {
      endpoint = '/api/v1/users/lecturer';
    } else if (
      roleKey === 'employees' ||
      roleKey === 'employee' ||
      roleKey === 'mitarbeiter'
    ) {
      endpoint = '/api/v1/users/employees';
    }

    // POST an die API
    try {
      const res = await axiosInstance.post(endpoint, payload);
      if (res && res.status === 201) {
        console.info(
          'createUser: User erfolgreich erstellt, api response',
          res.data
        );
        return res.data || null;
      }
      console.warn(
        'createUser: unerwartete API-Antwort',
        res?.status,
        res?.data
      );
      return null;
    } catch (apiErr) {
      console.error('createUser: API-Fehler beim Erstellen des Users', apiErr);
      return null;
    }
  } catch (err) {
    console.error(
      'createUser: Fehler beim Anlegen des Users',
      err,
      'input data',
      data
    );
    return null;
  }
}
