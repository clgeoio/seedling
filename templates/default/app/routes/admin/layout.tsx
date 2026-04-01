import { NavLink, Outlet, redirect } from "react-router";
import type { Route } from "./+types/layout";
import { authContext } from "~/contexts";

export async function loader({ context }: Route.LoaderArgs) {
	const { user } = context.get(authContext);
	if (!user || user.role !== "admin") {
		throw redirect("/");
	}
	return {};
}

export default function AdminLayout() {
	return (
		<div className="flex min-h-[calc(100vh-4rem)] w-full flex-1">
			<aside className="hidden w-52 shrink-0 border-r border-border bg-muted/30 md:block">
				<div className="flex h-full flex-col gap-1 p-4">
					<p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Admin
					</p>
					<NavLink
						to="/admin"
						end
						className={({ isActive }) =>
							[
								"rounded-md px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:bg-background/60 hover:text-foreground",
							].join(" ")
						}
					>
						Dashboard
					</NavLink>
					<NavLink
						to="/admin/users"
						className={({ isActive }) =>
							[
								"rounded-md px-3 py-2 text-sm font-medium transition-colors",
								isActive
									? "bg-background text-foreground shadow-sm"
									: "text-muted-foreground hover:bg-background/60 hover:text-foreground",
							].join(" ")
						}
					>
						Users
					</NavLink>
				</div>
			</aside>
			<div className="min-w-0 flex-1 p-4 md:p-6 lg:p-8">
				<Outlet />
			</div>
		</div>
	);
}
