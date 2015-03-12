(function (undefined) {

    var elInstance = document.getElementById("instance"),
        elSchema = document.getElementById("schema");

    var tabString = "  ";
    var tabSize = tabString.length;

    function findLineStart(text, selStart) {
        for (var i = selStart - 1; i >= 0; --i) {
            if (text[i] === "\n") {
                return i + 1;
            }
        }

        return 0;
    }

    function handleEditingKeys(e) {
        var evt = event || e;
        var code = evt.keyCode || e.which;
        var src = evt.srcElement;
        var selStart = src.selectionStart;
        var selEnd = src.selectionEnd;
        var text = src.value;
        var lineStart = findLineStart(text, selStart);
        var i;

        switch (code) {
            case 46: //delete
                if (!evt.shiftKey) {
                    return true;
                }

                var nextNewLine = text.indexOf("\n", lineStart);
                src.value = text.substr(0, lineStart) + (nextNewLine > -1 ? text.substr(nextNewLine + 1) : "");
                src.setSelectionRange(lineStart, lineStart);
                break;
            case 36: //home
                for (i = lineStart; text[i] === " "; ++i);

                if (i === selStart) {
                    return true;
                }

                src.setSelectionRange(i, i);
                break;
            case 9: //tab
                if (!evt.shiftKey) {
                    src.value = text.substr(0, selStart) + tabString + text.substr(selStart);
                    src.setSelectionRange(selStart + tabSize, selEnd + tabSize);
                } else {
                    var distance = 0;
                    for (i = lineStart; text[i] === " "; ++i, ++distance);
                    if (distance > 0) {
                        if (distance < tabSize) {
                            src.value = text.substr(0, lineStart) + text.substr(i);
                            src.setSelectionRange(selStart - distance, selEnd - distance);
                        } else {
                            src.value = text.substr(0, lineStart) + text.substr(lineStart + tabSize);
                            src.setSelectionRange(selStart - tabSize, selEnd - tabSize);
                        }
                    }
                }
                break;
            case 13: //return
                //Determine indent
                var pad = "";
                for (i = lineStart; text[i] === " "; ++i, pad += " ");
                src.value = text.substr(0, selStart) + "\n" + pad + text.substr(selEnd);
                src.setSelectionRange(selStart + pad.length + 1, selStart + pad.length + 1);
                break;
            default:
                return true;
        }

        evt.preventDefault();
        evt.cancelBubble = true;
        return false;
    }

    elInstance.addEventListener("keydown", handleEditingKeys, true);
    elSchema.addEventListener("keydown", handleEditingKeys, true);

})();