// Refonte « manga » · la couverture : l'avatar 3D d'Arthur (VRM, ombrage MToon) et sa mise en scène.
// Chargé à part de la page (Three.js et three-vrm ne sont pas dans le bundle principal).
// Trois moteurs se superposent :
//  - l'entrée, dans le temps : il arrive en courant, s'arrête, salue ;
//  - le défilement : gros plan et bulle, plan serré sur les yeux (« C'est parti ! »), puis il sort en courant ;
//  - les réactions : il suit la souris, penche avec la vitesse du défilement, salue au clic, s'agace si on insiste,
//    et vient frapper à l'écran (« Toc toc ») quand plus rien ne bouge.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { gsap, ScrollTrigger } from "../motion";
import { incision } from "./incision";
import { arriverAilleurs } from "./voyage";
import { creerBalle3D, lancerBallon, RAYON_BALLE } from "./ballon";
import { creerBasket, cacherPeauSousVetements } from "./basket";

const BASE = `${process.env.PUBLIC_URL || ""}/avatar/`;
const lisse = (x) => x * x * (3 - 2 * x);
const borne = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const pic = (t, t0, l) => Math.exp(-(((t - t0) / l) ** 2));

// Repères du défilement sur la couverture (0 → 1)
const P = {
  buste: [0.04, 0.2], // la caméra s'approche, il parle
  yeux: [0.38, 0.44, 0.52, 0.58], // plan serré : entrée, tenue, sortie
  tour: [0.54, 0.64], // il se tourne vers la droite et part en courant
  bord: [0.6, 0.72], // il court jusqu'au bord droit de la page
  saisie: [0.72, 0.77], // il se retourne et soulève le coin de la page jusqu'à sa main
  page: [0.77, 0.985], // il marche vers la gauche en tirant la page, qui se tourne
};
const ATTENTE_BALLE = 4500; // sans geste, en haut de page, avant qu'il sorte le ballon
const ATTENTE_TOC = 9000; // sans geste du visiteur, en haut de page, avant qu'il vienne frapper à l'écran
const DOIGTS = ["Index", "Middle", "Ring", "Little"].flatMap((d) => ["Proximal", "Intermediate", "Distal"].map((s) => `right${d}${s}`));

// Les animations sont cuites par os humanoïde (voir avatar-arthur-manga/labo/bake.html) : on les rattache ici au modèle.
function clipDe(json, vrm, nom) {
  const pistes = [];
  const temps = (n) => Float32Array.from({ length: n }, (_, i) => (i / (json.n - 1)) * json.duree);
  Object.entries(json.os).forEach(([os, d]) => {
    const noeud = vrm.humanoid.getNormalizedBoneNode(os);
    if (!noeud) return;
    if (d.q) {
      const n = d.q.length / 4;
      pistes.push(new THREE.QuaternionKeyframeTrack(`${noeud.name}.quaternion`, n === 1 ? [0] : temps(n), d.q));
    }
    if (d.p) {
      const n = d.p.length / 3;
      pistes.push(new THREE.VectorKeyframeTrack(`${noeud.name}.position`, n === 1 ? [0] : temps(n), d.p));
    }
  });
  return new THREE.AnimationClip(nom, json.duree, pistes);
}

function charger() {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));
  const json = (nom) => fetch(`${BASE}${nom}.json`).then((r) => r.json());
  return Promise.all([loader.loadAsync(`${BASE}arthur.vrm`), json("repos"), json("course"), json("marche")]);
}

export function createCover(root, { host, poke, buddy, t }) {
  const q = (sel) => root.querySelector(sel);
  const dire = (nom) => q(`[data-say="${nom}"]`);
  const fin = [];
  let mort = false;

  // L'arrivée se dessine comme une planche : crayonné pendant le chargement, puis encré, tramé, et enfin en couleur
  const ETAPES = ["mg-crayon", "mg-encre", "mg-trame"];
  const etape = (nom) => {
    root.classList.remove(...ETAPES);
    if (nom) root.classList.add(nom);
  };
  etape("mg-crayon");

  // Sa première bulle dépend de l'heure qu'il est chez le visiteur
  const heure = new Date().getHours();
  const moment = heure >= 22 || heure < 5 ? "night" : heure < 11 ? "morning" : heure < 14 ? "noon" : heure >= 18 ? "evening" : "";
  if (moment && t) dire("hi").textContent = t(`Manga.hiTime.${moment}`);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  const tactile = window.matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tactile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(24, 1, 0.1, 40);
  const soleil = new THREE.DirectionalLight(0xffffff, Math.PI);
  soleil.position.set(0.8, 1.4, 1.6);
  scene.add(soleil, new THREE.AmbientLight(0xffffff, 0.3));

  // Ombre au sol : un disque dégradé, sans carte d'ombre
  const ombre = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 40),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader: "varying vec2 v; void main(){ v = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader:
        "varying vec2 v; void main(){ float d = distance(v, vec2(0.5)) * 2.0; gl_FragColor = vec4(0.06, 0.06, 0.08, smoothstep(1.0, 0.25, d) * 0.5); }",
    })
  );
  ombre.rotation.x = -Math.PI / 2;
  ombre.position.y = 0.002;
  const pivot = new THREE.Group();
  scene.add(ombre, pivot);

  // Le ballon (3D) : sur son doigt au repos, entre ses mains avant un tir
  const balle = creerBalle3D();
  scene.add(balle.groupe);
  const vBalle = new THREE.Vector3();
  const vDir = new THREE.Vector3();

  // --- état
  const entree = { x: -2.6, tour: 1.25, course: 1 }; // l'entrée : hors case à gauche, de profil, en course
  let p = 0; // progression du défilement sur la couverture
  let pVue = 0;
  let vent = 0; // vitesse du défilement, lissée
  let vrm = null;
  let mixer = null;
  let actions = null;
  let ressorts = [];
  let lance = false;
  let entreeFinie = false;
  let tSalut = -1;
  let tFache = -1;
  let tToc = -1;
  let tDanse = -1; // la danse cachée (taper « dance » au clavier)
  let tBalle = -1; // il fait tourner le ballon sur son doigt
  let balleFaite = false; // une fois par moment d'attente
  let tTir = -1; // le compagnon tire au panier
  let basket = null; // dribble, ballon tenu, tir (Effects/manga/basket.js)
  let dernierDefile = 0; // dernier défilement de la page (le compagnon dribble quand on ne fait rien)
  let yDefile = window.scrollY;
  let vitesseDefile = 0;
  let apparition = 1; // le ballon réapparaît d'un coup (après un tir)
  let balleVue = false;
  const derniereBalle = new THREE.Vector3();
  const vTete = new THREE.Vector3();
  let tirLance = false;
  let tirCible = null;
  let tJoie = -1;
  let dureeDanse = 0;
  let nbToc = 0;
  let clics = [];
  let dernierGeste = performance.now();
  let largeur = 1;
  let hauteur = 1;
  // Le compagnon : une fois la couverture passée, le même avatar (même canvas) s'installe dans le coin de l'écran
  const hoteB = buddy.querySelector(".mg-buddy__gl");
  const compagnon = { actif: false, permis: true, venu: false, gauche: false, haut: 0, base: -0.52, entree: -1.3, pointe: 0, cible: null, pointable: false, zone: "", debout: 0, tTampon: -1, tape: false, tZone: 0 };
  try {
    compagnon.permis = window.sessionStorage.getItem("mgBuddyOff") !== "1";
  } catch (e) {
    compagnon.permis = true;
  }
  const pointeur = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  let enVue = false;
  let boucle = false;
  let largeurB = 1;
  let hauteurB = 1;
  const souris = new THREE.Vector2();
  const sourisDouce = new THREE.Vector2();
  const regard = new THREE.Object3D();
  scene.add(regard);

  // --- éléments de la page pilotés par le défilement (une seule ligne de temps, parcourue de 0 à 1)
  const defile = gsap.timeline({ paused: true, defaults: { ease: "none" } });
  defile
    .to(q(".mg-head"), { autoAlpha: 0, y: -20, duration: 0.08 }, 0.02)
    .to([q(".mg-roles"), q(".mg-scroll")], { autoAlpha: 0, duration: 0.08 }, 0.02)
    .to(q(".mg-title"), { scale: 1.22, xPercent: -5, opacity: 0.14, duration: 0.16, ease: "power1.inOut" }, 0.04)
    .fromTo(q(".mg-bubble--talk"), { scale: 0, rotate: -8, autoAlpha: 0 }, { scale: 1, rotate: 0, autoAlpha: 1, duration: 0.06, ease: "back.out(1.6)" }, 0.11)
    .to(q(".mg-bubble--talk"), { scale: 0.6, autoAlpha: 0, duration: 0.03, ease: "power2.in" }, 0.33)
    // Plan serré sur les yeux : deux bandes noires se referment, le fond file à l'horizontale
    .fromTo(q(".mg-focus"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, P.yeux[0])
    .fromTo(root.querySelectorAll(".mg-bars i"), { scaleY: 0 }, { scaleY: 1, duration: 0.05, ease: "power3.out" }, P.yeux[0])
    .fromTo(q(".mg-bars b"), { autoAlpha: 0, xPercent: -30, skewX: -24 }, { autoAlpha: 1, xPercent: 0, skewX: -9, duration: 0.03, ease: "power4.out" }, P.yeux[1])
    .to(q(".mg-bars b"), { autoAlpha: 0, xPercent: 40, duration: 0.03, ease: "power2.in" }, P.yeux[2])
    .to(root.querySelectorAll(".mg-bars i"), { scaleY: 0, duration: 0.05, ease: "power3.in" }, P.yeux[2])
    .to(q(".mg-focus"), { autoAlpha: 0, duration: 0.04 }, P.yeux[2] + 0.02)
    .to(q(".mg-title"), { opacity: 1, scale: 1, xPercent: 0, duration: 0.08 }, P.yeux[2])
    .fromTo(q(".mg-speed"), { opacity: 0 }, { opacity: 0.85, duration: 0.06 }, P.tour[0] + 0.04)
    .to(q(".mg-speed"), { opacity: 0, duration: 0.04 }, P.bord[1] - 0.03)
    .to({}, { duration: 0.001 }, 0.999);

  // --- gestes ajoutés par-dessus l'animation
  const qA = new THREE.Quaternion();
  const qB = new THREE.Quaternion();
  const neutre = new THREE.Quaternion();
  const eu = new THREE.Euler();
  let retouches = [];
  const os = (nom) => vrm.humanoid.getNormalizedBoneNode(nom);
  const versPose = (nom, x, y, z, poids) => {
    const b = os(nom);
    if (!b || poids <= 0) return;
    qA.setFromEuler(eu.set(x, y, z, "ZYX"));
    b.quaternion.slerp(qA, poids);
  };
  const ajouter = (nom, x, y, z) => {
    const b = os(nom);
    if (b) b.quaternion.multiply(qA.setFromEuler(eu.set(x, y, z, "YXZ")));
  };

  const bulle = (nom, duree) => {
    const el = dire(nom);
    gsap.killTweensOf(el);
    gsap.fromTo(el, { scale: 0, rotate: -14, autoAlpha: 1 }, { scale: 1, rotate: 4, duration: 0.32, ease: "back.out(2)" });
    gsap.to(el, { scale: 0, autoAlpha: 0, duration: 0.2, delay: duree, ease: "power2.in" });
  };

  function saluer() {
    if (!vrm || tSalut >= 0 || tToc >= 0 || tBalle >= 0) return;
    tSalut = 0;
    bulle("hi", 2.3);
  }

  // Trois clics d'affilée : il s'agace
  function facher() {
    if (!vrm || tFache >= 0) return;
    tFache = 0;
    tSalut = -1;
    if (tBalle >= 0 && tBalle < 3.6) tBalle = 3.6; // il range le ballon
    gsap.set(dire("hi"), { autoAlpha: 0 });
    bulle("hey", 1.5);
    gsap.fromTo(q(".mg-cover__stick"), { x: -7 }, { x: 0, duration: 0.5, ease: "elastic.out(1.4, 0.25)", clearProps: "transform" });
  }

  function surClic() {
    const t = performance.now();
    clics = clics.filter((c) => t - c < 3500);
    clics.push(t);
    if (clics.length >= 3) {
      clics = [];
      facher();
    } else saluer();
  }

  // Personne ne bouge : il s'approche et frappe deux fois à l'écran
  function toquer() {
    if (!vrm || tToc >= 0) return;
    tToc = 0;
    nbToc += 1;
    const coups = root.querySelectorAll(".mg-knock span");
    const onde = q(".mg-knock i");
    const tl = gsap.timeline();
    [1.05, 1.4].forEach((t0, i) => {
      tl.fromTo(coups[i], { scale: 0.3, autoAlpha: 0, rotate: i ? 9 : -12 }, { scale: 1, autoAlpha: 1, duration: 0.14, ease: "back.out(3)" }, t0)
        .fromTo(onde, { scale: 0.2, opacity: 0.9 }, { scale: 1.6, opacity: 0, duration: 0.5, ease: "power2.out" }, t0)
        .fromTo(q(".mg-cover__stick"), { y: 5 }, { y: 0, duration: 0.3, ease: "elastic.out(1.6, 0.3)", clearProps: "transform" }, t0);
    });
    tl.to(coups, { autoAlpha: 0, scale: 1.25, duration: 0.25 }, 2.3).add(() => bulle("idle", 1.9), 1.75);
    fin.push(() => tl.kill());
  }

  function gestes(dt, course, yeux) {
    const exp = vrm.expressionManager;
    let colere = yeux * 0.5;
    let joie = 0;
    let sourire = borne(p, 0.1, 0.15) * (1 - borne(p, 0.3, 0.34)) * 0.28; // il parle pendant que la bulle est là
    let bouche = sourire > 0 ? (sourire / 0.28) * (0.14 + 0.3 * Math.abs(Math.sin(horloge.elapsedTime * 11) * Math.sin(horloge.elapsedTime * 2.7 + 0.6))) : 0;

    if (tSalut >= 0) {
      tSalut += dt;
      const poids = lisse(Math.min(tSalut / 0.35, 1)) * lisse(borne(2.6 - tSalut, 0, 0.4)) * (1 - course);
      const bat = Math.sin(tSalut * 11) * 0.32;
      versPose("rightUpperArm", 0, 0.3, -0.28, poids);
      versPose("rightLowerArm", 1.35, 0, 1.78 + bat, poids);
      versPose("rightHand", 0, 0, bat * 0.5, poids);
      joie = poids;
      if (tSalut > 2.6) tSalut = -1;
    }
    if (tFache >= 0) {
      tFache += dt;
      const poids = lisse(Math.min(tFache / 0.2, 1)) * lisse(borne(1.7 - tFache, 0, 0.35));
      colere = Math.max(colere, poids * 0.9);
      ajouter("neck", 0, Math.sin(tFache * 15) * 0.2 * poids, 0); // il fait non de la tête
      versPose("rightUpperArm", 0, 0.2, -1.05, poids * 0.9);
      versPose("rightLowerArm", 0, 1.6, 0.5, poids * 0.9);
      versPose("leftUpperArm", 0, -0.2, 1.05, poids * 0.9);
      versPose("leftLowerArm", 0, -1.6, -0.5, poids * 0.9);
      if (tFache > 1.7) tFache = -1;
    }
    if (tToc >= 0) {
      tToc += dt;
      const poids = lisse(borne(tToc, 0.25, 0.85)) * lisse(borne(3.3 - tToc, 0, 0.5));
      const coup = pic(tToc, 1.05, 0.075) + pic(tToc, 1.4, 0.075);
      versPose("rightUpperArm", 0, 1.15, -0.62, poids);
      versPose("rightLowerArm", 0, 0, 1.45 - coup * 0.75, poids);
      DOIGTS.forEach((d) => versPose(d, 0, 0, -1.25,poids));
      ajouter("spine", 0.16 * poids, 0, 0); // il se penche vers l'écran
      sourire = Math.max(sourire, lisse(borne(tToc, 1.7, 2)) * lisse(borne(3.6 - tToc, 0, 0.4)) * 0.45);
      bouche = Math.max(bouche, sourire > 0.1 ? 0.14 + 0.14 * Math.sin(tToc * 14) : 0);
      if (tToc > 3.8) {
        tToc = -1;
        dernierGeste = performance.now() + 9000; // le second « toc toc » attend plus longtemps
      }
    }
    if (tDanse >= 0) sourire = Math.max(sourire, 0.5);
    exp.setValue("happy", joie);
    exp.setValue("angry", colere);
    exp.setValue("relaxed", sourire);
    exp.setValue("aa", bouche);

    // Le corps penche avec la vitesse du défilement, comme pris dans un coup de vent
    ajouter("spine", -vent * 0.5, 0, 0);
    ajouter("chest", -vent * 0.35, 0, 0);
    // La tête suit la souris, sauf en course et pendant le plan sur les yeux
    const suivi = (1 - course * 0.8) * (1 - yeux);
    qB.setFromEuler(eu.set(-sourisDouce.y * 0.2 * suivi, -sourisDouce.x * 0.45 * suivi, 0, "YXZ"));
    os("neck").quaternion.multiply(qA.copy(neutre).slerp(qB, 0.45));
    os("head").quaternion.multiply(qA.copy(neutre).slerp(qB, 0.55));
  }

  let prochain = 1.8;
  let tClin = -1;
  function clignement(dt, yeux) {
    prochain -= dt;
    if (prochain <= 0 && tClin < 0 && yeux < 0.2) {
      tClin = 0;
      prochain = 2 + Math.random() * 3.5;
    }
    if (tClin >= 0) {
      tClin += dt;
      vrm.expressionManager.setValue("blink", Math.sin(Math.min(tClin / 0.16, 1) * Math.PI));
      if (tClin > 0.16) {
        tClin = -1;
        vrm.expressionManager.setValue("blink", 0);
      }
    }
  }

  // --- cadres : corps entier, buste quand il parle, yeux, et tout près quand il frappe à l'écran
  const plan = (px, py, pz, cx, cy, cz) => ({ pos: new THREE.Vector3(px, py, pz), cible: new THREE.Vector3(cx, cy, cz) });
  const plein = plan(0, 1.02, 5.3, 0, 0.9, 0);
  const buste = plan(0.22, 1.47, 1.7, 0, 1.43, 0);
  const busteEtroit = plan(0.1, 1.6, 2.35, 0, 1.62, 0); // la bulle est au-dessus de lui : cadré plus bas, de plus loin
  const planYeux = plan(0, 1.612, 0.66, 0, 1.606, 0);
  const planToc = plan(0.16, 1.5, 1.42, 0, 1.45, 0);
  const vPos = new THREE.Vector3();
  const vCible = new THREE.Vector3();
  function cadrer(zoom, yeux, toc, orbite = 0) {
    const aspect = largeur / hauteur;
    const etroit = aspect < 1.05;
    // Écran étroit (téléphone) : en pied, plus petit, pour que sa tête passe sous le titre au lieu de le masquer
    plein.pos.z = etroit ? Math.max(5.3, 3.2 / aspect) * 1.3 : 5.3;
    planYeux.pos.z = etroit ? 0.66 / Math.max(0.4, aspect * 0.95) : 0.66;
    planToc.pos.z = etroit ? 2.1 : 1.42;
    const pres = etroit ? busteEtroit : buste;
    vPos.lerpVectors(plein.pos, pres.pos, zoom).lerp(planYeux.pos, yeux).lerp(planToc.pos, toc);
    vCible.lerpVectors(plein.cible, pres.cible, zoom).lerp(planYeux.cible, yeux).lerp(planToc.cible, toc);
    // Pendant qu'il parle, la caméra tourne lentement autour de lui (le gros plan ne reste jamais figé)
    if (orbite) {
      const dx = vPos.x - vCible.x;
      const dz = vPos.z - vCible.z;
      const c = Math.cos(orbite);
      const s = Math.sin(orbite);
      vPos.x = vCible.x + dx * c + dz * s;
      vPos.z = vCible.z - dx * s + dz * c;
    }
    cam.position.copy(vPos);
    cam.lookAt(vCible);
    // Sur un écran large, l'avatar est décalé à droite (le titre occupe la gauche), sauf pour le plan sur les yeux
    const decal = etroit ? 0 : -0.22 * largeur * (1 - yeux);
    // (et plus bas : décalage de la vue vers le haut, seulement dans le plan d'ensemble)
    const baisse = etroit ? -0.13 * hauteur * (1 - zoom) * (1 - yeux) * (1 - toc) : 0;
    cam.setViewOffset(largeur, hauteur, decal, baisse, largeur, hauteur);
  }

  const horloge = new THREE.Clock();
  function image() {
    const dt = Math.min(horloge.getDelta(), 0.05);
    if (!vrm) return;
    const maintenant = performance.now();
    // Couverture terminée (rideau d'encre fermé) : l'avatar devient le compagnon, et inversement si l'on remonte
    const veut = veutCompagnon();
    if (veut !== compagnon.actif) (veut ? versCompagnon : versCouverture)();
    if (compagnon.actif) {
      imageCompagnon(dt, maintenant);
      return;
    }
    const b = lisse(borne(p, P.tour[0], P.tour[1]));
    const yeux = lisse(borne(p, P.yeux[0], P.yeux[1])) * (1 - lisse(borne(p, P.yeux[2], P.yeux[3])));
    const zoom = lisse(borne(p, P.buste[0], P.buste[1])) * (1 - lisse(borne(p, P.yeux[0], P.yeux[1])));
    const toc = tToc < 0 ? 0 : lisse(borne(tToc, 0, 0.9)) * lisse(borne(3.8 - tToc, 0, 0.6));
    const bord = lisse(borne(p, P.bord[0], P.bord[1]));
    const saisie = lisse(borne(p, P.saisie[0], P.saisie[1]));
    const tire = borne(p, P.page[0], P.page[1]);
    const marche = lisse(borne(p, P.page[0], P.page[0] + 0.015));
    const course = Math.max(entree.course, b) * (1 - saisie);

    // Vitesse du défilement (en couvertures par seconde), lissée et bornée
    const vitesse = THREE.MathUtils.clamp((p - pVue) / Math.max(dt, 0.001), -0.6, 0.6) * (1 - b);
    pVue = p;
    vent += (vitesse - vent) * Math.min(1, dt * 6);
    ressorts.forEach((r) => {
      r.joint.settings.gravityDir.set(0, -1, -vent * 3).normalize();
      r.joint.settings.gravityPower = r.poids + Math.abs(vent) * 1.4;
    });

    // Rien ne bouge depuis un moment, en haut de page : il vient frapper à l'écran (deux fois au plus)
    // Au bout de quelques secondes sans geste, il sort le ballon et le fait tourner sur son doigt
    if (entreeFinie && tBalle < 0 && !balleFaite && tToc < 0 && tSalut < 0 && tFache < 0 && tDanse < 0 && p < 0.02 && maintenant - dernierGeste > ATTENTE_BALLE) {
      tBalle = 0;
      balleFaite = true;
    }
    if (p > 0.03 && tBalle >= 0 && tBalle < 3.6) tBalle = 3.6;
    if (entreeFinie && tBalle < 0 && tToc < 0 && tSalut < 0 && tFache < 0 && p < 0.02 && nbToc < 2 && maintenant - dernierGeste > ATTENTE_TOC) toquer();
    if (p > 0.03 && tToc >= 0 && tToc < 3.2) tToc = 3.2; // le visiteur défile : il range son poing

    sourisDouce.lerp(souris, Math.min(1, dt * 7));
    const droit = Math.max(yeux, toc); // il regarde l'objectif
    regard.position.set(sourisDouce.x * 1.6 * (1 - droit) + cam.position.x * droit, (1.45 + sourisDouce.y * 0.9) * (1 - droit) + cam.position.y * droit, 2.4);
    // Orbite : de -0,2 à +0,2 rad entre la fin de l'approche et le plan sur les yeux ; nulle hors du gros plan
    const orbite = (lisse(borne(p, P.buste[0] + 0.06, P.yeux[0])) - 0.5) * 0.42 * zoom * (1 - toc);
    cadrer(zoom, yeux, toc, orbite);
    // Bords de la page en mètres : il court jusqu'au bord droit, puis marche jusqu'à bien au-delà du bord gauche
    const ecran = bordsMonde();
    const xBord = ecran.droite - 0.62;
    const xFin = ecran.gauche - (ecran.droite - ecran.gauche) * 1.15;
    const x = tire > 0 ? xBord + (xFin - xBord) * tire : entree.x + (xBord - entree.x) * bord;
    pivot.position.x = x;
    pivot.rotation.y = entree.tour + b * 1.25 - saisie * 2.45;
    ombre.position.x = x;
    if (actions.marche) {
      const duree = actions.marche.getClip().duration;
      actions.marche.time = ((Math.max(0, xBord - x) / 1.25) * duree) % duree;
    }
    if (p > 0.03) tDanse = -1;
    const danse = poidsDanse(dt);
    actions.repos.setEffectiveWeight((1 - course) * (1 - danse) * (1 - marche));
    actions.course.setEffectiveWeight(course);
    if (actions.marche) actions.marche.setEffectiveWeight(marche);
    if (actions.danse) actions.danse.setEffectiveWeight(danse);
    retouches.forEach((r) => {
      r.os.quaternion.copy(r.q);
      if (r.p) r.os.position.copy(r.p);
    });
    mixer.update(dt);
    retouches.forEach((r) => {
      r.q.copy(r.os.quaternion);
      if (r.p) r.p.copy(r.os.position);
    });
    gestes(dt, course, yeux);
    if (tBalle >= 0) poseBalle(dt);
    if (saisie > 0.001) tenirLaPage(saisie);
    clignement(dt, yeux);
    vrm.update(dt);
    plierSelonMain();
    if (tBalle >= 0) placerBalle(dt);
    renderer.render(scene, cam);
  }

  // --- la page qu'il tourne ---------------------------------------------------------------------------------
  // Le coin bas droit de la page monte jusqu'à sa main, puis il marche vers la gauche : le pli est la médiatrice entre
  // le coin d'origine et sa main, recalculée à chaque image d'après la vraie position de la main à l'écran.
  const feuille = q(".mg-sheet");
  const revers = q(".mg-flap");
  const reversFond = q(".mg-flap i");
  const vEcran = new THREE.Vector3();
  const vMain = new THREE.Vector3();
  const dirPage = new THREE.Vector3(1, -0.85, -0.25).normalize();
  let pliee = "aucune";

  function ecranX(x) {
    vEcran.set(x, 0.9, 0).project(cam);
    return ((vEcran.x + 1) / 2) * largeur;
  }

  function bordsMonde() {
    cam.updateMatrixWorld();
    const a = ecranX(0);
    const k = ecranX(1) - a || 1;
    return { gauche: -a / k, droite: (largeur - a) / k };
  }

  // Oriente un os (bras) vers une direction donnée dans la scène, quelle que soit la pose de ses parents
  function viser(nom, enfant, dirMonde, poids) {
    const b = os(nom);
    const e = os(enfant);
    if (!b || !e || !b.parent) return;
    b.parent.updateWorldMatrix(true, false);
    b.parent.getWorldQuaternion(qB).invert();
    vEcran.copy(dirMonde).applyQuaternion(qB);
    vMain.copy(e.position).normalize();
    qA.setFromUnitVectors(vMain, vEcran);
    b.quaternion.slerp(qA, poids);
  }

  // Bras gauche tendu vers l'arrière et le bas, la main serrée sur le coin de la page
  function tenirLaPage(poids) {
    pivot.updateMatrixWorld(true);
    viser("leftUpperArm", "leftLowerArm", dirPage, poids);
    versPose("leftLowerArm", 0, 0, 0, poids);
    versPose("leftHand", 0, 0, 0, poids);
    DOIGTS.forEach((d) => versPose(d.replace("right", "left"), 0, 0, 0.95, poids));
  }

  const point = ([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`;

  // Garde la partie d'un polygone où f >= 0 (ou f < 0)
  function couper(poly, f, positif) {
    const sortie = [];
    poly.forEach((a, i) => {
      const b = poly[(i + 1) % poly.length];
      const fa = f(a);
      const fb = f(b);
      const dedansA = positif ? fa >= 0 : fa < 0;
      const dedansB = positif ? fb >= 0 : fb < 0;
      if (dedansA) sortie.push(a);
      if (dedansA !== dedansB) {
        const t = fa / (fa - fb);
        sortie.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    });
    return sortie;
  }

  function deplier() {
    if (pliee === "aucune") return;
    pliee = "aucune";
    feuille.style.clipPath = "";
    revers.style.visibility = "";
  }

  function tourneeEntiere() {
    if (pliee === "totale") return;
    pliee = "totale";
    feuille.style.clipPath = "polygon(0px 0px, 0px 0px, 0px 0px)";
    revers.style.visibility = "";
  }

  function plier(cx, cy, mx, my, fin) {
    let ux = mx - cx;
    let uy = my - cy;
    const l = Math.hypot(ux, uy);
    if (l < 2) {
      deplier();
      return;
    }
    ux /= l;
    uy /= l;
    const coins = [
      [0, 0],
      [largeur, 0],
      [largeur, hauteur],
      [0, hauteur],
    ];
    const besoin = Math.max(...coins.map(([x, y]) => (x - cx) * ux + (y - cy) * uy));
    let d = l / 2;
    d += Math.max(0, besoin + 2 - d) * fin; // une fois sorti du cadre, la page finit de se tourner d'elle-même
    if (d >= besoin) {
      tourneeEntiere();
      return;
    }
    const f = ([x, y]) => (x - cx) * ux + (y - cy) * uy - d;
    const reste = couper(coins, f, true);
    const pli = couper(coins, f, false).map(([x, y]) => {
      const v = f([x, y]);
      return [x - 2 * v * ux, y - 2 * v * uy];
    });
    pliee = "partielle";
    feuille.style.clipPath = `polygon(${reste.map(point).join(", ")})`;
    reversFond.style.clipPath = `polygon(${pli.map(point).join(", ")})`;
    // Ombrage du revers : sombre dans le pli, clair au milieu, un peu plus sombre au bord qu'il tient
    const angle = (Math.atan2(ux, -uy) * 180) / Math.PI;
    const longueur = largeur * Math.abs(ux) + hauteur * Math.abs(uy);
    const tPli = (((cx + d * ux - largeur / 2) * ux + (cy + d * uy - hauteur / 2) * uy) / longueur) * 100 + 50;
    const etendue = (d / longueur) * 100;
    reversFond.style.background = `linear-gradient(${angle.toFixed(1)}deg, #a69e8f ${tPli.toFixed(2)}%, #e3ddcf ${(tPli + etendue * 0.18).toFixed(2)}%, #f3eee4 ${(tPli + etendue * 0.62).toFixed(2)}%, #d8d1c2 ${(tPli + etendue).toFixed(2)}%)`;
    revers.style.filter = `drop-shadow(${(ux * 16).toFixed(1)}px ${(uy * 16 + 6).toFixed(1)}px 14px rgba(0, 0, 0, 0.4))`;
    revers.style.visibility = "visible";
  }

  function plierSelonMain() {
    if (p < P.saisie[0]) {
      deplier();
      return;
    }
    if (p >= P.page[1]) {
      tourneeEntiere();
      return;
    }
    const main = vrm.humanoid.getRawBoneNode("leftHand");
    if (!main) return;
    pivot.updateMatrixWorld(true);
    main.getWorldPosition(vMain).project(cam);
    const hx = ((vMain.x + 1) / 2) * largeur;
    const hy = ((1 - vMain.y) / 2) * hauteur;
    const s = lisse(borne(p, P.saisie[0], P.saisie[1]));
    plier(largeur, hauteur, largeur + (hx - largeur) * s, hauteur + (hy - hauteur) * s, lisse(borne(p, P.page[1] - 0.06, P.page[1])));
  }

  // --- le ballon ----------------------------------------------------------------------------------------------
  // Au repos : bras droit levé, avant-bras vertical, index tendu, le ballon tourne dessus et il le regarde
  function poseBalle(dt) {
    tBalle += dt;
    const t = tBalle;
    const poids = lisse(borne(t, 0, 0.45)) * lisse(borne(4.2 - t, 0, 0.5));
    pivot.updateMatrixWorld(true);
    viser("rightUpperArm", "rightLowerArm", vDir.set(-0.85, -0.45, 0.3).normalize(), poids);
    viser("rightLowerArm", "rightHand", vDir.set(0.2, 1, 0.45).normalize(), poids);
    viser("rightHand", "rightMiddleProximal", vDir.set(0.05, 1, 0.25).normalize(), poids);
    viser("rightIndexProximal", "rightIndexIntermediate", vDir.set(0, 1, 0.05).normalize(), poids);
    versPose("rightIndexIntermediate", 0, 0, 0, poids);
    versPose("rightIndexDistal", 0, 0, 0, poids);
    AUTRES_DOIGTS.forEach((d) => versPose(d, 0, 0, -1.25, poids));
    if (vBalle.lengthSq() > 0) regard.position.lerp(vBalle, poids * 0.8);
    const exp = vrm.expressionManager;
    exp.setValue("relaxed", Math.max(exp.getValue("relaxed") || 0, poids * 0.45));
    if (t > 4.2) {
      tBalle = -1;
      balle.groupe.visible = false;
    }
  }

  function placerBalle(dt) {
    const doigt = vrm.humanoid.getRawBoneNode("rightIndexDistal");
    if (!doigt) return;
    const t = tBalle;
    pivot.updateMatrixWorld(true);
    doigt.getWorldPosition(vBalle);
    const taille = lisse(borne(t, 0.3, 0.6)) * lisse(borne(3.95 - t, 0, 0.3));
    balle.groupe.visible = taille > 0.01;
    vBalle.y += 0.03 + RAYON_BALLE * taille;
    balle.groupe.position.copy(vBalle);
    balle.groupe.scale.setScalar(Math.max(0.001, taille));
    balle.tourner(17 * lisse(borne(t, 0.45, 1)), dt, Math.sin(t * 9) * 0.05);
  }

  function cri(nom) {
    const el = buddy.querySelector(`[data-sfx="${nom}"]`);
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.fromTo(el, { scale: 0.3, autoAlpha: 1, rotate: -16 }, { scale: 1, rotate: -7, duration: 0.16, ease: "back.out(3)" });
    gsap.to(el, { autoAlpha: 0, scale: 1.25, duration: 0.25, delay: 0.7 });
  }

  // Le vol vers le panier de la case « Le basket », puis le filet et « Swish ! »
  function envoyer(depart) {
    const panier = tirCible;
    const centre = () => {
      const r = panier.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height * 0.3 };
    };
    lancerBallon(depart, centre, {
      onPanier: () => {
        const cercle = panier.closest(".mg-hoop");
        const filet = cercle.querySelector(".mg-hoop__net");
        const sfx = cercle.querySelector(".mg-hoop__sfx");
        gsap.fromTo(filet, { scaleY: 1.4, skewX: 10 }, { scaleY: 1, skewX: 0, duration: 0.8, ease: "elastic.out(1.4, 0.3)" });
        gsap.killTweensOf(sfx);
        gsap.fromTo(sfx, { scale: 0.3, autoAlpha: 1, rotate: -14 }, { scale: 1, rotate: -6, duration: 0.2, ease: "back.out(3)" });
        gsap.to(sfx, { autoAlpha: 0, scale: 1.2, duration: 0.3, delay: 1.2 });
        if (compagnon.actif) {
          tJoie = 0;
          compagnon.debout = performance.now() + 1800;
        }
        tirCible = null;
      },
    });
  }

  function tirer(bouton) {
    const panier = bouton.closest(".mg-case")?.querySelector(".mg-hoop__rim");
    if (!panier || tirCible) return; // un tir à la fois
    tirCible = panier;
    if (compagnon.actif && vrm && basket) {
      tTir = 0;
      tirLance = false;
      basket.tirer();
      compagnon.debout = performance.now() + 3500;
      return;
    }
    // Sans compagnon (téléphone, modèle absent) : le ballon part du coin de l'écran
    envoyer({ x: window.innerWidth - 50, y: window.innerHeight - 70 });
  }

  // Le compagnon tire : la pose (rassemblement, flexion, coude aligné sous le ballon, lâcher, poignet cassé) vient du
  // module basket ; ici, l'horloge du geste
  function gesteTir(dt) {
    tTir += dt;
    if (tTir > 1.5) tTir = -1;
  }

  // Panier marqué : il serre le poing et le lève
  function gesteJoie(dt) {
    tJoie += dt;
    const t = tJoie;
    const poids = lisse(borne(t, 0, 0.18)) * lisse(borne(1.3 - t, 0, 0.35));
    const coup = Math.abs(Math.sin(t * 9)) * 0.4;
    pivot.updateMatrixWorld(true);
    viser("rightUpperArm", "rightLowerArm", vDir.set(-0.6, 0.35 + coup * 0.3, 0.35).normalize(), poids);
    viser("rightLowerArm", "rightHand", vDir.set(0, 1, 0.1).normalize(), poids);
    DOIGTS.forEach((d) => versPose(d, 0, 0, -1.25, poids));
    vrm.expressionManager.setValue("happy", poids);
    if (t > 1.3) tJoie = -1;
  }

  // --- le compagnon ------------------------------------------------------------------------------------------
  // Au repos il passe la tête dans le coin ; il se redresse pour parler, pointer ce qu'on survole, saluer ou tamponner.
  const ZONES = [
    ["c1", ".mg-chap:not(.mg-chap--worlds)"],
    ["c2", ".mg-chap--worlds"],
    ["work", "#work"],
    ["fil", ".fil"],
    ["skills", "#skills"],
    ["certs", ".certs"],
    ["footer", ".footer"],
  ];
  const AUTRES_DOIGTS = DOIGTS.filter((d) => !d.includes("Index"));
  const etroit = window.matchMedia("(max-width: 899px), (pointer: coarse)");
  // Une marge : il devient le compagnon à 98,5 % de la couverture, mais n'y retourne que si l'on remonte sous 90 %
  // (sans elle, le moindre cran de molette vers le haut le faisait aller et venir, avec une incision à chaque fois)
  const veutCompagnon = () => compagnon.permis && !etroit.matches && p >= (compagnon.actif ? 0.9 : 0.985);
  // Sections où il se tient à gauche (le contenu important y est à droite) : il change de côté d'une incision
  const A_GAUCHE = ["skills"];
  const forme = { ex: 1, ey: 1, vrille: 0 }; // écrasement et vrille de l'avatar pendant une incision ou un plongeon
  const ancre = (r) => r.left + r.width * (compagnon.gauche ? 0.22 : 0.78);

  // L'incision : il disparaît en un trait et réapparaît ailleurs
  function eclipse(de, vers, retard = 0.1) {
    incision(de, vers);
    gsap.killTweensOf(forme);
    forme.ex = 0.02;
    forme.ey = 1.5;
    forme.vrille = 0;
    gsap.to(forme, { ex: 1, ey: 1, duration: 0.34, ease: "back.out(2.4)", delay: retard });
  }

  function changerCote(gauche) {
    if (compagnon.gauche === gauche) return;
    const r0 = hoteB.getBoundingClientRect();
    const de = { x: ancre(r0), y: r0.top + r0.height * 0.7 };
    compagnon.gauche = gauche;
    buddy.classList.toggle("mg-buddy--left", gauche);
    const r1 = hoteB.getBoundingClientRect();
    eclipse(de, { x: ancre(r1), y: r1.top + r1.height * 0.7 });
  }

  // Clic sur un lien de l'accueil : il file sur la case cliquée et plonge dedans, puis réapparaît sur la page d'arrivée
  function plonger(lien) {
    const r = hoteB.getBoundingClientRect();
    const c = lien.getBoundingClientRect();
    const de = { x: ancre(r), y: r.top + r.height * 0.6 };
    const vers = { x: THREE.MathUtils.clamp(pointeur.x, c.left + 20, c.right - 20), y: c.top + c.height / 2 };
    compagnon.debout = performance.now() + 2500;
    incision(de, vers);
    gsap.killTweensOf(forme);
    gsap.set(buddy, { x: vers.x - de.x, y: vers.y - de.y });
    gsap
      .timeline()
      .fromTo(forme, { ex: 0.05, ey: 1.5, vrille: 0 }, { ex: 1, ey: 1, duration: 0.16, ease: "back.out(2)" }, 0.06)
      .to(forme, { ex: 0.01, ey: 0.01, vrille: Math.PI * 3, duration: 0.3, ease: "power2.in" }, 0.24)
      // Si la navigation n'a pas eu lieu, il revient à sa place
      .add(() => {
        gsap.set(buddy, { clearProps: "transform" });
        eclipse(vers, de, 0);
      }, 1.6);
    arriverAilleurs();
  }

  function conseil(nom) {
    const el = buddy.querySelector(".mg-buddy__tip");
    el.querySelectorAll("span").forEach((s) => s.classList.toggle("is-on", s.dataset.tip === nom));
    gsap.killTweensOf(el);
    gsap.fromTo(el, { scale: 0, autoAlpha: 1 }, { scale: 1, duration: 0.3, ease: "back.out(1.8)" });
    gsap.to(el, { scale: 0, autoAlpha: 0, duration: 0.2, delay: 4, ease: "power2.in" });
  }

  function tamponner() {
    if (compagnon.tTampon >= 0) return;
    compagnon.tTampon = 0;
    compagnon.tape = false;
  }

  function tailleCompagnon() {
    const r = hoteB.getBoundingClientRect();
    largeurB = Math.max(1, Math.round(r.width));
    hauteurB = Math.max(1, Math.round(r.height));
    if (!compagnon.actif) return;
    renderer.setSize(largeurB, hauteurB, false);
    cam.aspect = largeurB / hauteurB;
    cam.updateProjectionMatrix();
  }

  function versCompagnon() {
    compagnon.actif = true;
    tBalle = -1;
    balle.groupe.visible = false;
    compagnon.zone = "";
    compagnon.cible = null;
    buddy.classList.add("is-on");
    hoteB.appendChild(renderer.domElement);
    tailleCompagnon();
    ombre.visible = false;
    gsap.killTweensOf(compagnon);
    compagnon.tZone = 0.5;
    // La première fois, il arrive d'une incision ; ensuite (après un retour dans la couverture), il remonte dans son coin
    if (compagnon.venu) {
      gsap.fromTo(compagnon, { entree: -1.3 }, { entree: 0, duration: 0.6, ease: "back.out(1.5)" });
      return;
    }
    compagnon.venu = true;
    compagnon.entree = 0;
    const r = hoteB.getBoundingClientRect();
    eclipse({ x: window.innerWidth * 0.5, y: window.innerHeight * 0.42 }, { x: ancre(r), y: r.top + r.height * 0.7 });
  }

  function versCouverture() {
    compagnon.actif = false;
    buddy.classList.remove("is-on");
    gsap.killTweensOf(compagnon);
    gsap.set(buddy.querySelector(".mg-buddy__tip"), { autoAlpha: 0 });
    host.appendChild(renderer.domElement);
    renderer.setSize(largeur, hauteur, false);
    cam.aspect = largeur / hauteur;
    cam.updateProjectionMatrix();
    ombre.visible = true;
    pivot.position.set(0, 0, 0);
    pivot.scale.set(1, 1, 1);
    gsap.killTweensOf(forme);
    gsap.set(buddy, { clearProps: "transform" });
  }

  function zoneCourante() {
    const y = window.innerHeight * 0.6;
    const trouvee = ZONES.find(([, sel]) => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top <= y && r.bottom > y;
    });
    return trouvee ? trouvee[0] : "";
  }

  function imageCompagnon(dt, maintenant) {
    // Quelle section est à l'écran ? (quatre fois par seconde) Chaque arrivée lui fait dire un mot.
    compagnon.tZone -= dt;
    if (compagnon.tZone <= 0) {
      compagnon.tZone = 0.25;
      const zone = zoneCourante();
      if (zone !== compagnon.zone) {
        const avant = compagnon.zone;
        compagnon.zone = zone;
        gsap.killTweensOf(compagnon);
        if (zone) changerCote(A_GAUCHE.includes(zone));
        if (zone) conseil(zone);
        if (zone === "footer") {
          // Il salue, montre le contact, puis se baisse pour laisser le pied de page libre
          tSalut = -1;
          saluerSansBulle();
          gsap.to(compagnon, { entree: -1.4, duration: 0.5, delay: 4.4, ease: "power2.in" });
        } else if (avant === "footer" || compagnon.entree < -0.1) {
          gsap.to(compagnon, { entree: 0, duration: 0.6, ease: "back.out(1.5)" });
        }
      }
    }

    const r = hoteB.getBoundingClientRect();
    const y = compagnon.base + compagnon.entree;
    const g = compagnon.gauche ? -1 : 1; // à gauche, tout est en miroir : il se tourne et pointe de l'autre bras
    // Sa tête à l'écran (projection de l'os : il est cadré en pied, la bulle et le doigt partent de là)
    const os0 = os("head");
    if (os0) os0.getWorldPosition(vTete).project(cam);
    const tete = os0 ? { x: r.left + ((vTete.x + 1) / 2) * r.width, y: r.top + ((1 - vTete.y) / 2) * r.height } : { x: ancre(r), y: r.top + r.height * 0.2 };
    // La bulle reste à hauteur de sa tête, qu'il soit baissé ou debout
    buddy.style.setProperty("--tete", `${Math.round(r.bottom - tete.y + r.height * 0.06)}px`);
    // Ce qu'il regarde : le lien ou le bouton survolé, sinon la souris
    let cx = pointeur.x;
    let cy = pointeur.y;
    let pointer = 0;
    if (compagnon.cible && compagnon.cible.isConnected) {
      const c = compagnon.cible.getBoundingClientRect();
      cx = THREE.MathUtils.clamp(pointeur.x, c.left, c.right);
      cy = c.top + c.height / 2;
      pointer = compagnon.pointable && (tete.x - cx) * g > 80 ? 1 : 0;
    }
    souris.set(THREE.MathUtils.clamp((cx - tete.x) / (window.innerWidth * 0.5), -1, 1), THREE.MathUtils.clamp((tete.y - cy) / (window.innerHeight * 0.5), -1, 1));
    sourisDouce.lerp(souris, Math.min(1, dt * 6));
    compagnon.pointe += (pointer - compagnon.pointe) * Math.min(1, dt * 8);
    const occupe = compagnon.pointe > 0.05 || tSalut >= 0 || tFache >= 0 || compagnon.tTampon >= 0 || tDanse >= 0 || tTir >= 0 || tJoie >= 0 || maintenant < compagnon.debout;
    compagnon.base = 0; // (il ne se baisse plus : en pied, cadre fixe ; ses états passent par ses gestes)
    void occupe;

    regard.position.set(sourisDouce.x * 2.2, 1.5 + y + sourisDouce.y * 1.4, 2.4);
    pivot.position.set(0, y, 0);
    pivot.rotation.y = -0.22 * g + sourisDouce.x * 0.12 + forme.vrille;
    pivot.scale.set(forme.ex, forme.ey, forme.ex);
    const danse = poidsDanse(dt);
    actions.repos.setEffectiveWeight(1 - danse);
    actions.course.setEffectiveWeight(0);
    if (actions.marche) actions.marche.setEffectiveWeight(0);
    if (actions.danse) actions.danse.setEffectiveWeight(danse);
    retouches.forEach((t) => {
      t.os.quaternion.copy(t.q);
      if (t.p) t.os.position.copy(t.p);
    });
    mixer.update(dt);
    retouches.forEach((t) => {
      t.q.copy(t.os.quaternion);
      if (t.p) t.p.copy(t.os.position);
    });
    // Le défilement : pas de saut vertical ; il penche juste un peu, comme dans un coup de vent (capuche, cordons)
    const ySc = window.scrollY;
    const v = (ySc - yDefile) / Math.max(dt, 0.001);
    yDefile = ySc;
    if (Math.abs(v) > 30) dernierDefile = maintenant;
    vitesseDefile += (THREE.MathUtils.clamp(v / 5000, -0.25, 0.25) - vitesseDefile) * Math.min(1, dt * 5);
    vent = vitesseDefile;
    ressorts.forEach((rs) => {
      rs.joint.settings.gravityDir.set(0, -1, -vent * 3).normalize();
      rs.joint.settings.gravityPower = rs.poids + Math.abs(vent) * 1.4;
    });
    gestes(dt, 0, 0);

    // Le basket : il dribble quand on ne fait rien, garde le ballon contre la hanche quand on défile, le passe dans
    // l'autre main quand il a besoin de la sienne, le range pour danser ou se fâcher
    if (basket) {
      if (tTir >= 0) gesteTir(dt);
      const brasPris = compagnon.pointe > 0.05 || tSalut >= 0 || compagnon.tTampon >= 0 || tJoie >= 0;
      let voulu = "dribble";
      if (tTir >= 0) voulu = "tir";
      else if (tDanse >= 0 || tFache >= 0 || tToc >= 0) voulu = "rien";
      else if (brasPris) voulu = compagnon.gauche ? "tenir" : "tenirGauche";
      else if (maintenant - dernierDefile < 1300) voulu = compagnon.gauche ? "tenirGauche" : "tenir";
      const jeu = basket.maj(dt, voulu);
      pivot.position.y = y + jeu.leve;
      if (jeu.balle) {
        if (!balleVue) apparition = 0;
        apparition = Math.min(1, apparition + dt / 0.28);
        const pop = apparition < 1 ? 1 + 0.25 * Math.sin(apparition * Math.PI) : 1;
        const taille = jeu.taille * lisse(apparition) * pop;
        balle.groupe.visible = taille > 0.02;
        balle.groupe.position.copy(jeu.balle);
        derniereBalle.copy(jeu.balle);
        const e = jeu.ecrase || 1;
        balle.groupe.scale.set(taille * (1 + (1 - e) * 0.5), taille * e, taille * (1 + (1 - e) * 0.5));
        balle.tourner(0, 0);
        balle.groupe.rotation.set(jeu.rotation || 0, 0, 0);
      } else balle.groupe.visible = false;
      balleVue = !!jeu.balle;
      if (jeu.regard && compagnon.pointe < 0.05 && !compagnon.cible) regard.position.lerp(jeu.regard, 0.5);
      // Le lâcher du tir : le ballon devient le ballon HTML qui vole jusqu'au panier
      if (tTir >= 0 && jeu.lache && !tirLance) {
        tirLance = true;
        cam.updateMatrixWorld();
        vDir.copy(derniereBalle).project(cam);
        cri("kobe");
        envoyer({ x: r.left + ((vDir.x + 1) / 2) * r.width, y: r.top + ((1 - vDir.y) / 2) * r.height });
      }
    }

    // Il montre du doigt ce qu'on survole
    if (compagnon.pointe > 0.01 && tSalut < 0 && tFache < 0 && compagnon.tTampon < 0) {
      const angle = THREE.MathUtils.clamp(Math.atan2(tete.y + r.height * 0.07 - cy, (tete.x - cx) * g - r.height * 0.03), -0.75, 1.2);
      const bras = compagnon.gauche ? "left" : "right";
      versPose(`${bras}UpperArm`, 0, 0.3 * g, angle * g, compagnon.pointe);
      versPose(`${bras}LowerArm`, 0, 0, 0.1 * g, compagnon.pointe);
      versPose(`${bras}Hand`, 0, 0, 0, compagnon.pointe);
      AUTRES_DOIGTS.forEach((d) => versPose(d.replace("right", bras), 0, 0, -1.25 * g, compagnon.pointe));
    }
    // Il tamponne : le bras se lève, s'abat, « Clac ! »
    if (compagnon.tTampon >= 0) {
      compagnon.tTampon += dt;
      const t = compagnon.tTampon;
      const poids = lisse(borne(t, 0, 0.15)) * lisse(borne(0.95 - t, 0, 0.25));
      const abat = lisse(borne(t, 0.27, 0.35));
      versPose("rightUpperArm", 0, 0.9, 1.15 * lisse(borne(t, 0, 0.22)) * (1 - abat) - 0.3 * abat, poids);
      versPose("rightLowerArm", 0, 0, 0.55, poids);
      DOIGTS.forEach((d) => versPose(d, 0, 0, -1.25,poids));
      if (!compagnon.tape && t > 0.33) {
        compagnon.tape = true;
        const sfx = buddy.querySelector('[data-sfx="clac"]');
        gsap.fromTo(sfx, { scale: 0.3, autoAlpha: 1, rotate: -16 }, { scale: 1, rotate: -7, duration: 0.16, ease: "back.out(3)" });
        gsap.to(sfx, { autoAlpha: 0, scale: 1.25, duration: 0.25, delay: 0.55 });
        gsap.fromTo(buddy, { y: 6 }, { y: 0, duration: 0.35, ease: "elastic.out(1.6, 0.3)", clearProps: "transform" });
      }
      if (t > 0.95) compagnon.tTampon = -1;
    }
    if (tJoie >= 0) gesteJoie(dt);
    clignement(dt, 0);
    vrm.update(dt);
    // Pendant le tir et la joie, la caméra monte avec ses bras : le ballon reste dans le cadre
    const bras = Math.max(tTir >= 0 ? lisse(borne(tTir, 0, 0.2)) * lisse(borne(1.6 - tTir, 0, 0.4)) : 0, tJoie >= 0 ? 0.6 : 0);
    compagnon.haut += (bras - compagnon.haut) * Math.min(1, dt * 8);
    // Cadre fixe, en pied (du sol jusqu'au ballon au point de tir) : plus de caméra qui monte et descend
    cam.position.set(0, 1.0, 5.6);
    cam.lookAt(0, 1.0, 0);
    cam.setViewOffset(largeurB, hauteurB, -0.28 * g * largeurB, 0, largeurB, hauteurB);
    renderer.render(scene, cam);
  }

  function saluerSansBulle() {
    if (!vrm || tSalut >= 0) return;
    tSalut = 0;
  }

  // La boucle de rendu tourne si la couverture est à l'écran, ou si le compagnon est (ou doit être) en place
  function majBoucle() {
    const actif = enVue || compagnon.actif || veutCompagnon();
    if (actif === boucle) return;
    boucle = actif;
    renderer.setAnimationLoop(actif ? image : null);
    if (actif) horloge.getDelta();
  }

  // --- la danse cachée : l'animation n'est téléchargée que si on la demande
  function danser() {
    if (!vrm || tDanse >= 0 || tToc >= 0 || tTir >= 0 || (!compagnon.actif && p > 0.03)) return;
    if (tBalle >= 0 && tBalle < 3.6) tBalle = 3.6;
    const lancer = () => {
      tDanse = 0;
      actions.danse.reset().play();
    };
    if (actions.danse) {
      lancer();
      return;
    }
    fetch(`${BASE}danse.json`)
      .then((r) => r.json())
      .then((json) => {
        if (mort) return;
        actions.danse = mixer.clipAction(clipDe(json, vrm, "danse"));
        actions.danse.setEffectiveWeight(0);
        dureeDanse = Math.min(json.duree, 7);
        lancer();
      })
      .catch(() => {});
  }

  function poidsDanse(dt) {
    if (tDanse < 0) return 0;
    tDanse += dt;
    if (tDanse > dureeDanse) {
      tDanse = -1;
      return 0;
    }
    return lisse(borne(tDanse, 0, 0.35)) * lisse(borne(dureeDanse - tDanse, 0, 0.45));
  }

  // --- l'entrée : il arrive en courant, freine, se tourne et salue
  function jouerEntree() {
    if (lance || !vrm) return;
    lance = true;
    dernierGeste = performance.now();
    if (p > 0.08) {
      Object.assign(entree, { x: 0, tour: 0, course: 0 });
      entreeFinie = true;
      etape("");
      return;
    }
    const vitesse = q(".mg-speed");
    const tl = gsap.timeline();
    tl.fromTo(vitesse, { opacity: 0 }, { opacity: 0.8, duration: 0.15 }, 0)
      .to(entree, { x: 0, duration: 1.05, ease: "power2.out" }, 0)
      .to(entree, { tour: 0, course: 0, duration: 0.42, ease: "power2.inOut" }, 0.78)
      .to(vitesse, { opacity: 0, duration: 0.3 }, 0.85)
      .fromTo(q(".mg-sfx"), { scale: 0.2, autoAlpha: 0, rotate: -18 }, { scale: 1, autoAlpha: 1, rotate: -8, duration: 0.22, ease: "back.out(2.4)" }, 0.95)
      .fromTo(q(".mg-title"), { x: 0 }, { x: 10, duration: 0.05, repeat: 5, yoyo: true, ease: "none" }, 0.95)
      .to(q(".mg-sfx"), { autoAlpha: 0, scale: 1.3, duration: 0.3, ease: "power2.in" }, 1.75)
      .add(saluer, 1.3)
      .add(() => etape("mg-encre"), 0.95)
      .add(() => etape("mg-trame"), 1.5)
      .add(() => etape(""), 2.05)
      .add(() => {
        entreeFinie = true;
        dernierGeste = performance.now();
      }, 4.2);
    fin.push(() => tl.kill());
  }

  let voulu = false; // la porte d'entrée (préchargeur) est ouverte
  charger()
    .then(([gltf, repos, course, marche]) => {
      if (mort) return;
      vrm = gltf.userData.vrm;
      VRMUtils.rotateVRM0(vrm);
      vrm.scene.traverse((o) => {
        o.frustumCulled = false;
      });
      pivot.add(vrm.scene);
      vrm.lookAt.target = regard;
      mixer = new THREE.AnimationMixer(vrm.scene);
      actions = { repos: mixer.clipAction(clipDe(repos, vrm, "repos")), course: mixer.clipAction(clipDe(course, vrm, "course")) };
      actions.repos.play();
      actions.course.play();
      // La marche n'avance pas toute seule : son temps suit la distance parcourue (pas de pieds qui glissent)
      actions.marche = mixer.clipAction(clipDe(marche, vrm, "marche"));
      actions.marche.play();
      actions.marche.paused = true;
      actions.marche.setEffectiveWeight(0);
      const JAMBES = ["UpperLeg", "LowerLeg", "Foot", "Toes"].flatMap((n) => [`left${n}`, `right${n}`]);
      const noms = ["hips", "spine", "chest", "neck", "head", "rightUpperArm", "rightLowerArm", "rightHand", "leftUpperArm", "leftLowerArm", "leftHand", ...JAMBES, ...DOIGTS, ...DOIGTS.map((d) => d.replace("right", "left"))];
      // (les hanches : la rotation et la position, que le basket abaisse quand il fléchit les genoux)
      retouches = noms.filter((nom) => os(nom)).map((nom) => ({ os: os(nom), q: os(nom).quaternion.clone(), p: nom === "hips" ? os(nom).position.clone() : null }));
      basket = creerBasket({ THREE, vrm, pivot });
      // La peau du corps sous le pull et le pantalon n'est jamais dessinée (elle perçait aux aisselles en levant les bras)
      cacherPeauSousVetements(vrm);
      // Capuche et cordons : leur pesanteur suivra la vitesse du défilement
      ressorts = Array.from(vrm.springBoneManager?.joints || []).map((joint) => ({ joint, poids: joint.settings.gravityPower }));
      root.classList.add("is-live");
      if (voulu) jouerEntree();
    })
    .catch(() => {
      // Pas de WebGL ou fichier absent : l'affiche fixe reste en place
      root.classList.add("is-still");
      etape("");
    });

  // --- écoute du visiteur
  let dernierPoint = { x: 0, y: 0 };
  const geste = () => {
    balleFaite = false;
    dernierGeste = Math.max(dernierGeste, performance.now());
  };
  const surSouris = (e) => {
    pointeur.x = e.clientX;
    pointeur.y = e.clientY;
    if (!compagnon.actif) souris.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    if (Math.abs(e.clientX - dernierPoint.x) + Math.abs(e.clientY - dernierPoint.y) > 12) {
      dernierPoint = { x: e.clientX, y: e.clientY };
      geste();
    }
  };
  window.addEventListener("pointermove", surSouris, { passive: true });
  ["pointerdown", "wheel", "keydown", "touchstart", "scroll"].forEach((type) => {
    window.addEventListener(type, geste, { passive: true });
    fin.push(() => window.removeEventListener(type, geste));
  });
  fin.push(() => window.removeEventListener("pointermove", surSouris));
  poke.addEventListener("click", surClic);
  // « Tente un panier » dans la case « Le basket »
  const surTir = (e) => {
    const bouton = e.target instanceof Element ? e.target.closest("[data-shoot]") : null;
    if (bouton) tirer(bouton);
  };
  root.addEventListener("click", surTir);
  fin.push(() => root.removeEventListener("click", surTir));
  // Taper « dance » (ou « danse ») au clavier le fait danser quelques secondes
  let frappe = "";
  const surTouche = (e) => {
    if (e.key.length !== 1) return;
    frappe = (frappe + e.key.toLowerCase()).slice(-5);
    if (frappe === "dance" || frappe === "danse") danser();
  };
  window.addEventListener("keydown", surTouche);
  fin.push(() => window.removeEventListener("keydown", surTouche));
  fin.push(() => poke.removeEventListener("click", surClic));

  // --- écoute du visiteur pour le compagnon : ce qu'il survole, ses clics sur les certificats, le bouton « masquer »
  const surSurvol = (e) => {
    if (!compagnon.actif) return;
    const el = e.target instanceof Element ? e.target.closest("a, button") : null;
    if (!el || buddy.contains(el) || el.closest(".hud, .menu, .pro-banner")) {
      compagnon.cible = null;
      return;
    }
    compagnon.cible = el;
    compagnon.pointable = el.matches(".mg-world a, #work a, .footer a");
  };
  const surClicPage = (e) => {
    if (compagnon.actif && e.target instanceof Element && e.target.closest(".certs") && e.target.closest("a, button")) tamponner();
  };
  const pokeB = buddy.querySelector(".mg-buddy__poke");
  const fermer = buddy.querySelector(".mg-buddy__close");
  const surPokeB = () => {
    surClic();
    if (compagnon.zone) conseil(compagnon.zone);
    compagnon.debout = performance.now() + 3000;
  };
  const masquer = () => {
    compagnon.permis = false;
    try {
      window.sessionStorage.setItem("mgBuddyOff", "1");
    } catch (e) {
      // stockage indisponible : il reste masqué jusqu'au prochain chargement
    }
    if (compagnon.actif) versCouverture();
    majBoucle();
  };
  // Clic sur un lien interne de l'accueil (monde, catégorie, projet) : il plonge dans la case avant le changement de page
  const surLien = (e) => {
    if (!compagnon.actif || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const lien = e.target instanceof Element ? e.target.closest("a[href]") : null;
    if (!lien || buddy.contains(lien) || lien.target === "_blank" || lien.closest(".hud, .menu, .pro-banner")) return;
    if (lien.origin !== window.location.origin || lien.pathname === window.location.pathname) return;
    plonger(lien);
  };
  document.addEventListener("click", surLien, true);
  fin.push(() => {
    document.removeEventListener("click", surLien, true);
    gsap.killTweensOf(forme);
    gsap.set(buddy, { clearProps: "transform" });
    buddy.classList.remove("mg-buddy--left");
  });
  document.addEventListener("pointerover", surSurvol, { passive: true });
  document.addEventListener("click", surClicPage);
  window.addEventListener("resize", tailleCompagnon);
  pokeB.addEventListener("click", surPokeB);
  fermer.addEventListener("click", masquer);
  fin.push(() => {
    document.removeEventListener("pointerover", surSurvol);
    document.removeEventListener("click", surClicPage);
    window.removeEventListener("resize", tailleCompagnon);
    pokeB.removeEventListener("click", surPokeB);
    fermer.removeEventListener("click", masquer);
    gsap.killTweensOf(compagnon);
    buddy.classList.remove("is-on");
  });

  // --- les cases des chapitres s'encrent à leur arrivée à l'écran
  root.querySelectorAll("[data-ink]").forEach((el, i) => {
    const sens = i % 2 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
    const anim = gsap.fromTo(
      el,
      { clipPath: sens, y: 40 },
      { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.9, ease: "expo.out", paused: true, clearProps: "clipPath" }
    );
    const st = ScrollTrigger.create({ trigger: el, start: "top 86%", once: true, onEnter: () => anim.play() });
    fin.push(() => {
      st.kill();
      anim.kill();
    });
  });

  // Aide aux essais (serveur de développement seulement) : window.__mgCover.toquer(), .facher(), .saluer()
  if (process.env.NODE_ENV === "development") {
    window.__mgCover = { toquer, facher, saluer, tamponner, compagnon, changerCote, plonger, danser,
      balle: () => {
        tBalle = 0;
      },
    };
  }

  return {
    start() {
      voulu = true;
      jouerEntree();
    },
    setProgress(valeur) {
      p = valeur;
      defile.progress(valeur);
      if (p >= P.page[1]) tourneeEntiere();
      else if (p < P.saisie[0]) deplier();
      majBoucle();
    },
    run(actif) {
      enVue = actif;
      majBoucle();
    },
    resize(w, h) {
      largeur = w;
      hauteur = h;
      if (compagnon.actif) return; // le canvas est dans le coin : la taille de la couverture attendra le retour
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    },
    dispose() {
      mort = true;
      renderer.setAnimationLoop(null);
      fin.forEach((fn) => fn());
      defile.kill();
      if (vrm) VRMUtils.deepDispose(vrm.scene);
      balle.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
