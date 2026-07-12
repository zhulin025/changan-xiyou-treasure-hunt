import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("ships the complete Journey to the West treasure hunt", async () => {
  const source = await readFile(new URL("../app/ChanganGame.tsx", import.meta.url), "utf8");
  for (const id of [44806, 42182, 53958, 42189, 49368, 75765, 73218, 48316, 39770, 39640, 49576, 460652]) {
    assert.match(source, new RegExp(`id: ${id}`));
  }
  assert.match(source, /resolveSafeTreasurePositions/);
  assert.match(source, /tang-changan-v5\.glb\?v=20260713-5/);
  assert.match(source, /mobileHudOpen/);
  assert.match(source, /currentMode === "walk" \|\| currentMode === "fly"/);
  assert.match(source, /targetRot\.set\(-1\.15, chaseYaw/);
  assert.match(source, /changan-artifact-progress/);
  assert.match(source, /唐代博物志/);
  await Promise.all([
    access(new URL("../public/models/tang-changan-v5.glb", import.meta.url)),
    access(new URL("../public/draco/draco_decoder.wasm", import.meta.url)),
    access(new URL("../public/og.png", import.meta.url)),
  ]);
});

test("ships four procedural pilgrims and themed landmarks", async () => {
  const source = await readFile(new URL("../app/xiyouScene.ts", import.meta.url), "utf8");
  for (const id of ["xuanzang", "wukong", "bajie", "wujing"]) assert.match(source, new RegExp(id));
  assert.match(source, /createPagoda/);
  assert.match(source, /createLotusCourt/);
  assert.match(source, /createMoonGate/);
  assert.match(source, /updateParty/);
});
