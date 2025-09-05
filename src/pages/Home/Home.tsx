import { Box, Typography, Modal, Button, ButtonGroup  } from '@mui/joy';
import LanguageSelectorComponent from '@components/LanguageSelectorComponent/LanguageSelectorComponent';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import Card from '@agile-software/shared-components/src/components/Card/Card';
import React, { useState } from 'react';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [popupStep, setPopupStep] = useState(1);

  const handleOpen = () => {
    setPopupStep(1);
    setOpen(true);
  };

  const handleNext = () => setPopupStep((step) => step + 1);
  const handleBack = () => setPopupStep((step) => step - 1);

  return (
    <Box sx={{ padding: 2, maxWidth: 700, mx: 'auto' }}>
      <Typography>{t('pages.home.title')}</Typography>
      <LanguageSelectorComponent />
      <Button onClick={handleOpen}>{t('pages.home.popup.openbutton')}</Button>
      <Modal open={open} onClose={() => setOpen(false)}
        sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        }}
      >
        <Card
          title={popupStep === 1 ? t('pages.home.popup.firststep') : t('pages.home.popup.secondstep')}
          subtitle={popupStep === 1 ? t('pages.home.popup.popuptext') : t('pages.home.popup.popuptext')}
        >
          {popupStep === 1 ? (
            <>
            <ButtonGroup>
              <Button onClick={() => setOpen(false)}>{t('pages.home.popup.closebutton')}</Button>
              <Button onClick={handleNext}>{t('pages.home.popup.nextbutton')}</Button>
            </ButtonGroup>
            </>
          ) : (
            <>
            <ButtonGroup>
              <Button onClick={handleBack} sx={{ mr: 1 }}>{t('pages.home.popup.backbutton')}</Button>
              <Button onClick={() => setOpen(false)}>{t('pages.home.popup.closebutton')}</Button>
              <Button onClick={() => setOpen(false)}>{t('pages.home.popup.finishbutton')}</Button>
            </ButtonGroup>
            </>
          )}
        </Card>
      </Modal>
    </Box>
  );
};

export default Home;
