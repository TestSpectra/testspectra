import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, Clock, Key, Save, Edit2, CheckCircle2, GitBranch, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { formatPermissionsDisplay, ROLE_CONFIG } from '../utils/permissions';

interface AccountPageProps {
  currentUser: any;
  onUpdateProfile: (data: any) => Promise<any>;
}

export function AccountPage({ currentUser, onUpdateProfile }: AccountPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser.name,
  });
  
  // Reset form data when currentUser changes (e.g. after reload)
  useEffect(() => {
    setFormData({
      name: currentUser.name,
    });
  }, [currentUser]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      await onUpdateProfile(formData);
      setIsEditing(false);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 3000); // Hide success message after 3 seconds
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Could add error state and display here
    } finally {
      setIsLoading(false);
    }
  };

  const roleInfo = ROLE_CONFIG[currentUser.role as keyof typeof ROLE_CONFIG];
  const displayBasePermissions = formatPermissionsDisplay(currentUser.basePermissions || []);
  const displaySpecialPermissions = formatPermissionsDisplay(currentUser.specialPermissions || []);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
                <p className="text-slate-200 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {currentUser.email}
                </p>
                {isEditing && (
                  <p className="text-xs text-slate-500 mt-1 italic">
                    Email cannot be changed. Please contact administrator for email changes.
                  </p>
                )}
              </div>

              {updateSuccess && !isEditing && (
                <div className="flex items-center gap-2 text-green-400 mt-4 bg-green-500/10 p-3 rounded-lg border border-green-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Profile updated successfully!</span>
                </div>
              )}
              
              {isEditing && (
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({ name: currentUser.name, email: currentUser.email });
                    }}
                    variant="outline"
                    className="bg-transparent border-slate-600 text-slate-100 hover:bg-slate-800 hover:border-slate-500 hover:text-white"
                    disabled={isLoading}
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
                  {displayBasePermissions.map((permission: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {permission}
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Permissions */}
              {displaySpecialPermissions.length > 0 && (
                <div>
                  <label className="block text-sm text-slate-400 mb-3">Special Permissions (Extended)</label>
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4 space-y-2">
                    {displaySpecialPermissions.map((permission: string, index: number) => (
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
