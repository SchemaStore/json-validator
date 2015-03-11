using Newtonsoft.Json;

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
    }
}