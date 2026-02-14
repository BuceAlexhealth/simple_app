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
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { InviteShareCard } from "@/components/pharmacy/InviteShareCard";

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

export default function PharmacyAccountPage() {
  const { user, profile, loading, refreshProfile } = useUser();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "pharmacy" | "security" | "notifications">("profile");

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

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailMarketing: false,
    pushOrders: true,
    pushInventory: true,
    smsAlerts: false,
  });

  const loadProfile = useCallback(async () => {
    if (!user) return;
    
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-[var(--text-muted)]">Please log in to access account</p>
        </div>
      </div>
    );
  }

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
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }
    
    setSaving(false);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Are you sure you want to delete your account? This action cannot be undone.");
    if (!confirmed) return;
    toast.error("Account deletion must be done through admin panel or contact support");
  };

  type TabId = "profile" | "pharmacy" | "security" | "notifications";
  
  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "pharmacy", label: "Pharmacy Info", icon: Store },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-main)]">Account</h1>
        <p className="text-[var(--text-muted)] mt-1">Manage your profile, pharmacy details, and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <Card className="border-[var(--border)]">
            <CardContent className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? "bg-[var(--primary)] text-[var(--text-inverse)]"
                          : "text-[var(--text-muted)] hover:bg-[var(--surface-bg)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
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
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-[var(--primary)]" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-[var(--text-inverse)] text-2xl font-semibold">
                      {profileData.full_name?.charAt(0)?.toUpperCase() || "P"}
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Camera className="w-4 h-4" />
                      Change Avatar
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-main)]">Full Name</label>
                      <Input
                        value={profileData.full_name}
                        onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                        placeholder="Your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-main)]">Email Address</label>
                      <Input value={profileData.email} disabled />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Pharmacy Tab */}
          {activeTab === "pharmacy" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <InviteShareCard />
              
              <Card className="border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="w-5 h-5 text-[var(--primary)]" />
                    Pharmacy Details
                  </CardTitle>
                  <CardDescription>Information about your pharmacy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-main)]">Pharmacy Name</label>
                      <Input
                        value={profileData.pharmacy_name}
                        onChange={(e) => setProfileData({ ...profileData, pharmacy_name: e.target.value })}
                        placeholder="e.g., City Care Pharmacy"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-[var(--text-main)]">Phone Number</label>
                      <Input
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-main)]">Address</label>
                    <Input
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      placeholder="Full address"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-main)]">License Number</label>
                    <Input
                      value={profileData.license_number}
                      onChange={(e) => setProfileData({ ...profileData, license_number: e.target.value })}
                      placeholder="Pharmacy license number"
                    />
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Pharmacy Info
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <Card className="border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[var(--primary)]" />
                    Change Password
                  </CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-main)]">New Password</label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--text-main)]">Confirm Password</label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button onClick={handleChangePassword} disabled={saving || !passwordData.newPassword} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    Update Password
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-5 h-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--text-main)]">Delete Account</p>
                      <p className="text-sm text-[var(--text-muted)]">Permanently delete your account</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDeleteAccount} className="gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="border-[var(--border)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[var(--primary)]" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-[var(--text-main)]">Email Notifications</h4>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-[var(--text-main)]">New Orders</p>
                        <p className="text-sm text-[var(--text-muted)]">Receive email when order is placed</p>
                      </div>
                      <Switch checked={notifications.emailOrders} onChange={(c) => setNotifications({ ...notifications, emailOrders: c })} />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-[var(--text-main)]">Marketing</p>
                        <p className="text-sm text-[var(--text-muted)]">Promotional emails</p>
                      </div>
                      <Switch checked={notifications.emailMarketing} onChange={(c) => setNotifications({ ...notifications, emailMarketing: c })} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-[var(--text-main)]">Push Notifications</h4>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-[var(--text-main)]">Order Updates</p>
                        <p className="text-sm text-[var(--text-muted)]">Order status changes</p>
                      </div>
                      <Switch checked={notifications.pushOrders} onChange={(c) => setNotifications({ ...notifications, pushOrders: c })} />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-[var(--text-main)]">Low Stock Alerts</p>
                        <p className="text-sm text-[var(--text-muted)]">Inventory warnings</p>
                      </div>
                      <Switch checked={notifications.pushInventory} onChange={(c) => setNotifications({ ...notifications, pushInventory: c })} />
                    </div>
                  </div>

                  <Button onClick={() => toast.success("Preferences saved")} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save Preferences
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
