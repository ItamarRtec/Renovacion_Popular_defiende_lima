import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function IconHome(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}

export function IconVideo(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3v-4Z" />
    </svg>
  );
}

export function IconImage(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="9" r="1.5" />
      <path d="m21 15-4.5-4.5L7 20" />
    </svg>
  );
}

export function IconUsers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 19a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21 19a4.5 4.5 0 0 0-4-4.4" />
    </svg>
  );
}

export function IconChart(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-8" />
    </svg>
  );
}

export function IconShield(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
    </svg>
  );
}

export function IconLink(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 13a5 5 0 0 0 7.07 0l1.4-1.4a5 5 0 0 0-7.07-7.07L10 5.9" />
      <path d="M14 11a5 5 0 0 0-7.07 0L5.5 12.4a5 5 0 0 0 7.07 7.07L14 18.1" />
    </svg>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function IconLogout(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M10 17H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h5" />
      <path d="m15 16 4-4-4-4" />
      <path d="M19 12H10" />
    </svg>
  );
}

export function IconId(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="12" r="2.2" />
      <path d="M14 10h5M14 14h4" />
    </svg>
  );
}

export function IconQr(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 4h6v6H4V4Z" />
      <path d="M14 4h6v6h-6V4Z" />
      <path d="M4 14h6v6H4v-6Z" />
      <path d="M14 14h2v2h-2v-2Z" />
      <path d="M18 14h2v2h-2v-2Z" />
      <path d="M14 18h2v2h-2v-2Z" />
      <path d="M18 18h2v2h-2v-2Z" />
    </svg>
  );
}

export type SidebarIconName =
  | "home"
  | "video"
  | "image"
  | "users"
  | "chart"
  | "shield"
  | "link"
  | "settings"
  | "logout"
  | "qr"
  | "id";

const MAP = {
  home: IconHome,
  video: IconVideo,
  image: IconImage,
  users: IconUsers,
  chart: IconChart,
  shield: IconShield,
  link: IconLink,
  settings: IconSettings,
  logout: IconLogout,
  qr: IconQr,
  id: IconId,
} as const;

export function SidebarIcon({
  name,
  ...props
}: { name: SidebarIconName } & IconProps) {
  const Cmp = MAP[name];
  return <Cmp {...props} />;
}
