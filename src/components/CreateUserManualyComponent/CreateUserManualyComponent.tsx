/* eslint-disable max-lines-per-function */
import {
  Box,
  ButtonGroup,
  Select,
  Option,
  Button,
  Input,
  Typography,
} from '@mui/joy';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import React, { useState, type JSX } from 'react';
import {
  dynamicInputFields,
  getAvailableRoles,
  createUser,
  getPage1DynamicFields,
} from '@/utils/createuserfunction';
import { availableGroups } from '@/utils/userdataclass';
import { useMessage } from '@/components/MessageProvider/MessageProvider'; // <--- Context importieren

// Typen für dynamische Felder
interface DynamicField {
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: { label: string; value: string }[];
}

// Typ für das Formular
type FormState = {
  firstname: string;
  lastname: string;
  email: string;
  roles: string[]; // bleibt Array (Single-Select stored as 1-element array)
  groups: string; // nun ein einzelner string (Pflichtfeld)
  [key: string]: string | string[] | undefined;
};

const initialState: FormState = {
  firstname: '',
  lastname: '',
  email: '',
  roles: [],
  groups: '',
  // dynamische Felder werden nach Bedarf ergänzt
};

const requiredFieldsPage1 = ['firstname', 'lastname', 'email']; // roles/groups prüfen wir separat

const CreateUser = ({ onClose }: { onClose?: () => void }) => {
  const [step, setStep] = useState<number>(1);

  const [form, setForm] = useState<FormState>({
    ...initialState,
  });

  const roles = getAvailableRoles();
  const page1DynamicFields: DynamicField[] = getPage1DynamicFields();

  // Alle dynamischen Felder für alle gewählten Rollen (ohne Duplikate)
  const dynamicFields: DynamicField[] = Array.from(
    new Map(
      (form.roles as string[]).flatMap((role: string) =>
        dynamicInputFields(role).fields.map((field: DynamicField) => [
          field.name,
          field,
        ])
      )
    ).values()
  ) as DynamicField[];

  // Page1 Validierung: roles (array) UND groups (string) sind Pflicht; plus page1 dynamic required
  const isPage1Valid =
    Array.isArray(form.roles) &&
    form.roles.length > 0 &&
    typeof form.groups === 'string' &&
    form.groups.trim().length > 0 &&
    requiredFieldsPage1.every((field) => !!form[field]) &&
    page1DynamicFields.every((field) => !field.required || !!form[field.name]);

  const isPage2Valid = dynamicFields.every(
    (field) => !field.required || !!form[field.name]
  );

  const { t } = useTranslation();
  // Helper: generischer Placeholder "choose + label"
  const choosePlaceholder = (label: string) =>
    `${t('components.createusermanually.choose')} ${label}`;
  const navigate = useNavigate();
  const { setMessage } = useMessage(); // <--- Context Hook verwenden

  // Funktioniert für alle Felder, auch dynamische
  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  // Einzel-Auswahl für Rollen (nur eine Rolle möglich)
  const handleRoleChange = (_: any, value: string | null) => {
    setForm((prev) => {
      const rolesArr = value ? [value] : [];
      // Leere dynamische Felder zurücksetzen, die nicht mehr gebraucht werden
      const keepFields = new Set(
        rolesArr.flatMap((role: string) =>
          dynamicInputFields(role).fields.map((f: DynamicField) => f.name)
        )
      );
      const cleanedForm: FormState = { ...prev };
      Object.keys(cleanedForm).forEach((key) => {
        if (
          !Object.prototype.hasOwnProperty.call(initialState, key) &&
          !keepFields.has(key) &&
          !page1DynamicFields.some((f) => f.name === key)
        ) {
          delete cleanedForm[key];
        }
      });
      // ensure kept fields exist
      Array.from(keepFields).forEach((f) => {
        if (!(f in cleanedForm)) cleanedForm[f] = '';
      });
      return {
        ...cleanedForm,
        roles: rolesArr,
      };
    });
  };

  // Gruppen-Select Handler (Pflichtfeld)
  const handleGroupChange = (_: any, value: string | null) => {
    setForm((prev) => ({ ...prev, groups: value ?? '' }));
  };

  const finish = () => {
    // Sammle alle Feldnamen in der gewünschten Reihenfolge
    const allFieldNames = [
      ...requiredFieldsPage1.filter((f) => f !== 'roles'), // <--- 'roles' entfernen!
      ...page1DynamicFields.map((f) => f.name),
      ...dynamicFields.map((field) => field.name),
    ];
    // Erzeuge das Array mit den Werten in der gleichen Reihenfolge
    const values = allFieldNames.map((field) => {
      const value = form[field];
      return Array.isArray(value) ? value.join(',') : (value ?? '');
    });

    // Übergabe an createUser: Rolle nur als zweiten Parameter!
    const result = createUser(values, form.roles[0]);
    if (result) {
      setMessage({
        type: 'success',
        text: t('components.createusermanually.successcreation'),
      });
      setForm(initialState);
      if (onClose) onClose();
      navigate('/');
    } else {
      setMessage({
        type: 'error',
        text: t('components.createusermanually.creationerror'),
      });
    }
  };
  const cancel = () => {
    setForm(initialState);
    navigate('/');
  };
  const back = () => {
    if (step === 2) {
      setStep(1);
    } else {
      setForm(initialState);
      navigate('/');
    }
  };

  // Hilfsfunktion für 2er-Gruppierung der dynamischen Felder (Seite 1)
  const renderDynamicFieldsRows = () => {
    const rows: JSX.Element[] = [];
    for (let i = 0; i < page1DynamicFields.length; i += 2) {
      if (page1DynamicFields[i + 1]) {
        rows.push(
          <Box
            key={page1DynamicFields[i].name}
            sx={{ display: 'flex', gap: 2, mb: 2 }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ mb: 0.5 }}>
                {page1DynamicFields[i].label}
                {page1DynamicFields[i].required && ' *'}
              </Typography>
              <Input
                required={page1DynamicFields[i].required}
                type={page1DynamicFields[i].type}
                value={
                  typeof form[page1DynamicFields[i].name] === 'string'
                    ? (form[page1DynamicFields[i].name] as string)
                    : ''
                }
                onChange={handleInputChange(page1DynamicFields[i].name)}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ mb: 0.5 }}>
                {page1DynamicFields[i + 1].label}
                {page1DynamicFields[i + 1].required && ' *'}
              </Typography>
              <Input
                required={page1DynamicFields[i + 1].required}
                type={page1DynamicFields[i + 1].type}
                value={
                  typeof form[page1DynamicFields[i + 1].name] === 'string'
                    ? (form[page1DynamicFields[i + 1].name] as string)
                    : ''
                }
                onChange={handleInputChange(page1DynamicFields[i + 1].name)}
              />
            </Box>
          </Box>
        );
      } else {
        rows.push(
          <Box
            key={page1DynamicFields[i].name}
            sx={{ display: 'flex', gap: 2, mb: 2 }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ mb: 0.5 }}>
                {page1DynamicFields[i].label}
                {page1DynamicFields[i].required && ' *'}
              </Typography>
              <Input
                required={page1DynamicFields[i].required}
                type={page1DynamicFields[i].type}
                value={
                  typeof form[page1DynamicFields[i].name] === 'string'
                    ? (form[page1DynamicFields[i].name] as string)
                    : ''
                }
                onChange={handleInputChange(page1DynamicFields[i].name)}
              />
            </Box>
          </Box>
        );
      }
    }
    return rows;
  };

  // Hilfsfunktion für 2er-Gruppierung der dynamischen Rollen-Felder (Seite 2)
  // - semester: number-Eingabe soll in normalem Input (type="text") gerendert werden
  // - select-Felder (z.B. study_status) werden als Select mit options gerendert
  const renderRoleDynamicFieldsRows = () => {
    const rows: JSX.Element[] = [];
    for (let i = 0; i < dynamicFields.length; i += 2) {
      const renderField = (field: DynamicField) => {
        if (field.type === 'select') {
          return (
            <Select
              value={(form[field.name] as string) ?? ''}
              onChange={(_: any, val: string | null) =>
                setForm((prev) => ({ ...prev, [field.name]: val ?? '' }))
              }
              required={field.required}
            >
              <Option value="" disabled>
                {choosePlaceholder(field.label)}
              </Option>
              {(field.options ?? []).map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          );
        }
        // semester or any 'number' field: use normal text input
        if (field.type === 'number') {
          return (
            <Input
              type="text"
              value={(form[field.name] as string) ?? ''}
              onChange={handleInputChange(field.name)}
              required={field.required}
              placeholder={field.name === 'semester' ? 'z. B. 3' : undefined}
            />
          );
        }
        // fallback: normal input
        return (
          <Input
            required={field.required}
            type={field.type}
            value={(form[field.name] as string) ?? ''}
            onChange={handleInputChange(field.name)}
          />
        );
      };

      if (dynamicFields[i + 1]) {
        rows.push(
          <Box
            key={dynamicFields[i].name}
            sx={{ display: 'flex', gap: 2, mb: 2 }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ mb: 0.5 }}>
                {dynamicFields[i].label}
                {dynamicFields[i].required && ' *'}
              </Typography>
              {renderField(dynamicFields[i])}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ mb: 0.5 }}>
                {dynamicFields[i + 1].label}
                {dynamicFields[i + 1].required && ' *'}
              </Typography>
              {renderField(dynamicFields[i + 1])}
            </Box>
          </Box>
        );
      } else {
        rows.push(
          <Box
            key={dynamicFields[i].name}
            sx={{ display: 'flex', gap: 2, mb: 2 }}
          >
            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ mb: 0.5 }}>
                {dynamicFields[i].label}
                {dynamicFields[i].required && ' *'}
              </Typography>
              {renderField(dynamicFields[i])}
            </Box>
            <Box sx={{ flex: 1 }} />
          </Box>
        );
      }
    }
    return rows;
  };

  return (
    <Box sx={{ padding: 2, maxWidth: 700, mx: 'auto' }}>
      {step === 1 && (
        <>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ mb: 0.5 }}>
                {t('components.createusermanually.firstname')} *
              </Typography>
              <Input
                required
                value={typeof form.firstname === 'string' ? form.firstname : ''}
                onChange={handleInputChange('firstname')}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ mb: 0.5 }}>
                {t('components.createusermanually.lastname')} *
              </Typography>
              <Input
                required
                value={typeof form.lastname === 'string' ? form.lastname : ''}
                onChange={handleInputChange('lastname')}
              />
            </Box>
          </Box>
          <Box>
            <Typography level="body-xs" sx={{ mb: 0.5 }}>
              {t('components.createusermanually.email')} *
            </Typography>
            <Input
              required
              value={typeof form.email === 'string' ? form.email : ''}
              onChange={handleInputChange('email')}
              sx={{ width: '100%' }}
            />
          </Box>
          {/* Dynamische Felder für Seite 1 in 2er-Zeilen */}
          {renderDynamicFieldsRows()}

          {/* Gruppen-Select (Pflicht) */}
          <Box sx={{ mt: 1, mb: 1 }}>
            <Typography level="body-xs" sx={{ mb: 0.5 }}>
              {t('components.createusermanually.group')} *
            </Typography>
            <Select
              placeholder={t('components.createusermanually.choose_group')}
              value={form.groups ?? ''}
              onChange={handleGroupChange}
              required
              sx={{ width: '68%' }}
            >
              {availableGroups.map((g) => (
                <Option key={g} value={g}>
                  {g}
                </Option>
              ))}
            </Select>
          </Box>

          <Box sx={{ mt: -1 }}>
            <Typography level="body-xs" sx={{ mb: 0.5 }}>
              {t('components.createusermanually.role')} *
            </Typography>
            <Select
              placeholder={t('components.createusermanually.choose_role')}
              value={form.roles[0] ?? ''}
              onChange={handleRoleChange}
              required
              sx={{ width: '68%' }}
            >
              {roles.map((role: string) => (
                <Option key={role} value={role}>
                  {role}
                </Option>
              ))}
            </Select>
          </Box>
        </>
      )}

      {step === 2 && (
        <Box>
          {dynamicFields.length === 0 ? (
            <Box sx={{ mb: 4 }}>
              {t('components.createusermanually.no_role_specific_fields')}
            </Box>
          ) : (
            renderRoleDynamicFieldsRows()
          )}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <ButtonGroup variant="solid">
          {step === 2 && (
            <Button
              onClick={back}
              sx={{ textTransform: 'none' }}
              color="danger"
            >
              {t('components.createusermanually.backbutton')}
            </Button>
          )}
          <Button
            onClick={cancel}
            sx={{ textTransform: 'none' }}
            color="danger"
          >
            {t('components.createusermanually.closebutton')}
          </Button>
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              sx={{ textTransform: 'none' }}
              color="success"
              disabled={!isPage1Valid}
            >
              {t('components.createusermanually.nextbutton')}
            </Button>
          ) : (
            <Button
              onClick={finish}
              sx={{ textTransform: 'none' }}
              color="success"
              disabled={!isPage2Valid}
            >
              {t('components.createusermanually.finishbutton')}
            </Button>
          )}
        </ButtonGroup>
      </Box>
    </Box>
  );
};

export default CreateUser;
