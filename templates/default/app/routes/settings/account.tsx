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

export default function SettingsAccount() {
	const { data: session, isPending: sessionPending } = useSession();

	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const user = session?.user;
		if (!user) return;
		setName(user.name ?? user.email ?? "");
	}, [session?.user]);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const trimmed = name.trim();
		if (!trimmed) {
			setError("Name is required");
			return;
		}
		setError(null);
		setSuccess(null);
		setSaving(true);
		try {
			const result = await authClient.updateUser({
				name: trimmed,
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
				<CardDescription>Manage your display name and profile.</CardDescription>
			</CardHeader>
			<form onSubmit={(e) => void handleSubmit(e)}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="settings-name">Display name</Label>
						<Input
							id="settings-name"
							name="name"
							type="text"
							autoComplete="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={saving}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label>Email</Label>
						<p className="text-sm text-muted-foreground">{session.user.email}</p>
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
