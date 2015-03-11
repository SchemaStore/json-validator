using Newtonsoft.Json;

namespace JSONWebValidator.Models
{
    public class JSONFile
    {
        [JsonProperty]
        public JSONFileKind Kind { get; set; }

        [JsonProperty]
        public string Value { get; set; }
    }
}