import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setProfile(data as Profile | null);
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Pick<Profile, "display_name" | "bio" | "avatar_url">>) => {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", user.id);
    if (!error) {
      setProfile((prev) => prev ? { ...prev, ...updates } : prev);
    }
    return { error };
  };

  return { profile, loading, updateProfile };
}
