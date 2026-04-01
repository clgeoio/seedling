import { z } from "zod";

export const signInSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

const usernameSchema = z
	.string()
	.min(3)
	.max(32)
	.regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores");

export const signUpSchema = z.object({
	name: z.string().min(1),
	username: usernameSchema,
	email: z.string().email(),
	password: z.string().min(8),
});

export const resetPasswordSchema = z
	.object({
		password: z.string().min(8),
		confirmPassword: z.string().min(8),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export const forgetPasswordSchema = z.object({
	email: z.string().email(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ForgetPasswordInput = z.infer<typeof forgetPasswordSchema>;
