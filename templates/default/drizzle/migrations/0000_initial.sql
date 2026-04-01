-- Better Auth (SQLite / D1) — users, sessions, accounts, verifications

CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'user' NOT NULL,
	`banned` integer DEFAULT false NOT NULL,
	`banReason` text,
	`banExpires` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);

CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);

CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE no action ON DELETE cascade
);

CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);
CREATE INDEX `sessions_userId_idx` ON `sessions` (`userId`);

CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `accounts_userId_idx` ON `accounts` (`userId`);

CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);

CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);

-- {{#if includeTodos}}
CREATE TABLE `todos` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`completed` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `todos_user_id_idx` ON `todos` (`user_id`);
-- {{/if}}
