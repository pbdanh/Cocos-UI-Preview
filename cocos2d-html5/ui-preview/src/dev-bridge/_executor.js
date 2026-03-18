/**
 * dev-bridge/_executor.js — JS executor, snippets, command history
 */
(function () {
    "use strict";

    var B = window.__devBridge;
    var S = B.state;

    // ─── Snippets Data ──────────────────────────────────────────
    B.data.snippets = [
        { label: "getPos", code: "this.getPosition()" },
        { label: "setPos", code: "this.setPosition(100, 100)" },
        { label: "getScale", code: "this.getScale()" },
        { label: "scale×2", code: "this.setScale(this.getScale() * 2)" },
        { label: "hide", code: "this.setVisible(false)" },
        { label: "show", code: "this.setVisible(true)" },
        { label: "remove", code: "this.removeFromParent(true)" },
        { label: "children", code: "$children.map(function(c){ return c.getName() || $cls(c) })" },
        { label: "getText", code: "this.getString ? this.getString() : '(no getString)'" },
        { label: "size", code: "this.getContentSize()" },
        { label: "opacity", code: "this.getOpacity()" },
        { label: "worldBB", code: "DevBridge._getWorldBB(this)" }
    ];

    // ─── Build Snippets UI ─────────────────────────────────────
    B.fn.buildSnippets = function () {
        var container = document.getElementById("dev-snippets");
        container.innerHTML = "";
        for (var i = 0; i < B.data.snippets.length; i++) {
            (function (snip) {
                var btn = document.createElement("button");
                btn.className = "dev-snippet-btn";
                btn.textContent = snip.label;
                btn.title = snip.code;
                btn.addEventListener("click", function () {
                    document.getElementById("dev-cmd-input").value = snip.code;
                    B.fn.execJS(snip.code);
                });
                container.appendChild(btn);
            })(B.data.snippets[i]);
        }
    };

    // ─── JS Executor ───────────────────────────────────────────
    B.fn.execJS = function (code) {
        var output = document.getElementById("dev-cmd-output");
        if (!code || !code.trim()) return;

        // Save to history
        if (S.cmdHistory.length === 0 || S.cmdHistory[S.cmdHistory.length - 1] !== code) {
            S.cmdHistory.push(code);
            if (S.cmdHistory.length > 50) S.cmdHistory.shift();
        }
        S.cmdHistoryIdx = -1;

        try {
            var $node = S.selectedNode;
            var $parent = S.selectedNode ? S.selectedNode.getParent() : null;
            var $scene = cc.director.getRunningScene();
            var $children = S.selectedNode ? S.selectedNode.getChildren() : [];
            var $cls = B.fn.getClassName;
            var $find = B.fn.findNodeByPath;

            // Try to auto-return the last expression
            var lines = code.split("\n");
            var lastLine = lines[lines.length - 1].trim();
            var body = code;
            var needsReturn = !/^(if |for |while |switch |try |return |throw |\/\/)/.test(lastLine);
            // Handle var/let/const: extract variable name and return it
            var varMatch = needsReturn && lastLine.match(/^(?:var|let|const)\s+([\w$]+)/);
            if (varMatch) {
                if (lines.length === 1) {
                    body = code + "; return " + varMatch[1];
                } else {
                    body = code + "\nreturn " + varMatch[1];
                }
            } else if (needsReturn && lines.length === 1) {
                body = "return (" + code + ")";
            } else if (needsReturn && lines.length > 1) {
                lines[lines.length - 1] = "return (" + lastLine + ")";
                body = lines.join("\n");
            }

            var result;
            try {
                var fn = new Function(
                    "$node", "$parent", "$scene", "$children", "$cls", "$find",
                    "return (function(){ " + body + "\n}).call($node)"
                );
                result = fn($node, $parent, $scene, $children, $cls, $find);
            } catch (e1) {
                var fn2 = new Function(
                    "$node", "$parent", "$scene", "$children", "$cls", "$find",
                    "return (function(){ " + code + "\n}).call($node)"
                );
                result = fn2($node, $parent, $scene, $children, $cls, $find);
            }

            var text;
            if (result === undefined) {
                text = "(undefined)";
            } else if (result === null) {
                text = "(null)";
            } else if (typeof result === "object") {
                try { text = JSON.stringify(result, null, 2); }
                catch (e) { text = String(result); }
            } else {
                text = String(result);
            }
            output.style.color = "#4ade80";
            output.textContent = text;
            B.fn.refreshTree();
            B.fn.updateInspector();
            B.fn.updateCtxHint();
        } catch (err) {
            output.style.color = "#f87171";
            output.textContent = "ERROR: " + err.message;
        }
    };

    // ─── Context Hint ──────────────────────────────────────────
    B.fn.updateCtxHint = function () {
        var hint = document.getElementById("dev-ctx-hint");
        if (!hint) return;
        if (S.selectedNode) {
            var n = S.selectedNode.getName() || B.fn.getClassName(S.selectedNode);
            hint.innerHTML = 'this = <span class="node-name">' + B.fn.escHtml(n) + '</span> (' + B.fn.getClassName(S.selectedNode) + ')';
        } else {
            hint.textContent = "no node selected";
        }
    };
})();
