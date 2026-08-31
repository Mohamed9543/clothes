import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { computeAvatarScale } from '@/lib/avatar-scale';

const THREE_VERSION = '0.160.0';

export interface AvatarOverlay {
  type: string;
  colorHex: string;
  modelUrl?: string | null;
}

export interface AvatarViewerProps {
  avatarUrl: string;
  overlay?: AvatarOverlay | null;
  heightCm?: number | null;
  weightKg?: number | null;
  onLoadError?: () => void;
}

// Renders the try-on scene inside a WebView running plain three.js loaded
// from a CDN, rather than a native GL binding (expo-gl/@react-three/fiber).
// Chosen deliberately: expo-gl's version pairing with react-three-fiber has
// documented breakage against recent Expo SDKs, and OpenGL is deprecated on
// iOS — a WebView sidesteps both, at the cost of not being "truly native".
export function AvatarViewer({ avatarUrl, overlay, heightCm, weightKg, onLoadError }: AvatarViewerProps) {
  const scale = computeAvatarScale(heightCm, weightKg);

  const config = {
    avatarUrl,
    scale,
    overlay: overlay ?? null,
  };

  function handleMessage(event: WebViewMessageEvent) {
    if (event.nativeEvent.data === 'load-error') {
      onLoadError?.();
    }
  }

  return (
    <View style={styles.container}>
      <WebView
        style={styles.webview}
        originWhitelist={['*']}
        source={{ html: buildHtml() }}
        injectedJavaScriptBeforeContentLoaded={`window.__AVATAR_CONFIG__ = ${JSON.stringify(config)}; true;`}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        allowsInlineMediaPlayback
      />
    </View>
  );
}

function buildHtml(): string {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <style>html,body{margin:0;padding:0;overflow:hidden;background:#faf8f5;} canvas{display:block;touch-action:none;}</style>
</head>
<body>
<script type="module">
import * as THREE from 'https://unpkg.com/three@${THREE_VERSION}/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@${THREE_VERSION}/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://unpkg.com/three@${THREE_VERSION}/examples/jsm/controls/OrbitControls.js';

function post(message) {
  if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(message);
}

const config = window.__AVATAR_CONFIG__ || {};

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.4, 2.4);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(2, 4, 3);
scene.add(directional);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.minDistance = 1.2;
controls.maxDistance = 4;
controls.enablePan = false;

const avatarGroup = new THREE.Group();
const s = config.scale || [1, 1, 1];
avatarGroup.scale.set(s[0], s[1], s[2]);
scene.add(avatarGroup);

const loader = new GLTFLoader();

function loadGltf(url, onLoad) {
  loader.load(
    url,
    (gltf) => onLoad(gltf.scene),
    undefined,
    () => post('load-error'),
  );
}

if (config.avatarUrl) {
  loadGltf(config.avatarUrl, (avatarScene) => avatarGroup.add(avatarScene));
}

// Direct port of apps/web/src/components/avatar/clothing-overlay.tsx —
// proxy shapes for a standard full-body avatar (feet ~y=0, head ~y=1.65).
function addPrimitiveOverlay(type, colorHex) {
  const material = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.7 });

  if (type === 'pull' || type === 'chemise' || type === 'veste') {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 0.32, 4, 12), material);
    mesh.position.set(0, 1.28, 0);
    avatarGroup.add(mesh);
    return;
  }
  if (type === 'robe') {
    const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.62, 4, 12), material);
    mesh.position.set(0, 1.1, 0);
    avatarGroup.add(mesh);
    return;
  }
  if (type === 'pantalon') {
    const group = new THREE.Group();
    group.position.set(0, 0.62, 0);
    const legGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.75, 12);
    const left = new THREE.Mesh(legGeo, material);
    left.position.set(-0.09, 0, 0);
    const right = new THREE.Mesh(legGeo, material);
    right.position.set(0.09, 0, 0);
    group.add(left, right);
    avatarGroup.add(group);
    return;
  }
  if (type === 'chaussure') {
    const group = new THREE.Group();
    group.position.set(0, 0.05, 0.03);
    const shoeGeo = new THREE.BoxGeometry(0.1, 0.09, 0.26);
    const left = new THREE.Mesh(shoeGeo, material);
    left.position.set(-0.09, 0, 0);
    const right = new THREE.Mesh(shoeGeo, material);
    right.position.set(0.09, 0, 0);
    group.add(left, right);
    avatarGroup.add(group);
    return;
  }
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.02, 8, 20), material);
  mesh.position.set(0, 1.55, 0.12);
  avatarGroup.add(mesh);
}

if (config.overlay) {
  if (config.overlay.modelUrl) {
    loadGltf(config.overlay.modelUrl, (garmentScene) => avatarGroup.add(garmentScene));
  } else {
    addPrimitiveOverlay(config.overlay.type, config.overlay.colorHex || '#b8622e');
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onResize);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
