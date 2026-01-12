import React, { useState, useEffect } from 'react';
import { GolfHole, RoundPlayer, RoundScore } from '../types';
import { HoleCard } from './HoleCard';
import { ConfirmModal } from './ConfirmModal';
import { CourseChangeModal } from './CourseChangeModal';
import { CourseChangeConfirmModal } from './CourseChangeConfirmModal';
import { ScoreSymbol } from './ScoreSymbol';
import { golfService } from '../services/golfService';
import { getStrokesReceived, calculateScoreToPar } from '../utils/calculations';
import { ChevronLeft, ChevronRight, Trophy, Home, Lock, MapPin, Eye, EyeOff } from 'lucide-react';

interface ScorecardProps {
  holes: GolfHole[];
  players: RoundPlayer[];
  rounds: Array<{
    playerId: string;
    scores: Record<number, RoundScore>;
    totalStablefordPoints: number;
  }>;
  currentHole: number;
  numHoles: 9 | 18;
  roundId?: string;
  courseId?: string;
  accessCode?: string;
  hasEditAccess?: boolean;
  courseName?: string;
  groupCode?: string | null;
  onHoleChange: (holeNumber: number) => void;
  onScoreChange: (playerId: string, holeNumber: number, score: any) => void;
  onShowLeaderboard: () => void;
  onResetGame: () => void;
  onFinishRound: () => void;
  onCourseChanged?: (courseId: string, numHoles: 9 | 18, holes: GolfHole[], players?: RoundPlayer[]) => void;
}

export const Scorecard: React.FC<ScorecardProps> = ({
  holes,
  players,
  rounds,
  currentHole,
  numHoles,
  roundId,
  courseId,
  accessCode,
  hasEditAccess = true,
  courseName = '',
  groupCode = null,
  onHoleChange,
  onScoreChange,
  onShowLeaderboard,
  onResetGame,
  onFinishRound,
  onCourseChanged,
}) => {
  const isDivend = groupCode === 'DIVEND';
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);

  // Debug: log players when they change
  useEffect(() => {
    console.log('📊 Scorecard: Players prop updated:', players.map(p => ({ name: p.name, playing_handicap: p.playing_handicap })));
  }, [players]);
  const [showCourseChangeModal, setShowCourseChangeModal] = useState(false);
  const [showCourseConfirmModal, setShowCourseConfirmModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<{id: string; name: string} | null>(null);
  const [changingCourse, setChangingCourse] = useState(false);
  const [error, setError] = useState('');
  const playableHoles = holes;
  const hole = playableHoles[currentHole - 1];
  const roundsMap = new Map(rounds.map((r) => [r.playerId, r]));

  const allScoresComplete = players.every((player) => {
    const round = roundsMap.get(player.id);
    return playableHoles.every((h) => round?.scores[h.hole_number]);
  });

  const isLastHole = currentHole === playableHoles.length;

  const handleFinishWithConfirm = () => {
    setShowFinishModal(true);
  };

  const handleConfirmFinish = () => {
    setShowFinishModal(false);
    onFinishRound();
  };

  const handleSelectCourse = (course: { id: string; name: string; description: string | null }) => {
    setSelectedCourse({ id: course.id, name: course.name });
    setShowCourseChangeModal(false);
    setShowCourseConfirmModal(true);
  };

  const handleConfirmCourseChange = async (selectedHoles: 9 | 18) => {
    if (!onCourseChanged || !roundId || !selectedCourse) return;

    try {
      setChangingCourse(true);
      setError('');

      const { holes: newHoles, players: updatedPlayers } = await golfService.changeCourse(
        roundId,
        selectedCourse.id,
        selectedHoles
      );

      console.log('📊 Scorecard: Players after course change:', updatedPlayers?.map(p => ({ name: p.name, playing: p.playing_handicap })));

      onCourseChanged(selectedCourse.id, selectedHoles, newHoles, updatedPlayers);
      setShowCourseConfirmModal(false);
      setSelectedCourse(null);
    } catch (err) {
      console.error('Error changing course:', err);
      setError('Error al cambiar el campo');
    } finally {
      setChangingCourse(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-emerald-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={onResetGame}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-lg transition-colors"
              title="Volver al menú principal"
            >
              <Home size={20} />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-900 flex-1 text-center">
              Tarjeta de Puntuación
            </h1>
            <button
              onClick={onShowLeaderboard}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-colors"
            >
              <Trophy size={20} />
              <span className="hidden sm:inline">Clasificación</span>
            </button>
          </div>

          <div className="mb-4 bg-emerald-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{courseName || 'Campo de Golf'}</span>
                  {hasEditAccess && onCourseChanged && roundId && courseId && (
                    <button
                      onClick={() => setShowCourseChangeModal(true)}
                      disabled={changingCourse}
                      className="bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cambiar campo de golf"
                    >
                      <MapPin size={12} />
                      Cambiar
                    </button>
                  )}
                </div>
                <p className="text-sm text-white/90 mt-1">
                  Hoyo {currentHole} de {numHoles}
                </p>
              </div>
            </div>
          </div>

          {accessCode && hasEditAccess && (
            <div className="mb-4 bg-white border-2 border-emerald-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="text-emerald-600" size={20} />
                  <span className="text-sm font-medium text-gray-700">
                    Código de Acceso:
                  </span>
                  <code className="text-2xl font-bold text-emerald-700 tracking-[0.5em] ml-2">
                    {showAccessCode ? accessCode : <span className="text-base">••••</span>}
                  </code>
                </div>
                <button
                  onClick={() => setShowAccessCode(!showAccessCode)}
                  className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                  aria-label={showAccessCode ? 'Ocultar código' : 'Mostrar código'}
                >
                  {showAccessCode ? (
                    <EyeOff className="text-emerald-600" size={20} />
                  ) : (
                    <Eye className="text-emerald-600" size={20} />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Comparte este código con otros jugadores para que puedan ver y editar puntuaciones
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {!hasEditAccess && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Lock className="text-amber-600" size={20} />
                <span className="text-sm font-medium text-amber-900">
                  Solo lectura - No tienes permiso para editar esta partida
                </span>
              </div>
            </div>
          )}

          {hole && (
            <div className="mb-6">
              <HoleCard
                hole={hole}
                players={players}
                scores={Object.fromEntries(
                  players.map((p) => [p.id, roundsMap.get(p.id)?.scores[hole.hole_number]])
                )}
                numHoles={numHoles}
                allHoles={holes}
                readonly={!hasEditAccess}
                groupCode={groupCode}
                onScoreChange={(playerId, score) => {
                  onScoreChange(playerId, hole.hole_number, score);
                }}
              />
            </div>
          )}

          <div className="mb-6">
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-300 shadow-sm"
                  style={{ width: `${(currentHole / playableHoles.length) * 100}%` }}
                />
              </div>
              <p className="text-sm font-medium text-gray-700 mt-2 text-center">
                Hoyo {currentHole} de {playableHoles.length}
              </p>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => onHoleChange(Math.max(1, currentHole - 1))}
              disabled={currentHole === 1}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-800 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <ChevronLeft size={20} />
              Anterior
            </button>

            {isLastHole && allScoresComplete ? (
              <button
                onClick={handleFinishWithConfirm}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Trophy size={20} />
                Finalizar Partida
              </button>
            ) : (
              <button
                onClick={() => onHoleChange(Math.min(playableHoles.length, currentHole + 1))}
                disabled={currentHole === playableHoles.length}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Siguiente
                <ChevronRight size={20} />
              </button>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 mb-3">Tabla de Golpes</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-2 font-semibold text-gray-700">Jugador</th>
                    {playableHoles.map((h) => (
                      <th key={h.hole_number} className="text-center p-2 font-semibold text-gray-700 min-w-[40px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{h.hole_number}</span>
                          <span className="text-xs font-normal text-gray-500">
                            P{h.par}•H{h.stroke_index}
                          </span>
                        </div>
                      </th>
                    ))}
                    <th className="text-center p-2 font-semibold text-gray-700 bg-gray-200 min-w-[50px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Total</span>
                        <span className="text-xs font-normal text-gray-500">Brutos</span>
                      </div>
                    </th>
                    <th className="text-center p-2 font-semibold text-gray-700 bg-emerald-100 min-w-[50px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span>Total</span>
                        <span className="text-xs font-normal text-gray-500">Netos</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((player) => {
                    const round = roundsMap.get(player.id);
                    const isQuickPlay = groupCode === null;

                    const hasAbandonedScores = isQuickPlay && playableHoles.some(h => {
                      const score = round?.scores[h.hole_number];
                      return score?.abandoned;
                    });

                    const totalGrossStrokes = playableHoles.reduce((sum, h) => {
                      const score = round?.scores[h.hole_number];
                      if (isQuickPlay && score?.abandoned) return sum;
                      return sum + (score?.gross_strokes || 0);
                    }, 0);

                    const totalNetStrokes = playableHoles.reduce((sum, h) => {
                      const score = round?.scores[h.hole_number];
                      if (!score?.gross_strokes || (isQuickPlay && score?.abandoned)) return sum;

                      const allStrokeIndexes = holes.map(hole => hole.stroke_index);
                      const strokesReceived = getStrokesReceived(
                        player.playing_handicap,
                        h.stroke_index,
                        numHoles,
                        allStrokeIndexes
                      );

                      return sum + (score.gross_strokes - strokesReceived);
                    }, 0);

                    return (
                      <tr key={player.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium text-gray-800">{player.name}</td>
                        {playableHoles.map((h) => {
                          const score = round?.scores[h.hole_number];
                          const allStrokeIndexes = holes.map(hole => hole.stroke_index);
                          const strokesReceived = getStrokesReceived(
                            player.playing_handicap,
                            h.stroke_index,
                            numHoles,
                            allStrokeIndexes
                          );

                          return (
                            <td
                              key={h.hole_number}
                              className={`text-center p-2 relative ${
                                h.hole_number === currentHole ? 'bg-emerald-100 font-bold' : ''
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center gap-1">
                                {score && score.abandoned ? (
                                  <div className="w-7 h-7 flex items-center justify-center">
                                    <span className="text-gray-400 text-xl">-</span>
                                  </div>
                                ) : score ? (
                                  <div className="w-7 h-7 flex items-center justify-center">
                                    <ScoreSymbol
                                      grossStrokes={score.gross_strokes}
                                      par={h.par}
                                      strokesReceived={strokesReceived}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 flex items-center justify-center">
                                    <span className="text-gray-300">-</span>
                                  </div>
                                )}
                                <div className="flex gap-0.5 h-1 min-h-[4px]">
                                  {!score?.abandoned && strokesReceived > 0 && Array.from({ length: strokesReceived }).map((_, idx) => (
                                    <div
                                      key={idx}
                                      className="w-1 h-1 rounded-full bg-blue-500"
                                      title={`${strokesReceived} golpe${strokesReceived > 1 ? 's' : ''} recibido${strokesReceived > 1 ? 's' : ''}`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </td>
                          );
                        })}
                        <td
                          className={`text-center p-2 font-bold ${
                            hasAbandonedScores
                              ? 'text-gray-500'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                          style={hasAbandonedScores ? {
                            background: 'repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 5px, #d1d5db 5px, #d1d5db 10px)'
                          } : undefined}
                        >
                          {hasAbandonedScores ? '-' : (totalGrossStrokes > 0 ? totalGrossStrokes : '-')}
                        </td>
                        <td
                          className={`text-center p-2 font-bold ${
                            hasAbandonedScores
                              ? 'text-gray-500'
                              : 'bg-emerald-50 text-emerald-900'
                          }`}
                          style={hasAbandonedScores ? {
                            background: 'repeating-linear-gradient(45deg, #e5e7eb, #e5e7eb 5px, #d1d5db 5px, #d1d5db 10px)'
                          } : undefined}
                        >
                          {hasAbandonedScores ? '-' : (totalGrossStrokes > 0 ? totalNetStrokes : '-')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 border border-gray-300"></div>
                <span>Eagle</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-red-500 border border-gray-300"></div>
                <span>Birdie</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-300"></div>
                <span>Par</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-blue-500 border border-gray-300"></div>
                <span>Bogey</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-black border border-gray-300"></div>
                <span>Doble bogey+</span>
              </div>
            </div>

            <h3 className="font-semibold text-gray-700 mb-3 mt-6">Resumen de Puntos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {players.map((player) => {
                const round = roundsMap.get(player.id);
                const isQuickPlay = groupCode === null;

                const hasAbandonedScores = isQuickPlay && playableHoles.some(h => {
                  const score = round?.scores[h.hole_number];
                  return score?.abandoned;
                });

                const totalPoints = hasAbandonedScores ? 0 : (round?.totalStablefordPoints ?? 0);

                const totalGrossStrokes = playableHoles.reduce((sum, h) => {
                  const score = round?.scores[h.hole_number];
                  if (isQuickPlay && score?.abandoned) return sum;
                  return sum + (score?.gross_strokes || 0);
                }, 0);

                const coursePar = playableHoles.reduce((sum, h) => sum + h.par, 0);
                const scoreToPar = totalGrossStrokes > 0 && !hasAbandonedScores
                  ? calculateScoreToPar(totalGrossStrokes, coursePar, player.playing_handicap, numHoles)
                  : null;

                return (
                  <div
                    key={player.id}
                    className={`bg-gradient-to-br border-2 rounded-lg p-3 text-center ${
                      hasAbandonedScores
                        ? 'from-gray-50 to-gray-100 border-gray-300'
                        : 'from-emerald-50 to-emerald-100 border-emerald-300'
                    }`}
                  >
                    <p className="text-sm font-semibold text-gray-800 truncate">{player.name}</p>
                    {hasAbandonedScores ? (
                      <>
                        <p className="text-2xl font-bold text-gray-400">-</p>
                        <p className="text-xs text-gray-500">Abandonado</p>
                      </>
                    ) : (
                      <>
                        <p className="text-2xl font-bold text-emerald-700">{totalPoints}</p>
                        <p className="text-xs text-gray-600">Puntos Stableford</p>
                        {scoreToPar && (
                          <div className="mt-2 pt-2 border-t border-emerald-300">
                            <p className={`text-xl font-bold ${
                              scoreToPar.value === 0 ? 'text-gray-700' :
                              scoreToPar.value < 0 ? 'text-green-600' :
                              'text-red-600'
                            }`}>
                              {scoreToPar.display}
                            </p>
                            <p className="text-xs text-gray-600">vs Par Personal</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {isDivend && (
              <>
                <h3 className="font-semibold text-gray-700 mb-3 mt-6">No pasó de rojas</h3>
                <div className="space-y-3">
                  {players.map((player) => {
                    const round = roundsMap.get(player.id);
                    const noPasoRojasHoles: number[] = [];

                    playableHoles.forEach((h) => {
                      const score = round?.scores[h.hole_number];
                      if (score?.no_paso_rojas) {
                        noPasoRojasHoles.push(h.hole_number);
                      }
                    });

                    const noPasoRojasCount = noPasoRojasHoles.length;
                    const holesList = noPasoRojasHoles.length > 0
                      ? `Hoyo: ${noPasoRojasHoles.join(', ')}`
                      : 'Ninguno';

                    return (
                      <div
                        key={player.id}
                        className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{player.name}</p>
                          <p className="text-xs text-gray-600">{holesList}</p>
                        </div>
                        <div className="bg-red-100 border-2 border-red-300 rounded-lg px-4 py-2 min-w-[60px] text-center">
                          <p className="text-2xl font-bold text-red-600">{noPasoRojasCount}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      {showFinishModal && (
        <ConfirmModal
          message="¿Finalizar la partida? Esto marcará la ronda como completada."
          onConfirm={handleConfirmFinish}
          onCancel={() => setShowFinishModal(false)}
        />
      )}

      {showCourseChangeModal && courseId && (
        <CourseChangeModal
          currentCourseId={courseId}
          currentCourseName={courseName}
          onSelectCourse={handleSelectCourse}
          onClose={() => setShowCourseChangeModal(false)}
        />
      )}

      {showCourseConfirmModal && selectedCourse && (
        <CourseChangeConfirmModal
          currentCourseName={courseName}
          newCourseName={selectedCourse.name}
          currentNumHoles={numHoles}
          onConfirm={handleConfirmCourseChange}
          onCancel={() => {
            setShowCourseConfirmModal(false);
            setSelectedCourse(null);
          }}
        />
      )}
    </div>
  );
};
