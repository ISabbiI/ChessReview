import React, { useState, useCallback } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { 
  Box, 
  Paper, 
  Container, 
  Grid, 
  Typography, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Card,
  CardContent,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  Fade,
  CircularProgress,
  ButtonBase,
  TextField,
  InputAdornment,
  Snackbar,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  Undo as UndoIcon,
  Redo as RedoIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  EmojiObjects as TipIcon,
  Assessment as AssessmentIcon,
  AutoStories as BookIcon,
  EmojiEvents as ExcellentIcon,
  CheckCircle as GoodIcon,
  Warning as ImprecisionIcon,
  Error as ErrorIcon,
  Star as BrilliantIcon,
  ContentPaste as PasteIcon
} from '@mui/icons-material';
import AssistantAvatar from './components/AssistantAvatar.tsx';
import MoveAnalysis from './components/MoveAnalysis.tsx';
import { identifyOpening } from './openings.ts';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  backgroundColor: '#ffffff',
  borderRadius: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 12px 48px rgba(0, 0, 0, 0.12)',
  }
}));

const EvaluationBar = styled(Box)(({ theme }) => ({
  width: 28,
  height: '400px',
  backgroundColor: '#f0f0f0',
  position: 'relative',
  marginLeft: theme.spacing(3),
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
}));

const EvaluationFill = styled(Box)<{ value: number }>(({ theme, value }) => ({
  position: 'absolute',
  bottom: 0,
  width: '100%',
  height: `${Math.min(Math.max((50 + (value > 1000 ? 100 : value / 10)), 0), 100)}%`,
  background: value >= 0 
    ? 'linear-gradient(180deg, #4CAF50 0%, #81C784 100%)' 
    : 'linear-gradient(180deg, #f44336 0%, #e57373 100%)',
  transition: 'height 0.3s ease-in-out, background 0.3s ease-in-out',
}));

const OpeningCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
  color: 'white',
  borderRadius: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(33, 150, 243, 0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 48px rgba(33, 150, 243, 0.25)',
  }
}));

const EcoChip = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: theme.spacing(0.5, 1.5),
  borderRadius: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(8px)',
  marginLeft: theme.spacing(1.5),
  fontSize: '0.875rem',
  fontWeight: 500,
  letterSpacing: '0.5px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  }
}));

const ControlPanel = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(2),
  borderRadius: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  '.MuiIconButton-root': {
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      transform: 'translateY(-2px)',
    }
  }
}));

const MoveHistoryCard = styled(Card)(({ theme }) => ({
  maxHeight: '300px',
  overflow: 'auto',
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  backgroundColor: '#ffffff',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: '#f1f1f1',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#888',
    borderRadius: '4px',
    '&:hover': {
      background: '#666',
    }
  }
}));

const ImportField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#ffffff',
    borderRadius: theme.spacing(2),
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    },
    '&.Mui-focused': {
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
    }
  }
}));

const API_URL = 'http://localhost:3001';

interface MoveHistoryItem {
  move: string;
  quality: string;
  suggestion: string;
}

const GameOverDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    background: 'linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)',
    padding: theme.spacing(3),
  },
  '& .winner-text': {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
    animation: 'fadeIn 0.5s ease-in-out',
  },
  '& .result-details': {
    fontSize: '1.1rem',
    textAlign: 'center',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(3),
  },
  '@keyframes fadeIn': {
    '0%': {
      opacity: 0,
      transform: 'translateY(-20px)',
    },
    '100%': {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

function App() {
  const [game] = useState(new Chess());
  const [moveQuality, setMoveQuality] = useState<string>('');
  const [suggestion, setSuggestion] = useState<string>('');
  const [position, setPosition] = useState(game.fen());
  const [evaluation, setEvaluation] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<{ winner: string; details: string; additionalInfo?: string }>({ winner: '', details: '' });
  const [error, setError] = useState<string | null>(null);
  const [currentOpening, setCurrentOpening] = useState<{ 
    name: string; 
    eco?: string; 
    variation?: string 
  }>({ name: 'Position de départ' });
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]);
  const [selectedMove, setSelectedMove] = useState<number>(-1);
  const [importValue, setImportValue] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<{
    bestMove: string | undefined;
    score: number;
    depth: number;
  } | null>(null);

  const checkGameStatus = useCallback(() => {
    if (game.isGameOver()) {
      let result = '';
      let winner = '';
      let details = '';
      
      if (game.isCheckmate()) {
        // Déterminer le dernier coup joué
        const moves = game.history({ verbose: true });
        const lastMove = moves[moves.length - 1];
        
        // Le joueur qui a fait le dernier coup est le gagnant
        const winningColor = lastMove.color === 'w' ? 'Les Blancs' : 'Les Noirs';
        winner = winningColor;
        
        // Créer un message détaillé
        const pieceName = {
          'p': 'pion',
          'n': 'cavalier',
          'b': 'fou',
          'r': 'tour',
          'q': 'dame',
          'k': 'roi'
        }[lastMove.piece] || 'pièce';
        
        details = `Mat en ${moves.length} coups ! ${winningColor} gagnent avec un magnifique échec et mat par ${pieceName} en ${lastMove.to.toUpperCase()}.`;
        result = `${winner} gagnent par échec et mat !`;
      } else if (game.isDraw()) {
        winner = 'Partie Nulle';
        if (game.isStalemate()) {
          details = 'Pat ! Le roi n\'est pas en échec mais aucun coup légal n\'est possible.';
          result = 'Pat ! La partie est nulle.';
        } else if (game.isThreefoldRepetition()) {
          details = 'La même position s\'est répétée trois fois.';
          result = 'Nulle par triple répétition.';
        } else if (game.isInsufficientMaterial()) {
          details = 'Il ne reste pas assez de pièces pour forcer un mat.';
          result = 'Nulle par matériel insuffisant.';
        } else {
          details = 'La partie se termine par un match nul.';
          result = 'La partie est nulle.';
        }
      }
      
      setGameResult({ 
        winner, 
        details: result,
        additionalInfo: details 
      });
      setShowGameOver(true);
    }
  }, [game]);

  const analyzePosition = useCallback(async (fen: string) => {
    try {
      setError(null);
      
      // Vérifier d'abord si la position est un échec et mat
      const tempGame = new Chess(fen);
      if (tempGame.isCheckmate()) {
        // Si c'est un échec et mat, définir une évaluation maximale selon le tour
        const score = tempGame.turn() === 'w' ? -10000 : 10000;
        setEvaluation(score);
        return {
          score,
          bestMove: null,
          depth: 0,
          pv: []
        };
      }

      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fen }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Server error:', data);
        throw new Error(data.error || 'Erreur serveur');
      }

      if (typeof data.score === 'number') {
        setEvaluation(data.score);
        
        // Convertir le coup UCI en notation SAN
        let bestMoveSAN = '';
        if (data.bestMove && typeof data.bestMove === 'string' && data.bestMove.length >= 4) {
          const moveObj = {
            from: data.bestMove.substring(0, 2),
            to: data.bestMove.substring(2, 4),
            promotion: data.bestMove.length === 5 ? data.bestMove[4] : undefined
          };
          
          try {
            const possibleMoves = tempGame.moves({ verbose: true });
            const matchingMove = possibleMoves.find(m => 
              m.from === moveObj.from && 
              m.to === moveObj.to && 
              (!moveObj.promotion || m.promotion === moveObj.promotion)
            );
            
            if (matchingMove) {
              bestMoveSAN = matchingMove.san;
            }
          } catch (moveError) {
            console.error('Error finding matching move:', moveError);
          }
        }

        setLastAnalysis({
          bestMove: bestMoveSAN || undefined,
          score: data.score,
          depth: data.depth || 0
        });
        
        if (bestMoveSAN) {
          setSuggestion(`Meilleur coup : ${bestMoveSAN}`);
        }

        return { 
          score: data.score, 
          bestMove: bestMoveSAN,
          depth: data.depth,
          pv: data.info?.pv
        };
      }

      throw new Error('Réponse invalide du serveur');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.error('Analysis error:', error);
      setError(errorMessage);
      setMoveQuality('Erreur d\'analyse');
      setSuggestion('');
      return null;
    }
  }, []);

  const analyzeMoveQuality = useCallback(async (move: any) => {
    if (isAnalyzing) return;
    
    try {
      setIsAnalyzing(true);
      setMoveQuality('Analyse en cours...');
      
      // Analyse avant le coup
      const positionBeforeMove = game.fen();
      const beforeMove = await analyzePosition(positionBeforeMove);
      if (!beforeMove) return;

      // Jouer le coup temporairement pour l'analyse
      const tempGame = new Chess(positionBeforeMove);
      const result = tempGame.move(move);
      if (!result) return;
      
      // Analyse après le coup
      const afterMove = await analyzePosition(tempGame.fen());
      if (!afterMove) return;

      // Identifier l'ouverture après le coup
      const moves = game.history();
      moves.push(move.san);
      const opening = identifyOpening(moves);
      setCurrentOpening(opening);

      // Calculer la différence de score
      const scoreDiff = Math.abs(afterMove.score - beforeMove.score);

      // Obtenir le numéro du coup actuel et la phase de la partie
      const moveNumber = Math.floor(game.moveNumber() / 2) + 1;
      const isOpeningPhase = moveNumber <= 10;
      const isMiddleOpeningPhase = moveNumber <= 15;
      
      // Vérifier si le coup est un mouvement de roi
      const isKingMove = move.piece === 'k';
      const isCastling = move.san.includes('O-O'); // Vérifier si c'est un roque
      
      // Nouvelle logique d'évaluation basée sur les critères
      let quality = '';
      let suggestionText = '';
      
      // Si c'est un mouvement de roi en début de partie (sauf roque), c'est une erreur
      if (isKingMove && !isCastling && (isOpeningPhase || isMiddleOpeningPhase)) {
        quality = 'Erreur';
        suggestionText = beforeMove.bestMove 
          ? `${beforeMove.bestMove} était beaucoup plus fort. Évitez de bouger le roi en début de partie !` 
          : 'Évitez de bouger le roi en début de partie sans raison !';
      } else {
        // Détection des coups brillants
        const isBrilliant = beforeMove.score < -100 && afterMove.score > 100;

        if (isBrilliant) {
          quality = 'Coup brillant !!';
          suggestionText = 'Un coup exceptionnel qui change complètement la partie !';
        } else if (scoreDiff < 50 && !isKingMove) {
          quality = 'Excellent coup !';
          suggestionText = 'Votre coup est très bon.';
        } else if (scoreDiff < 150 && !isKingMove) {
          quality = 'Bon coup';
          suggestionText = 'Un coup solide.';
        } else if (scoreDiff < 300) {
          quality = 'Imprécision';
          suggestionText = beforeMove.bestMove ? `${beforeMove.bestMove} était plus précis.` : 'Il y avait un meilleur coup.';
        } else {
          quality = 'Erreur';
          suggestionText = beforeMove.bestMove ? `${beforeMove.bestMove} était beaucoup plus fort.` : 'Il y avait un coup beaucoup plus fort.';
        }
      }

      // Appliquer le coup sur le jeu principal
      game.move(move);
      setPosition(game.fen());
      
      setMoveQuality(quality);
      setSuggestion(suggestionText);
      setMoveHistory(prev => [...prev, { move: move.san, quality, suggestion: suggestionText }]);

      checkGameStatus();
    } catch (error) {
      console.error('Error analyzing move quality:', error);
      setMoveQuality('Erreur d\'analyse');
      setSuggestion('');
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, game, analyzePosition, checkGameStatus]);

  const makeMove = useCallback((move: any) => {
    try {
      // Vérifier si le coup est légal sans l'appliquer
      const tempGame = new Chess(game.fen());
      const result = tempGame.move(move);
      if (result) {
        analyzeMoveQuality(result);
        return true;
      }
    } catch (e) {
      console.error('Error making move:', e);
      return false;
    }
    return false;
  }, [game, analyzeMoveQuality]);

  const handleCloseGameOver = () => {
    setShowGameOver(false);
  };

  const handleUndo = () => {
    const history = game.history();
    if (history.length > 0) {
      const lastMove = moveHistory[moveHistory.length - 1];
      game.undo();
      setPosition(game.fen());
      setMoveHistory(prev => prev.slice(0, -1)); // Supprimer le dernier coup de l'historique
      setMoveQuality('');
      setSuggestion('');
    }
  };

  const handleRedo = () => {
    // Implémenter la logique de redo
  };

  const handleReset = () => {
    game.reset();
    setPosition(game.fen());
    setMoveHistory([]);
    setCurrentOpening({ name: 'Position de départ' });
    setEvaluation(0);
  };

  const handleImport = () => {
    try {
      // Vérifier si c'est un FEN valide
      const tempGame = new Chess();
      try {
        tempGame.load(importValue);
        // Si on arrive ici, le FEN est valide
        game.load(importValue);
        setPosition(game.fen());
        setImportValue('');
        setShowSuccess(true);
        setMoveHistory([]);
        setCurrentOpening({ name: 'Position importée' });
        return;
      } catch (fenError) {
        // Si ce n'est pas un FEN valide, essayer PGN
        try {
          game.loadPgn(importValue);
          // Si on arrive ici, le PGN est valide
          setPosition(game.fen());
          setImportValue('');
          setShowSuccess(true);
          // Recréer l'historique des coups
          const moves = game.history();
          setMoveHistory(moves.map(move => ({
            move,
            quality: 'Position importée',
            suggestion: ''
          })));
          return;
        } catch (pgnError) {
          setImportError('Format non valide. Utilisez FEN ou PGN.');
        }
      }
    } catch (error) {
      setImportError('Erreur lors de l\'importation. Vérifiez le format.');
    }
  };

  const getMoveIcon = (quality: string) => {
    switch (quality) {
      case 'Coup brillant !!':
        return <BrilliantIcon sx={{ color: '#FFD700' }} fontSize="small" />; // Couleur or
      case 'Coup théorique principal':
      case 'Coup théorique':
      case 'Variante théorique':
        return <BookIcon color="primary" fontSize="small" />;
      case 'Coup parfait !':
      case 'Excellent coup !':
        return <ExcellentIcon color="success" fontSize="small" />;
      case 'Bon coup':
        return <GoodIcon color="info" fontSize="small" />;
      case 'Imprécision':
        return <ImprecisionIcon color="warning" fontSize="small" />;
      case 'Erreur':
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return null;
    }
  };

  const getCustomSquareStyles = useCallback(() => {
    if (moveHistory.length === 0) return {};
    
    const lastMove = game.history({ verbose: true }).pop();
    if (!lastMove) return {};

    const lastMoveQuality = moveHistory[moveHistory.length - 1].quality;
    
    return {
      [lastMove.to]: {
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '0',
          right: '0',
          width: '24px',
          height: '24px',
          backgroundImage: lastMoveQuality.includes('brillant') ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23FFD700\' d=\'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z\'/%3E%3C/svg%3E")' :
                    lastMoveQuality.includes('théorique') ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%231976D2\' d=\'M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z\'/%3E%3C/svg%3E")' :
                    lastMoveQuality.includes('Excellent') || lastMoveQuality.includes('parfait') ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%234CAF50\' d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\'/%3E%3C/svg%3E")' :
                    lastMoveQuality.includes('Bon') ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%2303A9F4\' d=\'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z\'/%3E%3C/svg%3E")' :
                    lastMoveQuality.includes('Imprécision') ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23FF9800\' d=\'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z\'/%3E%3C/svg%3E")' :
                    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\'%3E%3Cpath fill=\'%23D50000\' d=\'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z\'/%3E%3C/svg%3E")',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          zIndex: 10,
          pointerEvents: 'none',
        }
      }
    };
  }, [moveHistory, game]);

  return (
    <Container maxWidth="xl" sx={{ 
      py: 4, 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7eb 100%)',
    }}>
      <Grid container spacing={3}>
        {error && (
          <Grid item xs={12}>
            <Fade in={!!error}>
              <Paper 
                sx={{ 
                  p: 2, 
                  mb: 2, 
                  backgroundColor: 'error.light',
                  color: 'error.contrastText',
                  borderRadius: 2,
                }}
              >
                <Typography>{error}</Typography>
              </Paper>
            </Fade>
          </Grid>
        )}
        
        <Grid item xs={12}>
          <OpeningCard>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <TimelineIcon />
                <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {currentOpening.name}
                  {currentOpening.eco && (
                    <EcoChip>
                      ECO: {currentOpening.eco}
                    </EcoChip>
                  )}
                  {currentOpening.variation && (
                    <Typography component="span" sx={{ ml: 1, opacity: 0.8 }}>
                      - {currentOpening.variation}
                    </Typography>
                  )}
                </Typography>
              </Box>
            </CardContent>
          </OpeningCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <ControlPanel>
            <Tooltip title="Annuler le dernier coup">
              <IconButton onClick={handleUndo} disabled={game.history().length === 0}>
                <UndoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refaire le coup">
              <IconButton onClick={handleRedo}>
                <RedoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Nouvelle partie">
              <IconButton onClick={handleReset}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </ControlPanel>

          <Box sx={{ mb: 2 }}>
            <ImportField
              fullWidth
              placeholder="Collez un code FEN ou PGN ici pour importer une partie"
              value={importValue}
              onChange={(e) => {
                setImportValue(e.target.value);
                setImportError(null);
              }}
              error={!!importError}
              helperText={importError}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      variant="contained"
                      disabled={!importValue}
                      onClick={handleImport}
                      startIcon={<PasteIcon />}
                      sx={{ borderRadius: '12px' }}
                    >
                      Importer
                    </Button>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <StyledPaper elevation={3}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: '100%', maxWidth: 600 }}>
                <Chessboard 
                  position={position}
                  onPieceDrop={(source, target) => {
                    return makeMove({
                      from: source,
                      to: target,
                      promotion: 'q',
                    });
                  }}
                  customSquareStyles={getCustomSquareStyles()}
                  customBoardStyle={{
                    borderRadius: '16px',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(0, 0, 0, 0.05)',
                  }}
                />
              </Box>
              <EvaluationBar>
                <EvaluationFill value={evaluation} />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    position: 'absolute', 
                    top: -20, 
                    width: '100%', 
                    textAlign: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  {evaluation > 0 ? '+' : ''}{(evaluation / 100).toFixed(1)}
                </Typography>
              </EvaluationBar>
            </Box>
          </StyledPaper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ position: 'sticky', top: 16 }}>
            <AssistantAvatar 
              moveQuality={moveQuality} 
              suggestion={suggestion} 
            />
            <MoveAnalysis 
              moveQuality={moveQuality} 
              suggestion={suggestion}
              bestMove={lastAnalysis?.bestMove}
              evaluation={evaluation}
            />
            
            <MoveHistoryCard>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon />
                  Historique des coups
                </Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {moveHistory.map((historyItem, index) => (
                    <ButtonBase
                      key={index}
                      onClick={() => setSelectedMove(index)}
                      sx={{ 
                        width: '100%',
                        textAlign: 'left',
                        p: 1,
                        borderRadius: 1,
                        '&:hover': { backgroundColor: 'action.hover' },
                        backgroundColor: selectedMove === index ? 'action.selected' : 'inherit',
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getMoveIcon(historyItem.quality)}
                          <Typography>
                            {`${Math.floor(index / 2) + 1}. ${historyItem.move}`}
                          </Typography>
                        </Box>
                        {index === selectedMove && (
                          <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                            {historyItem.suggestion}
                          </Typography>
                        )}
                      </Box>
                    </ButtonBase>
                  ))}
                </List>
              </CardContent>
            </MoveHistoryCard>
          </Box>
        </Grid>
      </Grid>

      <GameOverDialog 
        open={showGameOver} 
        onClose={handleCloseGameOver}
      >
        <DialogTitle>
          <Typography variant="h4" align="center" gutterBottom>
            Partie Terminée
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography className="winner-text" sx={{
              fontSize: '2rem',
              color: gameResult.winner.includes('Blancs') ? '#2196F3' : 
                     gameResult.winner.includes('Noirs') ? '#424242' : 
                     'primary.main'
            }}>
              {gameResult.winner}
            </Typography>
            <Typography className="result-details">
              {gameResult.details}
            </Typography>
            {gameResult.additionalInfo && (
              <Typography sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'rgba(0, 0, 0, 0.03)', 
                borderRadius: 2,
                fontStyle: 'italic'
              }}>
                {gameResult.additionalInfo}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', gap: 2, pt: 2 }}>
          <Button 
            onClick={handleReset} 
            variant="contained" 
            color="primary"
            size="large"
            startIcon={<RefreshIcon />}
            sx={{ 
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 20px rgba(0, 0, 0, 0.15)',
              }
            }}
          >
            Nouvelle partie
          </Button>
          <Button 
            onClick={handleCloseGameOver}
            variant="outlined"
            size="large"
            sx={{ 
              borderRadius: '12px',
              px: 4,
              py: 1.5,
            }}
          >
            Fermer
          </Button>
        </DialogActions>
      </GameOverDialog>

      {isAnalyzing && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: 'background.paper',
            p: 1,
            borderRadius: 2,
            boxShadow: 2,
          }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2">Analyse en cours...</Typography>
        </Box>
      )}

      <Snackbar 
        open={showSuccess} 
        autoHideDuration={3000} 
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Position importée avec succès !
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;