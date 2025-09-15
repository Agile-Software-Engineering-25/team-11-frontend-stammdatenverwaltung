import { Box, Typography, Modal, ModalDialog } from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import UserDataTableComponent from '@/components/UserDataTableComponent/UserDataTableComponent';
import Button from '@agile-software/shared-components/src/components/Button/Button';
import Card from '@agile-software/shared-components/src/components/Card/Card';
import { useRef, useState } from 'react';
import { exportUsersToCSV, downloadCSV } from '@/utils/csvimportexport';
import UsersCsvImportComponent from '@/components/UserCsvImportComponent/UserCsvImportComponent';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Ref, um auf die ausgewählten IDs aus der Tabelle zuzugreifen
  const selectedUserIdsRef = useRef<number[]>([]);

  // Popup-Status für CSV-Import
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // Callback, das von der Tabelle gesetzt wird
  const handleSelectedUserIdsChange = (ids: number[]) => {
    selectedUserIdsRef.current = ids;
  };

  const handleExport = () => {
    const csv = exportUsersToCSV(selectedUserIdsRef.current);
    if (csv) {
      downloadCSV(csv, t('pages.home.userdatafilename'),);
    } else {
      alert(t('pages.home.nouserselected'));
    }
  };

  const handleOpenCsvImport = () => setCsvImportOpen(true);
  const handleCloseCsvImport = () => setCsvImportOpen(false);

  return (
    <Box sx={{ padding: 2, maxWidth: 1500, mx: 'auto' }}>
      <Typography level="h3">{t('pages.home.title')}</Typography>
      <LanguageSelectorComponent />
      <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
        <Button onClick={() => navigate('/create_user')}>
          {t('pages.home.createmanuell')}
        </Button>
        <Button onClick={handleOpenCsvImport}>
          {t('pages.home.csvupload')}
        </Button>
        <Button onClick={handleExport}>{t('pages.home.csvexport')}</Button>
      </Box>
      <Card id="errorandsuccessmessages"></Card>
      <UserDataTableComponent
        onSelectedUserIdsChange={handleSelectedUserIdsChange}
      />
      <Modal open={csvImportOpen} onClose={handleCloseCsvImport}>
        <ModalDialog>
          <UsersCsvImportComponent onClose={handleCloseCsvImport} />
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export default Home;
