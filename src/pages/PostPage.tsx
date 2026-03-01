import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostWithProfile } from "@/hooks/usePosts";
import Navbar from "@/components/Navbar";
import PostCard from "@/components/PostCard";
import Sidebar from "@/components/Sidebar";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

const PostPage = () => {
    const { postId } = useParams<{ postId: string }>();
    const [post, setPost] = useState<PostWithProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchPost = async () => {
        if (!postId) return;

        try {
            setLoading(true);
            const { data: p, error } = await supabase
                .from("posts")
                .select(`
          id, content, code, tags, created_at, user_id,
          profiles ( username, display_name, avatar_url )
        `)
                .eq("id", postId)
                .single();

            if (error) throw error;
            if (!p) throw new Error("Post not found");

            // Fetch likes count
            const { count: likesCount } = await supabase
                .from("likes")
                .select("*", { count: 'exact', head: true })
                .eq("post_id", postId);

            // Check if user liked
            let userLiked = false;
            let userBookmarked = false;
            if (user) {
                const { data: likeData } = await supabase
                    .from("likes")
                    .select("id")
                    .eq("post_id", postId)
                    .eq("user_id", user.id)
                    .maybeSingle();
                userLiked = !!likeData;

                const { data: bookmarkData } = await supabase
                    .from("bookmarks")
                    .select("id")
                    .eq("post_id", postId)
                    .eq("user_id", user.id)
                    .maybeSingle();
                userBookmarked = !!bookmarkData;
            }

            setPost({
                ...p,
                profiles: p.profiles as any,
                likes_count: likesCount || 0,
                user_liked: userLiked,
                user_bookmarked: userBookmarked,
                comments_count: 0
            } as PostWithProfile);
        } catch (err: any) {
            console.error("Error fetching post:", err);
            toast.error(err.message || "Failed to load post");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPost();
    }, [postId, user]);

    const handleLike = async (id: string, currentlyLiked: boolean) => {
        if (!user) {
            toast.error("Please sign in to like posts");
            return;
        }

        // Optimistic update
        setPost(prev => prev ? {
            ...prev,
            user_liked: !currentlyLiked,
            likes_count: currentlyLiked ? prev.likes_count - 1 : prev.likes_count + 1
        } : null);

        try {
            if (currentlyLiked) {
                await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", id);
            } else {
                await supabase.from("likes").insert({ user_id: user.id, post_id: id });
            }
        } catch (err) {
            // Revert
            setPost(prev => prev ? {
                ...prev,
                user_liked: currentlyLiked,
                likes_count: currentlyLiked ? prev.likes_count + 1 : prev.likes_count - 1
            } : null);
            toast.error("Failed to update like");
        }
    };

    const handleDelete = async (id: string) => {
        if (!user) return;
        try {
            await supabase.from("posts").delete().eq("id", id).eq("user_id", user.id);
            toast.success("Post deleted");
            navigate("/");
        } catch (err) {
            toast.error("Failed to delete post");
        }
    };

    const pageTitle = post ? `${post.profiles.display_name}: "${post.content.substring(0, 30)}${post.content.length > 30 ? '...' : ''}" — genjutsu` : "Post — genjutsu";
    const pageDesc = post ? post.content.substring(0, 160) : "View this post on genjutsu.";

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDesc} />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDesc} />
                <meta property="og:image" content={post?.profiles?.avatar_url || "/fav.jpg"} />
            </Helmet>
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                    <div>
                        <button
                            onClick={() => navigate("/")}
                            className="inline-flex items-center gap-2 px-3 py-1.5 gum-card bg-secondary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors w-fit mb-6"
                        >
                            <ArrowLeft size={14} />
                            Back to Home
                        </button>

                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="animate-spin" size={24} />
                            </div>
                        ) : !post ? (
                            <div className="gum-card p-8 text-center">
                                <p className="text-muted-foreground text-sm">Post not found.</p>
                                <button
                                    onClick={() => navigate("/")}
                                    className="mt-4 text-primary hover:underline text-sm font-bold"
                                >
                                    Go Home
                                </button>
                            </div>
                        ) : (
                            <PostCard
                                post={post}
                                onLike={handleLike}
                                onBookmark={() => { }}
                                onDelete={handleDelete}
                            />
                        )}
                    </div>
                    <div className="hidden lg:block">
                        <div className="sticky top-20">
                            <Sidebar />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PostPage;
