import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const SITE_URL = "https://genjutsu-social.vercel.app";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateHTML(meta: {
  title: string;
  description: string;
  image: string;
  url: string;
}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}" />

  <!-- Open Graph -->
  <meta property="og:title" content="${meta.title}" />
  <meta property="og:description" content="${meta.description}" />
  <meta property="og:image" content="${meta.image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:url" content="${meta.url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="genjutsu" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${meta.title}" />
  <meta name="twitter:description" content="${meta.description}" />
  <meta name="twitter:image" content="${meta.image}" />

  <!-- Redirect real users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${meta.url}" />
</head>
<body>
  <p>Redirecting to <a href="${meta.url}">${meta.title}</a>...</p>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(req: any, res: any) {
  const { path } = req.query;
  const pathname = Array.isArray(path) ? `/${path.join("/")}` : `/${path || ""}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");

  try {
    // Match profile page: /:username
    const profileMatch = pathname.match(/^\/([a-zA-Z0-9_]+)$/);
    // Match post page: /post/:postId
    const postMatch = pathname.match(/^\/post\/([a-zA-Z0-9-]+)$/);

    if (postMatch) {
      const postId = postMatch[1];
      const { data: post } = await supabase
        .from("posts")
        .select("id, content, created_at, user_id, profiles ( username, display_name, avatar_url )")
        .eq("id", postId)
        .single();

      if (post && post.profiles) {
        const profile = post.profiles as any;
        const contentPreview = escapeHtml(post.content.substring(0, 120));
        return res.status(200).send(
          generateHTML({
            title: `${profile.display_name}: "${contentPreview}${post.content.length > 120 ? "..." : ""}" — genjutsu`,
            description: escapeHtml(post.content.substring(0, 200)),
            image: profile.avatar_url || DEFAULT_OG_IMAGE,
            url: `${SITE_URL}/post/${postId}`,
          })
        );
      }
    }

    if (profileMatch) {
      const username = profileMatch[1];

      // Skip known static routes
      if (["about", "terms", "privacy", "auth", "post"].includes(username)) {
        return res.status(200).send(
          generateHTML({
            title: `genjutsu — ${username.charAt(0).toUpperCase() + username.slice(1)}`,
            description: "The social network where everything vanishes after 24 hours.",
            image: DEFAULT_OG_IMAGE,
            url: `${SITE_URL}/${username}`,
          })
        );
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, bio, avatar_url")
        .eq("username", username)
        .single();

      if (profile) {
        return res.status(200).send(
          generateHTML({
            title: `${escapeHtml(profile.display_name)} (@${escapeHtml(profile.username)}) — genjutsu`,
            description: escapeHtml(profile.bio || `Check out ${profile.display_name}'s profile on genjutsu.`),
            image: profile.avatar_url || DEFAULT_OG_IMAGE,
            url: `${SITE_URL}/${username}`,
          })
        );
      }
    }

    // Default fallback
    return res.status(200).send(
      generateHTML({
        title: "genjutsu — Everything Vanishes",
        description: "The social network where everything vanishes after 24 hours. Share code, connect with developers.",
        image: DEFAULT_OG_IMAGE,
        url: SITE_URL,
      })
    );
  } catch (error) {
    console.error("OG handler error:", error);
    return res.status(200).send(
      generateHTML({
        title: "genjutsu — Everything Vanishes",
        description: "The social network where everything vanishes after 24 hours.",
        image: DEFAULT_OG_IMAGE,
        url: SITE_URL,
      })
    );
  }
}
