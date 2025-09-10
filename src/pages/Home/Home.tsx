import { Box, Typography } from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import UserDataTableComponent from '@/components/UserDataTableComponent/UserDataTableComponent';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Box sx={{ padding: 2, maxWidth: 1500, mx: 'auto' }}>
      <Typography>{t('pages.home.title')}</Typography>
      <LanguageSelectorComponent />
      <UserDataTableComponent />
    </Box>
  );
};
export default Home;
