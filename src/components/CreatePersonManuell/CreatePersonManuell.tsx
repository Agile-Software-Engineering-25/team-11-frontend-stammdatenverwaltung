import { Box, Typography, ButtonGroup, Select, Option } from '@mui/joy';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import React, { useState } from 'react';
import Button from '@agile-software/shared-components/src/components/Button/Button';
import Input from '@agile-software/shared-components/src/components/Input/Input';

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
  role: null as string | null,
};

const CreateUser = () => {
  const options = [
    { value: 'eins', label: 'Student' },
    { value: 'zwei', label: 'Dozent' },
    { value: 'drei', label: 'Mitarbeiter' },
  ];
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);

  const handleInputChange =
    (field: keyof typeof initialState) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleRoleChange = (_: any, value: string | null) => {
    setForm((prev) => ({ ...prev, role: value }));
  };

  const finish = () => {
    setForm(initialState);
    navigate('/');
  };
  const cancel = () => {
    setForm(initialState);
    navigate('/');
  };


  return (
    <Box sx={{ padding: 2, maxWidth: 700, mx: 'auto' }}>
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
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Input
          label={t('components.createpersonmanuell.email')}
          required
          value={form.email}
          onChange={handleInputChange('email')}
        />
        <Input
          label={t('components.createpersonmanuell.phone')}
          required
          value={form.phone}
          onChange={handleInputChange('phone')}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Input
          label={t('components.createpersonmanuell.birthdate')}
          required
          value={form.birthdate}
          onChange={handleInputChange('birthdate')}
        />
        <Input
          label={t('components.createpersonmanuell.placeofbirth')}
          required
          value={form.placeofbirth}
          onChange={handleInputChange('placeofbirth')}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Input
          label={t('components.createpersonmanuell.city')}
          required
          value={form.city}
          onChange={handleInputChange('city')}
        />
        <Input
          label={t('components.createpersonmanuell.street')}
          required
          value={form.street}
          onChange={handleInputChange('street')}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Input
          label={t('components.createpersonmanuell.housenumber')}
          required
          value={form.housenumber}
          onChange={handleInputChange('housenumber')}
        />
        <Input
          label={t('components.createpersonmanuell.zipcode')}
          required
          value={form.zipcode}
          onChange={handleInputChange('zipcode')}
        />
      </Box>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Input
          label={t('components.createpersonmanuell.country')}
          required
          value={form.country}
          onChange={handleInputChange('country')}
        />
        <Input
          label={t('components.createpersonmanuell.nationality')}
          required
          value={form.nationality}
          onChange={handleInputChange('nationality')}
        />
      </Box>

      <Select
        placeholder={t('components.createpersonmanuell.choose_role')}
        value={form.role}
        onChange={handleRoleChange}
        sx={{ my: 2, minWidth: 240 }}
      >
        {options.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      {form.role && (
        <Box sx={{ mt: 2 }}>
          <Typography>{t('components.createpersonmanuell.content')}</Typography>
        </Box>
      )}
      <ButtonGroup>
        <Button onClick={cancel} sx={{ textTransform: 'none' }} color="danger">
          {t('components.createpersonmanuell.closebutton')}
        </Button>
        <Button onClick={finish} sx={{ textTransform: 'none' }} color="success">
          {t('components.createpersonmanuell.finishbutton')}
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default CreateUser;