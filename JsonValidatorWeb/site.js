(function (undefined) {

    var elOutput = document.getElementById("result"),
        elPre = document.querySelector("pre"),
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
            if (http.readyState === 4) {
                elInstance.disabled = false;
                elSchema.disabled = false;

                if (http.status === 200)
                    showErrors(JSON.parse(http.responseText));
                else
                    alert("Could not resolve the URL");
            }
        }
        http.send(getPostObject(instance, schema));

        elInstance.disabled = true;
        elSchema.disabled = true;
    }

    /**
     * @param {string} instance
     */
    function showErrors(result) {
        var instance = result.InstanceDocumentText;

        for (var i = result.Errors.length - 1; i >= 0; i--) {
            var error = result.Errors[i];
            var start = error.Start;
            var tooltip = error.Message.replace(/"/gi, "&quot;");

            instance = instance.substring(0, error.Start) + "<mark title=\"" + tooltip + "\">" + instance.substring(error.Start, error.Start + error.Length) + "</mark>" + instance.substring(error.Start + error.Length);
        }

        elOutput.style.display = "block";
        elPre.innerHTML = instance;
        location.href = "#result";

        elOutput.querySelector("ol").innerHTML = result.Errors.map(function (err) {
            return "<li><span>position:" + err.Start + ", length:" + err.Length + "</span><pre>" + err.Message + "</pre></li>"
        })

        if (result.Errors.length > 0) {
            elOutput.firstElementChild.style.color = "red";
            elOutput.firstElementChild.innerHTML = result.Errors.length + " error(s)";
        }
        else {
            elOutput.firstElementChild.style.color = "green";
            elOutput.firstElementChild.innerHTML = "0 errors";
        }
    }

    function getPostObject(instance, schema) {
        var obj = {
            Instance: {
                Kind: inputKind(instance),
                Value: instance
            },
            Schema: {
                Kind: inputKind(schema),
                Value: schema
            }
        }

        return JSON.stringify(obj);
    }

    function onInstanceChanged(e) {
        var kind = inputKind(elInstance.value);

        if (kind === "Text") {

            var instance = JSON.parse(elInstance.value);
            var schema = instance.$schema;

            if (schema) {
                elSchema.value = schema;
            }
        }

        if (kind || e.target.value.length < 2)
            e.target.removeAttribute("invalid");
        else
            e.target.setAttribute("invalid", "");
    }

    function inputKind(string) {
        var clean = string.trim()

        if (clean.indexOf("http://") === 0 || clean.indexOf("https://") === 0)
            return "Uri";

        try {
            JSON.parse(string);
            return "Text";
        }
        catch (ex) {
            return null;
        }
    }

    elForm.addEventListener("submit", onSubmit, false);
    elInstance.addEventListener("keyup", onInstanceChanged, false);

})();