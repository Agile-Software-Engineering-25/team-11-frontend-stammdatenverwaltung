/* eslint-disable max-lines-per-function */
import {
  Box,
  Typography,
  CardContent,
  Sheet,
  Input,
  Button,
  Chip,
  Select,
  Option,
} from '@mui/joy';
//import { Card } from '@agile-software/shared-components';
import { useState, useEffect, useMemo } from 'react';
import {
  getCardsForRoles,
  updateUserData,
  deleteUserById,
} from '../../utils/showuserdatafunctions';
import { useTranslation } from 'react-i18next';
import { Card, Modal as SharedModal } from '@agile-software/shared-components';
import type { UserType } from '@/utils/showuserdatafunctions';
import { inferRolesFromUser } from '@/utils/showuserdatafunctions';
import { persondataclass, roleFieldConfigs } from '@/utils/userdataclass';

interface CardField {
  key: string;
  label: string;
}

interface CardType {
  key: string;
  title: string;
  fields: CardField[];
}

const UserDataCardComponent = ({
  user,
  onUserUpdate,
  onClose,
  onSaveSuccess,
  onShowMessage,
}: {
  user: UserType | null;
  onUserUpdate?: () => void;
  onClose?: () => void;
  onSaveSuccess?: (userId: number) => void;
  onShowMessage?: (type: 'success' | 'error', text: string) => void;
}) => {
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [, forceUpdate] = useState(0);

  // Rollen aus Daten ableiten und für Card-Generierung verwenden
  const rolesForCards = user ? inferRolesFromUser(user) : [];
  const cards: CardType[] = user ? getCardsForRoles(rolesForCards) : [];
  const [activeCard, setActiveCard] = useState<string>(
    cards[0]?.key ?? 'basis'
  );

  // Feld-Definitions-Map (page1 + rollenspezifische Felder)
  const fieldDefsMap = useMemo(() => {
    const map: Record<string, unknown> = {};
    (persondataclass ?? []).forEach((f: unknown) => {
      map[f.name] = f;
    });
    rolesForCards.forEach((role) => {
      const cfg = (roleFieldConfigs as Record<string, unknown[]>)[role];
      if (Array.isArray(cfg)) {
        cfg.forEach((f) => {
          map[f.name] = f;
        });
      }
    });
    return map;
  }, [rolesForCards]);

  useEffect(() => {
    if (!user) return;
    // setze aktive Karte (bei Benutzerwechsel auf erste Karte zurück) und editMode zurücksetzen
    setActiveCard(cards[0]?.key ?? 'basis');
    setEditMode(false);

    // Sammle einmalig alle Feldkeys aller Cards und fülle die globale Edit-Map
    const allKeys = Array.from(
      new Set(cards.flatMap((c) => c.fields.map((f) => f.key)))
    );
    const fullValues: Record<string, string> = {};
    allKeys.forEach((k) => {
      fullValues[k] =
        (user as unknown)[k] ?? (user.details ? user.details[k] : '') ?? '';
    });
    setInputValues(fullValues);
    // nur neu ausführen, wenn sich der User ändert oder sich die Anzahl der Cards ändert
  }, [user, cards.length]);

  if (!user) return null;

  const currentCard = cards.find((card) => card.key === activeCard);

  // (entfernt) -- inputValues werden jetzt global für alle Cards verwaltet

  const handleInputChange =
    (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValues((prev) => ({
        ...prev,
        [key]: e.target.value,
      }));
    };

  const handleEdit = () => setEditMode(true);

  const handleSave = () => {
    console.debug('UserDataCardComponent: handleSave START', {
      userId: user?.id,
      editMode,
      inputValues,
    });

    // Sammle alle Keys aller Cards
    const allKeys = Array.from(
      new Set(cards.flatMap((c) => c.fields.map((f) => f.key)))
    );

    // Felddefinitionen
    const page1 = persondataclass ?? [];
    const roleFields = rolesForCards.flatMap(
      (role) => (roleFieldConfigs as Record<string, any[]>)[role] ?? []
    );

    console.debug('UserDataCardComponent: field defs', {
      page1: page1.map((f: any) => f.name),
      roleFields: roleFields.map((f: any) => f.name),
      allKeys,
    });

    // Erzeuge Diff: nur geänderte Felder in payload übernehmen
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    const payload: Record<string, unknown> = {};
    const topLevelFixed = ['firstname', 'lastname', 'email', 'roles'];

    allKeys.forEach((k) => {
      const after = inputValues[k] ?? '';
      const before =
        (user as Record<string, unknown>)[k] ??
        (user.details ? user.details[k] : undefined) ??
        '';

      const beforeStr =
        before === undefined || before === null ? '' : String(before);
      const afterStr =
        after === undefined || after === null ? '' : String(after);

      if (beforeStr !== afterStr) {
        changes[k] = { from: before, to: after };

        // Typkonvertierung für number-Felder falls definiert
        const roleDef = roleFields.find((f) => f.name === k);
        const page1Def = page1.find((f) => f.name === k);
        if (
          (roleDef && roleDef.type === 'number') ||
          (page1Def && page1Def.type === 'number')
        ) {
          const n = Number(after);
          payload[k] = Number.isNaN(n) ? after : n;
        } else {
          payload[k] = after;
        }
      }
    });

    if (Object.keys(payload).length === 0) {
      console.debug(
        'UserDataCardComponent: no changes detected, nothing to save'
      );
      setEditMode(false);
      return;
    }

    // Debug: Änderungen und finales Payload
    console.debug('UserDataCardComponent: detected changes to save', changes);
    console.debug(
      'UserDataCardComponent: calling updateUserData with payload',
      payload
    );

    const result = updateUserData(String(user.id), payload);
    console.debug('UserDataCardComponent: updateUserData result', { result });

    if (result) {
      setEditMode(false);
      forceUpdate((n) => n + 1);
      if (onUserUpdate) onUserUpdate();
      if (onShowMessage)
        onShowMessage('success', t('components.userDataTable.successupdate'));
      if (onSaveSuccess) onSaveSuccess(user.id);
      // Card schließen zuletzt
      if (onClose) onClose();
    } else {
      if (onShowMessage)
        onShowMessage('error', t('components.userDataTable.errorupdate'));
    }
  };

  const handleCancel = () => {
    // Abbrechen: stelle alle Werte aus dem User-Objekt wieder her (alle Cards)
    if (user) {
      const allKeys = Array.from(
        new Set(cards.flatMap((c) => c.fields.map((f) => f.key)))
      );
      const fullValues: Record<string, string> = {};
      allKeys.forEach((k) => {
        fullValues[k] =
          (user as unknown)[k] ?? (user.details ? user.details[k] : '') ?? '';
      });
      setInputValues(fullValues);
    }
    setEditMode(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    const result = deleteUserById(String(user.id));
    setShowDeleteDialog(false);
    if (result) {
      if (onUserUpdate) onUserUpdate();
      if (onShowMessage)
        onShowMessage('success', t('components.userDataTable.successdelete'));
      if (onClose) onClose();
    } else {
      if (onShowMessage)
        onShowMessage('error', t('components.userDataTable.errordelete'));
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
  };

  return (
    <Sheet
      variant="outlined"
      sx={{
        mt: 0,
        mb: 2,
        p: 1,
        borderRadius: 6,
        boxShadow: 'xs',
        position: 'relative',
      }}
    >
      {/* Bearbeiten/Speichern/Löschen/Abbrechen Buttons oben rechts */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 1,
        }}
      >
        {!editMode ? (
          <>
            <Button size="sm" color="primary" onClick={handleEdit}>
              {t('components.userDataTable.edit')}
            </Button>
            <Button size="sm" color="danger" onClick={handleDelete}>
              {t('components.userDataTable.delete')}
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" color="success" onClick={handleSave}>
              {t('components.userDataTable.save')}
            </Button>
            <Button size="sm" color="danger" onClick={handleCancel}>
              {t('components.userDataTable.cancel')}
            </Button>
          </>
        )}
      </Box>

      {/* Bestätigungsdialog für Löschen mit Shared Modal */}
      <SharedModal
        header={t('components.userDataTable.deleteuserdialogtitle')}
        open={showDeleteDialog}
        setOpen={setShowDeleteDialog}
      >
        <Box>
          <Typography level="body-md" sx={{ mb: 2 }}>
            {t('components.userDataTable.deleteuserdialogcontent')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button color="danger" onClick={confirmDelete}>
              {t('components.userDataTable.delete')}
            </Button>
            <Button onClick={cancelDelete}>
              {t('components.userDataTable.cancel')}
            </Button>
          </Box>
        </Box>
      </SharedModal>

      <Typography level="h4" sx={{ mb: 1 }}>
        {t('components.userDataTable.detailedview')}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mb: 1,
        }}
      >
        {/* Buttons und Gruppen-Icon zusammen, links neben den Cards */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {cards.map((card) => (
            <Button
              key={card.key}
              size="sm"
              variant={activeCard === card.key ? 'solid' : 'outlined'}
              color={activeCard === card.key ? 'primary' : 'neutral'}
              onClick={() => {
                console.debug('UserDataCardComponent: switchCard clicked', {
                  cardKey: card.key,
                  inputValues,
                });
                setActiveCard(card.key);
              }}
            >
              {card.title}
            </Button>
          ))}

          {/* Nur ein Icon für die Gruppe (nicht für die Rolle) direkt neben den Buttons */}
          {(() => {
            const role = Array.isArray(user.roles) ? user.roles[0] : user.roles;
            if (!role) return null;
            return (
              <Chip
                key={`role-${role}`}
                size="sm"
                variant="soft"
                color="neutral"
                startDecorator={
                  <Box component="span" sx={{ mr: 0.5 }}>
                    👥
                  </Box>
                }
                sx={{ height: 26, px: 1 }}
                aria-label={`Rolle: ${role}`}
              >
                {role}
              </Chip>
            );
          })()}
        </Box>
      </Box>
      {currentCard && (
        <Card>
          <Typography level="h4" sx={{ mb: 1, fontSize: 16, fontWeight: 700 }}>
            {currentCard.title}
          </Typography>
          {/* Hinweis auf Basis-Card im Edit-Modus */}
          {currentCard.key === 'basis' && editMode && (
            <Typography level="body-xs" sx={{ mb: 1, color: 'neutral.500' }}>
              {t('components.userDataTable.editreadonlyinfo')}
            </Typography>
          )}
          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' },
                gap: 0.5,
                alignItems: 'start',
              }}
            >
              {currentCard.fields.map((field) => (
                <Box
                  key={field.key}
                  sx={{ display: 'flex', flexDirection: 'column', mb: 1 }}
                >
                  <Typography level="body-sm" sx={{ mb: 0.5 }}>
                    {field.label}
                  </Typography>
                  {(() => {
                    // readonly for name/email fields
                    const readonlyKeys = ['firstname', 'lastname', 'email'];
                    const def = fieldDefsMap[field.key];
                    const isReadonly = readonlyKeys.includes(field.key);

                    // render select if field definition says so
                    if (
                      def &&
                      def.type === 'select' &&
                      Array.isArray(def.options)
                    ) {
                      return (
                        <Select
                          value={inputValues[field.key] ?? ''}
                          disabled={isReadonly || !editMode}
                          onChange={(_: unknown, val: string | null) =>
                            setInputValues((prev) => ({
                              ...prev,
                              [field.key]: val ?? '',
                            }))
                          }
                          sx={{
                            mt: 0,
                            mb: 0,
                            width: '100%',
                          }}
                        >
                          <Option value="">{/* blank option */}</Option>
                          {def.options.map((opt: unknown) => (
                            <Option key={opt.value} value={opt.value}>
                              {opt.label ?? opt.value}
                            </Option>
                          ))}
                        </Select>
                      );
                    }

                    // default: text input (readOnly if name/email or not editMode)
                    return (
                      <Input
                        value={inputValues[field.key] ?? ''}
                        disabled={isReadonly || !editMode}
                        onChange={handleInputChange(field.key)}
                        sx={{
                          mt: 0,
                          mb: 0,
                          '& .Mui-disabled': {
                            color: '#000',
                          },
                          '& input:disabled': {
                            color: '#000',
                          },
                        }}
                      />
                    );
                  })()}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Sheet>
  );
};

export default UserDataCardComponent;
