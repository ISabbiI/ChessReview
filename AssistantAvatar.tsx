import React from 'react';
import { Paper, Box, Typography, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import SmartToyIcon from '@mui/icons-material/SmartToy';

interface AssistantAvatarProps {
  moveQuality: string;
  suggestion: string;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  }
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  backgroundColor: theme.palette.primary.main,
  '& .MuiSvgIcon-root': {
    width: 40,
    height: 40,
  }
}));

const AssistantAvatar: React.FC<AssistantAvatarProps> = ({ moveQuality, suggestion }) => {
  const getQualityColor = () => {
    if (moveQuality.includes('brillant')) return '#FFD700';
    if (moveQuality.includes('théorique')) return '#1976D2';
    if (moveQuality.includes('Excellent') || moveQuality.includes('parfait')) return '#4CAF50';
    if (moveQuality.includes('Bon')) return '#03A9F4';
    if (moveQuality.includes('Imprécision')) return '#FF9800';
    if (moveQuality.includes('Erreur')) return '#D32F2F';
    return 'text.primary';
  };

  return (
    <StyledPaper elevation={3}>
      <StyledAvatar>
        <SmartToyIcon />
      </StyledAvatar>
      <Box>
        <Typography variant="h6" gutterBottom>
          Évaluation du Coup
        </Typography>
        <Typography 
          variant="h5" 
          sx={{ 
            color: getQualityColor(),
            fontWeight: 'bold',
            mb: 1
          }}
        >
          {moveQuality}
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            fontStyle: 'italic',
            borderLeft: '3px solid',
            borderColor: getQualityColor(),
            pl: 2,
            py: 0.5
          }}
        >
          {suggestion}
        </Typography>
      </Box>
    </StyledPaper>
  );
};

export default AssistantAvatar; 