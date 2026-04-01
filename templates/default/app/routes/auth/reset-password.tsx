import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
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
import { resetPassword } from "~/services/auth/client";

export default function AuthResetPassword() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const token = searchParams.get("token");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!token) {
			setError("Invalid or missing reset link. Request a new reset email.");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		setError(null);
		setPending(true);
		try {
			const result = await resetPassword({
				token,
				newPassword: password,
			});
			if (result.error) {
				setError(result.error.message ?? "Could not reset password");
				return;
			}
			void navigate("/auth/sign-in", { replace: true });
		} finally {
			setPending(false);
		}
	}

	if (!token) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader>
						<CardTitle className="text-2xl font-semibold">Invalid link</CardTitle>
						<CardDescription>
							This reset link is missing a token. Use the link from your email or request a new one.
						</CardDescription>
					</CardHeader>
					<CardFooter className="flex flex-col gap-2">
						<Button asChild className="w-full">
							<Link to="/auth/forget-password">Request new link</Link>
						</Button>
						<Button variant="outline" asChild className="w-full">
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
					<CardTitle className="text-2xl font-semibold">Reset password</CardTitle>
					<CardDescription>Choose a new password for your account</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="password">New password</Label>
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
						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirm password</Label>
							<Input
								id="confirm-password"
								type="password"
								autoComplete="new-password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
								minLength={8}
								disabled={pending}
							/>
						</div>
						{error ? <p className="text-sm text-destructive">{error}</p> : null}
						<Button type="submit" className="w-full" disabled={pending}>
							{pending ? "Updating…" : "Update password"}
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
