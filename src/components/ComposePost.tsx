import { useState } from "react";
import { Code, ImageIcon, Smile, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

interface ComposePostProps {
  onPost: (content: string, code: string, tags: string[]) => Promise<{ error: any }>;
}

const ComposePost = ({ onPost }: ComposePostProps) => {
  const [content, setContent] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { profile } = useProfile();

  const extractTags = (text: string): string[] => {
    const matches = text.match(/#(\w+)/g);
    return matches ? matches.map((t) => t.slice(1).toLowerCase()) : [];
  };

  const handleSubmit = async () => {
    if (!content.trim() || submitting) return;
    setSubmitting(true);

    try {
      const tags = extractTags(content);
      const cleanContent = content.replace(/#\w+/g, "").trim();
      const { error } = await onPost(cleanContent || content, code, tags);

      if (error) {
        toast.error("Failed to post: " + (error.message || "Unknown error"));
        return;
      }

      setContent("");
      setCode("");
      setShowCode(false);
      toast.success("Post shared!");
    } catch (err: any) {
      toast.error("Something went wrong");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const initials = profile?.display_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="gum-card p-5 mb-6"
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-[3px] gum-border bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share what you're building... (use #tags)"
            className="w-full bg-transparent resize-none outline-none text-sm placeholder:text-muted-foreground min-h-[60px]"
            rows={2}
          />

          {showCode && (
            <div className="mt-3">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste your code here..."
                className="w-full bg-primary text-primary-foreground font-mono text-xs p-3 rounded-lg gum-border resize-none outline-none min-h-[80px]"
                rows={4}
              />
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCode(!showCode)}
                className={`p-2 rounded-lg transition-colors ${showCode ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
                  }`}
              >
                <Code size={16} />
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || submitting}
              className="gum-btn bg-primary text-primary-foreground text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send size={14} />
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ComposePost;
