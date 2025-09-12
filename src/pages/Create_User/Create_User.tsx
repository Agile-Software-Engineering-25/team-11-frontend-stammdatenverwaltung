import { Box, Typography } from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import CreateUserManualyComponent from '@/components/CreateUserManualyComponent/CreateUserManualyComponent';

const CreateUser = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ padding: 2, maxWidth: 700, mx: 'auto' }}>
      <Typography level="h2">
        {t('pages.create_user_manually.title')}
      </Typography>
      <LanguageSelectorComponent />
      <Typography level="h4">
        {t('pages.create_user_manually.description')}
      </Typography>
      <Typography>{t('pages.create_user_manually.text')}</Typography>
      <CreateUserManualyComponent />
    </Box>
  );
};

export default CreateUser;