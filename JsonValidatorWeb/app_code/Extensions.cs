using System.Net;
using System.Text;
using System.Web;
using Newtonsoft.Json;

namespace JSONWebValidator.Models
{
    public static class Extensions
    {
        public static void WriteResponse<T>(this HttpContext context, T value, HttpStatusCode status)
        {
            var responseBody = JsonConvert.SerializeObject(value);
            context.Response.StatusCode = (int) status;
            context.Response.ContentType = "application/json";
            context.Response.ContentEncoding = Encoding.UTF8;
            context.Response.Write(responseBody);
        }
    }
}