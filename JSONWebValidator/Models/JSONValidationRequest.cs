using Newtonsoft.Json;

namespace JSONWebValidator.Models
{
    public class JSONValidationRequest
    {
        [JsonProperty]
        public JSONFile Instance { get; set; }

        [JsonProperty]
        public JSONFile Schema { get; set; }
    }
}