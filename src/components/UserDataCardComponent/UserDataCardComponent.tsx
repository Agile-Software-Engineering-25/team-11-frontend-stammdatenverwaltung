/* eslint-disable max-lines-per-function */
import { Box, Typography, Card, CardContent, Sheet, Button } from '@mui/joy';
import { useState, useEffect } from 'react';
import { getCardsForRoles } from '../../utils/showuserdatafunctions';

const UserDataCardComponent = ({ user }: { user: any }) => {
  if (!user) return null;
  const cards = getCardsForRoles(user.roles);
  const [activeCard, setActiveCard] = useState<string>(
    cards[0]?.key ?? 'basis'
  );

  useEffect(() => {
    setActiveCard(cards[0]?.key ?? 'basis');
  }, [user, cards.length]);

  const currentCard = cards.find((card) => card.key === activeCard);

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
      }}
    >
      <Typography level="h5" sx={{ mb: 1, fontSize: 18, fontWeight: 700 }}>
        Detailansicht
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
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: 1,
                alignItems: 'start',
              }}
            >
              {currentCard.fields.map((field) => (
                <Box key={field.key} sx={{ mb: 0.5 }}>
                  <Typography
                    level="body2"
                    sx={{ fontWeight: 700, display: 'inline', fontSize: 13 }}
                  >
                    {field.label}:
                  </Typography>{' '}
                  <Typography
                    level="body2"
                    sx={{ display: 'inline', fontSize: 13 }}
                  >
                    {user[field.key] ?? user.details?.[field.key] ?? '-'}
                  </Typography>
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
