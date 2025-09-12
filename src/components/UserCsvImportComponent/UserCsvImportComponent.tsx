/* eslint-disable max-lines-per-function */
import Card from '@agile-software/shared-components/src/components/Card/Card';
import Button from '@agile-software/shared-components/src/components/Button/Button';
import { Box, ButtonGroup, Select, Option, Typography } from '@mui/joy';
import { useTranslation } from 'react-i18next';
import { useRef, useState, useMemo } from 'react';
import {
  getAvailableRoles,
  getPage1DynamicFields,
  dynamicInputFields,
} from '@/utils/createuserfunction';
import {
  generateCsvTemplateForRole,
  downloadCSV,
} from '@/utils/csvimportexport';

const UserCsvImportComponent = ({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const roles = getAvailableRoles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setSelectedRole(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Import-Button nur aktivieren, wenn eine Rolle UND eine Datei ausgewählt ist
  const importDisabled = !selectedRole || !selectedFile;

  // CSV-Template für die ausgewählte Rolle generieren (ohne Rollen-Spalte)
  const { csvString, filename } = useMemo(() => {
    if (!selectedRole) return { csvString: '', filename: '' };
    const csvString = generateCsvTemplateForRole(selectedRole);
    const filename = `${selectedRole}_SAU_IMPORT.csv`;
    return { csvString, filename };
  }, [selectedRole]);

  const handleDownloadTemplate = () => {
    if (csvString && filename) {
      downloadCSV(csvString, filename);
    }
  };

  // Spaltennamen für Vorschau
  const previewColumns = useMemo(() => {
    if (!selectedRole) return [];
    const page1Fields = getPage1DynamicFields();
    const roleFields = dynamicInputFields(selectedRole).fields;
    return [
      'Vorname',
      'Nachname',
      'E-Mail',
      ...page1Fields.map((f) => f.label),
      ...roleFields.map((f) => f.label),
    ];
  }, [selectedRole]);

  return (
    <Card>
      <Typography level="h3" sx={{ mb: 2 }}>
        {t('components.userCsvImportComponent.title')}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        <Typography>
          {t('components.userCsvImportComponent.rolefortemplate')}
        </Typography>
        <Select
          placeholder={t('components.userCsvImportComponent.role')}
          value={selectedRole}
          onChange={(_, value) => setSelectedRole(value ?? null)}
          sx={{ width: '100%' }}
        >
          {roles.map((role) => (
            <Option key={role} value={role}>
              {role}
            </Option>
          ))}
        </Select>
        <Box
          sx={{
            border: '1px solid #d1d5db',
            borderRadius: 8,
            p: 2,
            background: '#f9f9fa',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            minHeight: 70,
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current?.click()}
            sx={{ minWidth: 140 }}
          >
            {selectedFile
              ? t('components.userCsvImportComponent.fileinputlabel')
              : t('components.userCsvImportComponent.uploadbutton')}
          </Button>
          <Typography
            sx={{
              flex: 1,
              ml: 1,
              color: selectedFile ? '#222' : '#888',
              fontSize: 16,
            }}
          >
            {selectedFile
              ? selectedFile.name
              : t('components.userCsvImportComponent.fileinputplaceholder')}
          </Typography>
        </Box>
        {selectedRole && (
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography level="body-lg" sx={{ mb: 1 }}>
              {t('components.userCsvImportComponent.information')}
            </Typography>
            <Button
              variant="soft"
              onClick={handleDownloadTemplate}
              sx={{ mb: 1 }}
            >
              {t('components.userCsvImportComponent.downloadtemplate', {
                role: selectedRole,
              })}
            </Button>
            {/* 
            <Box
              sx={{
                overflowX: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: 4,
                p: 1,
                background: '#fafbfc',
                fontSize: 14,
                mt: 1,
              }}
            >
            
            <Typography level="body-sm" sx={{ mb: 0.5, fontWeight: 600 }}>
                {t('components.userCsvImportComponent.previewcsvtemplate')} {' '}
                {selectedRole} {':'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {previewColumns.map((col) => (
                    <Box
                        key={col}
                        sx={{
                            px: 1.5,
                            py: 0.5,
                            background: '#e3e7ef',
                            borderRadius: 2,
                            fontSize: 13,
                            color: '#222',
                        }}
                    >
                        {col}
                    </Box>
                ))}
            </Box>
            
            
                ))}
              </Box>
            

            </Box>
            */}
          </Box>
        )}
        <Typography level="h4">
          {t('components.userCsvImportComponent.information')}
        </Typography>
        <ButtonGroup variant="outlined" sx={{ mt: 2 }}>
          <Button color="danger" onClick={onClose}>
            {t('components.userCsvImportComponent.cancelbutton')}
          </Button>
          <Button color="danger" onClick={handleReset}>
            {t('components.userCsvImportComponent.resetbutton')}
          </Button>
          <Button disabled={importDisabled}>
            {t('components.userCsvImportComponent.importbutton')}
          </Button>
        </ButtonGroup>
      </Box>
    </Card>
  );
};
export default UserCsvImportComponent;