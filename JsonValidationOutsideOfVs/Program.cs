using System;
using System.IO;
using System.Net;
using System.Text;

namespace JsonValidationOutsideOfVs
{
    class Program
    {
        static void Main(string[] args)
        {
            string requestText = @"{
    ""Instance"": {
        ""Kind"": ""Text"",
        ""Value"": ""{ \""f\"": 3 }""
    },
    ""Schema"": {
        ""Kind"": ""Text"",
        ""Value"": ""{ \""required\"": [ \""Foo\"" ] }""
    }
}";

            WebRequest request = WebRequest.CreateHttp("http://jsonvalidator.schemastore.org/api/Validation/v1.ashx?version=4");
            request.Method = "POST";
            var requestStream = request.GetRequestStream();
            var writer = new StreamWriter(requestStream, Encoding.UTF8);
            writer.Write(requestText);
            writer.Flush();
            var response = request.GetResponse();
            var responseStream = response.GetResponseStream();
            var reader = new StreamReader(responseStream);
            var responseText = reader.ReadToEnd();
            Console.WriteLine(responseText);
            Console.ReadLine();
        }
    }
}
