import { useCallback, useEffect, useState } from "react";
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

type ListedSession = {
	id: string;
	token: string;
	expiresAt: string | Date;
	createdAt: string | Date;
	updatedAt: string | Date;
	ipAddress?: string | null;
	userAgent?: string | null;
};

function summarizeDevice(userAgent: string | null | undefined): string {
	if (!userAgent?.trim()) return "Unknown browser";
	const ua = userAgent.toLowerCase();
	let browser = "Browser";
	if (ua.includes("edg/")) browser = "Edge";
	else if (ua.includes("chrome")) browser = "Chrome";
	else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
	else if (ua.includes("firefox")) browser = "Firefox";
	let os = "";
	if (ua.includes("windows")) os = "Windows";
	else if (ua.includes("mac os")) os = "macOS";
	else if (ua.includes("linux")) os = "Linux";
	else if (ua.includes("android")) os = "Android";
	else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
	return os ? `${browser} · ${os}` : browser;
}

function formatWhen(value: string | Date): string {
	const d = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(d.getTime())) return "—";
	return new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(d);
}

export default function SettingsSessions() {
	const { data: session, isPending: sessionPending } = useSession();

	const [sessions, setSessions] = useState<ListedSession[]>([]);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [revokingOthers, setRevokingOthers] = useState(false);

	const currentSessionId = session?.session?.id;

	const loadSessions = useCallback(async () => {
		setLoadError(null);
		const result = await authClient.listSessions();
		if (result.error) {
			setLoadError(result.error.message ?? "Could not load sessions");
			setSessions([]);
			return;
		}
		const list = result.data;
		if (!Array.isArray(list)) {
			setSessions([]);
			return;
		}
		setSessions(list as ListedSession[]);
	}, []);

	useEffect(() => {
		if (!session?.user) return;
		void loadSessions();
	}, [session?.user, loadSessions]);

	async function handleRevoke(token: string) {
		setBusyId(token);
		try {
			const result = await authClient.revokeSession({ token });
			if (result.error) {
				setLoadError(result.error.message ?? "Could not revoke session");
				return;
			}
			await loadSessions();
		} finally {
			setBusyId(null);
		}
	}

	async function handleRevokeOthers() {
		if (!confirm("Revoke all other sessions? You will remain signed in on this device only.")) return;
		setRevokingOthers(true);
		setLoadError(null);
		try {
			const result = await authClient.revokeOtherSessions();
			if (result.error) {
				setLoadError(result.error.message ?? "Could not revoke other sessions");
				return;
			}
			await loadSessions();
		} finally {
			setRevokingOthers(false);
		}
	}

	const otherSessions = sessions.filter((s) => s.id !== currentSessionId);

	if (sessionPending) {
		return <p className="text-sm text-muted-foreground">Loading…</p>;
	}

	if (!session?.user) {
		return <p className="text-sm text-muted-foreground">Sign in to manage sessions.</p>;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Sessions</CardTitle>
				<CardDescription>Devices where you are signed in. Revoke access you do not recognize.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{loadError ? <p className="text-sm text-destructive">{loadError}</p> : null}
				<ul className="space-y-3">
					{sessions.map((s) => {
						const isCurrent = s.id === currentSessionId;
						const revoking = busyId === s.token;
						return (
							<li
								key={s.id}
								className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
							>
								<div className="min-w-0 space-y-1">
									<p className="font-medium leading-none">
										{summarizeDevice(s.userAgent)}
										{isCurrent ? (
											<span className="ml-2 text-xs font-normal text-muted-foreground">(this device)</span>
										) : null}
									</p>
									<p className="text-xs text-muted-foreground">
										IP: {s.ipAddress ?? "—"} · Last active {formatWhen(s.updatedAt)}
									</p>
								</div>
								{!isCurrent ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={revoking || revokingOthers}
										onClick={() => void handleRevoke(s.token)}
									>
										{revoking ? "Revoking…" : "Revoke"}
									</Button>
								) : null}
							</li>
						);
					})}
				</ul>
				{sessions.length === 0 && !loadError ? (
					<p className="text-sm text-muted-foreground">No active sessions found.</p>
				) : null}
			</CardContent>
			<CardFooter className="flex flex-wrap gap-2">
				<Button
					type="button"
					variant="secondary"
					disabled={revokingOthers || otherSessions.length === 0 || busyId !== null}
					onClick={() => void handleRevokeOthers()}
				>
					{revokingOthers ? "Revoking…" : "Revoke all other sessions"}
				</Button>
			</CardFooter>
		</Card>
	);
}
