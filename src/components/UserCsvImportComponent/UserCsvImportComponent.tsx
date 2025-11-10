/* eslint-disable max-lines-per-function */
import { Card } from '@agile-software/shared-components';
import {
  Box,
  ButtonGroup,
  Select,
  Option,
  Typography,
  Table,
  Input,
  Button,
  Checkbox,
} from '@mui/joy';
import { useTranslation } from 'react-i18next';
import { useRef, useState, useMemo, type SetStateAction } from 'react';
import {
  getAvailableRoles,
  getPage1DynamicFields,
  dynamicInputFields,
  createUser,
} from '@/utils/createuserfunction';
import {
  generateCsvTemplateForRole,
  downloadCSV,
  isCsvHeaderCompatible,
  canonicalLabel, // <-- neu
} from '@/utils/csvimportexport';
import { Dropzone } from '@agile-software/shared-components';

type CsvRow = { [key: string]: string };

const NOVALUE = '#novalue';

function getTextWidth(text: string, font = '16px Arial') {
  if (typeof document === 'undefined') return 200;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 200;
  context.font = font;
  return context.measureText(text).width;
}

function getColumnWidths(
  header: string[],
  rows: CsvRow[]
): Record<string, number> {
  const widths: Record<string, number> = {};
  header.forEach((col) => {
    let maxWidth = getTextWidth(col, '16px Arial');
    rows.forEach((row) => {
      const val = row[col] ?? '';
      maxWidth = Math.max(maxWidth, getTextWidth(val, '16px Arial'));
    });
    widths[col] = Math.max(Math.ceil(maxWidth) + 48, 80);
  });
  return widths;
}

// --- Hauptkomponente ---
const UserCsvImportComponent = ({
  onClose,
  onShowMessage,
  onFailedCsv,
}: {
  onClose?: () => void;
  onShowMessage?: (type: 'success' | 'error', text: string) => void;
  onFailedCsv?: (csv: string, filename: string) => void;
}) => {
  const { t, i18n } = useTranslation();

  // --- fehlende State-/Ref-Deklarationen ergänzt ---
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'select' | 'preview' | 'edit'>('select');

  const [csvRowsObj, setCsvRowsObj] = useState<Record<number, CsvRow>>({});
  const [csvHeader, setCsvHeader] = useState<string[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [headerError, setHeaderError] = useState<string | null>(null);

  const [editRows, setEditRows] = useState<number[]>([]);
  const [editRowsObj, setEditRowsObj] = useState<Record<number, CsvRow>>({});
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  const roles = getAvailableRoles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // --- Ende Ergänzungen ---

  // CSV-Template für die ausgewählte Rolle generieren (ohne Rollen-Spalte)
  const { csvString, filename } = useMemo(() => {
    if (!selectedRole) return { csvString: '', filename: '' };
    const lang =
      i18n?.language && i18n.language.toLowerCase().startsWith('en')
        ? 'en'
        : 'de';
    const csvString = generateCsvTemplateForRole(
      selectedRole,
      lang as 'de' | 'en'
    );
    const filename = `${selectedRole}_SAU_IMPORT.csv`;
    return { csvString, filename };
  }, [selectedRole, i18n]);

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

  // Optionen pro Spalten-Label (für Edit-Modus dropdowns)
  const selectOptionsMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    if (!selectedRole) return map;
    const page1 = getPage1DynamicFields();
    page1.forEach((f: unknown) => {
      if (f.type === 'select' && f.options) {
        map[f.label] = (f.options as unknown).map((o: unknown) => o.value);
      }
    });
    const roleFields = dynamicInputFields(selectedRole).fields;
    roleFields.forEach((f: unknown) => {
      if (f.type === 'select' && f.options) {
        map[f.label] = (f.options as unknown).map((o: unknown) => o.value);
      }
    });
  }, [selectedRole]);

  // Hilfsfunktion: CSV parsen (Semikolon-Delimiter, vollständiger Quote-aware Parser)
  // eslint-disable-next-line func-style
  function parseCsv(text: string, delimiter = ';'): string[][] {
    const rows: string[][] = [];
    let curRow: string[] = [];
    let curCell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (ch === '"') {
        if (inQuotes && next === '"') {
          // escaped quote
          curCell += '"';
          i++; // skip next
        } else {
          // toggle quote state
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (!inQuotes && ch === delimiter) {
        curRow.push(curCell);
        curCell = '';
        continue;
      }

      // handle CRLF / LF newlines when not in quotes
      if (!inQuotes && ch === '\r' && next === '\n') {
        curRow.push(curCell);
        rows.push(curRow);
        curRow = [];
        curCell = '';
        i++; // skip \n
        continue;
      }
      if (!inQuotes && (ch === '\n' || ch === '\r')) {
        curRow.push(curCell);
        rows.push(curRow);
        curRow = [];
        curCell = '';
        continue;
      }

      curCell += ch;
    }

    // push last cell/row
    // if any content remains or at least one empty cell expected
    if (inQuotes) {
      // unbalanced quotes — try to continue anyway
      inQuotes = false;
    }
    // push last cell
    curRow.push(curCell);
    // if last row is not empty (or there is exactly one empty row) add it
    if (curRow.length > 1 || curRow[0].trim() !== '' || rows.length === 0) {
      rows.push(curRow);
    }

    // trim whitespace from unquoted cells (quoted cells preserved already)
    return rows.map((r) => r.map((c) => c.trim()));
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
    setEditRows([]);
    setEditRowsObj({});
    setSelectedRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  /*
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };
  */

  // Hilfs: finde die Header-Zeile (suche nur bis maxSearchRows, default 200)
  function findHeaderIndex(
    rows: string[][],
    role: string,
    maxSearchRows = 200
  ): number {
    const limit = Math.min(rows.length, maxSearchRows);
    for (let i = 0; i < limit; i++) {
      const candidate = rows[i];
      // candidate ist eine Zeile (Array von Zellen) -> prüfen, ob sie als Header passt
      try {
        if (isCsvHeaderCompatible(candidate, role)) {
          return i;
        }
      } catch (e) {
        // defensive: falls isCsvHeaderCompatible unerwartet wirft, weiter machen
        // eslint-disable-next-line no-console
        console.warn('Header check error at row', i, e);
        continue;
      }
    }
    return -1;
  }

  // Weiter-Button: CSV einlesen und in Tabelle anzeigen
  const handleNext = async () => {
    setHeaderError(null);
    if (!selectedFile || !selectedRole) return;
    setImporting(true);

    try {
      const text = await selectedFile.text();
      let rows = parseCsv(text);
      if (rows.length < 1) {
        alert(t('components.userCsvImportComponent.importerrorempty'));
        return;
      }

      // suche echte Header-Zeile (Intro/Optionen/separator sind optional)
      let headerIndex = findHeaderIndex(rows, selectedRole, 200);
      if (headerIndex === -1) {
        // fallback: erste Zeile verwenden
        headerIndex = 0;
      }

      // nimm die gefundene Header-Zeile
      let header = rows[headerIndex];

      // Entferne ggf. vorhandene "Rollen"-Spalte (sprachunabhängig) aus header und allen rows
      const headerCanon = header.map(canonicalLabel);
      const roleIdx = headerCanon.findIndex((h) => h === 'role');
      if (roleIdx !== -1) {
        rows = rows.map((row) => row.filter((_, idx) => idx !== roleIdx));
        header = header.filter((_, idx) => idx !== roleIdx);
        // adjust headerIndex defensively
        if (headerIndex >= rows.length) headerIndex = 0;
      }

      // Validierung: Header jetzt gegen erwartete Felder prüfen
      if (!isCsvHeaderCompatible(header, selectedRole)) {
        setHeaderError(
          t('components.userCsvImportComponent.headerincompatible')
        );
        return;
      }

      const dataRows = rows.slice(headerIndex + 1);
      const reqFields = getRequiredFields();

      // Erzeuge Map mit erlaubten Werten für Select-Spalten (Label -> allowedValues[])
      const allowedValuesMap: Record<string, string[] | undefined> = {};
      {
        const page1Fields = getPage1DynamicFields();
        const roleFields = dynamicInputFields(selectedRole).fields;
        page1Fields.forEach((f) => {
          if (f.type === 'select' && (f as unknown).options) {
            allowedValuesMap[f.label] = (f as unknown).options.map(
              (o: unknown) => o.value
            );
          }
        });
        roleFields.forEach((f) => {
          if (f.type === 'select' && (f as unknown).options) {
            allowedValuesMap[f.label] = (f as unknown).options.map(
              (o: unknown) => o.value
            );
          }
        });
      }

      // Zeilen als Objekt (vorsichtig und robust bauen)
      const csvRowsObj: Record<number, CsvRow> = {};
      dataRows.forEach((row, idx) => {
        const obj: CsvRow = {};
        // defensive: falls row undefined oder kürzer als header -> fehlende Werte füllen
        const safeRow = Array.isArray(row) ? row : [];
        header.forEach((col, colIdx) => {
          const raw = safeRow[colIdx] ?? '';
          const allowed = allowedValuesMap[col];
          if (allowed && allowed.length > 0) {
            obj[col] = raw && allowed.includes(raw) ? raw : NOVALUE;
          } else {
            obj[col] = raw;
          }
        });
        reqFields.forEach((field) => {
          if (!obj[field] || obj[field].trim() === '') {
            obj[field] = NOVALUE;
          }
        });
        csvRowsObj[idx] = obj;
      });

      // zusätzliche Validierung: sicherstellen, dass wir mindestens eine Datenzeile haben
      if (Object.keys(csvRowsObj).length === 0) {
        setHeaderError(t('components.userCsvImportComponent.importerrorempty'));
        return;
      }

      setCsvHeader(header);
      setCsvRowsObj(csvRowsObj);
      setRequiredFields(reqFields);
      setStep('preview');

      // Spaltengrößen berechnen, defensiv
      try {
        setColumnWidths(getColumnWidths(header, Object.values(csvRowsObj)));
      } catch (err) {
        // fallback: gleiche Default-Breite für alle Spalten
        // eslint-disable-next-line no-console
        console.warn('Column width calc failed, using defaults', err);
        const fallback: Record<string, number> = {};
        header.forEach((h) => {
          fallback[h] = 140;
        });
        setColumnWidths(fallback);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Import error', err);
      setHeaderError(t('components.userCsvImportComponent.importerror'));
    } finally {
      setImporting(false);
    }
  };

  // Import-Funktion
  const handleImport = () => {
    if (!selectedRole) return;
    setImporting(true);

    // Reihenfolge der Felder für createUser (Preview-Labels)
    const allLabels = previewColumns;

    // Build mapping: for each preview label find the actual csv header label (language-independent)
    const headerCanon = csvHeader.map(canonicalLabel);
    const previewCanon = allLabels.map(canonicalLabel);
    const headerForPreview: (string | null)[] = previewCanon.map((pc) => {
      const idx = headerCanon.indexOf(pc);
      return idx >= 0 ? csvHeader[idx] : null;
    });

    // Nutzer, die nicht importiert werden konnten
    const failedRows: string[][] = [];
    let successCount = 0;

    for (const rowObj of Object.values(csvRowsObj)) {
      // Prüfe auf Pflichtfelder (verwende mapping: wenn Feld nicht in CSV vorhanden, treat as missing)
      const missing = requiredFields.some((fieldLabel) => {
        // find mapped header for this required field (preview label)
        const idx = allLabels.indexOf(fieldLabel);
        const mappedHeader = headerForPreview[idx];
        const val = mappedHeader ? rowObj[mappedHeader] : '';
        return val === NOVALUE || !val || val.trim() === '';
      });

      if (missing) {
        failedRows.push(
          allLabels.map((label, i) => {
            const mapped = headerForPreview[i];
            return mapped ? (rowObj[mapped] ?? '') : '';
          })
        );
        continue;
      }

      // Werte in der richtigen Reihenfolge für createUser (mapped)
      const userData: string[] = allLabels.map((label, i) => {
        const mapped = headerForPreview[i];
        return mapped ? (rowObj[mapped] ?? '') : '';
      });

      // Die Rolle als letztes Feld anhängen (selectedRole kommt aus UI)
      userData.push(selectedRole!);

      // createUser aufrufen
      const result = createUser(userData, selectedRole!);
      if (!result) {
        failedRows.push(
          allLabels.map((label, i) => {
            const mapped = headerForPreview[i];
            return mapped ? (rowObj[mapped] ?? '') : '';
          })
        );
      } else {
        successCount++;
      }
    }

    setImporting(false);

    if (failedRows.length > 0) {
      // Fehlerhafte Zeilen als CSV zum Download bereitstellen (nicht automatisch downloaden)
      const failedCsv = [allLabels, ...failedRows]
        .map(
          (row) =>
            row
              .map((val) =>
                typeof val === 'string' &&
                (val.includes(';') || val.includes('"') || val.includes('\n'))
                  ? `"${val.replace(/"/g, '""')}"`
                  : val
              )
              .join(';') // <-- Semikolon verwenden
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

  // Checkbox-Handler für einzelne Zeile
  const handleCheckboxChange = (
    rowIdx: number,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedRows((prev) =>
      event.target.checked
        ? [...prev, rowIdx]
        : prev.filter((idx) => idx !== rowIdx)
    );
  };

  // Checkbox-Handler für "Alle auswählen"
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedRows(Object.keys(csvRowsObj).map((idx) => Number(idx)));
    } else {
      setSelectedRows([]);
    }
  };

  // Edit-Modus öffnen
  const handleEditSelectedRows = () => {
    if (selectedRows.length > 0) {
      setEditRows(selectedRows);
      setEditRowsObj(
        Object.fromEntries(
          selectedRows.map((idx) => [idx, { ...csvRowsObj[idx] }])
        )
      );
      setStep('edit');
    }
  };

  // Mehrere Zeilen mit fehlenden Pflichtfeldern bearbeiten
  const handleEditMissingRows = () => {
    const rowsWithMissing = Array.from(
      new Set(missingRequiredCells.map((cell) => cell.row))
    );
    setEditRows(rowsWithMissing);
    setEditRowsObj(
      Object.fromEntries(
        rowsWithMissing.map((idx) => [idx, { ...csvRowsObj[idx] }])
      )
    );
    setStep('edit');
  };

  // Bearbeitung eines Feldes
  const handleEditCellChange = (rowIdx: number, col: string, value: string) => {
    setEditRowsObj((prev) => ({
      ...prev,
      [rowIdx]: {
        ...prev[rowIdx],
        [col]: value === '' && requiredFields.includes(col) ? NOVALUE : value,
      },
    }));
  };

  // Speichern der Änderungen
  const handleSaveEditRows = () => {
    setCsvRowsObj((prev) => ({
      ...prev,
      ...editRowsObj,
    }));
    setEditRows([]);
    setEditRowsObj({});
    setStep('preview');
  };

  // Abbrechen der Änderungen
  const handleCancelEditRows = () => {
    setEditRows([]);
    setEditRowsObj({});
    setStep('preview');
  };

  // Pflichtfelder prüfen für Edit-Modus
  const missingRequiredEditCells: { row: number; col: string }[] = [];
  Object.entries(editRowsObj).forEach(([rowIdx, row]) => {
    requiredFields.forEach((field) => {
      if (row[field] === NOVALUE) {
        missingRequiredEditCells.push({ row: Number(rowIdx), col: field });
      }
    });
  });

  // --- Neu: fehlende Pflichtfelder in den importierten CSV-Zeilen (Vorschau) ---
  const missingRequiredCells = useMemo(() => {
    const missing: { row: number; col: string }[] = [];
    Object.entries(csvRowsObj).forEach(([rowIdx, row]) => {
      requiredFields.forEach((field) => {
        const val = (row ?? {})[field];
        if (
          val === NOVALUE ||
          val === undefined ||
          (typeof val === 'string' && val.trim() === '')
        ) {
          missing.push({ row: Number(rowIdx), col: field });
        }
      });
    });
    return missing;
  }, [csvRowsObj, requiredFields]);

  const hasMissingRequired = missingRequiredCells.length > 0;
  // --- Ende Neu ---
  
  return (
    <Card>
      {/* Kompakter Header, sticky */}
      <Box
        sx={{
          pb: 1,
          position: 'sticky',
          top: 0,
          zIndex: 2,
        }}
      >
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
        {/* Seite 1: Auswahl */}
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
            {/* Dropzone für CSV-Upload */}
            <Box sx={{ my: 2 }}>
              <Dropzone
                types={['CSV']}
                multiple={false}
                onFileSelect={(
                  file: unknown[] | SetStateAction<File | null>
                ) => {
                  // file ist entweder File oder File[]
                  if (Array.isArray(file)) {
                    setSelectedFile(file[0] ?? null);
                  } else {
                    setSelectedFile(file);
                  }
                }}
                dragDropText={t(
                  'components.userCsvImportComponent.dropzonetext'
                )}
                browseText={t('components.userCsvImportComponent.uploadbutton')}
              />
              <Typography sx={{ mt: 1, fontSize: 16 }}>
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
                  variant="solid"
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
            <ButtonGroup variant="solid" sx={{ mt: 2 }}>
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

        {/* Seite 2: Vorschau */}
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
                    140,
                  '& th, & td': {
                    verticalAlign: 'middle',
                    padding: '6px 8px',
                  },
                  '& th': {
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  },
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        minWidth: 40,
                        width: 40,
                        maxWidth: 40,
                        textAlign: 'center',
                        padding: 0,
                      }}
                    >
                      <Checkbox
                        checked={
                          selectedRows.length ===
                            Object.keys(csvRowsObj).length &&
                          Object.keys(csvRowsObj).length > 0
                        }
                        indeterminate={
                          selectedRows.length > 0 &&
                          selectedRows.length < Object.keys(csvRowsObj).length
                        }
                        onChange={handleSelectAll}
                        size="sm"
                        sx={{ m: 0, p: 0, display: 'block' }}
                      />
                    </th>
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
                  {Object.entries(csvRowsObj).map(([rowIdxStr, row]) => {
                    const rowIdx = Number(rowIdxStr);
                    return (
                      <tr key={rowIdx}>
                        <td
                          style={{
                            minWidth: 40,
                            width: 40,
                            maxWidth: 40,
                            textAlign: 'center',
                            padding: 0,
                          }}
                        >
                          <Checkbox
                            checked={selectedRows.includes(rowIdx)}
                            onChange={(e) => handleCheckboxChange(rowIdx, e)}
                            size="sm"
                            sx={{ m: 0, p: 0, display: 'block' }}
                          />
                        </td>
                        {csvHeader.map((col) => (
                          <td
                            key={col}
                            style={{
                              minWidth: columnWidths[col],
                              width: columnWidths[col],
                              maxWidth: columnWidths[col],
                            }}
                          >
                            {((row ?? {})[col] === NOVALUE) ? (
                              <span style={{ color: '#d32f2f', fontWeight: 500 }}>{NOVALUE}</span>
                            ) : (
                              // fallback auf leeren String, damit Render nie undefined ausgibt
                              (row ?? {})[col] ?? ''
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
              <Button
                onClick={handleEditSelectedRows}
                disabled={selectedRows.length === 0}
              >
                {t('components.userCsvImportComponent.editdatabutton', {})}
              </Button>
              {hasMissingRequired && (
                <Button
                  variant="soft"
                  color="danger"
                  onClick={handleEditMissingRows}
                  sx={{ fontWeight: 600 }}
                >
                  {`${missingRequiredCells.length} ${t('components.userCsvImportComponent.missingrequiredcount')}`}
                </Button>
              )}
            </Box>
            <ButtonGroup variant="solid" sx={{ mt: 2 }}>
              <Button
                color="danger"
                onClick={() => setStep('select')}
                disabled={importing}
              >
                {t('components.userCsvImportComponent.backbutton')}
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

        {/* Seite 3: Bearbeitung ausgewählter Zeilen */}
        {step === 'edit' && (
          <>
            <Typography level="h3" sx={{ mb: 2 }}>
              {t('components.userCsvImportComponent.edituserdata')}
            </Typography>
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowX: 'auto',
                overflowY: 'auto',
                mb: 2,
                maxHeight: '45vh',
              }}
            >
              <Table
                size="lg"
                sx={{
                  minWidth:
                    Object.values(columnWidths).reduce((a, b) => a + b, 0) +
                    120,
                  '& th, & td': {
                    verticalAlign: 'middle',
                    padding: '6px 8px',
                  },
                  '& th': {
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    background: '#fff',
                  },
                }}
              >
                <thead>
                  <tr>
                    <th style={{ minWidth: 40 }}>#</th>
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
                  {editRows.map((rowIdx) => (
                    <tr key={rowIdx}>
                      <td>{rowIdx + 1}</td>
                      {csvHeader.map((col) => (
                        <td key={col}>
                          {selectOptionsMap[col] && selectOptionsMap[col].length > 0 ? (
                            <Select
                              value={
                                (editRowsObj[rowIdx] ?? {})[col] === NOVALUE
                                  ? ''
                                  : (editRowsObj[rowIdx] ?? {})[col] ?? ''
                              }
                              onChange={(_, value) =>
                                handleEditCellChange(rowIdx, col, (value as string) ?? '')
                              }
                              color={
                                requiredFields.includes(col) &&
                                (editRowsObj[rowIdx] ?? {})[col] === NOVALUE
                                  ? 'danger'
                                  : 'neutral'
                              }
                              sx={{
                                width: '100%',
                                minWidth: (columnWidths[col] ?? 120) - 16,
                                maxWidth: (columnWidths[col] ?? 320) - 16,
                                ...(requiredFields.includes(col) &&
                                (editRowsObj[rowIdx] ?? {})[col] === NOVALUE
                                  ? {
                                      borderColor: '#d32f2f',
                                      color: '#d32f2f',
                                      background: '#fff0f0',
                                    }
                                  : {}),
                              }}
                            >
                              <Option value="">--</Option>
                              {selectOptionsMap[col].map((opt) => (
                                <Option key={opt} value={opt}>
                                  {opt}
                                </Option>
                              ))}
                            </Select>
                          ) : (
                            <Input
                              value={
                                (editRowsObj[rowIdx] ?? {})[col] === NOVALUE
                                  ? ''
                                  : (editRowsObj[rowIdx] ?? {})[col]
                              }
                              color={
                                requiredFields.includes(col) &&
                                (editRowsObj[rowIdx] ?? {})[col] === NOVALUE
                                  ? 'danger'
                                  : 'neutral'
                              }
                              placeholder={
                                (editRowsObj[rowIdx] ?? {})[col] === NOVALUE ? NOVALUE : ''
                              }
                              onChange={(e) =>
                                handleEditCellChange(rowIdx, col, e.target.value)
                              }
                              sx={{
                                width: '100%',
                                minWidth: (columnWidths[col] ?? 120) - 16,
                                maxWidth: (columnWidths[col] ?? 320) - 16,
                                ...(requiredFields.includes(col) &&
                                (editRowsObj[rowIdx] ?? {})[col] === NOVALUE
                                  ? {
                                      borderColor: '#d32f2f',
                                      color: '#d32f2f',
                                      background: '#fff0f0',
                                    }
                                  : {}),
                              }}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Box>
            {missingRequiredEditCells.length > 0 && (
              <Typography color="danger" sx={{ mb: 2 }}>
                {`${missingRequiredEditCells.length}, ${t('components.userCsvImportComponent.missingrequired')}`}
              </Typography>
            )}
            <ButtonGroup variant="solid" sx={{ mt: 2 }}>
              <Button
                color="success"
                onClick={handleSaveEditRows}
                disabled={missingRequiredEditCells.length > 0}
              >
                {t('components.userCsvImportComponent.save')}
              </Button>
              <Button color="danger" onClick={handleCancelEditRows}>
                {t('components.userCsvImportComponent.cancelchanges')}
              </Button>
            </ButtonGroup>
          </>
        )}

        {headerError && (
          <Typography color="danger" sx={{ mt: 1 }}>
            {headerError}
          </Typography>
        )}
      </Box>
    </Card>
  );
};

export default UserCsvImportComponent;
