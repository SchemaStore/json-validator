(function (undefined) {

    var elSelect = document.getElementById("schemastore"),
        elInstance = document.getElementById("instance")
    elSchema = document.getElementById("schema");

    function onSelectionChange(e) {

        if (e.target.selectedIndex === 0)
            return;

        var url = e.target.options[e.target.selectedIndex].value;

        sendXhr(url, function (data) {
            elSchema.value = data;
            saveState();
        });
    }

    function loadSchemas() {

        sendXhr("http://schemastore.org/api/json/catalog.json", function (data) {
            var schemas = JSON.parse(data);

            for (var i = 0; i < schemas.schemas.length; i++) {
                var schema = schemas.schemas[i];
                var option = document.createElement("option");
                option.value = schema.url;
                option.innerHTML = schema.name;
                elSelect.appendChild(option);
            }
        });
    }

    function sendXhr(url, callback) {

        if (sessionStorage && sessionStorage[url]) {
            callback(sessionStorage[url]);
            return;
        }

        var http = new XMLHttpRequest();
        http.open("GET", url, true);
        http.onreadystatechange = function () {
            if (http.readyState === 4 && http.status === 200) {
                callback(http.responseText);

                if (http.status === 200 && sessionStorage)
                    sessionStorage[url] = http.responseText;
            }
        }

        http.send(null);
    }

    function saveState() {
        if (!localStorage) return;

        localStorage["select"] = elSelect.selectedIndex;
        localStorage["instance"] = elInstance.value;
        localStorage["schema"] = elSchema.value;
    }

    function loadState() {
        if (!localStorage) return;

        elSelect.selectedIndex = localStorage["select"] || 0;
        elInstance.value = localStorage["instance"] || "";
        elSchema.value = localStorage["schema"] || "";
    }

    elSelect.addEventListener("change", onSelectionChange, false);
    elInstance.addEventListener("keyup", saveState, false);
    elSchema.addEventListener("keyup", saveState, false);

    loadSchemas();
    loadState();
})();