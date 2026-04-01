import { desc } from "drizzle-orm";
import { Users } from "lucide-react";
import type { Route } from "./+types/index";
import { Badge } from "~/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { cloudflareContext } from "~/contexts";
import { getDb } from "~/services/db.server";
import { users } from "~/drizzle/schema/auth";

export async function loader({ context }: Route.LoaderArgs) {
	const { env } = context.get(cloudflareContext);
	const db = getDb(env);
	const rows = await db.select().from(users).orderBy(desc(users.createdAt));
	return { users: rows };
}

export default function AdminUsers({ loaderData }: Route.ComponentProps) {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
				<p className="mt-1 text-sm text-muted-foreground">Manage registered accounts.</p>
			</div>
			<div className="rounded-md border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loaderData.users.length === 0 ? (
							<TableRow>
								<TableCell colSpan={3} className="h-32 text-center">
									<div className="flex flex-col items-center gap-2">
										<Users className="size-8 text-muted-foreground/50" />
										<p className="text-sm text-muted-foreground">No users yet.</p>
									</div>
								</TableCell>
							</TableRow>
						) : (
							loaderData.users.map((row) => (
								<TableRow key={row.id}>
									<TableCell className="font-medium">{row.email}</TableCell>
									<TableCell>
										<Badge variant={row.role === "admin" ? "default" : "secondary"}>
											{row.role ?? "user"}
										</Badge>
									</TableCell>
									<TableCell>
										<span
											className={
												row.banned ? "text-destructive" : "text-muted-foreground"
											}
										>
											{row.banned ? "Banned" : "Active"}
										</span>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
