using System.Collections.Generic;
using Newtonsoft.Json;

namespace JSONWebValidator.Models
{
    public class JSONCompletionResponse
    {
        [JsonProperty]
        public int ReplacementStart { get; set; }

        [JsonProperty]
        public int ReplacementLength { get; set; }

        [JsonProperty]
        public List<JSONCompletionOption> Options { get; set; }
    }

    public class JSONCompletionOption
    {
        [JsonProperty]
        public string DisplayText { get; set; }

        [JsonProperty]
        public string Type { get; set; }

        [JsonProperty]
        public string InsertionText { get; set; }
    }
}