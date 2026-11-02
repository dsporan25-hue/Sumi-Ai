/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SumiExpression } from '../types/sumi';

interface Sumi3DCanvasProps {
  expression: SumiExpression;
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  blushIntensity?: number;
  outfitVariant?: 'classic_princess' | 'modern_gothic' | 'kimono_red';
}

// Module-scope pre-allocated math objects to eliminate Garbage Collection in render loop
const _vec3 = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _headTargetRot = new THREE.Euler();

export const Sumi3DCanvas: React.FC<Sumi3DCanvasProps> = ({
  expression,
  isSpeaking,
  isListening,
  isThinking,
  blushIntensity = 1.0,
  outfitVariant = 'classic_princess',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    expression,
    isSpeaking,
    isListening,
    isThinking,
    blushIntensity,
    outfitVariant,
    pointerX: 0,
    pointerY: 0,
  });

  // Keep stateRef in sync without re-creating scene
  useEffect(() => {
    stateRef.current.expression = expression;
    stateRef.current.isSpeaking = isSpeaking;
    stateRef.current.isListening = isListening;
    stateRef.current.isThinking = isThinking;
    stateRef.current.blushIntensity = blushIntensity;
    stateRef.current.outfitVariant = outfitVariant;
  }, [expression, isSpeaking, isListening, isThinking, blushIntensity, outfitVariant]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Software WebGL Guard (Detect SwiftShader/llvmpipe/WARP)
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer setup with ACESFilmicToneMapping & SRGBColorSpace
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 3. Scene & Camera setup
    const scene = new THREE.Scene();
    // Subtle fog to fade out bedroom edges into deep mysterious midnight
    scene.fog = new THREE.FogExp2(0x0a0a14, 0.08);

    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    // Framed to showcase Sumi full-height / medium shot with perfect anime presence
    camera.position.set(0, 1.35, 3.2);
    camera.lookAt(0, 1.25, 0);

    // 4. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Balanced 3-Point Lighting Rig
    // Warm Key Light (Cast Shadows)
    const keyLight = new THREE.DirectionalLight(0xffecd2, 1.8);
    keyLight.position.set(2, 3.5, 2.5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 10;
      keyLight.shadow.camera.left = -1.5;
      keyLight.shadow.camera.right = 1.5;
      keyLight.shadow.camera.top = 2.5;
      keyLight.shadow.camera.bottom = -0.5;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Cool Rim Light (Emphasizes silver hair & anime silhouette)
    const rimLight = new THREE.DirectionalLight(0x90c0ff, 1.4);
    rimLight.position.set(-2.5, 3, -2);
    scene.add(rimLight);

    // Soft Romantic Red Fill Light (Emphasizes Red+Black identity)
    const accentLight = new THREE.PointLight(0xff2d55, 1.2, 5);
    accentLight.position.set(1.5, 1.2, 0.8);
    scene.add(accentLight);

    // Ambient / Hemisphere fill
    const hemiLight = new THREE.HemisphereLight(0x2d1a38, 0x0a0a14, 0.75);
    scene.add(hemiLight);

    // 6. Anime Bedroom Environment Group
    const bedroomGroup = new THREE.Group();
    scene.add(bedroomGroup);

    // Floor (Dark mahogany wood)
    const floorGeo = new THREE.PlaneGeometry(12, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x140e16,
      roughness: 0.45,
      metalness: 0.1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = !isSoftwareGl;
    bedroomGroup.add(floor);

    // Soft circular anime rug under Sumi
    const rugGeo = new THREE.CircleGeometry(1.6, 36);
    const rugMat = new THREE.MeshStandardMaterial({
      color: 0x24111f,
      roughness: 0.9,
      metalness: 0.05,
    });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, 0.008, 0);
    rug.receiveShadow = !isSoftwareGl;
    bedroomGroup.add(rug);

    // Soft Radial Contact Shadow Plane directly beneath Sumi
    const shadowGeo = new THREE.PlaneGeometry(1.4, 1.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d')!;
    const grad = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.65)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    shadowCtx.fillStyle = grad;
    shadowCtx.fillRect(0, 0, 128, 128);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    shadowTexture.colorSpace = THREE.SRGBColorSpace;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.015, 0);
    bedroomGroup.add(contactShadow);

    // Back bedroom wall
    const wallGeo = new THREE.PlaneGeometry(12, 6);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x120d18,
      roughness: 0.85,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 3, -2.5);
    bedroomGroup.add(backWall);

    // Bedroom Window showing starry night / soft anime sky
    const windowFrameGeo = new THREE.BoxGeometry(2.4, 2.2, 0.08);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x231a28, roughness: 0.6 });
    const windowFrame = new THREE.Mesh(windowFrameGeo, frameMat);
    windowFrame.position.set(-1.8, 2.3, -2.44);
    bedroomGroup.add(windowFrame);

    // Glass panel with night city / stars glow
    const glassGeo = new THREE.PlaneGeometry(2.1, 1.9);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x1a243a,
      roughness: 0.2,
      metalness: 0.2,
      emissive: 0x091428,
      emissiveIntensity: 0.5,
    });
    const windowGlass = new THREE.Mesh(glassGeo, glassMat);
    windowGlass.position.set(-1.8, 2.3, -2.39);
    bedroomGroup.add(windowGlass);

    // Cozy Anime Bed in the background (right side)
    const bedGroup = new THREE.Group();
    bedGroup.position.set(2.0, 0, -1.8);
    bedGroup.rotation.y = -Math.PI / 8;

    const mattressGeo = new THREE.BoxGeometry(1.6, 0.45, 2.2);
    const mattressMat = new THREE.MeshStandardMaterial({ color: 0x22131e, roughness: 0.8 });
    const mattress = new THREE.Mesh(mattressGeo, mattressMat);
    mattress.position.set(0, 0.25, 0);
    bedGroup.add(mattress);

    // Bed blanket (deep ruby red with gold stitch)
    const blanketGeo = new THREE.BoxGeometry(1.65, 0.46, 1.4);
    const blanketMat = new THREE.MeshStandardMaterial({ color: 0x881337, roughness: 0.7 });
    const blanket = new THREE.Mesh(blanketGeo, blanketMat);
    blanket.position.set(0, 0.26, 0.35);
    bedGroup.add(blanket);

    // Cute pillows
    const pillowGeo = new THREE.BoxGeometry(0.65, 0.16, 0.4);
    const pillowMat = new THREE.MeshStandardMaterial({ color: 0xfff1f2, roughness: 0.9 });
    const pillow1 = new THREE.Mesh(pillowGeo, pillowMat);
    pillow1.position.set(-0.4, 0.52, -0.7);
    pillow1.rotation.x = 0.25;
    const pillow2 = new THREE.Mesh(pillowGeo, pillowMat);
    pillow2.position.set(0.4, 0.52, -0.7);
    pillow2.rotation.x = 0.25;
    bedGroup.add(pillow1, pillow2);

    // Little cute plushie on the bed
    const plushGeo = new THREE.SphereGeometry(0.14, 16, 16);
    const plushMat = new THREE.MeshStandardMaterial({ color: 0xff708f, roughness: 0.8 });
    const plush = new THREE.Mesh(plushGeo, plushMat);
    plush.position.set(0.1, 0.58, 0.1);
    bedGroup.add(plush);
    bedroomGroup.add(bedGroup);

    // Neon LED accent strip along floor
    const stripGeo = new THREE.BoxGeometry(10, 0.03, 0.03);
    const stripMat = new THREE.MeshBasicMaterial({ color: 0xff1a4b });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(0, 0.02, -2.48);
    bedroomGroup.add(strip);

    // ========================================================
    // 7. SUMI — 3D ANIME CHARACTER MODEL (THREE.Group)
    // ========================================================
    const sumi = new THREE.Group();
    scene.add(sumi);

    // Material Library for Sumi
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfff0ea,
      roughness: 0.48,
      metalness: 0.02,
    });

    // Silver/White Hair with anisotropic sheen
    const hairMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.28,
      metalness: 0.15,
    });

    const hairHighlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.2,
    });

    // Red + Black outfit materials
    const blackDressMat = new THREE.MeshStandardMaterial({
      color: 0x121118,
      roughness: 0.42,
      metalness: 0.1,
    });

    const redAccentMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.35,
      metalness: 0.15,
      emissive: 0x58051a,
      emissiveIntensity: 0.2,
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.25,
      metalness: 0.85,
    });

    // Natural Brown Anime Eyes
    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
    });

    const irisMat = new THREE.MeshStandardMaterial({
      color: 0x61361c,
      roughness: 0.12,
      metalness: 0.1,
    });

    const eyeHighlightMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    // Mouth / Lip Mat
    const lipMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.3,
    });

    // --- BODY PARTS HIERARCHY ---

    // Root Pelvis / Lower Body
    const pelvis = new THREE.Group();
    pelvis.position.y = 0.85;
    sumi.add(pelvis);

    // Torso / Ribcage
    const torso = new THREE.Group();
    torso.position.y = 0.22;
    pelvis.add(torso);

    // Chest & Corset (Cute fitted silhouette)
    const chestGeo = new THREE.CylinderGeometry(0.15, 0.13, 0.3, 20);
    const chestMesh = new THREE.Mesh(chestGeo, blackDressMat);
    chestMesh.position.y = 0.15;
    chestMesh.castShadow = !isSoftwareGl;
    torso.add(chestMesh);

    // Corset Red Accent Trim
    const trimGeo = new THREE.TorusGeometry(0.145, 0.012, 12, 24);
    const corsetTrim1 = new THREE.Mesh(trimGeo, redAccentMat);
    corsetTrim1.rotation.x = Math.PI / 2;
    corsetTrim1.position.y = 0.18;
    torso.add(corsetTrim1);

    const corsetTrim2 = new THREE.Mesh(trimGeo, redAccentMat);
    corsetTrim2.rotation.x = Math.PI / 2;
    corsetTrim2.position.y = 0.06;
    torso.add(corsetTrim2);

    // Gold Corset Brooch
    const broochGeo = new THREE.SphereGeometry(0.02, 12, 12);
    const brooch = new THREE.Mesh(broochGeo, goldTrimMat);
    brooch.position.set(0, 0.18, 0.15);
    torso.add(brooch);

    // Flared Pleated Skirt (Black with red hem)
    const skirtGeo = new THREE.ConeGeometry(0.38, 0.32, 24, 1, true);
    const skirtMesh = new THREE.Mesh(skirtGeo, blackDressMat);
    skirtMesh.position.y = -0.05;
    skirtMesh.castShadow = !isSoftwareGl;
    pelvis.add(skirtMesh);

    // Skirt Red Frill Hem
    const frillGeo = new THREE.TorusGeometry(0.36, 0.018, 12, 32);
    const skirtFrill = new THREE.Mesh(frillGeo, redAccentMat);
    skirtFrill.rotation.x = Math.PI / 2;
    skirtFrill.position.y = -0.2;
    pelvis.add(skirtFrill);

    // Cute Back Ribbon on skirt
    const ribbonGeo = new THREE.BoxGeometry(0.24, 0.07, 0.03);
    const ribbon = new THREE.Mesh(ribbonGeo, redAccentMat);
    ribbon.position.set(0, 0.04, -0.16);
    pelvis.add(ribbon);

    // --- LEGS & BOOTS ---
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.1, -0.05, 0);
    pelvis.add(leftLegGroup);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.1, -0.05, 0);
    pelvis.add(rightLegGroup);

    // Thighs (Skin visible above socks / zettai ryouiki)
    const thighGeo = new THREE.CylinderGeometry(0.062, 0.05, 0.36, 16);
    const leftThigh = new THREE.Mesh(thighGeo, skinMat);
    leftThigh.position.y = -0.16;
    leftLegGroup.add(leftThigh);

    const rightThigh = new THREE.Mesh(thighGeo, skinMat);
    rightThigh.position.y = -0.16;
    rightLegGroup.add(rightThigh);

    // Knee-high Black Boots / Stockings with Red Top Cuff
    const bootGeo = new THREE.CylinderGeometry(0.058, 0.048, 0.48, 16);
    const leftBoot = new THREE.Mesh(bootGeo, blackDressMat);
    leftBoot.position.y = -0.48;
    leftBoot.castShadow = !isSoftwareGl;
    leftLegGroup.add(leftBoot);

    const rightBoot = new THREE.Mesh(bootGeo, blackDressMat);
    rightBoot.position.y = -0.48;
    rightBoot.castShadow = !isSoftwareGl;
    rightLegGroup.add(rightBoot);

    // Red cuffs on boots
    const bootCuffGeo = new THREE.TorusGeometry(0.06, 0.012, 10, 20);
    const leftCuff = new THREE.Mesh(bootCuffGeo, redAccentMat);
    leftCuff.rotation.x = Math.PI / 2;
    leftCuff.position.y = -0.28;
    leftLegGroup.add(leftCuff);

    const rightCuff = new THREE.Mesh(bootCuffGeo, redAccentMat);
    rightCuff.rotation.x = Math.PI / 2;
    rightCuff.position.y = -0.28;
    rightLegGroup.add(rightCuff);

    // Cute Shoes
    const shoeGeo = new THREE.BoxGeometry(0.09, 0.07, 0.16);
    const leftShoe = new THREE.Mesh(shoeGeo, blackDressMat);
    leftShoe.position.set(0, -0.74, 0.04);
    leftLegGroup.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, blackDressMat);
    rightShoe.position.set(0, -0.74, 0.04);
    rightLegGroup.add(rightShoe);

    // --- NECK & HEAD HIERARCHY ---
    const neck = new THREE.Group();
    neck.position.y = 0.32;
    torso.add(neck);

    const neckMeshGeo = new THREE.CylinderGeometry(0.05, 0.06, 0.12, 16);
    const neckMesh = new THREE.Mesh(neckMeshGeo, skinMat);
    neckMesh.position.y = 0.05;
    neck.add(neckMesh);

    // Black Choker with glowing red ruby heart
    const chokerGeo = new THREE.CylinderGeometry(0.056, 0.056, 0.03, 16);
    const choker = new THREE.Mesh(chokerGeo, blackDressMat);
    choker.position.y = 0.05;
    neck.add(choker);

    const heartGeo = new THREE.SphereGeometry(0.016, 12, 12);
    const chokerHeart = new THREE.Mesh(heartGeo, redAccentMat);
    chokerHeart.position.set(0, 0.05, 0.06);
    neck.add(chokerHeart);

    // HEAD GROUP (Pivot point for head tilts, nods, and eye glances)
    const headGroup = new THREE.Group();
    headGroup.position.y = 0.12;
    neck.add(headGroup);

    // Anime Head (Sculpted jawline, soft cheeks)
    const headGeo = new THREE.SphereGeometry(0.18, 24, 24);
    headGeo.scale(1, 1.12, 0.96);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.12, 0);
    headMesh.castShadow = !isSoftwareGl;
    headGroup.add(headMesh);

    // Anime Chin / Jaw refinement
    const chinGeo = new THREE.ConeGeometry(0.12, 0.14, 16);
    chinGeo.scale(1, 1, 0.7);
    const chin = new THREE.Mesh(chinGeo, skinMat);
    chin.rotation.x = Math.PI;
    chin.position.set(0, 0.02, 0.05);
    headGroup.add(chin);

    // --- ANIME EYES (NATURAL BROWN WITH SHY HIGHLIGHTS) ---
    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-0.068, 0.12, 0.145);
    headGroup.add(leftEyeGroup);

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(0.068, 0.12, 0.145);
    headGroup.add(rightEyeGroup);

    // Eye whites
    const eyeWhiteGeo = new THREE.SphereGeometry(0.036, 16, 16);
    eyeWhiteGeo.scale(1, 1.3, 0.4);
    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeGroup.add(leftEyeWhite);
    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeGroup.add(rightEyeWhite);

    // Iris (Warm rich brown)
    const irisGeo = new THREE.SphereGeometry(0.024, 16, 16);
    irisGeo.scale(1, 1.25, 0.5);
    const leftIris = new THREE.Mesh(irisGeo, irisMat);
    leftIris.position.set(0, 0, 0.015);
    leftEyeGroup.add(leftIris);

    const rightIris = new THREE.Mesh(irisGeo, irisMat);
    rightIris.position.set(0, 0, 0.015);
    rightEyeGroup.add(rightIris);

    // Magical Anime Eye Highlights
    const highlightGeo = new THREE.SphereGeometry(0.007, 10, 10);
    const leftHighlight = new THREE.Mesh(highlightGeo, eyeHighlightMat);
    leftHighlight.position.set(-0.008, 0.008, 0.03);
    leftEyeGroup.add(leftHighlight);

    const rightHighlight = new THREE.Mesh(highlightGeo, eyeHighlightMat);
    rightHighlight.position.set(-0.008, 0.008, 0.03);
    rightEyeGroup.add(rightHighlight);

    // Secondary subtle highlight
    const subHighlightGeo = new THREE.SphereGeometry(0.0035, 8, 8);
    const leftSubHighlight = new THREE.Mesh(subHighlightGeo, eyeHighlightMat);
    leftSubHighlight.position.set(0.008, -0.008, 0.03);
    leftEyeGroup.add(leftSubHighlight);

    const rightSubHighlight = new THREE.Mesh(subHighlightGeo, eyeHighlightMat);
    rightSubHighlight.position.set(0.008, -0.008, 0.03);
    rightEyeGroup.add(rightSubHighlight);

    // Upper Eyelashes (Eyelids for blinking)
    const eyelidGeo = new THREE.BoxGeometry(0.075, 0.015, 0.03);
    const eyelashMat = new THREE.MeshBasicMaterial({ color: 0x1f1924 });
    const leftEyelash = new THREE.Mesh(eyelidGeo, eyelashMat);
    leftEyelash.position.set(0, 0.036, 0.02);
    leftEyeGroup.add(leftEyelash);

    const rightEyelash = new THREE.Mesh(eyelidGeo, eyelashMat);
    rightEyelash.position.set(0, 0.036, 0.02);
    rightEyeGroup.add(rightEyelash);

    // Delicate Eyebrows
    const browGeo = new THREE.BoxGeometry(0.065, 0.007, 0.015);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.07, 0.17, 0.16);
    leftBrow.rotation.z = -0.08;
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.07, 0.17, 0.16);
    rightBrow.rotation.z = 0.08;
    headGroup.add(rightBrow);

    // Shy Anime Blush on cheeks
    const blushGeo = new THREE.PlaneGeometry(0.06, 0.028);
    const blushCanvas = document.createElement('canvas');
    blushCanvas.width = 64;
    blushCanvas.height = 32;
    const blushCtx = blushCanvas.getContext('2d')!;
    const blushGrad = blushCtx.createRadialGradient(32, 16, 0, 32, 16, 28);
    blushGrad.addColorStop(0, 'rgba(255, 90, 130, 0.85)');
    blushGrad.addColorStop(1, 'rgba(255, 90, 130, 0)');
    blushCtx.fillStyle = blushGrad;
    blushCtx.fillRect(0, 0, 64, 32);
    const blushTex = new THREE.CanvasTexture(blushCanvas);
    blushTex.colorSpace = THREE.SRGBColorSpace;
    const blushMat = new THREE.MeshBasicMaterial({
      map: blushTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.7,
    });

    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.11, 0.08, 0.14);
    leftBlush.rotation.y = -0.35;
    headGroup.add(leftBlush);

    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.11, 0.08, 0.14);
    rightBlush.rotation.y = 0.35;
    headGroup.add(rightBlush);

    // Cute Anime Nose
    const noseGeo = new THREE.ConeGeometry(0.01, 0.02, 8);
    const nose = new THREE.Mesh(noseGeo, skinMat);
    nose.rotation.x = -Math.PI / 4;
    nose.position.set(0, 0.08, 0.17);
    headGroup.add(nose);

    // MOUTH (Morphable mesh for sweet smile and lip sync speaking)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, 0.045, 0.155);
    headGroup.add(mouthGroup);

    // Upper lip / smile line
    const mouthGeo = new THREE.TorusGeometry(0.025, 0.005, 10, 16, Math.PI);
    const mouth = new THREE.Mesh(mouthGeo, lipMat);
    mouth.rotation.x = Math.PI;
    mouthGroup.add(mouth);

    // Open mouth interior for speaking visemes
    const mouthOpenGeo = new THREE.SphereGeometry(0.016, 12, 12);
    mouthOpenGeo.scale(1.2, 0.8, 0.5);
    const mouthOpenMat = new THREE.MeshBasicMaterial({ color: 0x881337 });
    const mouthInterior = new THREE.Mesh(mouthOpenGeo, mouthOpenMat);
    mouthInterior.position.set(0, -0.008, -0.005);
    mouthInterior.scale.set(0.1, 0.1, 0.1); // Closed by default
    mouthGroup.add(mouthInterior);

    // --- LONG STRAIGHT SILVER/WHITE HAIR ---
    const hairGroup = new THREE.Group();
    headGroup.add(hairGroup);

    // Front Bangs (Curved anime bangs covering forehead)
    const bangsGeo = new THREE.ConeGeometry(0.2, 0.18, 16, 1, true, 0, Math.PI);
    const bangs = new THREE.Mesh(bangsGeo, hairMat);
    bangs.rotation.x = 2.4;
    bangs.rotation.z = Math.PI;
    bangs.position.set(0, 0.22, 0.08);
    hairGroup.add(bangs);

    // Individual Bang Strands for natural anime look
    for (let i = -3; i <= 3; i++) {
      const strandGeo = new THREE.ConeGeometry(0.025, 0.16, 8);
      strandGeo.scale(0.8, 1.2, 0.4);
      const strand = new THREE.Mesh(strandGeo, i % 2 === 0 ? hairMat : hairHighlightMat);
      strand.rotation.x = 2.8;
      strand.rotation.z = i * 0.15;
      strand.position.set(i * 0.038, 0.2, 0.14);
      hairGroup.add(strand);
    }

    // Long Side-locks (Twin front strands framing the face with cute red ribbons)
    const sidelockGeo = new THREE.CylinderGeometry(0.022, 0.008, 0.65, 10);

    const leftSidelockGroup = new THREE.Group();
    leftSidelockGroup.position.set(-0.16, 0.18, 0.06);
    hairGroup.add(leftSidelockGroup);
    const leftSidelock = new THREE.Mesh(sidelockGeo, hairMat);
    leftSidelock.position.y = -0.3;
    leftSidelock.rotation.z = -0.05;
    leftSidelockGroup.add(leftSidelock);

    const rightSidelockGroup = new THREE.Group();
    rightSidelockGroup.position.set(0.16, 0.18, 0.06);
    hairGroup.add(rightSidelockGroup);
    const rightSidelock = new THREE.Mesh(sidelockGeo, hairMat);
    rightSidelock.position.y = -0.3;
    rightSidelock.rotation.z = 0.05;
    rightSidelockGroup.add(rightSidelock);

    // Cute Red Hair Ribbons on both side-locks
    const hairRibbonGeo = new THREE.TorusGeometry(0.03, 0.009, 8, 16);
    const leftHairRibbon = new THREE.Mesh(hairRibbonGeo, redAccentMat);
    leftHairRibbon.position.set(-0.16, 0.17, 0.08);
    leftHairRibbon.rotation.x = Math.PI / 4;
    hairGroup.add(leftHairRibbon);

    const rightHairRibbon = new THREE.Mesh(hairRibbonGeo, redAccentMat);
    rightHairRibbon.position.set(0.16, 0.17, 0.08);
    rightHairRibbon.rotation.x = Math.PI / 4;
    hairGroup.add(rightHairRibbon);

    // Long Straight Back Hair (Cascading down past her waist)
    const backHairGroup = new THREE.Group();
    backHairGroup.position.set(0, 0.15, -0.08);
    hairGroup.add(backHairGroup);

    const backHairGeo = new THREE.CylinderGeometry(0.19, 0.32, 1.15, 18, 1, true);
    backHairGeo.scale(1, 1, 0.6);
    const backHair = new THREE.Mesh(backHairGeo, hairMat);
    backHair.position.set(0, -0.45, -0.04);
    backHair.castShadow = !isSoftwareGl;
    backHairGroup.add(backHair);

    // Extra hair flow layers
    for (let k = -2; k <= 2; k++) {
      const strandGeo = new THREE.ConeGeometry(0.04, 0.95, 8);
      strandGeo.scale(0.8, 1, 0.3);
      const flowStrand = new THREE.Mesh(strandGeo, hairMat);
      flowStrand.position.set(k * 0.07, -0.45, -0.12 - Math.abs(k) * 0.02);
      flowStrand.rotation.x = -0.08;
      backHairGroup.add(flowStrand);
    }

    // Cute Anime Ahoge (Sprouting curved hair strand on top)
    const ahogeCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0.28, 0),
      new THREE.Vector3(0.05, 0.44, 0.04),
      new THREE.Vector3(0.12, 0.4, 0.08)
    );
    const ahogeGeo = new THREE.TubeGeometry(ahogeCurve, 12, 0.008, 6, false);
    const ahoge = new THREE.Mesh(ahogeGeo, hairHighlightMat);
    hairGroup.add(ahoge);

    // --- ARMS & HANDS ---
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.22, 0.26, 0);
    torso.add(leftArmGroup);

    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.22, 0.26, 0);
    torso.add(rightArmGroup);

    // Puffed shoulder sleeves (Black with red lace)
    const puffGeo = new THREE.SphereGeometry(0.075, 14, 14);
    const leftPuff = new THREE.Mesh(puffGeo, blackDressMat);
    leftArmGroup.add(leftPuff);
    const rightPuff = new THREE.Mesh(puffGeo, blackDressMat);
    rightArmGroup.add(rightPuff);

    // Upper arms & Forearms
    const armGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.28, 12);
    const leftArmMesh = new THREE.Mesh(armGeo, skinMat);
    leftArmMesh.position.y = -0.16;
    leftArmGroup.add(leftArmMesh);

    const rightArmMesh = new THREE.Mesh(armGeo, skinMat);
    rightArmMesh.position.y = -0.16;
    rightArmGroup.add(rightArmMesh);

    // Lower arms
    const leftForearm = new THREE.Group();
    leftForearm.position.y = -0.28;
    leftArmGroup.add(leftForearm);

    const rightForearm = new THREE.Group();
    rightForearm.position.y = -0.28;
    rightArmGroup.add(rightForearm);

    const forearmGeo = new THREE.CylinderGeometry(0.032, 0.026, 0.26, 12);
    const leftForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    leftForearmMesh.position.y = -0.12;
    leftForearm.add(leftForearmMesh);

    const rightForearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    rightForearmMesh.position.y = -0.12;
    rightForearm.add(rightForearmMesh);

    // Cute lace wrist cuffs
    const cuffGeo = new THREE.TorusGeometry(0.034, 0.01, 8, 16);
    const leftWristCuff = new THREE.Mesh(cuffGeo, redAccentMat);
    leftWristCuff.rotation.x = Math.PI / 2;
    leftWristCuff.position.y = -0.22;
    leftForearm.add(leftWristCuff);

    const rightWristCuff = new THREE.Mesh(cuffGeo, redAccentMat);
    rightWristCuff.rotation.x = Math.PI / 2;
    rightWristCuff.position.y = -0.22;
    rightForearm.add(rightWristCuff);

    // Hands
    const handGeo = new THREE.SphereGeometry(0.035, 12, 12);
    handGeo.scale(0.8, 1.2, 0.6);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(0, -0.26, 0);
    leftForearm.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0, -0.26, 0);
    rightForearm.add(rightHand);

    // Initial pose: graceful, slightly relaxed arms
    leftArmGroup.rotation.z = 0.15;
    leftArmGroup.rotation.x = 0.05;
    rightArmGroup.rotation.z = -0.15;
    rightArmGroup.rotation.x = 0.05;
    leftForearm.rotation.x = -0.2;
    rightForearm.rotation.x = -0.2;

    // Pointer move listener for shy eye glance tracking
    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      stateRef.current.pointerX = nx;
      stateRef.current.pointerY = ny;
    };
    window.addEventListener('pointermove', handlePointerMove);

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // ========================================================
    // 8. ANIMATION LOOP & KINEMATICS
    // ========================================================
    const clock = new THREE.Clock();
    let frameId = 0;
    let nextBlinkTime = 2.0;
    let isBlinking = false;
    let blinkProgress = 0;

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();

      const {
        expression: curExpr,
        isSpeaking: curSpeaking,
        isListening: curListening,
        isThinking: curThinking,
        blushIntensity: curBlush,
        pointerX,
        pointerY,
      } = stateRef.current;

      // --- 1. Rhythmic Breathing & Idle Sway ---
      const breathFreq = curListening ? 4.0 : 2.2;
      const breathCycle = Math.sin(time * breathFreq);
      torso.scale.x = THREE.MathUtils.damp(torso.scale.x, 1.0 + breathCycle * 0.015, 4, delta);
      torso.scale.z = THREE.MathUtils.damp(torso.scale.z, 1.0 + breathCycle * 0.02, 4, delta);
      torso.position.y = THREE.MathUtils.damp(torso.position.y, 0.22 + breathCycle * 0.006, 3, delta);

      // Subtle hip weight shifting
      pelvis.position.x = Math.sin(time * 0.8) * 0.015;
      pelvis.rotation.z = Math.sin(time * 0.8) * 0.012;

      // Hair physics sway
      backHairGroup.rotation.x = Math.sin(time * 1.5) * 0.04 - 0.02;
      backHairGroup.rotation.z = Math.cos(time * 1.2) * 0.03;
      leftSidelockGroup.rotation.z = Math.sin(time * 2.0) * 0.05;
      rightSidelockGroup.rotation.z = -Math.sin(time * 2.0) * 0.05;
      ahoge.rotation.z = Math.sin(time * 3.0) * 0.1;

      // --- 2. Random Natural Blinking Cycle ---
      if (time > nextBlinkTime && !isBlinking) {
        isBlinking = true;
        blinkProgress = 0;
      }

      if (isBlinking) {
        blinkProgress += delta * 12; // Fast anime blink
        let eyeScaleY = 1.0;
        if (blinkProgress < Math.PI) {
          eyeScaleY = Math.max(0.05, Math.cos(blinkProgress));
        } else {
          isBlinking = false;
          nextBlinkTime = time + 2.5 + Math.random() * 3.5;
        }
        leftEyeWhite.scale.y = 1.3 * eyeScaleY;
        rightEyeWhite.scale.y = 1.3 * eyeScaleY;
        leftIris.scale.y = 1.25 * eyeScaleY;
        rightIris.scale.y = 1.25 * eyeScaleY;
      }

      // --- 3. Shy Eye & Head Pointer Tracking ---
      const targetLookX = THREE.MathUtils.clamp(pointerX * 0.35, -0.25, 0.25);
      const targetLookY = THREE.MathUtils.clamp(pointerY * 0.25, -0.2, 0.2);

      leftIris.position.x = THREE.MathUtils.damp(leftIris.position.x, targetLookX * 0.015, 6, delta);
      leftIris.position.y = THREE.MathUtils.damp(leftIris.position.y, targetLookY * 0.015, 6, delta);
      rightIris.position.x = THREE.MathUtils.damp(rightIris.position.x, targetLookX * 0.015, 6, delta);
      rightIris.position.y = THREE.MathUtils.damp(rightIris.position.y, targetLookY * 0.015, 6, delta);

      // --- 4. Expression & State Kinematics ---
      let targetHeadRotY = targetLookX * 0.25;
      let targetHeadRotX = -targetLookY * 0.15;
      let targetHeadRotZ = 0;
      let targetMouthScaleY = 0.1;
      let targetMouthScaleX = 1.0;
      let targetBlushOpacity = 0.5 * curBlush;

      // State variations:
      if (curSpeaking) {
        // Dynamic speaking phonemes / visemes
        const speakCycle = (Math.sin(time * 16) + 1) * 0.5 * (Math.sin(time * 8) + 1) * 0.5;
        targetMouthScaleY = 0.5 + speakCycle * 0.9;
        targetMouthScaleX = 0.9 + speakCycle * 0.3;
        // Head gestures while speaking
        targetHeadRotX += Math.sin(time * 4) * 0.04;
        targetHeadRotZ += Math.cos(time * 3) * 0.03;
        targetBlushOpacity = 0.7 * curBlush;

        // Expressive hand gesturing while speaking
        leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, 0.3 + Math.sin(time * 3) * 0.12, 5, delta);
        leftForearm.rotation.x = THREE.MathUtils.damp(leftForearm.rotation.x, -0.8 + Math.cos(time * 3) * 0.15, 5, delta);
      } else if (curListening) {
        // Listening: leans head forward, attentive posture
        targetHeadRotX = 0.12;
        targetHeadRotZ = 0.08; // cute slight tilt
        targetHeadRotY += 0.05;
        leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, 0.25, 4, delta);
        rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, 0.25, 4, delta);
        leftForearm.rotation.x = THREE.MathUtils.damp(leftForearm.rotation.x, -0.6, 4, delta);
        rightForearm.rotation.x = THREE.MathUtils.damp(rightForearm.rotation.x, -0.6, 4, delta);
      } else if (curThinking) {
        // Thinking: tilts head up, index finger near cheek
        targetHeadRotX = -0.15;
        targetHeadRotZ = 0.14;
        targetHeadRotY = 0.1;
        rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, 0.85, 4, delta);
        rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, -0.3, 4, delta);
        rightForearm.rotation.x = THREE.MathUtils.damp(rightForearm.rotation.x, -1.4, 4, delta);
      } else if (curExpr === 'sulky') {
        // Sulky / Cute pout: turns head away slightly, pouting mouth
        targetHeadRotY = -0.28;
        targetHeadRotX = 0.12;
        targetHeadRotZ = -0.1;
        targetBlushOpacity = 0.95 * curBlush;
        leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, 0.35, 4, delta);
        rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, -0.35, 4, delta);
      } else if (curExpr === 'shy') {
        // Shy: tilts head down, deep blush
        targetHeadRotX = 0.16;
        targetHeadRotZ = 0.06;
        targetBlushOpacity = 0.9 * curBlush;
      } else if (curExpr === 'loving' || curExpr === 'happy') {
        // Loving / Happy: warm sweet head tilt, hand on chest
        targetHeadRotZ = -0.12;
        targetHeadRotX = -0.05;
        targetBlushOpacity = 0.75 * curBlush;
        leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, 0.5, 4, delta);
        leftForearm.rotation.x = THREE.MathUtils.damp(leftForearm.rotation.x, -1.2, 4, delta);
      } else {
        // Normal Idle arms
        leftArmGroup.rotation.x = THREE.MathUtils.damp(leftArmGroup.rotation.x, 0.05, 3, delta);
        rightArmGroup.rotation.x = THREE.MathUtils.damp(rightArmGroup.rotation.x, 0.05, 3, delta);
        leftArmGroup.rotation.z = THREE.MathUtils.damp(leftArmGroup.rotation.z, 0.15, 3, delta);
        rightArmGroup.rotation.z = THREE.MathUtils.damp(rightArmGroup.rotation.z, -0.15, 3, delta);
        leftForearm.rotation.x = THREE.MathUtils.damp(leftForearm.rotation.x, -0.2, 3, delta);
        rightForearm.rotation.x = THREE.MathUtils.damp(rightForearm.rotation.x, -0.2, 3, delta);
      }

      // Smooth damping for head rotation
      headGroup.rotation.y = THREE.MathUtils.damp(headGroup.rotation.y, targetHeadRotY, 5, delta);
      headGroup.rotation.x = THREE.MathUtils.damp(headGroup.rotation.x, targetHeadRotX, 5, delta);
      headGroup.rotation.z = THREE.MathUtils.damp(headGroup.rotation.z, targetHeadRotZ, 5, delta);

      // Smooth damping for mouth lip-sync
      mouthInterior.scale.y = THREE.MathUtils.damp(mouthInterior.scale.y, targetMouthScaleY, 15, delta);
      mouthInterior.scale.x = THREE.MathUtils.damp(mouthInterior.scale.x, targetMouthScaleX, 15, delta);

      // Blush opacity
      blushMat.opacity = THREE.MathUtils.damp(blushMat.opacity, targetBlushOpacity, 4, delta);

      // Render the frame
      renderer.render(scene, camera);

      frameId = requestAnimationFrame(tick);
    };

    // Pre-warm shaders
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    frameId = requestAnimationFrame(tick);

    // Clean up
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full pointer-events-auto z-0 overflow-hidden"
      style={{ touchAction: 'none' }}
    />
  );
};
