import { Box, Typography} from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import Button from '@agile-software/shared-components/src/components/Button/Button';


const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ padding: 2, maxWidth: 700, mx: 'auto' }}>
      <Typography>{t('pages.home.title')}</Typography>
      <LanguageSelectorComponent />
      <Button onClick={() => navigate('/create_user')}>
        {t('pages.home.create_manuell')}
      </Button>
    </Box>
  );
};

export default Home;
