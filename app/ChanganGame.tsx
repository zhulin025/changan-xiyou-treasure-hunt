"use client";
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
} from "three-mesh-bvh";
import { createXiyouWorld, type PilgrimId } from "./xiyouScene";

type BVHGeometry = THREE.BufferGeometry & {
  computeBoundsTree: typeof computeBoundsTree;
  disposeBoundsTree: typeof disposeBoundsTree;
};

type FirstHitRaycaster = THREE.Raycaster & { firstHitOnly: boolean };

type Artifact = {
  id: number; title: string; chineseTitle: string; era: string; medium: string;
  image: string; museumUrl: string;
  clue: string; fieldNote: string; question: string; choices: string[]; answer: number; insight: string;
};

type TreasureAnchor = { position: [number, number]; location: string; region: string };
type TreasureProgress = { version: 2; seed: number; discovered: number[] };

const PILGRIMS: { id: PilgrimId; name: string; title: string; ability: string; glyph: string }[] = [
  { id: "xuanzang", name: "玄奘", title: "大唐圣僧", ability: "慧解 · 排除一个错误答案", glyph: "玄" },
  { id: "wukong", name: "悟空", title: "齐天大圣", ability: "火眼金睛 · 看见更强宝光", glyph: "悟" },
  { id: "bajie", name: "八戒", title: "天蓬元帅", ability: "寻珍鼻 · 提前感应附近宝藏", glyph: "戒" },
  { id: "wujing", name: "沙僧", title: "卷帘大将", ability: "护行 · 疾行速度提升", glyph: "沙" },
];

const ACTS = [
  { title: "第一幕 · 皇城受诏", copy: "在双塔钟声中寻回四件失落唐珍。" },
  { title: "第二幕 · 莲池照影", copy: "循纸莲与水光，再寻四道归藏灵符。" },
  { title: "第三幕 · 月门归藏", copy: "集齐最后四珍，打开城南月洞门。" },
  { title: "终章 · 四圣归来", copy: "十二珍归位，取经人带着长安记忆再启西行。" },
];

const ARTIFACTS: Artifact[] = [
  {
    id: 44806, title: "Mirror with hunting scene", chineseTitle: "狩猎纹铜镜", era: "8世纪", medium: "青铜",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/59132.jpg",
    museumUrl: "https://www.metmuseum.org/art/collection/search/44806",
    clue: "它以青铜铸成，圆面不饰华彩，背后却藏着骏马、猎手与山林。",
    fieldNote: "密函残句：照人者在前，述猎者在后。",
    question: "这件器物最可能是什么？", choices: ["礼乐用铜钹", "狩猎纹铜镜", "车马鎏金饰"], answer: 1,
    insight: "铜镜背面常成为工匠施展纹饰的天地。狩猎题材也映照了唐代尚武、驰猎的生活风尚。",
  },
  {
    id: 42182, title: "Octagonal cup with ring handle", chineseTitle: "鎏金八棱银杯", era: "8世纪", medium: "局部鎏金银器",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/1985_214_17_238110.jpg",
    museumUrl: "https://www.metmuseum.org/art/collection/search/42182",
    clue: "器身分作八棱，杯侧垂环；银光之间留有金色纹样，像来自远方商队的酒器。",
    fieldNote: "西市胡商说，失物不圆不方，有八面，一环可执。",
    question: "哪项描述与眼前器物吻合？", choices: ["八棱银杯，环柄，局部鎏金", "三足铜鼎，兽首衔环", "白瓷执壶，盘口长流"], answer: 0,
    insight: "唐代金银器吸收了中亚、西亚器物的造型与装饰趣味，是丝路交流在日常宴饮中的缩影。",
  },
  {
    id: 53958, title: "Pillow", chineseTitle: "三彩陶枕", era: "8世纪初", medium: "三彩釉陶器",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/50_221_14.JPG",
    museumUrl: "https://www.metmuseum.org/art/collection/search/53958",
    clue: "绿、褐、乳白釉色在陶胎上自然流淌。它不像明器俑，也不是盛酒的壶。",
    fieldNote: "坊中陶匠只留下四字：枕石非石。",
    question: "判断它使用了哪种工艺？", choices: ["青花釉下彩", "珐琅掐丝", "低温铅釉三彩"], answer: 2,
    insight: "唐三彩以低温铅釉烧成，常见绿、黄褐、白等色彩交融。它不仅用于俑，也见于生活器与建筑构件。",
  },
  {
    id: 42189, title: "Horse", chineseTitle: "唐三彩马", era: "7世纪末至8世纪前半叶", medium: "三彩釉陶器与彩绘",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/1991_253_12.jpg",
    museumUrl: "https://www.metmuseum.org/art/collection/search/42189",
    clue: "昂首、立耳、四蹄稳驻，釉色沿强健的身躯流动。它见证了长安与丝路的速度。",
    fieldNote: "听马蹄声止处，看金光升起。",
    question: "为什么马的形象在唐代格外重要？", choices: ["只作为农耕牲畜", "交通、军事、礼仪与丝路交流皆倚重马", "仅用于宫廷祭祀"], answer: 1,
    insight: "马连接军旅、驿传、贵族生活与丝路贸易。唐代陶马的强健姿态，正是时代气象的视觉表达。",
  },
  {
    id: 49368, title: "Camel", chineseTitle: "唐三彩骆驼", era: "8世纪", medium: "三彩釉陶器",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/67_43_1.JPG",
    museumUrl: "https://www.metmuseum.org/art/collection/search/49368",
    clue: "长颈昂起，双峰载路，绿褐釉色凝在陶胎之上；它从沙海把异域带入长安。",
    fieldNote: "驼铃越远，丝路越近。寻双峰之影。",
    question: "这件动物俑与哪种交流关系最密切？", choices: ["海上渔业", "丝绸之路商旅", "江南稻作"], answer: 1,
    insight: "骆驼是丝路运输的重要象征。唐代墓葬中的骆驼俑，记录了长安作为国际都会的想象与现实。",
  },
  {
    id: 75765, title: "Seated court lady", chineseTitle: "三彩坐姿仕女俑", era: "8世纪", medium: "三彩釉陶器",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/DP227159.jpg",
    museumUrl: "https://www.metmuseum.org/art/collection/search/75765",
    clue: "她端坐从容，衣褶被三彩釉色勾勒，静态中保留着宫廷生活的秩序。",
    fieldNote: "不闻环佩声，只见仕女安坐。",
    question: "这类陶俑最常帮助今天的人理解什么？", choices: ["宫廷服饰与生活风貌", "青铜冶炼温度", "农田灌溉制度"], answer: 0,
    insight: "人物俑把服饰、发式、姿态与社会身份凝固下来，是观察唐代生活风貌的重要视觉材料。",
  },
  {
    id: 73218, title: "Seated Musician", chineseTitle: "白石坐姿乐伎", era: "唐代（618—907）", medium: "白色大理石",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/DP140157.jpg",
    museumUrl: "https://www.metmuseum.org/art/collection/search/73218",
    clue: "她不是彩陶，而由白石雕成；双手持乐，仿佛长安宴饮中的一段乐声被突然凝住。",
    fieldNote: "乐声无形，石中有声。",
    question: "眼前器物采用的主要材质是？", choices: ["白色大理石", "象牙", "白瓷"], answer: 0,
    insight: "唐代乐舞题材反映了宫廷与都市娱乐生活，也见证外来乐器、乐制和表演者在长安的汇聚。",
  },
  {
    id: 48316, title: "Ewer", chineseTitle: "褐釉执壶", era: "7—8世纪", medium: "褐釉炻器",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/11_8_15_01.JPG",
    museumUrl: "https://www.metmuseum.org/art/collection/search/48316",
    clue: "一侧有流，一侧有执，褐釉沉静；它服务于倾注，而非储藏。",
    fieldNote: "有执可提，有流可注。",
    question: "这件器物的主要功能是什么？", choices: ["倾倒酒或水", "焚烧香料", "研磨颜料"], answer: 0,
    insight: "执壶的造型围绕倾注动作展开。唐代陶瓷器形不断吸收金银器和外来器物的影响。",
  },
  {
    id: 39770, title: "Standing Female Attendant", chineseTitle: "彩绘木侍女立像", era: "7世纪末至8世纪初", medium: "彩绘木雕",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/DT209214.jpg",
    museumUrl: "https://www.metmuseum.org/art/collection/search/39770",
    clue: "木胎留下轻盈身姿，颜料仍依稀可见；她不是石刻，也不是常见的陶俑。",
    fieldNote: "木有纹理，彩有余痕，侍者长立。",
    question: "这件立像最特别的胎体材料是？", choices: ["木", "陶", "铜"], answer: 0,
    insight: "木质文物不易保存，因此存世唐代彩绘木俑格外珍贵，也补充了陶俑之外的造像传统。",
  },
  {
    id: 39640, title: "Head of a Bodhisattva", chineseTitle: "菩萨头像", era: "约8世纪初", medium: "彩绘砂岩",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/DP170147.jpg",
    museumUrl: "https://www.metmuseum.org/art/collection/search/39640",
    clue: "砂岩上仍留颜料，眉眼宁静，华冠残存；残缺反而让岁月变得可见。",
    fieldNote: "石上有色，低眉无言。",
    question: "这件造像原本很可能带有什么表面处理？", choices: ["彩绘", "玻璃镶嵌", "漆皮包裹"], answer: 0,
    insight: "今天看到的石刻常呈素色，但许多唐代造像原本施有彩绘。残留颜料帮助研究者还原其视觉面貌。",
  },
  {
    id: 49576, title: "Incense burner", chineseTitle: "鎏金铜香炉", era: "8世纪", medium: "鎏金铜",
    image: "https://images.metmuseum.org/CRDImages/as/web-large/DP-46074-001.jpg",
    museumUrl: "https://www.metmuseum.org/art/collection/search/49576",
    clue: "铜胎覆金，镂空处让香烟逸出；它的价值既在金光，也在缭绕而上的气息。",
    fieldNote: "金光可见，香烟无形。",
    question: "器身镂空最直接的用途是？", choices: ["让香烟散出", "减轻车马重量", "安放弓弦"], answer: 0,
    insight: "香炉兼具实用、宗教和陈设功能。鎏金让金色附着于铜胎，以较少贵金属获得华丽表面。",
  },
  {
    id: 460652, title: "Phoenix-head ewer, Tang sancai ware", chineseTitle: "凤首三彩执壶", era: "7世纪末至8世纪前半叶", medium: "多彩釉陶器",
    image: "https://images.metmuseum.org/CRDImages/rl/web-large/1648-1.jpg",
    museumUrl: "https://www.metmuseum.org/art/collection/search/460652",
    clue: "凤首化作壶口，外来器形与中国瑞鸟在三彩釉色中相遇。",
    fieldNote: "凤衔壶口，三彩流光。",
    question: "这件器物最能体现唐代艺术的哪项特征？", choices: ["中外造型与本土纹样交融", "完全排斥外来风格", "只重文字不重器形"], answer: 0,
    insight: "凤首壶把外来金属器造型、本土瑞鸟意象与唐三彩工艺结合，是跨文化转化的典型例子。",
  },
];

const TREASURE_ANCHORS: TreasureAnchor[] = [
  { position: [-1920, 1410], location: "西南城垣 · 荒草角", region: "西南" },
  { position: [-1450, 1450], location: "西南外坊 · 土墙下", region: "西南" },
  { position: [-860, 1390], location: "明德门西 · 旧驿道", region: "南城" },
  { position: [870, 1410], location: "明德门东 · 旧驿道", region: "南城" },
  { position: [1480, 1430], location: "东南外坊 · 榆树旁", region: "东南" },
  { position: [1920, 1380], location: "东南城垣 · 荒草角", region: "东南" },
  { position: [-1980, 760], location: "西城边坊 · 曲巷尽头", region: "西城" },
  { position: [1980, 730], location: "东城边坊 · 曲巷尽头", region: "东城" },
  { position: [-1940, 80], location: "西市外缘 · 货栈背后", region: "西城" },
  { position: [1940, 110], location: "东市外缘 · 货栈背后", region: "东城" },
  { position: [-1990, -620], location: "西北里坊 · 僻静井台", region: "西北" },
  { position: [1990, -580], location: "东北里坊 · 僻静井台", region: "东北" },
  { position: [-1880, -1280], location: "西北寺塔 · 墙外松影", region: "西北" },
  { position: [1880, -1260], location: "东北寺塔 · 墙外松影", region: "东北" },
  { position: [-1840, -1840], location: "皇城西北角 · 风墙下", region: "西北" },
  { position: [1840, -1840], location: "皇城东北角 · 风墙下", region: "东北" },
  { position: [-1260, -2150], location: "北苑西隅 · 山影前", region: "北城" },
  { position: [1260, -2150], location: "北苑东隅 · 山影前", region: "北城" },
  { position: [-52, 1120], location: "朱雀门内 · 西侧石渠", region: "中轴" },
  { position: [54, 720], location: "朱雀大街 · 南段旗亭", region: "中轴" },
  { position: [-50, 280], location: "朱雀大街 · 市声深处", region: "中轴" },
  { position: [52, -180], location: "朱雀大街 · 坊门之间", region: "中轴" },
  { position: [-48, -720], location: "朱雀大街 · 北段鼓楼", region: "中轴" },
  { position: [48, -1160], location: "皇城南 · 御道边", region: "中轴" },
];

function shuffledAnchorIndices(seed: number) {
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const shuffle = (values: number[]) => {
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
  };
  const guaranteed = ["西南", "东南", "西北", "东北"].map((region) => {
    const candidates = TREASURE_ANCHORS
      .map((anchor, index) => ({ anchor, index }))
      .filter(({ anchor }) => anchor.region === region)
      .map(({ index }) => index);
    return candidates[Math.floor(random() * candidates.length)];
  });
  const remaining = shuffle(TREASURE_ANCHORS.map((_, index) => index).filter((index) => !guaranteed.includes(index)));
  return shuffle([...guaranteed, ...remaining.slice(0, ARTIFACTS.length - guaranteed.length)]);
}

const DEFAULT_SEED = 20260712;

const WORLD_LIMITS = { minX: -2050, maxX: 2050, minZ: -2250, maxZ: 1520 };

export default function ChanganGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const compassRef = useRef<HTMLSpanElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const keysRef = useRef(new Set<string>());
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"walk" | "fly" | "panoramic">("walk");
  const [activeArtifact, setActiveArtifact] = useState(0);
  const [discovered, setDiscovered] = useState<number[]>([]);
  const [nearArtifact, setNearArtifact] = useState(false);
  const [inspection, setInspection] = useState<Artifact | null>(null);
  const [wrongChoice, setWrongChoice] = useState<number | null>(null);
  const [inspectionLocation, setInspectionLocation] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const [trailReading, setTrailReading] = useState("向北 · 约 220 步");
  const [runSeed, setRunSeed] = useState(DEFAULT_SEED);
  const [placementIndices, setPlacementIndices] = useState(() => shuffledAnchorIndices(DEFAULT_SEED));
  const [activePilgrim, setActivePilgrim] = useState<PilgrimId>("wukong");
  const [partyMode, setPartyMode] = useState<"follow" | "explore">("follow");
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const changeViewModeRef = useRef<((mode: "walk" | "fly" | "panoramic") => void) | null>(null);
  const activeArtifactRef = useRef(0);
  const nearArtifactRef = useRef(false);
  const openInspectionRef = useRef<(() => void) | null>(null);
  const pointerLockCooldownUntilRef = useRef(0);
  const placementIndicesRef = useRef(placementIndices);
  const runSeedRef = useRef(runSeed);
  const activePilgrimRef = useRef<PilgrimId>("wukong");
  const partyModeRef = useRef<"follow" | "explore">("follow");
  const resolvedPositionsRef = useRef<[number, number][]>(
    placementIndices.map((anchorIndex) => [...TREASURE_ANCHORS[anchorIndex].position]),
  );
  const resolveTreasurePositionsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("changan-artifact-progress");
    let frame = 0;
    const applyProgress = (seed: number, ids: number[]) => {
      const validIds = ids.filter((id) => ARTIFACTS.some((artifact) => artifact.id === id));
      const progress: TreasureProgress = { version: 2, seed, discovered: validIds };
      window.localStorage.setItem("changan-artifact-progress", JSON.stringify(progress));
      frame = window.requestAnimationFrame(() => {
        setRunSeed(seed);
        setPlacementIndices(shuffledAnchorIndices(seed));
        setDiscovered(validIds);
        setActiveArtifact(Math.min(validIds.length, ARTIFACTS.length));
      });
    };
    if (!saved) {
      applyProgress((Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0, []);
      return () => window.cancelAnimationFrame(frame);
    }
    try {
      const parsed = JSON.parse(saved) as TreasureProgress | number[];
      if (Array.isArray(parsed)) applyProgress((Date.now() ^ 0xa53c91) >>> 0, parsed);
      else applyProgress(parsed.seed >>> 0, parsed.discovered ?? []);
    } catch {
      window.localStorage.removeItem("changan-artifact-progress");
      applyProgress((Date.now() ^ 0x7f4a11) >>> 0, []);
    }
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => { activeArtifactRef.current = activeArtifact; }, [activeArtifact]);
  useEffect(() => { activePilgrimRef.current = activePilgrim; }, [activePilgrim]);
  useEffect(() => { partyModeRef.current = partyMode; }, [partyMode]);
  useEffect(() => {
    runSeedRef.current = runSeed;
    placementIndicesRef.current = placementIndices;
    resolvedPositionsRef.current = placementIndices.map((anchorIndex) => [
      ...TREASURE_ANCHORS[anchorIndex].position,
    ]);
    resolveTreasurePositionsRef.current?.();
  }, [placementIndices, runSeed]);

  const openInspection = useCallback(() => {
    const artifact = ARTIFACTS[activeArtifactRef.current];
    if (!artifact || !nearArtifactRef.current) return;
    if (document.pointerLockElement) document.exitPointerLock();
    const anchorIndex = placementIndicesRef.current[activeArtifactRef.current];
    setInspectionLocation(TREASURE_ANCHORS[anchorIndex]?.location ?? "长安城中");
    setWrongChoice(null);
    setInspection(artifact);
  }, []);

  useEffect(() => { openInspectionRef.current = openInspection; }, [openInspection]);


  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const viewModeRef = { current: "walk" as "walk" | "fly" | "panoramic" };
    const transitionRef = {
      active: false,
      duration: 1.0,
      elapsed: 0,
      startPos: new THREE.Vector3(),
      startRot: new THREE.Euler(),
      targetPos: new THREE.Vector3(),
      targetRot: new THREE.Euler(),
    };

    (THREE.BufferGeometry.prototype as BVHGeometry).computeBoundsTree = computeBoundsTree;
    (THREE.BufferGeometry.prototype as BVHGeometry).disposeBoundsTree = disposeBoundsTree;
    THREE.Mesh.prototype.raycast = acceleratedRaycast;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x91afbb);
    scene.fog = new THREE.FogExp2(0x9eaaa5, 0.00022);

    const camera = new THREE.PerspectiveCamera(68, mount.clientWidth / mount.clientHeight, 0.5, 6500);
    camera.position.set(0, 11, 1388);
    camera.rotation.order = "YXZ";
    const leaderPosition = new THREE.Vector3(0, 0, 1370);
    let leaderYaw = Math.PI;
    let chaseYaw = 0;
    let chasePitch = 0.28;
    let chaseDistance = 18;

    const changeViewMode = (newMode: "walk" | "fly" | "panoramic") => {
      if (transitionRef.active) return;
      const currentMode = viewModeRef.current;
      if (currentMode === newMode) return;

      transitionRef.startPos.copy(camera.position);
      transitionRef.startRot.copy(camera.rotation);

      const targetPos = new THREE.Vector3().copy(camera.position);
      const targetRot = new THREE.Euler().copy(camera.rotation);

      if (newMode === "panoramic") {
        targetPos.y = 2200;
        targetRot.set(-1.15, chaseYaw, 0, "YXZ");
      } else if (newMode === "walk") {
        leaderPosition.y = 0;
        targetPos.set(leaderPosition.x, 10, leaderPosition.z + chaseDistance);
        targetRot.set(-0.2, chaseYaw, 0, "YXZ");
      } else if (newMode === "fly") {
        leaderPosition.y = Math.max(leaderPosition.y, 28);
        targetPos.set(leaderPosition.x, leaderPosition.y + 10, leaderPosition.z + chaseDistance);
        targetRot.set(-0.2, chaseYaw, 0, "YXZ");
      }

      transitionRef.targetPos.copy(targetPos);
      transitionRef.targetRot.copy(targetRot);
      transitionRef.elapsed = 0;

      const needsLongTransition =
        currentMode === "panoramic" ||
        newMode === "panoramic" ||
        (currentMode === "fly" && newMode === "walk" && camera.position.y > 20);
      transitionRef.duration = needsLongTransition ? 1.0 : 0.15;
      transitionRef.active = true;

      viewModeRef.current = newMode;
      setViewMode(newMode);
    };

    changeViewModeRef.current = changeViewMode;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.className = "game-canvas";
    mount.appendChild(renderer.domElement);
    canvasRef.current = renderer.domElement;

    const hemi = new THREE.HemisphereLight(0xdbeaf0, 0x6a4a34, 2.25);
    scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffddab, 3.4);
    sun.position.set(-900, 1200, 700);
    scene.add(sun);

    const sunDisc = new THREE.Mesh(
      new THREE.SphereGeometry(38, 20, 12),
      new THREE.MeshBasicMaterial({ color: 0xffddb0, fog: false }),
    );
    sunDisc.position.set(-1050, 720, -3300);
    scene.add(sunDisc);

    const xiyouWorld = createXiyouWorld();
    scene.add(xiyouWorld.root);

    const colliders: THREE.Mesh[] = [];
    const artifactMarkers = ARTIFACTS.map((_, index) => {
      const group = new THREE.Group();
      const anchor = TREASURE_ANCHORS[placementIndicesRef.current[index]];
      group.position.set(anchor.position[0], 2.6, anchor.position[1]);
      group.userData.artifactIndex = index;
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(8.5, 0.65, 12, 48),
        new THREE.MeshBasicMaterial({ color: 0xe8b85f, transparent: true, opacity: 0.88 }),
      );
      ring.rotation.x = Math.PI / 2;
      group.add(ring);
      const core = new THREE.Mesh(
        new THREE.OctahedronGeometry(2.6, 0),
        new THREE.MeshStandardMaterial({ color: 0xffe1a0, emissive: 0xd88728, emissiveIntensity: 3.2, roughness: 0.35 }),
      );
      core.position.y = 7;
      group.add(core);
      const beam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 4.2, 34, 18, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xdca94e, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false }),
      );
      beam.position.y = 17;
      group.add(beam);
      scene.add(group);
      return group;
    });
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    const resolveSafeTreasurePositions = () => {
      const groundRaycaster = new THREE.Raycaster() as FirstHitRaycaster;
      groundRaycaster.firstHitOnly = true;
      const down = new THREE.Vector3(0, -1, 0);
      const samples: [number, number][] = [[0, 0], [5, 0], [-5, 0], [0, 5], [0, -5], [4, 4], [-4, 4], [4, -4], [-4, -4]];
      const occupied: [number, number][] = [];

      const hasClearWalkableGround = (x: number, z: number) => {
        if (x < WORLD_LIMITS.minX + 12 || x > WORLD_LIMITS.maxX - 12 || z < WORLD_LIMITS.minZ + 12 || z > WORLD_LIMITS.maxZ - 12) return false;
        return samples.every(([offsetX, offsetZ]) => {
          groundRaycaster.set(new THREE.Vector3(x + offsetX, 120, z + offsetZ), down);
          groundRaycaster.near = 0;
          groundRaycaster.far = 140;
          const hit = groundRaycaster.intersectObjects(colliders, false)[0];
          // Ground, paving, drains and low curbs remain below this height.
          // Roofs, walls, trees, carts and architectural props are rejected.
          return Boolean(hit && hit.point.y >= -1.0 && hit.point.y <= 1.25);
        });
      };

      const isSeparated = (x: number, z: number) => occupied.every(([otherX, otherZ]) => Math.hypot(x - otherX, z - otherZ) >= 70);
      const avoidsXiyouLandmarks = (x: number, z: number) => xiyouWorld.forbiddenZones.every((zone) => Math.hypot(x - zone.x, z - zone.z) > zone.radius);
      const seedAngle = ((runSeedRef.current % 360) * Math.PI) / 180;
      const rings = [0, 18, 36, 54, 78, 108, 144, 190, 250];

      const resolved = placementIndicesRef.current.map((anchorIndex, artifactIndex) => {
        const base = TREASURE_ANCHORS[anchorIndex].position;
        for (const radius of rings) {
          const steps = radius === 0 ? 1 : 20;
          for (let step = 0; step < steps; step += 1) {
            const angle = seedAngle + artifactIndex * 1.71 + (step / steps) * Math.PI * 2;
            const x = Math.round((base[0] + Math.cos(angle) * radius) * 10) / 10;
            const z = Math.round((base[1] + Math.sin(angle) * radius) * 10) / 10;
            if (isSeparated(x, z) && avoidsXiyouLandmarks(x, z) && hasClearWalkableGround(x, z)) {
              occupied.push([x, z]);
              return [x, z] as [number, number];
            }
          }
        }
        // If a whole neighborhood is obstructed, fall back to a deterministic
        // scan along the broad Zhuque Avenue instead of ever accepting a roof.
        for (let row = 0; row < 30; row += 1) {
          const z = 1040 - ((row * 97 + artifactIndex * 43) % 2450);
          for (const x of [-48, 48, 0]) {
            if (isSeparated(x, z) && avoidsXiyouLandmarks(x, z) && hasClearWalkableGround(x, z)) {
              occupied.push([x, z]);
              return [x, z] as [number, number];
            }
          }
        }
        // The avenue centerline is authored as open ground; this final branch
        // is only reachable if collision data is missing or corrupt.
        const emergency: [number, number] = [0, 1000 - artifactIndex * 190];
        occupied.push(emergency);
        return emergency;
      });

      resolvedPositionsRef.current = resolved;
      artifactMarkers.forEach((marker, index) => {
        const position = resolved[index];
        marker.position.set(position[0], 2.6, position[1]);
      });
    };
    resolveTreasurePositionsRef.current = resolveSafeTreasurePositions;

    loader.load(
      "/models/tang-changan-v5.glb?v=20260713-5",
      (gltf) => {
        gltf.scene.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.frustumCulled = true;
          const geometry = object.geometry as BVHGeometry;
          geometry.computeBoundsTree({ targetLeafSize: 24 });
          colliders.push(object);
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => {
            if (material.name === "WEB_MAT_Horizon_Haze") {
              material.transparent = true;
              material.opacity = 1;
              material.depthWrite = false;
            }
            if (material instanceof THREE.MeshStandardMaterial) {
              material.roughness = Math.max(0.58, material.roughness);
              material.envMapIntensity = 0.35;
            }
          });
        });
        scene.add(gltf.scene);
        resolveSafeTreasurePositions();
        setProgress(100);
        setReady(true);
      },
      (event) => {
        if (event.total) setProgress(Math.min(96, Math.round((event.loaded / event.total) * 100)));
      },
      () => setError("长安城模型未能载入，请刷新页面重试。"),
    );

    const keys = keysRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
        event.preventDefault();
      }
      if (event.code === "KeyV") {
        if (viewModeRef.current === "panoramic") {
          changeViewMode("walk");
        } else {
          changeViewMode("panoramic");
        }
      }
      if (event.code === "KeyF") {
        if (viewModeRef.current === "fly") {
          changeViewMode("walk");
        } else {
          changeViewMode("fly");
        }
      }
      if (event.code === "KeyE" && nearArtifactRef.current) {
        event.preventDefault();
        openInspectionRef.current?.();
      }
      if (event.code === "KeyR" && viewModeRef.current === "walk") {
        setPartyMode((mode) => mode === "follow" ? "explore" : "follow");
      }
      keys.add(event.code);
    };
    const onKeyUp = (event: KeyboardEvent) => keys.delete(event.code);
    const onBlur = () => keys.clear();
    const onMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement !== renderer.domElement) return;
      if (viewModeRef.current === "walk" || viewModeRef.current === "fly") {
        chaseYaw -= event.movementX * 0.0024;
        chasePitch = THREE.MathUtils.clamp(chasePitch + event.movementY * 0.0018, 0.12, 0.62);
      } else {
        camera.rotation.y -= event.movementX * 0.0018;
        camera.rotation.x = THREE.MathUtils.clamp(camera.rotation.x - event.movementY * 0.0015, -1.5, -0.25);
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (viewModeRef.current === "walk" || viewModeRef.current === "fly") {
        chaseDistance = THREE.MathUtils.clamp(chaseDistance + event.deltaY * 0.012, 10, 28);
        return;
      }
      if (viewModeRef.current !== "panoramic") return;
      camera.position.y = THREE.MathUtils.clamp(
        camera.position.y + event.deltaY * 1.5,
        150,
        3000
      );
    };
    const onPointerLock = () => {
      const isLocked = document.pointerLockElement === renderer.domElement;
      setLocked(isLocked);
      if (!isLocked) {
        pointerLockCooldownUntilRef.current = performance.now() + 750;
      }
    };
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("pointerlockchange", onPointerLock);

    const clock = new THREE.Clock();
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    const movement = new THREE.Vector3();
    const raycaster = new THREE.Raycaster() as FirstHitRaycaster;
    raycaster.firstHitOnly = true;
    let animationId = 0;
    let hudTimer = 0;

    const canMove = (delta: THREE.Vector3) => {
      if (!colliders.length || delta.lengthSq() < 0.00001) return true;
      const distance = delta.length();
      const direction = delta.clone().normalize();
      const origin = leaderPosition.clone();
      origin.y = 2.2;
      raycaster.set(origin, direction);
      raycaster.near = 0;
      raycaster.far = distance + 2.2;
      return raycaster.intersectObjects(colliders, false).length === 0;
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);

      if (transitionRef.active) {
        transitionRef.elapsed += dt;
        const progress = Math.min(transitionRef.elapsed / transitionRef.duration, 1.0);
        const easeProgress = THREE.MathUtils.smoothstep(progress, 0, 1);
        
        camera.position.lerpVectors(transitionRef.startPos, transitionRef.targetPos, easeProgress);
        
        const qStart = new THREE.Quaternion().setFromEuler(transitionRef.startRot);
        const qTarget = new THREE.Quaternion().setFromEuler(transitionRef.targetRot);
        const qCurrent = new THREE.Quaternion().slerpQuaternions(qStart, qTarget, easeProgress);
        camera.rotation.setFromQuaternion(qCurrent, "YXZ");

        if (progress >= 1.0) {
          transitionRef.active = false;
          camera.position.copy(transitionRef.targetPos);
          camera.rotation.copy(transitionRef.targetRot);
        }
        renderer.render(scene, camera);
        return;
      }

      const currentMode = viewModeRef.current;

      if (currentMode === "fly") {
        if (keys.has("ArrowLeft") || keys.has("KeyQ")) camera.rotation.y += dt * 1.25;
        if (keys.has("ArrowRight") || keys.has("KeyE")) camera.rotation.y -= dt * 1.25;
      }

      movement.set(0, 0, 0);

      if (currentMode === "panoramic") {
        forward.set(-Math.sin(camera.rotation.y), 0, -Math.cos(camera.rotation.y));
        right.crossVectors(forward, camera.up).normalize();
        if (keys.has("ArrowUp") || keys.has("KeyW")) movement.add(forward);
        if (keys.has("ArrowDown") || keys.has("KeyS")) movement.sub(forward);
        if (keys.has("KeyA")) movement.sub(right);
        if (keys.has("KeyD")) movement.add(right);
      } else if (currentMode === "fly") {
        forward.set(-Math.sin(chaseYaw), 0, -Math.cos(chaseYaw));
        right.crossVectors(forward, camera.up).normalize();

        if (keys.has("ArrowUp") || keys.has("KeyW")) movement.add(forward);
        if (keys.has("ArrowDown") || keys.has("KeyS")) movement.sub(forward);
        if (keys.has("KeyA")) movement.sub(right);
        if (keys.has("KeyD")) movement.add(right);

        if (keys.has("Space")) movement.y += 1;
        if (keys.has("KeyC")) movement.y -= 1;
      } else {
        forward.set(-Math.sin(chaseYaw), 0, -Math.cos(chaseYaw));
        right.crossVectors(forward, camera.up).normalize();

        if (keys.has("ArrowUp") || keys.has("KeyW")) movement.add(forward);
        if (keys.has("ArrowDown") || keys.has("KeyS")) movement.sub(forward);
        if (keys.has("KeyA")) movement.sub(right);
        if (keys.has("KeyD")) movement.add(right);
      }

      if (movement.lengthSq() > 0) {
        let speed = 18;
        if (currentMode === "panoramic") {
          speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 360 : 120;
        } else if (currentMode === "fly") {
          speed = keys.has("ShiftLeft") || keys.has("ShiftRight") ? 150 : 70;
        } else {
          const guardianBoost = activePilgrimRef.current === "wujing" ? 1.28 : 1;
          speed = (keys.has("ShiftLeft") || keys.has("ShiftRight") ? 150 : 50) * guardianBoost;
        }

        if (currentMode === "panoramic") {
          movement.normalize().multiplyScalar(speed * dt);
          camera.position.add(movement);
          camera.position.x = THREE.MathUtils.clamp(camera.position.x, WORLD_LIMITS.minX, WORLD_LIMITS.maxX);
          camera.position.z = THREE.MathUtils.clamp(camera.position.z, WORLD_LIMITS.minZ, WORLD_LIMITS.maxZ);
          
          camera.position.y = THREE.MathUtils.clamp(camera.position.y, 150, 3000);
        } else if (currentMode === "fly") {
          movement.normalize().multiplyScalar(speed * dt);
          leaderPosition.add(movement);
          leaderPosition.x = THREE.MathUtils.clamp(leaderPosition.x, WORLD_LIMITS.minX, WORLD_LIMITS.maxX);
          leaderPosition.y = THREE.MathUtils.clamp(leaderPosition.y, 12, 1500);
          leaderPosition.z = THREE.MathUtils.clamp(leaderPosition.z, WORLD_LIMITS.minZ, WORLD_LIMITS.maxZ);
          leaderYaw = Math.atan2(movement.x, movement.z);
        } else {
          movement.normalize().multiplyScalar(speed * dt);
          if (canMove(movement)) {
            leaderPosition.add(movement);
            leaderPosition.x = THREE.MathUtils.clamp(leaderPosition.x, WORLD_LIMITS.minX, WORLD_LIMITS.maxX);
            leaderPosition.z = THREE.MathUtils.clamp(leaderPosition.z, WORLD_LIMITS.minZ, WORLD_LIMITS.maxZ);
            leaderYaw = Math.atan2(movement.x, movement.z);
          }
        }
      }

      if (currentMode === "walk" || currentMode === "fly") {
        const lookTarget = leaderPosition.clone().add(new THREE.Vector3(0, 4.15, 0));
        const horizontalDistance = Math.cos(chasePitch) * chaseDistance;
        const desiredCamera = new THREE.Vector3(
          leaderPosition.x + Math.sin(chaseYaw) * horizontalDistance,
          leaderPosition.y + 4.3 + Math.sin(chasePitch) * chaseDistance,
          leaderPosition.z + Math.cos(chaseYaw) * horizontalDistance,
        );
        if (colliders.length) {
          const cameraDelta = desiredCamera.clone().sub(lookTarget);
          raycaster.set(lookTarget, cameraDelta.clone().normalize());
          raycaster.near = 0;
          raycaster.far = cameraDelta.length();
          const obstruction = raycaster.intersectObjects(colliders, false)[0];
          if (obstruction) desiredCamera.copy(obstruction.point).addScaledVector(raycaster.ray.direction, -1.2);
        }
        camera.position.lerp(desiredCamera, 1 - Math.exp(-dt * 9));
        camera.lookAt(lookTarget);
      }

      hudTimer += dt;
      if (hudTimer > 0.12) {
        hudTimer = 0;
        const degrees = (THREE.MathUtils.radToDeg(camera.rotation.y) % 360 + 360) % 360;
        const direction = degrees < 45 || degrees >= 315 ? "北" : degrees < 135 ? "西" : degrees < 225 ? "南" : "东";
        if (compassRef.current) compassRef.current.textContent = `${direction} · ${Math.round(degrees)}°`;
        const trackedPosition = currentMode === "walk" || currentMode === "fly" ? leaderPosition : camera.position;
        if (coordsRef.current) coordsRef.current.textContent = `坊位 ${Math.round(trackedPosition.x)}, ${Math.round(-trackedPosition.z)}`;
        const target = resolvedPositionsRef.current[activeArtifactRef.current];
        if (target) {
          const dx = target[0] - trackedPosition.x;
          const dz = target[1] - trackedPosition.z;
          const distance = Math.hypot(dx, dz);
          const direction = Math.abs(dz) >= Math.abs(dx) ? (dz < 0 ? "向北" : "向南") : (dx > 0 ? "向东" : "向西");
          const reading = activePilgrimRef.current === "wukong"
            ? `${direction} · ${Math.max(1, Math.round(distance))} 步 · 火眼已定向`
            : activePilgrimRef.current === "bajie" && distance < 260
              ? `${direction} · 寻珍鼻感应：已在附近`
              : `${direction} · 约 ${Math.max(1, Math.round(distance / 10) * 10)} 步`;
          setTrailReading(reading);
        }
        const isNear = target
          ? Math.hypot(trackedPosition.x - target[0], trackedPosition.z - target[1]) < (activePilgrimRef.current === "bajie" ? 48 : 32)
          : false;
        if (isNear !== nearArtifactRef.current) {
          nearArtifactRef.current = isNear;
          setNearArtifact(isNear);
        }
      }
      artifactMarkers.forEach((marker, index) => {
        const position = resolvedPositionsRef.current[index];
        if (position && (marker.position.x !== position[0] || marker.position.z !== position[1])) {
          marker.position.set(position[0], 2.6, position[1]);
        }
        marker.visible = index === activeArtifactRef.current;
        if (!marker.visible) return;
        marker.rotation.y += dt * 0.42;
        const pulse = (activePilgrimRef.current === "wukong" ? 1.45 : 1) + Math.sin(clock.elapsedTime * 2.3) * 0.08;
        marker.scale.setScalar(pulse);
        marker.children[1].position.y = 7 + Math.sin(clock.elapsedTime * 1.8) * 1.2;
      });
      xiyouWorld.updateParty(clock.elapsedTime, dt, activePilgrimRef.current, leaderPosition, leaderYaw, (currentMode === "walk" || currentMode === "fly") && movement.lengthSq() > 0, partyModeRef.current);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointerlockchange", onPointerLock);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const geometry = object.geometry as BVHGeometry;
        geometry.disposeBoundsTree?.();
        geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      dracoLoader.dispose();
      resolveTreasurePositionsRef.current = null;
      renderer.domElement.remove();
    };
  }, []);

  const requestPointerLockSafely = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || document.pointerLockElement === canvas) return;
    if (performance.now() < pointerLockCooldownUntilRef.current) return;

    const lockRequest = canvas.requestPointerLock?.();
    if (lockRequest && "catch" in lockRequest) {
      lockRequest.catch(() => {
        // Browsers reject immediately after the user exits pointer lock with Esc.
      });
    }
  }, []);

  const enterGame = () => {
    if (!ready) return;
    setStarted(true);
    setBriefOpen(true);
    requestPointerLockSafely();
  };

  const chooseAnswer = (choice: number) => {
    if (!inspection) return;
    if (choice !== inspection.answer) {
      setWrongChoice(choice);
      return;
    }
    const nextDiscovered = Array.from(new Set([...discovered, inspection.id]));
    setDiscovered(nextDiscovered);
    const progress: TreasureProgress = { version: 2, seed: runSeed, discovered: nextDiscovered };
    window.localStorage.setItem("changan-artifact-progress", JSON.stringify(progress));
    setActiveArtifact(Math.min(nextDiscovered.length, ARTIFACTS.length));
    setWrongChoice(null);
  };

  const closeInspection = () => {
    setInspection(null);
    setWrongChoice(null);
    requestPointerLockSafely();
  };

  const resetTrail = () => {
    const nextSeed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
    const progress: TreasureProgress = { version: 2, seed: nextSeed, discovered: [] };
    window.localStorage.setItem("changan-artifact-progress", JSON.stringify(progress));
    setRunSeed(nextSeed);
    setPlacementIndices(shuffledAnchorIndices(nextSeed));
    setDiscovered([]);
    setActiveArtifact(0);
    setArchiveOpen(false);
  };

  const setTouchKey = (code: string, active: boolean) => {
    if (active) keysRef.current.add(code);
    else keysRef.current.delete(code);
  };

  const activeAnchor = activeArtifact < ARTIFACTS.length
    ? TREASURE_ANCHORS[placementIndices[activeArtifact]]
    : null;
  const activePilgrimData = PILGRIMS.find((pilgrim) => pilgrim.id === activePilgrim) ?? PILGRIMS[1];
  const act = ACTS[Math.min(3, Math.floor(discovered.length / 4))];

  return (
    <main className="game-shell">
      <div className="viewport" ref={mountRef} aria-label="唐长安城第一人称三维场景" />

      <header className="masthead" aria-label="游戏标题">
        <div className="seal" aria-hidden="true">唐</div>
        <div>
          <p className="eyebrow">大唐 · 西行前夜</p>
          <h1>长安寻珍记</h1>
        </div>
      </header>

      {started && (
        <>
          <div className="hud hud-left">
            <span className="hud-label">所向</span>
            <strong ref={compassRef}>北 · 0°</strong>
          </div>
          <div className="hud hud-right">
            <span ref={coordsRef}>坊位 0, -1450</span>
            <div className="mode-selector">
              <button
                type="button"
                className={viewMode === "walk" ? "active-mode" : ""}
                onClick={() => changeViewModeRef.current?.("walk")}
              >
                🎥 跟随
              </button>
              <button
                type="button"
                className={viewMode === "fly" ? "active-mode" : ""}
                onClick={() => changeViewModeRef.current?.("fly")}
              >
                🦅 飞行
              </button>
              <button
                type="button"
                className={viewMode === "panoramic" ? "active-mode" : ""}
                onClick={() => changeViewModeRef.current?.("panoramic")}
              >
                🗺️ 全景
              </button>
            </div>
            <button type="button" style={{ marginTop: "6px" }} onClick={requestPointerLockSafely}>
              {locked ? "视角已跟随" : "启用鼠标观察"}
            </button>
            <button type="button" className="archive-trigger" onClick={() => { if (document.pointerLockElement) document.exitPointerLock(); setArchiveOpen(true); }}>
              博物志 {discovered.length}/{ARTIFACTS.length}
            </button>
          </div>
          <button className="mobile-drawer-toggle" type="button" aria-expanded={mobileHudOpen} onClick={() => setMobileHudOpen((open) => !open)}>{mobileHudOpen ? "收起任务" : "任务 · 队伍"}</button>
          <aside className={`quest-card ${mobileHudOpen ? "mobile-open" : "mobile-closed"}`} aria-live="polite">
            <div className="quest-card-head"><span>{act.title}</span><b>{Math.min(activeArtifact + 1, ARTIFACTS.length)} / {ARTIFACTS.length}</b></div>
            <p className="act-copy">{act.copy}</p>
            {activeArtifact < ARTIFACTS.length ? <>
              <p className="quest-place">{activeAnchor?.location ?? "长安城中"} · {activeAnchor?.region}</p>
              <h2>{ARTIFACTS[activeArtifact].chineseTitle.replace(/./g, "□")}</h2>
              <p>{ARTIFACTS[activeArtifact].fieldNote}</p>
              <div className="quest-distance"><i /> {trailReading}</div>
            </> : <>
              <p className="quest-place">寻踪告成</p><h2>十二珍归档</h2>
              <p>十二件文物投影已全部鉴定。打开博物志，重温它们跨越千年的来路。</p>
            </>}
          </aside>
          <aside className={`party-card ${mobileHudOpen ? "mobile-open" : "mobile-closed"}`} aria-label="师徒领队选择">
            <div className="party-heading"><span>西行小队</span><b>{activePilgrimData.ability}</b></div>
            <div className="party-roster">
              {PILGRIMS.map((pilgrim) => <button
                type="button"
                key={pilgrim.id}
                className={activePilgrim === pilgrim.id ? `active ${pilgrim.id}` : pilgrim.id}
                onClick={() => { setActivePilgrim(pilgrim.id); setMobileHudOpen(false); }}
                aria-pressed={activePilgrim === pilgrim.id}
                title={`${pilgrim.title} · ${pilgrim.ability}`}
              ><i>{pilgrim.glyph}</i><span>{pilgrim.name}</span></button>)}
            </div>
            <div className="party-command">
              <p><strong>{activePilgrimData.title}</strong> 正在领队</p>
              <button type="button" onClick={() => setPartyMode((mode) => mode === "follow" ? "explore" : "follow")}>
                <kbd>R</kbd> {partyMode === "follow" ? "列阵跟随" : "自由探索"}
              </button>
            </div>
          </aside>
          {nearArtifact && activeArtifact < ARTIFACTS.length && <button className="inspect-prompt" type="button" onClick={openInspection}><kbd>E</kbd><span>查验文物投影</span></button>}
          <div className="crosshair" aria-hidden="true"><i /><i /></div>
          <div className="control-hint">
            <span><kbd>W</kbd><kbd>S</kbd><kbd>A</kbd><kbd>D</kbd> {viewMode === "walk" ? "控制领队" : viewMode === "panoramic" ? "平移" : "飞行"}</span>
            <span><kbd>Shift</kbd> 疾行</span>
            {viewMode === "walk" && <><span><kbd>鼠标</kbd> 环绕镜头</span><span><kbd>R</kbd> 跟随 / 探索</span><span><kbd>F</kbd> 飞天 | <kbd>V</kbd> 全景</span></>}
            {viewMode === "fly" && (
              <>
                <span><kbd>Space</kbd> 升 | <kbd>C</kbd> 降</span>
                <span><kbd>F</kbd> 落地 | <kbd>V</kbd> 全景</span>
              </>
            )}
            {viewMode === "panoramic" && (
              <>
                <span><kbd>滚轮</kbd> 缩放</span>
                <span><kbd>V</kbd> 降落 | <kbd>F</kbd> 飞行</span>
              </>
            )}
          </div>
          <div className="touch-pad" aria-label="触屏方向控制">
            {[
              ["ArrowUp", "↑", "前行"],
              ["ArrowLeft", "←", "左转"],
              ["ArrowDown", "↓", "后退"],
              ["ArrowRight", "→", "右转"],
            ].map(([code, glyph, label]) => (
              <button
                key={code}
                className={`touch-${code}`}
                aria-label={label}
                onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); setTouchKey(code, true); }}
                onPointerUp={() => setTouchKey(code, false)}
                onPointerCancel={() => setTouchKey(code, false)}
              >{glyph}</button>
            ))}
          </div>
        </>
      )}

      {!started && (
        <section className="entry" aria-live="polite">
          <div className="entry-rule"><span>贞观十三年 · 西行前夜</span></div>
          <p className="entry-kicker">师徒四人集结长安，十二唐珍忽现异世灵光</p>
          <h2>西行寻珍</h2>
          <p className="entry-copy">切换玄奘、悟空、八戒与沙僧的独门能力。<br />穿双塔、过莲池、抵月门，把十二件真实唐代藏品送回它们的故事。</p>
          {error ? <p className="error">{error}</p> : (
            <button className="enter-button" type="button" onClick={enterGame} disabled={!ready}>
              <span>{ready ? "师徒启程" : `营造城阙 ${progress}%`}</span>
              <i aria-hidden="true">→</i>
            </button>
          )}
          <p className="entry-note">第三人称带队冒险 · 鼠标环绕镜头 · 按 Esc 释放鼠标</p>
        </section>
      )}

      {briefOpen && <section className="mission-letter modal-layer" role="dialog" aria-modal="true" aria-labelledby="mission-title">
        <div className="letter-paper">
          <button className="modal-close" type="button" aria-label="关闭任务说明" onClick={() => { setBriefOpen(false); requestPointerLockSafely(); }}>×</button>
          <p className="letter-mark">大唐敕令</p><span className="letter-index">西行异闻 · 第一卷</span>
          <h2 id="mission-title">长安十二珍</h2>
          <p>西行前夜，十二件唐珍的灵影散落坊市。若不在晨钟前归位，月洞门将永远闭合。玄奘师徒受命分头循迹，让文物记忆随取经人传向远方。</p>
          <ol><li><b>切换领队：</b>四人能力会真实改变寻路、移动或鉴定</li><li><b>三幕寻宝：</b>双塔受诏、莲池照影、月门归藏，每幕四珍</li><li><b>安全藏点：</b>宝物只落在可抵达的路边与空地，靠近按 <kbd>E</kbd></li></ol>
          <button className="letter-action" type="button" onClick={() => { setBriefOpen(false); requestPointerLockSafely(); }}>四圣同游 · 启程</button>
        </div>
      </section>}

      {inspection && <section className="artifact-modal modal-layer" role="dialog" aria-modal="true" aria-labelledby="artifact-question">
        <div className="artifact-sheet">
          <button className="modal-close" type="button" aria-label="关闭鉴定" onClick={closeInspection}>×</button>
          <div className="artifact-visual"><img src={inspection.image} alt={inspection.chineseTitle} /><span>THE MET · PUBLIC DOMAIN</span></div>
          <div className="artifact-exam">
            <p className="artifact-overline">现场鉴定 · {inspectionLocation}</p>
            {discovered.includes(inspection.id) ? <>
              <h2>{inspection.chineseTitle}</h2>
              <dl><div><dt>年代</dt><dd>{inspection.era}</dd></div><div><dt>材质</dt><dd>{inspection.medium}</dd></div></dl>
              <p className="artifact-insight">{inspection.insight}</p>
              <a href={inspection.museumUrl} target="_blank" rel="noreferrer">查看大都会艺术博物馆原藏品 ↗</a>
              <button className="letter-action" type="button" onClick={closeInspection}>{activeArtifact >= ARTIFACTS.length ? "完成委托" : "继续追踪下一件"}</button>
            </> : <>
              <h2>器物尚待定名</h2><blockquote>{inspection.clue}</blockquote><h3 id="artifact-question">{inspection.question}</h3>
              <div className="artifact-choices">{inspection.choices.map((choice, index) => {
                const dismissed = activePilgrim === "xuanzang" && index === (inspection.answer + 1) % inspection.choices.length;
                return <button type="button" disabled={dismissed} className={`${wrongChoice === index ? "wrong" : ""} ${dismissed ? "dismissed" : ""}`} key={choice} onClick={() => chooseAnswer(index)}><span>{["甲", "乙", "丙"][index]}</span>{dismissed ? "玄奘慧解：此项可排除" : choice}</button>;
              })}</div>
              {wrongChoice !== null && <p className="answer-note">判断有误。再看器形、材质和密函中的关键词。</p>}
            </>}
          </div>
        </div>
      </section>}

      {archiveOpen && <section className="archive modal-layer" role="dialog" aria-modal="true" aria-labelledby="archive-title">
        <div className="archive-book">
          <div className="archive-heading"><div><span>长安文物署</span><h2 id="archive-title">唐代博物志</h2></div><button className="modal-close" type="button" aria-label="关闭博物志" onClick={() => { setArchiveOpen(false); requestPointerLockSafely(); }}>×</button></div>
          <p className="archive-summary">已鉴定 {discovered.length} 件 · 图像与馆藏信息来自大都会艺术博物馆开放馆藏</p>
          <div className="archive-grid">{ARTIFACTS.map((artifact, index) => {
            const unlocked = discovered.includes(artifact.id);
            return <article className={unlocked ? "unlocked" : "locked"} key={artifact.id}>
              <div className="archive-image">{unlocked ? <img src={artifact.image} alt="" /> : <span>{index + 1}</span>}</div>
              <small>{unlocked ? artifact.era : "尚未寻得"}</small><h3>{unlocked ? artifact.chineseTitle : "未定名器物"}</h3>
              <p>{unlocked ? artifact.insight : artifact.fieldNote}</p>{unlocked && <a href={artifact.museumUrl} target="_blank" rel="noreferrer">馆藏页面 ↗</a>}
            </article>;
          })}</div>
          {discovered.length > 0 && <button className="reset-trail" type="button" onClick={resetTrail}>重置进度并重新随机藏点</button>}
        </div>
      </section>}
      <div className="vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </main>
  );
}
