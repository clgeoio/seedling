export async function uploadImage(
	env: Env,
	file: File,
	prefix?: string,
): Promise<string> {
	const root = prefix ?? "uploads";
	const key = `${root}/${crypto.randomUUID()}-${file.name}`;
	await env.R2.put(key, file.stream(), {
		httpMetadata: { contentType: file.type },
	});
	return `${env.APP_URL}/images/${key}`;
}

export async function deleteImage(env: Env, url: string): Promise<void> {
	try {
		const key = new URL(url).pathname.replace("/images/", "");
		await env.R2.delete(key);
	} catch {
		// Deletion is best-effort
	}
}

export async function getImage(env: Env, key: string): Promise<Response> {
	const object = await env.R2.get(key);
	if (!object) {
		return new Response("Not found", { status: 404 });
	}

	const headers = new Headers();
	headers.set("Content-Type", object.httpMetadata?.contentType ?? "application/octet-stream");
	headers.set("Cache-Control", "public, max-age=31536000, immutable");

	return new Response(object.body, { headers });
}
