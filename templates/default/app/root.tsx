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

export async function loader({ request }: Route.LoaderArgs) {
	const theme = getTheme(request);
	return { theme };
}

const themeScript = `(function(){try{var c=document.cookie.match(/{{projectName}}_theme=([^;]+)/);var t=c&&c[1];if(t==="dark")document.documentElement.classList.add("dark");else if(t!=="light"&&matchMedia("(prefers-color-scheme:dark)").matches)document.documentElement.classList.add("dark")}catch(e){}})()`;

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="text-center">
				<p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Error</p>
				<h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
				<p className="mt-4 text-muted-foreground">{message}</p>
				<a
					href="/"
					className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
				>
					Back to home
				</a>
			</div>
		</div>
	);
}
