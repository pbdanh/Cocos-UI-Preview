/**
 * LayoutEngine — Dev Tools (ES5)
 *
 * Validation, live-edit, diff, and snapshot utilities.
 * Used for development/preview only — not needed in production.
 */
(function(global) {
    var LayoutEngine = global.LayoutEngine;
    if (!LayoutEngine) return;

    /**
     * Validate the current layout tree for common issues.
     * @returns {Array} Array of { level: "error"|"warning"|"info", nodeId, message }
     */
    LayoutEngine.prototype.validate = function() {
        var issues = [];
        if (!this._root) {
            issues.push({ level: 'error', nodeId: null, message: 'No root node found.' });
            return issues;
        }

        var screenW = this._screenWidth || 0;
        var screenH = this._screenHeight || 0;
        var self = this;

        function check(node) {
            var id = node._id || node.name || '?';

            // 1. Missing size
            if (node._width === 0 && node._height === 0 && node.visible !== false) {
                issues.push({ level: 'warning', nodeId: id, message: 'Node has zero size (0×0).' });
            }

            // 2. Out of screen bounds
            if (node._absX !== undefined && node._absY !== undefined) {
                var right = node._absX + (node._width || 0);
                var top = node._absY + (node._height || 0);
                if (node._absX < 0 || node._absY < 0 || right > screenW || top > screenH) {
                    if (node !== self._root) {
                        issues.push({ level: 'info', nodeId: id,
                            message: 'Node extends beyond screen bounds (' +
                                Math.round(node._absX) + ',' + Math.round(node._absY) +
                                ' → ' + Math.round(right) + ',' + Math.round(top) + ').'
                        });
                    }
                }
            }

            // 3. Negative dimensions
            if ((node._width || 0) < 0 || (node._height || 0) < 0) {
                issues.push({ level: 'error', nodeId: id, message: 'Node has negative dimensions.' });
            }

            // 4. Conflicting constraints
            if (node.left !== undefined && node.right !== undefined && node.horizontalCenter !== undefined) {
                issues.push({ level: 'warning', nodeId: id,
                    message: 'Conflicting constraints: left + right + horizontalCenter all set.' });
            }
            if (node.top !== undefined && node.bottom !== undefined && node.verticalCenter !== undefined) {
                issues.push({ level: 'warning', nodeId: id,
                    message: 'Conflicting constraints: top + bottom + verticalCenter all set.' });
            }

            // 5. Missing name
            if (!node.name && !node.id) {
                issues.push({ level: 'info', nodeId: id, message: 'Node has no name or id (auto-generated: ' + id + ').' });
            }

            // 6. Opacity out of range
            if (node.opacity !== undefined && (node.opacity < 0 || node.opacity > 255)) {
                issues.push({ level: 'warning', nodeId: id,
                    message: 'Opacity (' + node.opacity + ') outside valid range [0, 255].' });
            }

            // 7. Invalid layoutType
            var validLayouts = ['Absolute', 'Linear', 'Grid', 'Wrap', 'ScrollView'];
            if (node.layoutType && validLayouts.indexOf(node.layoutType) === -1) {
                issues.push({ level: 'error', nodeId: id,
                    message: 'Unknown layoutType: "' + node.layoutType + '".' });
            }

            // 8. Flex without Linear parent
            if (node.flex && node.flex > 0) {
                var parentLayout = node._parent ? node._parent.layoutType : '';
                if (parentLayout !== 'Linear') {
                    issues.push({ level: 'warning', nodeId: id,
                        message: 'flex weight set but parent layout is "' + parentLayout + '" (not Linear).' });
                }
            }

            // 9. ScrollView without clipping
            if (node.layoutType === 'ScrollView' && !node.clipping) {
                issues.push({ level: 'info', nodeId: id,
                    message: 'ScrollView without clipping — content may overflow visually.' });
            }

            // Recurse
            if (node.children) {
                for (var c = 0; c < node.children.length; c++) {
                    check(node.children[c]);
                }
            }
        }

        check(this._root);
        return issues;
    };

    /**
     * Live-edit: set a property on a node and re-compute layout.
     */
    LayoutEngine.prototype.setNodeProp = function(id, prop, value) {
        var node = this._nodeMap[id] || this._nodeMap[String(id)];
        if (!node) return { ok: false, error: 'Node not found: ' + id };
        node[prop] = value;
        var layoutProps = ['width', 'height', 'left', 'right', 'top', 'bottom',
            'percentWidth', 'percentHeight', 'flex', 'gap', 'padding', 'margin',
            'horizontalCenter', 'verticalCenter', 'percentX', 'percentY',
            'visible', 'layoutType', 'flexDirection', 'alignItems', 'justifyContent'];
        var needsRelayout = layoutProps.indexOf(prop) !== -1;
        if (needsRelayout && this._screenWidth) {
            this.computeLayout(this._screenWidth, this._screenHeight, this._safeAreaInsets);
        } else {
            if (prop === 'rotation') node._rotation = value;
            if (prop === 'opacity') node._opacity = value;
            if (prop === 'visible') node._visible = value;
            if (prop === 'zOrder') node._zOrder = value;
            if (prop === 'scaleX') node._scaleX = value;
            if (prop === 'scaleY') node._scaleY = value;
        }
        return { ok: true, bounds: this.getNodeBounds(id) };
    };

    LayoutEngine.prototype.diffLayout = function(prevBoundsMap) {
        var diffs = [];
        var compareProps = ['x', 'y', 'width', 'height', 'absX', 'absY', 'scaleX', 'scaleY', 'rotation', 'opacity', 'visible'];
        for (var id in this._nodeMap) {
            var current = this.getNodeBounds(id);
            var prev = prevBoundsMap[id];
            if (!current || !prev) continue;
            for (var p = 0; p < compareProps.length; p++) {
                var prop = compareProps[p];
                if (prev[prop] !== current[prop]) diffs.push({ nodeId: id, prop: prop, oldValue: prev[prop], newValue: current[prop] });
            }
        }
        return diffs;
    };

    LayoutEngine.prototype.snapshotBounds = function() {
        var snapshot = {};
        for (var id in this._nodeMap) snapshot[id] = this.getNodeBounds(id);
        return snapshot;
    };

})(typeof window !== 'undefined' ? window : this);
