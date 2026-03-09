![banner](./main.png)

**Live App: https://genjutsu-social.vercel.app**

`genjutsu` is a social network for developers where everything disappears after 24 hours.

share code, post updates, connect with other builders. no permanent history, no follower counts, no clout chasing. just a daily feed that resets every morning.

<img src="./fav.jpg" width="70" />

## why 24 hours?

most social platforms accumulate posts forever. your late-night takes, half-baked ideas, and experimental code snippets stay online permanently. genjutsu is different.

every post, comment, and message automatically deletes after 24 hours. this means:
- you can post freely without worrying about your permanent record
- the feed stays fresh and relevant
- storage and database costs stay minimal
- performance stays fast no matter how many users join

think snapchat meets twitter, but built for developers.

## features

- **ephemeral posts** - everything vanishes in 24 hours, no exceptions
- **code sharing** - native markdown parser optimized for sharing snippets and technical content with syntax highlighting (`react-syntax-highlighter`)
- **realtime hub** - see new posts, notifications, and mentions as they happen via Supabase realtime subscriptions
- **whispers** - direct messages and private chats that also disappear after 24 hours
- **genjutsu play** - realtime multiplayer mini games.`
- **admin dashboard** - moderation panel for admins to review posts, users, and manage the platform
- **user mentions & notifications** - ping other developers using `@username` in posts or comments and get live alerts
- **customizable profiles** - display names, banners, customizable avatars, and social links
- **tags & search** - organize content by hashtags and click tags to instantly search
- **dark mode** - fully customized dark/light mode thematic UI

## tech stack

- **frontend:** react 18 + typescript + vite
- **styling:** tailwindcss + shadcn/ui components (radix-ui) + framer motion
- **state & data:** react query (`@tanstack/react-query`) + react hook form + zod
- **backend:** supabase (database + auth + storage + realtime)
- **hosting:** vercel

### architecture highlights

- **rls protection:** extensive row level security (rls) for data access control and fine-grained permissions
- **post cleanup:** `pg_cron` jobs automatically wipe data and storage buckets after 24 hours
- **realtime subscriptions:** fully synced live updates for feeds and direct messages
- **optimized queries:** proper indexing and pagination for efficient data loading
- **secure auth flow:** supports both email/password with confirmation flows and oauth (github/google)

## contributing

want to contribute? see [CONTRIBUTING.md](CONTRIBUTING.md) for setup and guidelines.

## why open source?

building a social network is hard. building it alone is harder. by making genjutsu open source:

- you can see exactly how your data is handled
- you can contribute features you want
- you can learn from real production code
- you can self-host if you want

plus, the best developer tools are built by developers, for developers.

## license

mit - see [LICENSE](../LICENSE) file

## support

- create an issue for bugs or feature requests
- join discussions in the issues tab

## acknowledgments

built with:
- supabase for the backend infrastructure
- shadcn/ui for the component library
- vercel for hosting

---

made by developers who got tired of their old tweets haunting them.

### screenshots

![screenshot 1](./screenshots/1.png)

![screenshot 2](./screenshots/2.png)

![screenshot 3](./screenshots/3.png)

![screenshot 4](./screenshots/4.png)

![screenshot 5](./screenshots/5.png)

![screenshot 6](./screenshots/6.png)

![screenshot 7](./screenshots/7.png)

<img src="./fav.jpg" width="70" />