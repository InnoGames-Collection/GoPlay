import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  UserCheck,
  UserX,
  Shield,
  Edit2,
  AlertTriangle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { AdminUser, AdminRole } from '../types';
import { api } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

interface AdminUsersPageProps {
  currentRole: AdminRole;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ currentRole }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New admin modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('TOURNAMENT_OPERATOR');
  const [addReason, setAddReason] = useState('');

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

  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await api.getAdminUsers();
      setAdmins(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrator accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAddAdmin = async () => {
    if (!newUsername.trim() || !newEmail.trim() || !newPassword.trim()) {
      alert('Username, email, and temporary password are required.');
      return;
    }
    if (!addReason.trim() || addReason.trim().length < 4) {
      alert('An operational reason is required for administrative user creation.');
      return;
    }

    try {
      await api.createAdminUser(
        {
          username: newUsername.trim(),
          email: newEmail.trim(),
          password: newPassword,
          role: newRole,
        },
        addReason.trim()
      );
      setIsAddModalOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setAddReason('');
      await loadAdmins();
    } catch (err: any) {
      alert(err.message || 'Failed to create administrative user');
    }
  };

  const handleRoleChange = (admin: AdminUser, targetRole: AdminRole) => {
    if (!isSuperAdmin) return;
    setConfirmState({
      isOpen: true,
      title: 'Update Admin Access Role',
      actionName: `Change ${admin.username}'s role from ${admin.role} to ${targetRole}`,
      currentValue: admin.role,
      newValue: targetRole,
      warningNote: 'Changing RBAC roles alters access permissions to financial payouts, PII unmasking, and audit controls.',
      actionFn: async (reason: string) => {
        await api.updateAdminRole(admin.id, targetRole, reason);
        await loadAdmins();
      },
    });
  };

  const handleToggleActive = (admin: AdminUser) => {
    if (!isSuperAdmin) return;
    const nextState = !admin.active;
    setConfirmState({
      isOpen: true,
      title: nextState ? 'Reactivate Administrator Account' : 'Deactivate Administrator Account',
      actionName: `${nextState ? 'Activate' : 'Suspend'} administrative access for ${admin.username}`,
      currentValue: admin.active ? 'ACTIVE' : 'INACTIVE',
      newValue: nextState ? 'ACTIVE' : 'INACTIVE',
      danger: !nextState,
      warningNote: !nextState
        ? 'Suspension terminates any active sessions and revokes token validation immediately.'
        : undefined,
      actionFn: async (reason: string) => {
        await api.toggleAdminActive(admin.id, nextState, reason);
        await loadAdmins();
      },
    });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>Administrative Users & Role-Based Access Control (RBAC)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authorized operators, assign strict roles, and review session security across GoPlay.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isSuperAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Administrator</span>
            </button>
          )}
          <button
            onClick={loadAdmins}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
            title="Reload Operators"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Admin Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Operator Username</th>
                <th className="py-3 px-4">Official Email</th>
                <th className="py-3 px-4">RBAC Role</th>
                <th className="py-3 px-4">Account State</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading administrator accounts...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No administrator accounts found.
                  </td>
                </tr>
              ) : (
                admins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                      {adm.username}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {adm.email}
                    </td>
                    <td className="py-3 px-4">
                      {isSuperAdmin ? (
                        <select
                          value={adm.role}
                          onChange={(e) => handleRoleChange(adm, e.target.value as AdminRole)}
                          className="border border-slate-300 rounded-lg p-1 text-xs font-mono bg-white text-slate-800 outline-none"
                        >
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                          <option value="TOURNAMENT_OPERATOR">TOURNAMENT_OPERATOR</option>
                          <option value="FINANCIAL_AUDITOR">FINANCIAL_AUDITOR</option>
                          <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                        </select>
                      ) : (
                        <span className="font-mono text-xs font-semibold text-slate-800">
                          {adm.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          adm.active
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {adm.active ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {adm.lastLogin ? new Date(adm.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isSuperAdmin && adm.username !== 'superadmin' && (
                        <button
                          onClick={() => handleToggleActive(adm)}
                          className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                            adm.active
                              ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                          }`}
                        >
                          {adm.active ? 'Suspend' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Create New Administrator Persona
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Operator Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. ops_yared"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="operator@goplay.innopulseplatform.com"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Assigned RBAC Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono text-xs bg-white"
                >
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Authority)</option>
                  <option value="TOURNAMENT_OPERATOR">TOURNAMENT_OPERATOR (Games & Settlements)</option>
                  <option value="FINANCIAL_AUDITOR">FINANCIAL_AUDITOR (Ledgers & PII Unmasking)</option>
                  <option value="SUPPORT_AGENT">SUPPORT_AGENT (Subscribers & Bans)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold uppercase mb-1">
                  Operational Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  placeholder="e.g. Onboarded new operations shift lead."
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end space-x-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-700 shadow-xs"
              >
                Create Account
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
