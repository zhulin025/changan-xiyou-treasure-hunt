import type { Metadata } from "next";
import GameLoader from "./GameLoader";

export const metadata: Metadata = {
  title: "西行寻珍｜师徒四人的长安冒险",
  description: "选择唐僧师徒任一角色，在 V5 长安城中亲自寻找十二件真实唐代博物馆藏品。",
};

export default function Home() {
  return <GameLoader />;
}
