import { useCallback, useEffect, useState } from "react";
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
import { authClient, useSession } from "~/services/auth/client";

type LinkedAccount = {
	id: string;
	providerId: string;
	accountId: string;
};

const CALLBACK_PATH = "/settings/connections";

export default function SettingsConnections() {
	const { data: session, isPending: sessionPending } = useSession();

	const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);
	const [busyProvider, setBusyProvider] = useState<string | null>(null);

	const loadAccounts = useCallback(async () => {
		setLoadError(null);
		const result = await authClient.listAccounts();
		if (result.error) {
			setLoadError(result.error.message ?? "Could not load linked accounts");
			setAccounts([]);
			return;
		}
		const list = result.data;
		if (!Array.isArray(list)) {
			setAccounts([]);
			return;
		}
		setAccounts(list as LinkedAccount[]);
	}, []);

	useEffect(() => {
		if (!session?.user) return;
		void loadAccounts();
	}, [session?.user, loadAccounts]);

	function isLinked(providerId: string): boolean {
		return accounts.some((a) => a.providerId === providerId);
	}

	async function handleLink(provider: "github" | "google") {
		setActionError(null);
		setBusyProvider(provider);
		try {
			const result = await authClient.linkSocial({
				provider,
				callbackURL: CALLBACK_PATH,
			});
			if (result.error) {
				setActionError(result.error.message ?? `Could not connect ${provider}`);
			}
		} finally {
			setBusyProvider(null);
		}
	}

	async function handleUnlink(providerId: string) {
		setActionError(null);
		setBusyProvider(providerId);
		try {
			const result = await authClient.unlinkAccount({ providerId });
			if (result.error) {
				setActionError(result.error.message ?? "Could not disconnect account");
				return;
			}
			await loadAccounts();
		} finally {
			setBusyProvider(null);
		}
	}

	if (sessionPending) {
		return <p className="text-sm text-muted-foreground">Loading…</p>;
	}

	if (!session?.user) {
		return <p className="text-sm text-muted-foreground">Sign in to manage connected accounts.</p>;
	}

	const credentialLinked = accounts.some(
		(a) => a.providerId === "credential" || a.providerId === "email" || a.providerId === "email-password",
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Connections</CardTitle>
				<CardDescription>Link social sign-in methods to your account or remove access.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
				{actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

				<div className="rounded-lg border border-border p-4">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="font-medium">Email & password</p>
							<p className="text-sm text-muted-foreground">
								{credentialLinked ? "Credential sign-in is enabled" : "No password credential on file"}
							</p>
						</div>
						<span className="text-sm text-muted-foreground">
							{credentialLinked ? "Connected" : "—"}
						</span>
					</div>
				</div>

// {{#if hasGithub}}
				<div className="rounded-lg border border-border p-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-3">
							<Github className="mt-0.5 size-5 shrink-0" />
							<div>
								<p className="font-medium">GitHub</p>
								<p className="text-sm text-muted-foreground">
									{isLinked("github") ? "Your GitHub account is linked." : "Connect GitHub for one-click sign-in."}
								</p>
							</div>
						</div>
						{isLinked("github") ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={busyProvider !== null}
								onClick={() => void handleUnlink("github")}
							>
								{busyProvider === "github" ? "Disconnecting…" : "Disconnect"}
							</Button>
						) : (
							<Button
								type="button"
								size="sm"
								disabled={busyProvider !== null}
								onClick={() => void handleLink("github")}
							>
								{busyProvider === "github" ? "Connecting…" : "Connect GitHub"}
							</Button>
						)}
					</div>
				</div>
// {{/if}}
// {{#if hasGoogle}}
				<div className="rounded-lg border border-border p-4">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-3">
							<Chrome className="mt-0.5 size-5 shrink-0" />
							<div>
								<p className="font-medium">Google</p>
								<p className="text-sm text-muted-foreground">
									{isLinked("google") ? "Your Google account is linked." : "Connect Google for one-click sign-in."}
								</p>
							</div>
						</div>
						{isLinked("google") ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={busyProvider !== null}
								onClick={() => void handleUnlink("google")}
							>
								{busyProvider === "google" ? "Disconnecting…" : "Disconnect"}
							</Button>
						) : (
							<Button
								type="button"
								size="sm"
								disabled={busyProvider !== null}
								onClick={() => void handleLink("google")}
							>
								{busyProvider === "google" ? "Connecting…" : "Connect Google"}
							</Button>
						)}
					</div>
				</div>
// {{/if}}
			</CardContent>
			<CardFooter className="text-xs text-muted-foreground">
				You need at least one sign-in method. Disconnecting may be blocked if it would lock you out.
			</CardFooter>
		</Card>
	);
}
