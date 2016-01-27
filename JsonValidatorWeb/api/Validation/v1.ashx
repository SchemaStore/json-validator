<%@ WebHandler Language="C#" Class="v1" %>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using JSONWebValidator.Models;
using Microsoft.JSON.Core.Schema;
using Microsoft.JSON.Core.Schema.Validation.Format;
using Newtonsoft.Json;
using StandaloneJsonValidator;

public class v1 : IHttpAsyncHandler
{
    private static readonly int[] AcceptedVersions = { 4 };

    public void ProcessRequest(HttpContext context)
    {
        throw new InvalidOperationException();
    }

    private static readonly IEnumerable<IJSONSchemaFormatHandler> FormatHandlers = new IJSONSchemaFormatHandler[] { new DateTimeValidator(), new EmailValidator(), new HostNameValidator(), new InternetProtocolAddressV4Validator(), new InternetProtocolAddressV6Validator(), new RegexValidator(), new UriValidator(), new UrlValidator() };

    public bool IsReusable
    {
        get
        {
            return true;
        }
    }

    public IAsyncResult BeginProcessRequest(HttpContext context, AsyncCallback cb, object extraData)
    {
        Task processingTask = ProcessAsync(context);
        processingTask.ContinueWith(x => cb(processingTask));
        return processingTask;
    }

    private static async Task ProcessAsync(HttpContext context)
    {
        if (!string.Equals(context.Request.HttpMethod, "POST", StringComparison.OrdinalIgnoreCase))
        {
            context.WriteResponse(new ApiError { Message = "Requests to this API must be POSTs" }, HttpStatusCode.MethodNotAllowed);
            return;
        }

        byte[] requestBody = context.Request.BinaryRead(context.Request.ContentLength);
        string requestString = Encoding.UTF8.GetString(requestBody);
        requestString = requestString.Substring(requestString.IndexOf('{'));
        JSONValidationRequest request = JsonConvert.DeserializeObject<JSONValidationRequest>(requestString);

        if (request == null)
        {
            var example = new JSONValidationRequest();
            var exampleSerialized = JsonConvert.SerializeObject(example);
            context.WriteResponse(new ApiError { Message = "Please supply an input of the form " + exampleSerialized }, HttpStatusCode.BadRequest);
            return;
        }

        if (request.Instance.Kind == null || request.Schema.Kind == null)
        {
            context.WriteResponse(new ApiError { Message = "One or both input kinds were not set. Valid values are : Uri, Text" }, HttpStatusCode.BadRequest);
            return;
        }

        if (request.Instance == null)
        {
            if (request.Schema == null)
            {
                context.WriteResponse(new ApiError { Message = "Please supply an instance document or specify a schema and the schema version to validate with in the \"version\" query string parameter. Valid values for this parameter are: " + string.Join(", ", AcceptedVersions) }, HttpStatusCode.BadRequest);
                return;
            }

            var specVersion = context.Request.QueryString["version"];
            int version;

            if (specVersion == null || !int.TryParse(specVersion, out version) || !AcceptedVersions.Contains(version))
            {
                context.WriteResponse(new ApiError { Message = "Please supply an instance document or specify the schema version to validate with in the \"version\" query string parameter. Valid values for this parameter are: " + string.Join(", ", AcceptedVersions) }, HttpStatusCode.BadRequest);
                return;
            }

            request.Instance = request.Schema;
            request.Schema = new JSONFile
            {
                Kind = JSONFileKind.Uri,
                Value = string.Format("http://json-schema.org/draft-{0}/schema#", version.ToString().PadLeft(2, '0'))
            };
        }

        ValidationResult issues;

        switch (request.Instance.Kind)
        {
            case JSONFileKind.Uri:
                Uri instanceUri = new Uri(request.Instance.Value, UriKind.Absolute);
                if (request.Schema == null)
                {
                    issues = await JsonValidator.ValidateAsync(instanceUri, (string)null, FormatHandlers);
                    break;
                }

                switch (request.Schema.Kind)
                {
                    case JSONFileKind.Uri:
                        issues = await JsonValidator.ValidateAsync(instanceUri, new Uri(request.Schema.Value, UriKind.Absolute), FormatHandlers);
                        break;
                    default:
                        issues = await JsonValidator.ValidateAsync(instanceUri, request.Schema.Value, FormatHandlers);
                        break;
                }
                break;
            case JSONFileKind.Text:
                if (request.Schema == null)
                {
                    issues = await JsonValidator.ValidateAsync(request.Instance.Value, (string)null, FormatHandlers);
                    break;
                }

                switch (request.Schema.Kind)
                {
                    case JSONFileKind.Uri:
                        issues = await JsonValidator.ValidateAsync(request.Instance.Value, new Uri(request.Schema.Value, UriKind.Absolute), FormatHandlers);
                        break;
                    default:
                        issues = await JsonValidator.ValidateAsync(request.Instance.Value, request.Schema.Value, FormatHandlers);
                        break;
                }
                break;
            default:
                context.WriteResponse(new ApiError
                {
                    Message = "Please supply a valid instance document kind - valid values are \"Uri\" and \"Text\""
                }, HttpStatusCode.BadRequest);
                return;
        }

        var response = new JSONValidationResponse
        {
            SchemaText = issues.SchemaText,
            InstanceDocumentText = issues.InstanceDocumentText
        };

        var results = issues.Errors.Select(x => new JSONValidationError
        {
            Message = x.Message,
            Start = x.Start,
            Length = x.Length,
            Kind = x.Kind,
            Location = x.Location,
        }).ToList();

        response.Errors = results;

        context.WriteResponse(response, HttpStatusCode.OK);
    }

    public void EndProcessRequest(IAsyncResult result)
    {
    }
}