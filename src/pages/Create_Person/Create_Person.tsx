import { Box, Typography } from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import CreatePersonManuelComponent from '@/components/CreatePersonManuelComponent/CreatePersonManuelComponent';

const CreatePerson = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ padding: 2, maxWidth: 700, mx: 'auto' }}>
      <Typography level="h2">
        {t('pages.create_person_manuell.title')}
      </Typography>
      <LanguageSelectorComponent />
      <Typography level="h4">
        {t('pages.create_person_manuell.description')}
      </Typography>
      <Typography>{t('pages.create_person_manuell.text')}</Typography>
      <CreatePersonManuelComponent />
    </Box>
  );
};

export default CreatePerson;