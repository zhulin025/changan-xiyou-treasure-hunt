import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the artifact trail experience and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>西行寻珍｜师徒四人的长安冒险<\/title>/);
  assert.match(html, /长安城正在显影/);
  assert.match(html, /property="og:image" content="http:\/\/localhost:3000\/og.png"/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships twelve sourced artifacts, seeded random placement, progress, and required assets", async () => {
  const source = await readFile(new URL("../app/ChanganGame.tsx", import.meta.url), "utf8");
  for (const id of [44806, 42182, 53958, 42189, 49368, 75765, 73218, 48316, 39770, 39640, 49576, 460652]) {
    assert.match(source, new RegExp(`id: ${id}`));
  }
  assert.match(source, /shuffledAnchorIndices/);
  assert.match(source, /TREASURE_ANCHORS/);
  assert.match(source, /version: 2/);
  assert.match(source, /resolveSafeTreasurePositions/);
  assert.match(source, /hasClearWalkableGround/);
  assert.match(source, /hit\.point\.y >= -1\.0 && hit\.point\.y <= 1\.25/);
  assert.match(source, /samples\.every/);
  assert.match(source, /Zhuque Avenue/);
  assert.match(source, /KeyE/);
  assert.match(source, /changan-artifact-progress/);
  assert.match(source, /唐代博物志/);
  assert.match(source, /createXiyouWorld/);
  assert.match(source, /火眼金睛/);
  assert.match(source, /寻珍鼻/);
  assert.match(source, /guardianBoost/);
  assert.match(source, /玄奘慧解/);
  assert.match(source, /avoidsXiyouLandmarks/);
  assert.match(source, /leaderPosition/);
  assert.match(source, /chaseDistance/);
  assert.match(source, /camera\.lookAt\(lookTarget\)/);
  assert.match(source, /tang-changan-v5\.glb\?v=20260713-5/);
  assert.match(source, /mobileHudOpen/);
  assert.match(source, /currentMode === "walk" \|\| currentMode === "fly"/);
  assert.match(source, /targetRot\.set\(-1\.15, chaseYaw/);
  assert.match(source, /partyMode/);
  assert.match(source, /自由探索/);
  const xiyou = await readFile(new URL("../app/xiyouScene.ts", import.meta.url), "utf8");
  assert.match(xiyou, /createPagoda/);
  assert.match(xiyou, /createLotusCourt/);
  assert.match(xiyou, /createMoonGate/);
  assert.match(xiyou, /updateParty/);
  assert.match(xiyou, /localSlots/);
  assert.match(xiyou, /mode === "explore"/);
  for (const id of ["xuanzang", "wukong", "bajie", "wujing"]) assert.match(xiyou, new RegExp(id));
  await Promise.all([
    access(new URL("../public/models/tang-changan-v5.glb", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);
});
