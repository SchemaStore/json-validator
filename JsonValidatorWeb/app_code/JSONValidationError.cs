using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using StandaloneJsonValidator;

namespace JSONWebValidator.Models
{
    public class JSONValidationError
    {
        [JsonProperty]
        public string Message { get; set; }

        [JsonProperty]
        public int Length { get; set; }

        [JsonProperty]
        public int Start { get; set; }

        [JsonProperty, JsonConverter(typeof(StringEnumConverter))]
        public JSONErrorKind Kind { get; set; }

        [JsonProperty, JsonConverter(typeof(StringEnumConverter))]
        public JSONErrorLocation Location { get; set; }

        [JsonProperty]
        public string InstanceDocumentText { get; set; }

        [JsonProperty]
        public string SchemaText { get; set; }
    }
}