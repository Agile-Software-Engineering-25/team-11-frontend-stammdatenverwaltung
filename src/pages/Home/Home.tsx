import { Box, Typography} from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import UserDataTableComponent from '@/components/UserDataTableComponent/UserDataTableComponent';

import Button from '@agile-software/shared-components/src/components/Button/Button';


const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ padding: 2, maxWidth: 1500, mx: 'auto' }}>
      <Typography>{t('pages.home.title')}</Typography>
      <LanguageSelectorComponent />
      <Button onClick={() => navigate('/create_person')}>
        {t('pages.home.create_manuell')}
      </Button>
      <UserDataTableComponent />
    </Box>
  );
};

export default Home;
