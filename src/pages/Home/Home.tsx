/* eslint-disable max-lines-per-function */
import { Box, Typography, Button } from '@mui/joy';
import { Card, Modal as SharedModal } from '@agile-software/shared-components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import UserDataTableComponent from '@/components/UserDataTableComponent/UserDataTableComponent';
import { useState, useEffect } from 'react';
import { exportUsersToCSV, downloadCSV } from '@/utils/csvimportexport';
import UserCsvImportComponent from '@/components/UserCsvImportComponent/UserCsvImportComponent';
import { useMessage } from '@/components/MessageProvider/MessageProvider';


const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message, setMessage } = useMessage();

  // Auswahl-IDs nun im Parent state (zuverlässig für Export)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  // Debug: Auswahländerungen im Console-Log
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.debug('Home: selectedUserIds changed', selectedUserIds);
  }, [selectedUserIds]);

  // Popup-Status für CSV-Import
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // Message-Handling
  const [failedCsv, setFailedCsv] = useState<{
    csv: string;
    filename: string;
  } | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Callback, das von der Tabelle gesetzt wird (Tabelle liefert string[] IDs)
  const handleSelectedUserIdsChange = (ids: string[]) => {
    setSelectedUserIds(ids);
  };

  // CSV Export
  const handleExport = () => {
    const csv = exportUsersToCSV(selectedUserIds);
    if (csv) {
      downloadCSV(csv, t('pages.home.userdatafilename'));
      setMessage({ type: 'success', text: t('pages.home.successcsvexport') });
    } else {
      setMessage({ type: 'error', text: t('pages.home.nouserselected') });
    }
  };

  // CSV Import
  const handleOpenCsvImport = () => setCsvImportOpen(true);
  const handleCloseCsvImport = () => setCsvImportOpen(false);

  // Callback für UserCsvImportComponent und andere
  const handleShowMessage = (type: 'success' | 'error', text: string) =>
    setMessage({ type, text });

  // Callback für UserCsvImportComponent
  const handleFailedCsv = (csv: string, filename: string) => {
    setFailedCsv({ csv, filename });
  };

  // Weiterleitung zur Create-User-Seite
  const handleOpenCreateUser = () => {
    setSelectedUserId(null);
    navigate('/create_user');
  };

  return (
    <Box sx={{ padding: 2, maxWidth: 1500, mx: 'auto' }}>
      <Typography level="h3">{t('pages.home.title')}</Typography>
      <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
        <Button onClick={handleOpenCreateUser}>
          {t('pages.home.createmanuell')}
        </Button>
        <Button onClick={handleOpenCsvImport}>
          {t('pages.home.csvupload')}
        </Button>
        <Button onClick={handleExport}>{t('pages.home.csvexport')}</Button>
      </Box>
      {/* Erfolgs-/Fehlermeldung */}
      <Box id="errorandsuccessmessages">
        {message && (
          <Card
            cardSX={{
              mb: 2,
              backgroundColor:
                message.type === 'success'
                  ? '#e6f4ea !important'
                  : '#fdecea !important',
              border: '2px solid',
              borderColor: message.type === 'success' ? '#4caf50' : '#d32f2f',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <span>{message.text}</span>
              {failedCsv && message.type === 'error' && (
                <Button
                  size="sm"
                  variant="soft"
                  color="danger"
                  onClick={() => downloadCSV(failedCsv.csv, failedCsv.filename)}
                >
                  {t('components.userCsvImportComponent.downloaderrorfile')}
                </Button>
              )}
            </Box>
          </Card>
        )}
      </Box>
      <UserDataTableComponent
        onSelectedUserIdsChange={handleSelectedUserIdsChange}
        selectedUserIds={selectedUserIds}
        setSelectedUserIds={setSelectedUserIds}
        selectedUserId={selectedUserId}
        setSelectedUserId={setSelectedUserId}
        onShowMessage={handleShowMessage}
      />
      {/* CSV Import Modal mit Shared Component */}
      <SharedModal
        header={t('components.userCsvImportComponent.title')}
        open={csvImportOpen}
        setOpen={setCsvImportOpen}
      >
        <UserCsvImportComponent
          onClose={handleCloseCsvImport}
          onShowMessage={handleShowMessage}
          onFailedCsv={handleFailedCsv}
        />
      </SharedModal>
    </Box>
  );
};

export default Home;
