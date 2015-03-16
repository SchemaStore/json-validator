using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace JSONWebValidator.Models
{
    /// <summary>
    /// Summary description for JSONTransformRequest
    /// </summary>
    public class JSONTransformRequest
    {
        [JsonProperty]
        public JSONFile SourceDocument { get; set; }

        [JsonProperty]
        public JSONFile TransformDocument { get; set; }

        [JsonProperty, JsonConverter(typeof(StringEnumConverter))]
        public TransformKind TransformKind { get; set; }
    }

    public enum TransformKind
    {
        Patch,
        Custom
    }
}