"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User,
  Store,
  Lock,
  Bell,
  AlertTriangle,
  Save,
  Loader2,
  Camera,
  Phone,
  MapPin,
  Shield,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";

interface PharmacyProfile {
  id: string;
  full_name: string;
  email: string;
  pharmacy_name?: string;
  phone?: string;
  address?: string;
  license_number?: string;
  avatar_url?: string;
}

export default function PharmacySettingsPage() {
  const { user, profile, loading, refreshProfile } = useUser();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "pharmacy" | "security" | "notifications">("profile");

  // Profile state
  const [profileData, setProfileData] = useState<PharmacyProfile>({
    id: "",
    full_name: "",
    email: "",
    pharmacy_name: "",
    phone: "",
    address: "",
    license_number: "",
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
    pushInventory: true,
    smsAlerts: false,
  });

// Load pharmacy profile data
  const loadProfile = useCallback(async () => {
    if (!user) return;
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    // Get pharmacy details from profiles table or create default
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
      pharmacy_name: data?.pharmacy_name || "",
      phone: data?.phone || "",
      address: data?.address || "",
      license_number: data?.license_number || "",
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
      <div className="settings-loading-container">
        <div className="settings-loading-content">
          <Loader2 className="settings-loading-spinner" />
          <p className="settings-loading-text">Loading settings...</p>
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
        pharmacy_name: profileData.pharmacy_name,
        phone: profileData.phone,
        address: profileData.address,
        license_number: profileData.license_number,
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
      "This is your final warning. All orders, inventory, and chat history will be permanently deleted. Type 'DELETE' to confirm."
    );

    if (!doubleConfirmed) return;

    setSaving(true);
    
    // Note: Account deletion would typically require a server-side function
    // This is a placeholder for the actual implementation
    toast.error("Account deletion must be done through admin panel or contact support");
    
    setSaving(false);
  };

  type TabId = "profile" | "pharmacy" | "security" | "notifications";
  
  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "pharmacy", label: "Pharmacy Info", icon: Store },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  if (loading) {
    return (
      <div className="settings-loading-container">
        <div className="settings-loading-content">
          <Loader2 className="settings-loading-spinner" />
          <p className="settings-loading-text">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="settings-container"
    >
      {/* Header */}
      <div className="settings-header">
        <div>
          <h1 className="settings-title">Account Settings</h1>
          <p className="settings-subtitle">
            Manage your profile, pharmacy details, and preferences
          </p>
        </div>
      </div>

      <div className="settings-layout">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          <Card className="settings-tabs">
            <CardContent>
              <nav className="settings-tab-list">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`settings-tab-button ${
                        activeTab === tab.id
                          ? "settings-tab-active"
                          : "settings-tab-inactive"
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
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="settings-section"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="settings-card-title">
                    <User className="w-5 h-5 text-[var(--primary)]" />
                    Personal Information
                  </CardTitle>
                  <CardDescription className="settings-card-description">
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="settings-card-content">
                  {/* Avatar */}
                  <div className="settings-avatar-container">
                    <div className="settings-avatar">
                      {profileData.full_name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <div className="settings-avatar-info">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Camera className="w-4 h-4" />
                        Change Avatar
                      </Button>
                      <p className="settings-avatar-hint">
                        JPG, PNG or GIF. Max size 2MB.
                      </p>
                    </div>
                  </div>

                  <div className="settings-form-grid">
                    <div className="settings-form-group">
                      <label className="settings-form-label">
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
                    <div className="settings-form-group">
                      <label className="settings-form-label">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="settings-form-disabled"
                      />
                      <p className="settings-form-hint">
                        Contact support to change email
                      </p>
                    </div>
                  </div>

                  <div className="settings-form-divider">
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

          {/* Pharmacy Tab */}
          {activeTab === "pharmacy" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="settings-section"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="settings-card-title">
                    <Store className="w-5 h-5 text-[var(--primary)]" />
                    Pharmacy Details
                  </CardTitle>
                  <CardDescription className="settings-card-description">
                    Information about your pharmacy that customers will see
                  </CardDescription>
                </CardHeader>
                <CardContent className="settings-card-content">
                  <div className="settings-form-grid">
                    <div className="settings-form-group">
                      <label className="settings-form-label">
                        Pharmacy Name
                      </label>
                      <Input
                        value={profileData.pharmacy_name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, pharmacy_name: e.target.value })
                        }
                        placeholder="e.g., City Care Pharmacy"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-form-label-with-icon">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) =>
                          setProfileData({ ...profileData, phone: e.target.value })
                        }
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label-with-icon">
                      <MapPin className="w-4 h-4" />
                      Address
                    </label>
                    <Input
                      value={profileData.address}
                      onChange={(e) =>
                        setProfileData({ ...profileData, address: e.target.value })
                      }
                      placeholder="Full address including street, city, state, zip"
                    />
                  </div>

                  <div className="settings-form-group">
                    <label className="settings-form-label-with-icon">
                      <Shield className="w-4 h-4" />
                      License Number
                    </label>
                    <Input
                      value={profileData.license_number}
                      onChange={(e) =>
                        setProfileData({ ...profileData, license_number: e.target.value })
                      }
                      placeholder="Pharmacy license number"
                    />
                  </div>

                  <div className="settings-form-divider">
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
                      Save Pharmacy Info
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
              className="settings-section"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="settings-card-title">
                    <Lock className="w-5 h-5 text-[var(--primary)]" />
                    Change Password
                  </CardTitle>
                  <CardDescription className="settings-card-description">
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="settings-card-content">
                  <div className="space-y-4 max-w-md">
                    <div className="settings-form-group">
                      <label className="settings-form-label">
                        Current Password
                      </label>
                      <Input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="settings-form-group">
                      <label className="settings-form-label">
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
                    <div className="settings-form-group">
                      <label className="settings-form-label">
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
              <Card className="settings-danger-card">
                <CardHeader>
                  <CardTitle className="settings-danger-title">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="settings-card-description">
                    Irreversible and destructive actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="settings-danger-content">
                    <div>
                      <h4 className="settings-danger-heading">Delete Account</h4>
                      <p className="settings-danger-description">
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
              className="settings-section"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="settings-card-title">
                    <Bell className="w-5 h-5 text-[var(--primary)]" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription className="settings-card-description">
                    Choose how you want to be notified
                  </CardDescription>
                </CardHeader>
                <CardContent className="settings-card-content">
                  <div className="space-y-4">
                    <h4 className="font-medium text-[var(--text-main)]">Email Notifications</h4>
                    
                    <div className="settings-notification-item py-3 border-b border-[var(--border)]">
                      <div className="settings-notification-label">
                        <p className="settings-notification-title">New Orders</p>
                        <p className="settings-notification-description">
                          Receive email when a new order is placed
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailOrders}
                        onChange={(checked: boolean) =>
                          setNotifications({ ...notifications, emailOrders: checked })
                        }
                      />
                    </div>

                    <div className="settings-notification-item py-3 border-b border-[var(--border)]">
                      <div className="settings-notification-label">
                        <p className="settings-notification-title">Marketing & Updates</p>
                        <p className="settings-notification-description">
                          Receive promotional emails and product updates
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
                    
                    <div className="settings-notification-item py-3 border-b border-[var(--border)]">
                      <div className="settings-notification-label">
                        <p className="settings-notification-title">Order Updates</p>
                        <p className="settings-notification-description">
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

                    <div className="settings-notification-item py-3 border-b border-[var(--border)]">
                      <div className="settings-notification-label">
                        <p className="settings-notification-title">Low Stock Alerts</p>
                        <p className="settings-notification-description">
                          Get notified when inventory items are running low
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushInventory}
                        onChange={(checked: boolean) =>
                          setNotifications({ ...notifications, pushInventory: checked })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-[var(--text-main)]">SMS Notifications</h4>
                    
                    <div className="settings-notification-item py-3">
                      <div className="settings-notification-label">
                        <p className="settings-notification-title">Critical Alerts</p>
                        <p className="settings-notification-description">
                          Receive SMS for urgent pharmacy alerts
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

                  <div className="settings-form-divider">
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
