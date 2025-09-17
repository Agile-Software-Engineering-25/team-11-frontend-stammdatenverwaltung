/* eslint-disable max-lines-per-function */
import { Box, ButtonGroup, Select, Option } from '@mui/joy';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import React, { useState } from 'react';
import Button from '@agile-software/shared-components/src/components/Button/Button';
import Input from '@agile-software/shared-components/src/components/Input/Input';
import {
  dynamicInputFields,
  getAvailableRoles,
  createUser,
  getPage1DynamicFields,
} from '@/utils/createuserfunction';

// Typen für dynamische Felder
interface DynamicField {
  name: string;
  label: string;
  type: string;
  required: boolean;
}

// Typ für das Formular
type FormState = {
  firstname: string;
  lastname: string;
  email: string;
  roles: string[];
  [key: string]: string | string[];
};

const initialState: FormState = {
  firstname: '',
  lastname: '',
  email: '',
  roles: [],
  // dynamische Felder werden nach Bedarf ergänzt
};

const requiredFieldsPage1 = ['firstname', 'lastname', 'email', 'roles'];

const CreateUser = ({
  onClose,
  onShowMessage,
}: {
  onClose?: () => void;
  onShowMessage?: (type: 'success' | 'error', text: string) => void;
}) => {
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

  const isPage1Valid =
    requiredFieldsPage1.every((field) => !!form[field]) &&
    page1DynamicFields.every(
      (field) => !field.required || !!form[field.name]
    ) &&
    Array.isArray(form.roles) &&
    form.roles.length > 0;

  const isPage2Valid = dynamicFields.every(
    (field) => !field.required || !!form[field.name]
  );

  const { t } = useTranslation();
  const navigate = useNavigate();

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
      return {
        ...cleanedForm,
        roles: rolesArr,
        ...Object.fromEntries(
          Array.from(keepFields).map((field) => [field, prev[field] ?? ''])
        ),
      };
    });
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
      if (onShowMessage)
        onShowMessage('success', t('pages.home.successcreate'));
      setForm(initialState);
      if (onClose) onClose();
      navigate('/');
    } else {
      if (onShowMessage) onShowMessage('error', t('pages.home.errorcreate'));
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
            sx={{ display: 'flex', gap: 2}}
          >
            <Input
              label={page1DynamicFields[i].label}
              required={page1DynamicFields[i].required}
              type={page1DynamicFields[i].type}
              value={
                typeof form[page1DynamicFields[i].name] === 'string'
                  ? (form[page1DynamicFields[i].name] as string)
                  : ''
              }
              onChange={handleInputChange(page1DynamicFields[i].name)}
              sx={{ flex: 1 }}
            />
            <Input
              label={page1DynamicFields[i + 1].label}
              required={page1DynamicFields[i + 1].required}
              type={page1DynamicFields[i + 1].type}
              value={
                typeof form[page1DynamicFields[i + 1].name] === 'string'
                  ? (form[page1DynamicFields[i + 1].name] as string)
                  : ''
              }
              onChange={handleInputChange(page1DynamicFields[i + 1].name)}
              sx={{ flex: 1 }}
            />
          </Box>
        );
      } else {
        rows.push(
          <Box
            key={page1DynamicFields[i].name}
            sx={{ display: 'flex', gap: 2, mb: 2 }}
          >
            <Input
              label={page1DynamicFields[i].label}
              required={page1DynamicFields[i].required}
              type={page1DynamicFields[i].type}
              value={
                typeof form[page1DynamicFields[i].name] === 'string'
                  ? (form[page1DynamicFields[i].name] as string)
                  : ''
              }
              onChange={handleInputChange(page1DynamicFields[i].name)}
              sx={{ flex: 1 }}
            />
          </Box>
        );
      }
    }
    return rows;
  };

  // Hilfsfunktion für 2er-Gruppierung der dynamischen Rollen-Felder (Seite 2)
  const renderRoleDynamicFieldsRows = () => {
    const rows: JSX.Element[] = [];
    for (let i = 0; i < dynamicFields.length; i += 2) {
      if (dynamicFields[i + 1]) {
        rows.push(
          <Box key={dynamicFields[i].name} sx={{ display: 'flex', gap: 2 }}>
            <Input
              label={dynamicFields[i].label}
              required={dynamicFields[i].required}
              type={dynamicFields[i].type}
              value={
                typeof form[dynamicFields[i].name] === 'string'
                  ? (form[dynamicFields[i].name] as string)
                  : ''
              }
              onChange={handleInputChange(dynamicFields[i].name)}
              sx={{ flex: 1 }}
            />
            <Input
              label={dynamicFields[i + 1].label}
              required={dynamicFields[i + 1].required}
              type={dynamicFields[i + 1].type}
              value={
                typeof form[dynamicFields[i + 1].name] === 'string'
                  ? (form[dynamicFields[i + 1].name] as string)
                  : ''
              }
              onChange={handleInputChange(dynamicFields[i + 1].name)}
              sx={{ flex: 1 }}
            />
          </Box>
        );
      } else {
        rows.push(
          <Box key={dynamicFields[i].name} sx={{ display: 'flex', gap: 2 }}>
            <Input
              label={dynamicFields[i].label}
              required={dynamicFields[i].required}
              type={dynamicFields[i].type}
              value={
                typeof form[dynamicFields[i].name] === 'string'
                  ? (form[dynamicFields[i].name] as string)
                  : ''
              }
              onChange={handleInputChange(dynamicFields[i].name)}
              sx={{ flex: 1 }}
            />
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
            <Input
              label={t('components.createusermanually.firstname')}
              required
              value={typeof form.firstname === 'string' ? form.firstname : ''}
              onChange={handleInputChange('firstname')}
            />
            <Input
              label={t('components.createusermanually.lastname')}
              required
              value={typeof form.lastname === 'string' ? form.lastname : ''}
              onChange={handleInputChange('lastname')}
            />
          </Box>
          <Box>
            <Input
              label={t('components.createusermanually.email')}
              required
              value={typeof form.email === 'string' ? form.email : ''}
              onChange={handleInputChange('email')}
              sx={{ width: '68%' }}
            />
          </Box>
          {/* Dynamische Felder für Seite 1 in 2er-Zeilen */}
          {renderDynamicFieldsRows()}
          <Box sx={{ mt: -2 }}>
            <label>{t('components.createusermanually.role')} </label>
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
        <ButtonGroup>
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