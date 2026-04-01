import { useRouteLoaderData } from "react-router";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/** Matches `Theme` from the root loader (`~/services/theme.server`). */
type RootTheme = "light" | "dark" | "system";

type RootLoaderData = {
	theme: RootTheme;
};

function resolveToasterTheme(theme: RootTheme | undefined): ToasterProps["theme"] {
	if (theme === "light" || theme === "dark") {
		return theme;
	}
	return "system";
}

function Toaster({ theme: themeProp, ...props }: ToasterProps) {
	const data = useRouteLoaderData("root") as RootLoaderData | undefined;
	const theme = themeProp ?? resolveToasterTheme(data?.theme);

	return (
		<Sonner
			theme={theme}
			className="toaster group"
			toastOptions={{
				classNames: {
					toast:
						"group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
					description: "group-[.toast]:text-muted-foreground",
					actionButton:
						"group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
					cancelButton:
						"group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
				},
			}}
			{...props}
		/>
	);
}

export { Toaster };
