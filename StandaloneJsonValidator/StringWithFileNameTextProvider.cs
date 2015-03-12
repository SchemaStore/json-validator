using System.IO;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.CSS.Core.Text;

namespace StandaloneJsonValidator
{
    public class StringWithFileNameTextProvider : StringTextProvider, IFileNameProvider
    {
        public StringWithFileNameTextProvider(string fileName, string text)
            : base(text)
        {
            FileName = fileName;
        }

        public static StringWithFileNameTextProvider FromFile(string path)
        {
            string fileText = File.ReadAllText(path);
            return new StringWithFileNameTextProvider(path, fileText);
        }

        public static async Task<StringWithFileNameTextProvider> FromUrlAsync(string url)
        {
            using (HttpClient client = new HttpClient())
            {
                string data = await client.GetStringAsync(url);
                return new StringWithFileNameTextProvider(url, data);
            }
        }

        public string FileName { get; set; }
    }
}