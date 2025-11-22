var defaultTitle = document.title;
var unsavedChanges = false;
var undoStack = [];
var redoStack = [];

window.addEventListener("beforeunload", (e) => {
if (unsavedChanges) {
e.preventDefault();
e.returnValue = "";
}
});

window.onload = function() {
var themeOBJ = document.getElementById("theme");
var code = document.getElementById("code");
var codeSelection = document.getElementById("codeSelection");
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
syntaxHighlight(code, "html");
syntaxHighlight(document.getElementById("HEspecialtag1"), "html");
syntaxHighlight(document.getElementById("HEspecialtag2"), "html");
showCodes();
});
runCode();
document.getElementById("result").blur();
scrollTo(0, 0);
code.addEventListener("scroll", function() {
document.getElementById("lineList").parentElement.scrollTop = code.scrollTop;
});
code.addEventListener("beforeinput", saveCodeSnapshot);
code.addEventListener("keydown", function(e) {
if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
e.preventDefault();
undo();
}
if ((e.ctrlKey && e.key.toLowerCase() === 'y') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
e.preventDefault();
redo();
}
});
}

function invalidArray(array) {
if (Array.isArray(array)) {
return array.some(item => typeof item !== "object" || item === null || Object.keys(item).length !== 2 || !("codeName" in item) || !("code" in item));
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
var codeSelection = document.getElementById("codeSelection");
if (theme.value == "light") {
saveTheme("light");
codeSelection.innerHTML = "#code::selection, #code *::selection { background: #b3e5fc; }";
document.getElementById("HEspecialtag1").setAttribute("style", "background-color: white;");
document.getElementById("HEspecialtag2").setAttribute("style", "background-color: white;");
document.body.setAttribute("style", "background-color: white; color: black;");
document.getElementById("result").setAttribute("style", "background-color: white;");
code.setAttribute("style", "background-color: white; color: black; caret-color: black;");
document.querySelector(".line-numbers").setAttribute("style", "background-color: white; color: #444;");
document.querySelector(".code-wrapper").setAttribute("style", "border: 1px solid black; background-color: white;");
document.getElementById("debuggerPanelHolder").setAttribute("style", "background: #fff8f0");
syntaxHighlight(document.getElementById("fixedCode"), "html");
document.querySelectorAll("button").forEach(button => {
button.style.background = "linear-gradient(135deg, #A5D6A7, #81C784)";
button.style.color = "black";
});
}
else if (theme.value == "dark") {
saveTheme("dark");
codeSelection.innerHTML = "#code::selection, #code *::selection { background: #264f78; }";
document.getElementById("HEspecialtag1").setAttribute("style", "background-color: rgb(60, 60, 60);");
document.getElementById("HEspecialtag2").setAttribute("style", "background-color: rgb(60, 60, 60);");
document.body.setAttribute("style", "background-color: black; color: white;");
document.getElementById("result").setAttribute("style", "background-color: white;");
code.setAttribute("style", "background-color: rgb(60, 60, 60); color: white; caret-color: white;");
document.querySelector(".line-numbers").setAttribute("style", "background-color: #222; color: #DCDCDC;");
document.querySelector(".code-wrapper").setAttribute("style", "border: 1px solid #ccc; background-color: #222;");
document.getElementById("debuggerPanelHolder").setAttribute("style", "background: #1a1a1a");
syntaxHighlight(document.getElementById("fixedCode"), "html");
document.querySelectorAll("button").forEach(button => {
button.style.background = "linear-gradient(135deg, #2E7D32, #43A047)";
button.style.color = "white";
});
}
}

function saveCodeToLocalStorage(name, content) {
if (invalidArray(JSON.parse(localStorage.getItem("HEcodes")))) {
localStorage.setItem("HEcodes", "[]");
}
var codes = JSON.parse(localStorage.getItem("HEcodes"));
var existingCodeIndex = codes.findIndex(item => item.codeName === name);
if (existingCodeIndex !== -1) {
codes[existingCodeIndex].code = content;
}
else {
codes.push({codeName: name, code: content});
}
localStorage.setItem("HEcodes", JSON.stringify(codes));
}

function retreiveCodeFromLocalStorage(codeName) {
if (invalidArray(JSON.parse(localStorage.getItem("HEcodes")))) {
localStorage.setItem("HEcodes", "[]");
}
var codes = JSON.parse(localStorage.getItem("HEcodes"));
var code = codes.find(item => item.codeName === codeName);
return code ? code.code : null;
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

function saveCodeSnapshot() {
const code = document.getElementById("code");
const sel = window.getSelection();
let range = null;
if (sel.rangeCount > 0) {
const r = sel.getRangeAt(0);
if (code.contains(r.startContainer) && code.contains(r.endContainer)) {
range = r;
}
}
const snapshot = {
text: code.textContent,
selection: null,
scrollTop: code.scrollTop
};
if (range) {
snapshot.selection = {
startContainerPath: getNodePath(range.startContainer, code),
startOffset: range.startOffset,
endContainerPath: getNodePath(range.endContainer, code),
endOffset: range.endOffset
};
}
undoStack.push(snapshot);
redoStack = [];
}

function restoreSnapshot(snapshot) {
const code = document.getElementById("code");
if (snapshot.text !== undefined) {
code.textContent = snapshot.text;
syntaxHighlightContentEditableElement(code, "html");
updateText(code);
updateLineNumbers(code, document.getElementById("lineList"));
}
if (typeof snapshot.scrollTop === "number") {
code.scrollTop = snapshot.scrollTop;
}
if (snapshot.selection) {
const sel = window.getSelection();
sel.removeAllRanges();
const range = document.createRange();
const startNode = getNodeFromPath(snapshot.selection.startContainerPath, code);
const endNode = getNodeFromPath(snapshot.selection.endContainerPath, code);
if (startNode && endNode) {
range.setStart(startNode, Math.min(snapshot.selection.startOffset, startNode.textContent.length));
range.setEnd(endNode, Math.min(snapshot.selection.endOffset, endNode.textContent.length));
sel.addRange(range);
}
}
}


function getNodePath(node, root) {
const path = [];
while (node && node !== root) {
const parent = node.parentNode;
path.unshift(Array.from(parent.childNodes).indexOf(node));
node = parent;
}
return path;
}

function getNodeFromPath(path, root) {
let node = root;
for (let i = 0; i < path.length; i++) {
if (!node.childNodes[path[i]]) return null;
node = node.childNodes[path[i]];
}
return node;
}

function getCurrentSelectionSnapshot() {
const code = document.getElementById("code");
const sel = window.getSelection();
if (sel.rangeCount === 0) {
return null;
}
const range = sel.getRangeAt(0);
return {
startContainerPath: getNodePath(range.startContainer, code),
startOffset: range.startOffset,
endContainerPath: getNodePath(range.endContainer, code),
endOffset: range.endOffset
};
}

function applySnapshot(fromStack, toStack) {
const code = document.getElementById("code");
if (fromStack.length === 0) {
return;
}
const snapshot = fromStack.pop();
toStack.push({
text: code.textContent,
selection: getCurrentSelectionSnapshot(),
scrollTop: code.scrollTop
});
restoreSnapshot(snapshot);
document.getElementById("container").scrollIntoView({
behavior: "smooth",
block: "start"
});
}

function undo() {
applySnapshot(undoStack, redoStack);
}

function redo() {
applySnapshot(redoStack, undoStack);
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
var code = document.getElementById("code");
var confirmOpenCode;
if (code.textContent.length > 0) {
confirmOpenCode = confirm("Are you sure you want to open this code? Changes may not be saved.");
if (confirmOpenCode == true) {
blankCodeWithoutConfirmation();
codeName.value = anyCode.textContent;
code.innerHTML = retreiveCodeFromLocalStorage(anyCode.textContent).textify();
runCode();
document.title = anyCode.textContent + " - " + defaultTitle;
syntaxHighlight(code, "html");
window.onbeforeunload = null;
}
}
else if (code.textContent.length == 0) {
blankCodeWithoutConfirmation();
codeName.value = anyCode.textContent;
code.innerHTML = retreiveCodeFromLocalStorage(anyCode.textContent).textify();
runCode();
document.title = anyCode.textContent + " - " + defaultTitle;
syntaxHighlight(code, "html");
window.onbeforeunload = null;
}
}

function openFileMenu(e, anyCode) {
var fileMenu = document.getElementById("fileMenu");
var open = document.getElementById("open");
var del = document.getElementById("del");
var download = document.getElementById("download");
var copyCodeName = document.getElementById("copyCodeName");
var copyCode = document.getElementById("copyCode");
var printCodeBtn = document.getElementById("printCode");
e.preventDefault();
fileMenu.style.left = e.pageX + "px";
fileMenu.style.top = e.pageY + "px";
fileMenu.style.display = "block";
open.setAttribute("onclick", "openCode(document.getElementById('" + anyCode.id + "'))");
del.setAttribute("onclick", "deleteCode(document.getElementById('" + anyCode.id + "'))");
download.setAttribute("onclick", "downloadCode('" + anyCode.id + "'.replaceLastPortion('.code', '') + '.html', retreiveCodeFromLocalStorage('" + anyCode.id + "'), 'html/plain')");
copyCodeName.setAttribute("onclick", "copyCodeName(document.getElementById('" + anyCode.id + "'))");
copyCode.setAttribute("onclick", "copyCode(document.getElementById('" + anyCode.id + "'))");
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

function copyCode(anyCode) {
var textarea = document.createElement("textarea");
document.body.appendChild(textarea);
textarea.value = retreiveCodeFromLocalStorage(anyCode.textContent);
textarea.select();
document.execCommand("copy");
document.body.removeChild(textarea);
alert("Code copied successfully.");
}

function deleteCode(anyCode) {
var codeName = document.getElementById("codeName");
var code = document.getElementById("code");
var confirmDeleteCode = confirm("Are you sure you want to delete this code?");
if (confirmDeleteCode == true) {
if (code.textContent == retreiveCodeFromLocalStorage(anyCode.parentElement.firstElementChild.textContent) && codeName.value == anyCode.parentElement.firstElementChild.textContent) {
blankCodeWithoutConfirmation();
}
deleteCodeFromLocalStorage(anyCode.parentElement.firstElementChild.textContent);
showCodes();
}
}

async function AIdebugger() {
var code = document.getElementById("code").innerText.trim();
var debuggerPanel = document.getElementById("debuggerPanel");
var fixedCode = document.getElementById("fixedCode");
debuggerPanel.innerHTML = "Please wait while we process your code...";
fixedCode.textContent = "";
try {
await fetch("https://html-editor-backend.vercel.app/").catch(() => {});
const res = await fetch("https://html-editor-backend.vercel.app/debug", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ code }),
});
if (!res.ok) {
debuggerPanel.innerHTML = `<div class="error-text">Error ${res.status}: ${res.statusText}</div>`;
return;
}
const data = await res.json();
let text = data.choices?.[0]?.message?.content;
if (!text || text.trim() === "") {
const requestsRemaining = data.remainingRequests;
let msg;
if (requestsRemaining == null) {
msg = "AI model used for debugging is currently overloaded. Please try again later.";
}
else if (parseInt(requestsRemaining) === 0) {
msg = "Your 50-request limit is over for today. Please try again tomorrow.";
}
debuggerPanel.innerHTML = `<div class="error-text">${msg}</div>`;
return;
}
text = text.replace(/```(html|js|javascript|css)?/gi, "").replace(/```/g, "").trim();
const errorMatch = text.match(/ERRORS:\s*([\s\S]*?)SUGGESTED FIXES:/i);
const fixMatch = text.match(/SUGGESTED FIXES:\s*([\s\S]*?)FULL FIXED CODE:/i);
const codeMatch = text.match(/FULL FIXED CODE:\s*([\s\S]*)/i);
const errorText = errorMatch[1].trim();
const fixText = fixMatch[1].trim();
const codeText = codeMatch ? codeMatch[1].trim() : "";
debuggerPanel.innerHTML = `<div class="error-text"><u>ERRORS</u>:<br> ${errorText.textify()}</div>
<div class="fix-text"><u>SUGGESTED FIXES</u>:<br> ${fixText.textify()}</div><br><u class="fix-text">FULL FIXED CODE</u>:<span style="float: right; color: #4AA8FF; cursor: pointer; text-decoration: underline;" onclick="copyFixedCode()">(Copy Fixed Code)</span>`;
fixedCode.innerHTML = codeText.textify();
syntaxHighlight(fixedCode, "html");
} catch (err) {
debuggerPanel.innerHTML = `<div class="error-text">Error: ${err.message}</div>`;
}
}

function copyFixedCode() {
var textarea = document.createElement("textarea");
var fixedCode = document.getElementById("fixedCode");
document.body.appendChild(textarea);
textarea.value = fixedCode.textContent;
textarea.select();
document.execCommand("copy");
document.body.removeChild(textarea);
alert("Fixed code copied successfully.");
}

function runCode() {
var code = document.getElementById("code");
var result = document.getElementById("result");
var script = document.createElement("script");
updateLineNumbers(code, document.getElementById("lineList"));
result.srcdoc = code.innerText;
result.focus();
document.getElementById("container").scrollIntoView({
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
document.getElementById("fixedCode").innerHTML = "";
}

function saveCode() {
var codeName = document.getElementById("codeName");
var code = document.getElementById("code");
if (codeName.value.endsWith(".code")) {
saveCodeToLocalStorage(codeName.value, code.textContent);
}
else {
saveCodeToLocalStorage(codeName.value + ".code", code.textContent);
}
showCodes();
blankCodeWithoutConfirmation();
}

function downloadCode(name, content, type) {
var file = new Blob([content], {type: type});
var link = document.createElement("a");
link.textContent = name;
link.href = URL.createObjectURL(file);
link.download = name;
link.click();
URL.revokeObjectURL(link.href);
}

function uploadCode() {
var codeName = document.getElementById("codeName");
var code = document.getElementById("code");
var fileInput = document.createElement("input");
var confirmUploadCode;
fileInput.type = "file";
fileInput.accept = ".txt, text/html";
fileInput.click();
fileInput.onchange = function() {
if (code.textContent.length > 0) {
confirmUploadCode = confirm("Are you sure you want to upload this code? Changes may not be saved.");
if (confirmUploadCode == true) {
var fileReader = new FileReader();
fileReader.onload = function() {
blankCodeWithoutConfirmation();
codeName.value = fileInput.files[0].name;
code.innerHTML = fileReader.result.textify();
syntaxHighlight(code, "html");
runCode();
updateText(code);
}
fileReader.readAsText(this.files[0]);
}
}
else if (code.textContent.length == 0) {
var fileReader = new FileReader();
fileReader.onload = function() {
blankCodeWithoutConfirmation();
codeName.value = fileInput.files[0].name;
code.innerHTML = fileReader.result.textify();
syntaxHighlight(code, "html");
runCode();
updateText(code);
}
fileReader.readAsText(this.files[0]);
}
}
}

function blankCode() {
var codeName = document.getElementById("codeName");
var code = document.getElementById("code");
var confirmNewCode;
if (code.textContent.length > 0) {
confirmNewCode = confirm("Are you sure you want to open a blank code? Changes may not be saved.");
if (confirmNewCode == true) {
codeName.value = null;
code.innerHTML = null;
runCode();
document.title = defaultTitle;
updateText(code);
syntaxHighlight(code, "html");
clearDebuggerPanel();
undoStack = [];
redoStack = [];
}
}
else {
codeName.value = null;
code.innerHTML = null;
runCode();
document.title = defaultTitle;
updateText(code);
syntaxHighlight(code, "html");
clearDebuggerPanel();
undoStack = [];
redoStack = [];
}
}

function blankCodeWithoutConfirmation() {
var codeName = document.getElementById("codeName");
var code = document.getElementById("code");
codeName.value = null;
code.innerHTML = null;
runCode();
document.title = defaultTitle;
updateText(code);
syntaxHighlight(code, "html");
clearDebuggerPanel();
undoStack = [];
redoStack = [];
}

function openTutorial() {
var codeName = document.getElementById("codeName");
var code = document.getElementById("code");
var confirmOpenTutorial;
var forLoop = document.getElementById("forLoop");
var randomNumberShow = document.getElementById("randomNumberShow");
var jsCanvas = document.getElementById("jsCanvas");
var propertyAsAFunctionInJs = document.getElementById("propertyAsAFunctionInJs");
var jsAlert = document.getElementById("jsAlert");
var creatingASyntaxHighlighter = document.getElementById("creatingASyntaxHighlighter");
var forLoopCode = `<!DOCTYPE html>
<html>
<head>
<script>
function showArrayItems() {
var myArray = ["Bugatti", "Koenigsegg Jesko", "McLaren", "Tesla", "Lamborghini", "Ferrari", "Porsche", "Mercedes Benz", "BMW", "Audi", "Pagani", "Maserati"];
var showItems = document.getElementById("showItems");
showItems.textContent = "";
for (var i = 0; i < myArray.length; i++) {
var li = document.createElement("li");
li.textContent = myArray[i];
showItems.appendChild(li);
}
}
</script>
</head>
<body>
<h1>For Loop</h1>
<p>Click on the "Click me" button to show all the items in an array called "myArray".</p>
<button onclick="showArrayItems()">Click Me</button>
<ol id="showItems"></ol>
</body>
</html>`;
var randomNumberShowCode = `<!DOCTYPE html>
<html>
<head>
<script>
function showRandomNumber() {
var min = Number(document.getElementById("min").value);
var max = Number(document.getElementById("max").value);
if (min < max) {
document.getElementById("show").textContent = Math.floor(Math.random() * (max - min + 1) + min);
}
else {
document.getElementById("show").textContent = "The minimum value is not lesser than the maximum value. Please try again.";
}
}
</script>
</head>
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
var jsCanvasCode = `<!DOCTYPE html>
<html>
<head>
<script>
function draw() {
var ctx = document.getElementById("canvas").getContext("2d");
ctx.clearRect(0, 0, 200, 200);
ctx.fillStyle = "green";
ctx.fillRect(Math.floor(Math.random() * (161 - 40)), Math.floor(Math.random() * (161 - 40)), 40, 40);
}
</script>
</head>
<body>
<h1>JS Canvas</h1>
<button onclick="draw()">Draw on canvas</button><br>
<canvas id="canvas" height="200" width="200" style="border: 1px solid black;"></canvas>
</body>
</html>`;
var propertyAsAFunctionInJsCode = `<!DOCTYPE html>
<html>
<head>
<style>
.colored-text {
padding: 5px;
}
</style>
<script>
String.prototype.colored = function(color) {
return "<span class='colored-text' style='color: " + color + "'>" + this + "</span>";
}
</script>
</head>
<body>
<h1>Property As A Function In JS</h1>
<p>Clicking the "Colour Text" button will call a property function called String.colored().</p>
<button onclick="document.getElementById('colorText').innerHTML = 'Sample Text'.colored('green')">Colour Text</button>
<p id="colorText"></p>
</body>
</html>`;
var jsAlertCode = `<!DOCTYPE html>
<html>
<head>
<script>
function showMessage(message) {
alert(message);
}
</script>
</head>
<body>
<h1>JS Alert</h1>
<button onclick="showMessage('Hi! This is an alert box!')">Click me</button>
</body>
</html>`;
var creatingASyntaxHighlighterCode = `<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="https://shemgeorge.github.io/HTMLEditor/HTMLEditorApp.css">
<script src="https://shemgeorge.github.io/HTMLEditor/HTMLEditorApp.css"></script>
<style>
.code {
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
}

.code-wrapper {
display: flex;
width: 645px;
height: 172px;
border: 1px solid #ccc;
background: white;
box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
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
</style>
<script>
window.onload = function() {
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
}
</script>
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
if (code.textContent.length > 0) {
confirmOpenTutorial = confirm("Are you sure you want to open this tutorial? Changes may not be saved.");
if (confirmOpenTutorial == true) {
blankCodeWithoutConfirmation();
if (forLoop.selected == true) {
code.textContent = forLoopCode;
codeName.value = "For Loop (Tutorial)";
document.title = "For Loop (Tutorial) - " + defaultTitle;
}
if (randomNumberShow.selected == true) {
code.textContent = randomNumberShowCode;
codeName.value = "Random Number Show (Tutorial)";
document.title = "Random Number Show (Tutorial) - " + defaultTitle;
}
if (jsCanvas.selected == true) {
code.textContent = jsCanvasCode;
codeName.value = "JS Canvas (Tutorial)";
document.title = "JS Canvas (Tutorial)";
}
if (propertyAsAFunctionInJs.selected == true) {
code.textContent = propertyAsAFunctionInJsCode;
codeName.value = "Property As A Function In JS (Tutorial)";
document.title = "Property As A Function In JS (Tutorial) - " + defaultTitle;
}
if (jsAlert.selected == true) {
code.textContent = jsAlertCode;
codeName.value = "JS Alert (Tutorial)";
document.title = "JS Alert (Tutorial) - " + defaultTitle;
}
if(creatingASyntaxHighlighter.selected == true) {
code.textContent = creatingASyntaxHighlighterCode;
codeName.value = "Creating A Syntax Highlighter (Tutorial)";
document.title = "Creating A Syntax Highlighter (Tutorial) - " + defaultTitle;
}
syntaxHighlight(code, "html");
runCode();
updateText(code);
}
}
else if (code.textContent.length == 0) {
blankCodeWithoutConfirmation();
if (forLoop.selected == true) {
code.textContent = forLoopCode;
codeName.value = "For Loop (Tutorial)";
document.title = "For Loop (Tutorial) - " + defaultTitle;
}
if (randomNumberShow.selected == true) {
code.textContent = randomNumberShowCode;
codeName.value = "Random Number Show (Tutorial)";
document.title = "Random Number Show (Tutorial) - " + defaultTitle;
}
if (jsCanvas.selected == true) {
code.textContent = jsCanvasCode;
codeName.value = "JS Canvas (Tutorial)";
document.title = "JS Canvas (Tutorial) - " + defaultTitle;
}
if (propertyAsAFunctionInJs.selected == true) {
code.textContent = propertyAsAFunctionInJsCode;
codeName.value = "Property As A Function In JS (Tutorial)";
document.title = "Property As A Function In JS (Tutorial) - " + defaultTitle;
}
if (jsAlert.selected == true) {
code.textContent = jsAlertCode;
codeName.value = "JS Alert (Tutorial)";
document.title = "JS Alert (Tutorial) - " + defaultTitle;
}
if(creatingASyntaxHighlighter.selected == true) {
code.textContent = creatingASyntaxHighlighterCode;
codeName.value = "Creating A Syntax Highlighter (Tutorial)";
document.title = "Creating A Syntax Highlighter (Tutorial) - " + defaultTitle;
}
syntaxHighlight(code, "html");
runCode();
updateText(code);
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

function updateText(element) {
unsavedChanges = element.textContent.length > 0;
}
