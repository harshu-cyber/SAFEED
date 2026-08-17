import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// 1. Helper function to render a high-resolution Indian Tricolor & Ashoka Chakra texture onto a Canvas
function createIndianFlagTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800; // Standard 3:2 flag ratio
  const ctx = canvas.getContext('2d');

  const stripeHeight = canvas.height / 3;

  // Top Stripe: Vibrant Saffron
  ctx.fillStyle = '#FF9933';
  ctx.fillRect(0, 0, canvas.width, stripeHeight);

  // Middle Stripe: Pure White
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, stripeHeight, canvas.width, stripeHeight);

  // Bottom Stripe: Deep India Green
  ctx.fillStyle = '#138808';
  ctx.fillRect(0, stripeHeight * 2, canvas.width, stripeHeight);

  // Center Ashoka Chakra (Deep Navy Blue)
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const outerRadius = stripeHeight * 0.44;
  const innerRadius = outerRadius * 0.18;
  const navyColor = '#000080';

  ctx.strokeStyle = navyColor;
  ctx.fillStyle = navyColor;
  ctx.lineWidth = 8;

  // Outer Ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner Hub
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  // 24 Spokes & Triangular Spoke Tips
  const totalSpokes = 24;
  for (let i = 0; i < totalSpokes; i++) {
    const angle = (i * Math.PI * 2) / totalSpokes;

    // Spoke Line
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(centerX + innerRadius * Math.cos(angle), centerY + innerRadius * Math.sin(angle));
    ctx.lineTo(centerX + outerRadius * Math.cos(angle), centerY + outerRadius * Math.sin(angle));
    ctx.stroke();

    // Small spoke bulb at outer tip
    ctx.beginPath();
    ctx.arc(
      centerX + outerRadius * 0.95 * Math.cos(angle),
      centerY + outerRadius * 0.95 * Math.sin(angle),
      4,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Halfway decorative ring inside Chakra
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius * 0.5, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

// 2. 3D Flag Mesh with Cloth Physics & Wave Displacement
function FlagMesh() {
  const meshRef = useRef();
  const texture = useMemo(() => createIndianFlagTexture(), []);

  // Geometry dimensions — Larger scale for full viewport presence
  const width = 10.5;
  const height = 6.4;
  const widthSegments = 140;
  const heightSegments = 85;

  const originalPositions = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
    return geo.attributes.position.clone();
  }, [width, height, widthSegments, heightSegments]);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.getElapsedTime();
    const positionAttribute = meshRef.current.geometry.attributes.position;
    const vertexCount = positionAttribute.count;

    const leftEdgeX = -width / 2;

    for (let i = 0; i < vertexCount; i++) {
      const x = originalPositions.getX(i);
      const y = originalPositions.getY(i);

      // Distance from left fixed pole edge
      const distFromPole = (x - leftEdgeX) / width; // 0 at pole, 1 at right edge

      // Pinned at pole (distFromPole = 0)
      if (distFromPole > 0.001) {
        // Compound wave physics for realistic wind cloth effect
        const primaryWave = Math.sin(x * 1.3 - time * 3.6) * 0.45 * Math.pow(distFromPole, 1.1);
        const secondaryWave = Math.cos(y * 2.0 + time * 2.8) * 0.16 * distFromPole;
        const windTurbulence = Math.sin((x + y) * 2.5 - time * 4.8) * 0.1 * distFromPole;
        const flutter = Math.sin(x * 5.5 - time * 7.5) * 0.05 * distFromPole;

        const zDisplacement = primaryWave + secondaryWave + windTurbulence + flutter;
        const yDisplacement = y + Math.sin(x * 1.6 - time * 2.2) * 0.05 * distFromPole;

        positionAttribute.setZ(i, zDisplacement);
        positionAttribute.setY(i, yDisplacement);
      } else {
        positionAttribute.setZ(i, 0);
        positionAttribute.setY(i, y);
      }
    }

    positionAttribute.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <group position={[0.2, 0, 0]}>
      {/* 3D Waving Flag Cloth */}
      <mesh ref={meshRef}>
        <planeGeometry args={[width, height, widthSegments, heightSegments]} />
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          roughness={0.35}
          metalness={0.08}
          shadowSide={THREE.DoubleSide}
        />
      </mesh>

      {/* Flagpole Base & Column */}
      <group position={[-width / 2 - 0.15, 0, 0]}>
        {/* Stationary Pole */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.1, height * 1.7, 32]} />
          <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Golden Brass Finial Top Ball */}
        <mesh position={[0, height * 0.85 + 0.2, 0]}>
          <sphereGeometry args={[0.26, 32, 32]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Flag Pole Attachment Rings */}
        <mesh position={[0, height / 2 - 0.1, 0]}>
          <torusGeometry args={[0.14, 0.03, 16, 32]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, -height / 2 + 0.1, 0]}>
          <torusGeometry args={[0.14, 0.03, 16, 32]} />
          <meshStandardMaterial color="#D4AF37" metalness={0.9} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// 3. Main 3D Indian Flag Watermark Component
export const IndianFlag3DBackground = () => {
  const [isTabVisible, setIsTabVisible] = useState(true);

  // Tab visibility listener to pause rendering when user switches tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-1000"
      style={{
        opacity: 0.22, // High clarity 22% watermark opacity as requested (15-25%)
        pointerEvents: 'none',
      }}
    >
      <Canvas
        events={null}
        camera={{ position: [0, 0, 7.8], fov: 55 }}
        frameloop={isTabVisible ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}
      >
        {/* Studio Lighting for High Color Vibrancy */}
        <ambientLight intensity={1.8} />
        <directionalLight position={[7, 9, 9]} intensity={2.2} color="#FFFFFF" castShadow />
        <directionalLight position={[-7, -5, -4]} intensity={0.8} color="#FFF0C2" />
        <pointLight position={[0, 4, 4]} intensity={1.0} color="#FFFFFF" />

        {/* 3D Waving Flag Mesh */}
        <FlagMesh />
      </Canvas>
    </div>
  );
};

export default IndianFlag3DBackground;
