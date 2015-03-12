(function (undefined) {
    var elInstance = document.getElementById("instance"),
        elSchema = document.getElementById("schema"),
        elForm = document.querySelector("form"),
        elCaptureTabs = document.getElementById("captureTabs");

    function inputKind(string) {
        var clean = string.trim();

        if (clean.indexOf("http://") === 0 || clean.indexOf("https://") === 0)
            return "Uri";

        return "Text";
    }

    function getPostObject(instance, schema, cursorPosition) {
        var obj = {
            Instance: {
                Kind: inputKind(instance),
                Value: instance
            },
            Schema: {
                Kind: inputKind(schema),
                Value: schema
            },
            CursorPosition: cursorPosition
        }

        return JSON.stringify(obj);
    }

    function showCompletionOptions(focusedBox, cursorPosition, optionsResponse) {
        //var selectElement = document.getElementById("intellisense");

        //while (selectElement.children.length > 0) {
        //    selectElement.removeChild(selectElement.children[0]);
        //}

        for (var i = 0; i < optionsResponse.Options.length; ++i) {
            var opt = optionsResponse.Options[i];
            //var optElem = document.createElement("option");
            //optElem.innerHTML = opt.DisplayText;
            //optElem.value = opt.InsertionText;
            //optElem.alt = optElem.title = opt.Type;
            //selectElement.appendChild(optElem);
        }

        //focusedBox.setSelectionRange(cursorPosition, cursorPosition);
        //focusedBox.focus();

        //var newlineCount = 0;
        //for (var i = 0; i < cursorPosition && i < focusedBox.value.length; ++i) {
        //    if (focusedBox.value[i] === "\n") {
        //        ++newlineCount;
        //    }
        //}

        //var computedStyle = focusedBox.currentStyle || window.getComputedStyle(focusedBox);
        //var lineOffset = parseInt(computedStyle.lineHeight) * newlineCount;
        //var yOffset = focusedBox.offsetTop;
        //var expectY = yOffset + lineOffset - focusedBox.scrollTop;
        //selectElement.style.top = expectY + "px";

        //selectElement.className = "selected";
        //selectElement.focus();
        //selectElement.click();
    }

    function getCompletions(focusedBox, cursorPosition) {
        var instance = elInstance.value;
        var schema = elSchema.value;

        var http = new XMLHttpRequest();
        http.open("POST", "/api/Completion/v1.ashx", true);
        http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        http.onreadystatechange = function () {
            if (http.readyState === 4) {
                elInstance.disabled = false;
                elSchema.disabled = false;

                if (http.status === 200)
                    showCompletionOptions(focusedBox, cursorPosition, JSON.parse(http.responseText));
                else
                    alert("Could not resolve the URL");
            }
        }
        http.send(getPostObject(instance, schema, cursorPosition));
    }

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

    function handleReturn(src, lineStart, selStart, selEnd, prevBraceFound) {
        //Determine indent
        var pad = "";
        for (var i = lineStart; src.value[i] === " "; ++i, pad += " ");

        if (selStart > lineStart + pad.length - 1) {
            if (prevBraceFound) {
                pad += tabString;
            }

            src.value = src.value.substr(0, selStart) + "\n" + pad + src.value.substr(selEnd);
            src.setSelectionRange(selStart + pad.length + 1, selStart + pad.length + 1);
        } else {
            src.value = src.value.substr(0, lineStart) + "\n" + src.value.substr(lineStart);
            src.setSelectionRange(selStart + 1, selStart + 1);
        }

        return pad.length;
    }

    function handleEditingKeys(e) {
        var evt = e || event;
        var code = evt.keyCode || e.which;
        var src = evt.srcElement;
        var selStart = src.selectionStart;
        var selEnd = src.selectionEnd;
        var selLen = selEnd - selStart;
        var text = src.value;
        var lineStart = findLineStart(text, selStart);
        var i;
        var handled = true;

        //console.log(code);

        switch (code) {
            case 219: // [ or {
                var open = evt.shiftKey ? "{" : "[";
                var close = evt.shiftKey ? "}" : "]";
                var selLen = selEnd - selStart;
                var sel = text.substr(selStart, selLen);
                var tail = text.substr(selEnd);
                src.value = text.substr(0, selStart) + open;
                var pad = handleReturn(src, lineStart, src.value.length, src.value.length);
                var newSelStart = selStart + 1;
                if (sel !== "") {
                    src.value += tabString + sel;
                    newSelStart += tabSize + 1 + pad; //make sure to account for the newline character
                    lineStart = findLineStart(src.value, newSelStart + tabSize);
                    handleReturn(src, lineStart, newSelStart + selLen, newSelStart + selLen);
                    src.value = src.value.substr(0, src.value.length - tabSize); //backoff one indent
                }
                src.value += close + tail;
                src.setSelectionRange(newSelStart, newSelStart + selLen);
                break;
            case 222: // ' or "
                var open = evt.shiftKey ? "\"" : "'";
                var sel = text.substr(selStart, selLen);
                var tail = text.substr(selEnd);
                src.value = text.substr(0, selStart) + open;
                var newSelStart = selStart + 1;
                if (sel !== "") {
                    src.value += sel;
                }
                src.value += open + tail;
                src.setSelectionRange(newSelStart, newSelStart + selLen);
                break;
            case 46: //delete
                if (!evt.shiftKey) {
                    handled = false;

                    if (selEnd < text.length && text[selEnd] === '\n') {
                        ++selEnd;
                        var allWhitespace = true;
                        var nextNewLine = text.indexOf("\n", selEnd);
                        for (i = selEnd; allWhitespace && i < nextNewLine; ++i) {
                            allWhitespace = text[i] === " ";
                        }

                        if (allWhitespace) {
                            handled = true;
                            src.value = text.substr(0, selStart) + text.substr(nextNewLine);
                            src.setSelectionRange(selStart, selStart);
                        }
                    }

                    break;
                }

                var nextNewLine = text.indexOf("\n", lineStart);
                src.value = text.substr(0, lineStart) + (nextNewLine > -1 ? text.substr(nextNewLine + 1) : "");
                src.setSelectionRange(lineStart, lineStart);
                break;
            case 35:
                if (evt.ctrlKey) {
                    src.setSelectionRange(text.length, text.length);
                    break;
                }
                handled = false;
                break;
            case 36: //home
                if (evt.ctrlKey) {
                    src.setSelectionRange(0, 0);
                    break;
                }

                for (i = lineStart; text[i] === " "; ++i);
                var rangeStart = i === selStart ? lineStart : i;

                var end = rangeStart;
                if (evt.shiftKey) {
                    end = selEnd;
                }
                src.setSelectionRange(rangeStart, end);
                break;
            case 9: //tab
                if (!elCaptureTabs.checked) {
                    handled = false;
                    break;
                }

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
                            var start = Math.max(lineStart, selStart - tabSize);
                            src.setSelectionRange(start, start + selLen);
                        }
                    }
                }
                break;
            case 113:
                elCaptureTabs.checked = !elCaptureTabs.checked;
                break;
            case 32:
                if (evt.ctrlKey) {
                    getCompletions(src, selStart, selStart);
                } else {
                    handled = false;
                }
                break;
            case 13: //return
                if (evt.ctrlKey) {
                    elForm.querySelector("input[type=submit]").click();
                    break;
                }

                var prevBraceFound = false;
                for (i = selStart - 1; i >= 0; --i) {
                    if (text[i] === ' ') {
                        continue;
                    }

                    if (text[i] === '{' || text[i] === '[') {
                        prevBraceFound = true;
                    }

                    break;
                }

                handleReturn(src, lineStart, selStart, selEnd, prevBraceFound);
                break;
            case 49: //1 (expand)
                if (!evt.altKey) {
                    handled = false;
                    break;
                }
                break;
            case 50: //2 (contract)
                if (!evt.altKey) {
                    handled = false;
                    break;
                }
                break;
            default:
                handled = false;
                break;
        }

        if (handled) {
            evt.preventDefault();
            evt.cancelBubble = true;
            return false;
        }

        return true;
    }

    elInstance.addEventListener("keydown", handleEditingKeys, true);
    elSchema.addEventListener("keydown", handleEditingKeys, true);

})();