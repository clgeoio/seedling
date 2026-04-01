import { and, desc, eq } from "drizzle-orm";
import { Form, redirect, useActionData, useFetcher } from "react-router";
import { ListChecks, Trash2 } from "lucide-react";
import type { Route } from "./+types/todos";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { authContext, cloudflareContext } from "~/contexts";
import { getDb } from "~/services/db.server";
import { todos } from "~/drizzle/schema/todo";

type TodoRow = typeof todos.$inferSelect;

export async function loader({ context }: Route.LoaderArgs) {
	const { env } = context.get(cloudflareContext);
	const { user } = context.get(authContext);
	if (!user) {
		throw redirect("/auth/sign-in");
	}
	const db = getDb(env);
	const list = await db
		.select()
		.from(todos)
		.where(eq(todos.userId, user.id))
		.orderBy(desc(todos.id));
	return { todos: list };
}

export async function action({ request, context }: Route.ActionArgs) {
	const { env } = context.get(cloudflareContext);
	const { user } = context.get(authContext);
	if (!user) {
		throw redirect("/auth/sign-in");
	}
	const db = getDb(env);
	const formData = await request.formData();
	const intent = formData.get("_intent");

	if (intent === "create") {
		const title = String(formData.get("title") ?? "").trim();
		if (!title) {
			return { error: "Title is required" as const };
		}
		await db.insert(todos).values({
			id: crypto.randomUUID(),
			userId: user.id,
			title,
			completed: false,
		});
		throw redirect("/todos");
	}

	if (intent === "toggle") {
		const id = String(formData.get("id") ?? "");
		if (!id) {
			return { error: "Missing id" as const };
		}
		const [row] = await db.select().from(todos).where(eq(todos.id, id)).limit(1);
		if (!row || row.userId !== user.id) {
			return { error: "Not found" as const };
		}
		await db.update(todos).set({ completed: !row.completed }).where(eq(todos.id, id));
		throw redirect("/todos");
	}

	if (intent === "delete") {
		const id = String(formData.get("id") ?? "");
		if (!id) {
			return { error: "Missing id" as const };
		}
		await db.delete(todos).where(and(eq(todos.id, id), eq(todos.userId, user.id)));
		throw redirect("/todos");
	}

	return { error: "Unknown action" as const };
}

function TodoRowItem({ todo }: { todo: TodoRow }) {
	const fetcher = useFetcher();

	return (
		<li className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
			<div className="flex flex-1 items-center gap-3">
				<Checkbox
					checked={todo.completed}
					onCheckedChange={() =>
						void fetcher.submit(
							{ _intent: "toggle", id: todo.id },
							{ method: "post" },
						)
					}
					aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
				/>
				<span
					className={todo.completed ? "flex-1 text-muted-foreground line-through" : "flex-1"}
				>
					{todo.title}
				</span>
			</div>
			<Form
				method="post"
				className="inline"
				onSubmit={(e) => {
					if (!confirm("Delete this todo?")) e.preventDefault();
				}}
			>
				<input type="hidden" name="_intent" value="delete" />
				<input type="hidden" name="id" value={todo.id} />
				<Button type="submit" variant="ghost" size="icon" aria-label="Delete todo">
					<Trash2 className="size-4 text-muted-foreground" />
				</Button>
			</Form>
		</li>
	);
}

export default function TodosPage({ loaderData }: Route.ComponentProps) {
	const actionData = useActionData<typeof action>();

	return (
		<div className="mx-auto w-full max-w-xl space-y-8 px-4 py-8">
			<div>
				<h1 className="text-2xl font-bold tracking-tight text-foreground">Todos</h1>
				<p className="mt-1 text-sm text-muted-foreground">Tasks for your signed-in account.</p>
			</div>
			<Form method="post" className="flex gap-2">
				<input type="hidden" name="_intent" value="create" />
				<Input name="title" placeholder="New todo…" required className="flex-1" />
				<Button type="submit">
					Add
				</Button>
			</Form>
			{actionData && "error" in actionData ? (
				<p className="text-sm text-destructive">{actionData.error}</p>
			) : null}
			<ul className="space-y-2">
				{loaderData.todos.map((todo) => (
					<TodoRowItem key={todo.id} todo={todo} />
				))}
			</ul>
			{loaderData.todos.length === 0 ? (
				<div className="flex flex-col items-center gap-2 py-8 text-center">
					<ListChecks className="size-10 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">No todos yet. Add one above.</p>
				</div>
			) : null}
		</div>
	);
}
