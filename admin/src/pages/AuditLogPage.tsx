import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  Download,
  ShieldAlert,
  Code2,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { AuditLogEntry } from '../types';
import { api } from '../services/api';

export const AuditLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAuditLogs({
        action: actionFilter,
        entityType: entityFilter,
      });
      setLogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [actionFilter, entityFilter]);

  const handleExportCSV = () => {
    let csv = 'Timestamp,Admin,Role,Action,EntityType,EntityId,IPAddress,Reason\n';
    logs.forEach((l) => {
      csv += `"${l.timestamp}","${l.adminName}","${l.adminRole || 'OPERATOR'}","${l.action}","${l.entityType}","${l.entityId}","${l.ipAddress || ''}","${(l.reason || '').replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GoPlay_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (l.reason && l.reason.toLowerCase().includes(q)) ||
      l.adminName.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.entityId.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ClipboardList className="w-5 h-5 text-blue-700" />
            <span>Immutable Compliance Audit Trail (WORM Ledger)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed chronological ledger of all operator mutations, prize disbursements, PII accesses, and bans.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-200" />
            <span>Export Audit Log</span>
          </button>
          <button
            onClick={loadLogs}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            title="Reload Logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search admin, reason, ID..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg outline-none w-64 font-mono text-xs text-slate-800"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-semibold uppercase text-[11px]">Action:</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700 outline-none text-xs font-mono"
            >
              <option value="ALL">ALL ACTIONS</option>
              <option value="ADMIN_LOGIN_SUCCESS">ADMIN_LOGIN_SUCCESS</option>
              <option value="TOURNAMENT_FINALIZED">TOURNAMENT_FINALIZED</option>
              <option value="TOURNAMENT_SCORE_MANUAL_OVERRIDE">SCORE_OVERRIDE</option>
              <option value="PLAYER_BANNED">PLAYER_BANNED</option>
              <option value="PLAYER_UNBANNED">PLAYER_UNBANNED</option>
              <option value="MANUAL_COIN_BALANCE_ADJUSTMENT">COIN_ADJUSTMENT</option>
              <option value="PII_MSISDN_UNMASK_ACCESSED">PII_UNMASK</option>
              <option value="ANTI_CHEAT_SESSION_INVALIDATED">SESSION_INVALIDATED</option>
              <option value="GAME_CATALOG_STATUS_TOGGLED">GAME_TOGGLED</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-semibold uppercase text-[11px]">Entity:</span>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700 outline-none text-xs font-mono"
            >
              <option value="ALL">ALL ENTITIES</option>
              <option value="profile">profile</option>
              <option value="tournament">tournament</option>
              <option value="tournament_entry">tournament_entry</option>
              <option value="game">game</option>
              <option value="game_session">game_session</option>
              <option value="admin_auth">admin_auth</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-mono">
          Showing <strong>{filteredLogs.length}</strong> immutable audit entries
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Timestamp (EAT)</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Justification Note</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Querying immutable audit ledger...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No compliance log records found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.adminName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.adminRole || 'OPERATOR'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="text-slate-800 font-semibold">{log.entityType}</span>
                      <span className="text-slate-400 mx-1">:</span>
                      <span className="text-slate-500">{log.entityId}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 italic max-w-xs truncate">
                      {log.reason ? `"${log.reason}"` : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        title="View Change Payload"
                        className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                      >
                        <Code2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Audit Entry Mutation Diff: {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div>Timestamp: <strong>{new Date(selectedLog.timestamp).toISOString()}</strong></div>
                <div>Admin Operator: <strong>{selectedLog.adminName}</strong></div>
                <div>Entity Target: <strong>{selectedLog.entityType} ({selectedLog.entityId})</strong></div>
                {selectedLog.reason && <div>Reason: <em>"{selectedLog.reason}"</em></div>}
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Old Value (Before Mutation):
                </div>
                <div className="p-3 bg-slate-900 text-slate-300 rounded-lg max-h-36 overflow-y-auto">
                  <pre>{JSON.stringify(selectedLog.oldValue || 'NONE / NULL', null, 2)}</pre>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-bold text-emerald-700 uppercase tracking-wider text-[10px]">
                  New Value (Committed State):
                </div>
                <div className="p-3 bg-slate-900 text-emerald-400 rounded-lg max-h-36 overflow-y-auto">
                  <pre>{JSON.stringify(selectedLog.newValue || 'COMMITTED', null, 2)}</pre>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Diff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
