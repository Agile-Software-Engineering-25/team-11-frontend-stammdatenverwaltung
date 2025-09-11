/* eslint-disable max-lines-per-function */
import {
  Box,
  Typography,
  Card,
  CardContent,
  Sheet,
  DialogActions,
  DialogContent,
  DialogTitle,
  Modal,
  ModalDialog,
} from '@mui/joy';
import Input from '@agile-software/shared-components/src/components/Input/Input';
import Button from '@agile-software/shared-components/src/components/Button/Button';
import { useState, useEffect } from 'react';
import {
  getCardsForRoles,
  updateUserData,
  deleteUserById,
} from '../../utils/showuserdatafunctions';
import { useTranslation } from 'react-i18next';

const UserDataCardComponent = ({
  user,
  onUserUpdate,
  onClose,
  onSaveSuccess,
}: {
  user: any;
  onUserUpdate?: () => void;
  onClose?: () => void;
  onSaveSuccess?: (userId: number) => void;
}) => {
  if (!user) return null;
  const cards = getCardsForRoles(user.roles);
  const [activeCard, setActiveCard] = useState<string>(
    cards[0]?.key ?? 'basis'
  );
  const { t } = useTranslation();
  const [editMode, setEditMode] = useState(false);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    setActiveCard(cards[0]?.key ?? 'basis');
    setInputValues({});
    setEditMode(false);
  }, [user, cards.length]);

  const currentCard = cards.find((card) => card.key === activeCard);

  useEffect(() => {
    if (currentCard && user && !editMode) {
      const newValues: Record<string, string> = {};
      currentCard.fields.forEach((field) => {
        newValues[field.key] =
          user[field.key] ?? user.details?.[field.key] ?? '';
      });
      setInputValues(newValues);
    }
    // eslint-disable-next-line
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
      // Card direkt wieder öffnen (selectedUserId bleibt gesetzt)
      if (onSaveSuccess) onSaveSuccess(user.id);
    } else {
      // Bei Fehler Card schließen
      if (onClose) onClose();
    }
  };

  const handleCancel = () => {
    // Werte zurücksetzen
    if (currentCard && user) {
      const newValues: Record<string, string> = {};
      currentCard.fields.forEach((field) => {
        newValues[field.key] =
          user[field.key] ?? user.details?.[field.key] ?? '';
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
      if (onClose) onClose();
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
        background: '#f9f9f9',
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

      {/* Bestätigungsdialog für Löschen */}
      <Modal open={showDeleteDialog} onClose={cancelDelete}>
        <ModalDialog>
          <DialogTitle>
            {t('components.userDataTable.deleteuserdialogtitle')}
          </DialogTitle>
          <DialogContent>
            {t('components.userDataTable.deleteuserdialogcontent')}
          </DialogContent>
          <DialogActions>
            <Button color="danger" onClick={confirmDelete}>
              {t('components.userDataTable.delete')}
            </Button>
            <Button onClick={cancelDelete}>
              {t('components.userDataTable.cancel')}
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      <Typography level="h5" sx={{ mb: 1, fontSize: 18, fontWeight: 700 }}>
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
        <Card
          sx={{
            minWidth: 200,
            boxShadow: 'xs',
            borderRadius: 4,
            p: 1,
            m: 0,
            background: '#fff',
          }}
        >
          <Typography
            level="h6"
            sx={{ mb: 0.5, fontSize: 16, fontWeight: 700 }}
          >
            {currentCard.title}
          </Typography>
          <CardContent sx={{ p: 0 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
                gap: 1.5,
                alignItems: 'start',
              }}
            >
              {currentCard.fields.map((field) => (
                <Input
                  key={field.key}
                  label={field.label}
                  value={inputValues[field.key] ?? ''}
                  disabled={!editMode}
                  onChange={handleInputChange(field.key)}
                  sx={{
                    mb: 1,
                    '& .Mui-disabled': {
                      color: '#000',
                    },
                    '& input:disabled': {
                      color: '#000',
                    },
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Sheet>
  );
};

export default UserDataCardComponent;
