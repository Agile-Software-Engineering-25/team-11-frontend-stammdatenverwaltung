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
} from '@/utils/createpersonfunction';

const initialState = {
  firstname: '',
  lastname: '',
  email: '',
  phone: '',
  birthdate: '',
  placeofbirth: '',
  city: '',
  street: '',
  housenumber: '',
  zipcode: '',
  country: '',
  nationality: '',
  role: '',
};


const requiredFieldsPage1 = [
  'firstname',
  'lastname',
  'email',
  'phone',
  'birthdate',
  'placeofbirth',
  'city',
  'street',
  'housenumber',
  'zipcode',
  'country',
  'nationality',
  'role',
];

const CreateUser = () => {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    ...initialState,
  });

  const dynamicFields = dynamicInputFields(form.role).fields;
  const isPage1Valid = requiredFieldsPage1.every((field) => !!form[field]);
  const isPage2Valid = dynamicFields.every(
    (field) => !field.required || !!form[field.name]
  );

  const roles = getAvailableRoles();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Funktioniert für alle Felder, auch dynamische
  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleRoleChange = (_: any, value: string | null) => {
    setForm((prev) => ({
      ...prev,
      role: value ?? '',
      ...Object.fromEntries(
        dynamicInputFields(value ?? '').fields.map((field) => [field.name, ''])
      ),
    }));
  };

  const finish = () => {
    // Sammle alle Feldnamen in der gewünschten Reihenfolge
    const allFieldNames = [
      ...requiredFieldsPage1,
      ...dynamicFields.map((field) => field.name),
    ];
    // Erzeuge das Array mit den Werten in der gleichen Reihenfolge
    const values = allFieldNames.map((field) => form[field] ?? '');

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

  return (
    <Box sx={{ padding: 2, maxWidth: 700, mx: 'auto' }}>
      {step === 1 && (
        <>
          <Box sx={{ display: 'flex', gap: 2 }}>
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
          <Input
            label={t('components.createpersonmanuell.email')}
            required
            value={form.email}
            onChange={handleInputChange('email')}
            sx={{ width: '68%' }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Input
              label={t('components.createpersonmanuell.phone')}
              required
              value={form.phone}
              onChange={handleInputChange('phone')}
            />
            <Input
              label={t('components.createpersonmanuell.birthdate')}
              required
              value={form.birthdate}
              onChange={handleInputChange('birthdate')}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Input
              label={t('components.createpersonmanuell.placeofbirth')}
              required
              value={form.placeofbirth}
              onChange={handleInputChange('placeofbirth')}
            />
            <Input
              label={t('components.createpersonmanuell.city')}
              required
              value={form.city}
              onChange={handleInputChange('city')}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Input
              label={t('components.createpersonmanuell.street')}
              required
              value={form.street}
              onChange={handleInputChange('street')}
            />
            <Input
              label={t('components.createpersonmanuell.housenumber')}
              required
              value={form.housenumber}
              onChange={handleInputChange('housenumber')}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Input
              label={t('components.createpersonmanuell.zipcode')}
              required
              value={form.zipcode}
              onChange={handleInputChange('zipcode')}
            />
            <Input
              label={t('components.createpersonmanuell.country')}
              required
              value={form.country}
              onChange={handleInputChange('country')}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Input
              label={t('components.createpersonmanuell.nationality')}
              required
              value={form.nationality}
              onChange={handleInputChange('nationality')}
            />
          </Box>
          <Select
            placeholder={t('components.createpersonmanuell.role')}
            value={form.role || null}
            onChange={handleRoleChange}
            required
            sx={{ width: '68%', mt: 2 }}
          >
            {roles.map((role) => (
              <Option key={role} value={role}>
                {role}
              </Option>
            ))}
          </Select>
        </>
      )}

      {step === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          {dynamicFields.length === 0 ? (
            <Box sx={{ mb: 4 }}>
              {t('components.createpersonmanuell.no_role_specific_fields')}
            </Box>
          ) : (
            dynamicFields.map((field) => (
              <Input
                key={field.name}
                label={field.label}
                required={field.required}
                type={field.type}
                value={form[field.name]}
                onChange={handleInputChange(field.name)}
                sx={{ width: '68%' }}
              />
            ))
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