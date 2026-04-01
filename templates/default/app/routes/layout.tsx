import { Link, NavLink, Outlet } from "react-router";
import { Menu } from "lucide-react";
import { UserMenu } from "~/components/user-menu";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "~/services/auth/client";

type SessionUser = { role?: string } & Record<string, unknown>;

export default function AppLayout() {
	const { data: session } = useSession();
	const userRole = (session?.user as SessionUser | undefined)?.role;

	return (
		<div className="flex min-h-screen flex-col bg-background">
			<header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
				<div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
					<div className="flex items-center gap-8">
						<Link
							to="/"
							className="text-lg font-semibold tracking-tight text-foreground transition-opacity hover:opacity-80"
						>
							{"{{displayName}}"}
						</Link>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" size="icon" className="sm:hidden" aria-label="Open menu">
									<Menu className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="w-44 sm:hidden">
								{[
									<DropdownMenuItem key="home" asChild>
										<Link to="/">Home</Link>
									</DropdownMenuItem>,
// {{#if includeTodos}}
									<DropdownMenuItem key="todos" asChild>
										<Link to="/todos">Todos</Link>
									</DropdownMenuItem>,
// {{/if}}
// {{#if includeAdmin}}
									...(userRole === "admin"
										? [
												<DropdownMenuItem key="admin" asChild>
													<Link to="/admin">Admin</Link>
												</DropdownMenuItem>,
											]
										: []),
// {{/if}}
								]}
							</DropdownMenuContent>
						</DropdownMenu>
						<nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
							{[
								<NavLink
									key="home"
									to="/"
									className={({ isActive }) =>
										[
											"rounded-md px-3 py-2 text-sm font-medium transition-colors",
											isActive
												? "bg-muted text-foreground"
												: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
										].join(" ")
									}
									end
								>
									Home
								</NavLink>,
// {{#if includeTodos}}
								<NavLink
									key="todos"
									to="/todos"
									className={({ isActive }) =>
										[
											"rounded-md px-3 py-2 text-sm font-medium transition-colors",
											isActive
												? "bg-muted text-foreground"
												: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
										].join(" ")
									}
								>
									Todos
								</NavLink>,
// {{/if}}
// {{#if includeAdmin}}
								...(userRole === "admin"
									? [
											<NavLink
												key="admin"
												to="/admin"
												className={({ isActive }) =>
													[
														"rounded-md px-3 py-2 text-sm font-medium transition-colors",
														isActive
															? "bg-muted text-foreground"
															: "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
													].join(" ")
												}
											>
												Admin
											</NavLink>,
										]
									: []),
// {{/if}}
							]}
						</nav>
					</div>
					<div className="flex items-center gap-3">
						{session?.user ? (
							<span className="hidden max-w-[200px] truncate text-sm text-muted-foreground lg:inline">
								{session.user.email}
							</span>
						) : null}
						<UserMenu />
					</div>
				</div>
			</header>
			<main className="flex flex-1 flex-col">
				<Outlet />
			</main>
		</div>
	);
}
