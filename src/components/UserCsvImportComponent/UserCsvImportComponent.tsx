/* eslint-disable max-lines-per-function */
import Card from '@agile-software/shared-components/src/components/Card/Card';
import Button from '@agile-software/shared-components/src/components/Button/Button';
import {
  Box,
  ButtonGroup,
  Select,
  Option,
  Typography,
  Table,
  Input,
} from '@mui/joy';
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

type CsvRow = { [key: string]: string };

const NOVALUE = '#novalue';

// Hilfsfunktion: Berechne die tatsächliche Pixelbreite des längsten Inhalts (Header + Zellen)
function getTextWidth(text: string, font = '16px Arial') {
  if (typeof document === 'undefined') return 200;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 200;
  context.font = font;
  return context.measureText(text).width;
}

function getColumnWidths(header: string[], rows: CsvRow[]): Record<string, number> {
  const widths: Record<string, number> = {};
  header.forEach((col) => {
    let maxWidth = getTextWidth(col, '16px Arial');
    rows.forEach((row) => {
      const val = row[col] ?? '';
      maxWidth = Math.max(maxWidth, getTextWidth(val, '16px Arial'));
    });
    // +48px für Padding & Input-Icon, min. 80px
    widths[col] = Math.max(Math.ceil(maxWidth) + 48, 80);
  });
  return widths;
}

const UserCsvImportComponent = ({
  onClose,
  onShowMessage,
  onFailedCsv,
}: {
  onClose?: () => void;
  onShowMessage?: (type: 'success' | 'error', text: string) => void;
  onFailedCsv?: (csv: string, filename: string) => void;
}) => {
  const { t } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'select' | 'preview'>('select');
  const [csvRowsObj, setCsvRowsObj] = useState<Record<number, CsvRow>>({});
  const [csvHeader, setCsvHeader] = useState<string[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const roles = getAvailableRoles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Für das Scrollen zu fehlenden Feldern
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
  function getRequiredFields(): string[] {
    if (!selectedRole) return [];
    const page1Fields = getPage1DynamicFields();
    const roleFields = dynamicInputFields(selectedRole).fields;
    return [
      'Vorname',
      'Nachname',
      'E-Mail',
      ...page1Fields.filter((f) => f.required).map((f) => f.label),
      ...roleFields.filter((f) => f.required).map((f) => f.label),
    ];
  }

  const handleReset = () => {
    setSelectedRole(null);
    setSelectedFile(null);
    setStep('select');
    setCsvHeader([]);
    setCsvRowsObj({});
    setRequiredFields([]);
    setColumnWidths({});
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

  // Weiter-Button: CSV einlesen und in Tabelle anzeigen
  const handleNext = async () => {
    if (!selectedFile || !selectedRole) return;
    setImporting(true);

    const text = await selectedFile.text();
    const rows = parseCsv(text);
    if (rows.length < 1) {
      setImporting(false);
      alert(t('components.userCsvImportComponent.importerrorempty'));
      return;
    }
    const header = rows[0];
    const dataRows = rows.slice(1);

    const reqFields = getRequiredFields();

    // Zeilen als Objekt
    const csvRowsObj: Record<number, CsvRow> = {};
    dataRows.forEach((row, idx) => {
      const obj: CsvRow = {};
      header.forEach((col, colIdx) => {
        obj[col] = row[colIdx] ?? '';
      });
      reqFields.forEach((field) => {
        if (!obj[field] || obj[field].trim() === '') {
          obj[field] = NOVALUE;
        }
      });
      csvRowsObj[idx] = obj;
    });

    setCsvHeader(header);
    setCsvRowsObj(csvRowsObj);
    setRequiredFields(reqFields);
    setStep('preview');
    setImporting(false);

    // Spaltenbreiten einmalig berechnen und speichern
    setColumnWidths(getColumnWidths(header, Object.values(csvRowsObj)));
  };

  // Nur die geänderte Zeile updaten
  const handleCellChange = (rowIdx: number, col: string, value: string) => {
    setCsvRowsObj((prev) => ({
      ...prev,
      [rowIdx]: {
        ...prev[rowIdx],
        [col]: value === '' && requiredFields.includes(col) ? NOVALUE : value,
      },
    }));
  };

  // Prüfe, ob noch Pflichtfelder fehlen
  const missingRequiredCells: { row: number; col: string }[] = [];
  Object.entries(csvRowsObj).forEach(([rowIdx, row]) => {
    requiredFields.forEach((field) => {
      if (row[field] === NOVALUE) {
        missingRequiredCells.push({ row: Number(rowIdx), col: field });
      }
    });
  });

  const hasMissingRequired = missingRequiredCells.length > 0;

  // Import-Funktion
  const handleImport = () => {
    if (!selectedRole) return;
    setImporting(true);

    // Reihenfolge der Felder für createUser
    const allLabels = previewColumns;

    // Nutzer, die nicht importiert werden konnten
    const failedRows: string[][] = [];
    let successCount = 0;

    for (const row of Object.values(csvRowsObj)) {
      // Prüfe auf Pflichtfelder
      if (
        requiredFields.some(
          (field) =>
            row[field] === NOVALUE || !row[field] || row[field].trim() === ''
        )
      ) {
        failedRows.push(allLabels.map((label) => row[label] ?? ''));
        continue;
      }
      // Werte in der richtigen Reihenfolge für createUser
      // FIX: Die Rolle wird NICHT aus der CSV genommen, sondern aus selectedRole!
      const userData: string[] = allLabels.map((label) => row[label] ?? '');
      // Die Rolle als letztes Feld anhängen
      userData.push(selectedRole);

      // createUser aufrufen
      const result = createUser(userData, selectedRole);
      if (!result) {
        failedRows.push(allLabels.map((label) => row[label] ?? ''));
      } else {
        successCount++;
      }
    }

    setImporting(false);

    if (failedRows.length > 0) {
      // Fehlerhafte Zeilen als CSV zum Download bereitstellen (nicht automatisch downloaden)
      const failedCsv = [allLabels, ...failedRows]
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
      const errorFileName = `${t('components.userCsvImportComponent.importerrorfilename')}${selectedRole}_SAU.csv`;
      if (onFailedCsv) onFailedCsv(failedCsv, errorFileName);
      if (onShowMessage)
        onShowMessage(
          'error',
          t('components.userCsvImportComponent.partialimport', {
            success: successCount,
            failed: failedRows.length,
          })
        );
    } else {
      if (onShowMessage)
        onShowMessage(
          'success',
          t('components.userCsvImportComponent.importsuccess', {
            success: successCount,
          })
        );
    }
    handleReset();
    if (onClose) onClose();
  };

  // Scroll zu erstem fehlenden Feld
  const scrollToFirstMissing = () => {
    if (missingRequiredCells.length > 0) {
      const { row, col } = missingRequiredCells[0];
      const refKey = `${row}-${col}`;
      setTimeout(() => {
        const input = cellRefs.current[refKey];
        if (input) {
          input.focus();
          input.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center',
          });
        }
      }, 100);
    }
  };

  const missingCount = missingRequiredCells.length;

  return (
    <Card sx={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      {/* Kompakter Header, sticky */}
      <Box
        sx={{
          pb: 1,
          borderBottom: '1px solid #e0e0e0',
          position: 'sticky',
          top: 0,
          zIndex: 2,
          background: '#fff',
        }}
      >
        <Typography level="h3" sx={{ mb: 0.5 }}>
          {t('components.userCsvImportComponent.title')}
        </Typography>
        {step === 'preview' && (
          <Typography level="body-sm" sx={{ mb: 0.5 }}>
            {t('components.userCsvImportComponent.previewtableinfo')}
          </Typography>
        )}
        {step === 'select' && (
          <Typography level="body-sm" sx={{ mb: 0.5 }}>
            {t('components.userCsvImportComponent.rolefortemplate')}
          </Typography>
        )}
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          alignItems: 'stretch',
          width: '100%',
          flex: 1,
          minHeight: 0,
        }}
      >
        {step === 'select' && (
          <>
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
                disabled={!selectedRole || !selectedFile || importing}
                loading={importing}
                onClick={handleNext}
                color="success"
              >
                {t('components.userCsvImportComponent.nextbutton')}
              </Button>
            </ButtonGroup>
          </>
        )}
        {step === 'preview' && (
          <>
            <Box
              sx={{
                overflowX: 'auto',
                overflowY: 'auto',
                mb: 2,
                maxHeight: '45vh',
                minHeight: 0,
              }}
            >
              <Table
                borderAxis="both"
                size="lg"
                sx={{
                  fontSize: 16,
                  minWidth:
                    Object.values(columnWidths).reduce((a, b) => a + b, 0) +
                    100,
                  '& th, & td': {
                    verticalAlign: 'middle',
                    padding: '6px 8px',
                  },
                  '& th': {
                    background: '#f3f6fa',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  },
                }}
              >
                <thead>
                  <tr>
                    {csvHeader.map((col) => (
                      <th
                        key={col}
                        style={{
                          minWidth: columnWidths[col],
                          width: columnWidths[col],
                          maxWidth: columnWidths[col],
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(csvRowsObj).map(([rowIdx, row]) => (
                    <TableRowMemo
                      key={rowIdx}
                      row={row}
                      rowIdx={Number(rowIdx)}
                      csvHeader={csvHeader}
                      columnWidths={columnWidths}
                      requiredFields={requiredFields}
                      handleCellChange={handleCellChange}
                      NOVALUE={NOVALUE}
                      cellRefs={cellRefs}
                    />
                  ))}
                </tbody>
              </Table>
            </Box>
            {hasMissingRequired && (
              <Box sx={{ mb: 1 }}>
                <Button
                  variant="soft"
                  color="danger"
                  onClick={scrollToFirstMissing}
                  sx={{ fontWeight: 600 }}
                >
                  {` ${missingCount} ${t('components.userCsvImportComponent.missingrequiredcount')}`}
                </Button>
              </Box>
            )}
            <ButtonGroup variant="outlined" sx={{ mt: 2 }}>
              <Button
                color="danger"
                onClick={() => setStep('select')}
                disabled={importing}
              >
                {t('components.userCsvImportComponent.backbutton') ?? 'Zurück'}
              </Button>
              <Button color="danger" onClick={handleReset} disabled={importing}>
                {t('components.userCsvImportComponent.resetbutton')}
              </Button>
              <Button
                color="success"
                disabled={importing || hasMissingRequired}
                loading={importing}
                onClick={handleImport}
              >
                {t('components.userCsvImportComponent.importbutton')}
              </Button>
            </ButtonGroup>
          </>
        )}
      </Box>
    </Card>
  );
};

import React from 'react';

const TableRowMemo = React.memo(function TableRowMemo({
  row,
  rowIdx,
  csvHeader,
  columnWidths,
  requiredFields,
  handleCellChange,
  NOVALUE,
  cellRefs,
}: {
  row: CsvRow;
  rowIdx: number;
  csvHeader: string[];
  columnWidths: Record<string, number>;
  requiredFields: string[];
  handleCellChange: (rowIdx: number, col: string, value: string) => void;
  NOVALUE: string;
  cellRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
}) {
  return (
    <tr>
      {csvHeader.map((col) => (
        <td
          key={col}
          style={{
            minWidth: columnWidths[col],
            width: columnWidths[col],
            maxWidth: columnWidths[col],
          }}
        >
          <Input
            value={row[col] === NOVALUE ? '' : row[col]}
            color={requiredFields.includes(col) && row[col] === NOVALUE ? 'danger' : 'neutral'}
            placeholder={row[col] === NOVALUE ? NOVALUE : ''}
            onChange={(e) => handleCellChange(rowIdx, col, e.target.value)}
            sx={{
              width: '100%',
              minWidth: columnWidths[col] - 16,
              maxWidth: columnWidths[col] - 16,
              ...(requiredFields.includes(col) && row[col] === NOVALUE
                ? {
                    borderColor: '#d32f2f',
                    color: '#d32f2f',
                    background: '#fff0f0',
                  }
                : {}),
            }}
            inputRef={(el: HTMLInputElement | null) => {
              cellRefs.current[`${rowIdx}-${col}`] = el;
            }}
            inputProps={{
              style: {
                width: '100%',
                minWidth: columnWidths[col] - 32,
                maxWidth: columnWidths[col] - 32,
              },
            }}
          />
        </td>
      ))}
    </tr>
  );
});

export default UserCsvImportComponent;