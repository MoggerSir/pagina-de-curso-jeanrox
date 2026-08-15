import { describe, expect, it } from "vitest";
import { withSecurityHeaders } from "./security-headers";

describe("withSecurityHeaders", () => {
	it("adds defensive browser headers without changing status", () => {
		const response = withSecurityHeaders(new Response("ok", { status: 201 }));
		expect(response.status).toBe(201);
		expect(response.headers.get("x-content-type-options")).toBe("nosniff");
		expect(response.headers.get("x-frame-options")).toBe("DENY");
		expect(response.headers.get("content-security-policy-report-only")).toContain(
			"default-src 'self'",
		);
	});
});
