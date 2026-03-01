import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EditProfileDialogProps {
    currentProfile: {
        display_name: string;
        bio: string;
        avatar_url: string;
    };
    onUpdate: () => void;
}

const EditProfileDialog = ({ currentProfile, onUpdate }: EditProfileDialogProps) => {
    const [displayName, setDisplayName] = useState(currentProfile.display_name);
    const [bio, setBio] = useState(currentProfile.bio || "");
    const [avatarUrl, setAvatarUrl] = useState(currentProfile.avatar_url || "");
    const [submitting, setSubmitting] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!displayName.trim()) {
            toast.error("Display name is required");
            return;
        }

        try {
            setSubmitting(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { error } = await supabase
                .from("profiles")
                .update({
                    display_name: displayName,
                    bio: bio,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", user.id);

            if (error) throw error;

            toast.success("Profile updated successfully!");
            setOpen(false);
            onUpdate();
        } catch (error: any) {
            console.error("Error updating profile:", error);
            toast.error(error.message || "Failed to update profile");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="gum-btn border-2 border-foreground flex items-center gap-2 text-sm">
                    <Edit3 size={16} /> Edit Profile
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] gum-card border-2 border-foreground p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-secondary border-b-2 border-foreground">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        <Edit3 size={20} /> Edit Profile
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="displayName" className="font-bold">Display Name</Label>
                        <Input
                            id="displayName"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="gum-border focus-visible:ring-primary"
                            placeholder="Your display name"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bio" className="font-bold">Bio</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="gum-border focus-visible:ring-primary min-h-[100px]"
                            placeholder="Tell us about yourself..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="avatarUrl" className="font-bold">Avatar URL</Label>
                        <Input
                            id="avatarUrl"
                            value={avatarUrl}
                            onChange={(e) => setAvatarUrl(e.target.value)}
                            className="gum-border focus-visible:ring-primary"
                            placeholder="https://example.com/avatar.png"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">
                            Provide a direct link to an image.
                        </p>
                    </div>
                    <DialogFooter className="pt-4 gap-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="px-4 py-2 text-sm font-bold border-2 border-foreground rounded-lg hover:bg-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="gum-btn bg-primary text-primary-foreground px-6 py-2 flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditProfileDialog;
