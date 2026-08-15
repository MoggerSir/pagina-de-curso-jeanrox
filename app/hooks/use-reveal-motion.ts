import { useEffect } from "react";

export function useRevealMotion(selector = "[data-reveal]") {
	useEffect(() => {
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

		let cancelled = false;
		let observer: IntersectionObserver | undefined;
		let context: { revert: () => void } | undefined;

		void import("gsap").then(({ gsap }) => {
			if (cancelled) return;
			context = gsap.context(() => {
				const elements = [...document.querySelectorAll<HTMLElement>(selector)];
				observer = new IntersectionObserver(
					(entries) => {
						for (const entry of entries) {
							if (!entry.isIntersecting) continue;
							observer?.unobserve(entry.target);
							gsap.fromTo(
								entry.target,
								{ autoAlpha: 0, y: 24 },
								{
									autoAlpha: 1,
									y: 0,
									duration: 0.72,
									ease: "power3.out",
								},
							);
						}
					},
					{ rootMargin: "0px 0px -10%", threshold: 0.1 },
				);
				for (const element of elements) observer.observe(element);
			});
		});

		return () => {
			cancelled = true;
			observer?.disconnect();
			context?.revert();
		};
	}, [selector]);
}
