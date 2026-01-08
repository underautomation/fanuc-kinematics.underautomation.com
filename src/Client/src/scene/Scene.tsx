import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, OrthographicCamera, GizmoHelper, GizmoViewport } from '@react-three/drei';
import RobotModel from './RobotModel';
import { ArmKinematicModels } from '../services/RobotService';
import type { DhParameters } from '../services/RobotService';

interface SceneProps {
    joints: number[];
    onJointsChange: (j: number[]) => void;
    model: ArmKinematicModels;
    dhParameters: DhParameters | null;
    previewJoints?: number[] | null;
}

export default function Scene({ joints, onJointsChange, model, dhParameters, previewJoints }: SceneProps) {
    return (
        <Canvas>
            <OrthographicCamera makeDefault position={[1000, 1000, 1000]} zoom={0.5} near={-2000} far={10000} />

            <color attach="background" args={['#202020']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[1000, 2000, 1000]} intensity={100} />

            <RobotModel
                joints={joints}
                onJointsChange={onJointsChange}
                onTargetChange={() => { }}
                dhParameters={dhParameters}
                model={model}
                previewJoints={previewJoints}
            />

            <OrbitControls makeDefault enabled={true} />
            <Grid
                infiniteGrid
                sectionColor="#404040"
                cellColor="#252525"
                sectionSize={500}
                cellSize={100}
                fadeDistance={10000}
                position={[0, -0.1, 0]}
            />


            <Environment preset="city" />

            {/* 
                GizmoHelper:
                Default is Y-up.
                Robot is Z-up but rotated in World to align Robot-Z with World-Y.
                We want Gizmo to show 'Z' as Up.
                So we relabel Y as Z, and Z as Y (or similar).
                And set colors: Y (Up) should be Blue (Z color). Z (Depth) should be Green (Y color).
                We remove manual rotation of the Gizmo which was breaking camera clicks.
            */}
            <GizmoHelper alignment="bottom-right" margin={[40, 40]} renderPriority={1} >
                <GizmoViewport
                    axisColors={['#9d4b4b', '#3b5b9d', '#2f7f4f']} // Red (X), Blue (Y->Z), Green (Z->Y)
                    labelColor="white"
                    labels={['+X', '+Z', '-Y']} // Label Y axis as 'Z'
                />
            </GizmoHelper>
        </Canvas>
    );
}
