import { useEffect, useState } from "react";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SettingsAccount() {
	const { data: session, isPending: sessionPending } = useSession();

	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const user = session?.user;
		if (!user) return;
		setEmail(user.email ?? "");
	}, [session?.user]);

	function validate(): string | null {
		if (!EMAIL_RE.test(email.trim())) {
			return "Enter a valid email address";
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
			const result = await authClient.updateUser({
				name: email.trim(),
			});
			if (result.error) {
				setError(result.error.message ?? "Could not update profile");
				return;
			}
			setSuccess("Profile updated.");
		} finally {
			setSaving(false);
		}
	}

	if (sessionPending) {
		return <p className="text-sm text-muted-foreground">Loading profile…</p>;
	}

	if (!session?.user) {
		return <p className="text-sm text-muted-foreground">Sign in to manage your account.</p>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Account</CardTitle>
				<CardDescription>Update your email address.</CardDescription>
			</CardHeader>
			<form onSubmit={(e) => void handleSubmit(e)}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="settings-email">Email</Label>
						<Input
							id="settings-email"
							name="email"
							type="email"
							autoComplete="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={saving}
							required
						/>
					</div>
					{error ? <p className="text-sm text-destructive">{error}</p> : null}
					{success ? <p className="text-sm text-muted-foreground">{success}</p> : null}
				</CardContent>
				<CardFooter>
					<Button type="submit" disabled={saving}>
						{saving ? "Saving…" : "Save changes"}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
