/* eslint-disable max-lines-per-function */
import {
  users,
  page1DynamicFieldsConfig,
  roleFieldConfigs,
} from './mockupdata';

// Erstellt ein CSV-Template für eine bestimmte Rolle (ohne Rollen-Spalte, Dateiname: {Rolle}_SAU_IMPORT.csv)
export function generateCsvTemplateForRole(role: string): string {
 

  const baseFields = [
    { key: 'firstname', label: 'Vorname' },
    { key: 'lastname', label: 'Nachname' },
    { key: 'email', label: 'E-Mail' },
  ];
  // Dynamische Felder (Seite 1)
  const page1Fields = page1DynamicFieldsConfig.map((f) => ({
    key: f.name,
    label: f.label,
  }));
  const roleFields = (roleFieldConfigs[role] ?? []).map(f => ({
    key: f.name,
    label: f.label,
  }));

  const header = [
    ...baseFields.map(f => f.label),
    ...page1Fields.map(f => f.label),
    ...roleFields.map(f => f.label),
  ];

  const csv = header
    .map((val) =>
      typeof val === 'string' &&
      (val.includes(',') || val.includes('"') || val.includes('\n'))
        ? `"${val.replace(/"/g, '""')}"`
        : val
    )
    .join(',');

  return csv;
}

// Dynamischer Export der ausgewählten Nutzer als CSV (inkl. Basisdaten und rollenspezifischer Felder)
export function exportUsersToCSV(selectedUserIds: number[]): string {
  // Filtere die User
  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
  if (selectedUsers.length === 0) return '';

  // Basisfelder (wie in generateCsvTemplateForRole, aber inkl. Rollen)
  const baseFields = [
    { key: 'firstname', label: 'Vorname' },
    { key: 'lastname', label: 'Nachname' },
    { key: 'email', label: 'E-Mail' },
    { key: 'roles', label: 'Rollen' },
  ];
  // Dynamische Felder (Seite 1)
  const page1Fields = page1DynamicFieldsConfig.map(f => ({
    key: f.name,
    label: f.label,
  }));

  // Alle rollenspezifischen Felder, die bei mindestens einem User vorkommen
  const roleFieldSet = new Set<string>();
  selectedUsers.forEach(user => {
    user.roles.forEach(role => {
      const config = roleFieldConfigs[role];
      if (config) {
        config.forEach(f => roleFieldSet.add(f.name));
      }
    });
    // Auch Felder aus details aufnehmen, falls sie nicht in der Config stehen
    if (user.details) {
      Object.keys(user.details).forEach(key => roleFieldSet.add(key));
    }
  });
  // Rollenspezifische Felder als Array mit Label
  const roleFields = Array.from(roleFieldSet).map(fieldName => {
    // Label suchen
    for (const role in roleFieldConfigs) {
      const found = roleFieldConfigs[role].find(f => f.name === fieldName);
      if (found) return { key: fieldName, label: found.label };
    }
    // Fallback: Feldname als Label
    return { key: fieldName, label: fieldName };
  });

  // Kopfzeile (Labels)
  const header = [
    ...baseFields.map(f => f.label),
    ...page1Fields.map(f => f.label),
    ...roleFields.map(f => f.label),
  ];

  // Zeilen
  const rows = selectedUsers.map(user => {
    const base = [
      user.firstname ?? '',
      user.lastname ?? '',
      user.email ?? '',
      (user.roles ?? []).join(', '),
    ];
    const page1 = page1Fields.map(f =>
      user[f.key] !== undefined && user[f.key] !== null
        ? user[f.key]
        : ''
    );
    const roleSpecific = roleFields.map(f =>
      user[f.key] !== undefined && user[f.key] !== null
        ? user[f.key]
        : user.details && user.details[f.key]
        ? user.details[f.key]
        : ''
    );
    return [...base, ...page1, ...roleSpecific];
  });

  // CSV-String bauen
  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((val) =>
          typeof val === 'string' &&
          (val.includes(',') || val.includes('"') || val.includes('\n'))
            ? `"${val.replace(/"/g, '""')}"`
            : val
        )
        .join(',')
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
