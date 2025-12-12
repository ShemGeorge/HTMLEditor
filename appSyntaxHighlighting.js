function syntaxHighlightContentEditableElement(contentEditableElement, mode) {
function saveCursorPosition(element) {
var selection = window.getSelection();
var range = selection.getRangeAt(0);
range.setStart(element, 0);
var length = range.toString().length;
function getTextNodeAtPosition(root, index) {
var NODE_TYPE = NodeFilter.SHOW_TEXT;
var treeWalker = document.createTreeWalker(root, NODE_TYPE, function next(element) {
if(index > element.textContent.length) {
index -= element.textContent.length;
return NodeFilter.FILTER_REJECT;
}
return NodeFilter.FILTER_ACCEPT;
});
var c = treeWalker.nextNode();
return {
node: c ? c: root,
position: index
}
}
return function() {
var position = getTextNodeAtPosition(element, length);
selection.removeAllRanges();
var range = new Range();
range.setStart(position.node, position.position);
selection.addRange(range);
}
}
var restoreCursorPosition = saveCursorPosition(contentEditableElement);
syntaxHighlight(contentEditableElement, mode);
restoreCursorPosition();
}

function syntaxHighlight(element, mode) {
var div = document.createElement("div");
var theme = document.getElementById("theme");
div.textContent = element.textContent;
if (mode == "html") {
if (element.textContent == "") {
element.innerHTML = null;
}
else {
element.innerHTML = htmlMode(div.innerHTML);
}
}
if (mode == "css") {
if (element.textContent == "") {
element.innerHTML = null;
}
else {
element.innerHTML = cssMode(div.innerHTML);
}
}
if (mode == "javascript") {
if (element.textContent == "") {
element.innerHTML = null;
}
else {
element.innerHTML = jsMode(div.innerHTML);
}
}
function disableHTMLCommentsInScriptAndStyle(txt) {
let out = "";
let pos = 0;
const openTagRegex = /&lt;(script|style)\b/gi;
let match;
while ((match = openTagRegex.exec(txt)) !== null) {
let start = match.index;
out += txt.substring(pos, start);
let openTagEnd = txt.indexOf("&gt;", start);
if (openTagEnd === -1) openTagEnd = txt.length;
let blockStart = openTagEnd + 4;
const tagName = match[1].toLowerCase();
const closeTagRegex = new RegExp(`&lt;\\s*\\/${tagName}\\s*&gt;`, "i");
const closingMatch = closeTagRegex.exec(txt.slice(blockStart));
let blockEnd;
if (closingMatch) {
blockEnd = blockStart + closingMatch.index;
} else {
blockEnd = txt.length;
}
let inner = txt.substring(blockStart, blockEnd);
inner = inner.replace(/&lt;!--/g, "&lt;\u2063!--");
out += txt.substring(start, blockStart) + inner;
if (closingMatch) {
const closingTagStart = blockEnd;
const closingTagEnd = blockEnd + closingMatch[0].length;
out += txt.substring(closingTagStart, closingTagEnd);
pos = closingTagEnd;
openTagRegex.lastIndex = closingTagEnd;
}
else {
pos = txt.length;
break;
}
}
out += txt.substring(pos);
return out;
}
function extract(str, start, end, func, repl) {
var s, e, d = "", a = [];
while (str.search(start) > -1) {
s = str.search(start);
e = str.indexOf(end, s);
if (e == -1) {e = str.length;}
if (repl) {
a.push(func(str.substring(s, e + (end.length))));
str = str.substring(0, s) + repl + str.substr(e + (end.length));
} else {
d += str.substring(0, s);
d += func(str.substring(s, e + (end.length)));
str = str.substr(e + (end.length));
}
}
this.rest = d + str;
this.arr = a;
}
function replaceGreaterThanInQuotes(txt) {
function isEligibleQuote(str, pos) {
if (pos === 0) {
return false;
}
let j = pos - 1;
while (j >= 0 && str[j] === ' ') {
j--;
}
if (j < 0 || str[j] !== '=') {
return false;
}
let open = str.lastIndexOf("&lt;", j);
if (open === -1) {
open = 0;
}
for (let i = open; i < j; i++) {
if (str[i] === ' ') {
return true;
}
}
return false;
}
function findTagEnd(str, startIndex) {
let inSingle = false, inDouble = false;
let i = startIndex + 4;
while (i < str.length) {
let ch = str[i];
if (!inSingle && ch === '"' && isEligibleQuote(str, i)) {
inDouble = true;
i++;
continue;
}
if (!inDouble && ch === "'" && isEligibleQuote(str, i)) {
inSingle = true;
i++;
continue;
}
if (inDouble && ch === '"') {
inDouble = false;
i++;
continue;
}
if (inSingle && ch === "'") {
inSingle = false;
i++;
continue;
}
if (!inSingle && !inDouble && str.startsWith("&gt;", i)) {
return i;
}
i++;
}
return -1;
}
function extractFullBlocks(source, tagName, placeholder, storeArray) {
let out = "", i = 0;
const openToken = `&lt;${tagName}`, closeToken = `&lt;/${tagName}&gt;`;
while (i < source.length) {
let openIndex = source.toLowerCase().indexOf(openToken, i);
if (openIndex === -1) {
out += source.substring(i);
break;
}
out += source.substring(i, openIndex);
let endOpen = findTagEnd(source, openIndex);
if (endOpen === -1) {
out += source.substring(openIndex);
break;
}
let openTag = source.substring(openIndex, endOpen + 4);
let closeIndex = source.toLowerCase().indexOf(closeToken, endOpen + 4);
if (closeIndex === -1) {
out += source.substring(openIndex);
break;
}
let inner = source.substring(endOpen + 4, closeIndex);
storeArray.push(inner);
let closeTag = source.substring(closeIndex, closeIndex + closeToken.length);
out += openTag + placeholder + closeTag;
i = closeIndex + closeToken.length;
}
return out;
}
let scripts = [], styles = [];
txt = extractFullBlocks(txt, "script", "\uF006", scripts);
txt = extractFullBlocks(txt, "style", "\uF007", styles);
let result = "", pos = 0;
while (pos < txt.length) {
let tagStart = txt.indexOf("&lt;", pos);
if (tagStart === -1) {
result += txt.substring(pos);
break;
}
result += txt.substring(pos, tagStart);
let tagEnd = findTagEnd(txt, tagStart);
if (tagEnd === -1) {
result += txt.substring(tagStart).split("&gt;").join("\u0000");
break;
}
let tagText = txt.substring(tagStart, tagEnd + 4);
let processed = "";
let inSingle = false, inDouble = false;
for (let i = 0; i < tagText.length; i++) {
let ch = tagText[i];
if (!inSingle && ch === '"' && isEligibleQuote(tagText, i)) {
inDouble = true;
processed += ch;
continue;
}
if (!inDouble && ch === "'" && isEligibleQuote(tagText, i)) {
inSingle = true;
processed += ch;
continue;
}
if (inDouble && ch === '"') {
inDouble = false;
processed += ch;
continue;
}
if (inSingle && ch === "'") {
inSingle = false;
processed += ch;
continue;
}
if ((inSingle || inDouble) && tagText.startsWith("&gt;", i) && i < tagText.length - 4) {
processed += "\u0000"; i += 3; continue;
}
processed += ch;
}
result += processed;
pos = tagEnd + 4;
}
for (var s of scripts) {
result = result.replace("\uF006", s);
}
for (var s of styles) {
result = result.replace("\uF007", s);
}
return result;
}
function htmlMode(txt) {
var rest = txt, done = "", comment, startpos, endpos, note, i;
rest = disableHTMLCommentsInScriptAndStyle(rest);
comment = new extract(rest, "&lt;!--", "--&gt;", commentMode, "\uF001");
rest = comment.rest;
while (rest.indexOf("&lt;") > -1) {
if (/^\s*&LT;!DOCTYPE/i.test(rest)) {
endpos = rest.indexOf("&gt;");
if (endpos == -1) { endpos = rest.length; }
done += "<span class='html-doctype-" + theme.value + "'>" + rest.substring(0, endpos + 4) + "</span>";
rest = rest.substr(endpos + 4);
continue;
}
rest = replaceGreaterThanInQuotes(rest);
note = "";
startpos = rest.indexOf("&lt;");
if (rest.substr(startpos, 9).toUpperCase() === "&LT;STYLE" && (rest.substr(startpos + 9, 4).toUpperCase().startsWith("&GT;") || rest.charAt(startpos + 9) === " ")) {
note = "css";
}
if (rest.substr(startpos, 10).toUpperCase() === "&LT;SCRIPT" && (rest.substr(startpos + 10, 4).toUpperCase().startsWith("&GT;") || rest.charAt(startpos + 10) === " ")) {
note = "javascript";
}
endpos = rest.indexOf("&gt;", startpos);
if (endpos == -1) {
endpos = rest.length;
}
done += rest.substring(0, startpos);
done += tagMode(rest.substring(startpos, endpos + 4));
rest = rest.substr(endpos + 4);
if (note === "css") {
endpos = rest.toUpperCase().indexOf("&LT;/STYLE&GT;");
if (endpos === -1) {
endpos = rest.length;
}
done += cssMode(rest.substring(0, endpos));
rest = rest.substr(endpos);
}
if (note === "javascript") {
endpos = rest.toUpperCase().indexOf("&LT;/SCRIPT&GT;");
if (endpos === -1) {
endpos = rest.length;
}
done += jsMode(rest.substring(0, endpos));
rest = rest.substr(endpos);
}
}
rest = done + rest;
for (i = 0; i < comment.arr.length; i++) {
rest = rest.replace("\uF001", comment.arr[i]);
}
rest = rest.replace(/\u2063/g, "");
rest = rest.replace(/\u0000/g, "&gt;");
return rest;
}
function tagMode(txt) {
var rest = txt, done = "", startpos, endpos, result, name;
while (rest.search(/(\s|\n)/) > -1) {
startpos = rest.search(/(\s|\n)/);
endpos = rest.indexOf("&gt;");
if (endpos == -1) {endpos = rest.length;}
done += rest.substring(0, startpos);
done += attributeMode(rest.substring(startpos, endpos));
rest = rest.substr(endpos);
}
result = done + rest;
name = result.substring(4);
if (name.substr(0, 1) == "/") {
name = "<span class='html-close-" + theme.value + "'>/</span>" + name.substring(1, name.length);
}
result = "<span class='html-bracket-" + theme.value + "'>&lt;</span>" + name;
if (result.substr(result.length - 4, 4) == "&gt;") {
result = result.substring(0, result.length - 4) + "<span class='html-bracket-" + theme.value + "'>&gt;</span>";
}
return "<span class='html-tag-" + theme.value + "'>" + result + "</span>";
}
function attributeMode(txt) {
let rest = txt;
let done = "";
while (true) {
let eqPos = rest.indexOf("=");
if (eqPos === -1) break;
done += rest.substring(0, eqPos);
let valStart = eqPos + 1;
while (rest[valStart] === " ") {
valStart++;
}
let endpos = -1;
if (rest[valStart] === '"') {
endpos = rest.indexOf('"', valStart + 1);
} else if (rest[valStart] === "'") {
endpos = rest.indexOf("'", valStart + 1);
} else {
let space = rest.indexOf(" ", valStart);
endpos = space === -1 ? rest.length : space - 1;
}
if (endpos === -1) {
endpos = rest.length - 1;
}
let attrSegment = rest.substring(eqPos, endpos + 1);
done += attributeValueMode(attrSegment);
rest = rest.substring(endpos + 1);
}
return "<span class='html-attribute-" + theme.value + "'>" + done + rest + "</span>";
}
function attributeValueMode(txt) {
return "<span class='html-attributeEquals-" + theme.value + "'>=</span><span class='html-attributeValue-" + theme.value + "'>" + txt.substring(1, txt.length) + "</span>";
}
function commentMode(txt) {
return "<span class='comment-" + theme.value + "'>" + txt + "</span>";
}
function makeCssSafe(text, colonPlaceholder = "\uF00C", semicolonPlaceholder = "\uF00D", openingBracePlaceholder = "\uF00E", closingBracePlaceholder = "\uF00F") {
let inSingle = false, inDouble = false, inBacktick = false;
let result = "";
text = text.replace(/&lt;/g,"\uF008").replace(/&gt;/g,"\uF009").replace(/&amp;/g, "\uF00A").replace(/&nbsp;/g,"\uF00B");
for (let i = 0; i < text.length; i++) {
let ch = text[i];
if (ch === '"' && !inSingle && !inBacktick) {
inDouble = !inDouble;
}
else if (ch === "'" && !inDouble && !inBacktick) {
inSingle = !inSingle;
}
else if (ch === "`" && !inDouble && !inSingle) {
inBacktick = !inBacktick;
}
if ((inSingle || inDouble || inBacktick) && ch === ";") {
result += semicolonPlaceholder;
}
else if ((inSingle || inDouble || inBacktick) && ch === "}") {
result += closingBracePlaceholder;
}
else if ((inSingle || inDouble || inBacktick) && ch === "{") {
result += openingBracePlaceholder;
}
else if ((inSingle || inDouble || inBacktick) && ch === ":") {
result += colonPlaceholder;
}
else {
result += ch;
}
}
return result;
}
function cssMode(txt) {
var rest = makeCssSafe(txt), done = "", s, e, comment, i, midz, c, cc;
comment = new extract(rest, /\/\*/, "*/", commentMode, "\uF002");
rest = comment.rest;
while (rest.search("{") > -1) {
s = rest.search("{");
midz = rest.substr(s + 1);
cc = 1;
c = 0;
for (i = 0; i < midz.length; i++) {
if (midz.substr(i, 1) == "{") {
cc++;
c++;
}
if (midz.substr(i, 1) == "}") {
cc--;
}
if (cc == 0) {
break;
}
}
if (cc != 0) {
c = 0;
}
e = s;
for (i = 0; i <= c; i++) {
e = rest.indexOf("}", e + 1);
}
if (e == -1) {
e = rest.length;
}
done += rest.substring(0, s + 1);
done += cssPropertyMode(rest.substring(s + 1, e));
rest = rest.substr(e);
}
rest = done + rest;
rest = rest.replace(/{/g, "<span class='css-delimiter-" + theme.value + "'>{</span>");
rest = rest.replace(/}/g, "<span class='css-delimiter-" + theme.value + "'>}</span>");
for (i = 0; i < comment.arr.length; i++) {
rest = rest.replace("\uF002", comment.arr[i]);
}
rest = rest.replace(/\uF00C/g, ":").replace(/\uF00D/g, ";").replace(/\uF00E/g, "{").replace(/\uF00F/g, "}").replace(/\uF008/g, "&lt;").replace(/\uF009/g, "&gt;").replace(/\uF00A/g, "&amp;").replace(/\uF00B/g, "&nbsp;");
return "<span class='css-selector-" + theme.value + "'>" + rest + "</span>";
}
function cssPropertyMode(txt) {
let rest = txt, done = "";
let s, e;
if (rest.indexOf("{") > -1) {
return cssMode(rest);
}
while ((s = rest.indexOf(":")) > -1) {
e = rest.indexOf(";", s);
if (e === -1) e = rest.length;
done += rest.substring(0, s);
done += cssPropertyValueMode(rest.substring(s, e + 1));
rest = rest.substring(e + 1);
}
return "<span class='css-property-" + theme.value + "'>" + done + rest + "</span>";
}
function cssPropertyValueMode(txt) {
if (!txt) return "";
let value = "<span class='css-delimiter-" + theme.value + "'>:</span>"
+ txt.substring(1);
let last = value.indexOf(";");
if (last !== -1) {
value = value.substring(0, last) + "<span class='css-delimiter-" + theme.value + "'>;</span>" + value.substring(last + 1);
}
return "<span class='css-propertyValue-" + theme.value + "'>" + value + "</span>";
}
function jsMode(txt) {
var rest = txt, done = "", multilineCommentRanges = [], singlelineCommentRanges = [], idx = 0,
escNormal = [], escNewline = [], escBacktick = [], i, cc, tt = "", sfnuttpos, dfnuttpos, tfnuttpos, compos,
comlinepos, regexpos, keywordpos, numpos, mypos, dotpos, y;
while (idx < rest.length) {
var start = rest.indexOf("/*", idx);
if (start === -1) break;
var end = rest.indexOf("*/", start + 2);
if (end === -1) end = rest.length;
else end += 2;
multilineCommentRanges.push({ start, end });
idx = end;
}
idx = 0;
while (idx < rest.length) {
var start = rest.indexOf("//", idx);
if (start === -1) break;
var end = rest.indexOf("\n", start + 2);
if (end === -1) end = rest.length;
singlelineCommentRanges.push({ start, end });
idx = end;
}
for (i = 0; i < rest.length; i++) {
cc = rest[i];
var inMultilineComment = false, inSinglelineComment = false;
for (var c = 0; c < multilineCommentRanges.length; c++) {
if (i >= multilineCommentRanges[c].start && i < multilineCommentRanges[c].end) { inMultilineComment = true; break; }
}
for (var c = 0; c < singlelineCommentRanges.length; c++) {
if (i >= singlelineCommentRanges[c].start && i < singlelineCommentRanges[c].end) { inSinglelineComment = true; break; }
}
if (cc === "\\" && !inMultilineComment && !inSinglelineComment) {
if (i + 1 < rest.length && rest[i + 1] === "\n") { escNewline.push("\\\n"); cc = "\uF004"; i += 1; }
else if (i + 1 < rest.length) { escNormal.push(rest.substr(i, 2)); cc = "\uF003"; i += 1; }
}
tt += cc;
}
rest = tt;
function inlineTemplateParsing(txt) {
var out = "", i = 0;
while (i < txt.length) {
var c = txt[i];
if (c === "`") {
out += c;
i++;
while (i < txt.length) {
c = txt[i];
if (c === "\\") {
if (i + 1 < txt.length && txt[i + 1] === "\n") {
escNewline.push("\\\n");
out += "\uF004";
i += 2;
continue;
}
else if (i + 1 < txt.length) {
escNormal.push(txt.substr(i, 2));
out += "\uF003";
i += 2;
continue;
}
}
if (c === "$" && i + 1 < txt.length && txt[i + 1] === "{") {
out += "${"; i += 2;
var braceCount = 1;
while (i < txt.length && braceCount > 0) {
var cc = txt[i];
if (cc === "{") braceCount++;
else if (cc === "}") braceCount--;
if (cc === "`") { escBacktick.push("`"); cc = "\uF005"; }
if (cc === "\\" && i + 1 < txt.length) {
if (txt[i + 1] === "\n") { escNewline.push("\\\n"); cc = "\uF004"; i++; }
else { escNormal.push(txt.substr(i, 2)); cc = "\uF003"; i++; }
}
out += cc;
i++;
}
continue;
}
out += c;
i++;
if (c === "`") break;
}
continue;
}
out += c;
i++;
}
return out;
}
rest = inlineTemplateParsing(rest);
y = 1;
while (y === 1) {
regexpos = getRegexPos(rest, jsRegexMode);
sfnuttpos = getPos(rest, "'", "'", jsStringMode);
dfnuttpos = getPos(rest, '"', '"', jsStringMode);
tfnuttpos = getPos(rest, "`", "`", jsStringMode);
compos = getPos(rest, /\/\*/, "*/", commentMode);
comlinepos = getPos(rest, /\/\//, "\n", commentMode);
numpos = getNumPos(rest, jsNumberMode);
keywordpos = getKeywordPos("js", rest, jsKeywordMode);
dotpos = getDotPos(rest, jsPropertyMode);
if (Math.max(numpos[0], sfnuttpos[0], dfnuttpos[0], tfnuttpos[0], compos[0], comlinepos[0], regexpos[0], keywordpos[0], dotpos[0]) === -1) {
break;
}
mypos = getMinPos(numpos, sfnuttpos, dfnuttpos, tfnuttpos, compos, comlinepos, regexpos, keywordpos, dotpos);
if (mypos[0] === -1) {
break;
}
done += rest.substring(0, mypos[0]);
done += mypos[2](rest.substring(mypos[0], mypos[1]));
rest = rest.substr(mypos[1]);
}
rest = done + rest;
for (i = 0; i < escNormal.length; i++) rest = rest.replace("\uF003", escNormal[i]);
for (i = 0; i < escNewline.length; i++) rest = rest.replace("\uF004", escNewline[i]);
for (i = 0; i < escBacktick.length; i++) rest = rest.replace("\uF005", escBacktick[i]);

return rest;
}
function jsStringMode(txt) {
return "<span class='javascript-string-" + theme.value + "'>" + txt + "</span>";
}
function jsRegexMode(txt) {
return "<span class='javascript-regularExpression-" + theme.value + "'>" + txt + "</span>";
}
function jsKeywordMode(txt) {
return "<span class='javascript-keyword-" + theme.value + "'>" + txt + "</span>";
}
function jsNumberMode(txt) {
return "<span class='javascript-number-" + theme.value + "'>" + txt + "</span>";
}
function jsPropertyMode(txt) {
return "<span class='javascript-property-" + theme.value + "'>" + txt + "</span>";
}
function getRegexPos(txt, func) {
let pos1 = -1, pos2 = 0;
let match = txt.match(/\/(?:\\.|[^\n\/\\])*\/[gimsuy]*/);
if (match) {
pos1 = match.index;
let regexBody = match[0];
if (regexBody.includes("\uF004")) return [-1, -1, func];
let lastSlashIndex = regexBody.lastIndexOf("/");
let flags = regexBody.slice(lastSlashIndex + 1);
let flagSet = new Set(flags);
pos2 = (flagSet.size !== flags.length) ? pos1 + lastSlashIndex + 1 : pos1 + regexBody.length;
let prevChar = txt[pos1 - 1] || "";
if (/\w/.test(prevChar)) {
pos1 = -1;
pos2 = 0;
}
}
return [pos1, pos2, func];
}
function getDotPos(txt, func) {
var x, i, j, s, e, arr = [".", "<", ">", " ", ";", "(", "+", ")", "[", "]", ",", "&", ":", "?", "{", "}", "/" ,"-", "*", "|", "%", "=", "\n"];
s = txt.indexOf(".");
if (s > -1) {
x = txt.substr(s + 1);
for (j = 0; j < x.length; j++) {
cc = x[j];
for (i = 0; i < arr.length; i++) {
if (cc == arr[i]) {
e = j;
return [s + 1, e + s + 1, func];
}
}
}
}
return [-1, -1, func];
}
function getMinPos() {
var i, arr = [];
for (i = 0; i < arguments.length; i++) {
if (arguments[i][0] > -1) {
if (arr.length == 0 || arguments[i][0] < arr[0]) {arr = arguments[i];}
}
}
if (arr.length == 0) {arr = arguments[i];}
return arr;
}
function getKeywordPos(typ, txt, func) {
var words, i, pos, rpos = -1, rpos2 = -1, patt;
if (typ == "js") {
words = ["abstract", "arguments", "boolean", "break", "byte", "case", "catch", "char", "class", "const", "continue", "debugger", "default", "delete", "do", "double", "else", "enum", "eval", "export", "extends", "false", "final", "finally", "float", "for", "function", "goto", "if", "implements", "import", "in", "instanceof", "int", "interface", "let", "long", "NaN", "native", "new", "null", "package", "private", "protected", "public", "return", "short", "static", "super", "switch", "synchronized", "this", "throw", "throws", "transient", "true", "try", "typeof", "var", "void", "volatile", "while", "with", "yield"];
}
for (i = 0; i < words.length; i++) {
pos = txt.indexOf(words[i]);
if (pos > -1) {
patt = /\W/g;
if (txt.substr(pos + words[i].length,1).match(patt) && txt.substr(pos - 1,1).match(patt)) {
if (pos > -1 && (rpos == -1 || pos < rpos)) {
rpos = pos;
rpos2 = rpos + words[i].length;
}
}
} 
}
return [rpos, rpos2, func];
}
function getPos(txt, start, end, func) {
let s = txt.search(start);
if (s === -1) {
return [-1, -1, func];
}
if (start === '"' || start === "'") {
let i = s + 1;
while (i < txt.length) {
let ch = txt[i];
if (ch === start) {
let backslashCount = 0;
let j = i - 1;
while (j >= 0 && txt[j] === "\\") {
backslashCount++;
j--;
}
if (backslashCount % 2 === 0) {
break;
}
}
if (ch === "\n") {
break;
}
i++;
}
return [s, i + 1, func];
} 
else {
let e = txt.indexOf(end, s + (end.length || 0));
if (e === -1) {
e = txt.length;
}
return [s, e + (end.length || 0), func];
}
}

function getNumPos(txt, func) {
var arr = ["\n", " ", ";", "(", "+", ")", "[", "]", ",", "&", ":", "{", "}", "/" ,"-", "*", "|", "%", "="], i, j, c, startpos = 0, endpos, word;
for (i = 0; i < txt.length; i++) {
for (j = 0; j < arr.length; j++) {
c = txt.substr(i, arr[j].length);
if (c == arr[j]) {
if (c == "-" && (txt.substr(i - 1, 1) == "e" || txt.substr(i - 1, 1) == "E")) {
continue;
}
endpos = i;
if (startpos < endpos) {
word = txt.substring(startpos, endpos);
if (!isNaN(word)) {return [startpos, endpos, func];}
}
i += arr[j].length;
startpos = i;
i -= 1;
break;
}
}
}
return [-1, -1, func];
}
}

function updateLineNumbers(element, lineList) {
var lines = element.textContent.split("\n");
var lineCount;
if (lines.length > 1 && lines[lines.length - 1] === "") {
lines.pop();
}
lineCount = Math.max(1, lines.length);
lineList.innerHTML = "";
for (var i = 1; i <= lineCount; i++) {
var li = document.createElement("li");
li.textContent = i;
lineList.appendChild(li);
}
}
