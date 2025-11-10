/* eslint-disable max-lines-per-function */
'use server';
import {
  persondataclass as page1DynamicFieldsConfig,
  roleFieldConfigs,
  availableRoles,
  fixedFieldNames,
  mockUsers as users,
} from './userdataclass';

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
// eslint-disable-next-line func-style
export function createUser(data: string[], roleFromSelection?: string) {
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
    // "Gruppe" entfernt komplett
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
    const newId = `uid-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userObj: Record<string, unknown> = {
      id: newId,
      roles: selectedRole || '',
      // setze Standard-Felder leer
      firstname: '',
      lastname: '',
      email: '',
      details: {}, // falls später noch genutzt
    };

    // Feste Felder (firstname/lastname/email) aus mapped übernehmen
    userObj.firstname = mapped['firstname'] ?? '';
    userObj.lastname = mapped['lastname'] ?? '';
    userObj.email = mapped['email'] ?? '';

    // Seite1-Felder (telefon, geburt, adresse) TOP-LEVEL setzen (keine Mock-Defaults)
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
        (userObj as Record<string, unknown>)[f.name] = Number.isNaN(n) ? val : n;
      } else {
        (userObj as Record<string, unknown>)[f.name] = val;
      }
    });

    // Debug: Ausgabe vor Validierung
    console.debug('createUser: built userObj before validation', userObj);

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

    // Push in Mock-Daten
    users.push(userObj as unknown);
    console.info('createUser: Neuer User hinzugefügt:', userObj);
    return userObj;
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
