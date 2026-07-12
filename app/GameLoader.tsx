"use client";

import dynamic from "next/dynamic";

const ChanganGame = dynamic(() => import("./ChanganGame"), {
  ssr: false,
  loading: () => (
    <main className="game-boot" role="status" aria-live="polite">
      <div className="game-boot-seal">唐</div>
      <p>长安城正在显影</p>
      <i aria-hidden="true" />
    </main>
  ),
});

export default function GameLoader() {
  return <ChanganGame />;
}
