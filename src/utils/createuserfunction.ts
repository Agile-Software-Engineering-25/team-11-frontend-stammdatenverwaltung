/* eslint-disable max-lines-per-function */
'use server'
import {
  page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableRoles,
  fixedFieldNames,
  users,
} from './mockupdata';

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

// Erstellt eine neue Person aus einem Datenarray und fügt sie zu den Mockupdaten hinzu
export function createUser(data: string[], roleFromSelection?: string) {
  const roles = roleFromSelection
    ? [roleFromSelection]
    : (data[fixedFieldNames.indexOf('roles')] ?? '')
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean);

  // Dynamische Felder für alle Rollen bestimmen (ohne Duplikate)
  const dynamicFields = Array.from(
    new Map(
      roles.flatMap((role) =>
        ((roleFieldConfigs as RoleFieldConfigs)[role] ?? []).map(
          (field: DynamicField) => [field.name, field]
        )
      )
    ).values()
  );
  const dynamicFieldNames = dynamicFields.map((field) => field.name);

  // Alle Feldnamen in der richtigen Reihenfolge
  const allFieldNames = [
    ...fixedFieldNames.filter((f) => f !== 'roles'), // 'roles' NICHT aus CSV!
    ...page1DynamicFieldsConfig.map((f) => f.name),
    ...dynamicFieldNames,
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
  const newId = users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1;

  // Dynamisches User-Objekt: alle Felder aus dem ersten Mockup-User übernehmen
  const templateUser = users[0];
  const userObj: typeof templateUser = {
    ...templateUser,
    id: newId,
    roles,
    details,
  };

  // Feste Felder dynamisch zuweisen
  fixedFieldNames.forEach((field) => {
    if (field !== 'roles' && field in userObj) {
      (userObj as Record<string, any>)[field] = result[field] ?? '';
    }
  });

  // Dynamische Felder Seite 1 zuweisen
  page1DynamicFieldsConfig.forEach((field) => {
    if (field.name in userObj) {
      (userObj as Record<string, any>)[field.name] = result[field.name] ?? '';
    }
  });

  // User in die Mockupdaten einfügen
  users.push(userObj);

  console.log('createUser: Neuer User hinzugefügt:', userObj);

  return userObj;
}
