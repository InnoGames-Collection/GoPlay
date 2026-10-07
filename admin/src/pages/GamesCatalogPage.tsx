import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  Coins,
  Settings2,
  Plus,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { GameItem, AdminRole } from '../types';
import { api } from '../services/api';
import { Badge } from '../components/Badge';
import { ConfirmModal } from '../components/ConfirmModal';

interface GamesCatalogPageProps {
  currentRole: AdminRole;
}

export const GamesCatalogPage: React.FC<GamesCatalogPageProps> = ({ currentRole }) => {
  const [games, setGames] = useState<GameItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Configuration modal
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEntryFee, setEditEntryFee] = useState<number>(0);
  const [editMaxScorePerSec, setEditMaxScorePerSec] = useState<number>(50);
  const [editMaxScore, setEditMaxScore] = useState<number>(10000);
  const [editMinDurationSec, setEditMinDurationSec] = useState<number>(10);

  // Confirmation modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    actionName: string;
    currentValue?: string;
    newValue?: string;
    warningNote?: string;
    danger?: boolean;
    actionFn: (reason: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    actionName: '',
    actionFn: async () => {},
  });

  const canEdit = currentRole === 'SUPER_ADMIN' || currentRole === 'TOURNAMENT_OPERATOR' || currentRole === 'OPERATIONS_ADMIN';

  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getGames();
      setGames(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load games catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  const handleToggleGame = (game: GameItem) => {
    if (!canEdit) {
      alert('Your administrative role does not permit modifying game availability.');
      return;
    }

    const nextState = !game.isEnabled;
    setConfirmState({
      isOpen: true,
      title: nextState ? 'Enable Game Title' : 'Disable Game Title',
      actionName: `${nextState ? 'Publish' : 'Unpublish'} "${game.title}" on GoPlay Portal`,
      currentValue: game.isEnabled ? 'ENABLED' : 'DISABLED',
      newValue: nextState ? 'ENABLED' : 'DISABLED',
      danger: !nextState,
      warningNote: !nextState
        ? 'Disabling this game will immediately remove it from player launchers and suspend active tournament sessions.'
        : undefined,
      actionFn: async (reason: string) => {
        await api.toggleGameStatus(game.gameId, reason);
        await loadGames();
      },
    });
  };

  const handleOpenEdit = (game: GameItem) => {
    setSelectedGame(game);
    setEditEntryFee(game.entryFeeCoins || 0);
    setEditMaxScorePerSec(game.maxScorePerSec || 50);
    setEditMaxScore(game.maxScore || 10000);
    setEditMinDurationSec(game.minDurationSec || 10);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedGame) return;
    try {
      await api.updateGameRules(selectedGame.gameId, {
        entryFeeCoins: Number(editEntryFee),
        maxScorePerSec: Number(editMaxScorePerSec),
        maxScore: Number(editMaxScore),
        minDurationSec: Number(editMinDurationSec),
      });
      setIsEditModalOpen(false);
      await loadGames();
    } catch (err: any) {
      alert(err.message || 'Failed to update game rules');
    }
  };

  const filteredGames = games.filter((g) => {
    const matchesSearch =
      !search ||
      g.title.toLowerCase().includes(search.toLowerCase()) ||
      g.gameId.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || g.category.toUpperCase() === categoryFilter.toUpperCase();
    return matchesSearch && matchesCat;
  });

  const categories = ['ALL', 'ARCADE', 'SPORTS', 'PUZZLE', 'ACTION', 'STRATEGY'];

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <Gamepad2 className="w-5 h-5 text-indigo-600" />
            <span>GoPlay Games Catalog (100+ Titles)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage GameON Studios titles, categories, coin entry fees, and anti-cheat maximum score velocity thresholds.
          </p>
        </div>

        <button
          onClick={loadGames}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto cursor-pointer"
          title="Reload Games"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or game ID..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg outline-none w-56 font-mono text-xs text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-slate-500 font-semibold uppercase text-[11px]">Category:</span>
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <strong>{filteredGames.length}</strong> of <strong>{games.length}</strong> catalog games
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Games Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Game Title & ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Access & Coins</th>
                <th className="py-3 px-4">Anti-Cheat Limits</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading game catalog...
                  </td>
                </tr>
              ) : filteredGames.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No games match the current filters.
                  </td>
                </tr>
              ) : (
                filteredGames.map((g) => (
                  <tr key={g.gameId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">{g.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{g.gameId}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px]">
                        {g.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {g.provider || 'GameON Studios'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5 font-mono">
                        {g.requiresCoins ? (
                          <span className="text-amber-700 font-bold flex items-center space-x-1">
                            <span>🪙</span>
                            <span>{g.entryFeeCoins} Coins</span>
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-bold">FREE / INCLUDED</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div>Max: {g.maxScore?.toLocaleString() || '10,000'} pts</div>
                      <div className="text-[10px] text-slate-400">
                        {g.maxScorePerSec || 50} pts/s • min {g.minDurationSec || 10}s
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge status={g.isEnabled ? 'ACTIVE' : 'INACTIVE'} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {canEdit && (
                          <button
                            onClick={() => handleToggleGame(g)}
                            title={g.isEnabled ? 'Disable Game' : 'Enable Game'}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              g.isEnabled
                                ? 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                : 'text-slate-400 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {g.isEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEdit(g)}
                          title="Configure Parameters"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Game Modal */}
      {isEditModalOpen && selectedGame && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Gamepad2 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Configure Game Rules: {selectedGame.title}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Coin Entry Fee
                </label>
                <input
                  type="number"
                  min="0"
                  value={editEntryFee}
                  onChange={(e) => setEditEntryFee(parseInt(e.target.value, 10) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
                <span className="text-[11px] text-slate-400">0 = Free play for active subscribers.</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Anti-Cheat Max Velocity (Points/Sec)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editMaxScorePerSec}
                  onChange={(e) => setEditMaxScorePerSec(parseInt(e.target.value, 10) || 1)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
                <span className="text-[11px] text-slate-400">Scores exceeding this rate trigger immediate telemetry fraud flags.</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Absolute Maximum Plausible Score
                </label>
                <input
                  type="number"
                  min="100"
                  value={editMaxScore}
                  onChange={(e) => setEditMaxScore(parseInt(e.target.value, 10) || 100)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Minimum Plausible Session Duration (Seconds)
                </label>
                <input
                  type="number"
                  min="1"
                  value={editMinDurationSec}
                  onChange={(e) => setEditMinDurationSec(parseInt(e.target.value, 10) || 1)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700 shadow-xs"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.actionFn}
        title={confirmState.title}
        actionName={confirmState.actionName}
        currentValue={confirmState.currentValue}
        newValue={confirmState.newValue}
        warningNote={confirmState.warningNote}
        danger={confirmState.danger}
      />
    </div>
  );
};
