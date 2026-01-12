import React from 'react';
import { Archive, Trash2, X } from 'lucide-react';

interface DeleteRoundModalProps {
  isGroupRound: boolean;
  isCompleted: boolean;
  onArchiveAndDelete: () => void;
  onDeleteWithoutSaving: () => void;
  onCancel: () => void;
}

export const DeleteRoundModal: React.FC<DeleteRoundModalProps> = ({
  isGroupRound,
  isCompleted,
  onArchiveAndDelete,
  onDeleteWithoutSaving,
  onCancel,
}) => {
  if (!isGroupRound || !isCompleted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Eliminar Partida</h2>
          </div>

          <p className="text-gray-700 mb-6">
            ¿Estás seguro de que quieres eliminar esta partida? Esta acción no se puede deshacer.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onDeleteWithoutSaving}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">¿Qué quieres hacer?</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-6 text-sm">
          Esta partida está finalizada. Puedes archivarla para guardar las estadísticas o eliminarla sin guardar.
        </p>

        <div className="space-y-3">
          <button
            onClick={onArchiveAndDelete}
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-semibold py-4 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3"
          >
            <Archive size={20} />
            <div className="text-left">
              <div className="font-bold">Archivar y Eliminar</div>
              <div className="text-xs text-emerald-100">Guarda las estadísticas</div>
            </div>
          </button>

          <button
            onClick={onDeleteWithoutSaving}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <Trash2 size={20} />
            <div className="text-left">
              <div className="font-bold">Eliminar sin Guardar</div>
              <div className="text-xs text-red-100">No se guardarán estadísticas</div>
            </div>
          </button>

          <button
            onClick={onCancel}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
