import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://changan.liuwa.xyz"),
  title: "西行寻珍｜师徒四人的长安冒险",
  description: "选择唐僧师徒任一角色，在 V5 长安城中亲自寻找十二件真实唐代博物馆藏品。",
  openGraph: {
    title: "西行寻珍｜师徒四人的长安冒险",
    description: "选择角色、带领队伍，在长安亲自寻找十二件唐珍。",
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "西行寻珍：师徒四人的长安冒险" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "西行寻珍｜师徒四人的长安冒险",
    description: "选择角色、带领队伍，在长安亲自寻找十二件唐珍。",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
