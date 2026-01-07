
import { ArmKinematicModels, RobotService } from '../services/RobotService';
import type { DhParameters } from '../services/RobotService';
import { useGLTF, TransformControls } from '@react-three/drei';
import { Mesh, Vector3, Group, Quaternion } from 'three';
import { useRef, useEffect } from 'react';

interface RobotModelProps {
    joints: number[];
    onTargetChange: (x: number, y: number, z: number, w: number, p: number, r: number) => void;
    onJointsChange: (j: number[]) => void;
    dhParameters: DhParameters | null;
    model: ArmKinematicModels;
}

const degToRad = (deg: number) => deg * Math.PI / 180;

// Visualize axes
const Axis = () => (
    <axesHelper args={[200]} />
);

export default function RobotModel({ joints, onTargetChange, onJointsChange, dhParameters, model }: RobotModelProps) {
    void onTargetChange;
    const baseGroupRef = useRef<Group>(null);
    const targetRef = useRef<Group>(null);
    const tcpRef = useRef<Group>(null);

    // Sync TransformControls with TCP position on every frame (unless dragging)
    useEffect(() => {
        if (tcpRef.current && targetRef.current) {
            const worldPos = new Vector3();
            tcpRef.current.getWorldPosition(worldPos);
            targetRef.current.parent?.position.copy(worldPos);
        }
    }, [tcpRef, targetRef, joints, model]);

    // Determine GLB file based on model
    const modelName = model === ArmKinematicModels.CRX10iAL ? 'CRX-10iAL' : 'CRX-10iA';
    const glbPath = `/models/${modelName}_3D.glb`;

    // Load GLB
    const { nodes: gltfNodes } = useGLTF(glbPath) as unknown as { nodes: Record<string, Mesh> };

    // Helper to render a node with transform correction
    const Part = ({ name, parentWorldX = 0, parentWorldY = 0, parentWorldZ = 0 }: { name: string; parentWorldX?: number; parentWorldY?: number; parentWorldZ?: number }) => {
        // Find the specific node name that starts with the requested name
        const nodeName = Object.keys(gltfNodes).find(key => key.startsWith(name));
        const node = nodeName ? gltfNodes[nodeName] : undefined;

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

    // Determine d1 from J2ARM_UNIT position (y)
    // Note: GLB in meters, we want mm. 
    // We search for a node starting with J2ARM_UNIT
    const j2BaseName = Object.keys(gltfNodes).find(k => k.startsWith('J2ARM_UNIT'));
    const d1Node = j2BaseName ? gltfNodes[j2BaseName] : null;
    const d1 = d1Node ? d1Node.position.y * 1000 : 245;

    if (!dhParameters) {
        return null;
    }

    return (
        <group>
            <TransformControls
                mode="translate"
                size={1}
                onMouseUp={async (e) => {
                    if (!baseGroupRef.current || !e.target || !e.target.object) {
                        return;
                    }

                    // 1. Get new World Position
                    const worldPos = new Vector3();
                    e.target.object.getWorldPosition(worldPos);

                    // 2. Convert to Base Frame (Local to baseGroupRef)
                    const localPos = baseGroupRef.current.worldToLocal(worldPos.clone());

                    // 3. Get current WPR (Orientation) via FK to maintain orientation
                    const fk = await RobotService.calculateFK(joints, model);
                    if (!fk) {
                        return;
                    }
                    const { w, p, r } = fk;

                    // 4. Solve IK
                    const solutions = await RobotService.calculateIK(
                        localPos.x, localPos.y, localPos.z,
                        w, p, r,
                        model
                    );

                    // 5. Find closest solution
                    if (solutions.length > 0) {
                        let best = solutions[0];
                        let minDist = Infinity;
                        for (const sol of solutions) {
                            let dist = 0;
                            // Calculate Euclidean distance in joint space
                            for (let i = 0; i < 6; i++) dist += Math.pow(sol[i] - joints[i], 2);
                            if (dist < minDist) {
                                minDist = dist;
                                best = sol;
                            }
                        }
                        onJointsChange(best);
                    }
                }}
            >
                <group ref={targetRef} name="targetRef" />
            </TransformControls>

            {/* Base : J1BASE_UNIT + CONNECTOR_UNIT */}
            <group position={[0, 0, 0]}>
                <Part name="J1BASE_UNIT" />
                <Part name="CONNECTOR_UNIT" />
            </group>
            {/* Base Group with Ref for Relative Calculations */}
            <group ref={baseGroupRef} position={[0, d1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <Axis />



                {/* J1 : J2BASE_UNIT */}
                {/* J1 Group is at [0, d1, 0] */}
                <group rotation={[Math.PI / 2, j1, 0]}>

                    <Part name="J2BASE_UNIT" parentWorldY={d1} />

                    {/* J2 (Rotates around Z/Y?) */}
                    <group rotation={[0, 0, -j2]}>

                        {/* J2 Visuals : J2ARM_UNIT */}
                        <Part name="J2ARM_UNIT" parentWorldY={d1} />

                        {/* J3 */}
                        <group position={[0, dhParameters.a2, 0]} rotation={[0, 0, j3 + j2]}>
                            {/* J3 Visuals : J3CASING_UNIT */}
                            <Part name="J3CASING_UNIT" parentWorldY={dhParameters.a2 + d1} />

                            {/* J4 */}
                            <group position={[0, 0, 0]} rotation={[-j4, 0, 0]}>
                                {/* J4 Visuals : J3ARM_UNIT + NAME_LABEL */}
                                <Part name="J3ARM_UNIT" parentWorldY={dhParameters.a2 + d1} />
                                <Part name="NAME_LABEL_CRX_10iA" parentWorldY={dhParameters.a2 + d1} />

                                {/* J5 */}
                                <group position={[-dhParameters.d4, 0, 0]} rotation={[0, 0, j5]}>
                                    <Part name="J5CASING_UNIT" parentWorldX={-dhParameters.d4} parentWorldY={dhParameters.a2 + d1} />

                                    {/* J6 */}
                                    <group position={[0, 0, dhParameters.d5]} rotation={[-j6, 0, 0]}>
                                        <Part name="J6FLANGE_UNIT" parentWorldX={-dhParameters.d4} parentWorldY={dhParameters.a2 + d1} parentWorldZ={dhParameters.d5} />

                                        <group ref={tcpRef} position={[-dhParameters.d6, 0, 0]} rotation={[Math.PI / 2, Math.PI / 2, 0]}>

                                        </group>
                                    </group>
                                </group>
                            </group>
                        </group>
                    </group>
                </group>
            </group>
        </group >
    );
}

// Preload both models
useGLTF.preload('/models/CRX-10iA_3D.glb');
useGLTF.preload('/models/CRX-10iAL_3D.glb');
