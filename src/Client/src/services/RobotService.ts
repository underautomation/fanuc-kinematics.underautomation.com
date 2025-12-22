declare global {
    interface Window {
        Blazor: any;
        DotNet: any;
    }
}

export type Joints = [number, number, number, number, number, number];

export const WristFlip = { Unknown: 0, Flip: 1, NoFlip: 2 } as const;
export type WristFlip = typeof WristFlip[keyof typeof WristFlip];

export const ArmUpDown = { Unknown: 0, Up: 1, Down: 2 } as const;
export type ArmUpDown = typeof ArmUpDown[keyof typeof ArmUpDown];

export const ArmLeftRight = { Unknown: 0, Left: 1, Right: 2 } as const;
export type ArmLeftRight = typeof ArmLeftRight[keyof typeof ArmLeftRight];

export const ArmFrontBack = { Unknown: 0, Front: 1, Back: 2 } as const;
export type ArmFrontBack = typeof ArmFrontBack[keyof typeof ArmFrontBack];

export interface Configuration {
    wristFlip: WristFlip;
    armUpDown: ArmUpDown;
    armLeftRight: ArmLeftRight;
    armFrontBack: ArmFrontBack;
    turnAxis4: number;
    turnAxis5: number;
    turnAxis6: number;
    configString: string;
}

export interface FkResult {
    x: number;
    y: number;
    z: number;
    w: number;
    p: number;
    r: number;
    configuration: Configuration;
}

export class RobotService {
    private static initPromise: Promise<void> | null = null;
    private static isInitialized = false;

    static async init() {
        if (this.isInitialized) return;
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            console.log("Initializing Blazor...");
            if (!window.Blazor) {
                throw new Error("Blazor script not loaded");
            }

            // Check if Blazor is already running (e.g. autostarted)
            // There isn't a standard public property for "started", but if we re-enter we catch the error.
            try {
                await window.Blazor.start();
            } catch (e: any) {
                if (e?.message && e.message.includes("Blazor has already started")) {
                    console.log("Blazor was already started.");
                } else {
                    throw e;
                }
            }
            this.isInitialized = true;
            console.log("Blazor initialized");
        })();

        return this.initPromise;
    }

    static async calculateIK(x: number, y: number, z: number, w: number, p: number, r: number): Promise<Joints[]> {
        if (!this.isInitialized) {
            console.warn("Blazor not initialized yet");
            throw new Error("Blazor not initialized");
        }

        try {
            console.log(`Call IK: X=${x}, Y=${y}, Z=${z}, W=${w}, P=${p}, R=${r}`);
            const result = await window.DotNet.invokeMethodAsync('RobotLogic', 'CalculateInverseKinematics', x, y, z, w, p, r);
            console.log("IK Result:", result);
            return result as Joints[];
        } catch (e) {
            console.error("IK Error", e);
            return [];
        }
    }

    static async calculateFK(joints: number[]): Promise<FkResult | null> {
        if (!this.isInitialized) return null;
        try {
            const result = await window.DotNet.invokeMethodAsync('RobotLogic', 'CalculateForwardKinematics', ...joints);
            return result as FkResult;
        } catch (e) {
            console.error("FK Error", e);
            return null;
        }
    }
}
