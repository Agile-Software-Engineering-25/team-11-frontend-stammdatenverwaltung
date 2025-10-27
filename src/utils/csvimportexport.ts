/* eslint-disable max-lines-per-function */
import {
  mockUsers as users,
  persondataclass as page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableGroups,
} from './userdataclass';
import { inferRolesFromUser } from './showuserdatafunctions';

// Typ für ein User-Objekt
type UserType = (typeof users)[number];

// Typ für ein Feld (erweitert um type/options)
interface FieldConfig {
  name: string;
  label: string;
  type?: string;
  options?: { label: string; value: string }[];
}

// Hilfs: label mit Optionen für Select-Felder (Optionen durch | getrennt in Klammer)
/*
function labelWithOptions(f?: {
  label: string;
  type?: string;
  options?: { label: string; value: string }[];
}) {
  if (!f) return '';
  if (f.type === 'select' && f.options && f.options.length > 0) {
    return `${f.label} (${f.options.map((o) => o.value).join('|')})`;
  }
  return f.label;
}
*/

// Normalisiert Header-Label: BOM/Quotes entfernen, angehängte "(...)" Teile entfernen, Leerzeichen zusammenfassen, trim
export function normalizeHeaderLabel(label: string): string {
  return String(label ?? '')
      // remove BOM
      .replace(/^\uFEFF/, '')
      // remove surrounding quotes and unescape doubled quotes if present
      .replace(/^"(.*)"$/, (_, inner) => inner.replace(/""/g, '"'))
      // remove trailing parenthesis block like "Label (a|b|c)"
      .replace(/\s*\([^)]*\)\s*$/, '')
      // collapse multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
}

// Case-insensitive compare helper (locale aware)
export function equalsIgnoreCase(a: string, b: string): boolean {
  return (
    String(a).localeCompare(String(b), undefined, { sensitivity: 'base' }) === 0
  );
}

// Konstruiere eine kanonisierte Form eines Labels:
// - BOM/Quotes/Optionen entfernt (normalizeHeaderLabel übernimmt das)
// - Diakritika entfernt
// - Nicht-alphanumerische Zeichen entfernt
// - einfache Synonym-Mappings für DE/EN angewendet
function canonicalLabel(raw: string): string {
  const normalized = normalizeHeaderLabel(raw);
  // remove diacritics
  const noDiacritics = normalized
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  // remove non-alphanumeric chars
  const alnum = noDiacritics.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();

  // simple synonyms between de/en and common variants
  const synonyms: Record<string, string> = {
    vorname: 'firstname',
    firstname: 'firstname',
    nachname: 'lastname',
    lastname: 'lastname',
    email: 'email',
    emailmail: 'email', // defensive
    emial: 'email',
    gruppe: 'group',
    gruppen: 'group',
    group: 'group',
    groups: 'group',
    rollen: 'role',
    rolle: 'role',
    role: 'role',
    roles: 'role',
    beruf: 'occupation',
    abteilung: 'department',
    department: 'department',
  };

  if (alnum in synonyms) return synonyms[alnum];
  // try naive singular (remove trailing s/en/n)
  if (alnum.endsWith('en')) return alnum.slice(0, -2);
  if (alnum.endsWith('s')) return alnum.slice(0, -1);
  return alnum;
}

// Entfernt die Rollen-Spalte (sprachunabhängig) aus dem Header-Array
export function removeRolesColumnFromHeader(header: string[]): string[] {
  const canon = header.map(canonicalLabel);
  const idx = canon.findIndex((c) => c === 'role');
  if (idx === -1) return header;
  return header.filter((_, i) => i !== idx);
}

/**
 * Prüft, ob der übergebene Header die erwarteten Felder für die Rolle enthält.
 * - Akzeptiert deutsche, englische oder gemischte Bezeichnungen.
 * - Entfernt automatisch eine 'Rollen'/'Role(s)'-Spalte.
 * - Erlaubt zusätzliche Spalten, verlangt aber, dass die erwarteten Spalten
 *   in der richtigen Reihenfolge auftauchen (zwischen ihnen dürfen aber andere Spalten stehen).
 */
export function isCsvHeaderCompatible(header: string[], role: string): boolean {
  const headerWithoutRoles = removeRolesColumnFromHeader(header);

  const expectedDe = getExpectedCsvHeaderForRole(role, 'de');
  const expectedEn = getExpectedCsvHeaderForRole(role, 'en');

  const canonHeader = headerWithoutRoles.map(canonicalLabel);
  const canonDe = expectedDe.map(canonicalLabel);
  const canonEn = expectedEn.map(canonicalLabel);

  // Reihenfolge: für jedes erwartete Feld suche eine passende Spalte nach der letzten gefundenen Position
  let lastFound = -1;
  for (let i = 0; i < canonDe.length; i++) {
    const targetDe = canonDe[i];
    const targetEn = canonEn[i];
    let found = -1;
    for (let j = lastFound + 1; j < canonHeader.length; j++) {
      const actual = canonHeader[j];
      if (actual === targetDe || actual === targetEn) {
        found = j;
        break;
      }
    }
    if (found === -1) {
      return false;
    }
    lastFound = found;
  }

  return true;
}

// Erstellt ein CSV-Template für eine bestimmte Rolle (ohne Rollen-Spalte, Dateiname: {Rolle}_SAU_IMPORT.csv)
// lang: 'de' | 'en' (default 'de')
export function generateCsvTemplateForRole(
  role: string,
  lang: 'de' | 'en' = 'de'
): string {
  // Basis-Felder (für Header)
  const baseFields = [
    { key: 'firstname', label: lang === 'de' ? 'Vorname' : 'First name' },
    { key: 'lastname', label: lang === 'de' ? 'Nachname' : 'Last name' },
    { key: 'email', label: lang === 'de' ? 'E-Mail' : 'E-mail' },
    {
      key: 'groups',
      label: lang === 'de' ? 'Gruppe' : 'Group',
      type: 'select',
      options: availableGroups.map((g) => ({ label: g, value: g })),
    },
  ];
  const page1Fields = page1DynamicFieldsConfig.map((f) => ({
    key: f.name,
    label: lang === 'de' ? f.label : ((f as unknown).labeleng ?? f.label),
    type: f.type,
    options: (f as unknown).options,
  }));
  const roleCfg = (roleFieldConfigs[role as keyof typeof roleFieldConfigs] ??
    []) as FieldConfig[];
  const roleFields = roleCfg.map((f) => ({
    key: f.name,
    label: lang === 'de' ? f.label : (f.labeleng ?? f.label),
    type: f.type,
    options: f.options,
  }));

  // HEADER: nur reine Labels (keine Optionen in Klammern)
  const headerLabels = [
    ...baseFields.map((f) => f.label),
    ...page1Fields.map((f) => f.label),
    ...roleFields.map((f) => f.label),
  ];

  // Erzeugung der obersten Instruktionszeilen (DE / EN)
  const introLinesDe = [
    'Diese Excel-Tabelle ist für die Anlegung von Usern entwickelt worden',
    'Bitte halten Sie sich an das Beispiel und geben keine anderen Werte ein. Erstellen Sie bitte auch keine neuen Spalten.',
    `Die Spalte "Gruppe" füllen Sie bitte ENTWEDER mit "${availableGroups.join('" / "')}" aus. Alle anderen Werte führen zu Fehlern.`,
    'Wenden Sie sich bei Fragen bitte an Team 10',
  ];
  const introLinesEn = [
    'This Excel template is designed to create users',
    'Please follow the example and do not add other values or new columns.',
    `Fill the "Group" column with one of: ${availableGroups.join(' | ')}.`,
    'If you have questions contact Team 10',
  ];

  const intro = lang === 'de' ? introLinesDe : introLinesEn;

  // Rollen-spezifische Optionszeilen (z.B. Department / Study Status)
  const roleOptionLines: string[] = [];
  roleFields.forEach((f) => {
    if (f.type === 'select' && f.options && f.options.length > 0) {
      roleOptionLines.push(
        `${f.label}: ${(f.options as unknown).map((o: unknown) => o.value).join(' | ')}`
      );
    }
  });
  /*
  if (role === 'Student') {
    roleOptionLines.push(
      `${lang === 'de' ? 'Studienstatus' : 'Study Status'}: ${studyStatus.join(' | ')}`
    );
    roleOptionLines.push(
      `${lang === 'de' ? 'Jahrgang' : 'Cohort'}: ${cohorts.join(' | ')}`
    );
  } else if (role === 'Employees' || role === 'Lecturer') {
    roleOptionLines.push(
      `${lang === 'de' ? 'Abteilung' : 'Department'}: ${departments.join(' | ')}`
    );
    roleOptionLines.push(
      `${lang === 'de' ? 'Arbeitszeitmodell' : 'Working Time Model'}: ${workingTimeModels.join(' | ')}`
    );
    roleOptionLines.push(
      `${lang === 'de' ? 'Beschäftigungsstatus' : 'Employment Status'}: ${employmentStatus.join(' | ')}`
    );
  }
  */

  // Trennlinie, Header-Zeile (nur Labels), dann leere Beispielzeile
  const separator =
    '################################################################';
  const finalLines = [
    ...intro,
    '',
    // options/erklärungen vor der Trennlinie
    ...roleOptionLines,
    '',
    separator,
    headerLabels.join(';'),
    // leere Beispielzeile
    headerLabels.map(() => '').join(';'),
  ];

  return finalLines.join('\r\n');
}

// Dynamischer Export der ausgewählten Nutzer als CSV (inkl. Basisdaten und rollenspezifischer Felder)
// Wichtig: Export-Kopfzeile enthält keine Optionen in Klammern (nur reine Labels)
export function exportUsersToCSV(selectedUserIds: string[]): string {
  // Filtere die User (IDs als strings)
  const selectedUsers = users.filter((u) =>
    selectedUserIds.includes(String(u.id))
  );
  if (selectedUsers.length === 0) return '';

  // Basisfelder (wie in generateCsvTemplateForRole, aber inkl. Rollen)
  const baseFields = [
    { key: 'firstname', label: 'Vorname' },
    { key: 'lastname', label: 'Nachname' },
    { key: 'email', label: 'E-Mail' },
    { key: 'roles', label: 'Rollen' },
    { key: 'groups', label: 'Gruppen' },
  ];
  // Dynamische Felder (Seite 1)
  const page1Fields = page1DynamicFieldsConfig.map((f) => ({
    key: f.name,
    label: f.label,
    type: f.type,
    options: (f as unknown).options,
  }));

  // Alle rollenspezifischen Felder, die bei mindestens einem User vorkommen
  const roleFieldSet = new Set<string>();
  selectedUsers.forEach((user) => {
    const userRoles: string[] = Array.isArray(user.roles)
      ? user.roles
      : user.roles
        ? [user.roles]
        : inferRolesFromUser(user);

    userRoles.forEach((role) => {
      const config = roleFieldConfigs[role as keyof typeof roleFieldConfigs];
      if (config) {
        config.forEach((f: FieldConfig) => roleFieldSet.add(f.name));
      }
    });

    // Auch Felder aus details aufnehmen, falls sie nicht in der Config stehen
    if (user.details) {
      Object.keys(user.details).forEach((key) => roleFieldSet.add(key));
    }
  });

  // Rollenspezifische Felder als Array mit Label + type/options wenn vorhanden
  const roleFields = Array.from(roleFieldSet).map((fieldName) => {
    // Label + type/options suchen
    for (const role in roleFieldConfigs) {
      const found = roleFieldConfigs[
        role as keyof typeof roleFieldConfigs
      ]?.find((f: FieldConfig) => f.name === fieldName);
      if (found)
        return {
          key: fieldName,
          label: found.label,
          type: found.type,
          options: found.options,
        };
    }
    // Fallback: Feldname als Label
    return { key: fieldName, label: fieldName };
  });

  // EXPORT-Header: hier keine Optionen anzeigen, nur reine Labels
  const header = [
    ...baseFields.map((f) => f.label),
    ...page1Fields.map((f) => f.label),
    ...roleFields.map((f) => f.label),
  ];

  // Zeilen
  const rows = selectedUsers.map((user) => {
    const rolesArr: string[] = Array.isArray(user.roles)
      ? user.roles
      : user.roles
        ? [user.roles]
        : inferRolesFromUser(user);

    const base = [
      user.firstname ?? '',
      user.lastname ?? '',
      user.email ?? '',
      rolesArr.join(', '),
      user.groups ?? '',
    ];

    const page1 = page1Fields.map((f) =>
      user[f.key as keyof UserType] !== undefined &&
      user[f.key as keyof UserType] !== null
        ? String(user[f.key as keyof UserType])
        : ''
    );

    const roleSpecific = roleFields.map((f) => {
      if (
        (user as unknown)[f.key] !== undefined &&
        (user as unknown)[f.key] !== null
      ) {
        return String((user as unknown)[f.key]);
      }
      return user.details && (user.details as Record<string, string>)[f.key]
        ? (user.details as Record<string, string>)[f.key]
        : '';
    });

    return [...base, ...page1, ...roleSpecific];
  });

  // CSV-String bauen (Semikolon als Delimiter)
  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((val) =>
          typeof val === 'string' &&
          (val.includes(';') || val.includes('"') || val.includes('\n'))
            ? `"${val.replace(/"/g, '""')}"`
            : val
        )
        .join(';')
    )
    .join('\r\n');

  return csv;
}

// Startet den Download im Browser
export function downloadCSV(csvString: string, filename = 'export.csv') {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// getExpectedCsvHeaderForRole: unterstützt optional Sprache (default 'de')
export function getExpectedCsvHeaderForRole(
  role: string,
  lang: 'de' | 'en' = 'de'
): string[] {
  const baseFields =
    lang === 'de'
      ? ['Vorname', 'Nachname', 'E-Mail', 'Gruppen']
      : ['First name', 'Last name', 'E-mail', 'Group'];

  const page1Fields = page1DynamicFieldsConfig.map((f) =>
    lang === 'de' ? f.label : ((f as unknown).labeleng ?? f.label)
  );

  const allowedRoles = Object.keys(roleFieldConfigs) as Array<
    keyof typeof roleFieldConfigs
  >;
  const roleKey = allowedRoles.includes(role as keyof typeof roleFieldConfigs)
    ? (role as keyof typeof roleFieldConfigs)
    : allowedRoles[0];
  const roleFields = (roleFieldConfigs[roleKey] ?? []).map((f) =>
    lang === 'de' ? f.label : ((f as unknown).labeleng ?? f.label)
  );

  return [...baseFields, ...page1Fields, ...roleFields];
}
