/* eslint-disable max-lines-per-function */
import {
  persondataclass as page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableRoles,
} from './userdataclass';

// Typisierung für dynamische Felder
type DynamicField = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
};

type CreateUserApiFn = (
  payload: Record<string, any>,
  role?: string
) => Promise<any> | Promise<null>;

// Handler-Registration (wird von useUsers gesetzt)
let createUserApi: CreateUserApiFn | null = null;
export function registerCreateUserApi(fn: CreateUserApiFn | null) {
  createUserApi = fn;
}

// Utility-Exported: dynamische Felder / rollen etc.
export function getPage1DynamicFields(): DynamicField[] {
  return page1DynamicFieldsConfig ?? [];
}
export function dynamicInputFields(role: string): { fields: DynamicField[] } {
  const cfg = (roleFieldConfigs as Record<string, DynamicField[]>)[role];
  return { fields: cfg ?? [] };
}
export function getAvailableRoles(): string[] {
  return availableRoles;
}

// Hilfsfunktionen für Label/Canonical (wie vorher)
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

// Exportierte createUser-Funktion — baut Payload und delegiert API-Aufruf an registrierten Handler
export async function createUser(
  data: string[],
  roleFromSelection?: string
): Promise<Record<string, any> | null> {
  // same mapping logic wie vorher, aber ohne axios-Hook
  const selectedRole = roleFromSelection ?? '';

  const page1 = getPage1DynamicFields();
  const roleFields = dynamicInputFields(selectedRole).fields;

  const previewLabels = [
    'Vorname',
    'Nachname',
    'E-Mail',
    ...page1.map((f) => f.label),
    ...roleFields.map((f) => f.label),
  ];

  const mapped: Record<string, string> = {};
  for (let i = 0; i < Math.max(previewLabels.length, data.length); i++) {
    const label = previewLabels[i] ?? `col${i}`;
    const value = String(data[i] ?? '').trim();
    const key = canonical(label);
    if (value !== '') mapped[key] = value;
    else if (!(key in mapped)) mapped[key] = value;
  }

  const userObj: Record<string, any> = {
    roles: selectedRole || '',
    firstname: mapped['firstname'] ?? '',
    lastname: mapped['lastname'] ?? '',
    email: mapped['email'] ?? '',
  };

  page1.forEach((f) => {
    const key = canonical(f.label);
    userObj[f.name] = mapped[key] ?? '';
  });

  roleFields.forEach((f) => {
    const key = canonical(f.label);
    const val = mapped[key] ?? '';
    if (f.type === 'number' && val !== '') {
      const n = Number(val);
      userObj[f.name] = Number.isNaN(n) ? val : n;
    } else {
      userObj[f.name] = val;
    }
  });

  // Pflichtprüfung
  const missing: string[] = [];
  if (!String(userObj.firstname ?? '').trim()) missing.push('firstname');
  if (!String(userObj.lastname ?? '').trim()) missing.push('lastname');
  if (!String(userObj.email ?? '').trim()) missing.push('email');
  if (missing.length) {
    console.warn('createUser: fehlende Pflichtfelder', missing, 'mapped', mapped);
    return null;
  }

  // Payload erzeugen (flattened)
  const formatDate = (d?: string | Date) => {
    if (d === undefined || d === null || d === '') return '';
    if (d instanceof Date) {
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    }
    const parsed = new Date(String(d));
    if (isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  };

  const anyUser = userObj as any;
  const drivesCarRaw =
    anyUser.drives_car ?? anyUser.drivesCar ?? anyUser['drives car'];
  const drivesCar =
    typeof drivesCarRaw === 'boolean'
      ? drivesCarRaw
      : typeof drivesCarRaw === 'string' && drivesCarRaw.trim() !== ''
        ? drivesCarRaw.trim().toLowerCase() === 'true'
        : undefined;
  const payload: Record<string, any> = {
    username: anyUser.email ?? '',
    firstName: anyUser.firstname ?? '',
    lastName: anyUser.lastname ?? '',
    email: anyUser.email ?? '',
    dateOfBirth: formatDate(
      anyUser.dateOfBirth ?? anyUser.date_of_birth ?? anyUser['dateofbirth']
    ),
    address: anyUser.address ?? anyUser.addr ?? '',
    phoneNumber: anyUser.phoneNumber ?? anyUser.phone_number ?? '',
    photoUrl: anyUser.photoUrl ?? anyUser.photo_url ?? '',
    matriculationNumber:
      anyUser.matriculationNumber ?? anyUser.matriculation_number ?? '',
    degreeProgram: anyUser.degreeProgram ?? anyUser.degree_program ?? '',
    semester:
      typeof anyUser.semester === 'number'
        ? anyUser.semester
        : (typeof anyUser.semester === 'string' && anyUser.semester.trim() !== ''
          ? ((): number | undefined => {
              const n = Number(anyUser.semester.replace(',', '.').trim());
              return Number.isNaN(n) ? undefined : n;
            })()
          : undefined),
    studyStatus: anyUser.studyStatus ?? anyUser.study_status ?? '',
    cohort: anyUser.cohort ?? '',
    employmentStatus:
      anyUser.employmentStatus ?? anyUser.employment_status ?? '',
    workingTimeModel:
      anyUser.workingTimeModel ?? anyUser.working_time_model ?? '',
    department: anyUser.department ?? '',
    officeNumber: anyUser.officeNumber ?? anyUser.office_number ?? '',
    title: anyUser.title ?? anyUser.titel ?? undefined,
    fieldChair: anyUser.fieldChair ?? anyUser.field_chair ?? undefined,
    employeeNumber:
      anyUser.employeeNumber ?? anyUser.employee_number ?? undefined,
    drives_car: drivesCar ?? true,
  };

  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  if (!createUserApi) {
    console.warn('createUser: kein API-Handler registriert, Abbruch');
    return null;
  }

  try {
    return await createUserApi(payload, selectedRole);
  } catch (err) {
    console.error('createUser: API-Handler schlug fehl', err);
    return null;
  }
}
