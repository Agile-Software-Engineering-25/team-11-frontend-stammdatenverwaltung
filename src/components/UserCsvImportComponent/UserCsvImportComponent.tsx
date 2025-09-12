/* eslint-disable max-lines-per-function */
import Card from '@agile-software/shared-components/src/components/Card/Card';
import Button from '@agile-software/shared-components/src/components/Button/Button';
import { Box, ButtonGroup, Select, Option, Typography } from '@mui/joy';
import { useTranslation } from 'react-i18next';
import { useRef, useState } from 'react';
import { getAvailableRoles } from '@/utils/createuserfunction';

const UserCsvImportComponent = ({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const roles = getAvailableRoles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    setSelectedRoles([]);
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
        <Select
          multiple
          placeholder={t('components.userCsvImportComponent.rolefortemplate')}
          value={selectedRoles}
          onChange={(_, value) => setSelectedRoles(value ?? [])}
          sx={{ width: '100%' }}
        >
          {roles.map((role) => (
            <Option key={role} value={role}>
              {role}
            </Option>
          ))}
        </Select>
        <ButtonGroup variant="outlined" sx={{ mt: 2 }}>
          <Button color="danger" onClick={onClose}>
            {t('components.userCsvImportComponent.cancelbutton')}
          </Button>
          <Button color="danger" onClick={handleReset}>
            {t('components.userCsvImportComponent.resetbutton')}
          </Button>
          <Button>{t('components.userCsvImportComponent.importbutton')}</Button>
        </ButtonGroup>
      </Box>
    </Card>
  );
};
export default UserCsvImportComponent;