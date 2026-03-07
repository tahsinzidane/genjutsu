import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import Navbar from "@/components/Navbar";
import { LogOut, ArrowLeft, Shield, Settings, Check, Loader2, AtSign } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { useState, useEffect } from "react";

const SettingsPage = () => {
    const { user, signOut, isAdmin } = useAuth();
    const { profile, changeUsername, getNextUsernameChangeDate } = useProfile();
    const navigate = useNavigate();

    const [newUsername, setNewUsername] = useState("");
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Initialize input with current username
    useEffect(() => {
        if (profile?.username) {
            setNewUsername(profile.username);
        }
    }, [profile?.username]);

    const validateUsername = (value: string): string | null => {
        const normalized = value.trim().toLowerCase();
        if (!normalized) return "Username is required";
        if (normalized.length < 3) return "Must be at least 3 characters";
        if (normalized.length > 20) return "Must be 20 characters or less";
        if (!/^[a-z0-9_]+$/.test(normalized)) return "Only lowercase letters, numbers, and underscores";
        return null;
    };

    const handleUsernameChange = (value: string) => {
        const lower = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
        setNewUsername(lower);
        setUsernameError(validateUsername(lower));
    };

    const handleSaveUsername = async () => {
        const validationError = validateUsername(newUsername);
        if (validationError) {
            setUsernameError(validationError);
            return;
        }

        setIsSaving(true);
        const { error } = await changeUsername(newUsername);
        setIsSaving(false);

        if (error) {
            setUsernameError(error);
            toast.error(error);
        } else {
            setUsernameError(null);
            toast.success("Username updated!");
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success("Signed out successfully");
            navigate("/auth");
        } catch (error) {
            toast.error("Failed to sign out");
        }
    };

    if (!user) {
        navigate("/auth");
        return null;
    }

    const isUsernameChanged = newUsername !== (profile?.username || "");
    const cooldownUntil = getNextUsernameChangeDate();
    const isOnCooldown = !!cooldownUntil;
    const canSave = isUsernameChanged && !usernameError && !isSaving && !isOnCooldown;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>Settings — genjutsu</title>
            </Helmet>
            <Navbar />
            <main className="max-w-4xl mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => navigate("/")}
                            className="p-2 gum-card bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8">
                        <aside className="space-y-1">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary text-primary-foreground rounded-[3px] font-bold gum-shadow-sm text-sm">
                                <Settings size={18} />
                                General
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={() => navigate("/admin")}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-[3px] font-medium text-sm text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <Shield size={18} />
                                    Admin
                                </button>
                            )}
                        </aside>

                        <div className="space-y-6">
                            {/* Account Info */}
                            <section className="gum-card p-6 space-y-6">
                                <div>
                                    <h2 className="text-lg font-bold mb-4">Account</h2>
                                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-[3px] border border-border/50">
                                        <div>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Signed in as</p>
                                            <p className="font-bold">{profile?.display_name || user.email}</p>
                                            <p className="text-sm text-muted-foreground">@{profile?.username || "user"}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-[3px] gum-border bg-secondary flex items-center justify-center font-bold text-lg overflow-hidden">
                                            {profile?.avatar_url ? (
                                                <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                            ) : (profile?.display_name?.[0] || "?")}
                                        </div>
                                    </div>
                                </div>

                                {/* Change Username */}
                                <div className="pt-6 border-t border-border">
                                    <h2 className="text-lg font-bold mb-1">Change Username</h2>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Your profile URL will update to <span className="font-mono text-foreground">genjutsu-social.vercel.app/{newUsername || "..."}</span>
                                    </p>
                                    {isOnCooldown && (
                                        <div className="p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-[3px] text-sm">
                                            <p className="font-bold text-destructive">🔒 Username change on cooldown</p>
                                            <p className="text-muted-foreground text-xs mt-1">
                                                You can change your username again on{" "}
                                                <span className="font-mono text-foreground">
                                                    {cooldownUntil!.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1 relative">
                                            <AtSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={newUsername}
                                                onChange={(e) => handleUsernameChange(e.target.value)}
                                                maxLength={20}
                                                disabled={isOnCooldown}
                                                className={`w-full pl-9 pr-4 py-2.5 bg-background border-2 rounded-[3px] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${usernameError
                                                    ? "border-destructive"
                                                    : isUsernameChanged && !usernameError
                                                        ? "border-green-500"
                                                        : "border-border"
                                                    }`}
                                                placeholder={profile?.username || "username"}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSaveUsername}
                                            disabled={!canSave}
                                            className="gum-btn bg-primary text-primary-foreground text-sm px-6 py-2.5 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                                        >
                                            {isSaving ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : (
                                                <Check size={16} />
                                            )}
                                            {isSaving ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                    {usernameError && (
                                        <p className="text-xs text-destructive mt-2 font-medium">{usernameError}</p>
                                    )}
                                    {isUsernameChanged && !usernameError && (
                                        <p className="text-xs text-green-500 mt-2 font-medium">Looks good!</p>
                                    )}
                                    <p className="text-[11px] text-muted-foreground mt-2">
                                        3–20 characters. Lowercase letters, numbers, and underscores only.
                                    </p>
                                </div>
                            </section>

                            {/* Danger Zone */}
                            <section className="gum-card p-6">
                                <h2 className="text-lg font-bold mb-4 text-destructive">Danger Zone</h2>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Once you log out, you will need to sign in again to access your account and illusions.
                                </p>
                                <button
                                    onClick={handleSignOut}
                                    className="gum-btn bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    <LogOut size={18} />
                                    Log Out of Genjutsu
                                </button>
                            </section>

                            <p className="text-center text-xs text-muted-foreground mt-8">
                                genjutsu — everything vanishes.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
};

export default SettingsPage;
