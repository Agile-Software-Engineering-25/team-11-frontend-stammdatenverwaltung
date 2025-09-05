import { Box, Typography, ButtonGroup, Select, Option } from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import React, { useState } from 'react';
import Button from '@agile-software/shared-components/src/components/Button/Button';

const Create_User = () => {
  const options = [
    { value: 'eins', label: 'Option 1' },
    { value: 'zwei', label: 'Option 2' },
    { value: 'drei', label: 'Option 3' },
  ];
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleClose = () => navigate('/');
  const handleFinish = () => navigate('/');
  const [selected, setSelected] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Box sx={{ padding: 2, maxWidth: 700, mx: 'auto' }}>
      <Typography level="h2">{t('pages.create_user.title')}</Typography>
      <LanguageSelectorComponent />
      <Typography level="h4">{t('pages.create_user.description')}</Typography>
      <Typography>{t('pages.create_user.text')}</Typography>
      <Select
        multiple
        placeholder={t('pages.create_user.choose_role')}
        value={selected}
        onChange={(_, value) => {
          setSelected(value as string[]);
          setShowDetails(true);
        }}
        sx={{ my: 2, minWidth: 240 }}
      >
        {options.map((option) => (
          <Option key={option.value} value={option.value}>
            {option.label}
          </Option>
        ))}
      </Select>
      {showDetails && (
        <Box sx={{ mt: 2 }}>
          <Typography>{t('pages.create_user.content')}</Typography>
        </Box>
      )}
      <ButtonGroup>
        <Button
          onClick={handleClose}
          sx={{ textTransform: 'none' }}
          color="danger">
          {t('pages.create_user.closebutton')}
        </Button>
        <Button
          onClick={handleFinish}
          sx={{ textTransform: 'none' }}
          color="success">
          {t('pages.create_user.finishbutton')}
        </Button>
      </ButtonGroup>
    </Box>
  );
};

export default Create_User;