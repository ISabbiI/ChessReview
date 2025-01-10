import React from 'react';
import { Paper, Box, Typography, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import TipIcon from '@mui/icons-material/TipsAndUpdates';

interface MoveAnalysisProps {
  moveQuality: string;
  suggestion: string;
  bestMove?: string;
  evaluation?: number;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  }
}));

const QualityIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const MoveAnalysis: React.FC<MoveAnalysisProps> = ({ moveQuality, suggestion, bestMove, evaluation }) => {
  const shouldShowSuggestion = moveQuality.includes('Imprécision') || moveQuality.includes('Erreur');
  
  const getBestMove = () => {
    if (bestMove) return bestMove;
    const match = suggestion.match(/Meilleur coup : (.+)$/);
    return match ? match[1] : '';
  };

  return (
    <StyledPaper elevation={3}>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TipIcon />
        Analyse des Alternatives
      </Typography>
      
      {shouldShowSuggestion && getBestMove() && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" color="primary" gutterBottom>
            Meilleur coup possible :
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              p: 1.5,
              borderRadius: 1,
              fontWeight: 'medium',
              letterSpacing: '0.5px'
            }}
          >
            {getBestMove()}
          </Typography>
        </Box>
      )}

      {evaluation !== undefined && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Évaluation de la position :
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1,
            color: evaluation > 0 ? 'success.main' : 'error.main',
            fontWeight: 'bold'
          }}>
            <Typography>
              {evaluation > 0 ? '+' : ''}{(evaluation / 100).toFixed(1)}
            </Typography>
          </Box>
        </Box>
      )}

      {moveQuality.includes('Erreur') && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          bgcolor: 'error.light', 
          borderRadius: 1,
          color: 'error.dark'
        }}>
          <Typography variant="subtitle2" gutterBottom>
            Points clés à retenir :
          </Typography>
          <Typography variant="body2">
            • Évitez cette ligne de jeu
            <br />
            • Considérez les menaces adverses
            <br />
            • Prenez plus de temps pour analyser
          </Typography>
        </Box>
      )}
    </StyledPaper>
  );
};

export default MoveAnalysis; 