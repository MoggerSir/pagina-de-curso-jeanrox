const CONTENT_SECURITY_POLICY = [
	"default-src 'self'",
	"base-uri 'self'",
	"object-src 'none'",
	"frame-ancestors 'none'",
	"form-action 'self'",
	"script-src 'self'",
	"style-src 'self' https://fonts.googleapis.com",
	"font-src 'self' https://fonts.gstatic.com",
	"img-src 'self' data: blob:",
	"connect-src 'self'",
	"worker-src 'self' blob:",
].join("; ");

export function withSecurityHeaders(response: Response) {
	const secured = new Response(response.body, response);
	secured.headers.set("Content-Security-Policy-Report-Only", CONTENT_SECURITY_POLICY);
	secured.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
	secured.headers.set("X-Content-Type-Options", "nosniff");
	secured.headers.set("X-Frame-Options", "DENY");
	secured.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
	return secured;
}
