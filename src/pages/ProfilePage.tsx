import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostWithProfile } from "@/hooks/usePosts";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { Edit3, Loader2, ArrowLeft, Calendar, Link as LinkIcon, UserPlus, UserCheck, Trash2, LogOut, MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import EditProfileDialog from "@/components/EditProfileDialog";
import FollowsList from "@/components/FollowsList";

import { useFollow } from "@/hooks/useFollow";

interface ProfileData {
    id: string;
    user_id: string;
    username: string;
    display_name: string;
    bio: string;
    avatar_url: string;
    created_at: string;
}

const ProfilePage = () => {
    const { username } = useParams<{ username: string }>();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [posts, setPosts] = useState<PostWithProfile[]>([]);
    const [loading, setLoading] = useState(true);

    const [followsModalOpen, setFollowsModalOpen] = useState(false);
    const [followsModalType, setFollowsModalType] = useState<"followers" | "following">("followers");
    const { user } = useAuth();
    const navigate = useNavigate();

    // Use our new professional hook
    const { isFollowing, toggleFollow, stats, refresh: refreshFollows } = useFollow(profile?.user_id);

    const fetchData = async () => {
        if (!username) return;

        try {
            setLoading(true);

            // 1. Fetch Profile
            const { data: p, error: pError } = await supabase
                .from("profiles")
                .select("*")
                .eq("username", username.toLowerCase())
                .single();

            if (pError) throw pError;
            if (!p) throw new Error("Profile not found");
            setProfile(p as ProfileData);

            // 2. Fetch Posts
            const { data: postsData } = await supabase
                .from("posts")
                .select(`
                  id, content, code, tags, created_at, user_id,
                  profiles ( username, display_name, avatar_url )
                `)
                .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
                .eq("user_id", p.user_id)
                .order("created_at", { ascending: false });

            if (postsData && p) {
                const postIds = postsData.map(post => post.id);

                // Fetch likes counts
                const { data: likesData } = await supabase
                    .from("likes")
                    .select("post_id")
                    .in("post_id", postIds);

                const likesCounts: Record<string, number> = {};
                (likesData || []).forEach((l: any) => {
                    likesCounts[l.post_id] = (likesCounts[l.post_id] || 0) + 1;
                });

                // Fetch user's likes
                let userLikes: Set<string> = new Set();
                if (user) {
                    const { data: myLikes } = await supabase
                        .from("likes")
                        .select("post_id")
                        .eq("user_id", user.id)
                        .in("post_id", postIds);
                    userLikes = new Set((myLikes || []).map((l: any) => l.post_id));
                }

                const enriched = postsData.map(post => ({
                    ...post,
                    profiles: post.profiles as any,
                    likes_count: likesCounts[post.id] || 0,
                    user_liked: userLikes.has(post.id),
                    user_bookmarked: false,
                    comments_count: 0
                } as PostWithProfile));
                setPosts(enriched);
            }

        } catch (err: any) {
            console.error("Error fetching profile:", err);
            toast.error("Profile not found");
            navigate("/");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [username, user]);

    const handleLike = async (postId: string, currentlyLiked: boolean) => {
        if (!user) {
            toast.error("Please sign in to like posts");
            return;
        }

        // Optimistic update
        setPosts((prev) =>
            prev.map((p) => {
                if (p.id === postId) {
                    return {
                        ...p,
                        user_liked: !currentlyLiked,
                        likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1,
                    };
                }
                return p;
            })
        );

        try {
            if (currentlyLiked) {
                await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId);
            } else {
                await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
            }
        } catch (err) {
            // Revert on error
            setPosts((prev) =>
                prev.map((p) => {
                    if (p.id === postId) {
                        return {
                            ...p,
                            user_liked: currentlyLiked,
                            likes_count: currentlyLiked ? p.likes_count + 1 : p.likes_count - 1,
                        };
                    }
                    return p;
                })
            );
            toast.error("Failed to update like");
        }
    };

    const handleDelete = async (postId: string) => {
        if (!user) return;

        // Optimistic update
        const originalPosts = [...posts];
        setPosts((prev) => prev.filter((p) => p.id !== postId));

        try {
            const { error } = await supabase
                .from("posts")
                .delete()
                .eq("id", postId)
                .eq("user_id", user.id);

            if (error) throw error;
            toast.success("Post deleted");
        } catch (err) {
            setPosts(originalPosts);
            toast.error("Failed to delete post");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin" size={32} />
                </div>
            </div>
        );
    }


    if (!profile) return null;

    const initials = profile.display_name.substring(0, 2).toUpperCase();
    const isOwnProfile = user?.id === profile.user_id;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>{profile.display_name} (@{profile.username}) — genjutsu</title>
                <meta name="description" content={profile.bio || `Check out ${profile.display_name}'s profile on genjutsu.`} />
                <meta property="og:title" content={`${profile.display_name} (@${profile.username}) — genjutsu`} />
                <meta property="og:description" content={profile.bio || `Check out ${profile.display_name}'s profile on genjutsu.`} />
                <meta property="og:image" content={profile.avatar_url || "/fav.jpg"} />
            </Helmet>
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
                    <div className="space-y-4">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-2 px-3 py-1.5 gum-card bg-secondary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors w-fit"
                        >
                            <ArrowLeft size={14} />
                            Back to Home
                        </Link>
                        <div className="gum-card overflow-hidden mb-8">
                            <div className="h-32 bg-secondary" />
                            <div className="px-6 pb-6 relative">
                                <div className="absolute -top-12 left-6">
                                    <div className="w-24 h-24 rounded-[3px] gum-border-4 border-background bg-primary text-primary-foreground flex items-center justify-center text-3xl font-bold shadow-xl overflow-hidden">
                                        {profile.avatar_url ? (
                                            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
                                        ) : initials}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4">
                                    {isOwnProfile ? (
                                        <EditProfileDialog
                                            currentProfile={{
                                                display_name: profile.display_name,
                                                bio: profile.bio,
                                                avatar_url: profile.avatar_url
                                            }}
                                            onUpdate={fetchData}
                                        />
                                    ) : (
                                        <button
                                            onClick={toggleFollow}
                                            className={`gum-btn text-sm px-6 ${isFollowing ? 'bg-secondary' : 'bg-primary text-primary-foreground'}`}
                                        >
                                            {isFollowing ? 'Following' : 'Follow'}
                                        </button>
                                    )}
                                </div>

                                <div className="mt-8">
                                    <h1 className="text-2xl font-bold tracking-tight">{profile.display_name}</h1>
                                    <p className="text-muted-foreground">@{profile.username}</p>
                                </div>

                                <p className="mt-4 text-sm leading-relaxed max-w-xl">
                                    {profile.bio || "No bio yet."}
                                </p>

                                <div className="flex flex-wrap gap-4 mt-6 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={16} />
                                        <span>Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>

                                <div className="flex gap-6 mt-6">
                                    <button
                                        onClick={() => {
                                            setFollowsModalType("following");
                                            setFollowsModalOpen(true);
                                        }}
                                        className="hover:underline flex items-center gap-1.5"
                                    >
                                        <span className="font-bold text-foreground">{stats.following}</span>
                                        <span className="text-muted-foreground text-sm">Following</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFollowsModalType("followers");
                                            setFollowsModalOpen(true);
                                        }}
                                        className="hover:underline flex items-center gap-1.5"
                                    >
                                        <span className="font-bold text-foreground">{stats.followers}</span>
                                        <span className="text-muted-foreground text-sm">Followers</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h2 className="font-bold text-lg px-2">Posts</h2>
                            {posts.length === 0 ? (
                                <div className="gum-card p-12 text-center text-muted-foreground text-sm">
                                    No posts yet.
                                </div>
                            ) : (
                                posts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onLike={handleLike}
                                        onBookmark={() => { }}
                                        onDelete={handleDelete}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    <div className="hidden lg:block">
                        <Sidebar />
                    </div>
                </div>
            </main>

            {profile && (
                <FollowsList
                    userId={profile.user_id}
                    type={followsModalType}
                    isOpen={followsModalOpen}
                    onOpenChange={setFollowsModalOpen}
                    onAction={refreshFollows}
                />
            )}
        </div>
    );
};

export default ProfilePage;
