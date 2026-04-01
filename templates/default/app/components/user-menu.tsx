import { Form, Link } from "react-router";
import { useSession } from "~/services/auth/client";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function UserMenu() {
	const { data: session } = useSession();
	const user = session?.user;

	if (!user) {
		return (
			<div className="flex items-center gap-2">
				<Button asChild variant="ghost" size="sm">
					<Link to="/auth/sign-in">Sign in</Link>
				</Button>
				<Button asChild size="sm">
					<Link to="/auth/sign-up">Sign up</Link>
				</Button>
			</div>
		);
	}

	const initials = user.email?.charAt(0).toUpperCase() || "U";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative size-9 rounded-full p-0">
					<Avatar className="size-9">
						<AvatarImage src={user.image ?? undefined} alt="" />
						<AvatarFallback>{initials}</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{user.email}</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link to="/settings/account">Settings</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Form method="post" action="/auth/sign-out">
						<button type="submit" className="w-full text-left">Sign out</button>
					</Form>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
