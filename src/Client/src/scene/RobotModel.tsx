import { useRef } from 'react';
import { Group, Mesh } from 'three';
import { TransformControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface RobotModelProps {
    joints: number[];
    onTargetChange: (x: number, y: number, z: number, w: number, p: number, r: number) => void;
}

const degToRad = (deg: number) => deg * Math.PI / 180;

// Visualize axes
const Axis = () => (
    <axesHelper args={[200]} />
);

export default function RobotModel({ joints, onTargetChange }: RobotModelProps) {
    // Fanuc J1-J6
    // Note: Rotations are simplified approximations of a standard 6-axis structure
    // J1: Z-axis
    // J2: Y-axis
    // J3: Y-axis
    // J4: X-axis (along arm)
    // J5: Y-axis
    // J6: X-axis (flange)

    // Joint values to Radians
    const j1 = degToRad(joints[0]);
    const j2 = degToRad(joints[1]);
    const j3 = degToRad(joints[2]);
    const j4 = degToRad(joints[3]);
    const j5 = degToRad(joints[4]);
    const j6 = degToRad(joints[5]);

    // Dimensions (mm)
    const d1 = 400; // Base height
    const a2 = 500; // Arm 1
    const a3 = 500; // Arm 2
    const d4 = 100; // Forearm

    return (
        <group>
            {/* Base */}
            <mesh position={[0, d1 / 2, 0]}>
                <cylinderGeometry args={[100, 100, d1, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>

            {/* J1 (rotates around Y in ThreeJS if Up is Y. Fanuc Base is usually Z up. R3F default is Y up) */}
            <group position={[0, d1, 0]} rotation={[0, -j1, 0]}>
                <Axis />
                <mesh position={[0, 50, 0]}>
                    <sphereGeometry args={[100]} />
                    <meshStandardMaterial color="yellow" />
                </mesh>

                {/* Link 1 (Shoulder) */}
                {/* J2 (rotates around Z or X depending on model. Usually Y in R3F if we orient mesh correctly) */}
                {/* Let's assume J2 rotates around X (Horizontal) for this visualizer */}
                <group rotation={[0, 0, j2]}>
                    <mesh position={[0, a2 / 2, 0]}>
                        <boxGeometry args={[100, a2, 100]} />
                        <meshStandardMaterial color="yellow" />
                    </mesh>

                    {/* J3 */}
                    <group position={[0, a2, 0]} rotation={[0, 0, j3]}>
                        <mesh position={[0, a3 / 2, 0]}>
                            <boxGeometry args={[80, a3, 80]} />
                            <meshStandardMaterial color="yellow" />
                        </mesh>

                        {/* J4 */}
                        <group position={[0, a3, 0]} rotation={[0, -j4, 0]}>
                            <mesh position={[0, 50, 0]}>
                                <cylinderGeometry args={[50, 50, 200]} />
                                <meshStandardMaterial color="yellow" />
                            </mesh>

                            {/* J5 */}
                            <group position={[0, 200, 0]} rotation={[0, 0, -j5]}>
                                <mesh position={[0, 50, 0]}>
                                    <boxGeometry args={[50, 100, 50]} />
                                    <meshStandardMaterial color="yellow" />
                                </mesh>

                                {/* J6 */}
                                <group position={[0, 100, 0]} rotation={[0, -j6, 0]}>
                                    <mesh position={[0, 20, 0]}>
                                        <cylinderGeometry args={[40, 40, 40]} />
                                        <meshStandardMaterial color="black" />
                                    </mesh>
                                    <Axis />

                                    {/* TransformControl Target (End Effector) */}
                                    {/* Ideally we attach TransformControls here? 
                                        Or we put a separate object for TransformControls and sync them.
                                        But this robot is DRIVEN by joints. 
                                        To drive by IK, we manipulate a "Ghost" target, not the robot tip itself directly 
                                        (because robot tip is result of joints).
                                    */}
                                </group>
                            </group>
                        </group>
                    </group>
                </group>
            </group>
        </group>
    );
}

// Note: TransformControls interacting with IK requires a separate "Target" object in the scene that the user moves.
// I will update Scene.tsx to include that Target.
