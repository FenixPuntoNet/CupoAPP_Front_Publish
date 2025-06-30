// imports
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Html, 
  Sparkles,
  Sky,
  Effects
} from '@react-three/drei';
import { 
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration
} from '@react-three/postprocessing';
import { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import * as THREE from 'three';
import { BlendFunction } from 'postprocessing';


// Tipos e interfaces
interface DeviceContext {
  isMobile: boolean;
  isPortrait: boolean;
  scale: number;
}

interface RoutePoint {
  position: [number, number, number];
  control1?: [number, number, number];
  control2?: [number, number, number];
}

interface City {
  position: [number, number, number];
  name: string;
  description: string;

}

interface RouteSegment {
  name: string;
  color: string;
  points: RoutePoint[];
  description: string;
  distance: string;
  duration: string;
  type: 'highway' | 'local' | 'scenic';
}

interface Route {
  id: number;
  name: string;
  outbound: RouteSegment;
  inbound: RouteSegment;
  startCity: City;
  endCity: City;
}

interface RoadParticlesProps {
  curve: THREE.CurvePath<THREE.Vector3>;
  color: string;
  intensity?: number;
  deviceContext: DeviceContext;
}

interface VehicleProps {
  color: string;
  scale?: number;
  deviceContext: DeviceContext;
}

interface CityNodeProps extends City {
  isActive: boolean;
  deviceContext: DeviceContext;
}

interface RouteVisualizationProps {
  route: Route;
  isActive: boolean;
  showOutbound: boolean;
  deviceContext: DeviceContext;
}

interface DeviceContext {
  isMobile: boolean;
  isPortrait: boolean;
  scale: number;
}

// Constantes de diseño responsivo



const MOBILE_BREAKPOINT = 768;
// Datos de rutas optimizados para visualización responsiva
const valleyRoutes: Route[] = [
  {
    id: 1,
    name: "Cali - Palmira",
    startCity: {
      position: [0, 0, 0],
      name: "Cali",
      description: "Capital del Valle del Cauca",
     
    },
    endCity: {
      position: [4, 0, -3],
      name: "Palmira",
      description: "Capital Agrícola",

    },
    outbound: {
      name: "Recta Cali-Palmira",
      color: "#00ff9d",
      description: "Vía principal de alta velocidad",
      distance: "27 km",
      duration: "25 min",
      type: "highway",
      points: [
        { position: [0, 0, 0] },
        { 
          position: [2, 0, -1.5],
          control1: [1, 0, -0.5],
          control2: [1.5, 0, -1]
        },
        { position: [4, 0, -3] }
      ]
    },
    inbound: {
      name: "Ruta Juanchito",
      color: "#4D8BFF",
      description: "Vía alterna escénica",
      distance: "32 km",
      duration: "40 min",
      type: "scenic",
      points: [
        { position: [4, 0, -3] },
        { 
          position: [2, 0, -2],
          control1: [3, 0, -2.5],
          control2: [2.5, 0, -2.2]
        },
        { 
          position: [1, 0, -1],
          control1: [1.5, 0, -1.5],
          control2: [1.2, 0, -1.2]
        },
        { position: [0, 0, 0] }
      ]
    }
  },
  {
    id: 2,
    name: "Palmira - Buga",
    startCity: {
      position: [4, 0, -3],
      name: "Palmira",
      description: "Capital Agrícola",
    
    },
    endCity: {
      position: [2, 0, -8],
      name: "Buga",
      description: "Ciudad Señora",
  
    },
    outbound: {
      name: "Vía Panamericana",
      color: "#FF3366",
      description: "Eje vial principal",
      distance: "39 km",
      duration: "35 min",
      type: "highway",
      points: [
        { position: [4, 0, -3] },
        { 
          position: [3.5, 0, -5],
          control1: [4, 0, -4],
          control2: [3.8, 0, -4.5]
        },
        { position: [2, 0, -8] }
      ]
    },
    inbound: {
      name: "Ruta El Cerrito",
      color: "#FFD700",
      description: "Ruta rural escénica",
      distance: "45 km",
      duration: "50 min",
      type: "scenic",
      points: [
        { position: [2, 0, -8] },
        { 
          position: [4, 0, -6],
          control1: [2.5, 0, -7],
          control2: [3.5, 0, -6.5]
        },
        { 
          position: [4.5, 0, -4],
          control1: [4.2, 0, -5],
          control2: [4.4, 0, -4.5]
        },
        { position: [4, 0, -3] }
      ]
    }
  }
];

// Componente de partículas de la ruta
function RoadParticles({ curve, color, intensity = 1, deviceContext }: RoadParticlesProps) {
  const count = deviceContext.isMobile ? 30 : 50;
  const positions = useRef(new Float32Array(count * 3));
  const speeds = useMemo(() => 
    Array(count).fill(0).map(() => 0.001 + Math.random() * 0.002),
    [count]
  );
  const phases = useMemo(() => 
    Array(count).fill(0).map(() => Math.random() * Math.PI * 2),
    [count]
  );

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const t = (speeds[i] * time + phases[i]) % 1;
      const point = curve.getPoint(t);
      positions.current[i * 3] = point.x;
      positions.current[i * 3 + 1] = point.y + 0.1 + Math.sin(time * 2 + phases[i]) * 0.05;
      positions.current[i * 3 + 2] = point.z;
    }
  });

  const particleSize = deviceContext.isMobile ? 
    (deviceContext.isPortrait ? 0.08 : 0.1) : 
    0.12;

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions.current}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        color={color}
        transparent
        opacity={0.6 * intensity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Componente del vehículo mejorado
function EnhancedVehicle({ color, deviceContext }: VehicleProps) {
  const bodyRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const [hovered, setHovered] = useState(false);

  const scale = deviceContext.isMobile ?
    (deviceContext.isPortrait ? 0.6 : 0.7) :
    1;

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.intensity = 1 + Math.sin(state.clock.getElapsedTime() * 4) * 0.3;
    }
  });

  return (
    <group
      scale={[scale, scale, scale]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <group ref={bodyRef}>
        {/* Cuerpo principal con mejor detalle */}
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.3, 0.1, 0.5]} />
          <meshStandardMaterial
            color={color}
            metalness={0.9}
            roughness={0.1}
            emissive={color}
            emissiveIntensity={hovered ? 2 : 1}
          />
        </mesh>

        {/* Cabina con efecto cristal */}
        <mesh position={[0, 0.25, -0.05]}>
          <boxGeometry args={[0.25, 0.12, 0.25]} />
          <meshPhysicalMaterial
            color={color}
            metalness={0.9}
            roughness={0.1}
            transparent
            opacity={0.9}
            clearcoat={1}
            clearcoatRoughness={0.1}
          />
        </mesh>

        {/* Luces delanteras */}
        <pointLight
          ref={glowRef}
          position={[0, 0.15, 0.25]}
          color={color}
          intensity={1}
          distance={2}
        />
        <mesh position={[0, 0.15, 0.25]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>

        {/* Luces traseras */}
        <mesh position={[0, 0.15, -0.25]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshBasicMaterial 
            color="#ff0000"
           
         
          />
        </mesh>
      </group>
    </group>
  );
}

// Componente de ciudad optimizado
function CityNode({ 
  position, 
  name, 
  description, 

  isActive,
  deviceContext
}: CityNodeProps) {
  const [hovered, setHovered] = useState(false);
  const glowRef = useRef<THREE.PointLight>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  const scale = deviceContext.isMobile ?
    (deviceContext.isPortrait ? 0.7 : 0.8) :
    1;

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.intensity = (isActive ? 2 : 1) * (1 + Math.sin(state.clock.getElapsedTime() * 2) * 0.3);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.getElapsedTime() * 0.5;
      ringRef.current.scale.setScalar(1 + Math.sin(state.clock.getElapsedTime()) * 0.1);
    }
  });

  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Base de la ciudad */}
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
        <meshStandardMaterial
          color="#00ff9d"
          emissive="#00ff9d"
          emissiveIntensity={hovered || isActive ? 2 : 0.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Anillo giratorio */}
      <mesh ref={ringRef} rotation-x={Math.PI / 2}>
        <ringGeometry args={[0.5, 0.6, 32]} />
        <meshBasicMaterial
          color="#00ff9d"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Efecto de luz */}
      <pointLight
        ref={glowRef}
        color="#00ff9d"
        intensity={1}
        distance={3}
      />

      {/* Información de la ciudad */}
      <Html position={[0, 0.8, 0]} center>
        <div className={`
          transform transition-all duration-300 
          ${hovered ? 'scale-110' : 'scale-100'}
          ${deviceContext.isMobile ? 'scale-75' : ''}
        `}>
          <div className="
            bg-black/80 backdrop-blur-xl 
            px-3 py-2 md:px-6 md:py-4 rounded-xl 
            border border-[#00ff9d]/30 
            shadow-[0_0_30px_rgba(0,255,157,0.2)]
            min-w-[120px] md:min-w-[200px]
          ">
            <div className="text-[#00ff9d] font-bold text-sm md:text-lg mb-1 md:mb-2">
              {name}
            </div>
            <div className="text-white/90 text-xs md:text-sm mb-1">
              {description}
            </div>
            <div className="grid grid-cols-2 gap-1 md:gap-2 text-[10px] md:text-xs text-white/70">
            
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// Componente de visualización de ruta
function RouteVisualization({ 
  route, 
  isActive, 
  showOutbound,
  deviceContext 
}: RouteVisualizationProps) {
  const currentPath = showOutbound ? route.outbound : route.inbound;
  const curve = useMemo(() => {
    const curvePath = new THREE.CurvePath<THREE.Vector3>();
    
    for (let i = 0; i < currentPath.points.length - 1; i++) {
      const startPoint = new THREE.Vector3(...currentPath.points[i].position);
      const endPoint = new THREE.Vector3(...currentPath.points[i + 1].position);
      
      if (currentPath.points[i].control1 && currentPath.points[i].control2) {
        const control1 = new THREE.Vector3(...currentPath.points[i].control1!);
        const control2 = new THREE.Vector3(...currentPath.points[i].control2!);
        curvePath.add(new THREE.CubicBezierCurve3(startPoint, control1, control2, endPoint));
      } else {
        curvePath.add(new THREE.LineCurve3(startPoint, endPoint));
      }
    }
    
    return curvePath;
  }, [currentPath]);

  const [progress, setProgress] = useState(0);

  useFrame((_, delta) => {
    if (isActive) {
      setProgress((prev) => (prev + delta * (deviceContext.isMobile ? 0.15 : 0.1)) % 1);
    }
  });

  const vehiclePosition = curve.getPoint(progress);
  const tangent = curve.getTangent(progress);
  const lookAtPosition = new THREE.Vector3(
    vehiclePosition.x + tangent.x,
    vehiclePosition.y + tangent.y,
    vehiclePosition.z + tangent.z
  );

  // Escala del tubo de la ruta según el dispositivo
  const tubeScale = deviceContext.isMobile ? 
    (deviceContext.isPortrait ? 0.03 : 0.04) : 
    0.05;

  return (
    <group>
      {/* Tubo de la ruta */}
      <mesh>
        <tubeGeometry args={[curve, 64, tubeScale, 8, false]} />
        <meshStandardMaterial
          color={currentPath.color}
          transparent
          opacity={isActive ? 0.8 : 0.2}
          emissive={currentPath.color}
          emissiveIntensity={isActive ? 1 : 0.1}
        />
      </mesh>

      {isActive && (
        <>
          {/* Vehículo */}
          <group 
            position={vehiclePosition}
            rotation={new THREE.Euler().setFromQuaternion(
              new THREE.Quaternion().setFromRotationMatrix(
                new THREE.Matrix4().lookAt(
                  new THREE.Vector3(vehiclePosition.x, vehiclePosition.y, vehiclePosition.z),
                  lookAtPosition,
                  new THREE.Vector3(0, 1, 0)
                )
              )
            )}
          >
            <EnhancedVehicle 
              color={currentPath.color} 
              deviceContext={deviceContext}
            />
          </group>

          {/* Partículas de la ruta */}
          <RoadParticles 
            curve={curve} 
            color={currentPath.color}
            deviceContext={deviceContext}
          />

          {/* Información de la ruta */}
          <Html
            position={curve.getPoint(0.5).add(new THREE.Vector3(0, deviceContext.isMobile ? 0.7 : 1, 0))}
            center
            className={deviceContext.isMobile ? 'scale-75' : ''}
          >
            <div className="bg-black/80 backdrop-blur-xl px-3 py-2 md:px-4 md:py-3 rounded-xl border border-[#00ff9d]/30">
              <div className="text-[#00ff9d] font-bold text-sm md:text-base mb-1">
                {currentPath.name}
              </div>
              <div className="text-white/80 text-xs md:text-sm mb-1">
                {currentPath.description}
              </div>
              <div className="flex gap-2 text-[10px] md:text-xs text-white/60">
                <div>{currentPath.distance}</div>
                <div>•</div>
                <div>{currentPath.duration}</div>
              </div>
            </div>
          </Html>
        </>
      )}
    </group>
  );
}

// Componente de escena principal
function Scene({ deviceContext }: { deviceContext: DeviceContext }) {
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [showOutbound, setShowOutbound] = useState(true);

  useEffect(() => {
    const routeInterval = setInterval(() => {
      setActiveRouteIndex(prev => (prev + 1) % valleyRoutes.length);
    }, deviceContext.isMobile ? 8000 : 10000);

    const directionInterval = setInterval(() => {
      setShowOutbound(prev => !prev);
    }, deviceContext.isMobile ? 4000 : 5000);

    return () => {
      clearInterval(routeInterval);
      clearInterval(directionInterval);
    };
  }, [deviceContext.isMobile]);

  return (
    <>
      <Sky 
        distance={450000} 
        sunPosition={[0, 1, 0]} 
        inclination={0.5} 
        azimuth={0.25} 
      />
      
      {/* Iluminación */}
      <ambientLight intensity={0.2} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={0.5} 
        castShadow
      />

      {/* Efectos */}
      <Effects>
        <EffectComposer>
          <Bloom
            intensity={deviceContext.isMobile ? 1.2 : 1}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.9}
          />
          <ChromaticAberration
            offset={new THREE.Vector2(0.002, 0.002)}
            radialModulation={false}
            modulationOffset={0.15}
            blendFunction={BlendFunction.NORMAL}
          />
          <Vignette 
            darkness={deviceContext.isMobile ? 0.5 : 0.4} 
            offset={0.5} 
          />
        </EffectComposer>
      </Effects>

      <group>
        {/* Terreno base */}
        <mesh 
          rotation-x={-Math.PI / 2} 
          position-y={-0.1} 
          receiveShadow
        >
          <planeGeometry args={[100, 100, 32, 32]} />
          <meshStandardMaterial
            color="#111111"
            metalness={0.8}
            roughness={0.3}
            envMapIntensity={0.5}
          />
        </mesh>

        {/* Partículas ambientales */}
        <Sparkles
          count={deviceContext.isMobile ? 100 : 200}
          scale={deviceContext.isMobile ? 15 : 20}
          size={deviceContext.isMobile ? 3 : 4}
          speed={0.4}
          opacity={0.1}
          color="#00ff9d"
        />

        {/* Rutas y ciudades */}
        {valleyRoutes.map((route, index) => (
          <group key={route.id}>
            <CityNode
              {...route.startCity}
              isActive={index === activeRouteIndex}
              deviceContext={deviceContext}
            />
            <CityNode
              {...route.endCity}
              isActive={index === activeRouteIndex}
              deviceContext={deviceContext}
            />
            <RouteVisualization
              route={route}
              isActive={index === activeRouteIndex}
              showOutbound={showOutbound}
              deviceContext={deviceContext}
            />
          </group>
        ))}

        {/* Controles de cámara */}
        <OrbitControls
          enableZoom={true}
          minDistance={deviceContext.isMobile ? 3 : 5}
          maxDistance={deviceContext.isMobile ? 25 : 30}
          maxPolarAngle={Math.PI / 2.1}
          target={[2, 0, -2]}
        />
      </group>
    </>
  );
}
// Componente de información de ruta
function RouteInfoPanel({ 
  route, 
  isActive,
  isMobile 
}: { 
  route: Route; 
  isActive: boolean;
  isMobile: boolean;
}) {
  return (
    <div className={`
      text-white 
      transition-all duration-300 
      ${isActive ? 'opacity-100' : 'opacity-60'}
    `}>
      <div className="font-bold text-[#00ff9d] text-sm md:text-base mb-2">
        {route.name}
      </div>
      <div className={`
        grid gap-2
        ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}
      `}>
        <RouteDetail segment={route.outbound} isMobile={isMobile} />
        <RouteDetail segment={route.inbound} isMobile={isMobile} />
      </div>
    </div>
  );
}

// Componente de detalle de ruta
function RouteDetail({ 
  segment,
}: { 
  segment: RouteSegment;
  isMobile: boolean;
}) {
  return (
    <div className="flex items-center space-x-2">
      <span 
        className="w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: segment.color }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-xs md:text-sm truncate">
          {segment.name}
        </div>
        <div className="text-[10px] md:text-xs text-white/60">
          {segment.distance} • {segment.duration}
        </div>
      </div>
    </div>
  );
}

// Hook personalizado para manejar el contexto del dispositivo
function useDeviceContext() {
  const [deviceContext, setDeviceContext] = useState(() => {
    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const isPortrait = window.innerHeight > window.innerWidth;
    return {
      isMobile,
      isPortrait,
      scale: isMobile ? (isPortrait ? 0.7 : 0.8) : 1
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
      const isPortrait = window.innerHeight > window.innerWidth;
      setDeviceContext({
        isMobile,
        isPortrait,
        scale: isMobile ? (isPortrait ? 0.7 : 0.8) : 1
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceContext;
}

// Componente principal del mapa 3D
export function ThreeDMap() {
  const deviceContext = useDeviceContext();
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);

  // Ajustar posición de la cámara según el dispositivo
  const cameraPosition = useMemo(() => {
    if (deviceContext.isMobile) {
      return deviceContext.isPortrait 
        ? [0, 20, 0] as [number, number, number]
        : [12, 12, 12] as [number, number, number];
    }
    return [15, 15, 15] as [number, number, number];
  }, [deviceContext]);

  return (
    <div className="relative w-full h-[100vh] md:h-[800px]">
      {/* Título y descripción */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 md:p-6 border border-[#00ff9d]/20">
          <h1 className="text-[#00ff9d] text-xl md:text-3xl font-bold mb-2 text-center">
            Rutas del Valle del Cauca
          </h1>
          <p className="text-white/80 text-sm md:text-lg text-center">
            Explora las rutas entre las principales ciudades
          </p>
        </div>
      </div>

      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
      <div className="absolute inset-0 bg-[#00ff9d]/5 blur-[100px] animate-pulse" />

      {/* Canvas principal */}
      <Canvas
        shadows
        camera={{
          position: cameraPosition,
          fov: deviceContext.isMobile ? 60 : 45,
          near: 0.1,
          far: 1000
        }}
        className="w-full h-full"
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: deviceContext.isMobile ? 1.2 : 1.5
        }}
        performance={{ min: 0.5 }}
      >
        <Suspense fallback={null}>
          <Scene deviceContext={deviceContext} />
        </Suspense>
      </Canvas>

      {/* Panel de información */}
      <div className={`
        absolute z-10 
        ${deviceContext.isMobile ? 
          'bottom-4 left-4 right-4' : 
          'bottom-6 left-6 right-6'}
      `}>
        <div className="bg-black/60 backdrop-blur-xl p-3 md:p-4 rounded-xl border border-[#00ff9d]/20">
          <div className={`
            grid gap-3 md:gap-4
            ${deviceContext.isMobile ? 'grid-cols-1' : 'grid-cols-2'}
          `}>
            {valleyRoutes.map((route, index) => (
              <RouteInfoPanel
                key={route.id}
                route={route}
                isActive={index === activeRouteIndex}
                isMobile={deviceContext.isMobile}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores de navegación móvil */}
      {deviceContext.isMobile && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-2 z-10">
          {valleyRoutes.map((_, index) => (
            <button
              key={index}
              className={`
                w-2 h-2 rounded-full transition-all
                ${index === activeRouteIndex ? 
                  'bg-[#00ff9d] scale-125' : 
                  'bg-white/30'}
              `}
              onClick={() => setActiveRouteIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ThreeDMap;