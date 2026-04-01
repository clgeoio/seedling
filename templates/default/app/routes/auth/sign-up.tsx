import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Chrome, Github } from "lucide-react";
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
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/;

function validateForm(input: {
	name: string;
	email: string;
	username: string;
	password: string;
}): string | null {
	if (!input.name.trim()) {
		return "Name is required";
	}
	if (!EMAIL_RE.test(input.email.trim())) {
		return "Enter a valid email address";
	}
	if (!USERNAME_RE.test(input.username.trim())) {
		return "Username must be 3–32 characters (letters, numbers, _ or -)";
	}
	if (input.password.length < 8) {
		return "Password must be at least 8 characters";
	}
	return null;
}

export default function AuthSignUp() {
	const navigate = useNavigate();

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const validationError = validateForm({ name, email, username, password });
		if (validationError) {
			setError(validationError);
			return;
		}
		setError(null);
		setPending(true);
		try {
			const result = await signUp.email({
				name: name.trim(),
				email: email.trim(),
				username: username.trim(),
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
							<Label htmlFor="name">Name</Label>
							<Input
								id="name"
								type="text"
								autoComplete="name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								required
								disabled={pending}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								type="text"
								autoComplete="username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
								minLength={3}
								maxLength={32}
								disabled={pending}
							/>
						</div>
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
