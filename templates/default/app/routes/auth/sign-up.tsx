import { useState } from "react";
import { Link, useNavigate } from "react-router";
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
import { signIn, signUp } from "~/services/auth/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(input: {
	email: string;
	password: string;
}): string | null {
	if (!EMAIL_RE.test(input.email.trim())) {
		return "Enter a valid email address";
	}
	if (input.password.length < 8) {
		return "Password must be at least 8 characters";
	}
	return null;
}

export default function AuthSignUp() {
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const validationError = validateForm({ email, password });
		if (validationError) {
			setError(validationError);
			return;
		}
		setError(null);
		setPending(true);
		try {
			const result = await signUp.email({
				name: email.trim(),
				email: email.trim(),
				password,
				callbackURL: "/",
			});
			if (result.error) {
				setError(result.error.message ?? "Could not create account");
				return;
			}
			void navigate("/", { replace: true });
		} finally {
			setPending(false);
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-semibold">Create an account</CardTitle>
					<CardDescription>Enter your details to get started</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete="new-password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								minLength={8}
								disabled={pending}
							/>
						</div>
						{error ? <p className="text-sm text-destructive">{error}</p> : null}
						<Button type="submit" className="w-full" disabled={pending}>
							{pending ? "Creating account…" : "Sign up"}
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
							onClick={() =>
								void signIn.social({
									provider: "github",
									callbackURL: "/",
								})
							}
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
							onClick={() =>
								void signIn.social({
									provider: "google",
									callbackURL: "/",
								})
							}
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
						Already have an account?{" "}
						<Link to="/auth/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
							Sign in
						</Link>
					</span>
				</CardFooter>
			</Card>
		</div>
	);
}
