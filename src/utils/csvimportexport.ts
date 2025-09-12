import {
  users,
  page1DynamicFieldsConfig,
  roleFieldConfigs,
} from './mockupdata';

// Hilfsfunktion: Alle dynamischen Felder für die User-Liste bestimmen
function getAllDynamicFieldsForUsers(userList: typeof users) {
  // Alle Felder, die in page1DynamicFieldsConfig stehen
  const page1Fields = page1DynamicFieldsConfig.map((f) => f.name);

  // Alle rollenbasierten Felder, die bei mindestens einem User vorkommen
  const roleFields = new Set<string>();
  userList.forEach(user => {
    user.roles.forEach(role => {
      const config = roleFieldConfigs[role];
      if (config) {
        config.forEach((f) => roleFields.add(f.name));
      }
    });
    // Auch Felder aus details aufnehmen, falls sie nicht in der Config stehen
    if (user.details) {
      Object.keys(user.details).forEach((key) => roleFields.add(key));
    }
  });

  // page1Fields zuerst, dann alle weiteren rollenbasierten Felder (ohne Duplikate)
  const allFields = [
    ...page1Fields,
    ...Array.from(roleFields).filter((f) => !page1Fields.includes(f)),
  ];
  return allFields;
}

// Erstellt CSV-String aus Userdaten
export function exportUsersToCSV(selectedUserIds: number[]) {
  // Filtere die User
  const selectedUsers = users.filter((u) => selectedUserIds.includes(u.id));
  if (selectedUsers.length === 0) return '';

  // Feste Felder
  const baseFields = ['firstname', 'lastname', 'email', 'roles'];
  // Dynamische Felder
  const dynamicFields = getAllDynamicFieldsForUsers(selectedUsers);

  // Kopfzeile (Labels)
  const header = [
    ...baseFields.map((f) => {
      if (f === 'firstname') return 'Vorname';
      if (f === 'lastname') return 'Nachname';
      if (f === 'email') return 'E-Mail';
      if (f === 'roles') return 'Rollen';
      return f;
    }),
    ...dynamicFields.map(f => {
      // Label aus Config suchen
      const page1 = page1DynamicFieldsConfig.find(field => field.name === f);
      if (page1) return page1.label;
      for (const role in roleFieldConfigs) {
        const found = roleFieldConfigs[role].find(field => field.name === f);
        if (found) return found.label;
      }
      return f;
    }),
  ];

  // Zeilen
  const rows = selectedUsers.map(user => {
    const base = [
      user.firstname ?? '',
      user.lastname ?? '',
      user.email ?? '',
      (user.roles ?? []).join(', '),
    ];
    const dynamic = dynamicFields.map(f =>
      user[f] !== undefined && user[f] !== null
        ? user[f]
        : user.details && user.details[f]
          ? user.details[f]
        : ''
    );
    return [...base, ...dynamic];
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
