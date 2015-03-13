using System;
using System.Collections.Generic;
using System.Reflection;
using Microsoft.JSON.Core.Parser;
using Microsoft.JSON.Core.Parser.TreeItems;
using Microsoft.JSON.Core.Schema;
using Microsoft.JSON.Core.Schema.Drafts.Draft4;

namespace StandaloneJsonValidator
{
    public static class JsonCompletionOptionProvider
    {
        public static IEnumerable<JSONOption> GetCompletionOptions(StringWithFileNameTextProvider instanceTextProvider, StringWithFileNameTextProvider schemaTextProvider, IEnumerable<IJSONSchemaFormatHandler> formatHandlers, int cursorPosition)
        {
            JSONDocumentLoader loader = new JSONDocumentLoader();
            JSONParser parser = JSONParserHack.Create();
            JSONDocument schemaDoc = parser.Parse(schemaTextProvider);
            JSONDocument instanceDoc = parser.Parse(instanceTextProvider);
            List<JSONOption> allOptions = new List<JSONOption>();

            loader.SetCacheItem(new JSONDocumentLoadResult(schemaDoc));
            loader.SetCacheItem(new JSONDocumentLoadResult(instanceDoc));

            JSONSchemaDraft4EvaluationTreeNode tree = JSONSchemaDraft4EvaluationTreeProducer.CreateEvaluationTreeAsync(instanceDoc.TopLevelValue, (JSONObject)schemaDoc.TopLevelValue, loader, formatHandlers).Result;
            var parseItem = instanceDoc.ItemBeforePosition(cursorPosition);

            var convertToReportMethod = typeof (JSONSchemaDraft4Evaluator).GetMethod("ConvertToReport", BindingFlags.Static | BindingFlags.NonPublic);
            var report = (JSONSchemaDraft4EvaluationReport) convertToReportMethod.Invoke(null, new object[] {tree});

            if (parseItem.PreviousSibling is JSONMember && parseItem.PreviousSibling.IsUnclosed)
            {
                parseItem = parseItem.PreviousSibling;
            }

            var originalItem = parseItem;
            while (parseItem != null && parseItem is JSONTokenItem)
            {
                parseItem = parseItem.Parent;
            }

            JSONMember member = parseItem as JSONMember;

            if (member != null)
            {
                if (member.Name != originalItem)
                {
                    var options = report.GetValueOptionsAsync(member, cursorPosition).Result;

                    foreach (var option in options)
                    {
                        allOptions.Add(new JSONOption
                        {
                            InsertionText = option.InsertionText,
                            DisplayText = option.DisplayText,
                            Type = option.Format
                        });
                    }

                    return allOptions;
                }

                parseItem = parseItem.Parent;
            }

            JSONArrayElement arrayElement = parseItem as JSONArrayElement;

            if (arrayElement != null)
            {
                JSONArray arr = (JSONArray)arrayElement.Parent;
                int index = arr.Elements.IndexOf(arrayElement);

                var options = report.GetValueOptionsAsync(arr, index, cursorPosition).Result;

                foreach (var option in options)
                {
                    allOptions.Add(new JSONOption
                    {
                        InsertionText = option.InsertionText,
                        DisplayText = option.DisplayText,
                        Type = option.TypeDescription
                    });
                }

                return allOptions;
            }

            JSONArray array = parseItem as JSONArray;

            if (array != null)
            {
                int index;
                for (index = 0; index < array.Elements.Count && cursorPosition > array.Elements[index].AfterEnd; ++index)
                {
                }

                var options = report.GetValueOptionsAsync(array, index, cursorPosition).Result;

                foreach (var option in options)
                {
                    allOptions.Add(new JSONOption
                    {
                        InsertionText = option.InsertionText,
                        DisplayText = option.DisplayText,
                        Type = option.TypeDescription
                    });
                }

                return allOptions;
            }

            JSONObject obj = parseItem as JSONObject;

            if (obj != null)
            {
                var options = report.GetPropertyInfosAsync(obj).Result;

                foreach (var option in options)
                {
                    allOptions.Add(new JSONOption
                    {
                        InsertionText = option.InsertionText,
                        DisplayText = option.DisplayText,
                        Type = option.TypeDescription
                    });
                }

                return allOptions;
            }

            return allOptions;
        }


        public static IEnumerable<JSONOption> GetCompletionOptions(string instanceText, string schemaText, IEnumerable<IJSONSchemaFormatHandler> formatHandlers, int cursorPosition)
        {
            StringWithFileNameTextProvider instanceProvider = new StringWithFileNameTextProvider(@"c:\temp\instance.json", instanceText);
            StringWithFileNameTextProvider schemaProvider = new StringWithFileNameTextProvider(@"c:\temp\schema.json", schemaText);
            return GetCompletionOptions(instanceProvider, schemaProvider, formatHandlers, cursorPosition);
        }

        public static IEnumerable<JSONOption> GetCompletionOptions(string instanceText, Uri schemaLocation, IEnumerable<IJSONSchemaFormatHandler> formatHandlers, int cursorPosition)
        {
            StringWithFileNameTextProvider instanceProvider = new StringWithFileNameTextProvider(@"c:\temp\instance.json", instanceText);

            StringWithFileNameTextProvider schemaProvider = null;

            if (schemaLocation != null)
            {
                string schemaText = JsonValidator.Download(schemaLocation);
                schemaProvider = new StringWithFileNameTextProvider(schemaLocation.ToString(), schemaText);
            }

            return GetCompletionOptions(instanceProvider, schemaProvider, formatHandlers, cursorPosition);
        }

        public static IEnumerable<JSONOption> GetCompletionOptions(Uri instanceLocation, string schemaText, IEnumerable<IJSONSchemaFormatHandler> formatHandlers, int cursorPosition)
        {
            string instanceText = JsonValidator.Download(instanceLocation);
            StringWithFileNameTextProvider instanceProvider = new StringWithFileNameTextProvider(instanceLocation.ToString(), instanceText);


            StringWithFileNameTextProvider schemaProvider = null;

            if (schemaText != null)
            {
                schemaProvider = new StringWithFileNameTextProvider(@"c:\temp\schema.json", schemaText);
            }

            return GetCompletionOptions(instanceProvider, schemaProvider, formatHandlers, cursorPosition);
        }

        public static IEnumerable<JSONOption> GetCompletionOptions(Uri instanceLocation, Uri schemaLocation, IEnumerable<IJSONSchemaFormatHandler> formatHandlers, int cursorPosition)
        {
            string instanceText = JsonValidator.Download(instanceLocation);
            StringWithFileNameTextProvider instanceProvider = new StringWithFileNameTextProvider(instanceLocation.ToString(), instanceText);
            StringWithFileNameTextProvider schemaProvider = null;

            if (schemaLocation != null)
            {
                string schemaText = JsonValidator.Download(schemaLocation);
                schemaProvider = new StringWithFileNameTextProvider(schemaLocation.ToString(), schemaText);
            }

            return GetCompletionOptions(instanceProvider, schemaProvider, formatHandlers, cursorPosition);
        }
    }
}
