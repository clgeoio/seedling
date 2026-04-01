import { count } from "drizzle-orm";
import { LayoutDashboard, Users } from "lucide-react";
import type { Route } from "./+types/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { cloudflareContext } from "~/contexts";
import { getDb } from "~/services/db.server";
import { users } from "~/drizzle/schema/auth";

export async function loader({ context }: Route.LoaderArgs) {
	const { env } = context.get(cloudflareContext);
	const db = getDb(env);
	const [row] = await db.select({ total: count() }).from(users);
	return { userCount: Number(row?.total ?? 0) };
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
				<p className="mt-1 text-sm text-muted-foreground">Overview of your application.</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total users</CardTitle>
						<Users className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{loaderData.userCount}</p>
						<CardDescription className="mt-1">Registered accounts</CardDescription>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active sessions</CardTitle>
						<LayoutDashboard className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">—</p>
						<CardDescription className="mt-1">Placeholder — wire to analytics</CardDescription>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Storage</CardTitle>
						<LayoutDashboard className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">—</p>
						<CardDescription className="mt-1">Placeholder — connect R2 metrics</CardDescription>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
