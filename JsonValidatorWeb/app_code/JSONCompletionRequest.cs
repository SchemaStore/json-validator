using Newtonsoft.Json;

namespace JSONWebValidator.Models
{
    public class JSONCompletionRequest
    {
        [JsonProperty]
        public int CursorPosition { get; set; }

        [JsonProperty]
        public JSONFile Instance { get; set; }

        [JsonProperty]
        public JSONFile Schema { get; set; }
    }
}