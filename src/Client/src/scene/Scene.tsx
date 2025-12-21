import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, TransformControls } from '@react-three/drei';
import RobotModel from './RobotModel';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { RobotService } from '../services/RobotService';

interface SceneProps {
    joints: number[];
    onJointsChange: (j: number[]) => void;
}

export default function Scene({ joints, onJointsChange }: SceneProps) {
    // Target position for IK (Yellow sphere)
    const targetRef = useRef<THREE.Object3D>(null);
    const [dragging, setDragging] = useState(false);

    // Initial target pos (approximate home)
    const [targetPos, setTargetPos] = useState<[number, number, number]>([400, 0, 400]);
    const [targetRot, setTargetRot] = useState<[number, number, number]>([THREE.MathUtils.degToRad(180), 0, 0]);

    const handleTransformChange = () => {
        if (!targetRef.current) return;

        const pos = targetRef.current.position;
        const rot = targetRef.current.rotation;

        // Fanuc is normally W=Rx, P=Ry, R=Rz in degrees
        // Convert ThreeJS Euler (default XYZ) to WPR

        // Update local state for visual
        setTargetPos([pos.x, pos.y, pos.z]);
        setTargetRot([rot.x, rot.y, rot.z]);

        // Call IK
        // Note: Debouncing might be needed for heavy calculations, but WASM is fast.
        RobotService.calculateIK(
            pos.x,
            pos.y,
            pos.z,
            THREE.MathUtils.radToDeg(rot.x),
            THREE.MathUtils.radToDeg(rot.y),
            THREE.MathUtils.radToDeg(rot.z)
        ).then(j => onJointsChange(j));
    };

    return (
        <Canvas camera={{ position: [1500, 1500, 1500], fov: 45, near: 10, far: 10000 }}>
            <color attach="background" args={['#202020']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[1000, 2000, 1000]} intensity={1} />

            <RobotModel joints={joints} />

            {/* IK Target Handle 
            <TransformControls
                mode="translate"
                onMouseDown={() => setDragging(true)}
                onMouseUp={() => setDragging(false)}
                onChange={handleTransformChange}
                size={1.5}
            >
                <mesh ref={targetRef} position={targetPos} rotation={targetRot}>
                    <sphereGeometry args={[15]} />
                    <meshBasicMaterial color="lime" wireframe />
                </mesh>
            </TransformControls>
*/}
            <OrbitControls makeDefault enabled={true} />
            <Grid infiniteGrid sectionColor="#6f6f6f" cellColor="#404040" sectionSize={500} cellSize={100} />
            <Environment preset="city" />
        </Canvas>
    );
}
