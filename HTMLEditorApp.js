var defaultTitle = document.title;
var unsavedChanges = false;
var lastHTMLFindOnlyIndex = 0;
var lastHTMLFindIndex = 0;
var lastCSSFindOnlyIndex = 0;
var lastCSSFindIndex = 0;
var lastJsFindOnlyIndex = 0;
var lastJsFindIndex = 0;
var htmlUndoStack = [];
var htmlRedoStack = [];
var cssUndoStack = [];
var cssRedoStack = [];
var jsUndoStack = [];
var jsRedoStack = [];

window.addEventListener("beforeunload", function(e) {
if (unsavedChanges) {
e.preventDefault();
e.returnValue = "";
}
});

window.onload = function() {
var themeOBJ = document.getElementById("theme");
var html = document.getElementById("html");
var css = document.getElementById("css");
var javascript = document.getElementById("javascript");
if (invalidArray(JSON.parse(localStorage.getItem("HEcodes")))) {
localStorage.setItem("HEcodes", "[]");
}
loadTheme().then(theme => {
if (theme !== "dark" && theme !== "light") {
storeTheme();
theme = "dark";
}
themeOBJ.value = theme;
storeTheme();
syntaxHighlight(html, "html");
syntaxHighlight(css, "css");
syntaxHighlight(javascript, "javascript");
showCodes();
});
runCode();
document.getElementById("result").blur();
scrollTo(0, 0);
html.addEventListener("scroll", function() {
document.getElementById("htmlLineList").parentElement.scrollTop = html.scrollTop;
});
css.addEventListener("scroll", function() {
document.getElementById("cssLineList").parentElement.scrollTop = css.scrollTop;
});
javascript.addEventListener("scroll", function() {
document.getElementById("javascriptLineList").parentElement.scrollTop = javascript.scrollTop;
});
html.addEventListener("beforeinput", saveHTMLCodeSnapshot);
css.addEventListener("beforeinput", saveCSSCodeSnapshot);
javascript.addEventListener("beforeinput", saveJsCodeSnapshot);
html.addEventListener("keydown", function(e) {
if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
e.preventDefault();
HTMLUndo();
}
if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
e.preventDefault();
HTMLRedo();
}
if (e.ctrlKey && e.key.toLowerCase() === "f") {
e.preventDefault();
openHTMLFindOnly();
}
if (e.ctrlKey && e.key.toLowerCase() === "h") {
e.preventDefault();
openHTMLFindReplace();
}
});
html.addEventListener("blur", function() {
lastHTMLFindOnlyIndex = 0;
lastHTMLFindIndex = 0;
});
css.addEventListener("keydown", function(e) {
if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
e.preventDefault();
CSSUndo();
}
if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
e.preventDefault();
CSSRedo();
}
if (e.ctrlKey && e.key.toLowerCase() === "f") {
e.preventDefault();
openCSSFindOnly();
}
if (e.ctrlKey && e.key.toLowerCase() === "h") {
e.preventDefault();
openCSSFindReplace();
}
});
css.addEventListener("blur", function() {
lastCSSFindOnlyIndex = 0;
lastCSSFindIndex = 0;
});
javascript.addEventListener("keydown", function(e) {
if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
e.preventDefault();
JsUndo();
}
if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
e.preventDefault();
JsRedo();
}
if (e.ctrlKey && e.key.toLowerCase() === "f") {
e.preventDefault();
openJsFindOnly();
}
if (e.ctrlKey && e.key.toLowerCase() === "h") {
e.preventDefault();
openJsFindReplace();
}
});
javascript.addEventListener("blur", function() {
lastJsFindOnlyIndex = 0;
lastJsFindIndex = 0;
});
document.body.addEventListener("keydown", function(e) {
if (e.altKey && e.shiftKey && e.key === "Enter") {
e.preventDefault();
runCode();
}
if (e.altKey && e.shiftKey && e.key.toLowerCase() === "s") {
e.preventDefault();
saveCode();
}
if (e.altKey && e.shiftKey && e.key.toLowerCase() === "b") {
e.preventDefault();
blankCode();
}
if (e.altKey && e.shiftKey && e.key.toLowerCase() === "d") {
e.preventDefault();
downloadCode(document.getElementById("codeName").value, document.getElementById("html").textContent, document.getElementById("css").textContent, document.getElementById("javascript").textContent);
}
if (e.altKey && e.shiftKey && e.key.toLowerCase() === "u") {
e.preventDefault();
uploadCode();
}
if (e.altKey && e.shiftKey && e.key.toLowerCase() === "j") {
e.preventDefault();
closeFindReplacePanels();
}
});
document.getElementById("htmlFindOnlyInput").addEventListener("input", function() { lastHTMLFindOnlyIndex = 0; });
document.getElementById("htmlFindText").addEventListener("input", function() { lastHTMLFindIndex = 0; });
document.getElementById("cssFindOnlyInput").addEventListener("input", function() { lastCSSFindOnlyIndex = 0; });
document.getElementById("cssFindText").addEventListener("input", function() { lastCSSFindIndex = 0; });
document.getElementById("javascriptFindOnlyInput").addEventListener("input", function() { lastJsFindOnlyIndex = 0; });
document.getElementById("javascriptFindText").addEventListener("input", function() { lastJsFindIndex = 0; });
}

function invalidArray(array) {
if (Array.isArray(array)) {
return array.some(item => typeof item !== "object" || item === null || Object.keys(item).length !== 4 || !("codeName" in item) || !("html" in item) || !("css" in item) || !("javascript" in item));
}
else {
return true;
}
}

function openDB() {
return new Promise((resolve, reject) => {
var request = indexedDB.open("HTMLEditorDB", 1);
request.onupgradeneeded = (event) => {
var db = event.target.result;
db.createObjectStore("settings", { keyPath: "key" });
};
request.onsuccess = () => resolve(request.result);
request.onerror = () => reject(request.error);
});
}

async function saveTheme(theme) {
var db = await openDB();
var tx = db.transaction("settings", "readwrite");
var store = tx.objectStore("settings");
store.put({ key: "theme", value: theme });
await tx.complete;
db.close();
}

async function loadTheme() {
return new Promise((resolve, reject) => {
var request = indexedDB.open("HTMLEditorDB", 1);
request.onupgradeneeded = (event) => {
var db = event.target.result;
db.createObjectStore("settings", { keyPath: "key" });
};
request.onsuccess = () => {
var db = request.result;
var tx = db.transaction("settings", "readonly");
var store = tx.objectStore("settings");
var getRequest = store.get("theme");
getRequest.onsuccess = () => {
var result = getRequest.result;
resolve(result ? result.value : null);
db.close();
};
getRequest.onerror = () => {
reject(getRequest.error);
db.close();
};
};
request.onerror = () => reject(request.error);
});
}

function storeTheme() {
var theme = document.getElementById("theme");
var html = document.getElementById("html");
var css = document.getElementById("css");
var javascript = document.getElementById("javascript");
var codeSelection = document.getElementById("codeSelection");
if (theme.value == "light") {
saveTheme("light");
theme.setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("tutorials").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("search").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("codeName").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("htmlFindOnlyInput").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("htmlFindText").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("htmlReplaceText").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("cssFindOnlyInput").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("cssFindText").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("cssReplaceText").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("javascriptFindOnlyInput").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("javascriptFindText").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("javascriptReplaceText").setAttribute("style", "background: #f5f5f5; color: #222; border: 1px solid black !important;");
document.getElementById("findReplaceCloseInfo").style.color = "black";
document.getElementById("leftPane").setAttribute("style", "background: #dcdcdc; color: #222;");
document.getElementById("debuggerSection").setAttribute("style", "background: #f0f0f0; color: #222;");
codeSelection.innerHTML = ".code::selection, .code *::selection { background: #cce6ff; }";
document.getElementById("sidebar").setAttribute("style", "background: #eeeeee;");
document.body.setAttribute("style", "background-color: #ffffff; color: #222;");
html.setAttribute("style", "background-color: #ffffff; color: #111; caret-color: #000;");
css.setAttribute("style", "background-color: #ffffff; color: #111; caret-color: #000;");
javascript.setAttribute("style", "background-color: #ffffff; color: #111; caret-color: #000;");
document.getElementById("result").style.border = "1px solid #444";
document.querySelector(".html-line-numbers").setAttribute("style",
"background-color: #eaeaea; color: #555; padding-left: 8px;"
);
document.querySelector(".css-line-numbers").setAttribute("style",
"background-color: #eaeaea; color: #555; padding-left: 8px;"
);
document.querySelector(".javascript-line-numbers").setAttribute("style",
"background-color: #eaeaea; color: #555; padding-left: 8px;"
);
document.querySelector(".code-wrapper").setAttribute("style",
"border: 1px solid black; background-color: #ffffff;"
);
document.getElementById("debuggerPanelHolder").setAttribute("style", "background: #f8f8f8; color: #222; border: 1px solid black;");
if (document.getElementById("mainFixedHTML") && document.getElementById("mainFixedCSS") && document.getElementById("mainFixedJavascript")) {
syntaxHighlight(document.getElementById("mainFixedHTML"), "html");
syntaxHighlight(document.getElementById("mainFixedCSS"), "css");
syntaxHighlight(document.getElementById("mainFixedJavascript"), "javascript");
}
document.querySelectorAll("button").forEach(button => {
button.style.background = "linear-gradient(135deg, #d9e6f2, #a6c8e0)";
button.style.color = "#222";
});
}

else if (theme.value == "dark") {
saveTheme("dark");
theme.setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("tutorials").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("search").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("codeName").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("htmlFindOnlyInput").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("htmlFindText").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("htmlReplaceText").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("cssFindOnlyInput").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("cssFindText").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("cssReplaceText").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("javascriptFindOnlyInput").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("javascriptFindText").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("javascriptReplaceText").setAttribute("style", "background: #1a1a1a; color: #eee; border: 1px solid white;");
document.getElementById("findReplaceCloseInfo").style.color = "white";
document.getElementById("leftPane").setAttribute("style", "background: #242424; color: #eee;");
document.getElementById("debuggerSection").setAttribute("style", "background: #111111; color: #eee;");
codeSelection.innerHTML = ".code::selection, .code *::selection { background: #204968; }";
document.getElementById("sidebar").setAttribute("style", "background: #0d0d0d;");
document.body.setAttribute("style", "background-color: #000000; color: #f5f5f5;");
html.setAttribute("style", "background-color: #1e1e1e; color: #e5e5e5; caret-color: white;");
css.setAttribute("style", "background-color: #1e1e1e; color: #e5e5e5; caret-color: white;");
javascript.setAttribute("style", "background-color: #1e1e1e; color: #e5e5e5; caret-color: white;");
document.getElementById("result").style.border = "1px solid #ccc";
document.querySelector(".html-line-numbers").setAttribute("style",
"background-color: #151515; color: #d0d0d0; padding-left: 8px;"
);
document.querySelector(".css-line-numbers").setAttribute("style",
"background-color: #151515; color: #d0d0d0; padding-left: 8px;"
);
document.querySelector(".javascript-line-numbers").setAttribute("style",
"background-color: #151515; color: #d0d0d0; padding-left: 8px;"
);
document.querySelector(".code-wrapper").setAttribute("style",
"border: 1px solid white; background-color: #151515;"
);
document.getElementById("debuggerPanelHolder").setAttribute("style", "background: #111; color: #eee; border: 1px solid white;");
if (document.getElementById("mainFixedHTML") && document.getElementById("mainFixedCSS") && document.getElementById("mainFixedJavascript")) {
syntaxHighlight(document.getElementById("mainFixedHTML"), "html");
syntaxHighlight(document.getElementById("mainFixedCSS"), "css");
syntaxHighlight(document.getElementById("mainFixedJavascript"), "javascript");
}
document.querySelectorAll("button").forEach(button => {
button.style.background = "linear-gradient(135deg, #6A00F4, #9A1AFF)";
button.style.color = "white";
});
}
}

function saveCodeToLocalStorage(name, htmlCode, cssCode, jsCode) {
if (invalidArray(JSON.parse(localStorage.getItem("HEcodes")))) {
localStorage.setItem("HEcodes", "[]");
}
var codes = JSON.parse(localStorage.getItem("HEcodes"));
var existingCodeIndex = codes.findIndex(item => item.codeName === name);
if (existingCodeIndex !== -1) {
codes[existingCodeIndex].html = htmlCode;
codes[existingCodeIndex].css = cssCode;
codes[existingCodeIndex].javascript = jsCode;
}
else {
codes.push({codeName: name, html: htmlCode, css: cssCode, javascript: jsCode});
}
localStorage.setItem("HEcodes", JSON.stringify(codes));
}

function retreiveCodeFromLocalStorage(codeName) {
if (invalidArray(JSON.parse(localStorage.getItem("HEcodes")))) {
localStorage.setItem("HEcodes", "[]");
}
var codes = JSON.parse(localStorage.getItem("HEcodes"));
var code = codes.find(item => item.codeName === codeName);
return code ? code : null;
}

function deleteCodeFromLocalStorage(codeName) {
if (invalidArray(JSON.parse(localStorage.getItem("HEcodes")))) {
localStorage.setItem("HEcodes", "[]");
}
var codes = JSON.parse(localStorage.getItem("HEcodes"));
codes = codes.filter(item => item.codeName !== codeName);
localStorage.setItem("HEcodes", JSON.stringify(codes));
}

String.prototype.replaceLastPortion = function(search, replacement) {
var index = this.lastIndexOf(search);
if (index === -1) {
return this;
}
return this.slice(0, index) + replacement + this.slice(index + search.length);
}

String.prototype.textify = function() {
var textified = this;
textified = textified.replace(/&/g, "&amp;");
textified = textified.replace(/</g, "&lt;");
textified = textified.replace(/>/g, "&gt;");
return textified;
}

function openHTMLFindOnly() {
document.getElementById("htmlFindReplaceBox").style.display = "none";
document.getElementById("htmlFindBox").style.display = "block";
document.getElementById("cssFindReplaceBox").style.display = "none";
document.getElementById("cssFindBox").style.display = "none";
document.getElementById("javascriptFindReplaceBox").style.display = "none";
document.getElementById("javascriptFindBox").style.display = "none";
document.getElementById("findReplaceCloseInfo").style.display = "block";
document.getElementById("htmlFindOnlyInput").focus();
}

function openHTMLFindReplace() {
document.getElementById("htmlFindBox").style.display = "none";
document.getElementById("htmlFindReplaceBox").style.display = "block";
document.getElementById("cssFindReplaceBox").style.display = "none";
document.getElementById("cssFindBox").style.display = "none";
document.getElementById("javascriptFindReplaceBox").style.display = "none";
document.getElementById("javascriptFindBox").style.display = "none";
document.getElementById("findReplaceCloseInfo").style.display = "block";
document.getElementById("htmlFindText").focus();
}

function openCSSFindOnly() {
document.getElementById("cssFindReplaceBox").style.display = "none";
document.getElementById("cssFindBox").style.display = "block";
document.getElementById("htmlFindReplaceBox").style.display = "none";
document.getElementById("htmlFindBox").style.display = "none";
document.getElementById("javascriptFindReplaceBox").style.display = "none";
document.getElementById("javascriptFindBox").style.display = "none";
document.getElementById("findReplaceCloseInfo").style.display = "block";
document.getElementById("cssFindOnlyInput").focus();
}

function openCSSFindReplace() {
document.getElementById("cssFindBox").style.display = "none";
document.getElementById("cssFindReplaceBox").style.display = "block";
document.getElementById("htmlFindReplaceBox").style.display = "none";
document.getElementById("htmlFindBox").style.display = "none";
document.getElementById("javascriptFindReplaceBox").style.display = "none";
document.getElementById("javascriptFindBox").style.display = "none";
document.getElementById("findReplaceCloseInfo").style.display = "block";
document.getElementById("cssFindText").focus();
}

function openJsFindOnly() {
document.getElementById("javascriptFindReplaceBox").style.display = "none";
document.getElementById("javascriptFindBox").style.display = "block";
document.getElementById("htmlFindReplaceBox").style.display = "none";
document.getElementById("htmlFindBox").style.display = "none";
document.getElementById("cssFindReplaceBox").style.display = "none";
document.getElementById("cssFindBox").style.display = "none";
document.getElementById("findReplaceCloseInfo").style.display = "block";
document.getElementById("javascriptFindOnlyInput").focus();
}

function openJsFindReplace() {
document.getElementById("javascriptFindBox").style.display = "none";
document.getElementById("javascriptFindReplaceBox").style.display = "block";
document.getElementById("htmlFindReplaceBox").style.display = "none";
document.getElementById("htmlFindBox").style.display = "none";
document.getElementById("cssFindReplaceBox").style.display = "none";
document.getElementById("cssFindBox").style.display = "none";
document.getElementById("findReplaceCloseInfo").style.display = "block";
document.getElementById("javascriptFindText").focus();
}

function closeFindReplacePanels() {
document.getElementById("htmlFindBox").style.display = "none";
document.getElementById("htmlFindReplaceBox").style.display = "none";
document.getElementById("cssFindBox").style.display = "none";
document.getElementById("cssFindReplaceBox").style.display = "none";
document.getElementById("javascriptFindBox").style.display = "none";
document.getElementById("javascriptFindReplaceBox").style.display = "none";
document.getElementById("findReplaceCloseInfo").style.display = "none";
}

function getCaretIndex(element) {
var sel = window.getSelection();
if (!sel.rangeCount) return null;
var range = sel.getRangeAt(0);
if (!element.contains(range.startContainer)) return null;
var preRange = document.createRange();
preRange.selectNodeContents(element);
preRange.setEnd(range.startContainer, range.startOffset);
return preRange.toString().length;
}

function highlightRange(element, start, end) {
var sel = window.getSelection();
var range = document.createRange();
var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
var node, index = 0;
var startNode = null, endNode = null;
var startOffset = 0, endOffset = 0;
while ((node = walker.nextNode())) {
var len = node.textContent.length;
if (start < index + len && !startNode) {
startNode = node;
startOffset = start - index;
}
if (end <= index + len && !endNode) {
endNode = node;
endOffset = end - index;
break;
}
index += len;
}
if (startNode && endNode) {
if (startNode === endNode) {
range.setStart(startNode, startOffset);
range.setEnd(endNode, endOffset);
}
else {
range.setStart(startNode, startOffset);
range.setEnd(endNode, endOffset);
}
sel.removeAllRanges();
sel.addRange(range);
range.startContainer.parentElement.scrollIntoView({ behavior: "smooth", block: "center" });
}
}

function scrollSelectionIntoView(code) {
var sel = window.getSelection();
if (!sel.rangeCount) {
return;
}
var range = sel.getRangeAt(0).cloneRange();
range.collapse(true);
var rect = range.getBoundingClientRect();
var containerRect = code.getBoundingClientRect();
var offsetTop = rect.top - containerRect.top;
code.scrollTop += offsetTop - code.clientHeight / 2 + rect.height / 2;
var offsetLeft = rect.left - containerRect.left;
code.scrollLeft += offsetLeft - code.clientWidth / 2 + rect.width / 2;
}

function htmlFindNextOnly() {
var html = document.getElementById("html");
var findVal = document.getElementById("htmlFindOnlyInput").value;
if (!findVal) {
return;
}
var text = html.textContent;
var startIndex = lastHTMLFindOnlyIndex;
var sel = window.getSelection();
if (sel.rangeCount > 0 && sel.toString().length > 0) {
var range = sel.getRangeAt(0);
var preRange = document.createRange();
preRange.selectNodeContents(html);
preRange.setEnd(range.endContainer, range.endOffset);
startIndex = preRange.toString().length;
}
else {
var caretIndex = getCaretIndex(html);
if (caretIndex !== null) startIndex = caretIndex;
}
var index = text.indexOf(findVal, startIndex);
if (index === -1) { 
index = text.indexOf(findVal, 0);
if (index === -1) {
alert("No matches found.");
return;
}
}
highlightRange(html, index, index + findVal.length);
lastHTMLFindOnlyIndex = index + findVal.length;
scrollSelectionIntoView(html);
}

function cssFindNextOnly() {
var css = document.getElementById("css");
var findVal = document.getElementById("cssFindOnlyInput").value;
if (!findVal) {
return;
}
var text = css.textContent;
var startIndex = lastCSSFindOnlyIndex;
var sel = window.getSelection();
if (sel.rangeCount > 0 && sel.toString().length > 0) {
var range = sel.getRangeAt(0);
var preRange = document.createRange();
preRange.selectNodeContents(css);
preRange.setEnd(range.endContainer, range.endOffset);
startIndex = preRange.toString().length;
}
else {
var caretIndex = getCaretIndex(css);
if (caretIndex !== null) startIndex = caretIndex;
}
var index = text.indexOf(findVal, startIndex);
if (index === -1) { 
index = text.indexOf(findVal, 0);
if (index === -1) {
alert("No matches found.");
return;
}
}
highlightRange(css, index, index + findVal.length);
lastCSSFindOnlyIndex = index + findVal.length;
scrollSelectionIntoView(css);
}

function javascriptFindNextOnly() {
var javascript = document.getElementById("javascript");
var findVal = document.getElementById("javascriptFindOnlyInput").value;
if (!findVal) {
return;
}
var text = javascript.textContent;
var startIndex = lastJsFindOnlyIndex;
var sel = window.getSelection();
if (sel.rangeCount > 0 && sel.toString().length > 0) {
var range = sel.getRangeAt(0);
var preRange = document.createRange();
preRange.selectNodeContents(javascript);
preRange.setEnd(range.endContainer, range.endOffset);
startIndex = preRange.toString().length;
}
else {
var caretIndex = getCaretIndex(javascript);
if (caretIndex !== null) startIndex = caretIndex;
}
var index = text.indexOf(findVal, startIndex);
if (index === -1) { 
index = text.indexOf(findVal, 0);
if (index === -1) {
alert("No matches found.");
return;
}
}
highlightRange(javascript, index, index + findVal.length);
lastJsFindOnlyIndex = index + findVal.length;
scrollSelectionIntoView(javascript);
}

function htmlFindNext() {
var html = document.getElementById("html");
var findVal = document.getElementById("htmlFindText").value;
if (!findVal) {
return;
}
var text = html.textContent;
var startIndex = lastHTMLFindIndex;
var sel = window.getSelection();
if (sel.rangeCount > 0 && sel.toString().length > 0) {
var range = sel.getRangeAt(0);
var preRange = document.createRange();
preRange.selectNodeContents(html);
preRange.setEnd(range.endContainer, range.endOffset);
startIndex = preRange.toString().length;
}
else {
var caretIndex = getCaretIndex(html);
if (caretIndex !== null) startIndex = caretIndex;
}
var index = text.indexOf(findVal, startIndex);
if (index === -1) { 
index = text.indexOf(findVal, 0);
if (index === -1) {
alert("No matches found.");
return;
}
}
highlightRange(html, index, index + findVal.length);
lastHTMLFindIndex = index + findVal.length;
scrollSelectionIntoView(html);
}

function cssFindNext() {
var css = document.getElementById("css");
var findVal = document.getElementById("cssFindText").value;
if (!findVal) {
return;
}
var text = css.textContent;
var startIndex = lastCSSFindIndex;
var sel = window.getSelection();
if (sel.rangeCount > 0 && sel.toString().length > 0) {
var range = sel.getRangeAt(0);
var preRange = document.createRange();
preRange.selectNodeContents(css);
preRange.setEnd(range.endContainer, range.endOffset);
startIndex = preRange.toString().length;
}
else {
var caretIndex = getCaretIndex(css);
if (caretIndex !== null) startIndex = caretIndex;
}
var index = text.indexOf(findVal, startIndex);
if (index === -1) { 
index = text.indexOf(findVal, 0);
if (index === -1) {
alert("No matches found.");
return;
}
}
highlightRange(css, index, index + findVal.length);
lastCSSFindIndex = index + findVal.length;
scrollSelectionIntoView(css);
}

function javascriptFindNext() {
var javascript = document.getElementById("javascript");
var findVal = document.getElementById("javascriptFindText").value;
if (!findVal) {
return;
}
var text = javascript.textContent;
var startIndex = lastJsFindIndex;
var sel = window.getSelection();
if (sel.rangeCount > 0 && sel.toString().length > 0) {
var range = sel.getRangeAt(0);
var preRange = document.createRange();
preRange.selectNodeContents(javascript);
preRange.setEnd(range.endContainer, range.endOffset);
startIndex = preRange.toString().length;
}
else {
var caretIndex = getCaretIndex(javascript);
if (caretIndex !== null) startIndex = caretIndex;
}
var index = text.indexOf(findVal, startIndex);
if (index === -1) { 
index = text.indexOf(findVal, 0);
if (index === -1) {
alert("No matches found.");
return;
}
}
highlightRange(javascript, index, index + findVal.length);
lastJsFindIndex = index + findVal.length;
scrollSelectionIntoView(javascript);
}

function htmlReplaceOne() {
var html = document.getElementById("html");
var findVal = document.getElementById("htmlFindText").value;
var replaceVal = document.getElementById("htmlReplaceText").value;
if (!findVal) {
return;
}
saveHTMLCodeSnapshot();
var text = html.textContent;
var startIndex = lastHTMLFindIndex;
var caretIndex = getCaretIndex(html);
if (caretIndex !== null) startIndex = caretIndex;
var index = text.indexOf(findVal, startIndex);
if (index === -1) {
index = text.indexOf(findVal, 0);
if (index === -1) {
alert("No matches found.");
return;
}
}
html.textContent = text.slice(0, index) + replaceVal + text.slice(index + findVal.length);
syntaxHighlightContentEditableElement(html, "html");
html.focus();
var sel = window.getSelection();
var range = document.createRange();
var charIndex = 0;
var endNode = null;
var walker = document.createTreeWalker(html, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
var node = walker.currentNode;
var nextIndex = charIndex + node.textContent.length;
if (!endNode && index + replaceVal.length <= nextIndex) {
endNode = node;
range.setStart(node, index + replaceVal.length - charIndex);
range.collapse(true);
break;
}
charIndex = nextIndex;
}
if (endNode) {
sel.removeAllRanges();
sel.addRange(range);
scrollSelectionIntoView(html);
}
lastHTMLFindIndex = index + replaceVal.length;
}

function cssReplaceOne() {
var css = document.getElementById("css");
var findVal = document.getElementById("cssFindText").value;
var replaceVal = document.getElementById("cssReplaceText").value;
if (!findVal) {
return;
}
saveCSSCodeSnapshot();
var text = css.textContent;
var startIndex = lastCSSFindIndex;
var caretIndex = getCaretIndex(css);
if (caretIndex !== null) startIndex = caretIndex;
var index = text.indexOf(findVal, startIndex);
if (index === -1) {
index = text.indexOf(findVal, 0);
if (index === -1) {
alert("No matches found.");
return;
}
}
css.textContent = text.slice(0, index) + replaceVal + text.slice(index + findVal.length);
syntaxHighlightContentEditableElement(css, "css");
css.focus();
var sel = window.getSelection();
var range = document.createRange();
var charIndex = 0;
var endNode = null;
var walker = document.createTreeWalker(css, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
var node = walker.currentNode;
var nextIndex = charIndex + node.textContent.length;
if (!endNode && index + replaceVal.length <= nextIndex) {
endNode = node;
range.setStart(node, index + replaceVal.length - charIndex);
range.collapse(true);
break;
}
charIndex = nextIndex;
}
if (endNode) {
sel.removeAllRanges();
sel.addRange(range);
scrollSelectionIntoView(css);
}
lastCSSFindIndex = index + replaceVal.length;
}

function javascriptReplaceOne() {
var javascript = document.getElementById("javascript");
var findVal = document.getElementById("javascriptFindText").value;
var replaceVal = document.getElementById("javascriptReplaceText").value;
if (!findVal) {
return;
}
saveJsCodeSnapshot();
var text = javascript.textContent;
var startIndex = lastJsFindIndex;
var caretIndex = getCaretIndex(javascript);
if (caretIndex !== null) startIndex = caretIndex;
var index = text.indexOf(findVal, startIndex);
if (index === -1) {
index = text.indexOf(findVal, 0);
if (index === -1) {
alert("No matches found.");
return;
}
}
javascript.textContent = text.slice(0, index) + replaceVal + text.slice(index + findVal.length);
syntaxHighlightContentEditableElement(javascript, "javascript");
javascript.focus();
var sel = window.getSelection();
var range = document.createRange();
var charIndex = 0;
var endNode = null;
var walker = document.createTreeWalker(javascript, NodeFilter.SHOW_TEXT);
while (walker.nextNode()) {
var node = walker.currentNode;
var nextIndex = charIndex + node.textContent.length;
if (!endNode && index + replaceVal.length <= nextIndex) {
endNode = node;
range.setStart(node, index + replaceVal.length - charIndex);
range.collapse(true);
break;
}
charIndex = nextIndex;
}
if (endNode) {
sel.removeAllRanges();
sel.addRange(range);
scrollSelectionIntoView(javascript);
}
lastJsFindIndex = index + replaceVal.length;
}

function htmlReplaceAll() {
var html = document.getElementById("html");
var findVal = document.getElementById("htmlFindText").value;
var replaceVal = document.getElementById("htmlReplaceText").value;
if (!findVal) {
return;
}
saveHTMLCodeSnapshot();
html.textContent = html.textContent.split(findVal).join(replaceVal);
syntaxHighlightContentEditableElement(html, "html");
lastHTMLFindOnlyIndex = 0;
lastHTMLFindIndex = 0;
html.blur();
alert("All occurrences replaced.");
}

function cssReplaceAll() {
var css = document.getElementById("css");
var findVal = document.getElementById("cssFindText").value;
var replaceVal = document.getElementById("cssReplaceText").value;
if (!findVal) {
return;
}
saveCSSCodeSnapshot();
css.textContent = css.textContent.split(findVal).join(replaceVal);
syntaxHighlightContentEditableElement(css, "css");
lastCSSFindOnlyIndex = 0;
lastCSSFindIndex = 0;
css.blur();
alert("All occurrences replaced.");
}

function javascriptReplaceAll() {
var javascript = document.getElementById("javascript");
var findVal = document.getElementById("javascriptFindText").value;
var replaceVal = document.getElementById("javascriptReplaceText").value;
if (!findVal) {
return;
}
saveJsCodeSnapshot();
javascript.textContent = javascript.textContent.split(findVal).join(replaceVal);
syntaxHighlightContentEditableElement(javascript, "javascript");
lastJsFindOnlyIndex = 0;
lastJsFindIndex = 0;
javascript.blur();
alert("All occurrences replaced.");
}

function saveHTMLCodeSnapshot() {
var html = document.getElementById("html");
var sel = window.getSelection();
var range = null;
if (sel.rangeCount > 0) {
var r = sel.getRangeAt(0);
if (html.contains(r.startContainer) && html.contains(r.endContainer)) {
range = r;
}
}
var snapshot = {
text: html.textContent,
selection: null,
scrollTop: html.scrollTop,
scrollLeft: html.scrollLeft
};
if (range) {
snapshot.selection = {
startContainerPath: getNodePath(range.startContainer, html),
startOffset: range.startOffset,
endContainerPath: getNodePath(range.endContainer, html),
endOffset: range.endOffset
};
}
htmlUndoStack.push(snapshot);
htmlRedoStack = [];
}

function saveCSSCodeSnapshot() {
var css = document.getElementById("css");
var sel = window.getSelection();
var range = null;
if (sel.rangeCount > 0) {
var r = sel.getRangeAt(0);
if (css.contains(r.startContainer) && css.contains(r.endContainer)) {
range = r;
}
}
var snapshot = {
text: css.textContent,
selection: null,
scrollTop: css.scrollTop,
scrollLeft: css.scrollLeft
};
if (range) {
snapshot.selection = {
startContainerPath: getNodePath(range.startContainer, css),
startOffset: range.startOffset,
endContainerPath: getNodePath(range.endContainer, css),
endOffset: range.endOffset
};
}
cssUndoStack.push(snapshot);
cssRedoStack = [];
}

function saveJsCodeSnapshot() {
var javascript = document.getElementById("javascript");
var sel = window.getSelection();
var range = null;
if (sel.rangeCount > 0) {
var r = sel.getRangeAt(0);
if (javascript.contains(r.startContainer) && javascript.contains(r.endContainer)) {
range = r;
}
}
var snapshot = {
text: javascript.textContent,
selection: null,
scrollTop: javascript.scrollTop,
scrollLeft: javascript.scrollLeft
};
if (range) {
snapshot.selection = {
startContainerPath: getNodePath(range.startContainer, javascript),
startOffset: range.startOffset,
endContainerPath: getNodePath(range.endContainer, javascript),
endOffset: range.endOffset
};
}
jsUndoStack.push(snapshot);
jsRedoStack = [];
}

function restoreHTMLSnapshot(snapshot) {
var html = document.getElementById("html");
if (snapshot.text !== undefined) {
html.textContent = snapshot.text;
syntaxHighlightContentEditableElement(html, "html");
updateText();
updateLineNumbers(html, document.getElementById('htmlLineList'));
}
if (typeof snapshot.scrollTop === "number") {
html.scrollTop = snapshot.scrollTop;
}
if (typeof snapshot.scrollLeft === "number") {
html.scrollLeft = snapshot.scrollLeft;
}
if (snapshot.selection) {
var sel = window.getSelection();
sel.removeAllRanges();
var range = document.createRange();
var startNode = getNodeFromPath(snapshot.selection.startContainerPath, html);
var endNode = getNodeFromPath(snapshot.selection.endContainerPath, html);
if (startNode && endNode) {
range.setStart(startNode, Math.min(snapshot.selection.startOffset, startNode.textContent.length));
range.setEnd(endNode, Math.min(snapshot.selection.endOffset, endNode.textContent.length));
sel.addRange(range);
}
}
}

function restoreCSSSnapshot(snapshot) {
var css = document.getElementById("css");
if (snapshot.text !== undefined) {
css.textContent = snapshot.text;
syntaxHighlightContentEditableElement(css, "css");
updateText();
updateLineNumbers(css, document.getElementById('cssLineList'));
}
if (typeof snapshot.scrollTop === "number") {
css.scrollTop = snapshot.scrollTop;
}
if (typeof snapshot.scrollLeft === "number") {
css.scrollLeft = snapshot.scrollLeft;
}
if (snapshot.selection) {
var sel = window.getSelection();
sel.removeAllRanges();
var range = document.createRange();
var startNode = getNodeFromPath(snapshot.selection.startContainerPath, css);
var endNode = getNodeFromPath(snapshot.selection.endContainerPath, css);
if (startNode && endNode) {
range.setStart(startNode, Math.min(snapshot.selection.startOffset, startNode.textContent.length));
range.setEnd(endNode, Math.min(snapshot.selection.endOffset, endNode.textContent.length));
sel.addRange(range);
}
}
}

function restoreJsSnapshot(snapshot) {
var javascript = document.getElementById("javascript");
if (snapshot.text !== undefined) {
javascript.textContent = snapshot.text;
syntaxHighlightContentEditableElement(javascript, "javascript");
updateText();
updateLineNumbers(javascript, document.getElementById('javascriptLineList'));
}
if (typeof snapshot.scrollTop === "number") {
javascript.scrollTop = snapshot.scrollTop;
}
if (typeof snapshot.scrollLeft === "number") {
javascript.scrollLeft = snapshot.scrollLeft;
}
if (snapshot.selection) {
var sel = window.getSelection();
sel.removeAllRanges();
var range = document.createRange();
var startNode = getNodeFromPath(snapshot.selection.startContainerPath, javascript);
var endNode = getNodeFromPath(snapshot.selection.endContainerPath, javascript);
if (startNode && endNode) {
range.setStart(startNode, Math.min(snapshot.selection.startOffset, startNode.textContent.length));
range.setEnd(endNode, Math.min(snapshot.selection.endOffset, endNode.textContent.length));
sel.addRange(range);
}
}
}

function getNodePath(node, root) {
var path = [];
while (node && node !== root) {
var parent = node.parentNode;
path.unshift(Array.from(parent.childNodes).indexOf(node));
node = parent;
}
return path;
}

function getNodeFromPath(path, root) {
var node = root;
for (var i = 0; i < path.length; i++) {
if (!node.childNodes[path[i]]) return null;
node = node.childNodes[path[i]];
}
return node;
}

function getCurrentHTMLSelectionSnapshot() {
var html = document.getElementById("html");
var sel = window.getSelection();
if (sel.rangeCount === 0) {
return null;
}
var range = sel.getRangeAt(0);
return {
startContainerPath: getNodePath(range.startContainer, html),
startOffset: range.startOffset,
endContainerPath: getNodePath(range.endContainer, html),
endOffset: range.endOffset
};
}

function getCurrentCSSSelectionSnapshot() {
var css = document.getElementById("css");
var sel = window.getSelection();
if (sel.rangeCount === 0) {
return null;
}
var range = sel.getRangeAt(0);
return {
startContainerPath: getNodePath(range.startContainer, css),
startOffset: range.startOffset,
endContainerPath: getNodePath(range.endContainer, css),
endOffset: range.endOffset
};
}

function getCurrentJsSelectionSnapshot() {
var javascript = document.getElementById("javascript");
var sel = window.getSelection();
if (sel.rangeCount === 0) {
return null;
}
var range = sel.getRangeAt(0);
return {
startContainerPath: getNodePath(range.startContainer, javascript),
startOffset: range.startOffset,
endContainerPath: getNodePath(range.endContainer, javascript),
endOffset: range.endOffset
};
}

function applyHTMLSnapshot(fromStack, toStack) {
var html = document.getElementById("html");
if (fromStack.length === 0) {
return;
}
var snapshot = fromStack.pop();
toStack.push({
text: html.textContent,
selection: getCurrentHTMLSelectionSnapshot(),
scrollTop: html.scrollTop,
scrollLeft: html.scrollLeft
});
restoreHTMLSnapshot(snapshot);
document.getElementById("editorPane").scrollIntoView({
behavior: "smooth",
block: "start"
});
}

function applyCSSSnapshot(fromStack, toStack) {
var css = document.getElementById("css");
if (fromStack.length === 0) {
return;
}
var snapshot = fromStack.pop();
toStack.push({
text: css.textContent,
selection: getCurrentCSSSelectionSnapshot(),
scrollTop: css.scrollTop,
scrollLeft: css.scrollLeft
});
restoreCSSSnapshot(snapshot);
document.getElementById("editorPane").scrollIntoView({
behavior: "smooth",
block: "start"
});
}

function applyJsSnapshot(fromStack, toStack) {
var javascript = document.getElementById("javascript");
if (fromStack.length === 0) {
return;
}
var snapshot = fromStack.pop();
toStack.push({
text: javascript.textContent,
selection: getCurrentJsSelectionSnapshot(),
scrollTop: javascript.scrollTop,
scrollLeft: javascript.scrollLeft
});
restoreJsSnapshot(snapshot);
document.getElementById("editorPane").scrollIntoView({
behavior: "smooth",
block: "start"
});
}

function HTMLUndo() {
applyHTMLSnapshot(htmlUndoStack, htmlRedoStack);
}

function CSSUndo() {
applyCSSSnapshot(cssUndoStack, cssRedoStack);
}

function JsUndo() {
applyJsSnapshot(jsUndoStack, jsRedoStack);
}

function HTMLRedo() {
applyHTMLSnapshot(htmlRedoStack, htmlUndoStack);
}

function CSSRedo() {
applyCSSSnapshot(cssRedoStack, cssUndoStack);
}

function JsRedo() {
applyJsSnapshot(jsRedoStack, jsUndoStack);
}

function showCodes() {
if (invalidArray(JSON.parse(localStorage.getItem("HEcodes")))) {
localStorage.setItem("HEcodes", "[]");
}
var allCodes = document.getElementById("allCodes");
var storedCodes = JSON.parse(localStorage.getItem("HEcodes"));
var codesLength = document.getElementById("codesLength");
allCodes.innerHTML = null;
storedCodes.forEach(code => {
allCodes.innerHTML += "<li><span id='" + code.codeName + "' style='cursor: pointer; color: red;' onclick='openCode(this)' oncontextmenu='openFileMenu(event, this); document.getElementById(`fileMenu`).style.color = `black`;'>" + code.codeName.textify() + "</span> <span style='cursor: pointer;' onclick='deleteCode(this)'>[x]</span></li>";
});
codesLength.innerHTML = "You have saved " + storedCodes.length + " code(s)."
}

function openCode(anyCode) {
var codeName = document.getElementById("codeName");
var html = document.getElementById("html");
var css = document.getElementById("css");
var javascript = document.getElementById("javascript");
var confirmOpenCode;
if (html.textContent.length > 0 || css.textContent.length > 0 || javascript.textContent.length > 0) {
confirmOpenCode = confirm("Are you sure you want to open this code? Changes may not be saved.");
if (confirmOpenCode == true) {
blankCodeWithoutConfirmation();
codeName.value = anyCode.textContent;
html.innerHTML = retreiveCodeFromLocalStorage(anyCode.textContent).html.textify();
css.innerHTML = retreiveCodeFromLocalStorage(anyCode.textContent).css.textify();
javascript.innerHTML = retreiveCodeFromLocalStorage(anyCode.textContent).javascript.textify();
runCode();
document.title = anyCode.textContent + " - " + defaultTitle;
syntaxHighlight(html, "html");
syntaxHighlight(css, "css");
syntaxHighlight(javascript, "javascript");
window.onbeforeunload = null;
}
}
else {
blankCodeWithoutConfirmation();
codeName.value = anyCode.textContent;
html.innerHTML = retreiveCodeFromLocalStorage(anyCode.textContent).html.textify();
css.innerHTML = retreiveCodeFromLocalStorage(anyCode.textContent).css.textify();
javascript.innerHTML = retreiveCodeFromLocalStorage(anyCode.textContent).javascript.textify();
runCode();
document.title = anyCode.textContent + " - " + defaultTitle;
syntaxHighlight(html, "html");
syntaxHighlight(css, "css");
syntaxHighlight(javascript, "javascript");
window.onbeforeunload = null;
}
}

function openFileMenu(e, anyCode) {
var fileMenu = document.getElementById("fileMenu");
var open = document.getElementById("open");
var del = document.getElementById("del");
var download = document.getElementById("download");
var copyCodeName = document.getElementById("copyCodeName");
var copyHTML = document.getElementById("copyHTML");
var copyCSS = document.getElementById("copyCSS");
var copyJavascript = document.getElementById("copyJavascript");
e.preventDefault();
fileMenu.style.left = e.pageX + "px";
fileMenu.style.top = e.pageY + "px";
fileMenu.style.display = "block";
open.setAttribute("onclick", "openCode(document.getElementById('" + anyCode.id + "'))");
del.setAttribute("onclick", "deleteCode(document.getElementById('" + anyCode.id + "'))");
download.setAttribute("onclick", "downloadCode('" + anyCode.id + "', retreiveCodeFromLocalStorage('" + anyCode.id + "').html, retreiveCodeFromLocalStorage('" + anyCode.id + "').css, retreiveCodeFromLocalStorage('" + anyCode.id + "').javascript)");
copyCodeName.setAttribute("onclick", "copyCodeName(document.getElementById('" + anyCode.id + "'))");
copyHTML.setAttribute("onclick", "copyHTML(document.getElementById('" + anyCode.id + "'))");
copyCSS.setAttribute("onclick", "copyCSS(document.getElementById('" + anyCode.id + "'))");
copyJavascript.setAttribute("onclick", "copyJavascript(document.getElementById('" + anyCode.id + "'))");
document.addEventListener("click", function() {
fileMenu.removeAttribute("style");
document.querySelectorAll("#fileMenu div").forEach(function(menuItem) {
menuItem.removeAttribute("onclick");
});
fileMenu.style.display = "none";
});
}

function copyCodeName(anyCode) {
var textarea = document.createElement("textarea");
document.body.appendChild(textarea);
textarea.textContent = anyCode.textContent;
textarea.select();
document.execCommand("copy");
document.body.removeChild(textarea);
alert("Code name copied successfully.");
}

function copyHTML(anyCode) {
var textarea = document.createElement("textarea");
document.body.appendChild(textarea);
textarea.value = retreiveCodeFromLocalStorage(anyCode.textContent).html;
textarea.select();
document.execCommand("copy");
document.body.removeChild(textarea);
alert("HTML copied successfully.");
}

function copyCSS(anyCode) {
var textarea = document.createElement("textarea");
document.body.appendChild(textarea);
textarea.value = retreiveCodeFromLocalStorage(anyCode.textContent).css;
textarea.select();
document.execCommand("copy");
document.body.removeChild(textarea);
alert("CSS copied successfully.");
}

function copyJavascript(anyCode) {
var textarea = document.createElement("textarea");
document.body.appendChild(textarea);
textarea.value = retreiveCodeFromLocalStorage(anyCode.textContent).javascript;
textarea.select();
document.execCommand("copy");
document.body.removeChild(textarea);
alert("Javascript copied successfully.");
}

function deleteCode(anyCode) {
var codeName = document.getElementById("codeName");
var html = document.getElementById("html");
var confirmDeleteCode = confirm("Are you sure you want to delete this code?");
if (confirmDeleteCode == true) {
if (html.textContent == retreiveCodeFromLocalStorage(anyCode.parentElement.firstElementChild.textContent).html && css.textContent == retreiveCodeFromLocalStorage(anyCode.parentElement.firstElementChild.textContent).css && javascript.textContent == retreiveCodeFromLocalStorage(anyCode.parentElement.firstElementChild.textContent).javascript && codeName.value == anyCode.parentElement.firstElementChild.textContent) {
blankCodeWithoutConfirmation();
}
deleteCodeFromLocalStorage(anyCode.parentElement.firstElementChild.textContent);
showCodes();
}
}

async function AIdebugger() {
var htmlCode = document.getElementById("html").innerText.trim();
var cssCode = document.getElementById("css").innerText.trim();
var jsCode = document.getElementById("javascript").innerText.trim();
var debuggerPanel = document.getElementById("debuggerPanel");
var fixedHTML = document.getElementById("fixedHTML");
var fixedCSS = document.getElementById("fixedCSS");
var fixedJavascript = document.getElementById("fixedJavascript");
debuggerPanel.innerHTML = "Please wait while we process your code...";
fixedHTML.textContent = "";
fixedCSS.textContent = "";
fixedJavascript.textContent = "";
await fetch("https://html-editor-backend.vercel.app/").catch(() => {});
var res = await fetch("https://html-editor-backend.vercel.app/debug", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
html: htmlCode,
css: cssCode,
javascript: jsCode,
}),
});
if (!res.ok) {
debuggerPanel.innerHTML = `<div class="error-text">Error ${res.status}</div>`;
return;
}
var data = await res.json();
var { errors, fixes, fixedHTMLCode, fixedCSSCode, fixedJsCode, remainingRequests } = data;
if (!errors || errors.trim() === "") {
var requestsRemaining = remainingRequests;
var msg;
if (requestsRemaining == null) {
msg = "AI model used for debugging is currently overloaded. Please try again later.";
}
else if (parseInt(requestsRemaining) === 0) {
msg = "Your 50-request limit is over for today. Please try again tomorrow.";
}
debuggerPanel.innerHTML = `<div class="error-text">${msg}</div>`;
return;
}
debuggerPanel.innerHTML = `<div class="error-text"><u>ERRORS:</u><br>${errors.textify()}</div>
<div class="fix-text"><u>SUGGESTED FIXES:</u><br>${fixes.textify()}</div>`;
fixedHTML.innerHTML = `<u><div style="display: flex;"><span class="fix-text">FULL FIXED HTML:</span><span style="color: #808080; margin-left: auto; cursor: pointer;" onclick="copyFixedHTML()">Copy Fixed HTML</span></div></u><br><span id="mainFixedHTML">${fixedHTMLCode.textify()}</span>`;
fixedCSS.innerHTML = `<u><div style="display: flex;"><span class="fix-text">FULL FIXED CSS:</span><span style="color: #808080; margin-left: auto; cursor: pointer;" onclick="copyFixedCSS()">Copy Fixed CSS</span></div></u><br><span id="mainFixedCSS">${fixedCSSCode.textify()}</span>`;
fixedJavascript.innerHTML = `<u><div style="display: flex;"><span class="fix-text">FULL FIXED JAVASCRIPT:</span><span style="color: #808080; margin-left: auto; cursor: pointer;" onclick="copyFixedJavascript()">Copy Fixed Javascript</span></div></u><br><span id="mainFixedJavascript">${fixedJsCode.textify()}</span>`;
syntaxHighlight(document.getElementById("mainFixedHTML"), "html");
syntaxHighlight(document.getElementById("mainFixedCSS"), "css");
syntaxHighlight(document.getElementById("mainFixedJavascript"), "javascript");
}

function copyFixedHTML() {
var textarea = document.createElement("textarea");
var fixedHTML = document.getElementById("mainFixedHTML");
document.body.appendChild(textarea);
textarea.value = fixedHTML.textContent;
textarea.select();
document.execCommand("copy");
document.body.removeChild(textarea);
alert("Fixed HTML copied successfully.");
}

function copyFixedCSS() {
var textarea = document.createElement("textarea");
var fixedCSS = document.getElementById("mainFixedCSS");
document.body.appendChild(textarea);
textarea.value = fixedCSS.textContent;
textarea.select();
document.execCommand("copy");
document.body.removeChild(textarea);
alert("Fixed CSS copied successfully.");
}

function copyFixedJavascript() {
var textarea = document.createElement("textarea");
var fixedJavascript = document.getElementById("mainFixedJavascript");
document.body.appendChild(textarea);
textarea.value = fixedJavascript.textContent;
textarea.select();
document.execCommand("copy");
document.body.removeChild(textarea);
alert("Fixed Javascript copied successfully.");
}

function runCode() {
var html = document.getElementById("html");
var css = document.getElementById("css");
var javascript = document.getElementById("javascript");
var result = document.getElementById("result");
var srcCode = html.innerText;
srcCode += "<style>" + css.textContent.replace(/<\/(style)>/gi, '<\\/$1>') + "</style><script>" + javascript.textContent.replace(/<\/(script)>/gi, '<\\/$1>') + "</script>";
updateLineNumbers(html, document.getElementById("htmlLineList"));
updateLineNumbers(css, document.getElementById("cssLineList"));
updateLineNumbers(javascript, document.getElementById("javascriptLineList"));
result.srcdoc = srcCode;
result.focus();
document.getElementById("editorPane").scrollIntoView({
behavior: "smooth",
block: "start"
});
}

function frameFullScreen() {
var result = document.getElementById("result");
var frameContainer = document.getElementById("frameContainer");
if (document.fullscreenElement === frameContainer) {
if (document.exitFullscreen) {
document.exitFullscreen();
result.focus();
}
else if (document.webkitExitFullscreen) {
document.webkitExitFullscreen();
result.focus();
}
else if (document.msExitFullscreen) {
document.msExitFullscreen();
result.focus();
}
}
else {
if (frameContainer.requestFullscreen) {
frameContainer.requestFullscreen();
result.focus();
}
else if (frameContainer.webkitRequestFullscreen) {
frameContainer.webkitRequestFullscreen();
result.focus();
}
else if (frameContainer.msRequestFullscreen) {
frameContainer.msRequestFullscreen();
result.focus();
}
}
}

function clearDebuggerPanel() {
document.getElementById("debuggerPanel").innerHTML = "";
document.getElementById("fixedHTML").innerHTML = "";
document.getElementById("fixedCSS").innerHTML = "";
document.getElementById("fixedJavascript").innerHTML = "";
}

function saveCode() {
var codeName = document.getElementById("codeName");
var html = document.getElementById("html");
var css = document.getElementById("css");
var javascript = document.getElementById("javascript");
if (codeName.value.endsWith(".code")) {
saveCodeToLocalStorage(codeName.value, html.textContent, css.textContent, javascript.textContent);
}
else {
saveCodeToLocalStorage(codeName.value + ".code", html.textContent, css.textContent, javascript.textContent);
}
showCodes();
blankCodeWithoutConfirmation();
}

function downloadCode(codeName, htmlCode, cssCode, javascriptCode) {
html = htmlCode;
css = cssCode;
js = javascriptCode;
function mainDownloadZip(baseName, htmlContent, cssContent, jsContent, htmlFileName, cssFileName, jsFileName) {
var zip = new JSZip();
zip.file(htmlFileName, htmlContent);
zip.file(cssFileName, cssContent);
zip.file(jsFileName, jsContent);
zip.generateAsync({ type: "blob" }).then((content) => {
var link = document.createElement("a");
link.href = URL.createObjectURL(content);
link.download = baseName + ".zip";
link.click();
URL.revokeObjectURL(link.href);
});
}
if (codeName.endsWith(".code")) {
var frame = document.createElement("iframe");
var style = document.createElement("link");
var script = document.createElement("script");
style.rel = "stylesheet";
style.href = codeName.replaceLastPortion(".code", ".css");
script.src = codeName.replaceLastPortion(".code", ".js");
frame.style.display = "none";
document.body.appendChild(frame);
frame.srcdoc = html;
frame.onload = function() {
var doc = frame.contentDocument;
doc.head.appendChild(style);
doc.body.appendChild(script);
html = doc.documentElement.outerHTML;
frame.remove();
mainDownloadZip(codeName.replaceLastPortion(".code", ""), html, css, js, codeName.replaceLastPortion(".code", ".html"), codeName.replaceLastPortion(".code", ".css"), codeName.replaceLastPortion(".code", ".js"));
}
}
else if (codeName.trim() === "") {
var frame = document.createElement("iframe");
var style = document.createElement("link");
var script = document.createElement("script");
style.rel = "stylesheet";
style.href = "cssCode.css";
script.src = "javascriptCode.js";
frame.style.display = "none";
document.body.appendChild(frame);
frame.srcdoc = html;
frame.onload = function() {
var doc = frame.contentDocument;
doc.head.appendChild(style);
doc.body.appendChild(script);
html = doc.documentElement.outerHTML;
frame.remove();
mainDownloadZip(codeName.replaceLastPortion(".code", ""), html, css, js, "htmlCode.html", "cssCode.css", "javascriptCode.js");
}
}
else {
var frame = document.createElement("iframe");
var style = document.createElement("link");
var script = document.createElement("script");
style.rel = "stylesheet";
style.href = codeName + ".css";
script.src = codeName + ".js";
frame.style.display = "none";
document.body.appendChild(frame);
frame.srcdoc = html;
frame.onload = function() {
var doc = frame.contentDocument;
doc.head.appendChild(style);
doc.body.appendChild(script);
html = doc.documentElement.outerHTML;
frame.remove();
mainDownloadZip(codeName.replaceLastPortion(".code", ""), html, css, js, codeName + ".html", codeName + ".css", codeName + ".js");
}
}
}

function uploadCode() {
var html = document.getElementById("html");
var css = document.getElementById("css");
var javascript = document.getElementById("javascript");
var fileInput = document.createElement("input");
alert("Please make sure you upload exactly 3 files: one HTML, one CSS and one Javascript.");
fileInput.type = "file";
fileInput.accept = ".html,.css,.js,.txt,text/html,text/css,application/javascript";
fileInput.multiple = true;
fileInput.click();
fileInput.onchange = function () {
if (!this.files.length) {
return;
}
var files = Array.from(this.files);
if (files.length !== 3) {
alert("You must select exactly 3 files.");
return;
}
var fileTypes = {
html: null,
css: null,
js: null
};
files.forEach(file => {
var extension = file.name.split(".").pop().toLowerCase();
if (extension === "html" || extension === "htm") {
fileTypes.html = file;
}
else if (extension === "css") {
fileTypes.css = file;
}
else if (extension === "js") {
fileTypes.js = file;
}
else {
alert("Only HTML, CSS and Javascript files are allowed.");
return;
}
});
if (!fileTypes.html || !fileTypes.css || !fileTypes.js) {
alert("You must select exactly one HTML file, one CSS file, and one JavaScript file.");
return;
}
function loadFile(file, type) {
var reader = new FileReader();
reader.onload = function () {
var content = reader.result.textify();
if (type === "html") {
html.innerHTML = content;
syntaxHighlight(html, "html");
}
else if (type === "css") {
css.innerHTML = content;
syntaxHighlight(css, "css");
}
else if (type === "js") {
javascript.innerHTML = content;
syntaxHighlight(javascript, "javascript");
}
updateText();
runCode();
}
reader.readAsText(file);
}
if (html.textContent.length > 0 || css.textContent.length > 0 || javascript.textContent.length > 0) {
var confirmUpload = confirm("Are you sure you want to upload this code? Changes may not be saved.");
if (confirmUpload) {
loadFile(fileTypes.html, "html");
loadFile(fileTypes.css, "css");
loadFile(fileTypes.js, "js");
}
}
else {
loadFile(fileTypes.html, "html");
loadFile(fileTypes.css, "css");
loadFile(fileTypes.js, "js");
}
}
}

function blankCode() {
var codeName = document.getElementById("codeName");
var html = document.getElementById("html");
var css = document.getElementById("css");
var javascript = document.getElementById("javascript");
var confirmNewCode;
if (html.textContent.length > 0 || css.textContent.length > 0 || javascript.textContent.length > 0) {
confirmNewCode = confirm("Are you sure you want to open a blank code? Changes may not be saved.");
if (confirmNewCode == true) {
codeName.value = null;
html.innerHTML = null;
css.innerHTML = null;
javascript.innerHTML = null;
runCode();
document.title = defaultTitle;
updateText();
syntaxHighlight(html, "html");
syntaxHighlight(css, "css");
syntaxHighlight(javascript, "javascript");
clearDebuggerPanel();
htmlUndoStack = [];
htmlRedoStack = [];
cssUndoStack = [];
cssRedoStack = [];
jsUndoStack = [];
jsRedoStack = [];
lastHTMLFindOnlyIndex = 0;
lastHTMLFindIndex = 0;
lastCSSFindOnlyIndex = 0;
lastCSSFindIndex = 0;
lastJsFindOnlyIndex = 0;
lastJsFindIndex = 0;
document.getElementById("htmlFindOnlyInput").value = "";
document.getElementById("htmlFindText").value = "";
document.getElementById("htmlReplaceText").value = "";
document.getElementById("cssFindOnlyInput").value = "";
document.getElementById("cssFindText").value = "";
document.getElementById("cssReplaceText").value = "";
document.getElementById("javascriptFindOnlyInput").value = "";
document.getElementById("javascriptFindText").value = "";
document.getElementById("javascriptReplaceText").value = "";
closeFindReplacePanels();
}
}
else {
codeName.value = null;
html.innerHTML = null;
css.innerHTML = null;
javascript.innerHTML = null;
runCode();
document.title = defaultTitle;
updateText();
syntaxHighlight(html, "html");
syntaxHighlight(css, "css");
syntaxHighlight(javascript, "javascript");
clearDebuggerPanel();
htmlUndoStack = [];
htmlRedoStack = [];
cssUndoStack = [];
cssRedoStack = [];
jsUndoStack = [];
jsRedoStack = [];
lastHTMLFindOnlyIndex = 0;
lastHTMLFindIndex = 0;
lastCSSFindOnlyIndex = 0;
lastCSSFindIndex = 0;
lastJsFindOnlyIndex = 0;
lastJsFindIndex = 0;
document.getElementById("htmlFindOnlyInput").value = "";
document.getElementById("htmlFindText").value = "";
document.getElementById("htmlReplaceText").value = "";
document.getElementById("cssFindOnlyInput").value = "";
document.getElementById("cssFindText").value = "";
document.getElementById("cssReplaceText").value = "";
document.getElementById("javascriptFindOnlyInput").value = "";
document.getElementById("javascriptFindText").value = "";
document.getElementById("javascriptReplaceText").value = "";
closeFindReplacePanels();
}
}

function blankCodeWithoutConfirmation() {
var codeName = document.getElementById("codeName");
var html = document.getElementById("html");
var css = document.getElementById("css");
var javascript = document.getElementById("javascript");
codeName.value = null;
html.innerHTML = null;
css.innerHTML = null;
javascript.innerHTML = null;
runCode();
document.title = defaultTitle;
updateText();
syntaxHighlight(html, "html");
syntaxHighlight(css, "css");
syntaxHighlight(javascript, "javascript");
clearDebuggerPanel();
htmlUndoStack = [];
htmlRedoStack = [];
cssUndoStack = [];
cssRedoStack = [];
jsUndoStack = [];
jsRedoStack = [];
lastHTMLFindOnlyIndex = 0;
lastHTMLFindIndex = 0;
lastCSSFindOnlyIndex = 0;
lastCSSFindIndex = 0;
lastJsFindOnlyIndex = 0;
lastJsFindIndex = 0;
document.getElementById("htmlFindOnlyInput").value = "";
document.getElementById("htmlFindText").value = "";
document.getElementById("htmlReplaceText").value = "";
document.getElementById("cssFindOnlyInput").value = "";
document.getElementById("cssFindText").value = "";
document.getElementById("cssReplaceText").value = "";
document.getElementById("javascriptFindOnlyInput").value = "";
document.getElementById("javascriptFindText").value = "";
document.getElementById("javascriptReplaceText").value = "";
closeFindReplacePanels();
}

function openTutorial() {
var codeName = document.getElementById("codeName");
var html = document.getElementById("html");
var css = document.getElementById("css");
var javascript = document.getElementById("javascript");
var confirmOpenTutorial;
var forLoop = document.getElementById("forLoop");
var randomNumberShow = document.getElementById("randomNumberShow");
var jsCanvas = document.getElementById("jsCanvas");
var propertyAsAFunctionInJs = document.getElementById("propertyAsAFunctionInJs");
var jsAlert = document.getElementById("jsAlert");
var creatingASyntaxHighlighter = document.getElementById("creatingASyntaxHighlighter");
var forLoopHTML = `<!DOCTYPE html>
<html>
<body>
<h1>For Loop</h1>
<p>Click on the "Click me" button to show all the items in an array called "myArray".</p>
<button onclick="showArrayItems()">Click Me</button>
<ol id="showItems"></ol>
</body>
</html>`;
var forLoopCSS = `body {
font-family: Arial, sans-serif;
text-align: center;
margin: 0;
padding: 20px;
background: #f4f4f4;
}

button {
padding: 10px 15px;
background: #007BFF;
color: white;
border: none;
border-radius: 5px;
cursor: pointer;
}

button:hover {
background: #0056b3;
}

ol {
text-align: left;
padding-left: 20px;
list-style-type: decimal;
}`;
var forLoopJs = `function showArrayItems() {
var myArray = ["Bugatti", "Koenigsegg Jesko", "McLaren", "Tesla", "Lamborghini", "Ferrari", "Porsche", "Mercedes Benz", "BMW", "Audi", "Pagani", "Maserati"];
var showItems = document.getElementById("showItems");
showItems.textContent = "";
for (var i = 0; i < myArray.length; i++) {
var li = document.createElement("li");
li.textContent = myArray[i];
showItems.appendChild(li);
}
}`
var randomNumberShowHTML = `<!DOCTYPE html>
<html>
<body>
<h1>Random Number Show</h1>
<ul>
<li>Minimum: <input type="number" id="min"></li>
<li>Maximum: <input type="number" id="max"></li>
</ul>
<button onclick="showRandomNumber()">Show random number</button>
<p id="show"></p>
</body>
</html>`;
var randomNumberShowCSS = `body {
font-family: Arial, sans-serif;
text-align: center;
padding: 20px;
background: #f4f4f4;
}

input {
padding: 5px;
width: 80px;
}

button {
padding: 10px;
background: #007BFF;
color: white;
border: none;
border-radius: 5px;
cursor: pointer;
}

button:hover {
background: #0056b3;
}

p {
margin-top: 20px;
font-size: 1.2rem;
}

ul {
text-align: left;
}`;
var randomNumberShowJs = `function showRandomNumber() {
var min = Number(document.getElementById("min").value);
var max = Number(document.getElementById("max").value);
if (min < max) {
document.getElementById("show").textContent = Math.floor(Math.random() * (max - min + 1) + min);
}
else {
document.getElementById("show").textContent = "The minimum value is not lesser than the maximum value. Please try again.";
}
}`;
var jsCanvasHTML = `<!DOCTYPE html>
<html>
<body>
<h1>JS Canvas</h1>
<button onclick="draw()">Draw on canvas</button><br>
<canvas id="canvas" height="200" width="200" style="border: 1px solid black;"></canvas>
</body>
</html>`;
var jsCanvasCSS = `body {
font-family: Arial, sans-serif;
text-align: center;
padding: 20px;
background: #f4f4f4;
}

button {
padding: 10px;
background: #007BFF;
color: white;
border: none;
border-radius: 5px;
cursor: pointer;
margin-bottom: 20px;
}

button:hover {
background: #0056b3;
}

canvas {
margin-top: 20px;
border: 1px solid #333;
}`;
var jsCanvasJs = `function draw() {
var ctx = document.getElementById("canvas").getContext("2d");
ctx.clearRect(0, 0, 200, 200);
ctx.fillStyle = "green";
ctx.fillRect(Math.floor(Math.random() * (161 - 40)), Math.floor(Math.random() * (161 - 40)), 40, 40);
}`;
var propertyAsAFunctionInJsHTML = `<!DOCTYPE html>
<html>
<body>
<h1>Property As A Function In JS</h1>
<p>Clicking the "Colour Text" button will call a property function called String.colored().</p>
<button onclick="document.getElementById('colorText').innerHTML = 'Sample Text'.colored('green')">Colour Text</button>
<p id="colorText"></p>
</body>
</html>`;
var propertyAsAFunctionInJsCSS = `body {
font-family: Arial, sans-serif;
text-align: center;
padding: 20px;
background: #f4f4f4;
}

button {
padding: 10px;
background: #007BFF;
color: white;
border: none;
border-radius: 5px;
cursor: pointer;
}

button:hover {
background: #0056b3;
}

.colored-text {
padding: 5px;
}

p {
font-size: 1.1rem;
margin-top: 20px;
}`;
var propertyAsAFunctionInJsJs = `String.prototype.colored = function(color) {
return "<span class='colored-text' style='color: " + color + "'>" + this + "</span>";
}`;
var jsAlertHTML = `<!DOCTYPE html>
<html>
<body>
<h1>JS Alert</h1>
<button onclick="showMessage('Hi! This is an alert box!')">Click me</button>
</body>
</html>`;
var jsAlertCSS = `body {
font-family: Arial, sans-serif;
text-align: center;
padding: 20px;
background: #f4f4f4;
}

button {
padding: 10px 20px;
background: #007BFF;
color: white;
border: none;
border-radius: 5px;
cursor: pointer;
}

button:hover {
background: #0056b3;
}`;
var jsAlertJs = `function showMessage(message) {
alert(message);
}`;
var creatingASyntaxHighlighterHTML = `<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="https://shemgeorge.github.io/HTMLEditor/appSyntaxHighlighting.css">
<script src="https://shemgeorge.github.io/HTMLEditor/appSyntaxHighlighting.js"></script>
</head>
<body>
<h1>Creating A Syntax Highlighter</h1>
<p>For this, we will be using HTMLEditor's own syntax highlighter.</p>
Theme: <select id="theme" onchange="changeTheme(); syntaxHighlight(document.getElementById('html'), 'html'); syntaxHighlight(document.getElementById('css'), 'css'); syntaxHighlight(document.getElementById('javascript'), 'javascript');">
<option value="light">Light Theme</option>
<option value="dark">Dark Theme</option>
</select>
<div class="code-wrapper">
<div class="line-numbers">
<ol id="HTMLLineList"></ol>
</div>
<div class="code" id="html" oninput="syntaxHighlightContentEditableElement(this, 'html'); updateLineNumbers(this, document.getElementById('HTMLLineList'));" contentEditable="plaintext-only" spellcheck="false" placeholder="HTML"></div>
</div>
<div class="code-wrapper">
<div class="line-numbers">
<ol id="CSSLineList"></ol>
</div>
<div class="code" id="css" oninput="syntaxHighlightContentEditableElement(this, 'css'); updateLineNumbers(this, document.getElementById('CSSLineList'));" contentEditable="plaintext-only" spellcheck="false" placeholder="CSS"></div>
</div>
<div class="code-wrapper">
<div class="line-numbers">
<ol id="JSLineList"></ol>
</div>
<div class="code" id="javascript" oninput="syntaxHighlightContentEditableElement(this, 'javascript'); updateLineNumbers(this, document.getElementById('JSLineList'));" contentEditable="plaintext-only" spellcheck="false" placeholder="Javascript"></div>
</div>
</body>
</html>`;
var creatingASyntaxHighlighterCSS = `body {
font-family: Arial, sans-serif;
text-align: center;
padding: 20px;
background: #f4f4f4;
}

button {
padding: 10px 20px;
background: #007BFF;
color: white;
border: none;
border-radius: 5px;
cursor: pointer;
margin-bottom: 20px;
}

button:hover {
background: #0056b3;
}

.code-wrapper {
display: flex;
width: 645px;
height: 172px;
border: 1px solid #ccc;
background: white;
box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
margin: 20px auto;
}

.line-numbers {
width: 40px;
height: 138px;
background-color: white;
padding: 10px;
text-align: right;
color: #666;
overflow: hidden;
font-family: 'Courier New';
font-size: 13px;
line-height: 15.6px;
}

.line-numbers ol {
list-style: decimal;
padding: 0;
margin: 0;
}

.line-numbers li {
padding-right: 5px;
}

.code {
text-align: left;
white-space: pre;
font-family: 'Courier New';
font-size: 13px;
line-height: 15.6px;
width: 600px;
height: 150px;
padding: 10px;
border: 1px solid black;
overflow-y: auto;
overflow-x: auto;
}

.code:focus {
outline: 0px solid transparent;
}

.code:empty:before {
content: attr(placeholder);
color: grey;
}`;
var creatingASyntaxHighlighterJs = `window.onload = function() {
updateLineNumbers(document.getElementById("html"), document.getElementById("HTMLLineList"));
updateLineNumbers(document.getElementById("css"), document.getElementById("CSSLineList"));
updateLineNumbers(document.getElementById("javascript"), document.getElementById("JSLineList"));
document.getElementById("html").addEventListener("scroll", function() {
document.getElementById("HTMLLineList").parentElement.scrollTop = document.getElementById("html").scrollTop;
});
document.getElementById("css").addEventListener("scroll", function() {
document.getElementById("CSSLineList").parentElement.scrollTop = document.getElementById("css").scrollTop;
});
document.getElementById("javascript").addEventListener("scroll", function() {
document.getElementById("JSLineList").parentElement.scrollTop = document.getElementById("javascript").scrollTop;
});
}

function changeTheme() {
var theme = document.getElementById("theme");
if (theme.value === "light") {
document.getElementById("html").style.background = "white";
document.getElementById("css").style.background = "white";
document.getElementById("javascript").style.background = "white";
document.getElementById("html").style.color = "black";
document.getElementById("css").style.color = "black";
document.getElementById("javascript").style.color = "black";
}
if (theme.value === "dark") {
document.getElementById("html").style.background = "rgb(60, 60, 60)";
document.getElementById("css").style.background = "rgb(60, 60, 60)";
document.getElementById("javascript").style.background = "rgb(60, 60, 60)";
document.getElementById("html").style.color = "white";
document.getElementById("css").style.color = "white";
document.getElementById("javascript").style.color = "white";
}
}`;
if (html.textContent.length > 0 || css.textContent > 0 || javascript.textContent > 0) {
confirmOpenTutorial = confirm("Are you sure you want to open this tutorial? Changes may not be saved.");
if (confirmOpenTutorial == true) {
blankCodeWithoutConfirmation();
if (forLoop.selected == true) {
html.textContent = forLoopHTML;
css.textContent = forLoopCSS;
javascript.textContent = forLoopJs;
codeName.value = "For Loop (Tutorial)";
document.title = "For Loop (Tutorial) - " + defaultTitle;
}
else if (randomNumberShow.selected == true) {
html.textContent = randomNumberShowHTML;
css.textContent = randomNumberShowCSS;
javascript.textContent = randomNumberShowJs;
codeName.value = "Random Number Show (Tutorial)";
document.title = "Random Number Show (Tutorial) - " + defaultTitle;
}
else if (jsCanvas.selected == true) {
html.textContent = jsCanvasHTML;
css.textContent = jsCanvasCSS;
javascript.textContent = jsCanvasJs;
codeName.value = "JS Canvas (Tutorial)";
document.title = "JS Canvas (Tutorial) - " + defaultTitle;
}
else if (propertyAsAFunctionInJs.selected == true) {
html.textContent = propertyAsAFunctionInJsHTML;
css.textContent = propertyAsAFunctionInJsCSS;
javascript.textContent = propertyAsAFunctionInJsJs;
codeName.value = "Property As A Function In JS (Tutorial)";
document.title = "Property As A Function In JS (Tutorial) - " + defaultTitle;
}
else if (jsAlert.selected == true) {
html.textContent = jsAlertHTML;
css.textContent = jsAlertCSS;
javascript.textContent = jsAlertJs;
codeName.value = "JS Alert (Tutorial)";
document.title = "JS Alert (Tutorial) - " + defaultTitle;
}
else if (creatingASyntaxHighlighter.selected == true) {
html.textContent = creatingASyntaxHighlighterHTML;
css.textContent = creatingASyntaxHighlighterCSS;
javascript.textContent = creatingASyntaxHighlighterJs;
codeName.value = "Creating A Syntax Highlighter (Tutorial)";
document.title = "Creating A Syntax Highlighter (Tutorial) - " + defaultTitle;
}
syntaxHighlight(html, "html");
syntaxHighlight(css, "css");
syntaxHighlight(javascript, "javascript");
runCode();
updateText();
}
}
else {
blankCodeWithoutConfirmation();
if (forLoop.selected == true) {
html.textContent = forLoopHTML;
css.textContent = forLoopCSS;
javascript.textContent = forLoopJs;
codeName.value = "For Loop (Tutorial)";
document.title = "For Loop (Tutorial) - " + defaultTitle;
}
else if (randomNumberShow.selected == true) {
html.textContent = randomNumberShowHTML;
css.textContent = randomNumberShowCSS;
javascript.textContent = randomNumberShowJs;
codeName.value = "Random Number Show (Tutorial)";
document.title = "Random Number Show (Tutorial) - " + defaultTitle;
}
else if (jsCanvas.selected == true) {
html.textContent = jsCanvasHTML;
css.textContent = jsCanvasCSS;
javascript.textContent = jsCanvasJs;
codeName.value = "JS Canvas (Tutorial)";
document.title = "JS Canvas (Tutorial) - " + defaultTitle;
}
else if (propertyAsAFunctionInJs.selected == true) {
html.textContent = propertyAsAFunctionInJsHTML;
css.textContent = propertyAsAFunctionInJsCSS;
javascript.textContent = propertyAsAFunctionInJsJs;
codeName.value = "Property As A Function In JS (Tutorial)";
document.title = "Property As A Function In JS (Tutorial) - " + defaultTitle;
}
else if (jsAlert.selected == true) {
html.textContent = jsAlertHTML;
css.textContent = jsAlertCSS;
javascript.textContent = jsAlertJs;
codeName.value = "JS Alert (Tutorial)";
document.title = "JS Alert (Tutorial) - " + defaultTitle;
}
else if (creatingASyntaxHighlighter.selected == true) {
html.textContent = creatingASyntaxHighlighterHTML;
css.textContent = creatingASyntaxHighlighterCSS;
javascript.textContent = creatingASyntaxHighlighterJs;
codeName.value = "Creating A Syntax Highlighter (Tutorial)";
document.title = "Creating A Syntax Highlighter (Tutorial) - " + defaultTitle;
}
syntaxHighlight(html, "html");
syntaxHighlight(css, "css");
syntaxHighlight(javascript, "javascript");
runCode();
updateText();
}
}

function searchCodes() {
var search = document.getElementById("search");
var li = document.getElementById("allCodes").getElementsByTagName("li");
for (var number = 0; number < li.length; number++) {
var span = document.getElementById("allCodes").getElementsByTagName("li")[number].getElementsByTagName("span")[0];
if (span.textContent.toUpperCase().indexOf(search.value.toUpperCase()) > -1) {
li[number].style.display = "";
}
else {
li[number].style.display = "none";
}
}
if (search.value == "") {
showCodes();
}
}

function updateText() {
var html = document.getElementById("html");
var css = document.getElementById("css");
var javascript = document.getElementById("javascript");
if (html.textContent.length > 0 || css.textContent.length > 0 || javascript.textContent.length > 0) {
window.onbeforeunload = function(e) {
return "";
}
}
else {
window.onbeforeunload = null;
}
}
