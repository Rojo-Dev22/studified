import { QueryClient } from '@tanstack/react-query';

// Server-cache defaults from the $0 architecture (§19). TanStack Query owns
// the remote-data cache and prevents duplicate Firestore reads during
// navigation; Firestore's persistent local cache (see firebase.js) remains
// the offline store. Stale data is reused for 5 minutes before a refetch.
export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5,
			gcTime: 1000 * 60 * 10,
			retry: 2,
			refetchOnWindowFocus: false,
		},
	},
});