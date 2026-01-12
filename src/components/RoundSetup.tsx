import React, { useState, useEffect } from 'react';
import { GolfCourse, GolfHole, Group, Tee } from '../types';
import { golfService } from '../services/golfService';
import { ChevronRight, Flag, Copy, Check, LogOut, ArrowLeft } from 'lucide-react';
import { HolesRangeModal } from './HolesRangeModal';
import { AdminPinModal } from './AdminPinModal';
import { adminPinUtils } from '../utils/adminPin';
import { safeStorage } from '../utils/safeStorage';

interface RoundSetupProps {
  onRoundCreated: (roundId: string, courseId: string, numHoles: 9 | 18, useSlope: boolean) => void;
  onViewActiveRounds: () => void;
  onViewGamePoints: () => void;
  onViewStatistics?: () => void;
  onJoinWithCode: () => void;
  onLeaveGroup: () => void;
  onBack?: () => void;
  currentGroup?: Group | null;
  isGroupCreator?: boolean;
  hasLimitedAccess?: boolean;
}

export const RoundSetup: React.FC<RoundSetupProps> = ({
  onRoundCreated,
  onViewActiveRounds,
  onViewGamePoints,
  onViewStatistics,
  onJoinWithCode,
  onLeaveGroup,
  onBack,
  currentGroup,
  isGroupCreator = true,
  hasLimitedAccess = false,
}) => {
  const [courses, setCourses] = useState<GolfCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');
  const [selectedCourseHoleCount, setSelectedCourseHoleCount] = useState<number>(18);
  const [numHoles, setNumHoles] = useState<9 | 18>(9);
  const [holesRange, setHolesRange] = useState<'1-9' | '10-18'>('1-9');
  const [useSlope, setUseSlope] = useState<boolean>(false);
  const [tees, setTees] = useState<Tee[]>([]);
  const [selectedTeeId, setSelectedTeeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeRoundsCount, setActiveRoundsCount] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showHolesRangeModal, setShowHolesRangeModal] = useState(false);
  const [pendingNumHoles, setPendingNumHoles] = useState<9 | 18 | null>(null);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [pinError, setPinError] = useState('');
  const [completedRounds, setCompletedRounds] = useState<any[]>([]);

  useEffect(() => {
    loadCourses();
    loadActiveRoundsCount();
    loadCompletedRounds();
  }, []);

  useEffect(() => {
    const loadCourseDetails = async () => {
      if (selectedCourse) {
        try {
          const holeCount = await golfService.getCourseHoleCount(selectedCourse);
          setSelectedCourseHoleCount(holeCount);

          // Get the course name
          const course = courses.find(c => c.id === selectedCourse);
          if (course) {
            setSelectedCourseName(course.name);
          }

          if (holeCount === 9) {
            setNumHoles(9);
          }

          // Load tees for the selected course
          const courseTees = await golfService.getTees(selectedCourse);
          setTees(courseTees);
          if (courseTees.length > 0) {
            setSelectedTeeId(courseTees[0].id);
          }
        } catch (err) {
          console.error('Error loading course details:', err);
        }
      }
    };

    loadCourseDetails();
  }, [selectedCourse, courses]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await golfService.getCourses();
      setCourses(data);
      if (data.length > 0) {
        const lastCourseId = safeStorage.getItem('lastSelectedCourse');
        const courseExists = lastCourseId && data.some(c => c.id === lastCourseId);
        setSelectedCourse(courseExists ? lastCourseId : data[0].id);
      }
    } catch (err) {
      setError('Error cargando campos de golf');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveRoundsCount = async () => {
    try {
      const activeRounds = await golfService.getActiveRounds();
      setActiveRoundsCount(activeRounds.length);
    } catch (err) {
      console.error('Error cargando contador de partidas:', err);
    }
  };

  const loadCompletedRounds = async () => {
    try {
      if (!currentGroup) {
        const completedRound = await golfService.getQuickPlayCompletedRound();
        setCompletedRounds(completedRound ? [completedRound] : []);
      }
    } catch (err) {
      console.error('Error cargando partidas finalizadas:', err);
    }
  };

  const handleCreateRound = async () => {
    if (!selectedCourse) {
      setError('Por favor selecciona un campo');
      return;
    }

    // Check if DIVEND and not authorized
    if (currentGroup?.group_code === 'DIVEND' && !adminPinUtils.isAuthorized()) {
      setShowAdminPinModal(true);
      setPinError('');
      return;
    }

    await proceedWithRoundCreation();
  };

  const proceedWithRoundCreation = async () => {
    try {
      setLoading(true);
      setError('');

      // Check if there's an active quick play round
      if (!currentGroup) {
        const hasActiveRound = await golfService.hasActiveQuickPlayRound();
        if (hasActiveRound) {
          setError('Ya tienes una partida creada. Para crear otra partida debes eliminar la partida creada.');
          setLoading(false);
          return;
        }
      }

      const round = await golfService.createRound(
        selectedCourse,
        numHoles,
        useSlope,
        numHoles === 9 ? holesRange : undefined,
        useSlope ? selectedTeeId || undefined : undefined
      );
      safeStorage.setItem('lastSelectedCourse', selectedCourse);
      onRoundCreated(round.id, round.course_id, round.num_holes, round.use_slope);
    } catch (err) {
      setError('Error creando partida');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyGroupCode = async () => {
    if (!currentGroup) return;

    try {
      await navigator.clipboard.writeText(currentGroup.group_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('Error copying code:', err);
    }
  };

  const handleNumHolesChange = (newNumHoles: 9 | 18) => {
    if (newNumHoles === 9 && selectedCourseHoleCount === 18) {
      // Check if it's a Costa Azahar course
      const isCostaAzahar = selectedCourseName.includes('Costa Azahar');

      if (isCostaAzahar) {
        // For Costa Azahar courses, always use holes 1-9 without showing the modal
        setNumHoles(9);
        setHolesRange('1-9');
      } else {
        // For other courses, show the modal to select range
        setPendingNumHoles(newNumHoles);
        setShowHolesRangeModal(true);
      }
    } else {
      setNumHoles(newNumHoles);
      setHolesRange('1-9');
    }
  };

  const handleHolesRangeConfirm = (range: '1-9' | '10-18') => {
    setHolesRange(range);
    if (pendingNumHoles !== null) {
      setNumHoles(pendingNumHoles);
      setPendingNumHoles(null);
    }
    setShowHolesRangeModal(false);
  };

  const handleHolesRangeCancel = () => {
    setPendingNumHoles(null);
    setShowHolesRangeModal(false);
  };

  const handleAdminPinSubmit = (pin: string) => {
    if (adminPinUtils.verifyPin(pin)) {
      adminPinUtils.setAuthorized();
      setShowAdminPinModal(false);
      setPinError('');
      proceedWithRoundCreation();
    } else {
      setPinError('PIN incorrecto. Inténtalo de nuevo.');
    }
  };

  const handleAdminPinCancel = () => {
    setShowAdminPinModal(false);
    setPinError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-900 to-emerald-800 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center relative">
          {!currentGroup && onBack && (
            <button
              onClick={onBack}
              className="absolute left-0 top-0 text-white hover:text-emerald-200 flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={24} />
              Atras
            </button>
          )}
          <div className="flex items-center justify-center gap-3 mb-4">

            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {currentGroup?.group_code === 'DIVEND'
                ? 'Partideta dels divendres'
                : (currentGroup?.name || 'La Partideta')}
            </h1>
          </div>
          <p className="text-emerald-100 text-lg">
            {currentGroup ? 'Gestor de Partidas y Puntuación' : 'Partida Rápida'}
          </p>
        </div>

        {/* Código de Grupo - Hidden for limited access */}
        {currentGroup && !hasLimitedAccess && (
          <div className="bg-white rounded-lg shadow-xl p-6">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Código de Grupo</h3>
              <button
                onClick={onLeaveGroup}
                className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm font-medium transition-colors"
                title="Salir del grupo"
              >
                <LogOut size={16} />
                Salir
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Comparte este código con otros para que puedan participar en las partidas del grupo:
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-green-50 border-2 border-green-300 rounded-lg px-4 py-3 text-center">
                <span className="text-2xl font-mono font-bold text-green-700 tracking-wider">
                  {currentGroup.group_code}
                </span>
              </div>
              <button
                onClick={handleCopyGroupCode}
                className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors"
                title="Copiar código"
              >
                {codeCopied ? <Check size={24} /> : <Copy size={24} />}
              </button>
            </div>
            {currentGroup.name && (
              <p className="text-sm text-gray-500 mt-2">Grupo: {currentGroup.name}</p>
            )}
          </div>
        )}

        {/* Unirse con Código - Hidden for limited access */}
        {currentGroup && !hasLimitedAccess && (
          <div
            onClick={onJoinWithCode}
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg shadow-2xl p-6 md:p-8 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-bold text-purple-900 mb-4">Unirse con Código a una partida</h2>
            <p className="text-gray-700 mb-6">
              ¿Tienes un código de acceso? Úsalo para unirte a una partida existente y editar las puntuaciones.
            </p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              Introducir Código
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Salir del Grupo - Discreto */}
        {currentGroup && hasLimitedAccess && (
          <button
            onClick={onLeaveGroup}
            className="w-full text-left bg-white hover:bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center justify-between text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            <span className="flex items-center gap-2">
              <LogOut size={16} />
              Salir del grupo
            </span>
          </button>
        )}

        <div className={`grid grid-cols-1 ${(isGroupCreator && !hasLimitedAccess) ? 'md:grid-cols-2 md:items-stretch' : ''} gap-4`}>
          {/* Nueva Partida - Hidden for limited access */}
          {isGroupCreator && !hasLimitedAccess && (
            <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-emerald-900 mb-6">Nueva Partida</h2>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Selecciona un Campo
                  </label>
                  <select
                    value={selectedCourse || ''}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-emerald-600 disabled:bg-gray-100"
                  >
                    <option value="">-- Selecciona un campo --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Número de Hoyos
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleNumHolesChange(9)}
                      className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                        numHoles === 9
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      9 Hoyos
                    </button>
                    <button
                      onClick={() => handleNumHolesChange(18)}
                      className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                        numHoles === 18
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      18 Hoyos
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Cálculo de Handicap
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setUseSlope(true)}
                      className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                        useSlope
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Con Slope
                    </button>
                    <button
                      onClick={() => setUseSlope(false)}
                      className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                        !useSlope
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      }`}
                    >
                      Sin Slope
                    </button>
                  </div>
                </div>

                {useSlope && tees.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Selecciona Barras
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {tees.map((tee) => (
                        <button
                          key={tee.id}
                          onClick={() => setSelectedTeeId(tee.id)}
                          className={`py-3 px-4 rounded-lg font-bold transition-all flex items-center gap-2 ${
                            selectedTeeId === tee.id
                              ? 'bg-emerald-600 text-white shadow-lg'
                              : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                          }`}
                        >
                          <div
                            className="w-4 h-4 rounded-full border-2 border-current"
                            style={{ backgroundColor: tee.color }}
                          />
                          {tee.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCreateRound}
                  disabled={!selectedCourse || loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors mt-6"
                >
                  Crear Partida
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Columna derecha: Mi Partida y Estadísticas */}
          <div className="flex flex-col gap-4 h-full">
            {/* Ver Partida Activa - Ocupa 2/3 */}
            <div
              onClick={onViewActiveRounds}
              className="bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300 rounded-lg shadow-xl cursor-pointer hover:shadow-2xl transition-shadow flex-[2] flex flex-col"
            >
              <div className="p-5 pb-4 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-2xl font-bold text-amber-900">
                    {currentGroup ? 'Partida Activas' : 'Mi Partida'}
                  </h2>
                  <div className="bg-amber-600 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center text-base">
                    {activeRoundsCount}
                  </div>
                </div>
                <p className="text-gray-700 text-base leading-relaxed">
                  {currentGroup
                    ? 'Edita las partidas y observa en tiempo real las puntuaciones de todas las partidas activas.'
                    : 'Accede a tus partida rápida activa y continúa donde lo dejaste.'}
                </p>
              </div>
              <button className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-b-md flex items-center justify-center gap-2 transition-colors text-base">
                Ver Partida
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Estadísticas - Solo para Partida Rápida - Ocupa 1/3 */}
            {!currentGroup && onViewStatistics && (
              <div
                onClick={completedRounds.length > 0 ? onViewStatistics : undefined}
                className={`bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg shadow-xl flex-1 flex flex-col ${
                  completedRounds.length > 0 ? 'cursor-pointer hover:shadow-2xl' : 'opacity-60'
                } transition-all`}
              >
                <div className="p-4 flex-1">
                  <h2 className="text-xl font-bold text-blue-900 mb-3">Estadísticas</h2>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {completedRounds.length > 0
                      ? 'Ver premios y estadísticas de la última partida completada'
                      : 'Completa una partida para ver estadísticas'}
                  </p>
                </div>
                {completedRounds.length > 0 && (
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-b-md flex items-center justify-center gap-2 transition-colors text-base">
                    Ver Estadísticas
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Puntos de juego */}
        {currentGroup && (
          <div
            onClick={onViewGamePoints}
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg shadow-2xl p-6 md:p-8 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Puntos de Juego</h2>
            <p className="text-gray-700 mb-6">
              Consulta las clasificaciones de partidas completadas en el dia, los jugadores registrados y sus handicaps.
            </p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              Ver Puntos
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Estadísticas */}
        {currentGroup && onViewStatistics && (
          <div
            onClick={onViewStatistics}
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 rounded-lg shadow-2xl p-6 md:p-8 cursor-pointer hover:shadow-xl transition-shadow"
          >
            <h2 className="text-2xl font-bold text-purple-900 mb-4">Estadísticas</h2>
            <p className="text-gray-700 mb-6">
              Consulta estadísticas de jugadores, del grupo y de campos. Solo para multipartidetas archivadas.
            </p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
              Ver Estadísticas
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

      {showHolesRangeModal && (
        <HolesRangeModal
          onConfirm={handleHolesRangeConfirm}
          onCancel={handleHolesRangeCancel}
        />
      )}

      {showAdminPinModal && (
        <AdminPinModal
          onSubmit={handleAdminPinSubmit}
          onCancel={handleAdminPinCancel}
          error={pinError}
        />
      )}
    </div>
  );
};
