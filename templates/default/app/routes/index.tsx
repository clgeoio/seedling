import { Link } from "react-router";
import { Button } from "~/components/ui/button";
import { useSession } from "~/services/auth/client";

export default function Index() {
	const { data: session, isPending } = useSession();

	return (
		<div className="relative isolate overflow-hidden">
			<div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-2xl text-center">
					<p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
						Welcome
					</p>
					<h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
						{"{{displayName}}"}
					</h1>
					<p className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl">
						Build and ship faster with a modern stack on the edge.
					</p>
					<div className="mt-10 flex flex-wrap items-center justify-center gap-3">
						{isPending ? (
							<div className="h-10 w-40 animate-pulse rounded-md bg-muted" />
						) : session?.user ? (
							<>
								<Button asChild size="lg">
									<Link to="/settings/account">Account</Link>
								</Button>
// {{#if includeTodos}}
								<Button asChild variant="outline" size="lg">
									<Link to="/todos">Todos</Link>
								</Button>
// {{/if}}
							</>
						) : (
							<>
								<Button asChild size="lg">
									<Link to="/auth/sign-in">Sign in</Link>
								</Button>
								<Button asChild variant="outline" size="lg">
									<Link to="/auth/sign-up">Create account</Link>
								</Button>
							</>
						)}
					</div>
				</div>
			</div>
			<div
				className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
				aria-hidden
			>
				<div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/20 to-muted opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72rem]" />
			</div>
		</div>
	);
}
