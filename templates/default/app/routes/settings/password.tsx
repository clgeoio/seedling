import { useState } from "react";
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
import { authClient, useSession } from "~/services/auth/client";

const MIN_LENGTH = 8;

export default function SettingsPassword() {
	const { data: session, isPending: sessionPending } = useSession();

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	function validate(): string | null {
		if (!currentPassword) {
			return "Current password is required";
		}
		if (newPassword.length < MIN_LENGTH) {
			return `New password must be at least ${MIN_LENGTH} characters`;
		}
		if (newPassword !== confirmPassword) {
			return "New password and confirmation do not match";
		}
		if (newPassword === currentPassword) {
			return "New password must be different from the current password";
		}
		return null;
	}

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSuccess(null);
		const validationError = validate();
		if (validationError) {
			setError(validationError);
			return;
		}
		setSaving(true);
		try {
			const result = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});
			if (result.error) {
				setError(result.error.message ?? "Could not change password");
				return;
			}
			setSuccess("Password updated. Other sessions were signed out.");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} finally {
			setSaving(false);
		}
	}

	if (sessionPending) {
		return <p className="text-sm text-muted-foreground">Loading…</p>;
	}

	if (!session?.user) {
		return <p className="text-sm text-muted-foreground">Sign in to change your password.</p>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Password</CardTitle>
				<CardDescription>Choose a strong password you have not used elsewhere.</CardDescription>
			</CardHeader>
			<form onSubmit={(e) => void handleSubmit(e)}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="current-password">Current password</Label>
						<Input
							id="current-password"
							name="currentPassword"
							type="password"
							autoComplete="current-password"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							disabled={saving}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="new-password">New password</Label>
						<Input
							id="new-password"
							name="newPassword"
							type="password"
							autoComplete="new-password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							disabled={saving}
							required
							minLength={MIN_LENGTH}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirm-password">Confirm new password</Label>
						<Input
							id="confirm-password"
							name="confirmPassword"
							type="password"
							autoComplete="new-password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							disabled={saving}
							required
							minLength={MIN_LENGTH}
						/>
					</div>
					{error ? <p className="text-sm text-destructive">{error}</p> : null}
					{success ? <p className="text-sm text-muted-foreground">{success}</p> : null}
				</CardContent>
				<CardFooter>
					<Button type="submit" disabled={saving}>
						{saving ? "Updating…" : "Update password"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
