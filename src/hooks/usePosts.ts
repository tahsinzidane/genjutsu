import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface PostWithProfile {
  id: string;
  content: string;
  code: string | null;
  tags: string[];
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
  likes_count: number;
  user_liked: boolean;
  user_bookmarked: boolean;
  comments_count: number;
}

export function usePosts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const { data: postsData, error } = await supabase
        .from("posts")
        .select(`
          id, content, code, tags, created_at, user_id,
          profiles ( username, display_name, avatar_url )
        `)
        .gt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching posts:", error);
        setLoading(false);
        return;
      }

      if (!postsData) {
        setLoading(false);
        return;
      }

      // Fetch likes counts
      const postIds = postsData.map((p: any) => p.id);

      const { data: likesData } = await supabase
        .from("likes")
        .select("post_id")
        .in("post_id", postIds);

      const likesCounts: Record<string, number> = {};
      (likesData || []).forEach((l: any) => {
        likesCounts[l.post_id] = (likesCounts[l.post_id] || 0) + 1;
      });

      // Fetch user's likes & bookmarks
      let userLikes: Set<string> = new Set();
      let userBookmarks: Set<string> = new Set();

      if (user) {
        const { data: myLikes } = await supabase
          .from("likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds);
        userLikes = new Set((myLikes || []).map((l: any) => l.post_id));

        const { data: myBookmarks } = await supabase
          .from("bookmarks")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds);
        userBookmarks = new Set((myBookmarks || []).map((b: any) => b.post_id));
      }

      const enriched: PostWithProfile[] = postsData.map((p: any) => ({
        id: p.id,
        content: p.content,
        code: p.code,
        tags: p.tags || [],
        created_at: p.created_at,
        user_id: p.user_id,
        profiles: p.profiles,
        likes_count: likesCounts[p.id] || 0,
        user_liked: userLikes.has(p.id),
        user_bookmarked: userBookmarks.has(p.id),
        comments_count: 0,
      }));

      setPosts(enriched);
      setLoading(false);
    } catch (err) {
      console.error("Critical error in fetchPosts:", err);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("posts-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => {
        fetchPosts();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const createPost = async (content: string, code: string, tags: string[]) => {
    if (!user) return { error: "Not authenticated" };
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content,
      code: code || "",
      tags,
    });

    if (!error) {
      await fetchPosts();
    }

    return { error };
  };

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
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
        const { error } = await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", postId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
        if (error) throw error;
      }
    } catch (err) {
      // Revert optimistic update on error
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
      console.error(err);
    }
  };

  const toggleBookmark = async (postId: string, currentlyBookmarked: boolean) => {
    if (!user) return;
    if (currentlyBookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("post_id", postId);
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, post_id: postId });
    }
  };

  const deletePost = async (postId: string) => {
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
      // Revert if failed
      setPosts(originalPosts);
      toast.error("Failed to delete post");
      console.error("Delete error:", err);
    }
  };

  return { posts, loading, createPost, toggleLike, toggleBookmark, deletePost, refetch: fetchPosts };
}
