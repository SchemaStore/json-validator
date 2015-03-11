using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace StandaloneJsonValidator
{
    public enum JSONErrorKind
    {
        Syntax,
        Validation
    }

    public enum JSONErrorLocation
    {
        InstanceDocument,
        Schema
    }

    public class JSONError
    {
        public JSONErrorLocation Location { get; set; }

        public JSONErrorKind Kind { get; set; }

        public string Message { get; set; }

        public int Start { get; set; }

        public int Length { get; set; }
    }
}
