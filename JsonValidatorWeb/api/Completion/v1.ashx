<%@ WebHandler Language="C#" Class="v1" %>

using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Web;
using JSONWebValidator.Models;
using Microsoft.JSON.Core.Schema;
using Microsoft.JSON.Core.Schema.Validation.Format;
using Newtonsoft.Json;
using StandaloneJsonValidator;

public class v1 : IHttpHandler
{

    private static readonly int[] AcceptedVersions = { 4 };

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
        JSONCompletionRequest request = JsonConvert.DeserializeObject<JSONCompletionRequest>(requestString);

        if (request == null)
        {
            var example = new JSONCompletionRequest();
            var exampleSerialized = JsonConvert.SerializeObject(example);
            context.WriteResponse(new ApiError { Message = "Please supply an input of the form " + exampleSerialized }, HttpStatusCode.BadRequest);
            return;
        }

        IEnumerable<JSONOption> options;

        switch (request.Instance.Kind)
        {
            case JSONFileKind.Uri:
                Uri instanceUri = new Uri(request.Instance.Value, UriKind.Absolute);
                if (request.Schema == null)
                {
                    options = JsonCompletionOptionProvider.GetCompletionOptions(instanceUri, (string)null, FormatHandlers, request.CursorPosition);
                    break;
                }

                switch (request.Schema.Kind)
                {
                    case JSONFileKind.Uri:
                        options = JsonCompletionOptionProvider.GetCompletionOptions(instanceUri, new Uri(request.Schema.Value, UriKind.Absolute), FormatHandlers, request.CursorPosition);
                        break;
                    default:
                        options = JsonCompletionOptionProvider.GetCompletionOptions(instanceUri, request.Schema.Value, FormatHandlers, request.CursorPosition);
                        break;
                }
                break;
            case JSONFileKind.Text:
                if (request.Schema == null)
                {
                    options = JsonCompletionOptionProvider.GetCompletionOptions(request.Instance.Value, (string)null, FormatHandlers, request.CursorPosition);
                    break;
                }

                switch (request.Schema.Kind)
                {
                    case JSONFileKind.Uri:
                        options = JsonCompletionOptionProvider.GetCompletionOptions(request.Instance.Value, new Uri(request.Schema.Value, UriKind.Absolute), FormatHandlers, request.CursorPosition);
                        break;
                    default:
                        options = JsonCompletionOptionProvider.GetCompletionOptions(request.Instance.Value, request.Schema.Value, FormatHandlers, request.CursorPosition);
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

        var response = new JSONCompletionResponse();

        var results = options.Select(x => new JSONCompletionOption
        {
            InsertionText = x.InsertionText,
            DisplayText = x.DisplayText,
            Type = x.Type
        }).ToList();

        response.Options = results;

        context.WriteResponse(response, HttpStatusCode.OK);
    }

    private static readonly IEnumerable<IJSONSchemaFormatHandler> FormatHandlers = new IJSONSchemaFormatHandler[] { new DateTimeValidator(), new EmailValidator(), new HostNameValidator(), new InternetProtocolAddressV4Validator(), new InternetProtocolAddressV6Validator(), new RegexValidator(), new UriValidator(), new UrlValidator() };

    public bool IsReusable
    {
        get
        {
            return true;
        }
    }
}