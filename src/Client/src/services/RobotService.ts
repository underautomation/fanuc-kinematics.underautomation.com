declare global {
    interface Window {
        Blazor: any;
        DotNet: any;
    }
}

export type Joints = [number, number, number, number, number, number];

export class RobotService {
    private static isInitialized = false;

    static async init() {
        if (this.isInitialized) return;

        console.log("Initializing Blazor...");
        if (!window.Blazor) {
            throw new Error("Blazor script not loaded");
        }

        await window.Blazor.start();
        this.isInitialized = true;
        console.log("Blazor initialized");
    }

    static async calculateIK(x: number, y: number, z: number, w: number, p: number, r: number): Promise<Joints> {
        if (!this.isInitialized) {
            console.warn("Blazor not initialized yet");
            throw new Error("Blazor not initialized");
        }

        try {
            console.log(`Call IK: X=${x}, Y=${y}, Z=${z}, W=${w}, P=${p}, R=${r}`);
            const result = await window.DotNet.invokeMethodAsync('RobotLogic', 'CalculateInverseKinematics', x, y, z, w, p, r);
            console.log("IK Result:", result);
            return result as Joints;
        } catch (e) {
            console.error("IK Error", e);
            return [0, 0, 0, 0, 0, 0];
        }
    }

    static async calculateFK(joints: number[]): Promise<[number, number, number, number, number, number]> {
        if (!this.isInitialized) return [0, 0, 0, 0, 0, 0];
        try {
            const result = await window.DotNet.invokeMethodAsync('RobotLogic', 'CalculateForwardKinematics', ...joints);
            return result as [number, number, number, number, number, number];
        } catch (e) {
            console.error("FK Error", e);
            return [0, 0, 0, 0, 0, 0];
        }
    }
}
