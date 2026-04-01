-- Remote D1 seed: admin@example.com / admin123 (Better Auth scrypt format)
-- Regenerate hash if you change the password: `node --input-type=module -e "import('better-auth/crypto').then(m => m.hashPassword('YOUR_PASS')).then(console.log)"`

INSERT INTO "users" (
	"id",
	"name",
	"email",
	"emailVerified",
	"image",
	"username",
	"displayUsername",
	"role",
	"banned",
	"banReason",
	"banExpires",
	"createdAt",
	"updatedAt"
) VALUES (
	'seed-admin-user',
	'Admin',
	'admin@example.com',
	1,
	NULL,
	'admin',
	'Admin',
	'admin',
	0,
	NULL,
	NULL,
	(strftime('%s', 'now') * 1000),
	(strftime('%s', 'now') * 1000)
);

INSERT INTO "accounts" (
	"id",
	"accountId",
	"providerId",
	"userId",
	"accessToken",
	"refreshToken",
	"idToken",
	"accessTokenExpiresAt",
	"refreshTokenExpiresAt",
	"scope",
	"password",
	"createdAt",
	"updatedAt"
) VALUES (
	'seed-admin-account',
	'seed-admin-user',
	'credential',
	'seed-admin-user',
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	NULL,
	'ee78585b9559ced26ef93df1f1f5cc72:b8a607639b19a84ddc871a259421f182bd643ec895ade173179222ca8f451c5830656479044cb7736385d0f24f2c05652d0221b22ef1e413a1213410a9eb253e',
	(strftime('%s', 'now') * 1000),
	(strftime('%s', 'now') * 1000)
);
