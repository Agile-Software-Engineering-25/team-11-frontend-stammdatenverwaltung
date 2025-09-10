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
  createPerson,
  getPage1DynamicFields,
} from '@/utils/createpersonfunction';

const initialState = {
  firstname: '',
  lastname: '',
  email: '',
  roles: [] as string[],
  // dynamische Felder werden nach Bedarf ergänzt
};

const requiredFieldsPage1 = ['firstname', 'lastname', 'email', 'roles'];

const CreateUser = () => {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    ...initialState,
  });

  const roles = getAvailableRoles();
  const page1DynamicFields = getPage1DynamicFields();

  // Alle dynamischen Felder für alle gewählten Rollen (ohne Duplikate)
  const dynamicFields = Array.from(
    new Map(
      (form.roles as string[]).flatMap((role) =>
        dynamicInputFields(role).fields.map((field) => [field.name, field])
      )
    ).values()
  );

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

  // Mehrfachauswahl für Rollen
  const handleRoleChange = (_: any, value: string[] | null) => {
    setForm((prev) => {
      const rolesArr = value ?? [];
      // Leere dynamische Felder zurücksetzen, die nicht mehr gebraucht werden
      const keepFields = new Set(
        rolesArr.flatMap((role) =>
          dynamicInputFields(role).fields.map((f) => f.name)
        )
      );
      const cleanedForm = { ...prev };
      Object.keys(cleanedForm).forEach((key) => {
        if (
          !initialState.hasOwnProperty(key) &&
          !keepFields.has(key) &&
          !page1DynamicFields.some(f => f.name === key)
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
      ...requiredFieldsPage1,
      ...page1DynamicFields.map(f => f.name),
      ...dynamicFields.map((field) => field.name),
    ];
    // Erzeuge das Array mit den Werten in der gleichen Reihenfolge
    const values = allFieldNames.map((field) =>
      field === 'roles'
        ? (form.roles as string[]).join(',')
        : form[field] ?? ''
    );

    // Übergabe an createPerson
    createPerson(values);

    setForm(initialState);
    navigate('/');
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
    const rows = [];
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
              value={form[page1DynamicFields[i].name] ?? ''}
              onChange={handleInputChange(page1DynamicFields[i].name)}
              sx={{ flex: 1 }}
            />
            <Input
              label={page1DynamicFields[i + 1].label}
              required={page1DynamicFields[i + 1].required}
              type={page1DynamicFields[i + 1].type}
              value={form[page1DynamicFields[i + 1].name] ?? ''}
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
              value={form[page1DynamicFields[i].name] ?? ''}
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
    const rows = [];
    for (let i = 0; i < dynamicFields.length; i += 2) {
      if (dynamicFields[i + 1]) {
        rows.push(
          <Box key={dynamicFields[i].name} sx={{ display: 'flex', gap: 2 }}>
            <Input
              label={dynamicFields[i].label}
              required={dynamicFields[i].required}
              type={dynamicFields[i].type}
              value={form[dynamicFields[i].name] ?? ''}
              onChange={handleInputChange(dynamicFields[i].name)}
              sx={{ flex: 1 }}
            />
            <Input
              label={dynamicFields[i + 1].label}
              required={dynamicFields[i + 1].required}
              type={dynamicFields[i + 1].type}
              value={form[dynamicFields[i + 1].name] ?? ''}
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
              value={form[dynamicFields[i].name] ?? ''}
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
          <Box sx={{ display: 'flex', gap: 2}}>
            <Input
              label={t('components.createpersonmanuell.firstname')}
              required
              value={form.firstname}
              onChange={handleInputChange('firstname')}
            />
            <Input
              label={t('components.createpersonmanuell.lastname')}
              required
              value={form.lastname}
              onChange={handleInputChange('lastname')}
            />
          </Box>
          <Box>
            <Input
              label={t('components.createpersonmanuell.email')}
              required
              value={form.email}
              onChange={handleInputChange('email')}
              sx={{ width: '68%' }}
            />
          </Box>
          {/* Dynamische Felder für Seite 1 in 2er-Zeilen */}
          {renderDynamicFieldsRows()}
          <Box sx={{ mt: -2 }}>
            <label>{t('components.createpersonmanuell.role')} </label>
            <Select
              multiple
              placeholder={t('components.createpersonmanuell.choose_role')}
              value={form.roles}
              onChange={handleRoleChange}
              required
              sx={{ width: '68%' }}
            >
              {roles.map((role) => (
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
              {t('components.createpersonmanuell.no_role_specific_fields')}
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
              {t('components.createpersonmanuell.backbutton')}
            </Button>
          )}
          <Button
            onClick={cancel}
            sx={{ textTransform: 'none' }}
            color="danger"
          >
            {t('components.createpersonmanuell.closebutton')}
          </Button>
          {step === 1 ? (
            <Button
              onClick={() => setStep(2)}
              sx={{ textTransform: 'none' }}
              color="success"
              disabled={!isPage1Valid}
            >
              {t('components.createpersonmanuell.nextbutton')}
            </Button>
          ) : (
            <Button
              onClick={finish}
              sx={{ textTransform: 'none' }}
              color="success"
              disabled={!isPage2Valid}
            >
              {t('components.createpersonmanuell.finishbutton')}
            </Button>
          )}
        </ButtonGroup>
      </Box>
    </Box>
  );
};

export default CreateUser;