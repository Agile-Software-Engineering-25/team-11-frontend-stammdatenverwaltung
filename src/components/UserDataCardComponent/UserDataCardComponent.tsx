/* eslint-disable max-lines-per-function */
import {
  Box,
  Typography,
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
import Card from '@agile-software/shared-components/src/components/Card/Card';
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
  onShowMessage, 
}: {
  user: any;
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
  const cards = user ? getCardsForRoles(user.roles) : [];
  const [activeCard, setActiveCard] = useState<string>(
    cards[0]?.key ?? 'basis'
  );

  useEffect(() => {
    if (!user) return;
    setActiveCard(cards[0]?.key ?? 'basis');
    setInputValues({});
    setEditMode(false);
  }, [user, cards.length]);

  if (!user) return null;

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
        onShowMessage('success', t('pages.home.successupdate'));
      if (onSaveSuccess) onSaveSuccess(user.id);
    } else {
      if (onShowMessage) onShowMessage('error', t('pages.home.errorupdate'));
      if (onClose) onClose();
    }
  };

  const handleCancel = () => {
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
      if (onShowMessage)
        onShowMessage('success', t('pages.home.successdelete'));
      if (onClose) onClose();
    } else {
      if (onShowMessage) onShowMessage('error', t('pages.home.errordelete'));
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
        <Card
          sx={{
            minWidth: 200,
            boxShadow: 'xs',
            borderRadius: 4,
            p: 1,
            m: 0,
          }}
        >
          <Typography level="h4" sx={{ mb: -1, fontSize: 16, fontWeight: 700 }}>
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
                <Input
                  key={field.key}
                  label={field.label}
                  value={inputValues[field.key] ?? ''}
                  disabled={!editMode}
                  onChange={handleInputChange(field.key)}
                  sx={{
                    mt: 0, // vorher -1 oder größer, jetzt 0
                    mb: 0, // falls vorhanden, auf 0 setzen
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
