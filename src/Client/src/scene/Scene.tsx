import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
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
    void onJointsChange; // Silence unused variable warning
    void model;
    return (
        <Canvas camera={{ position: [1500, 1500, 1500], fov: 45, near: 10, far: 10000 }}>
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
            <Grid infiniteGrid sectionColor="#6f6f6f" cellColor="#404040" sectionSize={500} cellSize={100} />
            <Environment preset="city" />
        </Canvas>
    );
}
