export const TEMPLATE = {
  heroImage:
    "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/25904405-aa15-491b-9a03-de5fc75f18b3_3840w.webp",
  cardImage1:
    "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/ea262fd9-14f0-4917-be69-86fd3b302ccd_1600w.webp",
  cardImage2:
    "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/ee3841e8-ef6d-45b3-9f33-9df069f9708a_1600w.webp",
  cardImage3:
    "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/68494c15-da1d-47aa-a9ac-b6ee8c9286cc_800w.webp",
  thumb1:
    "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/44d41d4e-32d5-4432-bf2b-95b01b1df21f_320w.webp",
  thumb2:
    "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/a5122f84-43cb-4170-94c3-aded75f0d3ed_320w.webp",
  thumb3:
    "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/7de1229a-6a54-423d-a41c-2377d871bf2c_320w.jpg",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "总览", icon: "solar:home-2-linear" },
  { href: "/prompts", label: "资产库", icon: "solar:archive-linear" },
  { href: "/datasets", label: "数据集", icon: "solar:database-linear" },
  { href: "/evaluations", label: "评测", icon: "solar:chart-2-linear" },
  { href: "/security", label: "安全", icon: "solar:shield-check-linear" },
  { href: "/reviews", label: "审核", icon: "solar:clipboard-check-linear" },
  { href: "/releases", label: "发布", icon: "solar:rocket-2-linear" },
  { href: "/reports", label: "报告", icon: "solar:document-text-linear" },
  { href: "/audit", label: "审计", icon: "solar:document-add-linear" },
  { href: "/settings", label: "设置", icon: "solar:settings-linear" },
] as const;
