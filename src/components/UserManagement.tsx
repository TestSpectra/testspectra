import { useState } from 'react';
import { Users, Plus, Search, Edit2, Trash2, Shield, Mail, Calendar, CheckCircle2, XCircle, UserPlus, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'qa_lead' | 'qa_engineer' | 'developer' | 'product_manager' | 'ui_ux_designer' | 'viewer';
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

const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    description: 'Full system access and user management',
    permissions: [
      'View all data',
      'Manage users and roles',
      'Full access to all test cases',
      'Execute all tests',
      'Manage configurations',
      'Export reports',
    ],
  },
  qa_lead: {
    label: 'QA Lead',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    description: 'Lead QA team and manage test strategies',
    permissions: [
      'View all data',
      'Manage QA team members',
      'Full access to all test cases',
      'Execute all tests',
      'Manage test configurations',
      'Export reports',
    ],
  },
  qa_engineer: {
    label: 'QA Engineer',
    color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    description: 'Create and execute test cases',
    permissions: [
      'View all data',
      'Create and edit test cases',
      'Execute manual and automated tests',
      'Record test results',
    ],
  },
  developer: {
    label: 'Developer',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    description: 'Execute automated tests and manage configurations',
    permissions: [
      'View all data',
      'Execute automated tests',
      'Manage test configurations',
    ],
  },
  product_manager: {
    label: 'Product Manager',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    description: 'View test coverage and quality metrics',
    permissions: [
      'View all data',
      'Export reports',
    ],
  },
  ui_ux_designer: {
    label: 'UI/UX Designer',
    color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    description: 'Generate test cases and view run history',
    permissions: [
      'View all data',
      'Full access to all test cases',
      'Export reports',
    ],
  },
  viewer: {
    label: 'Viewer',
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    description: 'Read-only access to test information',
    permissions: [
      'View all data',
    ],
  },
};

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'Ahmad Rizki',
      email: 'ahmad.rizki@company.com',
      role: 'admin',
      status: 'active',
      joinedDate: '2024-01-15',
      lastActive: '2 hours ago',
    },
    {
      id: '2',
      name: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@company.com',
      role: 'qa_lead',
      status: 'active',
      joinedDate: '2024-02-01',
      lastActive: '1 day ago',
    },
    {
      id: '3',
      name: 'Budi Santoso',
      email: 'budi.santoso@company.com',
      role: 'qa_engineer',
      status: 'active',
      joinedDate: '2024-03-10',
      lastActive: '3 hours ago',
    },
    {
      id: '4',
      name: 'Dewi Lestari',
      email: 'dewi.lestari@company.com',
      role: 'qa_engineer',
      status: 'active',
      joinedDate: '2024-03-15',
      lastActive: '5 hours ago',
    },
    {
      id: '5',
      name: 'Eko Prasetyo',
      email: 'eko.prasetyo@company.com',
      role: 'developer',
      status: 'active',
      joinedDate: '2024-02-20',
      lastActive: '1 hour ago',
      specialPermissions: [
        'Manage QA team members',
      ],
    },
    {
      id: '6',
      name: 'Fitri Handayani',
      email: 'fitri.handayani@company.com',
      role: 'product_manager',
      status: 'active',
      joinedDate: '2024-01-20',
      lastActive: '2 days ago',
    },
    {
      id: '7',
      name: 'Gita Savitri',
      email: 'gita.savitri@company.com',
      role: 'ui_ux_designer',
      status: 'active',
      joinedDate: '2024-03-05',
      lastActive: '4 hours ago',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    role: 'qa_engineer',
    status: 'active',
    specialPermissions: [],
  });

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

  const handleSaveUser = () => {
    if (editingUser) {
      // Update existing user
      setUsers(users.map(u => 
        u.id === editingUser.id 
          ? { ...u, ...formData }
          : u
      ));
    } else {
      // Add new user
      const newUser: User = {
        id: Date.now().toString(),
        ...formData,
        joinedDate: new Date().toISOString().split('T')[0],
        lastActive: 'Just now',
      };
      setUsers([...users, newUser]);
    }
    setShowAddForm(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleToggleStatus = (id: string) => {
    setUsers(users.map(u => 
      u.id === id 
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const getRoleStats = () => {
    const stats: Record<string, number> = { all: users.length };
    users.forEach(user => {
      stats[user.role] = (stats[user.role] || 0) + 1;
    });
    return stats;
  };

  const roleStats = getRoleStats();

  // Get available special permissions (permissions from other roles that current role doesn't have)
  const getAvailableSpecialPermissions = (currentRole: User['role']): string[] => {
    const currentPermissions = ROLE_CONFIG[currentRole].permissions;
    const allOtherPermissions = new Set<string>();
    
    // Collect all permissions from all roles
    Object.entries(ROLE_CONFIG).forEach(([roleKey, roleConfig]) => {
      if (roleKey !== currentRole) {
        roleConfig.permissions.forEach(permission => {
          // Only add if current role doesn't have this permission
          if (!currentPermissions.includes(permission)) {
            allOtherPermissions.add(permission);
          }
        });
      }
    });
    
    return Array.from(allOtherPermissions).sort();
  };

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
        <Button 
          onClick={handleAddUser}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-7 gap-4 mb-6">
        <div 
          className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all ${
            selectedRole === 'all' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'
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
              selectedRole === roleKey ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-800 hover:border-slate-700'
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

      {/* Search Bar */}
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

      {/* Add/Edit User Form */}
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Email Address *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@company.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
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
                onChange={(e) => setFormData({ ...formData, status: e.target.value as User['status'] })}
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
                <li key={index} className="flex items-start gap-2 text-sm text-slate-400">
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
              {getAvailableSpecialPermissions(formData.role).map((permission, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.specialPermissions.includes(permission)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          specialPermissions: [...formData.specialPermissions, permission],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          specialPermissions: formData.specialPermissions.filter(p => p !== permission),
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
              className="bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:border-slate-500 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUser}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!formData.name || !formData.email}
            >
              {editingUser ? 'Update User' : 'Add User'}
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
                <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
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
                      {user.specialPermissions && user.specialPermissions.length > 0 && (
                        <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30 border">
                          <Sparkles className="w-3 h-3 mr-1" />
                          +{user.specialPermissions.length} Special
                        </Badge>
                      )}
                      <button
                        onClick={() => setShowPermissions(showPermissions === user.id ? null : user.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        {showPermissions === user.id ? 'Hide' : 'View'} Permissions
                      </button>
                    </div>
                    {showPermissions === user.id && (
                      <div className="mt-3 space-y-3">
                        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <p className="text-xs text-slate-400 mb-2">Base Permissions:</p>
                          <ul className="space-y-1">
                            {ROLE_CONFIG[user.role].permissions.map((permission, index) => (
                              <li key={index} className="flex items-start gap-2 text-xs text-slate-500">
                                <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                                {permission}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {user.specialPermissions && user.specialPermissions.length > 0 && (
                          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg p-3 border border-purple-500/30">
                            <p className="text-xs text-purple-400 mb-2 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              Special Permissions:
                            </p>
                            <ul className="space-y-1">
                              {user.specialPermissions.map((permission, index) => (
                                <li key={index} className="flex items-start gap-2 text-xs text-purple-300">
                                  <CheckCircle2 className="w-3 h-3 text-purple-400 flex-shrink-0 mt-0.5" />
                                  {permission}
                                </li>
                              ))}
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
                        day: 'numeric' 
                      })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-400">{user.lastActive}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
    </div>
  );
}