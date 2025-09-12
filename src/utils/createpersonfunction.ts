'use server'
import {
  page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableRoles,
  fixedFieldNames,
  users,
} from './mockupdata';

// Gibt die dynamischen Felder für Seite 1 zurück
export function getPage1DynamicFields() {
  return page1DynamicFieldsConfig;
}

// Gibt die dynamischen Felder für eine Rolle zurück
export function dynamicInputFields(role: string) {
  const config = roleFieldConfigs[role];
  if (config) {
    return { fields: config };
  }
  return { fields: [] };
}

// Gibt alle verfügbaren Rollen zurück
export function getAvailableRoles() {
  return availableRoles;
}

// Erstellt eine neue Person aus einem Datenarray und fügt sie zu den Mockupdaten hinzu
export function createPerson(data: string[]) {
  // Hole die Rollen aus den Daten (letztes festes Feld)
  const rolesString = data[fixedFieldNames.indexOf('roles')] ?? '';
  const roles = rolesString
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  // Dynamische Felder für alle Rollen bestimmen (ohne Duplikate)
  const dynamicFields = Array.from(
    new Map(
      roles.flatMap((role) =>
        (roleFieldConfigs[role] ?? []).map((field) => [field.name, field])
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
  const result: Record<string, any> = {};
  allFieldNames.forEach((name, idx) => {
    result[name] = data[idx] ?? '';
  });

  // details für rollenbasierte Felder
  const details: Record<string, string> = {};
  dynamicFieldNames.forEach((name) => {
    if (result[name]) {
      details[name] = result[name];
      delete result[name];
    }
  });

  // id generieren
  const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;

  // User-Objekt zusammenbauen
  const newUser = {
    id: newId,
    firstname: result.firstname,
    lastname: result.lastname,
    email: result.email,
    roles: roles,
    ...page1DynamicFieldsConfig.reduce((acc, f) => {
        acc[f.name] = result[f.name];
        return acc;
      },
      {} as Record<string, string>
    ),
    details,
  };

  users.push(newUser);

  console.log('createPerson: Neuer User hinzugefügt:', newUser);

  return newUser;
}
