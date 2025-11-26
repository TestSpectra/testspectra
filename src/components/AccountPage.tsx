import { useState } from 'react';
import { User, Mail, Shield, Calendar, Clock, Key, Save, Edit2, CheckCircle2, GitBranch } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface AccountPageProps {
  currentUser: any;
  onUpdateProfile: (data: any) => void;
}

export function AccountPage({ currentUser, onUpdateProfile }: AccountPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
  });

  const handleSave = () => {
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const ROLE_CONFIG: Record<string, any> = {
    admin: {
      label: 'Admin',
      color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      description: 'Full system access and user management',
    },
    qa_lead: {
      label: 'QA Lead',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      description: 'Lead QA team and manage test strategies',
    },
    qa_engineer: {
      label: 'QA Engineer',
      color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      description: 'Create and execute test cases',
    },
    developer: {
      label: 'Developer',
      color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      description: 'Execute automated tests and view results',
    },
    product_manager: {
      label: 'Product Manager',
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
      description: 'View test coverage and quality metrics',
    },
    ui_ux_designer: {
      label: 'UI/UX Designer',
      color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      description: 'View designs and test UI/UX flows',
    },
    viewer: {
      label: 'Viewer',
      color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      description: 'Read-only access to test information',
    },
  };

  const roleInfo = ROLE_CONFIG[currentUser.role];

  return (
    <div className="p-8 bg-slate-950 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 flex items-center gap-3">
          <User className="w-8 h-8 text-blue-400" />
          My Account
        </h1>
        <p className="text-slate-400">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="col-span-2 space-y-6">
          {/* Personal Info Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                Personal Information
              </h2>
              {!isEditing && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:border-slate-500 hover:text-white"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-slate-200">{currentUser.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-slate-200 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-500" />
                    {currentUser.email}
                  </p>
                )}
              </div>

              {isEditing && (
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ name: currentUser.name, email: currentUser.email });
                    }}
                    variant="outline"
                    className="bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:border-slate-500 hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Role & Permissions Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Role & Permissions
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Your Role</label>
                <Badge className={`${roleInfo.color} border text-base px-4 py-2`}>
                  <Shield className="w-4 h-4 mr-2" />
                  {roleInfo.label}
                </Badge>
                <p className="text-sm text-slate-500 mt-2">{roleInfo.description}</p>
              </div>

              {/* Base Permissions */}
              <div>
                <label className="block text-sm text-slate-400 mb-3">Base Permissions</label>
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                  {currentUser.basePermissions?.map((permission: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {permission}
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Permissions */}
              {currentUser.specialPermissions && currentUser.specialPermissions.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-400 mb-3">Special Permissions (Extended)</label>
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4 space-y-2">
                    {currentUser.specialPermissions.map((permission: string, index: number) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-purple-300">
                        <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                        {permission}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Git Integration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="mb-6 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-blue-400" />
              Git Integration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Git Username</label>
                <p className="text-slate-200">{currentUser.gitUsername || currentUser.name}</p>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Git Email</label>
                <p className="text-slate-200">{currentUser.gitEmail || currentUser.email}</p>
              </div>
              <p className="text-xs text-slate-500">
                Git profile is automatically synced from your local Git configuration
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Account Stats */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Account Details
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Member Since</p>
                <p className="text-sm text-slate-300">
                  {new Date(currentUser.joinedDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Last Active</p>
                <p className="text-sm text-slate-300 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {currentUser.lastActive}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Account Status</p>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 border">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" />
              Security
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:border-slate-500 hover:text-white justify-start"
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:border-slate-500 hover:text-white justify-start"
              >
                <Shield className="w-4 h-4 mr-2" />
                Two-Factor Auth
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
