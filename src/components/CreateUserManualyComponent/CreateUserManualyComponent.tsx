/* eslint-disable max-lines-per-function */
import {
  Box,
  ButtonGroup,
  Select,
  Option,
  Button,
  Input,
  Typography,
  Checkbox,
} from '@mui/joy';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import React, { useState } from 'react';
import {
  dynamicInputFields,
  getAvailableRoles,
  createUser,
  getPage1DynamicFields,
} from '@/utils/createuserfunction';
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
  roles: string[];
  [key: string]: string | string[] | boolean | undefined;
};

const initialState: FormState = {
  firstname: '',
  lastname: '',
  email: '',
  roles: [],
  // dynamische Felder werden nach Bedarf ergänzt
};

const requiredFieldsPage1 = ['firstname', 'lastname', 'email', 'roles'];

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

  const isPage1Valid =
    requiredFieldsPage1.every((field) =>
      field === 'roles'
        ? Array.isArray(form.roles) && form.roles.length > 0
        : !!form[field]
    ) &&
    page1DynamicFields.every((field) => !field.required || !!form[field.name]);

  const isPage2Valid = dynamicFields.every(
    (field) => !field.required || !!form[field.name]
  );

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setMessage } = useMessage();

  // Hilfs-Setter: speichert Wert (strings, booleans, arrays)
  const setFieldValue = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Funktioniert für text/number/date Inputs
  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFieldValue(field, e.target.value);
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
      keepFields.forEach((f) => {
        if (!(f in cleanedForm)) cleanedForm[f] = '';
      });
      return {
        ...cleanedForm,
        roles: rolesArr,
      };
    });
  };

  const finish = () => {
    // Sammle alle Feldnamen in der gewünschten Reihenfolge
    const allFieldNames = [
      ...requiredFieldsPage1.filter((f) => f !== 'roles'), // 'roles' wird separat übergeben
      ...page1DynamicFields.map((f) => f.name),
      ...dynamicFields.map((field) => field.name),
    ];
    // Erzeuge das Array mit den Werten in der gleichen Reihenfolge
    const values = allFieldNames.map((field) => {
      const value = form[field];
      if (Array.isArray(value)) return value.join(',');
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      return (value ?? '') as string;
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

  // Hilfsfunktion: Rendert ein Feld passend zu type
  const renderField = (field: DynamicField) => {
    const value = form[field.name];
    switch (field.type) {
      case 'select':
        return (
          <Select
            value={(value as string) ?? ''}
            onChange={(_: any, val: string | null) =>
              setFieldValue(field.name, val ?? '')
            }
            required={field.required}
          >
            {(field.options ?? []).map((opt) => (
              <Option key={opt.value} value={opt.value}>
                {opt.label}
              </Option>
            ))}
          </Select>
        );
      case 'date':
        return (
          <Input
            type="date"
            value={(value as string) ?? ''}
            onChange={handleInputChange(field.name)}
            required={field.required}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={(value as string) ?? ''}
            onChange={handleInputChange(field.name)}
            required={field.required}
          />
        );
      case 'checkbox':
        return (
          <Checkbox
            checked={!!value}
            onChange={(_, checked) => setFieldValue(field.name, !!checked)}
            label={field.label}
            slotProps={{ input: { 'aria-label': field.name } }}
          />
        );
      default:
        return (
          <Input
            value={(value as string) ?? ''}
            onChange={handleInputChange(field.name)}
            required={field.required}
          />
        );
    }
  };

  // Hilfsfunktion für 2er-Gruppierung der dynamischen Felder (Seite 1)
  const renderDynamicFieldsRows = () => {
    const rows: JSX.Element[] = [];
    for (let i = 0; i < page1DynamicFields.length; i += 2) {
      const left = page1DynamicFields[i];
      const right = page1DynamicFields[i + 1];
      rows.push(
        <Box key={left.name} sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography level="body-xs" sx={{ mb: 0.5 }}>
              {left.label}
              {left.required && ' *'}
            </Typography>
            {renderField(left)}
          </Box>
          {right ? (
            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ mb: 0.5 }}>
                {right.label}
                {right.required && ' *'}
              </Typography>
              {renderField(right)}
            </Box>
          ) : (
            <Box sx={{ flex: 1 }} />
          )}
        </Box>
      );
    }
    return rows;
  };

  // Hilfsfunktion für 2er-Gruppierung der dynamischen Rollen-Felder (Seite 2)
  const renderRoleDynamicFieldsRows = () => {
    const rows: JSX.Element[] = [];
    for (let i = 0; i < dynamicFields.length; i += 2) {
      const left = dynamicFields[i];
      const right = dynamicFields[i + 1];
      rows.push(
        <Box key={left.name} sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography level="body-xs" sx={{ mb: 0.5 }}>
              {left.label}
              {left.required && ' *'}
            </Typography>
            {renderField(left)}
          </Box>
          {right ? (
            <Box sx={{ flex: 1 }}>
              <Typography level="body-xs" sx={{ mb: 0.5 }}>
                {right.label}
                {right.required && ' *'}
              </Typography>
              {renderField(right)}
            </Box>
          ) : (
            <Box sx={{ flex: 1 }} />
          )}
        </Box>
      );
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
          <Box sx={{ mt: -2 }}>
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
            <Button onClick={back} sx={{ textTransform: 'none' }} color="danger">
              {t('components.createusermanually.backbutton')}
            </Button>
          )}
          <Button onClick={cancel} sx={{ textTransform: 'none' }} color="danger">
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