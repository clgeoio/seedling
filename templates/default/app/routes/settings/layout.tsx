import { NavLink, Outlet, redirect } from "react-router";
import type { Route } from "./+types/layout";
import { Separator } from "~/components/ui/separator";
import { authContext } from "~/contexts";

export async function loader({ context, request }: Route.LoaderArgs) {
	const { user } = context.get(authContext);
	if (!user) {
		const url = new URL(request.url);
		throw redirect(`/auth/sign-in?redirect=${encodeURIComponent(url.pathname)}`);
	}
	return {};
}

const SETTINGS_NAV = [
	{ to: "/settings/account", label: "Account" },
	{ to: "/settings/appearance", label: "Appearance" },
	{ to: "/settings/sessions", label: "Sessions" },
	{ to: "/settings/password", label: "Password" },
	{ to: "/settings/connections", label: "Connections" },
] as const;

export default function SettingsLayout() {
	return (
		<div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 md:flex-row md:gap-8 md:p-6 lg:p-8">
			<aside className="shrink-0 md:w-48">
				<h1 className="mb-4 text-lg font-semibold tracking-tight">Settings</h1>
				<nav className="flex flex-row gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
					{SETTINGS_NAV.map((item) => (
						<NavLink
							key={item.to}
							to={item.to}
							className={({ isActive }) =>
								[
									"whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
									isActive
										? "bg-muted font-medium text-foreground"
										: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
								].join(" ")
							}
							end
						>
							{item.label}
						</NavLink>
					))}
				</nav>
			</aside>
			<Separator className="md:hidden" />
			<Separator orientation="vertical" className="hidden min-h-[320px] md:block" />
			<main className="min-w-0 flex-1">
				<Outlet />
			</main>
		</div>
	);
}
