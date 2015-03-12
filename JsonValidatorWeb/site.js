(function (undefined) {

    var elOutput = document.querySelector("output"),
        elInstance = document.getElementById("instance"),
        elSchema = document.getElementById("schema"),
        elForm = document.querySelector("form");

    function onSubmit(e) {
        e.preventDefault();

        var instance = elInstance.value;
        var schema = elSchema.value;

        var http = new XMLHttpRequest();
        var url = "/api/v1.ashx";
        var params = getPostObject(instance, schema);
        http.open("POST", url, true);
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.onreadystatechange = function () {//Call a function when the state changes.
            if (http.readyState == 4 && http.status == 200) {
                elOutput.innerHTML = http.responseText;
            }
        }
        http.send(params);
    }

    function getPostObject(instance, schema) {
        var instanceContents = parseJson(elInstance.value);
        var kind = instanceContents.$schema ? "Uri" : "Text";
        var obj = {
            Instance: {
                Kind: "Text",
                Value: instance
            },
            Schema: {
                Kind: kind,
                Value: schema
            }
        }

        return JSON.stringify(obj);
    }

    function onInstanceChanged(e) {
        var instance = parseJson(elInstance.value);

        if (instance) {
            var schema = instance.$schema;

            if (schema) {
                elSchema.value = schema;
            }
        }

        //elSchema.disabled = instance !== null;
    }

    function parseJson(string) {
        try {
            return JSON.parse(string);
        }
        catch (ex) {
            return null;
        }
    }

    elForm.addEventListener("submit", onSubmit, false);
    elInstance.addEventListener("change", onInstanceChanged, false);

})();