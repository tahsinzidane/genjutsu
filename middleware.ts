// Social media bots that need OG tags
const BOT_AGENTS = [
    "facebookexternalhit",
    "facebot",
    "twitterbot",
    "linkedinbot",
    "whatsapp",
    "slackbot",
    "telegrambot",
    "discordbot",
    "pinterestbot",
    "embedly",
    "quora link preview",
    "showyoubot",
    "outbrain",
    "rogerbot",
    "vkshare",
    "instagram",
];

export default async function middleware(request: Request) {
    const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Skip static files & assets (anything with a dot = file extension)
    if (pathname.includes(".") || pathname.startsWith("/api") || pathname.startsWith("/_")) {
        return;
    }

    // Only intercept dynamic routes
    const isProfileRoute = /^\/[a-zA-Z0-9_]+$/.test(pathname);
    const isPostRoute = /^\/post\/[a-zA-Z0-9-]+$/.test(pathname);

    if (!isProfileRoute && !isPostRoute) {
        return; // not a dynamic route, pass through
    }

    // Skip known static page routes
    const staticRoutes = ["about", "terms", "privacy", "auth"];
    if (isProfileRoute && staticRoutes.includes(pathname.slice(1))) {
        return; // pass through to SPA
    }

    // Check if request is from a social media bot
    const isBot = BOT_AGENTS.some((bot) => userAgent.includes(bot));

    if (!isBot) {
        return; // pass through to SPA for real users
    }

    // Bot detected on a dynamic route → fetch from OG API
    const ogUrl = new URL("/api/og", request.url);
    ogUrl.searchParams.set("path", pathname.slice(1));

    return fetch(ogUrl.toString(), {
        headers: { "Content-Type": "text/html" },
    });
}
