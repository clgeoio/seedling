import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
// {{#if hasGithub}}
import { Github } from "lucide-react";
// {{/if}}
// {{#if hasGoogle}}
import { Chrome } from "lucide-react";
// {{/if}}
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { signIn } from "~/services/auth/client";

function safeRedirect(to: string, defaultTo = "/"): string {
	if (!to.startsWith("/") || to.startsWith("//")) return defaultTo;
	return to;
}

export default function AuthSignIn() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const redirectTo = safeRedirect(searchParams.get("redirect") ?? "/");

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function handleEmailSignIn(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setPending(true);
		try {
			const result = await signIn.email({
				email,
				password,
				callbackURL: redirectTo,
			});
			if (result.error) {
				setError(result.error.message ?? "Could not sign in");
				return;
			}
			void navigate(redirectTo, { replace: true });
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-semibold">Sign in</CardTitle>
					<CardDescription>Enter your email and password to continue</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form onSubmit={(e) => void handleEmailSignIn(e)} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								autoComplete="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={pending}
							/>
						</div>
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<Label htmlFor="password">Password</Label>
								<Link
									to="/auth/forget-password"
									className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
								>
									Forgot password?
								</Link>
							</div>
							<Input
								id="password"
								type="password"
								autoComplete="current-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								disabled={pending}
							/>
						</div>
						{error ? <p className="text-sm text-destructive">{error}</p> : null}
						<Button type="submit" className="w-full" disabled={pending}>
							{pending ? "Signing in…" : "Sign in"}
						</Button>
					</form>
// {{#if hasSocialAuth}}
					<div className="relative">
						<div className="absolute inset-0 flex items-center">
							<span className="w-full border-t" />
						</div>
						<div className="relative flex justify-center text-xs uppercase">
							<span className="bg-card px-2 text-muted-foreground">Or continue with</span>
						</div>
					</div>
					<div className="grid gap-2">
// {{#if hasGithub}}
						<Button
							type="button"
							variant="outline"
							className="w-full"
							disabled={pending}
							onClick={() => {
								setPending(true);
								void signIn.social({
									provider: "github",
									callbackURL: redirectTo,
								}).catch(() => {
									setError("Could not start GitHub sign-in");
									setPending(false);
								});
							}}
						>
							<Github className="mr-2 size-4" />
							GitHub
						</Button>
// {{/if}}
// {{#if hasGoogle}}
						<Button
							type="button"
							variant="outline"
							className="w-full"
							disabled={pending}
							onClick={() => {
								setPending(true);
								void signIn.social({
									provider: "google",
									callbackURL: redirectTo,
								}).catch(() => {
									setError("Could not start Google sign-in");
									setPending(false);
								});
							}}
						>
							<Chrome className="mr-2 size-4" />
							Google
						</Button>
// {{/if}}
					</div>
// {{/if}}
				</CardContent>
				<CardFooter className="flex justify-center text-sm text-muted-foreground">
					<span>
						No account?{" "}
						<Link
							to={redirectTo !== "/" ? `/auth/sign-up?redirect=${encodeURIComponent(redirectTo)}` : "/auth/sign-up"}
							className="font-medium text-foreground underline-offset-4 hover:underline"
						>
							Sign up
						</Link>
					</span>
				</CardFooter>
			</Card>
		</div>
	);
}
