using Newtonsoft.Json;

namespace JSONWebValidator.Models
{
    public class ApiError
    {
        [JsonProperty]
        public string Message { get; set; }
    }
}