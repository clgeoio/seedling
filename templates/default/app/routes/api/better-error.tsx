import { Link } from "react-router";
import type { Route } from "./+types/better-error";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";

export function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const error =
		url.searchParams.get("error")?.trim() || "An authentication error occurred. Please try again.";
	return { error };
}

export default function BetterAuthError({ loaderData }: Route.ComponentProps) {
	return (
		<div className="flex min-h-[60vh] items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle>Authentication error</CardTitle>
					<CardDescription>Something went wrong while signing you in.</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
						{loaderData.error}
					</p>
				</CardContent>
				<CardFooter>
					<Button asChild className="w-full">
						<Link to="/auth/sign-in">Return to sign in</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
