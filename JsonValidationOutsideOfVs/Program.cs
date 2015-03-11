using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using StandaloneJsonValidator;

namespace JsonValidationOutsideOfVs
{
    class Program
    {
        static void Main(string[] args)
        {
            string requestText = @"{
    ""Instance"": {
        ""Kind"": ""Text"",
        ""Value"": ""{ }""
    },
    ""Schema"": {
        ""Kind"": ""Text"",
        ""Value"": ""{ \""required\"": [ \""Foo\"" ] }""
    }
}";

            WebRequest request = WebRequest.CreateHttp("http://localhost:20700/Validator.ashx");
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
