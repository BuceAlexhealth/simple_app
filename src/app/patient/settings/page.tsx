"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User,
  Lock,
  Bell,
  AlertTriangle,
  Save,
  Loader2,
  Camera,
  Phone,
  MapPin,
  Trash2,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";

interface PatientProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  avatar_url?: string;
}

export default function PatientSettingsPage() {
  const { user, profile, loading, refreshProfile } = useUser();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications">("profile");

  // Profile state
  const [profileData, setProfileData] = useState<PatientProfile>({
    id: "",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    avatar_url: "",
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailMarketing: false,
    pushOrders: true,
    smsAlerts: false,
  });

  // Load patient profile data
  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error loading profile:", error);
    }

    setProfileData({
      id: user.id,
      full_name: data?.full_name || profile?.full_name || "",
      email: authUser?.email || "",
      phone: data?.phone || "",
      address: data?.address || "",
      date_of_birth: data?.date_of_birth || "",
      avatar_url: data?.avatar_url || "",
    });
  }, [user, profile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile();
  }, [loadProfile]);

  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  // Guard for unauthenticated users
  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-[var(--text-muted)]">Please log in to access settings</p>
        </div>
      </div>
    );
  }

  // Save profile changes
  const handleSaveProfile = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: profileData.id,
        full_name: profileData.full_name,
        phone: profileData.phone,
        address: profileData.address,
        date_of_birth: profileData.date_of_birth,
        avatar_url: profileData.avatar_url,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast.error("Failed to save profile");
      console.error(error);
    } else {
      toast.success("Profile updated successfully");
      await refreshProfile();
    }
    
    setSaving(false);
  };

  // Change password
  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    
    const { error } = await supabase.auth.updateUser({
      password: passwordData.newPassword,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
    
    setSaving(false);
  };

  // Delete account
  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted."
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      "This is your final warning. All orders and chat history will be permanently deleted."
    );

    if (!doubleConfirmed) return;

    setSaving(true);
    toast.error("Account deletion must be done through admin panel or contact support");
    setSaving(false);
  };

  type TabId = "profile" | "security" | "notifications";
  
  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Settings className="w-5 h-5 text-[var(--primary)]" />
            <span className="text-sm font-medium text-[var(--primary)]">Settings</span>
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-main)]">Account Settings</h1>
          <p className="text-[var(--text-muted)] mt-1">
            Manage your profile and preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardContent className="p-2">
              <nav className="flex flex-col gap-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${
                        activeTab === tab.id
                          ? "bg-[var(--primary)] text-[var(--text-inverse)] shadow-md"
                          : "text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-[var(--primary)]" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-[var(--text-inverse)] text-2xl font-bold">
                      {(profileData.full_name || "P").charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Camera className="w-4 h-4" />
                        Change Avatar
                      </Button>
                      <p className="text-xs text-[var(--text-muted)] mt-2">
                        JPG, PNG or GIF. Max size 2MB.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-muted)]">
                        Full Name
                      </label>
                      <Input
                        value={profileData.full_name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, full_name: e.target.value })
                        }
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-muted)]">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="bg-[var(--surface-bg)]"
                      />
                      <p className="text-xs text-[var(--text-muted)]">
                        Contact support to change email
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-muted)]">
                        <span className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          Phone Number
                        </span>
                      </label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-muted)]">
                        Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={profileData.date_of_birth}
                        onChange={(e) =>
                          setProfileData({ ...profileData, date_of_birth: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-muted)]">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Address
                      </span>
                    </label>
                    <Input
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({ ...profileData, address: e.target.value })
                      }
                      placeholder="Full address"
                    />
                  </div>

                  <div className="pt-4 border-t border-[var(--border)]">
                    <Button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="gap-2"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[var(--primary)]" />
                    Change Password
                  </CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-muted)]">
                        New Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-muted)]">
                        Confirm New Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border)]">
                    <Button
                      onClick={handleChangePassword}
                      disabled={saving || !passwordData.newPassword}
                      className="gap-2"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                      Update Password
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription>
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <h4 className="font-semibold text-red-600">Delete Account</h4>
                      <p className="text-sm text-red-600/80 mt-1">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[var(--primary)]" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Choose how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-[var(--text-main)]">Email Notifications</h4>
                    
                    <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                      <div>
                        <p className="font-medium text-[var(--text-main)]">Order Updates</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          Receive email when your order status changes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailOrders}
                        onChange={(checked: boolean) =>
                          setNotifications({ ...notifications, emailOrders: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                      <div>
                        <p className="font-medium text-[var(--text-main)]">Marketing & Updates</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          Receive promotional emails and health tips
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailMarketing}
                        onChange={(checked: boolean) =>
                          setNotifications({ ...notifications, emailMarketing: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-[var(--text-main)]">Push Notifications</h4>
                    
                    <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
                      <div>
                        <p className="font-medium text-[var(--text-main)]">Order Updates</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          Get notified about order status changes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushOrders}
                        onChange={(checked: boolean) =>
                          setNotifications({ ...notifications, pushOrders: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-[var(--text-main)]">SMS Notifications</h4>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-[var(--text-main)]">Critical Alerts</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          Receive SMS for urgent medication reminders
                        </p>
                      </div>
                      <Switch
                        checked={notifications.smsAlerts}
                        onChange={(checked: boolean) =>
                          setNotifications({ ...notifications, smsAlerts: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border)]">
                    <Button
                      onClick={() => toast.success("Notification preferences saved")}
                      disabled={saving}
                      className="gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
