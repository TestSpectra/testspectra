import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Edit2,
  Trash2,
  Shield,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  UserPlus,
  Sparkles,
  Loader2,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { userServiceClient } from '../services/grpc-client';
import { authService } from '../services/auth-service';
import {
  formatPermissionsDisplay,
  formatPermissionsApi,
  ROLE_CONFIG as ROLE_DISPLAY_CONFIG,
} from '../utils/permissions';
import type { User as BackendUser } from '../services/grpc-client';
import { SimpleDialog, ConfirmDialog } from './SimpleDialog';

interface User {
  id: string;
  name: string;
  email: string;
  role:
    | 'admin'
    | 'qa_lead'
    | 'qa_engineer'
    | 'developer'
    | 'product_manager'
    | 'ui_ux_designer'
    | 'viewer';
  status: 'active' | 'inactive';
  joinedDate: string;
  lastActive: string;
  specialPermissions?: string[];
}

interface UserFormData {
  name: string;
  email: string;
  role: User['role'];
  status: User['status'];
  specialPermissions: string[];
}

const ROLE_CONFIG = ROLE_DISPLAY_CONFIG;

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canManageUsers, setCanManageUsers] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);

  // Dialog states
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [successData, setSuccessData] = useState<{ password: string } | null>(null);
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'qa_engineer',
    status: 'active',
    specialPermissions: [],
  });

  // Load users on mount
  useEffect(() => {
    loadUsers();
    // Check if current user has manage_users permission
    setCanManageUsers(authService.hasPermission('manage_users'));
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = authService.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await userServiceClient.listUsers({
        token,
        page: 1,
        pageSize: 100,
      });

      const formattedUsers: User[] = response.users.map((u: BackendUser) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as User['role'],
        status: u.status as User['status'],
        joinedDate: new Date(u.joinedDate).toISOString().split('T')[0],
        lastActive: formatRelativeTime(u.lastActive),
        specialPermissions: formatPermissionsDisplay(u.specialPermissions || []),
      }));

      setUsers(formattedUsers);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const handleAddUser = () => {
    setShowAddForm(true);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'qa_engineer',
      status: 'active',
      specialPermissions: [],
    });
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowAddForm(true);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      specialPermissions: user.specialPermissions || [],
    });
  };

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const length = 12;
    let retVal = '';

    const randomValues = new Uint32Array(length);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(randomValues);
      for (let i = 0; i < length; i++) {
        retVal += charset[randomValues[i] % charset.length];
      }
    } else {
      // Fallback (less secure)
      for (let i = 0; i < length; i++) {
        retVal += charset.charAt(Math.floor(Math.random() * charset.length));
      }
    }

    return retVal;
  };

  const handleSaveUser = async () => {
    try {
      setIsActionLoading(true);
      const token = authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      // Convert display permissions back to API format
      const apiPermissions = formatPermissionsApi(formData.specialPermissions);

      if (editingUser) {
        // Update existing user
        await userServiceClient.updateUser({
          token,
          userId: editingUser.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          specialPermissions: apiPermissions,
        });
      } else {
        // Create new user with generated password
        const generatedPassword = generatePassword();
        await userServiceClient.createUser({
          token,
          name: formData.name,
          email: formData.email,
          password: generatedPassword,
          role: formData.role,
          specialPermissions: apiPermissions,
        });

        // Show success dialog with generated password
        setSuccessData({ password: generatedPassword });
      }

      setShowAddForm(false);
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      console.error('Save user failed:', err);
      setErrorModal(err.message || 'Failed to save user');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setDeleteConfirmation({ id: user.id, name: user.name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;

    try {
      setIsActionLoading(true);
      const token = authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      await userServiceClient.deleteUser(token, deleteConfirmation.id);
      setDeleteConfirmation(null); // Clear dialog first
      await loadUsers(); // Then reload users
    } catch (err: any) {
      console.error('Delete user failed:', err);
      setErrorModal(err.message || 'Failed to delete user');
      setDeleteConfirmation(null); // Close dialog on error too
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const token = authService.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const user = users.find((u) => u.id === id);
      if (!user) return;

      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await userServiceClient.updateUserStatus(token, id, newStatus);
      await loadUsers();
    } catch (err: any) {
      console.error('Toggle status failed:', err);
      setErrorModal(err.message || 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleStats = () => {
    const stats: Record<string, number> = { all: users.length };
    users.forEach((user) => {
      stats[user.role] = (stats[user.role] || 0) + 1;
    });
    return stats;
  };

  const roleStats = getRoleStats();

  const getAllAvailablePermissions = (): string[] => {
    return [
      'Manage users and roles',
      'Manage QA team members',
      'Full access to all test cases',
      'Create and edit test cases',
      'Execute manual and automated tests',
      'Execute automated tests',
      'Record test results',
      'Manage configurations',
      'Manage test configurations',
      'Review and approve test cases',
      'Export reports',
      'Manage integrations (Git, Jira, etc)',
    ];
  };

  // Loading state
  if (loading) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading users...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 bg-slate-950 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={loadUsers} className="bg-blue-600 hover:bg-blue-700">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-400" />
            User Management
          </h1>
          <p className="text-slate-400">Manage users and role-based access control</p>
        </div>
        {canManageUsers && (
          <Button
            onClick={handleAddUser}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add New User
          </Button>
        )}
      </div>

      {/* Role Stats */}
      <div className="grid grid-cols-7 gap-4 mb-6">
        <div
          className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all ${
            selectedRole === 'all'
              ? 'border-blue-500 ring-2 ring-blue-500/20'
              : 'border-slate-800 hover:border-slate-700'
          }`}
          onClick={() => setSelectedRole('all')}
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-slate-400" />
            <span className="text-2xl text-slate-200">{roleStats.all || 0}</span>
          </div>
          <p className="text-sm text-slate-400">All Users</p>
        </div>

        {Object.entries(ROLE_CONFIG).map(([roleKey, roleInfo]) => (
          <div
            key={roleKey}
            className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all ${
              selectedRole === roleKey
                ? 'border-blue-500 ring-2 ring-blue-500/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
            onClick={() => setSelectedRole(roleKey)}
          >
            <div className="flex items-center justify-between mb-2">
              <Shield className={`w-5 h-5 ${roleInfo.color.split(' ')[1]}`} />
              <span className="text-2xl text-slate-200">{roleStats[roleKey] || 0}</span>
            </div>
            <p className="text-sm text-slate-400">{roleInfo.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 mb-6">
          <h2 className="mb-6 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter full name"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="user@company.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Role *</label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as User['role'] })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Object.entries(ROLE_CONFIG).map(([roleKey, roleInfo]) => (
                  <option key={roleKey} value={roleKey}>
                    {roleInfo.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                {ROLE_CONFIG[formData.role].description}
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as User['status'] })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Permission Preview */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <h3 className="text-sm mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              Permissions for {ROLE_CONFIG[formData.role].label}
            </h3>
            <ul className="space-y-2">
              {ROLE_CONFIG[formData.role].permissions.map((permission, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-slate-400"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  {permission}
                </li>
              ))}
            </ul>
          </div>

          {/* Special Permissions */}
          <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
            <h3 className="text-sm mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              Special Permissions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {getAllAvailablePermissions().map((permission, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.specialPermissions.includes(permission)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          specialPermissions: [
                            ...formData.specialPermissions,
                            permission,
                          ],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          specialPermissions: formData.specialPermissions.filter(
                            (p) => p !== permission,
                          ),
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <p className="text-sm text-slate-400">{permission}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddForm(false)}
              disabled={isActionLoading}
              className="bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:border-slate-500 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!formData.name || !formData.email || isActionLoading}
            >
              {isActionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingUser ? (
                'Update User'
              ) : (
                'Add User'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-slate-400">User</th>
                <th className="px-6 py-4 text-left text-sm text-slate-400">Role</th>
                <th className="px-6 py-4 text-left text-sm text-slate-400">Status</th>
                <th className="px-6 py-4 text-left text-sm text-slate-400">Joined</th>
                <th className="px-6 py-4 text-left text-sm text-slate-400">Last Active</th>
                <th className="px-6 py-4 text-left text-sm text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm text-slate-200">{user.name}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Badge className={`${ROLE_CONFIG[user.role].color} border`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {ROLE_CONFIG[user.role].label}
                      </Badge>
                      {user.specialPermissions &&
                        user.specialPermissions.length > 0 && (
                          <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 border">
                            <Sparkles className="w-3 h-3 mr-1" />
                            +{user.specialPermissions.length} Special
                          </Badge>
                        )}
                      <button
                        onClick={() =>
                          setShowPermissions(
                            showPermissions === user.id ? null : user.id,
                          )
                        }
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        {showPermissions === user.id
                          ? 'Hide Permissions'
                          : 'View Permissions'}
                      </button>
                    </div>
                    {showPermissions === user.id && (
                      <div className="mt-3 space-y-3">
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <p className="text-xs text-slate-400 mb-2">
                            Base Permissions:
                          </p>
                          <ul className="space-y-1">
                            {ROLE_CONFIG[user.role].permissions.map(
                              (permission, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-xs text-slate-500"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                                  {permission}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                        {user.specialPermissions &&
                          user.specialPermissions.length > 0 && (
                            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/30">
                              <p className="text-xs text-purple-400 mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Special Permissions:
                              </p>
                              <ul className="space-y-1">
                                {user.specialPermissions.map(
                                  (permission, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start gap-2 text-xs text-purple-300"
                                    >
                                      <CheckCircle2 className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                                      {permission}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </div>
                          )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggleStatus(user.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs border transition-colors ${
                        user.status === 'active'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                          : 'bg-slate-500/20 text-slate-400 border-slate-500/30 hover:bg-slate-500/30'
                      }`}
                    >
                      {user.status === 'active' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {user.status === 'active' ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(user.joinedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-400">{user.lastActive}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {canManageUsers && (
                        <>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {/* HIDE DELETE FOR ADMIN USERS */}
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteClick(user)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No users found</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteConfirmation}
        title="Delete User"
        message={
          <>
            Are you sure you want to delete{' '}
            <span className="text-white font-semibold">
              {deleteConfirmation?.name}
            </span>
            ? This action cannot be undone.
          </>
        }
        confirmLabel={isActionLoading ? 'Deleting...' : 'Delete User'}
        cancelLabel="Cancel"
        confirmClass="bg-red-600 hover:bg-red-700 text-white"
        isLoading={isActionLoading}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation(null)}
      />

      {/* Success Dialog with Password */}
      <SimpleDialog
        isOpen={!!successData}
        title={
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            User Created Successfully
          </div>
        }
        onClose={() => setSuccessData(null)}
        footer={
          <Button
            onClick={() => setSuccessData(null)}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
          >
            Done
          </Button>
        }
      >
        <div>
          <p className="text-slate-400 mb-4">
            The user has been created. Please share these credentials securely.
          </p>
          
          {successData && (
            <div className="space-y-4 my-2">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-500 mb-2">Generated Password:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-900 p-3 rounded border border-slate-800 text-blue-400 font-mono text-lg text-center tracking-wider">
                    {successData.password}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(successData.password);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors"
                    title="Copy password"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-400" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-start gap-3 text-xs text-amber-400 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  This password will only be shown once. Make sure to copy it now or save it in
                  a password manager.
                </p>
              </div>
            </div>
          )}
        </div>
      </SimpleDialog>

      {/* Error Dialog */}
      <SimpleDialog
        isOpen={!!errorModal}
        title={
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-5 h-5" />
            Error
          </div>
        }
        onClose={() => setErrorModal(null)}
        footer={
          <Button
            onClick={() => setErrorModal(null)}
            className="bg-slate-800 hover:bg-slate-700 text-white"
          >
            Close
          </Button>
        }
      >
        <div>
          <p className="text-slate-400 mb-4">
            An error occurred while processing your request.
          </p>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
            {errorModal}
          </div>
        </div>
      </SimpleDialog>
    </div>
  );
}
