// Iconografía de línea dibujada a mano para el hero. Va inline porque la CSP
// del Worker no permite hojas ni sprites de terceros, y así hereda currentColor.

type IconProps = { className?: string };

const base = {
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.2,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
	"aria-hidden": true,
	focusable: "false" as const,
};

export function TargetIcon({ className }: IconProps) {
	return (
		<svg {...base} className={className}>
			<circle cx="12" cy="12" r="7.2" />
			<circle cx="12" cy="12" r="3.1" />
			<path d="M12 1.8v3.4M12 18.8v3.4M1.8 12h3.4M18.8 12h3.4" />
			<circle cx="12" cy="12" r="1.15" className="icon-accent" fill="currentColor" stroke="none" />
		</svg>
	);
}

export function ShieldIcon({ className }: IconProps) {
	return (
		<svg {...base} className={className}>
			<path d="M12 2.4 4.6 5.5v6.1c0 4.4 3 8.3 7.4 9.9 4.4-1.6 7.4-5.5 7.4-9.9V5.5Z" />
			<path d="M12 7.6v8.6M8.2 11.9h7.6" opacity="0.5" />
			<circle
				cx="12"
				cy="11.9"
				r="1.15"
				className="icon-accent"
				fill="currentColor"
				stroke="none"
			/>
		</svg>
	);
}

export function MetricsIcon({ className }: IconProps) {
	return (
		<svg {...base} className={className}>
			<path d="M3.4 3.4v17.2h17.2" />
			<path d="M6.6 16.4 10.4 12l3.1 2.6 5-6.4" />
			<path d="M15.2 8.2h3.3v3.3" opacity="0.55" />
			<circle
				cx="10.4"
				cy="12"
				r="1.15"
				className="icon-accent"
				fill="currentColor"
				stroke="none"
			/>
		</svg>
	);
}

const socialBase = {
	viewBox: "0 0 24 24",
	fill: "currentColor",
	"aria-hidden": true,
	focusable: "false" as const,
};

export function DiscordIcon() {
	return (
		<svg {...socialBase}>
			<path d="M19.3 6.4a15.4 15.4 0 0 0-3.9-1.2l-.2.4c1.3.3 2.4.8 3.4 1.4-1.7-.9-3.5-1.4-5.4-1.4h-.4c-1.9 0-3.7.5-5.4 1.4 1-.6 2.1-1.1 3.4-1.4l-.2-.4c-1.4.2-2.7.6-3.9 1.2C3.4 10 2.7 13.6 3 17.2A15.6 15.6 0 0 0 7.7 19.6l1-1.4c-.8-.3-1.5-.7-2.2-1.2l.5-.4c2.9 1.4 6.1 1.4 9 0l.5.4c-.7.5-1.4.9-2.2 1.2l1 1.4a15.6 15.6 0 0 0 4.7-2.4c.4-4.2-.6-7.8-2.7-10.8ZM9.3 15c-.9 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Zm5.4 0c-.9 0-1.7-.9-1.7-1.9s.8-1.9 1.7-1.9 1.7.9 1.7 1.9-.8 1.9-1.7 1.9Z" />
		</svg>
	);
}

export function InstagramIcon() {
	return (
		<svg
			{...socialBase}
			fill="none"
			stroke="currentColor"
			strokeWidth={1.4}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<rect x="3.6" y="3.6" width="16.8" height="16.8" rx="4.6" />
			<circle cx="12" cy="12" r="3.9" />
			<circle cx="16.7" cy="7.3" r="1" fill="currentColor" stroke="none" />
		</svg>
	);
}

export function YoutubeIcon() {
	return (
		<svg {...socialBase}>
			<path d="M21.4 8.1c-.2-1.6-.9-2.3-2.5-2.5C17 5.4 12 5.4 12 5.4s-5 0-6.9.2c-1.6.2-2.3.9-2.5 2.5C2.4 9.7 2.4 12 2.4 12s0 2.3.2 3.9c.2 1.6.9 2.3 2.5 2.5 1.9.2 6.9.2 6.9.2s5 0 6.9-.2c1.6-.2 2.3-.9 2.5-2.5.2-1.6.2-3.9.2-3.9s0-2.3-.2-3.9ZM10.1 15.1V8.9l5.3 3.1Z" />
		</svg>
	);
}

export function TwitterIcon() {
	return (
		<svg {...socialBase}>
			<path d="M21.3 6.4c-.7.3-1.4.5-2.2.6.8-.5 1.4-1.2 1.7-2.1-.7.4-1.6.8-2.4 1a3.8 3.8 0 0 0-6.6 2.6c0 .3 0 .6.1.9-3.2-.2-6-1.7-7.9-4a3.8 3.8 0 0 0 1.2 5.1c-.6 0-1.2-.2-1.7-.5a3.8 3.8 0 0 0 3.1 3.8c-.6.2-1.2.2-1.8.1a3.8 3.8 0 0 0 3.6 2.6 7.7 7.7 0 0 1-5.6 1.6 10.8 10.8 0 0 0 5.9 1.7c7 0 10.9-5.9 10.9-11v-.5c.7-.5 1.3-1.2 1.8-2Z" />
		</svg>
	);
}
