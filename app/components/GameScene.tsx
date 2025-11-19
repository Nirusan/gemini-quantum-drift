'use client'

import React, { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, PerspectiveCamera, Environment, Stars, Trail, Float, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useGameStore } from '../store/useGameStore'
import { Vector2, Vector3 } from 'three'

// --- CONFIGURATION ---
const TUNNEL_LENGTH = 100
const TUNNEL_RADIUS = 15
const OBSTACLE_COUNT = 50 // Increased from 10 to 50
const SHIP_SPEED_MULTIPLIER = 0.8
const WORLD_COLOR_1 = '#00f3ff' // Neon Blue
const WORLD_COLOR_2 = '#bc13fe' // Neon Purple
const OBSTACLE_COLOR = '#ff0055' // Neon Red

function PlayerShip() {
  const shipRef = useRef<THREE.Group>(null)
  const { pointer, viewport, scene } = useThree()
  const isPlaying = useGameStore((state) => state.isPlaying)
  const isBotMode = useGameStore((state) => state.isBotMode)
  
  // Responsive ship scale: Smaller on mobile screens
  const isMobile = viewport.width < 6.0
  const baseScale = isMobile ? 0.35 : 0.5
  
  useFrame((state, delta) => {
    if (!shipRef.current) return
    
    let targetX = 0
    let targetY = 0

    if (isBotMode && isPlaying) {
      // BOT LOGIC v4: "3D Grid Scanner" (Now with Verticality!)
      const obstaclesGroup = scene.getObjectByName('obstacles')
      
      // Define candidate target points (5 horizontal x 3 vertical)
      const candidates: { x: number, y: number, danger: number }[] = []
      const xSteps = [-5, -2.5, 0, 2.5, 5]
      const ySteps = [-3, 0, 3] // Low, Mid, High

      xSteps.forEach(x => {
        ySteps.forEach(y => {
          candidates.push({ x, y, danger: 0 })
        })
      })
      
      // Scan obstacles to populate danger map for each candidate
      if (obstaclesGroup) {
        obstaclesGroup.children.forEach((obs) => {
          // Look ahead
          if (obs.position.z > -60 && obs.position.z < 8 && obs.visible) {
            candidates.forEach(cand => {
               // Calculate distance from this candidate point to the obstacle projected on XY plane
               const distX = Math.abs(obs.position.x - cand.x)
               const distY = Math.abs(obs.position.y - cand.y)
               
               // If this obstacle is threatening this candidate point
               // Safety margin tuned to 2.2: Allows tight squeezes but keeps safe distance from hitbox (1.6)
               if (distX < 2.2 && distY < 2.2) {
                 const distZ = Math.abs(obs.position.z - shipRef.current!.position.z)
                 // Danger is high if close, but weight is balanced to allow "skimming"
                 const threatLevel = 50000 / (Math.pow(distZ, 1.2) + 1) 
                 cand.danger += threatLevel
               }
            })
          }
        })
      }

      // Heuristic: Prefer center (0,0) slightly if safe, and prefer points close to current position (minimize movement)
      const currentX = shipRef.current.position.x
      const currentY = shipRef.current.position.y

      candidates.forEach(cand => {
        // Small penalty for being off-center
        cand.danger += (Math.abs(cand.x) + Math.abs(cand.y)) * 0.1
        
        // Stability Factor:
        // If a spot is safe, prefer the one closest to us to avoid erratic crossing.
        const distMove = Math.abs(cand.x - currentX) + Math.abs(cand.y - currentY)
        cand.danger += distMove * 5.0 
      })

      // Find safest candidate
      candidates.sort((a, b) => a.danger - b.danger)
      const safest = candidates[0]

      // Move towards safest point
      const desiredX = safest.x
      const desiredY = safest.y
      
      // Smooth steering - Precise control
      targetX = THREE.MathUtils.lerp(currentX, desiredX, delta * 12)
      targetY = THREE.MathUtils.lerp(currentY, desiredY, delta * 12)

      // Clamp to playable area
      targetX = Math.max(-6.0, Math.min(6.0, targetX))
      targetY = Math.max(-4.5, Math.min(4.5, targetY))
      
      // Apply movement
      shipRef.current.position.x = targetX
      shipRef.current.position.y = targetY

    } else {
      // HUMAN LOGIC
      targetX = (pointer.x * viewport.width) / 2.5
      targetY = (pointer.y * viewport.height) / 2.5
      
      // Lerp for smooth feeling
      shipRef.current.position.x = THREE.MathUtils.lerp(shipRef.current.position.x, targetX, delta * 5)
      shipRef.current.position.y = THREE.MathUtils.lerp(shipRef.current.position.y, targetY, delta * 5)
    }
    
    // Dynamic rotation based on movement
    shipRef.current.rotation.z = -shipRef.current.position.x * 0.1
    shipRef.current.rotation.x = -shipRef.current.position.y * 0.1
  })

  return (
    <group ref={shipRef}>
      <Trail width={2} length={6} color={WORLD_COLOR_1} attenuation={(t) => t * t}>
        <Float speed={5} rotationIntensity={0.5} floatIntensity={0.5}>
          <mesh rotation={[0, Math.PI, 0]} scale={[baseScale, baseScale, baseScale * 3]}>
            <coneGeometry args={[1, 2, 4]} />
            <meshStandardMaterial 
              color="white" 
              emissive={WORLD_COLOR_1}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        </Float>
      </Trail>
      {/* Engine Glow */}
      <pointLight position={[0, 0, 1]} distance={5} intensity={5} color={WORLD_COLOR_1} />
    </group>
  )
}

function InfiniteTunnel() {
  const segmentsRef = useRef<THREE.Group>(null)
  const speed = useGameStore((state) => state.speed)
  const isPlaying = useGameStore((state) => state.isPlaying)
  
  // Create initial segments
  const segments = useMemo(() => {
    return new Array(20).fill(0).map((_, i) => ({
      z: -i * 10,
      rotation: i * 0.1
    }))
  }, [])

  useFrame((state, delta) => {
    if (!segmentsRef.current || !isPlaying) return
    
    // Move tunnel towards camera to simulate speed
    const moveSpeed = speed * SHIP_SPEED_MULTIPLIER * delta * 60
    segmentsRef.current.children.forEach((child) => {
      child.position.z += moveSpeed
      child.rotation.z += delta * 0.2 // Slowly rotate the whole world
      
      // Hide segments close to camera to prevent clipping
      if (child.position.z > 2) {
        child.visible = false
      } else {
        child.visible = true
      }

      // Reset segment when it passes camera
      if (child.position.z > 10) {
        child.position.z = -190
      }
    })
  })

  return (
    <group ref={segmentsRef}>
      {segments.map((s, i) => (
        <group key={i} position={[0, 0, s.z]}>
          {/* Hexagonal Ring */}
          <mesh rotation={[0, 0, s.rotation]}>
            <ringGeometry args={[TUNNEL_RADIUS, TUNNEL_RADIUS + 0.5, 6]} />
            <meshStandardMaterial 
              color={WORLD_COLOR_2} 
              emissive={WORLD_COLOR_2}
              emissiveIntensity={0.5}
              wireframe
              toneMapped={false}
            />
          </mesh>
          {/* Grid Lines connecting rings visual effect created by simple long boxes */}
           {[...Array(6)].map((_, j) => (
             <mesh key={j} position={[TUNNEL_RADIUS * Math.cos(j * Math.PI / 3), TUNNEL_RADIUS * Math.sin(j * Math.PI / 3), 5]} rotation={[0, 0, 0]}>
               <boxGeometry args={[0.2, 0.2, 10]} />
               <meshStandardMaterial color={WORLD_COLOR_2} emissive={WORLD_COLOR_2} emissiveIntensity={0.2} />
             </mesh>
           ))}
        </group>
      ))}
    </group>
  )
}

function ObstacleManager() {
  const obstaclesRef = useRef<THREE.Group>(null)
  const speed = useGameStore((state) => state.speed)
  const isPlaying = useGameStore((state) => state.isPlaying)
  const { viewport } = useThree()
  
  // Refs for collision detection to avoid re-creating vectors every frame
  const playerPos = useRef(new Vector3())
  const obstaclePos = useRef(new Vector3())
  
  // Initialize obstacles
  const obstacles = useMemo(() => {
    return new Array(OBSTACLE_COUNT).fill(0).map(() => ({
      position: new Vector3(
        (Math.random() - 0.5) * (TUNNEL_RADIUS * 0.8), 
        (Math.random() - 0.5) * (TUNNEL_RADIUS * 0.8), 
        -100 - Math.random() * 200 // Start far away
      ),
      scale: Math.random() * 2 + 1,
      rotation: new Vector3(Math.random(), Math.random(), Math.random())
    }))
  }, [])

  // Reset obstacles when game starts or restarts
  useEffect(() => {
    if (isPlaying && obstaclesRef.current) {
      obstaclesRef.current.children.forEach((child) => {
        child.position.z = -100 - Math.random() * 200
        child.position.x = (Math.random() - 0.5) * (TUNNEL_RADIUS * 0.8)
        child.position.y = (Math.random() - 0.5) * (TUNNEL_RADIUS * 0.8)
        child.visible = true
      })
    }
  }, [isPlaying])

  useFrame((state, delta) => {
    if (!isPlaying || !obstaclesRef.current) return

    // Get actions directly from store to avoid re-renders
    const { endGame, increaseScore, increaseSpeed } = useGameStore.getState()

    // Update Player Position Ref (Assumed 0,0,0 is player relative center, but player actually moves)
    // In this simplified setup, player mesh moves. We need to find it.
    // A better way is to pass player ref, but for simplicity we calculate strictly based on logic:
    const targetX = (state.pointer.x * viewport.width) / 2.5
    const targetY = (state.pointer.y * viewport.height) / 2.5
    playerPos.current.set(targetX, targetY, 0)

    const moveSpeed = speed * SHIP_SPEED_MULTIPLIER * delta * 60

    obstaclesRef.current.children.forEach((child, i) => {
      // Move Obstacle
      child.position.z += moveSpeed
      child.rotation.x += delta
      child.rotation.y += delta

      // Hide obstacle when it passes the player to prevent camera clipping
      if (child.position.z > 2) {
        child.visible = false
      } else {
        child.visible = true
      }

      // Reset if passed
      if (child.position.z > 10) { // Reset behind camera
        child.position.z = -200 - Math.random() * 100
        child.position.x = (Math.random() - 0.5) * (TUNNEL_RADIUS * 0.8)
        child.position.y = (Math.random() - 0.5) * (TUNNEL_RADIUS * 0.8)
        
        // Reward for passing
        increaseScore(10)
        if (Math.random() > 0.8) increaseSpeed()
      }

      // Collision Detection
      obstaclePos.current.copy(child.position)
      // Ignore Z distance for hit box if it's very close
      // We check collision only when objects are essentially on the same plane
      if (Math.abs(child.position.z) < 1.5) {
        // Calculate distance ignoring Z for a cylindrical hitbox
        // Or use full 3D distance since we are close in Z
        const distance = playerPos.current.distanceTo(obstaclePos.current)
        // Adjusted hitbox radius from 1.2 to 1.6 for better visual accuracy (less forgiving)
        if (distance < 1.6) {
          endGame()
        }
      }
    })
  })

  return (
    <group ref={obstaclesRef} name="obstacles">
      {obstacles.map((o, i) => (
        <mesh key={i} position={[o.position.x, o.position.y, o.position.z]} rotation={[o.rotation.x, o.rotation.y, o.rotation.z]}>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial 
            color={OBSTACLE_COLOR} 
            emissive={OBSTACLE_COLOR}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function SceneContent() {
  const [dpr, setDpr] = useState(1.5) // Default cap for mobile
  const [enabled, setEnabled] = useState(true) // Post-processing state

  return (
    <>
      <PerformanceMonitor 
        onDecline={() => {
          // Downgrade quality on lag
          setDpr(1)
          setEnabled(false) 
        }}
        onIncline={() => {
          // Restore quality if stable
          setDpr(1.5)
          setEnabled(true)
        }}
      />
      
      <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
      
      {/* Apply dynamic DPR to the parent Canvas via internal effect/hook would be complex, 
          so we rely on PostProcessing scaling or just accept internal resolution scaling 
          if passed as prop, but R3F handles dpr on Canvas. 
          
          Instead, we control what we render: */}
      
      <PlayerShip />
      <InfiniteTunnel />
      <ObstacleManager />
      
      <color attach="background" args={['#050510']} />
      <fog attach="fog" args={['#050510', 10, 120]} /> 
      <ambientLight intensity={0.5} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Only render expensive effects if enabled */}
      {enabled && (
        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={0.2} mipmapBlur intensity={1.5} radius={0.6} />
          <ChromaticAberration offset={new Vector2(0.002, 0.002)} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      )}
    </>
  )
}

// --- MAIN COMPONENT ---
export default function GameScene() {
  // We set a safe max DPR on the Canvas itself to prevent initial overload
  return (
    <div className="w-full h-screen relative">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: false, toneMapping: THREE.ReinhardToneMapping, powerPreference: "high-performance" }}>
        <SceneContent />
      </Canvas>
    </div>
  )
}
