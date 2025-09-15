import { Box, Typography, Modal, ModalDialog } from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import UserDataTableComponent from '@/components/UserDataTableComponent/UserDataTableComponent';
import Button from '@agile-software/shared-components/src/components/Button/Button';
import Card from '@agile-software/shared-components/src/components/Card/Card';
import { useRef, useState } from 'react';
import { exportUsersToCSV, downloadCSV } from '@/utils/csvimportexport';
import UserCsvImportComponent from '@/components/UserCsvImportComponent/UserCsvImportComponent';
import CreateUserManualyComponent from '@/components/CreateUserManualyComponent/CreateUserManualyComponent';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Ref, um auf die ausgewählten IDs aus der Tabelle zuzugreifen
  const selectedUserIdsRef = useRef<number[]>([]);

  // Popup-Status für CSV-Import und User-Erstellung
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);

  // Message-Handling
  const [message, setMessage] = useState<null | { type: 'success' | 'error'; text: string }>(null);
  const [failedCsv, setFailedCsv] = useState<{ csv: string; filename: string } | null>(null);

  // Callback, das von der Tabelle gesetzt wird
  const handleSelectedUserIdsChange = (ids: number[]) => {
    selectedUserIdsRef.current = ids;
  };

  // CSV Export
  const handleExport = () => {
    const csv = exportUsersToCSV(selectedUserIdsRef.current);
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

  // User manuell anlegen
  const handleOpenCreateUser = () => setCreateUserOpen(true);
  const handleCloseCreateUser = () => setCreateUserOpen(false);

  // Message-Callback für Kind-Komponenten
  const handleShowMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
  };

  // Callback für UserCsvImportComponent
  const handleFailedCsv = (csv: string, filename: string) => {
    setFailedCsv({ csv, filename });
  };

  // UserDataTableComponent: Callback für User-Aktionen
  const handleUserAction = (type: 'success' | 'error', text: string) => {
    handleShowMessage(type, text);
  };

  return (
    <Box sx={{ padding: 2, maxWidth: 1500, mx: 'auto' }}>
      <Typography level="h3">{t('pages.home.title')}</Typography>
      <LanguageSelectorComponent />
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
      {message && (
        <Card
          id="errorandsuccessmessages"
          color={message.type === 'success' ? 'success' : 'danger'}
          variant="soft"
          sx={{
            mb: 2,
            display: 'block',
            background: message.type === 'success',
            borderColor: message.type === 'success',
            color: message.type === 'success',
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
      <UserDataTableComponent
        onSelectedUserIdsChange={handleSelectedUserIdsChange}
        onUserAction={handleShowMessage}
      />
      {/* User erstellen Modal */}
      <Modal open={createUserOpen} onClose={handleCloseCreateUser}>
        <ModalDialog>
          <CreateUserManualyComponent
            onClose={handleCloseCreateUser}
            onShowMessage={handleShowMessage}
          />
        </ModalDialog>
      </Modal>
      {/* CSV Import Modal */}
      <Modal open={csvImportOpen} onClose={handleCloseCsvImport}>
        <ModalDialog>
          <UserCsvImportComponent
            onClose={handleCloseCsvImport}
            onShowMessage={handleShowMessage}
            onFailedCsv={handleFailedCsv}
          />
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export default Home;
