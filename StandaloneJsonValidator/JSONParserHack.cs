using System.Reflection;
using Microsoft.JSON.Core.Parser;

namespace StandaloneJsonValidator
{
    public static class JSONParserHack
    {
        public static JSONParser Create()
        {
            var ctor = typeof (JSONParser).GetConstructors(BindingFlags.NonPublic | BindingFlags.Instance)[0];
            return (JSONParser) ctor.Invoke(new object[0]);
        }
    }
}
