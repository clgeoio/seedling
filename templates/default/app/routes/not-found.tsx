import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
			<div className="space-y-2">
				<p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">404</p>
				<h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Page not found</h1>
				<p className="max-w-md text-muted-foreground">
					The page you are looking for does not exist or may have been moved.
				</p>
			</div>
			<Button asChild size="lg">
				<Link to="/">Back to home</Link>
			</Button>
		</div>
	);
}
