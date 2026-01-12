import React, { useState, useEffect } from 'react';
import { GolfHole, RoundPlayer, RoundScore } from '../types';
import { calculateScore, getStrokesReceived } from '../utils/calculations';
import { ChevronDown, Trash2, Minus } from 'lucide-react';
import { HoleInOneModal } from './HoleInOneModal';
import { CongratulationsModal } from './CongratulationsModal';

interface HoleCardProps {
  hole: GolfHole;
  players: RoundPlayer[];
  scores: Record<string, RoundScore | undefined>;
  numHoles: 9 | 18;
  allHoles: GolfHole[];
  readonly?: boolean;
  groupCode?: string | null;
  onScoreChange: (playerId: string, score: any) => void;
}

export const HoleCard: React.FC<HoleCardProps> = ({
  hole,
  players,
  scores,
  numHoles,
  allHoles,
  readonly = false,
  groupCode = null,
  onScoreChange,
}) => {
  const isDivend = groupCode === 'DIVEND';
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [firstDigit, setFirstDigit] = useState<number | null>(null);
  const [pendingPlayerId, setPendingPlayerId] = useState<string | null>(null);
  const [showHoleInOneModal, setShowHoleInOneModal] = useState(false);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [congratsPlayerName, setCongratsPlayerName] = useState('');
  const [pendingNoPasoRojas, setPendingNoPasoRojas] = useState<Record<string, boolean>>({});

  // Debug: log players when they change
  useEffect(() => {
    console.log('🎯 HoleCard: Players prop received:', players.map(p => ({ name: p.name, playing_handicap: p.playing_handicap })));
  }, [players]);

  const handleToggleExpanded = (playerId: string, isCurrentlyExpanded: boolean) => {
    if (readonly) return;

    if (isCurrentlyExpanded) {
      // Intentando cerrar el desplegable
      if (firstDigit === 1 && pendingPlayerId === playerId) {
        // Hay un "1" pendiente, mostrar modal de confirmación
        setShowHoleInOneModal(true);
        return;
      }
      // No hay dígito pendiente, cerrar normalmente
      setExpandedPlayerId(null);
      setFirstDigit(null);
      setPendingPlayerId(null);
      setPendingNoPasoRojas(prev => {
        const newState = { ...prev };
        delete newState[playerId];
        return newState;
      });
    } else {
      // Abriendo el desplegable
      setExpandedPlayerId(playerId);
      setFirstDigit(null);
      setPendingPlayerId(null);
    }
  };

  const handleNumberClick = (playerId: string, num: number, player: RoundPlayer) => {
    if (firstDigit === 1 && pendingPlayerId === playerId) {
      // Ya hay un "1" marcado, construir número de dos dígitos
      const twoDigitNumber = 10 + num;
      const newScore = calculateScore(twoDigitNumber, player.playing_handicap, {
        par: hole.par,
        strokeIndex: hole.stroke_index,
      }, numHoles, allHoles);
      if (pendingNoPasoRojas[playerId]) {
        newScore.no_paso_rojas = true;
      }
      newScore.abandoned = false;
      onScoreChange(playerId, newScore);
      setExpandedPlayerId(null);
      setFirstDigit(null);
      setPendingPlayerId(null);
      setPendingNoPasoRojas(prev => {
        const newState = { ...prev };
        delete newState[playerId];
        return newState;
      });
    } else if (num === 1) {
      // Marcando el 1, esperar segundo dígito
      setFirstDigit(1);
      setPendingPlayerId(playerId);
    } else {
      // Cualquier otro número, registrar y cerrar
      const newScore = calculateScore(num, player.playing_handicap, {
        par: hole.par,
        strokeIndex: hole.stroke_index,
      }, numHoles, allHoles);
      if (pendingNoPasoRojas[playerId]) {
        newScore.no_paso_rojas = true;
      }
      newScore.abandoned = false;
      onScoreChange(playerId, newScore);
      setExpandedPlayerId(null);
      setFirstDigit(null);
      setPendingPlayerId(null);
      setPendingNoPasoRojas(prev => {
        const newState = { ...prev };
        delete newState[playerId];
        return newState;
      });
    }
  };

  const handleConfirmHoleInOne = () => {
    if (pendingPlayerId) {
      const player = players.find(p => p.id === pendingPlayerId);
      if (player) {
        const newScore = calculateScore(1, player.playing_handicap, {
          par: hole.par,
          strokeIndex: hole.stroke_index,
        }, numHoles, allHoles);
        if (pendingNoPasoRojas[pendingPlayerId]) {
          newScore.no_paso_rojas = true;
        }
        newScore.abandoned = false;
        onScoreChange(pendingPlayerId, newScore);
        setCongratsPlayerName(player.name);
        setShowCongratulationsModal(true);
      }
    }
    setShowHoleInOneModal(false);
    setExpandedPlayerId(null);
    setFirstDigit(null);
    setPendingPlayerId(null);
    setPendingNoPasoRojas(prev => {
      const newState = { ...prev };
      if (pendingPlayerId) delete newState[pendingPlayerId];
      return newState;
    });
  };

  const handleCancelHoleInOne = () => {
    setShowHoleInOneModal(false);
    // Mantener el desplegable abierto y resetear el primer dígito
    setFirstDigit(null);
  };

  const getScoreColor = (points: number): string => {
    if (points >= 3) return 'bg-green-100 border-green-500';
    if (points === 2) return 'bg-red-100 border-red-500';
    if (points === 1) return 'bg-yellow-100 border-yellow-500';
    return 'bg-blue-100 border-blue-500';
  };

  const getPointsText = (points: number): string => {
    if (points >= 5) return `${points}+`;
    return points.toString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border-2 border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Hoyo {hole.hole_number}</h3>
            <div className="flex gap-4 mt-1 text-emerald-100">
              <span className="font-semibold">Par {hole.par}</span>
              <span>HCP {hole.stroke_index}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {players.map((player) => {
          const score = scores[player.id];
          const isExpanded = expandedPlayerId === player.id;

          return (
            <div key={player.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => handleToggleExpanded(player.id, isExpanded)}
                disabled={readonly}
                className="w-full bg-gray-50 hover:bg-gray-100 disabled:cursor-not-allowed p-4 flex items-center justify-between transition-colors"
              >
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-800">{player.name}</p>
                  <p className="text-sm text-gray-600">HCP Juego: {player.playing_handicap}</p>
                </div>

                {score ? (
                  score.abandoned ? (
                    <div className="text-gray-400 font-semibold text-2xl">-</div>
                  ) : (
                    <div className={`px-4 py-2 rounded-lg border-2 font-bold text-lg ${getScoreColor(score.stableford_points)}`}>
                      {getPointsText(score.stableford_points)} pts
                    </div>
                  )
                ) : (
                  <div className="text-gray-400 font-semibold">-</div>
                )}

                <ChevronDown
                  size={20}
                  className={`ml-2 text-gray-600 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isExpanded && (() => {
                const allStrokeIndexes = allHoles.map(h => h.stroke_index);
                const strokesReceived = getStrokesReceived(
                  player.playing_handicap,
                  hole.stroke_index,
                  numHoles,
                  allStrokeIndexes
                );

                return (
                  <div className="bg-gray-50 border-t border-gray-200 p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        {firstDigit === 1 && pendingPlayerId === player.id ? (
                          <span className="text-emerald-600">Selecciona el segundo dígito (1 + ?)</span>
                        ) : (
                          'Número de Golpes'
                        )}
                      </label>

                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleNumberClick(player.id, num, player)}
                            className={`h-14 rounded-lg font-bold text-xl transition-colors shadow-md active:scale-95 ${
                              firstDigit === 1 && pendingPlayerId === player.id
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {firstDigit === 1 && pendingPlayerId === player.id ? `1${num}` : num}
                          </button>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const newScore = calculateScore(10, player.playing_handicap, {
                              par: hole.par,
                              strokeIndex: hole.stroke_index,
                            }, numHoles, allHoles);
                            if (pendingNoPasoRojas[player.id]) {
                              newScore.no_paso_rojas = true;
                            }
                            newScore.abandoned = false;
                            onScoreChange(player.id, newScore);
                            setExpandedPlayerId(null);
                            setFirstDigit(null);
                            setPendingPlayerId(null);
                            setPendingNoPasoRojas(prev => {
                              const newState = { ...prev };
                              delete newState[player.id];
                              return newState;
                            });
                          }}
                          className="h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xl transition-colors shadow-md active:scale-95"
                        >
                          10
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const isQuickPlay = groupCode === null;
                            if (isQuickPlay) {
                              const newScore = {
                                gross_strokes: 0,
                                strokes_received: 0,
                                net_strokes: 0,
                                stableford_points: 0,
                                no_paso_rojas: false,
                                abandoned: true,
                              };
                              onScoreChange(player.id, newScore);
                            } else {
                              const maxStrokes = hole.par + strokesReceived + 3;
                              const newScore = calculateScore(maxStrokes, player.playing_handicap, {
                                par: hole.par,
                                strokeIndex: hole.stroke_index,
                              }, numHoles, allHoles);
                              if (pendingNoPasoRojas[player.id]) {
                                newScore.no_paso_rojas = true;
                              }
                              onScoreChange(player.id, { ...newScore, stableford_points: 0, abandoned: false });
                            }
                            setExpandedPlayerId(null);
                            setFirstDigit(null);
                            setPendingPlayerId(null);
                            setPendingNoPasoRojas(prev => {
                              const newState = { ...prev };
                              delete newState[player.id];
                              return newState;
                            });
                          }}
                          className="h-14 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition-colors shadow-md active:scale-95 flex items-center justify-center"
                        >
                          <Minus size={24} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onScoreChange(player.id, null);
                            setExpandedPlayerId(null);
                            setFirstDigit(null);
                            setPendingPlayerId(null);
                            setPendingNoPasoRojas(prev => {
                              const newState = { ...prev };
                              delete newState[player.id];
                              return newState;
                            });
                          }}
                          className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors shadow-md active:scale-95 flex items-center justify-center"
                        >
                          <Trash2 size={24} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border-2 border-gray-300">
                      <div className="grid grid-cols-4 gap-3 text-center">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Golpes Recibidos</p>
                          <p className="text-xl font-bold text-blue-700">{strokesReceived}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Golpes Brutos</p>
                          <p className="text-2xl font-bold text-gray-800">{score?.gross_strokes || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Golpes Netos</p>
                          <p className="text-xl font-bold text-emerald-700">
                            {score?.gross_strokes ? (score.gross_strokes - strokesReceived) : 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Puntos Obtenidos</p>
                          <p className="text-xl font-bold text-emerald-700">{score?.stableford_points || 0}</p>
                        </div>
                      </div>
                    </div>

                    {isDivend && (
                      <button
                        type="button"
                        onClick={() => {
                          if (score && score.gross_strokes > 0) {
                            const newNoPasoRojas = !score.no_paso_rojas;
                            const updatedScore = {
                              ...score,
                              grossStrokes: score.gross_strokes,
                              strokesReceived: strokesReceived,
                              netStrokes: score.net_strokes,
                              stablefordPoints: score.stableford_points,
                              no_paso_rojas: newNoPasoRojas,
                            };
                            onScoreChange(player.id, updatedScore);
                          } else {
                            setPendingNoPasoRojas(prev => ({
                              ...prev,
                              [player.id]: !prev[player.id]
                            }));
                          }
                        }}
                        className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                          (score?.no_paso_rojas || pendingNoPasoRojas[player.id])
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {(score?.no_paso_rojas || pendingNoPasoRojas[player.id]) ? '✓ No pasó de rojas' : 'Marcar: No pasó de rojas'}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </div>

      {showHoleInOneModal && pendingPlayerId && (
        <HoleInOneModal
          playerName={players.find(p => p.id === pendingPlayerId)?.name || ''}
          onConfirm={handleConfirmHoleInOne}
          onCancel={handleCancelHoleInOne}
        />
      )}

      {showCongratulationsModal && (
        <CongratulationsModal
          playerName={congratsPlayerName}
          onClose={() => setShowCongratulationsModal(false)}
        />
      )}
    </div>
  );
};
