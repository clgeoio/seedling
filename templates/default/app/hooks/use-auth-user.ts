import { useSession } from "~/services/auth/client";

/**
 * Typed wrapper around Better Auth `useSession` for route components and hooks.
 */
export function useAuthUser() {
	const { data, isPending, isRefetching, error, refetch } = useSession();

	return {
		user: data?.user ?? null,
		session: data,
		isPending,
		isRefetching,
		error,
		refetch,
	};
}
