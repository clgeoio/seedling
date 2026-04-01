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
const USERNAME_RE = /^[a-zA-Z0-9_-]{3,32}$/;

export default function SettingsAccount() {
	const { data: session, isPending: sessionPending } = useSession();

	const [name, setName] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		const user = session?.user;
		if (!user) return;
		setName(user.name ?? "");
		setUsername("username" in user && typeof user.username === "string" ? user.username : "");
		setEmail(user.email ?? "");
	}, [session?.user]);

	function validate(): string | null {
		if (!name.trim()) {
			return "Name is required";
		}
		if (!EMAIL_RE.test(email.trim())) {
			return "Enter a valid email address";
		}
		if (username.trim() && !USERNAME_RE.test(username.trim())) {
			return "Username must be 3–32 characters (letters, numbers, _ or -)";
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
				name: name.trim(),
				username: username.trim() || undefined,
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
				<CardDescription>Update your name, username, and email.</CardDescription>
			</CardHeader>
			<form onSubmit={(e) => void handleSubmit(e)}>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="settings-name">Name</Label>
						<Input
							id="settings-name"
							name="name"
							autoComplete="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={saving}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="settings-username">Username</Label>
						<Input
							id="settings-username"
							name="username"
							autoComplete="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={saving}
							placeholder="your-handle"
						/>
					</div>
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
