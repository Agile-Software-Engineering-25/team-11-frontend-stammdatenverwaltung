/* eslint-disable max-lines-per-function */
import { Box, Typography, CardContent, Sheet, Input, Button } from '@mui/joy';
//import { Card } from '@agile-software/shared-components';
import { useState, useEffect } from 'react';
import {
  getCardsForRoles,
  updateUserData,
  deleteUserById,
} from '../../utils/showuserdatafunctions';
import { useTranslation } from 'react-i18next';
import { Card, Modal as SharedModal } from '@agile-software/shared-components';

interface CardField {
  key: string;
  label: string;
}

interface CardType {
  key: string;
  title: string;
  fields: CardField[];
}

interface UserType {
  id: number;
  roles: string[];
  details?: Record<string, string>;
  [key: string]: any;
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

  const cards: CardType[] = user ? getCardsForRoles(user.roles) : [];
  const [activeCard, setActiveCard] = useState<string>(
    cards[0]?.key ?? 'basis'
  );

  useEffect(() => {
    if (!user) return;
    setActiveCard(cards[0]?.key ?? 'basis');
    setInputValues({});
    setEditMode(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cards.length]);

  if (!user) return null;

  const currentCard = cards.find((card) => card.key === activeCard);

  useEffect(() => {
    if (currentCard && user && !editMode) {
      const newValues: Record<string, string> = {};
      currentCard.fields.forEach((field) => {
        newValues[field.key] =
          user[field.key] ??
          (user.details ? user.details[field.key] : '') ??
          '';
      });
      setInputValues(newValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCard, user, editMode]);

  const handleInputChange =
    (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValues((prev) => ({
        ...prev,
        [key]: e.target.value,
      }));
    };

  const handleEdit = () => setEditMode(true);

  const handleSave = () => {
    const result = updateUserData(user.id, inputValues);
    if (result) {
      setEditMode(false);
      forceUpdate((n) => n + 1);
      if (onUserUpdate) onUserUpdate();
      if (onShowMessage)
        onShowMessage('success', t('components.userDataTable.successupdate'));
      if (onSaveSuccess) onSaveSuccess(user.id);
    } else {
      if (onShowMessage)
        onShowMessage('error', t('components.userDataTable.errorupdate'));
      if (onClose) onClose();
    }
  };

  const handleCancel = () => {
    if (currentCard && user) {
      const newValues: Record<string, string> = {};
      currentCard.fields.forEach((field) => {
        newValues[field.key] =
          user[field.key] ??
          (user.details ? user.details[field.key] : '') ??
          '';
      });
      setInputValues(newValues);
    }
    setEditMode(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    const result = deleteUserById(user.id);
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
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        {cards.map((card) => (
          <Button
            key={card.key}
            size="sm"
            variant={activeCard === card.key ? 'solid' : 'outlined'}
            color={activeCard === card.key ? 'primary' : 'neutral'}
            onClick={() => setActiveCard(card.key)}
          >
            {card.title}
          </Button>
        ))}
      </Box>
      {currentCard && (
        <Card>
          <Typography level="h4" sx={{ mb: 1, fontSize: 16, fontWeight: 700 }}>
            {currentCard.title}
          </Typography>
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
                  <Input
                    value={inputValues[field.key] ?? ''}
                    disabled={!editMode}
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
