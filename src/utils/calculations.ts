const STANDARD_SLOPE = 125;

export const calculatePlayingHandicap = (exactHandicap: number, slope: number = STANDARD_SLOPE): number => {
  return Math.round(exactHandicap * (slope / 113));
};

export const getStrokesReceived = (playingHandicap: number, strokeIndex: number, numHoles: number = 18, holeStrokeIndexes?: number[]): number => {
  if (playingHandicap <= 0) return 0;

  if (numHoles === 9) {
    // For 9 holes, normalize the stroke index to 1-9 based on the 9 holes being played
    let normalizedStrokeIndex = strokeIndex;
    if (holeStrokeIndexes && holeStrokeIndexes.length === 9) {
      // Sort the 9 hole stroke indexes to determine difficulty ranking
      const sortedIndexes = [...holeStrokeIndexes].sort((a, b) => Number(a) - Number(b));

      // Find this hole's position in the sorted array (1-based index)
      normalizedStrokeIndex = sortedIndexes.findIndex(si => Number(si) === Number(strokeIndex)) + 1;

      // If not found, use the original stroke index
      if (normalizedStrokeIndex === 0) {
        normalizedStrokeIndex = strokeIndex;
      }
    }

    const fullStrokes = Math.floor(playingHandicap / 9);
    const remainder = playingHandicap % 9;
    const result = normalizedStrokeIndex <= remainder ? fullStrokes + 1 : fullStrokes;

    return result;
  }

  // For 18 holes, handicap is already adjusted for 18 holes
  const fullStrokes = Math.floor(playingHandicap / 18);
  const remainder = playingHandicap % 18;

  if (strokeIndex <= remainder) {
    return fullStrokes + 1;
  }
  return fullStrokes;
};

export const calculateNetStrokes = (grossStrokes: number, strokesReceived: number): number => {
  return grossStrokes - strokesReceived;
};

export const calculateStablefordPoints = (netStrokes: number, par: number): number => {
  const difference = netStrokes - par;

  if (difference >= 2) {
    return 0;
  } else if (difference === 1) {
    return 1;
  } else if (difference === 0) {
    return 2;
  } else if (difference === -1) {
    return 3;
  } else if (difference === -2) {
    return 4;
  } else {
    return 5;
  }
};

export interface CalculatedScore {
  grossStrokes: number;
  strokesReceived: number;
  netStrokes: number;
  stablefordPoints: number;
  no_paso_rojas?: boolean;
  abandoned?: boolean;
}

export const calculateScore = (
  grossStrokes: number,
  playingHandicap: number,
  hole: { par: number; strokeIndex: number },
  numHoles: number = 18,
  allHoles?: { strokeIndex: number }[]
): CalculatedScore => {
  // For normalization, we need ALL strokeIndexes from the course (all 18 holes)
  // This is used to properly rank and normalize strokeIndex positions
  const allStrokeIndexes = allHoles?.map(h => h.strokeIndex);

  const strokesReceived = getStrokesReceived(playingHandicap, hole.strokeIndex, numHoles, allStrokeIndexes);
  const netStrokes = calculateNetStrokes(grossStrokes, strokesReceived);
  const stablefordPoints = calculateStablefordPoints(netStrokes, hole.par);

  return {
    grossStrokes,
    strokesReceived,
    netStrokes,
    stablefordPoints,
    abandoned: false,
  };
};

export const getTotalStablefordPoints = (scores: Record<number, CalculatedScore>): number => {
  return Object.values(scores).reduce((sum, score) => sum + score.stablefordPoints, 0);
};

export const calculateScoreToPar = (
  totalGrossStrokes: number,
  coursePar: number,
  playerHandicap: number,
  numHoles: number
): { value: number; display: string } => {
  const personalPar = coursePar + playerHandicap;
  const scoreToPar = totalGrossStrokes - personalPar;

  let display: string;
  if (scoreToPar === 0) {
    display = 'PAR';
  } else if (scoreToPar > 0) {
    display = `+${scoreToPar}`;
  } else {
    display = `${scoreToPar}`;
  }

  return { value: scoreToPar, display };
};
