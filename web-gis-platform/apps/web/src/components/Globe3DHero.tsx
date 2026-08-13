import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── ATMOSPHERE GLOW FRESNEL SHADER ──
const AtmosphereShader = {
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vEyeVector = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vEyeVector;
    void main() {
      float intensity = pow(0.58 - dot(vNormal, vEyeVector), 2.2);
      gl_FragColor = vec4(0.35, 0.7, 1.0, 1.0) * intensity;
    }
  `
};

interface Globe3DHeroProps {
  isLightMode?: boolean;
}

export const Globe3DHero: React.FC<Globe3DHeroProps> = ({ isLightMode = false }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, WebGLRenderer Setup
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLightMode ? 1.65 : 1.45;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 2. Starfield Background
    const starCount = 3500;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 40 + Math.random() * 90;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: isLightMode ? 0.35 : 0.85
    });
    const starfield = new THREE.Points(starGeometry, starMaterial);
    scene.add(starfield);

    // 3. Texture Loader — Authentic NASA/Google Satellite Imagery
    // Dùng import.meta.env.BASE_URL để đảm bảo đường dẫn đúng cả trên localhost lẫn GitHub Pages
    const textureLoader = new THREE.TextureLoader();
    const base = import.meta.env.BASE_URL; // '/' on localhost, '/3dmappingwebsite/' on GitHub Pages
    
    const earthDayMap = textureLoader.load(`${base}textures/earth-day.jpg`);
    const earthSpecularMap = textureLoader.load(`${base}textures/earth-specular.jpg`);
    const earthBumpMap = textureLoader.load(`${base}textures/earth-topology.png`);
    const earthCloudMap = textureLoader.load(`${base}textures/earth-clouds.png`);

    earthDayMap.colorSpace = THREE.SRGBColorSpace;

    // 4. Photorealistic Bright Earth Mesh
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const earthRadius = 2.3;
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    
    // MeshStandardMaterial for rich, natural daytime satellite colors & realistic ocean gloss
    const earthMaterial = new THREE.MeshStandardMaterial({
      map: earthDayMap,
      roughness: 0.45,
      metalness: 0.05,
      bumpMap: earthBumpMap,
      bumpScale: 0.035,
      roughnessMap: earthSpecularMap
    });

    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    earthGroup.add(earthMesh);

    // 5. Bright Volumetric Cloud Sphere Layer
    const cloudGeometry = new THREE.SphereGeometry(earthRadius * 1.012, 64, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: earthCloudMap,
      transparent: true,
      opacity: 0.52,
      roughness: 0.9,
      blending: THREE.NormalBlending
    });
    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earthGroup.add(cloudMesh);

    // 6. Atmospheric Glow Halo (Fresnel Shader)
    const atmosphereGeometry = new THREE.SphereGeometry(earthRadius * 1.055, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: AtmosphereShader.vertexShader,
      fragmentShader: AtmosphereShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    earthGroup.add(atmosphereMesh);

    // 7. Lighting — Bright Daylight Key Light (placed in front of camera)
    // Key Sun Light placed at (-2.0, 2.0, 9.5) to fully illuminate 95% of front visible sphere!
    const sunLight = new THREE.DirectionalLight(0xffffff, isLightMode ? 4.2 : 3.6);
    sunLight.position.set(-2.0, 2.0, 9.5);
    sunLightRef.current = sunLight;
    scene.add(sunLight);

    // Fill Light from right to prevent harsh pitch-black shadows
    const fillLight = new THREE.DirectionalLight(0xaad4ff, 1.2);
    fillLight.position.set(6.0, 1.0, 4.0);
    scene.add(fillLight);

    // High Ambient Light for crisp, vivid day visibility across all continents & oceans
    const ambientIntensity = isLightMode ? 1.5 : 0.95;
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientIntensity);
    ambientLightRef.current = ambientLight;
    scene.add(ambientLight);

    // Initial orientation matching user's photo (Americas & Atlantic/Pacific in full view)
    earthGroup.rotation.z = 0.25;
    earthMesh.rotation.y = 4.3; // facing Americas / oceans like the photo

    // 8. Interactive Drag / Rotation Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      targetRotationY += deltaX * 0.004;
      targetRotationX += deltaY * 0.004;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const domElement = renderer.domElement;
    domElement.style.cursor = 'grab';
    domElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // 9. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      earthMesh.rotation.y += 0.0012;
      cloudMesh.rotation.y += 0.0016;
      starfield.rotation.y += 0.0001;

      if (Math.abs(targetRotationY) > 0.0001 || Math.abs(targetRotationX) > 0.0001) {
        earthGroup.rotation.y += targetRotationY;
        earthGroup.rotation.x += targetRotationX;

        earthGroup.rotation.x = Math.max(-0.9, Math.min(0.9, earthGroup.rotation.x));

        targetRotationY *= 0.92;
        targetRotationX *= 0.92;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 10. Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 11. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      domElement.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);

      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }

      starGeometry.dispose();
      starMaterial.dispose();
      earthGeometry.dispose();
      earthMaterial.dispose();
      earthDayMap.dispose();
      earthSpecularMap.dispose();
      earthBumpMap.dispose();
      cloudGeometry.dispose();
      cloudMaterial.dispose();
      earthCloudMap.dispose();
      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  // Update lighting dynamically when isLightMode prop toggles
  useEffect(() => {
    if (sunLightRef.current) {
      sunLightRef.current.intensity = isLightMode ? 4.2 : 3.6;
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isLightMode ? 1.5 : 0.95;
    }
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = isLightMode ? 1.65 : 1.45;
    }
  }, [isLightMode]);

  return (
    <div 
      ref={mountRef} 
      className="globe-3d-hero-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        touchAction: 'none'
      }}
    />
  );
};

export default Globe3DHero;
