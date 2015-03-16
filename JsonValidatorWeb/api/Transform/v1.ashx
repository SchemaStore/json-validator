<%@ WebHandler Language="C#" Class="v1" %>

using System;
using System.Net;
using System.Text;
using System.Web;
using JsonTransform.Core;
using JSONWebValidator.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using StandaloneJsonValidator;

public class v1 : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
        {
            context.WriteResponse(new ApiError { Message = "Requests to this API must be POSTs" }, HttpStatusCode.MethodNotAllowed);
            return;
        }

        byte[] requestBody = context.Request.BinaryRead(context.Request.ContentLength);
        string requestString = Encoding.UTF8.GetString(requestBody);
        requestString = requestString.Substring(requestString.IndexOf('{'));
        JSONTransformRequest request = JsonConvert.DeserializeObject<JSONTransformRequest>(requestString);

        if (request == null || request.SourceDocument == null)
        {
            var example = new JSONTransformRequest();
            var exampleSerialized = JsonConvert.SerializeObject(example);
            context.WriteResponse(new ApiError { Message = "Please supply an input of the form " + exampleSerialized }, HttpStatusCode.BadRequest);
            return;
        }

        JToken sourceFile;
        string sourceFileText = request.SourceDocument.Value;

        if(request.SourceDocument.Kind == JSONFileKind.Uri)
        {
            sourceFileText = JsonValidator.Download(new Uri(request.SourceDocument.Value, UriKind.Absolute));
        }

        sourceFile = JToken.Parse(sourceFileText);

        if (request.TransformDocument == null)
        {
            context.WriteResponse(sourceFileText, HttpStatusCode.OK);
            return;
        }

        string transformFileText = request.TransformDocument.Value;

        if(request.TransformDocument.Kind == JSONFileKind.Uri)
        {
            transformFileText = JsonValidator.Download(new Uri(request.TransformDocument.Value, UriKind.Absolute));
        }

        var transform = request.TransformKind == TransformKind.Patch ? PatchDocument.Load(transformFileText) : CompositeTransform.Load(transformFileText);

        transform.Apply(ref sourceFile);
        var result = JsonConvert.SerializeObject(sourceFile);
        context.WriteResponse(result, HttpStatusCode.OK);
    }
    
    public bool IsReusable
    {
        get
        {
            return true;
        }
    }
}