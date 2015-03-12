(function (undefined) {

    var elSelect = document.getElementById("schemastore"),
        elSchema = document.getElementById("schema");

    function onChange(e) {

        if (e.target.selectedIndex === 0)
            return;

        var url = e.target.options[e.target.selectedIndex].value;

        var http = new XMLHttpRequest();
        http.open("GET", url, true);
        http.onreadystatechange = function () {
            if (http.readyState === 4 && http.status === 200) {
                elSchema.value = http.responseText;
            }
        }

        http.send(null);
    }

    function loadSchemas() {
        var http = new XMLHttpRequest();
        http.open("GET", "http://schemastore.org/api/json/catalog.json", true);
        http.onreadystatechange = function () {
            if (http.readyState === 4 && http.status === 200) {
                var schemas = JSON.parse(http.responseText);

                for (var i = 0; i < schemas.schemas.length; i++) {
                    var schema = schemas.schemas[i];
                    var option = document.createElement("option");
                    option.value = schema.url;
                    option.innerHTML = schema.name;
                    elSelect.appendChild(option);
                }
            }
        }

        http.send(null);
    }

    elSelect.addEventListener("change", onChange, false);
    loadSchemas();

})();