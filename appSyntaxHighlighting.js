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
var out = "";
var pos = 0;
var openTagRegex = /&lt;(script|style)\b/gi;
var match;
while ((match = openTagRegex.exec(txt)) !== null) {
var start = match.index;
out += txt.substring(pos, start);
var openTagEnd = txt.indexOf("&gt;", start);
if (openTagEnd === -1) openTagEnd = txt.length;
var blockStart = openTagEnd + 4;
var tagName = match[1].toLowerCase();
var closeTagRegex = new RegExp(`&lt;\\s*\\/${tagName}\\s*&gt;`, "i");
var closingMatch = closeTagRegex.exec(txt.slice(blockStart));
var blockEnd;
if (closingMatch) {
blockEnd = blockStart + closingMatch.index;
} else {
blockEnd = txt.length;
}
var inner = txt.substring(blockStart, blockEnd);
inner = inner.replace(/&lt;!--/g, "&lt;<HTMLCOMMENT_INSERTION></HTMLCOMMENT_INSERTION>!--");
out += txt.substring(start, blockStart) + inner;
if (closingMatch) {
var closingTagStart = blockEnd;
var closingTagEnd = blockEnd + closingMatch[0].length;
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
function disableHtmlCommentsInsideTags(txt) {
var out = "";
var i = 0;
while (i < txt.length) {
if (txt.startsWith("&lt;", i) && !txt.startsWith("&lt;!--", i)) {
var tagStart = i;
var tagEnd = txt.indexOf("&gt;", i + 4);
if (tagEnd === -1) {
var tagBody = txt.slice(i);
tagBody = tagBody.replace(/&lt;!--/g, "&lt;<HTMLCOMMENT_INSERTION></HTMLCOMMENT_INSERTION>!--");
out += tagBody;
break;
}
var tagText = txt.slice(i, tagEnd + 4);
tagText = tagText.replace(/&lt;!--/g, "&lt;<HTMLCOMMENT_INSERTION></HTMLCOMMENT_INSERTION>!--");
out += tagText;
i = tagEnd + 4;
continue;
}
out += txt[i];
i++;
}
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
function mainReplacement(source) {
function isEligibleQuote(str, pos) {
var j = pos - 1;
while (j >= 0 && str[j] === " ") j--;
if (j < 0 || str[j] !== "=") return false;
var substring = str.slice(0, j);
if (!/\s/.test(substring)) return false;
return true;
}
function findTagEnd(str, startIndex) {
if (str.startsWith("&lt;/", startIndex)) {
var end = str.indexOf("&gt;", startIndex);
return end === -1 ? str.length - 1 : end;
}
var inSingle = false, inDouble = false;
var i = startIndex + 4;
while (i < str.length) {
var ch = str[i];
if (!inSingle && ch === '"' && isEligibleQuote(str, i)) { inDouble = true; i++; continue; }
if (!inDouble && ch === "'" && isEligibleQuote(str, i)) { inSingle = true; i++; continue; }
if (inDouble && ch === '"') { inDouble = false; i++; continue; }
if (inSingle && ch === "'") { inSingle = false; i++; continue; }
if (!inSingle && !inDouble && str.startsWith("&gt;", i)) return i;
i++;
}
return str.length - 1;
}
var result = "", pos = 0;
while (pos < source.length) {
var tagStart = source.indexOf("&lt;", pos);
if (tagStart === -1) { result += source.substring(pos); break; }
result += source.substring(pos, tagStart);
var tagEnd = findTagEnd(source, tagStart);
var tagText = source.substring(tagStart, tagEnd + 1);
var processed = "";
if (tagText.startsWith("&lt;/")) {
processed = tagText;
} else {
var inSingle = false, inDouble = false;
for (var i = 0; i < tagText.length; i++) {
if (!inSingle && tagText[i] === '"' && isEligibleQuote(tagText, i)) { inDouble = true; processed += '"'; continue; }
if (!inDouble && tagText[i] === "'" && isEligibleQuote(tagText, i)) { inSingle = true; processed += "'"; continue; }
if (inDouble && tagText[i] === '"') { inDouble = false; processed += '"'; continue; }
if (inSingle && tagText[i] === "'") { inSingle = false; processed += "'"; continue; }
if ((inSingle || inDouble) && tagText.startsWith("&gt;", i)) { processed += "<GT_ESCAPE></GT_ESCAPE>"; i += 3; continue; }
if ((inSingle || inDouble) && tagText.startsWith("&lt;", i)) { processed += "<LT_ESCAPE></LT_ESCAPE>"; i += 3; continue; }
processed += tagText[i];
}
}
result += processed;
pos = tagEnd + 1;
if (tagEnd === source.length - 1) break;
}
return result;
}
var out = mainReplacement(txt);
var pos = 0;
while (pos < out.length) {
var scriptOpen = out.toLowerCase().indexOf("&lt;script", pos);
var styleOpen = out.toLowerCase().indexOf("&lt;style", pos);
var nextTag, nextTagName;
if (scriptOpen !== -1 && (styleOpen === -1 || scriptOpen < styleOpen)) { nextTag = scriptOpen; nextTagName = "script"; }
else if (styleOpen !== -1) { nextTag = styleOpen; nextTagName = "style"; }
else break;
var openEnd = out.indexOf("&gt;", nextTag);
if (openEnd === -1) { pos = nextTag + 1; continue; }
openEnd += 4;
var closeTagRegex = new RegExp(`&lt;/` + nextTagName + `\\s*&gt;`, "i");
var match = closeTagRegex.exec(out.slice(openEnd));
var closeEnd;
if (match) {
closeEnd = openEnd + match.index + match[0].length;
} else {
closeEnd = out.length;
}
out = out.slice(0, openEnd) + out.slice(openEnd, closeEnd).replace(/<LT_ESCAPE><\/LT_ESCAPE>/g, "&lt;").replace(/<GT_ESCAPE><\/GT_ESCAPE>/g, "&gt;") + out.slice(closeEnd);
pos = closeEnd;
}
return out;
}
function htmlMode(txt) {
var rest = txt, done = "", comment, startpos, endpos, note, i;
rest = disableHTMLCommentsInScriptAndStyle(rest);
rest = disableHtmlCommentsInsideTags(rest);
comment = new extract(rest, "&lt;!--", "--&gt;", commentMode, "<HTMLCOMMENT_ESCAPE></HTMLCOMMENT_ESCAPE>");
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
var match = rest.match(/&lt;\/style\s*&gt;/i);
endpos = match ? match.index : rest.length;
done += cssMode(rest.substring(0, endpos));
rest = rest.substr(endpos);
}
if (note === "javascript") {
var match = rest.match(/&lt;\/script\s*&gt;/i);
endpos = match ? match.index : rest.length;
done += jsMode(rest.substring(0, endpos));
rest = rest.substr(endpos);
}
}
rest = done + rest;
for (i = 0; i < comment.arr.length; i++) {
rest = rest.replace("<HTMLCOMMENT_ESCAPE></HTMLCOMMENT_ESCAPE>", comment.arr[i]);
}
rest = rest.replace(/<HTMLCOMMENT_INSERTION><\/HTMLCOMMENT_INSERTION>/g, "");
rest = rest.replace(/<LT_ESCAPE><\/LT_ESCAPE>/g, "&lt;");
rest = rest.replace(/<GT_ESCAPE><\/GT_ESCAPE>/g, "&gt;");
return rest;
}
function tagMode(txt) {
var result = "";
if (txt.startsWith("&lt;/")) {
var endBracketPos = txt.indexOf("&gt;");
var tagName;
var hasEndBracket = endBracketPos !== -1;
if (hasEndBracket) {
tagName = txt.slice(5, endBracketPos);
} else {
tagName = txt.slice(5);
}
result = "<span class='html-bracket-" + theme.value + "'>&lt;</span>" + "<span class='html-close-" + theme.value + "'>/</span>" + tagName;

if (hasEndBracket) {
result += "<span class='html-bracket-" + theme.value + "'>&gt;</span>";
}
} else {
var rest = txt, done = "", startpos, endpos, name;
while (rest.search(/(\s|\n)/) > -1) {
startpos = rest.search(/(\s|\n)/);
endpos = rest.indexOf("&gt;");
if (endpos === -1) endpos = rest.length;
done += rest.substring(0, startpos);
done += attributeMode(rest.substring(startpos, endpos));
rest = rest.substr(endpos);
}
result = done + rest;
name = result.substring(4);
result = "<span class='html-bracket-" + theme.value + "'>&lt;</span>" + name;
if (result.endsWith("&gt;")) {
result = result.slice(0, -4) + "<span class='html-bracket-" + theme.value + "'>&gt;</span>";
}
}
return "<span class='html-tag-" + theme.value + "'>" + result + "</span>";
}
function attributeMode(txt) {
var rest = txt;
var done = "";
while (true) {
var eqPos = rest.indexOf("=");
if (eqPos === -1) break;
done += rest.substring(0, eqPos);
var valStart = eqPos + 1;
while (rest[valStart] === " ") {
valStart++;
}
var endpos = -1;
if (rest[valStart] === '"') {
endpos = rest.indexOf('"', valStart + 1);
} else if (rest[valStart] === "'") {
endpos = rest.indexOf("'", valStart + 1);
} else {
var space = rest.indexOf(" ", valStart);
endpos = space === -1 ? rest.length : space - 1;
}
if (endpos === -1) {
endpos = rest.length - 1;
}
var attrSegment = rest.substring(eqPos, endpos + 1);
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
function makeCssSafe(text) {
var inSingle = false, inDouble = false, inBacktick = false;
var colonPlaceholder = "<CSSCOLON_ESCAPE></CSSCOLON_ESCAPE>", semicolonPlaceholder = "<CSSSEMICOLON_ESCAPE></CSSSEMICOLON_ESCAPE>", openingBracePlaceholder = "<CSSOPENINGBRACE_ESCAPE></CSSOPENINGBRACE_ESCAPE>", closingBracePlaceholder = "<CSSCLOSINGBRACE_ESCAPE></CSSCLOSINGBRACE_ESCAPE>";
var result = "";
text = text.replace(/&lt;/g, "<CSSLT_ESCAPE></CSSLT_ESCAPE>").replace(/&gt;/g,"<CSSGT_ESCAPE></CSSGT_ESCAPE>").replace(/&amp;/g, "<CSSAMP_ESCAPE></CSSAMP_ESCAPE>").replace(/&nbsp;/g,"<CSSNOBREAK_ESCAPE></CSSNOBREAK_ESCAPE>");
for (var i = 0; i < text.length; i++) {
var ch = text[i];
if ((inSingle || inDouble || inBacktick) && ch === "\\") {
result += ch;
if (i + 1 < text.length) {
result += text[i + 1];
i++;
}
continue;
}
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
} else if ((inSingle || inDouble || inBacktick) && ch === "}") {
result += closingBracePlaceholder;
} else if ((inSingle || inDouble || inBacktick) && ch === "{") {
result += openingBracePlaceholder;
} else if ((inSingle || inDouble || inBacktick) && ch === ":") {
result += colonPlaceholder;
} else {
result += ch;
}
}
return result;
}
function cssMode(txt) {
var rest = makeCssSafe(txt), done = "", s, e, comment, i, midz, c, cc;
comment = new extract(rest, /\/\*/, "*/", commentMode, "<CSSCOMMENT_ESCAPE></CSSCOMMENT_ESCAPE>");
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
rest = rest.replace("<CSSCOMMENT_ESCAPE></CSSCOMMENT_ESCAPE>", comment.arr[i]);
}
rest = rest.replace(/<CSSCOLON_ESCAPE><\/CSSCOLON_ESCAPE>/g, ":").replace(/<CSSSEMICOLON_ESCAPE><\/CSSSEMICOLON_ESCAPE>/g, ";").replace(/<CSSOPENINGBRACE_ESCAPE><\/CSSOPENINGBRACE_ESCAPE>/g, "{").replace(/<CSSCLOSINGBRACE_ESCAPE><\/CSSCLOSINGBRACE_ESCAPE>/g, "}").replace(/<CSSLT_ESCAPE><\/CSSLT_ESCAPE>/g, "&lt;").replace(/<CSSGT_ESCAPE><\/CSSGT_ESCAPE>/g, "&gt;").replace(/<CSSAMP_ESCAPE><\/CSSAMP_ESCAPE>/g, "&amp;").replace(/<CSSNOBREAK_ESCAPE><\/CSSNOBREAK_ESCAPE>/g, "&nbsp;");
return "<span class='css-selector-" + theme.value + "'>" + rest + "</span>";
}
function cssPropertyMode(txt) {
var rest = txt, done = "";
var s, e;
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
var value = "<span class='css-delimiter-" + theme.value + "'>:</span>"
+ txt.substring(1);
var last = value.indexOf(";");
if (last !== -1) {
value = value.substring(0, last) + "<span class='css-delimiter-" + theme.value + "'>;</span>" + value.substring(last + 1);
}
return "<span class='css-propertyValue-" + theme.value + "'>" + value + "</span>";
}
function jsMode(txt) {
var rest = txt, done = "", multilineCommentRanges = [], singlelineCommentRanges = [], idx = 0, i, cc, tt = "", sfnuttpos, dfnuttpos, tfnuttpos, compos, comlinepos, regexpos, keywordpos, numpos, mypos, dotpos, y;
rest = rest + ")";
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
tt += cc;
}
rest = tt;
y = 1;
while (y === 1) {
regexpos = getRegexPos(rest, jsRegexMode);
sfnuttpos = getPos(rest, "'", "'", jsStringMode);
dfnuttpos = getPos(rest, '"', '"', jsStringMode);
tfnuttpos = getTemplateLiteralPos(rest, jsTemplateLiteralMode);
compos = getPos(rest, /\/\*/, "*/", commentMode);
comlinepos = getPos(rest, "//", "\n", commentMode);
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
rest = rest.substring(0, rest.lastIndexOf(")")) + rest.substring(rest.lastIndexOf(")") + 1);
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
function jsTemplateLiteralMode(txt) {
var out = "";
var i = 0;
function stripSpans(s) { return s.replace(/<\/?span[^>]*>/g, ""); }
function findCompleteSpan(txt, startPos) {
if (!txt.startsWith("<span", startPos)) return null;
var stack = [];
var pos = startPos;
while (pos < txt.length) {
if (txt.startsWith("<span", pos)) { stack.push("span"); pos += 5; continue; }
if (txt.startsWith("</span>", pos)) { stack.pop(); pos += 7; if (stack.length === 0) return pos; continue; }
pos++;
}
return txt.length;
}
function restoreSpans(exprPart, savedSpans) {
var result = "";
var placeholder = "<JSTEMPEXPR_ESCAPE></JSTEMPEXPR_ESCAPE>";
var idx = 0;
for (var s = 0; s < savedSpans.length; s++) {
var pos = exprPart.indexOf(placeholder, idx);
if (pos === -1) break;
result += exprPart.slice(idx, pos);
result += savedSpans[s];
idx = pos + placeholder.length;
}
result += exprPart.slice(idx);
return result;
}
while (i < txt.length) {
if (txt[i] === "`") {
out += "<span class='javascript-string-" + theme.value + "'>`";
i++;
while (i < txt.length) {
if (txt[i] === "`" && txt[i - 1] !== "\\") { out += "`</span>"; i++; break; }
if (txt[i] === "$" && txt[i + 1] === "{" && txt[i - 1] !== "\\") {
out += "<span class='javascript-templateBrace-" + theme.value + "'>${</span>";
i += 2;
var raw = txt.slice(i);
var highlighted = jsMode(raw);
var savedSpans = [];
var escaped = "";
var pos = 0;
while (pos < highlighted.length) {
if (highlighted.startsWith("<span", pos)) {
var end = findCompleteSpan(highlighted, pos);
savedSpans.push(highlighted.slice(pos, end));
escaped += "<JSTEMPEXPR_ESCAPE></JSTEMPEXPR_ESCAPE>";
pos = end;
}
else {
escaped += highlighted[pos];
pos++;
}
}
var depth = 1, closePos = -1;
for (var k = 0; k < escaped.length; k++) {
if (escaped[k] === "{") depth++;
if (escaped[k] === "}") depth--;
if (depth === 0) { closePos = k; break; }
}
if (closePos === -1) closePos = escaped.length;
var exprPart = escaped.slice(0, closePos);
exprPart = restoreSpans(exprPart, savedSpans);
out += "<span class='javascript-templateExpression-" + theme.value + "'>" + exprPart + "</span>";
var exprClean = stripSpans(exprPart);
if (txt[i + exprClean.length] === "}") {
out += "<span class='javascript-templateBrace-" + theme.value + "'>}</span>";
i += exprClean.length + 1;
}
else {
i += exprClean.length;
}
continue;
}
out += txt[i];
i++;
}
if (!out.endsWith("</span>")) out += "</span>";
continue;
}
out += txt[i];
i++;
}
return out;
}
function getTemplateLiteralPos(txt, func) {
const stripSpans = s => s.replace(/<\/?span[^>]*>/g, "");
const clean = stripSpans(txt);
var i = 0;
function findCompleteSpan(txt, startPos) {
if (!txt.startsWith("<span", startPos)) return null;
var stack = [];
var pos = startPos;
while (pos < txt.length) {
if (txt.startsWith("<span", pos)) { stack.push("span"); pos += 5; continue; }
if (txt.startsWith("</span>", pos)) { stack.pop(); pos += 7; if (stack.length === 0) return pos; continue; }
pos++;
}
return txt.length;
}
while (i < clean.length) {
if (clean[i] === "`") {
var start = i;
i++;
while (i < clean.length) {
if (clean[i] === "`" && clean[i - 1] !== "\\") return [start, i + 1, func];
if (clean[i] === "$" && clean[i + 1] === "{" && clean[i - 1] !== "\\") {
i += 2;
var raw = clean.slice(i);
var highlighted = jsMode(raw);
var savedSpans = [];
var escaped = "";
var pos = 0;
while (pos < highlighted.length) {
if (highlighted.startsWith("<span", pos)) {
var end = findCompleteSpan(highlighted, pos);
savedSpans.push(highlighted.slice(pos, end));
escaped += "<JSTEMPEXPR_ESCAPE></JSTEMPEXPR_ESCAPE>";
pos = end;
}
else {
escaped += highlighted[pos];
pos++;
}
}
var depth = 1, closePos = -1;
for (var k = 0; k < escaped.length; k++) {
if (escaped[k] === "{") depth++;
if (escaped[k] === "}") depth--;
if (depth === 0) { closePos = k; break; }
}
if (closePos === -1) closePos = escaped.length;
var exprPart = escaped.slice(0, closePos);
var idx = 0;
var placeholder = "<JSTEMPEXPR_ESCAPE></JSTEMPEXPR_ESCAPE>";
for (var s = 0; s < savedSpans.length; s++) {
var p = exprPart.indexOf(placeholder, idx);
if (p === -1) break;
exprPart = exprPart.slice(0, p) + savedSpans[s] + exprPart.slice(p + placeholder.length);
idx = p + savedSpans[s].length;
}
var exprClean = stripSpans(exprPart);
i += exprClean.length + 1;
continue;
}
i++;
}
return [start, clean.length, func];
}
i++;
}
return [-1, -1, func];
}
function getRegexPos(txt, func) {
var pos1 = -1, pos2 = 0;
for (var i = 0; i < txt.length; i++) {
if (txt[i] === "/" && !(/\w/.test(txt[i - 1] || "")) && txt[i - 1] !== "<") {
pos1 = i;
break;
}
}
if (pos1 === -1) return [-1, -1, func];
var inBracket = false;
var closed = false;
var i = pos1 + 1;
while (i < txt.length) {
if (txt[i] === "\n") break;
if (txt[i] === "[" && !inBracket) {
inBracket = true;
i++;
continue;
}
if (txt[i] === "]" && inBracket) {
inBracket = false;
i++;
continue;
}
if (txt[i] === "/" && !inBracket) {
var backslashCount = 0;
var j = i - 1;
while (j >= 0 && txt[j] === "\\") {
backslashCount++;
j--;
}
if (backslashCount % 2 === 0) {
closed = true;
i++;
break;
}
}
i++;
}
if (!closed) return [-1, -1, func];
pos2 = i;
var seen = new Set();
while (i < txt.length) {
var f = txt[i];
if ("gimsuy".includes(f) && !seen.has(f)) {
seen.add(f);
i++;
}
else break;
}
pos2 = i;
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
var s = txt.search(start);
if (s === -1) {
return [-1, -1, func];
}
if (start === '"' || start === "'") {
var i = s + 1;
while (i < txt.length) {
var ch = txt[i];
if (ch === start) {
var backslashCount = 0;
var j = i - 1;
while (j >= 0 && txt[j] === "\\") {
backslashCount++;
j--;
}
if (backslashCount % 2 === 0) {
break;
}
}
if (ch === "\n") {
var backslashCount = 0;
var j = i - 1;
while (j >= 0 && txt[j] === "\\") {
backslashCount++;
j--;
}
if (backslashCount % 2 === 0) {
break;
}
}
i++;
}
return [s, i + 1, func];
}
else if (start === "//") {
var e = txt.indexOf(end, s);
if (e === -1) {
e = txt.length;
}
return [s, e, func];
}
else {
var e = txt.indexOf(end, s + (end.length || 0));
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
