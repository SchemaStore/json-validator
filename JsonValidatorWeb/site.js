(function (undefined) {

    var elOutput = document.querySelector("output"),
        elPre = document.querySelector("pre")
        elInstance = document.getElementById("instance"),
        elSchema = document.getElementById("schema"),
        elForm = document.querySelector("form");

    function onSubmit(e) {
        e.preventDefault();

        var instance = elInstance.value;
        var schema = elSchema.value;

        var http = new XMLHttpRequest();
        http.open("POST", "/api/v1.ashx", true);
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.onreadystatechange = function () {
            if (http.readyState == 4 && http.status == 200) {
                showErrors(http.responseText, instance);
                elInstance.disabled = false;
                elSchema.disabled = false;
            }
        }
        http.send(getPostObject(instance, schema));

        elInstance.disabled = true;
        elSchema.disabled = true;
    }

    /**
     * @param {string} instance
     */
    function showErrors(result, instance) {
        var errors = JSON.parse(result);
        var string = "";

        for (var i = errors.length - 1; i >= 0; i--) {
            var error = errors[i];
            var start = error.Start;
            var tooltip = error.Message.replace(/"/gi, "&quot;");

            instance = instance.substring(0, error.Start) + "<mark title=\"" + tooltip + "\">" + instance.substring(error.Start, error.Start + error.Length) + "</mark>" + instance.substring(error.Start + error.Length);
        }

        elOutput.style.display = "block";
        location.href = "#result";

        if (errors.length > 0) {
            elPre.innerHTML = instance;
            elOutput.firstElementChild.style.color = "red";
            elOutput.firstElementChild.innerHTML = errors.length +  " error(s)";
        }
        else {
            elPre.innerHTML = "";
            elOutput.firstElementChild.style.color = "green";
            elOutput.firstElementChild.innerHTML = "0 errors";
        }
    }

    function getPostObject(instance, schema) {
        var obj = {
            Instance: {
                Kind: parseJson(instance) ? "Text" : "Uri",
                Value: instance
            },
            Schema: {
                Kind: parseJson(schema) ? "Text" : "Uri",
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