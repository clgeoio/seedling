import { useState } from "react";
import { Link } from "react-router";
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
import { authClient } from "~/services/auth/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AuthForgetPassword() {
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const [pending, setPending] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!EMAIL_RE.test(email.trim())) {
			setError("Enter a valid email address");
			return;
		}
		setError(null);
		setPending(true);
		try {
			const resetUrl = `${window.location.origin}/auth/reset-password`;
			const result = await authClient.requestPasswordReset({
				email: email.trim(),
				redirectTo: resetUrl,
			});
			if (result.error) {
				setError(result.error.message ?? "Could not send reset email");
				return;
			}
			setSuccess(true);
		} finally {
			setPending(false);
		}
	}

	if (success) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
						<CardDescription>
							If an account exists for {email}, we sent a link to reset your password.
						</CardDescription>
					</CardHeader>
					<CardFooter>
						<Button variant="outline" className="w-full" asChild>
							<Link to="/auth/sign-in">Back to sign in</Link>
						</Button>
					</CardFooter>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-semibold">Forgot password</CardTitle>
					<CardDescription>We will email you a link to reset your password</CardDescription>
				</CardHeader>
				<CardContent>
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
						{error ? <p className="text-sm text-destructive">{error}</p> : null}
						<Button type="submit" className="w-full" disabled={pending}>
							{pending ? "Sending…" : "Send reset link"}
						</Button>
					</form>
				</CardContent>
				<CardFooter className="flex justify-center text-sm text-muted-foreground">
					<Link to="/auth/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
						Back to sign in
					</Link>
				</CardFooter>
			</Card>
		</div>
	);
}
