interface OpeningLine {
  eco?: string;
  name: string;
  moves: string[];
  fen?: string;
  variations?: { [key: string]: string[] };
}

let openingsData: OpeningLine[] = [];

async function fetchOpenings() {
  try {
    const files = ['a', 'b', 'c', 'd', 'e'];
    const openings: OpeningLine[] = [];

    for (const file of files) {
      const response = await fetch(`https://raw.githubusercontent.com/lichess-org/chess-openings/master/${file}.tsv`);
      const text = await response.text();
      
      // Traiter chaque ligne du fichier TSV
      const lines = text.split('\n').filter(line => line.trim());
      for (const line of lines) {
        const [eco, name, pgn, , epd] = line.split('\t');
        if (eco && name && pgn) {
          const moves = pgn.split(' ').filter(move => !move.includes('.'));
          openings.push({
            eco,
            name,
            moves,
            fen: epd
          });
        }
      }
    }

    openingsData = openings;
    console.log('Openings loaded:', openingsData.length);
  } catch (error) {
    console.error('Error loading openings:', error);
  }
}

// Charger les ouvertures au démarrage
fetchOpenings();

function normalizeMoves(moves: string[]): string[] {
  return moves.map(move => {
    // Supprimer les symboles d'échec et de prise
    move = move.replace(/[+#x]/g, '');
    // Normaliser la casse des pièces
    move = move.replace(/[RNBQK]/g, match => match.toUpperCase());
    return move;
  });
}

function compareMoveLists(played: string[], reference: string[]): boolean {
  const normalizedPlayed = normalizeMoves(played);
  const normalizedReference = normalizeMoves(reference);

  // Vérifier si les premiers coups correspondent
  return normalizedReference.every((move, index) => {
    if (!normalizedPlayed[index]) return false;
    return normalizedPlayed[index].includes(move);
  });
}

export function identifyOpening(moves: string[]): { name: string; eco?: string; variation?: string } {
  if (!openingsData.length) {
    return { name: "Chargement des ouvertures..." };
  }

  let bestMatch: OpeningLine | null = null;
  let maxMatchingMoves = 0;

  for (const opening of openingsData) {
    if (compareMoveLists(moves, opening.moves)) {
      const matchingMoves = Math.min(moves.length, opening.moves.length);
      if (matchingMoves > maxMatchingMoves) {
        maxMatchingMoves = matchingMoves;
        bestMatch = opening;
      }
    }
  }

  if (bestMatch) {
    return {
      name: bestMatch.name,
      eco: bestMatch.eco
    };
  }

  return {
    name: "Position inconnue"
  };
} 