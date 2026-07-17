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
      <head>
        <script
          defer
          src="https://vibeloft.ai/telemetry/v1.js"
          data-vl-product-id="60011d6d-4f73-447b-ab24-b80aaf2ab764"
          data-vl-auth-key="vl_web.WBiIG2mwXqDLIf3r2BzOEKCfl5135paS2-ItK36wxSI"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
