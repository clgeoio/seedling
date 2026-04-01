import { useEffect, useState } from "react";
import { useFetcher, useRevalidator, useRouteLoaderData } from "react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import type { Theme } from "~/services/theme.server";

type RootLoaderData = {
	theme: Theme;
};

const THEMES: { value: Theme; label: string; description: string }[] = [
	{ value: "light", label: "Light", description: "Always use light appearance" },
	{ value: "dark", label: "Dark", description: "Always use dark appearance" },
	{ value: "system", label: "System", description: "Match your device setting" },
];

export default function SettingsAppearance() {
	const rootData = useRouteLoaderData("root") as RootLoaderData | undefined;
	const fetcher = useFetcher<{ ok?: boolean }>();
	const revalidator = useRevalidator();

	const loaderTheme = rootData?.theme ?? "system";
	const [activeTheme, setActiveTheme] = useState<Theme>(loaderTheme);

	useEffect(() => {
		setActiveTheme(loaderTheme);
	}, [loaderTheme]);

	useEffect(() => {
		if (fetcher.state !== "idle" || !fetcher.data) return;
		if (fetcher.data.ok) {
			void revalidator.revalidate();
		}
	}, [fetcher.state, fetcher.data, revalidator]);

	function applyThemeClass(theme: Theme) {
		const root = document.documentElement;
		if (theme === "dark") {
			root.classList.add("dark");
		} else if (theme === "light") {
			root.classList.remove("dark");
		} else {
			const prefersDark = matchMedia("(prefers-color-scheme:dark)").matches;
			root.classList.toggle("dark", prefersDark);
		}
	}

	function selectTheme(theme: Theme) {
		setActiveTheme(theme);
		applyThemeClass(theme);
		fetcher.submit(
			{ theme },
			{ method: "POST", action: "/api/theme-switcher" },
		);
	}

	const busy = fetcher.state !== "idle";

	return (
		<Card>
			<CardHeader>
				<CardTitle>Appearance</CardTitle>
				<CardDescription>Choose how the app looks. Current: {loaderTheme}.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="grid gap-3 sm:grid-cols-3">
					{THEMES.map((item) => {
						const isActive = activeTheme === item.value;
						return (
							<button
								key={item.value}
								type="button"
								disabled={busy}
								onClick={() => selectTheme(item.value)}
								className={[
									"flex flex-col rounded-lg border p-4 text-left text-sm transition-colors",
									isActive
										? "border-primary bg-muted/40 ring-2 ring-primary ring-offset-2 ring-offset-background"
										: "border-border hover:bg-muted/30",
								].join(" ")}
							>
								<span className="font-medium">{item.label}</span>
								<span className="mt-1 text-muted-foreground">{item.description}</span>
							</button>
						);
					})}
				</div>
				{fetcher.data && !fetcher.data.ok ? (
					<p className="text-sm text-destructive">Could not update theme. Try again.</p>
				) : null}
			</CardContent>
		</Card>
	);
}
