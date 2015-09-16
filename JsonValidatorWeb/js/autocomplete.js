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

    //Adapted (very lightly) from https://raw.githubusercontent.com/component/textarea-caret-position/master/index.js
    function getCaretCoordinates(element, position) {
        // mirrored div
        var div = document.createElement("div");
        div.id = "input-textarea-caret-position-mirror-div";
        document.body.appendChild(div);

        var style = div.style;
        var computed = window.getComputedStyle ? getComputedStyle(element) : element.currentStyle;  // currentStyle for IE < 9
        var yScale = style.msFlexWrap !== undefined || window.navigator.userAgent.toLowerCase().indexOf('edge') > -1 ? .75 : 1;
        var xScale = style.msFlexWrap !== undefined || window.navigator.userAgent.toLowerCase().indexOf('edge') > -1 ? 1.25 : 1;

        // default textarea styles
        style.whiteSpace = "pre-wrap";
        style.wordWrap = "break-word";  // only for textarea-s

        // position off-screen
        style.position = "absolute";  // required to return coordinates properly
        style.visibility = "hidden";  // not 'display: none' because we want rendering

        var props = [
            "direction", // RTL support
            "boxSizing",
            "width", // on Chrome and IE, exclude the scrollbar, so the mirror div wraps exactly as the textarea does
            "height",
            "overflowX",
            "overflowY", // copy the scrollbar for IE
            "borderTopWidth",
            "borderRightWidth",
            "borderBottomWidth",
            "borderLeftWidth",
            "borderStyle",
            "paddingTop",
            "paddingRight",
            "paddingBottom",
            "paddingLeft",

            // https://developer.mozilla.org/en-US/docs/Web/CSS/font
            "fontStyle",
            "fontVariant",
            "fontWeight",
            "fontStretch",
            "fontSize",
            "fontSizeAdjust",
            "lineHeight",
            "fontFamily",
            "textAlign",
            "textTransform",
            "textIndent",
            "textDecoration", // might not make a difference, but better be safe
            "letterSpacing",
            "wordSpacing",
            "tabSize",
            "MozTabSize"
        ];

        for (var i = 0; i < props.length; ++i) {
            style[props[i]] = computed[props[i]];
        }

        style.overflow = "hidden";  // for Chrome to not render a scrollbar; IE keeps overflowY = 'scroll'

        div.textContent = element.value.substring(0, position);

        var span = document.createElement("span");
        // Wrapping must be replicated *exactly*, including when a long word gets
        // onto the next line, with whitespace at the end of the line before (#7).
        // The  *only* reliable way to do that is to copy the *entire* rest of the
        // textarea's content into the <span> created at the caret position.
        // for inputs, just '.' would be enough, but why bother?
        span.textContent = element.value.substring(position) || ".";  // || because a completely empty faux span doesn't render at all
        div.appendChild(span);

        var coordinates = {
            top: yScale * (span.offsetTop + parseInt(computed["borderTopWidth"])) + element.offsetTop,
            left: xScale * (span.offsetLeft + parseInt(computed["borderLeftWidth"])) + element.offsetLeft
    };

        document.body.removeChild(div);

        return coordinates;
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

    var existingSelect;

    function showCompletionOptions(focusedBox, cursorPosition, optionsResponse) {

        if (optionsResponse.Options.length === 0) {
            return;
        }
        
        if (existingSelect) {
            existingSelect.onkeydown = null;
            existingSelect.parentElement.removeChild(existingSelect);
        }

        var selectElement = document.createElement("select");
        existingSelect = selectElement;

        for (var i = 0; i < optionsResponse.Options.length; ++i) {
            var opt = optionsResponse.Options[i];
            var optElem = document.createElement("option");
            optElem.innerHTML = opt.DisplayText;
            optElem.value = opt.InsertionText;
            optElem.alt = optElem.title = opt.Type;
            selectElement.appendChild(optElem);
        }

        focusedBox.setSelectionRange(cursorPosition, cursorPosition);
        focusedBox.focus();

        var coords = getCaretCoordinates(focusedBox, cursorPosition);
        selectElement.style.position = "absolute";
        selectElement.style.left = coords.left + "px";
        selectElement.style.top = coords.top + "px";

        focusedBox.parentElement.appendChild(selectElement);
        selectElement.className = "selected";

        selectElement.onkeydown = function (e) {
            if (e.which === 13 || e.keyCode === 13
                || e.which === 9 || e.keyCode === 9) {
                focusedBox.focus();
                var selVal = selectElement.value;
                var newVal = focusedBox.value.substr(0, optionsResponse.ReplacementStart) + selVal + focusedBox.value.substr(optionsResponse.ReplacementStart + optionsResponse.ReplacementLength);
                focusedBox.value = newVal;

                selectElement.onkeydown = null;
                existingSelect.parentElement.removeChild(existingSelect);
                existingSelect = null;

                focusedBox.focus();
                focusedBox.setSelectionRange(optionsResponse.ReplacementStart + selVal.length, optionsResponse.ReplacementStart + selVal.length);
                return false;
            }

            if (e.which === 27 || e.keyCode === 27) {
                selectElement.onkeydown = null;
                existingSelect.parentElement.removeChild(existingSelect);
                existingSelect = null;

                focusedBox.focus();
                return false;
            }

            return true;
        };

        selectElement.focus();
        selectElement.size = Math.min(10, selectElement.length);
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

    function handleKeyPress(e) {
        var evt = e || event;
        var code = evt.keyCode || e.which;
        var chr = String.fromCharCode(code)
        var src = evt.srcElement;
        var selStart = src.selectionStart;
        var selEnd = src.selectionEnd;
        var selLen = selEnd - selStart;
        var text = src.value;
        var lineStart = findLineStart(text, selStart);
        var i;
        var handled = true;

        //console.log(code);

        switch (chr) {
            case "{":
            case "[":
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
            case "\"":
            case "'":
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
            case " ":
                if (evt.ctrlKey) {
                    getCompletions(src, selStart, selStart);
                } else {
                    handled = false;
                }
                break;
            case "1": //Alt+1 (expand)
                if (!evt.altKey) {
                    handled = false;
                    break;
                }
                break;
            case "2": //Alt+2 (contract)
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

    function handleKeyDown(e) {
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

    elInstance.addEventListener("keypress", handleKeyPress, true);
    elSchema.addEventListener("keypress", handleKeyPress, true);

    elInstance.addEventListener("keydown", handleKeyDown, true);
    elSchema.addEventListener("keydown", handleKeyDown, true);

})();