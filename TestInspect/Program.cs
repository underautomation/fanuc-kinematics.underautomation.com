using System;
using System.IO;
using System.Linq;
using System.Reflection;
using UnderAutomation.Fanuc;

class Program
{
    static void Main()
    {
        try 
        {
            var asm = Assembly.Load("UnderAutomation.Fanuc");
            
            var dhType = asm.GetType("UnderAutomation.Fanuc.Kinematics.DhParameters");
            if (dhType != null)
            {
                var ctors = dhType.GetConstructors().Select(c => "DhParameters(" + string.Join(", ", c.GetParameters().Select(p => p.ParameterType.Name)) + ")");
                File.AppendAllLines("dh_info.txt", ctors);
            }

            var crxType = asm.GetType("UnderAutomation.Fanuc.Kinematics.Crx10iaLDhmParameters");
            if (crxType != null)
            {
                var members = crxType.GetMembers().Select(m => m.Name);
                File.AppendAllLines("dh_info.txt", members);
            }
        }
        catch(Exception ex) { File.WriteAllText("dh_info.txt", ex.ToString()); }
    }
}
