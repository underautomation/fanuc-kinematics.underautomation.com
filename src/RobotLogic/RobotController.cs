using System;
using System.Linq;
using Microsoft.JSInterop;
using UnderAutomation.Fanuc.Common;
using UnderAutomation.Fanuc.Kinematics;

namespace RobotLogic;

public class RobotController
{
    private static DhParameters? _dhParameters;

    [JSInvokable]
    public static double[] CalculateInverseKinematics(double x, double y, double z, double w, double p, double r)
    {
        try
        {
            if (_dhParameters == null)
            {
                // Initialize parameters for CRX-10iA/L
                _dhParameters = new DhParameters(new Crx10iaLDhmParameters());
            }

            // Create target position
            var target = new CartesianPosition();
            target.X = x;
            target.Y = y;
            target.Z = z;
            target.W = w;
            target.P = p;
            target.R = r;

            // Calculate Inverse Kinematics
            // Returns array of possible joint configurations
            var solutions = KinematicsUtils.InverseKinematics(target, _dhParameters);

            if (solutions != null && solutions.Length > 0)
            {
                // Select the optimal solution
                // Ideally, we choosing the one closest to current configuration
                // For now, pick the first one
                var sol = solutions[0];
                return new double[] { sol.J1, sol.J2, sol.J3, sol.J4, sol.J5, sol.J6 };
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in IK: {ex.Message}");
        }

        // Return zeros if no solution or error
        return new double[] { 0, 0, 0, 0, 0, 0 };
    }

    [JSInvokable]
    public static double[] CalculateForwardKinematics(double j1, double j2, double j3, double j4, double j5, double j6)
    {
        try
        {
            if (_dhParameters == null)
            {
                _dhParameters = new DhParameters(new Crx10iaLDhmParameters());
            }

            var joints = new JointsPosition(j1, j2, j3, j4, j5, j6);
            var cartesian = KinematicsUtils.ForwardKinematics(joints, _dhParameters);

            if (cartesian != null)
            {
                return new double[] { cartesian.X, cartesian.Y, cartesian.Z, cartesian.W, cartesian.P, cartesian.R };
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in FK: {ex.Message}");
        }

        return new double[] { 0, 0, 0, 0, 0, 0 };
    }
}
