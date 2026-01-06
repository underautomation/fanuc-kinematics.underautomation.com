
import type { DhParameters } from '../services/RobotService';
import { useGLTF } from '@react-three/drei';
import { Mesh } from 'three';
import { parameter } from 'three/tsl';

interface RobotModelProps {
    joints: number[];
    onTargetChange: (x: number, y: number, z: number, w: number, p: number, r: number) => void;
    dhParameters: DhParameters | null;
}

const degToRad = (deg: number) => deg * Math.PI / 180;

// Visualize axes
const Axis = () => (
    <axesHelper args={[200]} />
);

export default function RobotModel({ joints, onTargetChange, dhParameters }: RobotModelProps) {
    void onTargetChange;

    // Load GLB
    const { nodes: gltfNodes } = useGLTF('/models/CRX-10iA_3D.glb') as unknown as { nodes: Record<string, Mesh> };

    // Helper to render a node with transform correction
    const Part = ({ name, parentWorldX = 0, parentWorldY = 0, parentWorldZ = 0 }: { name: string; parentWorldX?: number; parentWorldY?: number; parentWorldZ?: number }) => {
        const node = gltfNodes[name];
        if (!node) return null;

        const sceneNode = node.clone();

        // Calculate offset: NodeWorld (mm) - ParentWorld (mm)
        // Note: node.position is in meters
        const nodeY = node.position.y * 1000;
        const nodeX = node.position.x * 1000;
        const nodeZ = node.position.z * 1000;

        // We only correct Y for now based on the vertical chain assumption. 
        // If there are X/Z offsets in the chain, we should handle them too.
        const offsetY = nodeY - parentWorldY;
        const offsetX = nodeX - parentWorldX;
        const offsetZ = nodeZ - parentWorldZ;

        return (
            <primitive
                object={sceneNode}
                scale={[1000, 1000, 1000]}
                position={[offsetX, offsetY, offsetZ]}
            />
        );
    };

    // Joint values to Radians
    const j1 = degToRad(joints[0]);
    const j2 = degToRad(joints[1]);
    const j3 = degToRad(joints[2]);
    const j4 = degToRad(joints[3]);
    const j5 = degToRad(joints[4]);
    const j6 = degToRad(joints[5]);




    if (!dhParameters) {
        return null;
    }

    return (
        <group>
            {/* Base : J1BASE_UNIT + CONNECTOR_UNIT */}
            <group position={[0, 0, 0]}>
                <Part name="J1BASE_UNIT" />
                <Part name="CONNECTOR_UNIT" />
            </group>
            <group position={[0, 245, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <Axis />

                {/* J1 : J2BASE_UNIT */}
                {/* J1 Group is at [0, d1, 0] */}
                <group rotation={[Math.PI / 2, j1, 0]}>

                    <Part name="J2BASE_UNIT" parentWorldY={245} />

                    {/* J2 (Rotates around Z/Y?) */}
                    <group rotation={[0, 0, -j2]}>

                        {/* J2 Visuals : J2ARM_UNIT */}
                        <Part name="J2ARM_UNIT" parentWorldY={245} />

                        {/* J3 */}
                        <group position={[0, dhParameters.a2, 0]} rotation={[0, 0, j3 + j2]}>
                            {/* J3 Visuals : J3CASING_UNIT */}
                            <Part name="J3CASING_UNIT" parentWorldY={dhParameters.a2 + 245} />

                            {/* J4 */}
                            <group position={[0, 0, 0]} rotation={[-j4, 0, 0]}>
                                {/* J4 Visuals : J3ARM_UNIT + NAME_LABEL */}
                                <Part name="J3ARM_UNIT" parentWorldY={dhParameters.a2 + 245} />
                                <Part name="NAME_LABEL_CRX_10iA" parentWorldY={dhParameters.a2 + 245} />

                                {/* J5 */}
                                <group position={[-dhParameters.d4, 0, 0]} rotation={[0, 0, j5]}>
                                    <Part name="J5CASING_UNIT" parentWorldX={-dhParameters.d4} parentWorldY={dhParameters.a2 + 245} />

                                    {/* J6 */}
                                    <group position={[0, 0, dhParameters.d5]} rotation={[-j6, 0, 0]}>
                                        <Part name="J6FLANGE_UNIT" parentWorldX={-dhParameters.d4} parentWorldY={dhParameters.a2 + 245} parentWorldZ={dhParameters.d5} />

                                        <group position={[-dhParameters.d6, 0, 0]} rotation={[Math.PI / 2, Math.PI / 2, 0]}>
                                            <Axis />

                                        </group>
                                    </group>
                                </group>
                            </group>
                        </group>
                    </group>
                </group>
            </group>
        </group>
    );
}

useGLTF.preload('/models/CRX-10iA_3D.glb');
