using System.Collections.Generic;

namespace StandaloneJsonValidator
{
    public class ValidationResult
    {
        public IEnumerable<JSONError> Errors { get; set; }

        public string InstanceDocumentText { get; set; }

        public string SchemaText { get; set; }
    }
}
