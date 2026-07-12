import * as THREE from "three";

export type PilgrimId = "xuanzang" | "wukong" | "bajie" | "wujing";

export type XiyouWorld = {
  root: THREE.Group;
  pilgrims: Record<PilgrimId, THREE.Group>;
  forbiddenZones: { x: number; z: number; radius: number }[];
  updateParty: (elapsed: number, dt: number, active: PilgrimId, leaderPosition: THREE.Vector3, leaderYaw: number, moving: boolean, mode: "follow" | "explore") => void;
};

const palette = {
  paper: 0xe7c9a9,
  pink: 0xd98f91,
  red: 0x9f332a,
  gold: 0xd7972f,
  monkey: 0xc76b28,
  green: 0x275d48,
  teal: 0x355e61,
  black: 0x261d19,
  white: 0xe8e1d4,
  water: 0x6ea7ad,
};

const mat = (color: number, roughness = 0.82, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });

const materials = {
  paper: mat(palette.paper), pink: mat(palette.pink), red: mat(palette.red),
  gold: mat(palette.gold, 0.42, 0.28), monkey: mat(palette.monkey), green: mat(palette.green),
  teal: mat(palette.teal), black: mat(palette.black), white: mat(palette.white),
  skin: mat(0xc98968), pig: mat(0xd7907a), water: new THREE.MeshStandardMaterial({
    color: palette.water, roughness: 0.22, metalness: 0.05, transparent: true, opacity: 0.8,
  }),
};

function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D, position: [number, number, number], rotation?: [number, number, number]) {
  const result = new THREE.Mesh(geometry, material);
  result.position.set(...position);
  if (rotation) result.rotation.set(...rotation);
  parent.add(result);
  return result;
}
function crown(parent: THREE.Object3D, y: number, color = materials.gold) {
  const band = mesh(new THREE.CylinderGeometry(0.53, 0.58, 0.28, 8), color, parent, [0, y, 0]);
  for (let i = 0; i < 5; i += 1) {
    const angle = (i / 5) * Math.PI * 2;
    const spike = mesh(new THREE.ConeGeometry(0.16, 0.72, 4), color, parent, [Math.sin(angle) * 0.39, y + 0.42, Math.cos(angle) * 0.39]);
    spike.rotation.y = angle;
  }
  return band;
}

function limb(parent: THREE.Object3D, material: THREE.Material, position: [number, number, number], length: number, radius: number, rotation: [number, number, number]) {
  const pivot = new THREE.Group();
  pivot.position.set(...position);
  pivot.rotation.set(...rotation);
  parent.add(pivot);
  mesh(new THREE.CylinderGeometry(radius * 0.78, radius, length, 6), material, pivot, [0, -length / 2, 0]);
  return pivot;
}

function createPilgrim(id: PilgrimId) {
  const root = new THREE.Group();
  root.name = `pilgrim-${id}`;
  const runtime: { arms: THREE.Group[]; legs: THREE.Group[]; body: THREE.Group } = { arms: [], legs: [], body: new THREE.Group() };
  root.add(runtime.body);

  const isPig = id === "bajie";
  const bodyMaterial = id === "xuanzang" ? materials.red : id === "wukong" ? materials.monkey : id === "bajie" ? materials.teal : materials.green;
  const bodyRadius = isPig ? 1.18 : 0.72;
  mesh(new THREE.IcosahedronGeometry(bodyRadius, 1), bodyMaterial, runtime.body, [0, 2.55, 0], undefined).scale.set(1, isPig ? 1.05 : 1.35, 0.78);
  mesh(new THREE.IcosahedronGeometry(isPig ? 0.72 : 0.54, 1), isPig ? materials.pig : materials.skin, runtime.body, [0, isPig ? 3.72 : 4.0, 0]);

  if (isPig) {
    mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.25, 8), materials.pig, runtime.body, [0, 3.62, 0.58], [Math.PI / 2, 0, 0]);
    mesh(new THREE.ConeGeometry(0.3, 0.58, 4), materials.pig, runtime.body, [-0.58, 4.04, 0], [0, 0, -1.05]);
    mesh(new THREE.ConeGeometry(0.3, 0.58, 4), materials.pig, runtime.body, [0.58, 4.04, 0], [0, 0, 1.05]);
  } else {
    crown(runtime.body, 4.48, id === "wujing" ? materials.gold : materials.gold);
  }
  if (id === "wujing") {
    mesh(new THREE.ConeGeometry(0.5, 0.62, 7), materials.black, runtime.body, [0, 3.72, -0.16], [Math.PI, 0, 0]);
    mesh(new THREE.TorusGeometry(0.72, 0.13, 6, 12), materials.black, runtime.body, [0, 3.78, -0.25], [Math.PI / 2, 0, 0]);
  }
  if (id === "wukong") {
    mesh(new THREE.ConeGeometry(0.28, 0.7, 5), materials.skin, runtime.body, [-0.52, 4.05, 0], [0, 0, -1.18]);
    mesh(new THREE.ConeGeometry(0.28, 0.7, 5), materials.skin, runtime.body, [0.52, 4.05, 0], [0, 0, 1.18]);
  }

  runtime.arms.push(limb(runtime.body, bodyMaterial, [-bodyRadius * 0.8, 3.12, 0], isPig ? 1.5 : 1.65, 0.22, [0.15, 0, -0.32]));
  runtime.arms.push(limb(runtime.body, bodyMaterial, [bodyRadius * 0.8, 3.12, 0], isPig ? 1.5 : 1.65, 0.22, [-0.15, 0, 0.32]));
  runtime.legs.push(limb(runtime.body, id === "xuanzang" ? materials.white : bodyMaterial, [-0.34, 1.8, 0], 1.72, 0.24, [0, 0, 0]));
  runtime.legs.push(limb(runtime.body, id === "xuanzang" ? materials.white : bodyMaterial, [0.34, 1.8, 0], 1.72, 0.24, [0, 0, 0]));

  if (id === "wukong") {
    const staff = mesh(new THREE.CylinderGeometry(0.11, 0.11, 5.2, 8), materials.red, runtime.body, [0, 3.05, 0.48], [0, 0, Math.PI / 2.7]);
    mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8), materials.gold, staff, [0, 2.35, 0]);
    mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 8), materials.gold, staff, [0, -2.35, 0]);
  } else if (id === "wujing") {
    mesh(new THREE.CylinderGeometry(0.1, 0.1, 5.6, 8), materials.black, runtime.body, [0.75, 2.9, 0], [0, 0, -0.14]);
    mesh(new THREE.ConeGeometry(0.42, 0.9, 4), materials.white, runtime.body, [1.14, 5.52, 0], [0, 0, -0.14]);
  } else if (id === "xuanzang") {
    mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.2, 8), materials.gold, runtime.body, [-0.92, 2.9, 0], [0, 0, 0.08]);
    mesh(new THREE.TorusGeometry(0.38, 0.08, 6, 18), materials.gold, runtime.body, [-1.12, 5.35, 0]);
  } else {
    mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.7, 8), materials.black, runtime.body, [1.05, 2.75, 0], [0, 0, -0.5]);
    mesh(new THREE.TorusGeometry(0.5, 0.1, 6, 12), materials.black, runtime.body, [1.93, 4.28, 0], [Math.PI / 2, 0, 0]);
  }
  root.userData.runtime = runtime;
  root.userData.sculptRuntime = { nodes: { root, body: runtime.body }, sockets: {}, colliders: { body: { type: "capsule", radius: bodyRadius } }, destructionGroups: {} };
  return root;
}

function createPagoda(levels = 5) {
  const root = new THREE.Group();
  for (let level = 0; level < levels; level += 1) {
    const y = level * 4.1;
    const width = 7.7 - level * 0.62;
    mesh(new THREE.BoxGeometry(width, 3.45, width), level % 2 ? materials.paper : materials.red, root, [0, y + 1.72, 0]);
    const roof = mesh(new THREE.CylinderGeometry(width * 0.48, width * 0.71, 1.1, 8), materials.pink, root, [0, y + 3.72, 0]);
    roof.rotation.y = Math.PI / 8;
  }
  const top = levels * 4.1;
  mesh(new THREE.ConeGeometry(0.48, 4.4, 8), materials.gold, root, [0, top + 1.2, 0]);
  return root;
}

function createLotusCourt() {
  const root = new THREE.Group();
  for (const x of [-9, 9]) {
    mesh(new THREE.CylinderGeometry(6, 6, 0.6, 16), materials.paper, root, [x, 0.3, 0]);
    mesh(new THREE.CylinderGeometry(5.25, 5.25, 0.35, 16), materials.water, root, [x, 0.66, 0]);
    for (let i = 0; i < 8; i += 1) {
      const petal = mesh(new THREE.ConeGeometry(0.7, 2.1, 4), materials.pink, root, [x + Math.sin(i) * 2, 1.05, Math.cos(i) * 2], [Math.PI / 2, 0, i * Math.PI / 4]);
      petal.scale.z = 0.35;
    }
  }
  const pavilion = new THREE.Group();
  pavilion.position.set(0, 0, -10);
  for (const x of [-3.6, 3.6]) for (const z of [-3.6, 3.6]) mesh(new THREE.CylinderGeometry(0.28, 0.33, 5.2, 8), materials.red, pavilion, [x, 2.6, z]);
  mesh(new THREE.CylinderGeometry(4.6, 6.2, 1.5, 8), materials.pink, pavilion, [0, 5.55, 0]);
  root.add(pavilion);
  return root;
}

function createMoonGate() {
  const root = new THREE.Group();
  const blocks = 18;
  for (let i = 0; i < blocks; i += 1) {
    const angle = (i / blocks) * Math.PI * 2;
    const block = mesh(new THREE.BoxGeometry(3.3, 5.8, 2.5), materials.pink, root, [Math.cos(angle) * 16, Math.sin(angle) * 16 + 16, 0]);
    block.rotation.z = angle + Math.PI / 2;
  }
  return root;
}

export function createXiyouWorld(): XiyouWorld {
  const root = new THREE.Group();
  root.name = "paper-xiyou-world";
  const pilgrims = {
    xuanzang: createPilgrim("xuanzang"), wukong: createPilgrim("wukong"),
    bajie: createPilgrim("bajie"), wujing: createPilgrim("wujing"),
  };
  const ids: PilgrimId[] = ["xuanzang", "wukong", "bajie", "wujing"];
  ids.forEach((id, index) => {
    pilgrims[id].position.set((index - 1.5) * 3.4, 0, 1370 + Math.abs(index - 1.5) * 1.5);
    pilgrims[id].rotation.y = Math.PI;
    root.add(pilgrims[id]);
  });

  const westPagoda = createPagoda(5); westPagoda.position.set(-510, 0, 460); root.add(westPagoda);
  const eastPagoda = createPagoda(7); eastPagoda.position.set(540, 0, 380); eastPagoda.scale.setScalar(1.25); root.add(eastPagoda);
  const lotus = createLotusCourt(); lotus.position.set(-690, 0, -820); root.add(lotus);
  const gate = createMoonGate(); gate.position.set(720, 0, -1180); gate.rotation.y = -0.28; root.add(gate);

  const forbiddenZones = [
    { x: 0, z: 1370, radius: 22 }, { x: -510, z: 460, radius: 24 },
    { x: 540, z: 380, radius: 30 }, { x: -690, z: -820, radius: 31 }, { x: 720, z: -1180, radius: 28 },
  ];
  return {
    root, pilgrims, forbiddenZones,
    updateParty(elapsed, dt, active, leaderPosition, leaderYaw, moving, mode) {
      const leader = pilgrims[active];
      leader.position.lerp(leaderPosition, 1 - Math.exp(-dt * 18));
      leader.rotation.y = THREE.MathUtils.lerp(leader.rotation.y, leaderYaw, 1 - Math.exp(-dt * 15));
      const followers = ids.filter((id) => id !== active);
      const localSlots = [new THREE.Vector3(-4.2, 0, 5.3), new THREE.Vector3(4.2, 0, 5.3), new THREE.Vector3(0, 0, 9.2)];
      followers.forEach((id, index) => {
        const pilgrim = pilgrims[id];
        const slot = localSlots[index].clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), leaderYaw).add(leaderPosition);
        if (!moving) {
          const roam = mode === "explore" ? 7.5 + index * 1.4 : 1.2 + index * 0.35;
          slot.x += Math.sin(elapsed * (0.23 + index * 0.025) + index * 2.3) * roam;
          slot.z += Math.cos(elapsed * (0.19 + index * 0.03) + index * 1.7) * roam * 0.72;
        }
        const gap = pilgrim.position.distanceTo(slot);
        const followRate = gap > 22 ? 7.5 : moving ? 3.8 : mode === "explore" ? 0.65 : 1.15;
        const before = pilgrim.position.clone();
        pilgrim.position.lerp(slot, 1 - Math.exp(-dt * followRate));
        const delta = pilgrim.position.clone().sub(before);
        if (delta.lengthSq() > 0.0001) pilgrim.rotation.y = Math.atan2(delta.x, delta.z);
      });
      ids.forEach((id, index) => {
        const pilgrim = pilgrims[id];
        const runtime = pilgrim.userData.runtime as { arms: THREE.Group[]; legs: THREE.Group[]; body: THREE.Group };
        const isWalking = id === active ? moving : pilgrim.position.distanceTo(leaderPosition) > 4;
        const stride = isWalking ? Math.sin(elapsed * 7.5 + index) * 0.48 : 0;
        runtime.body.position.y = Math.abs(Math.sin(elapsed * (isWalking ? 7.5 : 1.7) + index)) * (isWalking ? 0.12 : 0.04);
        runtime.legs.forEach((leg, legIndex) => { leg.rotation.x = stride * (legIndex ? -1 : 1); });
        runtime.arms.forEach((arm, armIndex) => { arm.rotation.x = stride * (armIndex ? 0.55 : -0.55); });
        const targetScale = id === active ? 1.18 : 1;
        pilgrim.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
      });
    },
  };
}
