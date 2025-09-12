import { Box, Typography } from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import UserDataTableComponent from '@/components/UserDataTableComponent/UserDataTableComponent';

import Button from '@agile-software/shared-components/src/components/Button/Button';
import { useRef } from 'react';
import { exportUsersToCSV, downloadCSV } from '@/utils/csvimportexport';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Ref, um auf die ausgewählten IDs aus der Tabelle zuzugreifen
  const selectedUserIdsRef = useRef<number[]>([]);

  // Callback, das von der Tabelle gesetzt wird
  const handleSelectedUserIdsChange = (ids: number[]) => {
    selectedUserIdsRef.current = ids;
  };

  const handleExport = () => {
    const csv = exportUsersToCSV(selectedUserIdsRef.current);
    if (csv) {
      downloadCSV(csv, 'benutzerdaten.csv');
    } else {
      alert('Bitte wählen Sie mindestens einen Benutzer aus.');
    }
  };

  return (
    <Box sx={{ padding: 2, maxWidth: 1500, mx: 'auto' }}>
      <Typography level="h3">{t('pages.home.title')}</Typography>
      <LanguageSelectorComponent />
      <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
        <Button onClick={() => navigate('/create_person')}>
          {t('pages.home.createmanuell')}
        </Button>
        <Button>{t('pages.home.csvupload')}</Button>
        <Button onClick={handleExport}>{t('pages.home.csvexport')}</Button>
      </Box>
      <UserDataTableComponent onSelectedUserIdsChange={handleSelectedUserIdsChange} />
    </Box>
  );
};

export default Home;
