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
}

export default function Scene({ joints, onJointsChange, model, dhParameters }: SceneProps) {
    return (
        <Canvas>
            <OrthographicCamera makeDefault position={[1000, 1000, 1000]} zoom={0.5} near={-2000} far={10000} />

            <color attach="background" args={['#202020']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[1000, 2000, 1000]} intensity={1} />

            <RobotModel
                joints={joints}
                onJointsChange={onJointsChange}
                onTargetChange={() => { }}
                dhParameters={dhParameters}
                model={model}
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

            <GizmoHelper alignment="bottom-right" margin={[40, 40]} renderPriority={1}>
                <GizmoViewport axisColors={['#9d4b4b', '#2f7f4f', '#3b5b9d']} labelColor="white" />
            </GizmoHelper>
        </Canvas>
    );
}
