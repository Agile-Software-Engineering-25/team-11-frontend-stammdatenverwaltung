import { Box, Typography, ButtonGroup, Select, Option } from '@mui/joy';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import React, { useState } from 'react';
import Button from '@agile-software/shared-components/src/components/Button/Button';

const CreateUser = () => {
  const options = [
    { value: 'eins', label: 'Option 1' },
    { value: 'zwei', label: 'Option 2' },
    { value: 'drei', label: 'Option 3' },
  ];
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleClose = () => navigate('/');
  const handleFinish = () => navigate('/');
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Box sx={{ padding: 2, maxWidth: 700, mx: 'auto' }}>

      <Select
        placeholder={t('components.createpersonmanuell.choose_role')}
        value={selected}
        onChange={(_, value) => {
          setSelected(value as string);
        }}
        sx={{ my: 2, minWidth: 240 }}
      >
        {options.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      {selected && (
        <Box sx={{ mt: 2 }}>
          <Typography>{t('components.createpersonmanuell.content')}</Typography>
        </Box>
      )}
      <ButtonGroup>
        <Button
          onClick={handleClose}
          sx={{ textTransform: 'none' }}
          color="danger">
          {t('components.createpersonmanuell.closebutton')}
        </Button>
        <Button
          onClick={handleFinish}
          sx={{ textTransform: 'none' }}
          color="success">
          {t('components.createpersonmanuell.finishbutton')}
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default CreateUser;