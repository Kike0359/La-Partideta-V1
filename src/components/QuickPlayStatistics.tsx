import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Award, TrendingDown, Flag, Target, Zap, Trash2, Activity, Flame } from 'lucide-react';
import { golfService } from '../services/golfService';
import { ConfirmModal } from './ConfirmModal';
import { calculateScoreToPar } from '../utils/calculations';

interface QuickPlayStatisticsProps {
  onBack: () => void;
}

interface PlayerHighlights {
  playerId: string;
  playerName: string;
  totalPoints: number;
  totalGrossStrokes: number;
  scoreToPar: { value: number; display: string };
  birdies: number;
  pares: number;
  bogeys: number;
  doubleBogeyPlus: number;
  bestHole: { holeNumber: number; points: number };
  worstHole: { holeNumber: number; points: number };
  variability: number;
}

export const QuickPlayStatistics: React.FC<QuickPlayStatisticsProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [roundData, setRoundData] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [highlights, setHighlights] = useState<PlayerHighlights[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    if (stats) {
      setTimeout(() => setAnimateIn(true), 100);
    }
  }, [stats]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const data = await golfService.getQuickPlayCompletedRound();

      if (data) {
        setRoundData(data);
        const calculatedStats = golfService.calculateQuickPlayAwards(
          data.players,
          data.scores,
          data.holes
        );
        setStats(calculatedStats);

        const playerHighlights = calculatePlayerHighlights(data.players, data.scores, data.holes);
        setHighlights(playerHighlights);
      }
    } catch (err) {
      console.error('Error loading statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePlayerHighlights = (players: any[], scores: any[], holes: any[]): PlayerHighlights[] => {
    const coursePar = holes.reduce((sum, h) => sum + h.par, 0);
    const numHoles = holes.length;

    return players.map(player => {
      const playerScores = scores.filter(s => s.player_id === player.id && !s.abandoned);

      const hasAbandonedScores = scores.some(s => s.player_id === player.id && s.abandoned);

      let birdies = 0, pares = 0, bogeys = 0, doubleBogeyPlus = 0;
      let bestHole = { holeNumber: 0, points: -999 };
      let worstHole = { holeNumber: 0, points: 999 };
      let totalPoints = 0;
      let totalGrossStrokes = 0;

      playerScores.forEach(score => {
        const hole = holes.find(h => h.hole_number === score.hole_number);
        const diff = score.net_strokes - (hole?.par || 0);
        const points = score.stableford_points || 0;

        totalPoints += points;
        totalGrossStrokes += score.gross_strokes;

        if (points > bestHole.points) {
          bestHole = { holeNumber: score.hole_number, points };
        }
        if (points < worstHole.points) {
          worstHole = { holeNumber: score.hole_number, points };
        }

        if (diff <= -2) birdies++;
        else if (diff === -1) birdies++;
        else if (diff === 0) pares++;
        else if (diff === 1) bogeys++;
        else if (diff >= 2) doubleBogeyPlus++;
      });

      const scoreToPar = hasAbandonedScores || totalGrossStrokes === 0
        ? { value: 0, display: '-' }
        : calculateScoreToPar(
            totalGrossStrokes,
            coursePar,
            player.playing_handicap,
            numHoles as 9 | 18
          );

      return {
        playerId: player.id,
        playerName: player.name,
        totalPoints,
        totalGrossStrokes,
        scoreToPar,
        birdies,
        pares,
        bogeys,
        doubleBogeyPlus,
        bestHole,
        worstHole,
        variability: bestHole.points - worstHole.points
      };
    });
  };

  const handleDelete = async () => {
    try {
      await golfService.deleteQuickPlayCompletedRound();
      setShowDeleteConfirm(false);
      onBack();
    } catch (err) {
      console.error('Error deleting round:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-900 to-emerald-800 p-4 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!roundData || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-900 to-emerald-800 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="bg-white hover:bg-gray-100 text-emerald-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-colors mb-6"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="bg-white rounded-lg shadow-2xl p-8 text-center">
            <TrendingDown size={64} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No hay estadísticas disponibles</h2>
            <p className="text-gray-600">
              Completa una partida de Quick Play para ver las estadísticas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { round, players, scores, course, holes } = roundData;
  const { ranking, awards } = stats;

  const birdieKing = highlights.reduce((max, h) => h.birdies > max.birdies ? h : max, highlights[0]);
  const rollerCoaster = highlights.reduce((max, h) => h.variability > max.variability ? h : max, highlights[0]);
  const bogeyKing = highlights.reduce((max, h) => h.bogeys > max.bogeys ? h : max, highlights[0]);
  const doubleBogeyKing = highlights.reduce((max, h) => h.doubleBogeyPlus > max.doubleBogeyPlus ? h : max, highlights[0]);

  const bestIndividualHole = highlights.reduce((max, h) =>
    h.bestHole.points > max.bestHole.points ? h : max, highlights[0]
  );
  const worstIndividualHole = highlights.reduce((min, h) =>
    h.worstHole.points < min.worstHole.points ? h : min, highlights[0]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-4 md:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzFmMmQzZCIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjMiLz48L2c+PC9zdmc+')] opacity-20"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Volver</span>
          </button>

          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black text-white drop-shadow-2xl mb-2">GAME OVER</h1>
            <p className="text-emerald-300 font-semibold text-sm md:text-base">
              {new Date(round.completed_at || round.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })} • {course?.name}
            </p>
          </div>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600/90 hover:bg-red-700 backdrop-blur-sm text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <Trash2 size={20} />
            <span className="hidden sm:inline">Eliminar</span>
          </button>
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 transition-all duration-1000 ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="transform transition-all duration-700 hover:scale-105" style={{ animationDelay: '0ms' }}>
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-6 shadow-2xl border-4 border-yellow-300 relative">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-yellow-300 rounded-full flex items-center justify-center text-3xl font-black text-yellow-900 shadow-lg">
                1
              </div>
              <div className="mt-6 text-center">
                <p className="text-yellow-900 font-bold text-xl mb-2">{ranking[0].player.name}</p>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-2">
                  <p className="text-5xl font-black text-yellow-900 mb-1">{ranking[0].totalPoints}</p>
                  <p className="text-yellow-900 text-sm font-semibold">puntos</p>
                </div>
                <div className="bg-yellow-600/30 backdrop-blur-sm rounded-lg py-2 px-3 mb-2">
                  <p className={`text-2xl font-black ${highlights[0]?.scoreToPar.value === 0 ? 'text-yellow-900' : highlights[0]?.scoreToPar.value < 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {highlights[0]?.scoreToPar.display}
                  </p>
                  <p className="text-yellow-900 text-xs font-medium">vs Par Personal</p>
                </div>
                <p className="text-yellow-800 text-xs">HCP: {ranking[0].player.playing_handicap}</p>
              </div>
            </div>
          </div>

          {ranking[1] && (
            <div className="transform transition-all duration-700 hover:scale-105" style={{ animationDelay: '200ms' }}>
              <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-6 shadow-2xl border-4 border-slate-400 relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-slate-400 rounded-full flex items-center justify-center text-3xl font-black text-slate-900 shadow-lg">
                  2
                </div>
                <div className="mt-6 text-center">
                  <p className="text-slate-100 font-bold text-xl mb-2">{ranking[1].player.name}</p>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-2">
                    <p className="text-5xl font-black text-white mb-1">{ranking[1].totalPoints}</p>
                    <p className="text-slate-300 text-sm font-semibold">puntos</p>
                  </div>
                  <div className="bg-slate-500/30 backdrop-blur-sm rounded-lg py-2 px-3 mb-2">
                    <p className={`text-2xl font-black ${highlights[1]?.scoreToPar.value === 0 ? 'text-white' : highlights[1]?.scoreToPar.value < 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {highlights[1]?.scoreToPar.display}
                    </p>
                    <p className="text-slate-200 text-xs font-medium">vs Par Personal</p>
                  </div>
                  <p className="text-slate-400 text-xs">HCP: {ranking[1].player.playing_handicap}</p>
                </div>
              </div>
            </div>
          )}

          {ranking[2] && (
            <div className="transform transition-all duration-700 hover:scale-105" style={{ animationDelay: '400ms' }}>
              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-6 shadow-2xl border-4 border-orange-400 relative">
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center text-3xl font-black text-orange-900 shadow-lg">
                  3
                </div>
                <div className="mt-6 text-center">
                  <p className="text-orange-100 font-bold text-xl mb-2">{ranking[2].player.name}</p>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-2">
                    <p className="text-5xl font-black text-white mb-1">{ranking[2].totalPoints}</p>
                    <p className="text-orange-300 text-sm font-semibold">puntos</p>
                  </div>
                  <div className="bg-orange-500/30 backdrop-blur-sm rounded-lg py-2 px-3 mb-2">
                    <p className={`text-2xl font-black ${highlights[2]?.scoreToPar.value === 0 ? 'text-white' : highlights[2]?.scoreToPar.value < 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {highlights[2]?.scoreToPar.display}
                    </p>
                    <p className="text-orange-200 text-xs font-medium">vs Par Personal</p>
                  </div>
                  <p className="text-orange-400 text-xs">HCP: {ranking[2].player.playing_handicap}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 transition-all duration-1000 delay-300 ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 shadow-xl transform transition-all hover:scale-105 hover:rotate-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Target size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">Mejor Hoyo</p>
                <p className="text-white font-black text-sm">Individual</p>
              </div>
            </div>
            <p className="text-white text-xl font-black mb-1">{bestIndividualHole?.playerName}</p>
            <p className="text-blue-100 text-lg font-bold">Hoyo {bestIndividualHole?.bestHole.holeNumber}: {bestIndividualHole?.bestHole.points} pts</p>
          </div>

          <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-5 shadow-xl transform transition-all hover:scale-105 hover:rotate-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <TrendingDown size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">Peor Hoyo</p>
                <p className="text-white font-black text-sm">Momento Difícil</p>
              </div>
            </div>
            <p className="text-white text-xl font-black mb-1">{worstIndividualHole?.playerName}</p>
            <p className="text-rose-100 text-lg font-bold">Hoyo {worstIndividualHole?.worstHole.holeNumber}: {worstIndividualHole?.worstHole.points} pts</p>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 shadow-xl transform transition-all hover:scale-105 hover:rotate-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Flame size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">Máquina</p>
                <p className="text-white font-black text-sm">Birdie King</p>
              </div>
            </div>
            <p className="text-white text-2xl font-black mb-1">{birdieKing?.playerName}</p>
            <p className="text-amber-100 text-lg font-bold">{birdieKing?.birdies} birdies</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 shadow-xl transform transition-all hover:scale-105 hover:rotate-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <Activity size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">Montaña Rusa</p>
                <p className="text-white font-black text-sm">Mayor Variación</p>
              </div>
            </div>
            <p className="text-white text-2xl font-black mb-1">{rollerCoaster?.playerName}</p>
            <p className="text-purple-100 text-lg font-bold">Diferencia: {rollerCoaster?.variability} pts</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 shadow-xl transform transition-all hover:scale-105 hover:rotate-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <TrendingDown size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">Más Bogeys</p>
                <p className="text-white font-black text-sm">Rey de +1</p>
              </div>
            </div>
            <p className="text-white text-2xl font-black mb-1">{bogeyKing?.playerName}</p>
            <p className="text-orange-100 text-lg font-bold">{bogeyKing?.bogeys} bogeys</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 shadow-xl transform transition-all hover:scale-105 hover:rotate-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-white/20 p-3 rounded-lg">
                <TrendingDown size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">Más Doble Bogeys</p>
                <p className="text-white font-black text-sm">Rey del Bosque</p>
              </div>
            </div>
            <p className="text-white text-2xl font-black mb-1">{doubleBogeyKing?.playerName}</p>
            <p className="text-red-100 text-lg font-bold">{doubleBogeyKing?.doubleBogeyPlus} doble bogeys+</p>
          </div>
        </div>

        <div
          className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl mb-8 transition-all duration-1000 delay-500 ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h3 className="text-2xl font-black text-white mb-6">Tabla Completa de Estadísticas</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-white/20">
                  <th className="text-left text-white font-bold p-3">Jugador</th>
                  <th className="text-center text-white font-bold p-3">Puntos</th>
                  <th className="text-center text-white font-bold p-3">vs Par</th>
                  <th className="text-center text-white font-bold p-3">Birdies</th>
                  <th className="text-center text-white font-bold p-3">Pares</th>
                  <th className="text-center text-white font-bold p-3">Bogeys</th>
                  <th className="text-center text-white font-bold p-3">Doble+</th>
                </tr>
              </thead>
              <tbody>
                {highlights.sort((a, b) => b.totalPoints - a.totalPoints).map((h, index) => (
                  <tr key={h.playerId} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="text-white font-semibold p-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900' :
                          index === 1 ? 'bg-slate-400 text-slate-900' :
                          index === 2 ? 'bg-orange-400 text-orange-900' :
                          'bg-gray-600 text-white'
                        }`}>
                          {index + 1}
                        </span>
                        {h.playerName}
                      </div>
                    </td>
                    <td className="text-center text-emerald-300 font-bold p-3 text-lg">{h.totalPoints}</td>
                    <td className={`text-center font-bold p-3 text-lg ${
                      h.scoreToPar.value === 0 ? 'text-white' :
                      h.scoreToPar.value < 0 ? 'text-green-300' :
                      'text-red-300'
                    }`}>
                      {h.scoreToPar.display}
                    </td>
                    <td className="text-center text-white p-3">{h.birdies}</td>
                    <td className="text-center text-white p-3">{h.pares}</td>
                    <td className="text-center text-white p-3">{h.bogeys}</td>
                    <td className="text-center text-white p-3">{h.doubleBogeyPlus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl mb-8 transition-all duration-1000 delay-700 ${
            animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
          }`}
        >
          <h3 className="text-2xl font-black text-white mb-6">Puntos por Hoyo</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-white/20">
                  <th className="text-left text-white font-bold p-2 sticky left-0 bg-white/10 backdrop-blur-md">Jugador</th>
                  {holes.map((hole: any) => (
                    <th key={hole.hole_number} className="text-center text-white font-bold p-2 min-w-[40px]">
                      {hole.hole_number}
                    </th>
                  ))}
                  <th className="text-center text-white font-bold p-2 bg-emerald-900/50">Total</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry: any, index: number) => {
                  const playerScores = scores.filter((s: any) => s.player_id === entry.player.id);
                  return (
                    <tr key={entry.player.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="text-white font-semibold p-2 sticky left-0 bg-white/10 backdrop-blur-md">
                        <span className="flex items-center gap-2">
                          <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-slate-400 text-slate-900' :
                            index === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-gray-600 text-white'
                          }`}>
                            {index + 1}
                          </span>
                          {entry.player.name}
                        </span>
                      </td>
                      {holes.map((hole: any) => {
                        const score = playerScores.find((s: any) => s.hole_number === hole.hole_number);
                        const isAbandoned = score?.abandoned;
                        const points = score?.stableford_points || 0;
                        return (
                          <td key={hole.hole_number} className={`text-center p-2 font-bold ${
                            isAbandoned ? 'text-gray-400' :
                            points >= 4 ? 'text-green-300' :
                            points === 3 ? 'text-emerald-300' :
                            points === 2 ? 'text-white' :
                            points === 1 ? 'text-orange-300' :
                            'text-red-300'
                          }`}>
                            {isAbandoned ? '-' : points}
                          </td>
                        );
                      })}
                      <td className="text-center text-emerald-300 font-black p-2 text-lg bg-emerald-900/50">
                        {entry.totalPoints}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {(awards.reyDelBosque || awards.noPasoRojas || awards.holeInOne || awards.hoyoMuerte || awards.hoyoGloria) && (
          <div
            className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-2xl transition-all duration-1000 ${
              animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h3 className="text-2xl font-black text-white mb-6">Premios Especiales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {awards.reyDelBosque && (
                <div className="bg-gradient-to-br from-rose-500/20 to-rose-600/20 border-2 border-rose-400 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown size={20} className="text-rose-400" />
                    <p className="text-rose-300 font-bold text-sm">Rey del Bosque</p>
                  </div>
                  <p className="text-white font-bold text-lg">{awards.reyDelBosque.player.name}</p>
                  <p className="text-rose-300 text-sm">{awards.reyDelBosque.count} doble bogeys+</p>
                </div>
              )}

              {awards.noPasoRojas && (
                <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-2 border-orange-400 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag size={20} className="text-orange-400" />
                    <p className="text-orange-300 font-bold text-sm">No Pasó de Rojas</p>
                  </div>
                  <p className="text-white font-bold text-lg">{awards.noPasoRojas.player.name}</p>
                  <p className="text-orange-300 text-sm">{awards.noPasoRojas.count} veces</p>
                </div>
              )}

              {awards.holeInOne && (
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-400 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={20} className="text-purple-400" />
                    <p className="text-purple-300 font-bold text-sm">Hoyo en Uno</p>
                  </div>
                  {awards.holeInOne.players.map((p: any, idx: number) => (
                    <div key={idx}>
                      <p className="text-white font-bold text-lg">{p.player.name}</p>
                      <p className="text-purple-300 text-sm">{p.count} hoyo(s)</p>
                    </div>
                  ))}
                </div>
              )}

              {awards.hoyoMuerte && (
                <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-400 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={20} className="text-red-400" />
                    <p className="text-red-300 font-bold text-sm">Hoyo de la Muerte</p>
                  </div>
                  <p className="text-white font-bold text-xl">Hoyo #{awards.hoyoMuerte.holeNumber}</p>
                  <p className="text-red-300 text-sm">Promedio: {awards.hoyoMuerte.avgPoints.toFixed(1)} pts</p>
                </div>
              )}

              {awards.hoyoGloria && (
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-400 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award size={20} className="text-green-400" />
                    <p className="text-green-300 font-bold text-sm">Hoyo de la Gloria</p>
                  </div>
                  <p className="text-white font-bold text-xl">Hoyo #{awards.hoyoGloria.holeNumber}</p>
                  <p className="text-green-300 text-sm">Promedio: {awards.hoyoGloria.avgPoints.toFixed(1)} pts</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          message="¿Seguro que deseas eliminar esta partida? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};
