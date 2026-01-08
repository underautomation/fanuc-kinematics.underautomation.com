import { RobotService, ArmKinematicModels } from './RobotService';
import type { Joints, Configuration } from './RobotService';

export interface CartesianTarget {
    x: number;
    y: number;
    z: number;
    w: number;
    p: number;
    r: number;
}

export interface SolutionWithConfig {
    joints: Joints;
    configuration: Configuration;
    configString: string;
}

export class KinematicsHelper {

    /**
     * Calculates IK and returns the solution closest to the solutionJoints (usually the current robot position).
     */
    static async findBestJoints(
        target: CartesianTarget,
        currentJoints: number[],
        model: ArmKinematicModels
    ): Promise<Joints | null> {
        const solutions = await RobotService.calculateIK(
            target.x, target.y, target.z,
            target.w, target.p, target.r,
            model
        );

        if (solutions.length === 0) return null;

        let best = solutions[0];
        let minDist = Infinity;

        for (const sol of solutions) {
            let dist = 0;
            // Calculate Euclidean distance in joint space
            for (let i = 0; i < 6; i++) {
                dist += Math.pow(sol[i] - currentJoints[i], 2);
            }
            if (dist < minDist) {
                minDist = dist;
                best = sol;
            }
        }
        return best;
    }

    /**
     * Calculates IK and finds the FK configuration for each solution.
     */
    static async getSolutionsWithConfigs(
        target: CartesianTarget,
        model: ArmKinematicModels
    ): Promise<SolutionWithConfig[]> {
        const solutions = await RobotService.calculateIK(
            target.x, target.y, target.z,
            target.w, target.p, target.r,
            model
        );

        const results: SolutionWithConfig[] = [];

        // We can run these in parallel
        await Promise.all(solutions.map(async (sol) => {
            const fk = await RobotService.calculateFK(sol, model);
            if (fk && fk.configuration) {
                results.push({
                    joints: sol,
                    configuration: fk.configuration,
                    configString: fk.configuration.configString
                });
            }
        }));

        // Sort by some criteria if needed, or just return
        return results;
    }
}
