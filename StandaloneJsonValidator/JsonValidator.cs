using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using Microsoft.JSON.Core.Parser;
using Microsoft.JSON.Core.Parser.TreeItems;
using Microsoft.JSON.Core.Schema;
using Microsoft.JSON.Core.Schema.Drafts.Draft4;

namespace StandaloneJsonValidator
{
    public static class JsonValidator
    {
        public static bool Validate(StringWithFileNameTextProvider instanceTextProvider, StringWithFileNameTextProvider schemaTextProvider)
        {
            return !Validate(instanceTextProvider, schemaTextProvider, Enumerable.Empty<IJSONSchemaFormatHandler>()).Any();
        }

        public static IEnumerable<JSONSchemaValidationIssue> Validate(StringWithFileNameTextProvider instanceTextProvider, StringWithFileNameTextProvider schemaTextProvider, IEnumerable<IJSONSchemaFormatHandler> formatHandlers)
        {
            JSONDocumentLoader loader = new JSONDocumentLoader();
            JSONParser parser = JSONParserHack.Create();
            JSONDocument schemaDoc = parser.Parse(schemaTextProvider);
            JSONDocument instanceDoc = parser.Parse(instanceTextProvider);

            loader.SetCacheItem(new JSONDocumentLoadResult(schemaDoc));
            loader.SetCacheItem(new JSONDocumentLoadResult(instanceDoc));

            JSONSchemaDraft4EvaluationTreeNode tree = JSONSchemaDraft4EvaluationTreeProducer.CreateEvaluationTreeAsync(instanceDoc.TopLevelValue, (JSONObject)schemaDoc.TopLevelValue, loader, formatHandlers).Result;
            return tree.ValidationIssues;
        }

        public static IEnumerable<JSONSchemaValidationIssue> Validate(string instanceText, string schemaText, IEnumerable<IJSONSchemaFormatHandler> formatHandlers)
        {
            StringWithFileNameTextProvider instanceProvider = new StringWithFileNameTextProvider(@"c:\temp\instance.json", instanceText);
            StringWithFileNameTextProvider schemaProvider = new StringWithFileNameTextProvider(@"c:\temp\schema.json", schemaText);
            return Validate(instanceProvider, schemaProvider, formatHandlers);
        }

        private static string Download(Uri location)
        {
            HttpWebRequest request = WebRequest.CreateHttp(location);
            using (WebResponse response = request.GetResponse())
            using (Stream stream = response.GetResponseStream())
            using (StreamReader reader = new StreamReader(stream, Encoding.UTF8, true, 8192, true))
            {
                return reader.ReadToEnd();
            }
        }

        public static IEnumerable<JSONSchemaValidationIssue> Validate(string instanceText, Uri schemaLocation, IEnumerable<IJSONSchemaFormatHandler> formatHandlers)
        {
            StringWithFileNameTextProvider instanceProvider = new StringWithFileNameTextProvider(@"c:\temp\instance.json", instanceText);

            StringWithFileNameTextProvider schemaProvider = null;

            if (schemaLocation != null)
            {
                string schemaText = Download(schemaLocation);
                schemaProvider = new StringWithFileNameTextProvider(schemaLocation.ToString(), schemaText);
            }

            return Validate(instanceProvider, schemaProvider, formatHandlers);
        }

        public static IEnumerable<JSONSchemaValidationIssue> Validate(Uri instanceLocation, string schemaText, IEnumerable<IJSONSchemaFormatHandler> formatHandlers)
        {
            string instanceText = Download(instanceLocation);
            StringWithFileNameTextProvider instanceProvider = new StringWithFileNameTextProvider(instanceLocation.ToString(), instanceText);


            StringWithFileNameTextProvider schemaProvider = null;

            if (schemaText != null)
            {
                schemaProvider = new StringWithFileNameTextProvider(@"c:\temp\schema.json", schemaText);
            }

            return Validate(instanceProvider, schemaProvider, formatHandlers);
        }

        public static IEnumerable<JSONSchemaValidationIssue> Validate(Uri instanceLocation, Uri schemaLocation, IEnumerable<IJSONSchemaFormatHandler> formatHandlers)
        {
            string instanceText = Download(instanceLocation);
            StringWithFileNameTextProvider instanceProvider = new StringWithFileNameTextProvider(instanceLocation.ToString(), instanceText);
            StringWithFileNameTextProvider schemaProvider = null;

            if (schemaLocation != null)
            {
                string schemaText = Download(schemaLocation);
                schemaProvider = new StringWithFileNameTextProvider(schemaLocation.ToString(), schemaText);
            }

            return Validate(instanceProvider, schemaProvider, formatHandlers);
        }
    }
}
