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
    public static DhParameters GetDhParameters(ArmKinematicModels model)
    {
        return DhParameters.FromArmKinematicModel(model);
    }

    [JSInvokable]
    public static double[][] CalculateInverseKinematics(double x, double y, double z, double w, double p, double r,
        ArmKinematicModels model)
    {
        try
        {
            var dhParameters = DhParameters.FromArmKinematicModel(model);

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
            var solutions = KinematicsUtils.InverseKinematics(target, dhParameters);

            if (solutions != null && solutions.Length > 0)
            {
                var result = new double[solutions.Length][];
                for (int i = 0; i < solutions.Length; i++)
                {
                    var sol = solutions[i];
                    result[i] = new double[] { sol.J1, sol.J2, sol.J3, sol.J4, sol.J5, sol.J6 };
                }

                return result;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in IK: {ex.Message}");
        }

        // Return empty array if no solution or error
        return Array.Empty<double[]>();
    }

    [JSInvokable]
    public static FkResult? CalculateForwardKinematics(double j1, double j2, double j3, double j4, double j5, double j6,
        ArmKinematicModels model)
    {
        try
        {
            var dhParameters = DhParameters.FromArmKinematicModel(model);

            var joints = new JointsPosition(j1, j2, j3, j4, j5, j6);
            var cartesian = KinematicsUtils.ForwardKinematics(joints, dhParameters);

            if (cartesian != null)
            {
                return new FkResult
                {
                    X = cartesian.X,
                    Y = cartesian.Y,
                    Z = cartesian.Z,
                    W = cartesian.W,
                    P = cartesian.P,
                    R = cartesian.R,
                    Configuration = new Configuration
                    {
                        WristFlip = (WristFlip)cartesian.Configuration.WristFlip,
                        ArmUpDown = (ArmUpDown)cartesian.Configuration.ArmUpDown,
                        ArmLeftRight = (ArmLeftRight)cartesian.Configuration.ArmLeftRight,
                        ArmFrontBack = (ArmFrontBack)cartesian.Configuration.ArmFrontBack,
                        TurnAxis4 = cartesian.Configuration.TurnAxis4,
                        TurnAxis5 = cartesian.Configuration.TurnAxis5,
                        TurnAxis6 = cartesian.Configuration.TurnAxis6,
                        ConfigString = cartesian.Configuration.ToString()
                    }
                };
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in FK: {ex.Message}");
        }

        return null;
    }

    [JSInvokable]
    public static void Prewarm()
    {
        // Force initialization of library structures
        try
        {
            if (_dhParameters == null) _dhParameters = new DhParameters(new Crx10iaLDhmParameters());
            var joints = new JointsPosition(0, 0, 0, 0, 0, 0);
            KinematicsUtils.ForwardKinematics(joints, _dhParameters);
        }
        catch
        {
        }
    }
}

public class FkResult
{
    public double X { get; set; }
    public double Y { get; set; }
    public double Z { get; set; }
    public double W { get; set; }
    public double P { get; set; }
    public double R { get; set; }
    public Configuration Configuration { get; set; }
}

public class Configuration
{
    public WristFlip WristFlip { get; set; }
    public ArmUpDown ArmUpDown { get; set; }
    public ArmLeftRight ArmLeftRight { get; set; }
    public ArmFrontBack ArmFrontBack { get; set; }
    public int TurnAxis4 { get; set; }
    public int TurnAxis5 { get; set; }
    public int TurnAxis6 { get; set; }
    public string ConfigString { get; set; }
}

public enum WristFlip
{
    Unknown,
    Flip,
    NoFlip,
}

public enum ArmUpDown
{
    Unknown,
    Up,
    Down,
}

public enum ArmLeftRight
{
    Unknown,
    Left,
    Right,
}

public enum ArmFrontBack
{
    Unknown,
    Front,
    Back,
}
