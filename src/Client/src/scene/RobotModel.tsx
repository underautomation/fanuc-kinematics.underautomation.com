import { ArmKinematicModels } from '../services/RobotService';
import type { DhParameters } from '../services/RobotService';
import { useGLTF, PivotControls } from '@react-three/drei';
import { Mesh, Vector3, Group, Quaternion, Color, AxesHelper, Euler, MeshStandardMaterial } from 'three';
import { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { KinematicsHelper } from '../services/KinematicsHelper';

interface RobotModelProps {
    joints: number[]; // Target joints
    onTargetChange: (x: number, y: number, z: number, w: number, p: number, r: number) => void;
    onJointsChange: (j: number[]) => void;
    dhParameters: DhParameters | null;
    model: ArmKinematicModels;
    previewJoints?: number[] | null;
}

const degToRad = (deg: number) => deg * Math.PI / 180;
const radToDeg = (rad: number) => rad * 180 / Math.PI;

// Helper to provide access to groups for animation
export interface KinematicChainRef {
    setJoints: (joints: number[]) => void;
    getTcpRef: () => Group | null;
}

interface KinematicChainProps {
    model: ArmKinematicModels;
    dhParameters: DhParameters;
    visible?: boolean;
    isGhost?: boolean;
    ghostColor?: string;
    ghostOpacity?: number;
}

// Separate component for the robot structure logic
// Using forwardRef to allow parent to drive it imperatively (for high-perf loop)
const KinematicChain = forwardRef<KinematicChainRef, KinematicChainProps>(({ model, dhParameters, visible = true, isGhost = false, ghostColor = '#a0a0a0', ghostOpacity = 0.4 }, ref) => {
    const j1Ref = useRef<Group>(null);
    const j2Ref = useRef<Group>(null);
    const j3Ref = useRef<Group>(null);
    const j4Ref = useRef<Group>(null);
    const j5Ref = useRef<Group>(null);
    const j6Ref = useRef<Group>(null);
    const tcpRef = useRef<Group>(null);

    useImperativeHandle(ref, () => ({
        getTcpRef: () => tcpRef.current,
        setJoints: (joints: number[]) => {
            if (!visible) return; // Optimization: don't compute potentially expensive updates if not visible? Actually transforms are cheap, but let's keep it safe.
            const v = joints.map(degToRad);
            if (j1Ref.current) j1Ref.current.rotation.set(Math.PI / 2, v[0], 0);
            if (j2Ref.current) j2Ref.current.rotation.set(0, 0, -v[1]);
            if (j3Ref.current) j3Ref.current.rotation.set(0, 0, v[2] + v[1]);
            if (j4Ref.current) j4Ref.current.rotation.set(-v[3], 0, 0);
            if (j5Ref.current) j5Ref.current.rotation.set(0, 0, v[4]);
            if (j6Ref.current) j6Ref.current.rotation.set(-v[5], 0, 0);
        }
    }));

    // Determine GLB file based on model
    const modelName = model === ArmKinematicModels.CRX10iAL ? 'CRX-10iAL' : 'CRX-10iA';
    const glbPath = `/models/${modelName}_3D.glb`;
    const { nodes: gltfNodes } = useGLTF(glbPath) as unknown as { nodes: Record<string, Mesh> };

    // Part Renderer
    const Part = ({ name, parentWorldX = 0, parentWorldY = 0, parentWorldZ = 0 }: { name: string; parentWorldX?: number; parentWorldY?: number; parentWorldZ?: number }) => {
        if (!visible) return null;

        const nodeName = Object.keys(gltfNodes).find(key => key.startsWith(name));
        const node = nodeName ? gltfNodes[nodeName] : undefined;
        if (!node) return null;

        const sceneNode = node.clone();

        // Ghost Material Application
        if (isGhost) {
            sceneNode.traverse((child) => {
                if ((child as Mesh).isMesh) {
                    const mesh = child as Mesh;
                    // We clone the material so we don't affect other instances
                    // Ideally we should cache this material but for < 3 instances it's fine
                    mesh.material = new MeshStandardMaterial({
                        color: new Color(ghostColor),
                        transparent: true,
                        opacity: ghostOpacity,
                        roughness: 0.5,
                        metalness: 0.1
                    });
                }
            });
        }

        // Calc offsets (Standard Fanuc Model / GLB Logic)
        const nodeY = node.position.y * 1000;
        const nodeX = node.position.x * 1000;
        const nodeZ = node.position.z * 1000;
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

    const j2BaseName = Object.keys(gltfNodes).find(k => k.startsWith('J2ARM_UNIT'));
    const d1Node = j2BaseName ? gltfNodes[j2BaseName] : null;
    const d1 = d1Node ? d1Node.position.y * 1000 : 245;

    return (
        <group>
            {/* Base */}
            <group position={[0, 0, 0]}>
                <Part name="J1BASE_UNIT" />
                <Part name="CONNECTOR_UNIT" />
            </group>

            {/* Base Group Reference */}
            <group position={[0, d1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                {visible && !isGhost && <Axis />}

                {/* J1 */}
                <group ref={j1Ref}>
                    <Part name="J2BASE_UNIT" parentWorldY={d1} />

                    {/* J2 */}
                    <group ref={j2Ref}>
                        <Part name="J2ARM_UNIT" parentWorldY={d1} />

                        {/* J3 */}
                        <group ref={j3Ref} position={[0, dhParameters.a2, 0]}>
                            <Part name="J3CASING_UNIT" parentWorldY={dhParameters.a2 + d1} />

                            {/* J4 */}
                            <group ref={j4Ref} position={[0, 0, 0]}>
                                <Part name="J3ARM_UNIT" parentWorldY={dhParameters.a2 + d1} />
                                <Part name="NAME_LABEL_CRX_10iA" parentWorldY={dhParameters.a2 + d1} />

                                {/* J5 */}
                                <group ref={j5Ref} position={[-dhParameters.d4, 0, 0]}>
                                    <Part name="J5CASING_UNIT" parentWorldX={-dhParameters.d4} parentWorldY={dhParameters.a2 + d1} />

                                    {/* J6 */}
                                    <group ref={j6Ref} position={[0, 0, dhParameters.d5]}>
                                        <Part name="J6FLANGE_UNIT" parentWorldX={-dhParameters.d4} parentWorldY={dhParameters.a2 + d1} parentWorldZ={dhParameters.d5} />

                                        <group ref={tcpRef} position={[-dhParameters.d6, 0, 0]} rotation={[Math.PI / 2, Math.PI / 2, 0]} />
                                    </group>
                                </group>
                            </group>
                        </group>
                    </group>
                </group>
            </group>
        </group>
    );
});


// Visualize axes
const Axis = () => {
    const axesRef = useRef<AxesHelper>(null);
    useEffect(() => {
        if (axesRef.current) {
            axesRef.current.setColors(new Color('#9d4b4b'), new Color('#2f7f4f'), new Color('#3b5b9d'));
        }
    }, []);
    return <axesHelper ref={axesRef} args={[200]} />;
};

export default function RobotModel({ joints, onTargetChange, onJointsChange, dhParameters, model, previewJoints }: RobotModelProps) {
    void onTargetChange;

    const visualChainRef = useRef<KinematicChainRef>(null);
    const targetChainRef = useRef<KinematicChainRef>(null);
    const previewChainRef = useRef<KinematicChainRef>(null);

    const baseGroupRef = useRef<Group>(null);
    const targetRef = useRef<Group>(null);
    const pivotGroupRef = useRef<Group>(null);
    const isDraggingRef = useRef(false);

    // Current visual joints (interpolated)
    const visualJoints = useRef<number[]>([...joints]);

    // Track if visual is synced with target (to toggle ghost visibility)
    const [isSynced, setIsSynced] = useState(true);

    // UseFrame for Smooth Interpolation and Logic Sync
    useFrame((_, delta) => {
        if (!visualChainRef.current || !targetChainRef.current) return;

        // 0. Update Target Chain (Always instant)
        targetChainRef.current.setJoints(joints);

        // Update Preview Chain
        if (previewChainRef.current && previewJoints) {
            previewChainRef.current.setJoints(previewJoints);
        }

        // 1. Interpolate visual joints towards target `joints`
        const speed = 4.0;
        let moving = false;

        for (let i = 0; i < 6; i++) {
            const diff = joints[i] - visualJoints.current[i];
            if (Math.abs(diff) > 0.5) {
                // Interpolate
                visualJoints.current[i] += diff * Math.min(1, speed * delta);
                moving = true;
            } else {
                visualJoints.current[i] = joints[i];
            }
        }

        // Determine sync status for Ghost visibility
        // If we are moving, we are NOT synced.
        // We use state to trigger re-render of Ghost prop if needed.
        // BUT setting state in useFrame is DANGEROUS unless throttled or checked carefully.
        // Let's use a threshold.
        if (moving && isSynced) setIsSynced(false);
        if (!moving && !isSynced) setIsSynced(true);

        // Update Visual Chain
        visualChainRef.current.setJoints(visualJoints.current);

        // 2. Sync PivotControls with TARGET TCP
        const tcpTarget = targetChainRef.current.getTcpRef();

        if (tcpTarget && pivotGroupRef.current && !isDraggingRef.current) {
            const worldPos = new Vector3();
            const worldQuat = new Quaternion();

            tcpTarget.getWorldPosition(worldPos);
            tcpTarget.getWorldQuaternion(worldQuat);

            pivotGroupRef.current.position.copy(worldPos);
            pivotGroupRef.current.quaternion.copy(worldQuat);
        }
    });

    if (!dhParameters) {
        return null;
    }

    const [pivotKey, setPivotKey] = useState(0);

    return (

        <group>
            {/* 1. VISUAL ROBOT (Interpolated) */}
            <KinematicChain
                ref={visualChainRef}
                model={model}
                dhParameters={dhParameters!}
                visible={!!dhParameters}
            />

            {/* 2. TARGET ROBOT (Ghost - Moves Instantly) 
                Visible only when 'synced' is false (robot is moving towards target)
            */}
            <KinematicChain
                ref={targetChainRef}
                model={model}
                dhParameters={dhParameters!}
                visible={!!dhParameters && !isSynced}
                isGhost={true}
                ghostColor="#a0a0a0"
                ghostOpacity={0.25}
            />

            {/* 3. PREVIEW ROBOT (Ghost - Hover Preview) 
                Visible only when previewJoints is set
            */}
            {previewJoints && (
                <KinematicChain
                    ref={previewChainRef}
                    model={model}
                    dhParameters={dhParameters!}
                    visible={!!dhParameters}
                    isGhost={true}
                    ghostColor="#4fc3f7"
                    ghostOpacity={0.4}
                />
            )}

            {/* Pivot Controls - Attached to the TARGET (Invisible most of the time) */}
            <group ref={pivotGroupRef}>
                <PivotControls
                    key={pivotKey}
                    scale={100}

                    disableRotations={false}
                    activeAxes={[true, true, true]} // XYZ translations
                    disableScaling={true}
                    axisColors={['#9d4b4b', '#2f7f4f', '#3b5b9d']}
                    onDragStart={() => isDraggingRef.current = true}
                    onDragEnd={async () => {
                        try {
                            if (!baseGroupRef.current || !targetRef.current) {
                                isDraggingRef.current = false;
                                setPivotKey((k: number) => k + 1);
                                return;
                            }

                            // 1. Get new World Position/Rotation from the targetRef
                            const worldPos = new Vector3();
                            const worldQuat = new Quaternion();
                            targetRef.current.getWorldPosition(worldPos);
                            targetRef.current.getWorldQuaternion(worldQuat);

                            // 2. Reset targetRef local coords IMMEDIATELY
                            targetRef.current.position.set(0, 0, 0);
                            targetRef.current.rotation.set(0, 0, 0);
                            targetRef.current.scale.set(1, 1, 1);
                            targetRef.current.updateMatrix();

                            // 3. Enable sync & Refresh PivotControls (Key Reset)
                            isDraggingRef.current = false;
                            setPivotKey((k: number) => k + 1);

                            // 4. Convert to Base Frame
                            const localPos = baseGroupRef.current.worldToLocal(worldPos.clone());
                            const baseQuat = new Quaternion();
                            baseGroupRef.current.getWorldQuaternion(baseQuat);
                            const localQuat = baseQuat.invert().multiply(worldQuat);

                            const euler = new Euler().setFromQuaternion(localQuat, 'ZYX');

                            const w = radToDeg(euler.x);
                            const p = radToDeg(euler.y);
                            const r = radToDeg(euler.z);

                            console.log(`Goal: X=${localPos.x.toFixed(1)}, Y=${localPos.y.toFixed(1)}, Z=${localPos.z.toFixed(1)}`);

                            // 5. Solve IK
                            let best = await KinematicsHelper.findBestJoints(
                                { x: localPos.x, y: localPos.y, z: localPos.z, w, p, r },
                                visualJoints.current,
                                model
                            );

                            if (!best) {
                                console.warn("No local solution, trying global search...");
                                const solutions = await KinematicsHelper.getSolutionsWithConfigs({ x: localPos.x, y: localPos.y, z: localPos.z, w, p, r }, model);
                                if (solutions.length > 0) {
                                    best = solutions[0].joints;
                                }
                            }

                            if (best) {
                                onJointsChange(best);
                            } else {
                                console.error("Position unreachable / No IK solution");
                            }
                        } catch (e) {
                            console.error("Error in onDragEnd:", e);
                            isDraggingRef.current = false;
                            setPivotKey((k: number) => k + 1);
                        }
                    }}
                >
                    {/* This is the invisible target frame we attach the gizmo to */}
                    <group ref={targetRef} />
                </PivotControls>
            </group>

            {/* Virtual Base Frame for Calculations */}
            <group ref={baseGroupRef} position={[0, 245, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                {/* This group is invisible, just used for Matrix Math relative to the IK Frame */}
            </group>

        </group>
    );
}

useGLTF.preload('/models/CRX-10iA_3D.glb');
useGLTF.preload('/models/CRX-10iAL_3D.glb');
