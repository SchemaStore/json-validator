using System.Collections.Generic;
using Newtonsoft.Json;

namespace JSONWebValidator.Models
{
    public class JSONValidationResponse
    {
        [JsonProperty]
        public List<JSONValidationError> Errors { get; set; }

        [JsonProperty]
        public string InstanceDocumentText { get; set; }

        [JsonProperty]
        public string SchemaText { get; set; }
    }
}