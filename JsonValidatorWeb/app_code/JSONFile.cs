using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace JSONWebValidator.Models
{
    public class JSONFile
    {
        [JsonProperty, JsonConverter(typeof(StringEnumConverter))]
        public JSONFileKind? Kind { get; set; }

        [JsonProperty]
        public string Value { get; set; }
    }
}