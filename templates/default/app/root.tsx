import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";
import { Toaster } from "~/components/ui/sonner";
import { getTheme } from "~/services/theme.server";
import { trimTrailingSlash } from "~/middlewares/trailing-slash";
import { requestId } from "~/middlewares/request-id";
import { authMiddleware } from "~/middlewares/auth";
import { loggerMiddleware } from "~/middlewares/logger";
import "~/styles/app.css";

export const middleware = [trimTrailingSlash, requestId, authMiddleware, loggerMiddleware];

export async function loader({ request, context }: Route.LoaderArgs) {
	const theme = await getTheme(request);
	return { theme };
}

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body className="min-h-screen bg-background font-sans antialiased">
				{children}
				<Toaster richColors position="top-right" />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let title = "Unexpected Error";
	let message = "Something went wrong. Please try again later.";

	if (isRouteErrorResponse(error)) {
		title = `${error.status} ${error.statusText}`;
		message = error.data?.toString() ?? message;
	} else if (error instanceof Error) {
		message = error.message;
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="text-center">
				<h1 className="text-4xl font-bold">{title}</h1>
				<p className="mt-4 text-muted-foreground">{message}</p>
			</div>
		</div>
	);
}
