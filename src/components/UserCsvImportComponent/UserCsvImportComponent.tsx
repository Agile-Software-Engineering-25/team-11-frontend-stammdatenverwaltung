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
  createUser,
} from '@/utils/createuserfunction';
import {
  generateCsvTemplateForRole,
  downloadCSV,
} from '@/utils/csvimportexport';

const UserCsvImportComponent = ({ onClose }: { onClose?: () => void }) => {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
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
  const importDisabled = !selectedRole || !selectedFile || importing;

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

  // Hilfsfunktion: CSV parsen (nur einfache CSV, keine Sonderzeichen/Quotes)
  function parseCsv(text: string): string[][] {
    return text
      .split(/\r?\n/)
      .map((line) => line.split(',').map((cell) => cell.trim()))
      .filter((row) => row.some((cell) => cell.length > 0));
  }

  // Hilfsfunktion: Validierung der Pflichtfelder
  function validateRow(
    row: string[],
    header: string[],
    requiredFields: string[]
  ): boolean {
    for (const field of requiredFields) {
      const idx = header.indexOf(field);
      if (idx === -1 || !row[idx] || row[idx].trim() === '') {
        return false;
      }
    }
    return true;
  }

  // Import-Funktion
  const handleImport = async () => {
    if (!selectedFile || !selectedRole) return;
    setImporting(true);

    // Felder für die gewählte Rolle
    const page1Fields = getPage1DynamicFields();
    const roleFields = dynamicInputFields(selectedRole).fields;

    // Pflichtfelder (Standard + dynamisch + rollenspezifisch)
    const requiredFields = [
      'Vorname',
      'Nachname',
      'E-Mail',
      ...page1Fields.filter((f) => f.required).map((f) => f.label),
      ...roleFields.filter((f) => f.required).map((f) => f.label),
    ];

    // Datei einlesen
    const text = await selectedFile.text();
    const rows = parseCsv(text);
    if (rows.length < 1) {
      setImporting(false);
      alert(t('components.userCsvImportComponent.importerrorempty'));
      return;
    }
    const header = rows[0];
    const dataRows = rows.slice(1);

    // Mappe Label zu Index
    const labelToIndex = Object.fromEntries(
      header.map((label, idx) => [label, idx])
    );

    // Für createUser: Reihenfolge der Felder bestimmen
    const allLabels = [
      'Vorname',
      'Nachname',
      'E-Mail',
      ...page1Fields.map((f) => f.label),
      ...roleFields.map((f) => f.label),
    ];

    // Für createUser: Feldnamen in der richtigen Reihenfolge (wie in createUser erwartet)
    const allFieldNames = [
      'firstname',
      'lastname',
      'email',
      ...page1Fields.map((f) => f.name),
      ...roleFields.map((f) => f.name),
    ];

    // Nutzer, die nicht importiert werden konnten
    const failedRows: string[][] = [];
    // Erfolgreich importierte Nutzer zählen
    let successCount = 0;

    for (const row of dataRows) {
      // Prüfe auf Pflichtfelder
      if (!validateRow(row, header, requiredFields)) {
        failedRows.push(row);
        continue;
      }
      // Werte in der richtigen Reihenfolge für createUser
      const userData: string[] = allLabels.map((label) => {
        const idx = labelToIndex[label];
        return idx !== undefined ? row[idx] : '';
      });
      // Rolle anhängen (für createUser)
      userData.push(selectedRole);

      // createUser aufrufen
      const result = createUser(userData);
      if (!result) {
        failedRows.push(row);
      } else {
        successCount++;
      }
    }

    setImporting(false);

    if (failedRows.length > 0) {
      // Fehlerhafte Zeilen als CSV zum Download anbieten
      const failedCsv = [header, ...failedRows]
        .map((row) =>
          row
            .map((val) =>
              typeof val === 'string' &&
              (val.includes(',') || val.includes('"') || val.includes('\n'))
                ? `"${val.replace(/"/g, '""')}"`
                : val
            )
            .join(',')
        )
        .join('\r\n');
      downloadCSV(
        failedCsv,
        `${t('components.userCsvImportComponent.importerrorfilename')}Import_${selectedRole}_SAU.csv`
      );
      alert(
        t('components.userCsvImportComponent.partialimport', {
          success: successCount,
          failed: failedRows.length,
        })
      );
    } else {
      alert(
        t('components.userCsvImportComponent.importsuccess', {
          success: successCount,
        })
      );
    }
    handleReset();
    if (onClose) onClose(); // Popup nach Import schließen
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
          <Button
            disabled={importDisabled}
            loading={importing}
            onClick={handleImport}
          >
            {t('components.userCsvImportComponent.importbutton')}
          </Button>
        </ButtonGroup>
      </Box>
    </Card>
  );
};
export default UserCsvImportComponent;