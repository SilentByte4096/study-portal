// app/settings/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Trash2, Palette, Clock, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UserPreferences {
  theme: string;
  studyGoalMinutes: number;
  notifications: boolean;
  emailNotifications: boolean;
  defaultView: string;
  autoSave: boolean;
  pomodoroFocus: number;
  pomodoroBreak: number;
  pomodoroLongBreak: number;
}

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const router = useRouter();
  
  // Profile Settings
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  
  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // User Preferences
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'system',
    studyGoalMinutes: 120,
    notifications: true,
    emailNotifications: true,
    defaultView: 'grid',
    autoSave: true,
    pomodoroFocus: 25,
    pomodoroBreak: 5,
    pomodoroLongBreak: 15
  });
  
  // Loading states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
      // Load user preferences if available
      if (user.preferences) {
        setPreferences({
          theme: user.preferences.theme || 'system',
          studyGoalMinutes: user.preferences.studyGoalMinutes || 120,
          notifications: user.preferences.notifications !== false,
          emailNotifications: user.preferences.emailNotifications !== false,
          defaultView: user.preferences.defaultView || 'grid',
          autoSave: user.preferences.autoSave !== false,
          pomodoroFocus: 25, // These would come from user.preferences if available
          pomodoroBreak: 5,
          pomodoroLongBreak: 15
        });
      }
    }
  }, [user]);
  
  const updateProfileInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });
      
      if (response.ok) {
        await updateProfile(profileData);
        toast.success('Profile updated successfully!');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };
  
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (response.ok) {
        toast.success('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const updatePreferences = async () => {
    setPreferencesLoading(true);
    
    try {
      const response = await fetch('/api/auth/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        toast.success('Preferences updated successfully!');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update preferences');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update preferences');
    } finally {
      setPreferencesLoading(false);
    }
  };
  
  const deleteAccount = async () => {
    setDeleteLoading(true);
    
    try {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast.success('Account deleted successfully');
        await logout();
        router.push('/');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete account');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold"
      >
        Settings
      </motion.h1>
      
      <div className="grid gap-6 max-w-4xl">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateProfileInfo} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                </Badge>
              </div>
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Study Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Study Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Daily Study Goal (minutes)</Label>
                <Input
                  type="number"
                  min="15"
                  max="720"
                  value={preferences.studyGoalMinutes}
                  onChange={(e) => setPreferences({ ...preferences, studyGoalMinutes: parseInt(e.target.value) || 120 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Default View</Label>
                <Select value={preferences.defaultView} onValueChange={(value) => setPreferences({ ...preferences, defaultView: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid View</SelectItem>
                    <SelectItem value="list">List View</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pomodoro Timer Settings
              </h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Focus Time (minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="90"
                    value={preferences.pomodoroFocus}
                    onChange={(e) => setPreferences({ ...preferences, pomodoroFocus: parseInt(e.target.value) || 25 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Short Break (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="30"
                    value={preferences.pomodoroBreak}
                    onChange={(e) => setPreferences({ ...preferences, pomodoroBreak: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Long Break (minutes)</Label>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    value={preferences.pomodoroLongBreak}
                    onChange={(e) => setPreferences({ ...preferences, pomodoroLongBreak: parseInt(e.target.value) || 15 })}
                  />
                </div>
              </div>
            </div>
            
            <Button onClick={updatePreferences} disabled={preferencesLoading}>
              {preferencesLoading ? 'Updating...' : 'Update Preferences'}
            </Button>
          </CardContent>
        </Card>
        
        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              App Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={preferences.theme} onValueChange={(value) => setPreferences({ ...preferences, theme: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive app notifications for study reminders</p>
                </div>
                <Button
                  variant={preferences.notifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreferences({ ...preferences, notifications: !preferences.notifications })}
                >
                  {preferences.notifications ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive study progress emails</p>
                </div>
                <Button
                  variant={preferences.emailNotifications ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreferences({ ...preferences, emailNotifications: !preferences.emailNotifications })}
                >
                  {preferences.emailNotifications ? 'On' : 'Off'}
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto Save</Label>
                  <p className="text-xs text-muted-foreground">Automatically save your work</p>
                </div>
                <Button
                  variant={preferences.autoSave ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPreferences({ ...preferences, autoSave: !preferences.autoSave })}
                >
                  {preferences.autoSave ? 'On' : 'Off'}
                </Button>
              </div>
            </div>
            
            <Button onClick={updatePreferences} disabled={preferencesLoading}>
              {preferencesLoading ? 'Updating...' : 'Update Preferences'}
            </Button>
          </CardContent>
        </Card>
        
        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
              <p className="text-sm text-red-700 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              
              {!showDeleteConfirm ? (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-800">
                    Are you absolutely sure? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteAccount}
                      disabled={deleteLoading}
                    >
                      {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
