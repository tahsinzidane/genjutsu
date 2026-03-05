import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Sparkles, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { z } from "zod";
import { Helmet } from "react-helmet-async";

const signUpSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, underscores"),
  displayName: z.string().trim().min(1, "Display name is required").max(100),
});

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email address").max(255),
  password: z.string().min(1, "Password is required").max(72),
});

const AuthPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      if (isSignUp) {
        const parsed = signUpSchema.parse({ email, password, username, displayName });
        const { error } = await signUp(parsed.email, parsed.password, parsed.username, parsed.displayName);
        if (error) {
          if (error.message?.includes("already registered")) {
            setError("This email is already registered. Try signing in instead.");
          } else {
            setError(error.message || "Sign up failed");
          }
        } else {
          setSuccess("Check your email to confirm your account, then sign in!");
        }
      } else {
        const parsed = signInSchema.parse({ email, password });
        const { error } = await signIn(parsed.email, parsed.password);
        if (error) {
          if (error.message?.includes("Invalid login")) {
            setError("Invalid email or password.");
          } else if (error.message?.includes("Email not confirmed")) {
            setError("Please confirm your email before signing in.");
          } else {
            setError(error.message || "Sign in failed");
          }
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 text-foreground">
      <Helmet>
        <title>Join genjutsu — Everything Vanishes</title>
        <meta name="description" content="Sign in or create an account to start sharing your code in the 24-hour social network." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative"
      >
        <button
          onClick={() => navigate("/")}
          className="absolute -top-12 left-0 inline-flex items-center gap-2 px-3 py-1.5 gum-card bg-secondary text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors w-fit"
        >
          <ArrowLeft size={14} />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-[3px] gum-border mx-auto mb-4 overflow-hidden">
            <img src="/fav.jpg" alt="genjutsu" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">genjutsu</h1>
          <p className="text-muted-foreground mt-1 text-sm">Everything vanishes. Social media for developers.</p>
        </div>

        <div className="gum-card p-6">
          <div className="flex mb-6">
            {["Sign In", "Sign Up"].map((tab, i) => (
              <button
                key={tab}
                onClick={() => { setIsSignUp(i === 1); setError(""); setSuccess(""); }}
                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${(i === 0 && !isSignUp) || (i === 1 && isSignUp)
                  ? "bg-primary text-primary-foreground gum-shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="cooldev42"
                    className="w-full px-4 py-2.5 bg-background gum-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Cool Developer"
                    className="w-full px-4 py-2.5 bg-background gum-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@dev.com"
                className="w-full px-4 py-2.5 bg-background gum-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-foreground/20"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-background gum-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-foreground/20 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm bg-destructive/10 text-destructive px-3 py-2 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm bg-primary/10 text-foreground px-3 py-2 rounded-lg gum-border">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full gum-btn bg-primary text-primary-foreground text-sm py-3 disabled:opacity-50"
            >
              {submitting ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            onClick={async () => {
              setGoogleLoading(true);
              setError("");
              const { error } = await signInWithGoogle();
              if (error) {
                setError(error.message || "Google sign-in failed");
                setGoogleLoading(false);
              }
            }}
            disabled={googleLoading}
            className="w-full gum-btn bg-background gum-border text-sm py-3 flex items-center justify-center gap-3 hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
