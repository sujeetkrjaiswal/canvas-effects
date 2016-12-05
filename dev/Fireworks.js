var Fireworks;
(function (Fireworks) {
    /**Fireworks is a module which will create a firework animation on the canvas element
     * passed to the application. This will fire from the bottom middle of the canvas and
     * will go to the destination point where it will blast roughly in a circle
     */
    /**Config is a public interface provide to the end-user to provide the required configuration */
    var Config = (function () {
        function Config(percentIncrement, maxBlastRad, flameInQuater, fps) {
            if (percentIncrement === void 0) { percentIncrement = 5; }
            if (maxBlastRad === void 0) { maxBlastRad = 0.1; }
            if (flameInQuater === void 0) { flameInQuater = 20; }
            if (fps === void 0) { fps = 100; }
            this.percentIncrement = percentIncrement;
            this.maxBlastRad = maxBlastRad;
            this.flameInQuater = flameInQuater;
            this.animateCallRate = 1000 / fps;
        }
        return Config;
    }());
    Fireworks.Config = Config;
    /**This would provide the interface to external application to initiate the firework.
     *
    */
    var App = (function () {
        function App(canvas, config, callbackOnEmpty) {
            this.mouseDown = false;
            this.isAnimActive = false;
            this.canvas = canvas;
            this.factor = new Point(0, 0);
            this.context = this.canvas.getContext('2d');
            this.updateCanvasAndFactor();
            this.config = config;
            this.flamePointFactory = new FlamePointFactory(config);
            this.flamePaths = [];
            this.callbackOnEmpty = callbackOnEmpty;
            this.addListners();
        }
        App.prototype.reset = function () {
            this.flamePaths = [];
            this.context.fillStyle = "rgba(0,0,0,1)";
            this.context.fillRect(0, 0, this.factor.x, this.factor.y);
        };
        App.prototype.addFlameBlasts = function (blastPoints, isLiteBlast) {
            var _this = this;
            if (isLiteBlast === void 0) { isLiteBlast = false; }
            (_a = this.flamePaths).push.apply(_a, blastPoints.map(function (point) { return _this.flamePointFactory.getPreBlastFlamePoint(point.divide(_this.factor), isLiteBlast); }));
            if (!this.isAnimActive) {
                this.animateRequester();
                this.isAnimActive = true;
            }
            var _a;
        };
        App.prototype.updateCanvasAndFactor = function () {
            this.factor.x = this.canvas.clientWidth;
            this.factor.y = this.canvas.clientHeight;
            this.canvas.width = this.factor.x;
            this.canvas.height = this.factor.y;
            this.shadeCanvas();
        };
        App.prototype.addListners = function () {
            var _this = this;
            window.onresize = function (event) {
                _this.updateCanvasAndFactor();
            };
        };
        App.prototype.animateRequester = function () {
            var _this = this;
            if (this.flamePaths.length) {
                setTimeout(function () {
                    requestAnimationFrame(function () { _this.animate(); });
                }, this.config.animateCallRate);
            }
            else {
                this.isAnimActive = false;
                (function (callback) { callback(); })(this.callbackOnEmpty);
            }
        };
        App.prototype.animate = function () {
            var _this = this;
            var temp_postBlastContainer = [];
            //Filter completed FlamePoint
            this.flamePaths = this.flamePaths.filter(function (fpaths) {
                if (fpaths.completion >= 100) {
                    if (fpaths.stage == FlamePointStage.preBlast) {
                        temp_postBlastContainer.push(fpaths);
                    }
                    return false;
                }
                return true;
            });
            //Add FlamePoints from temp_postBlastContainer for stage-2 i.e FlamePointStage.postBlast
            (_a = this.flamePaths).push.apply(_a, temp_postBlastContainer.reduce(function (arr, fpoint) {
                arr.push.apply(arr, _this.flamePointFactory.getPostBlastFlamePoints(fpoint.path.end, fpoint.isLiteBlast));
                return arr;
            }, []));
            this.drawOnCanvas();
            this.animateRequester();
            var _a;
        };
        App.prototype.shadeCanvas = function () {
            this.context.fillStyle = "rgba(0,0,0,0.2)";
            this.context.fillRect(0, 0, this.factor.x, this.factor.y);
        };
        App.prototype.drawOnCanvas = function () {
            var _this = this;
            this.shadeCanvas();
            this.flamePaths.forEach(function (flamePoint) {
                var startPoint = flamePoint.getNextPoint().multiple(_this.factor);
                var endPoint = flamePoint.getTrailEndPoint().multiple(_this.factor);
                _this.context.beginPath();
                _this.context.moveTo(startPoint.x, startPoint.y);
                _this.context.lineTo(endPoint.x, endPoint.y);
                if (flamePoint.stage == FlamePointStage.preBlast) {
                    _this.context.strokeStyle = flamePoint.color.toString();
                }
                else {
                    var decay = flamePoint.completion < 75 ? 0 : flamePoint.completion / 100;
                    _this.context.strokeStyle = flamePoint.color.toString(flamePoint.completion / 100);
                }
                _this.context.stroke();
                //this.context.closePath();
            });
        };
        return App;
    }());
    Fireworks.App = App;
    /**Stages in a firework
     * preBlast : forms a line between bottom center and the destination (blast point)
     * postBlast : addes multiple points with origin as the blast point and destination as random points around the config.radius
     */
    var FlamePointStage;
    (function (FlamePointStage) {
        FlamePointStage[FlamePointStage["preBlast"] = 0] = "preBlast";
        FlamePointStage[FlamePointStage["postBlast"] = 1] = "postBlast";
    })(FlamePointStage || (FlamePointStage = {}));
    /**Point : represents a dot with its coordinates
     * It denote the coordinates using x and y coordinates (rectangular coordinate system)
     * other utility functions are defined on this to facilitate other dependent functions
     */
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        Point.prototype.diff = function (end) {
            return new Point(end.x - this.x, end.y - this.y);
        };
        Point.prototype.add = function (point) {
            return new Point(this.x + point.x, this.y + point.y);
        };
        Point.prototype.multiple = function (factor) {
            return new Point(this.x * factor.x, this.y * factor.y);
        };
        Point.prototype.divide = function (factor) {
            return new Point(this.x / factor.x, this.y / factor.y);
        };
        Point.prototype.getFactoredPoint = function (initialPoint, factor) {
            return new Point(initialPoint.x + factor * this.x, initialPoint.y + factor * this.y);
        };
        return Point;
    }());
    Fireworks.Point = Point;
    /**Line Class represents a virtual line between the source and destination point
     * for faster performance reasons, we also stores diff between the source and destination
     *
     * It has a method which calculates the point at certain percentage
     */
    var Line = (function () {
        function Line(start, end) {
            this.start = start;
            this.end = end;
            this.diff = this.start.diff(end);
        }
        Line.prototype.xyAtPercentage = function (percentage) {
            return this.diff.getFactoredPoint(this.start, percentage / 100);
        };
        return Line;
    }());
    /**Flame Point represents the burning point in an firework
     * path : keeps the line to which the flame point will travel
     * stage : blast stage - preBlast, postBlast
     * completion : stores the percentage of the path which flame has already covered
     * color : hls value of the flame point
    */
    var FlamePoint = (function () {
        function FlamePoint(path, stage, config, isLiteBlast) {
            if (isLiteBlast === void 0) { isLiteBlast = false; }
            this.path = path;
            this.stage = stage;
            this.config = config;
            this.isLiteBlast = isLiteBlast;
            this.completion = 0.0;
            this.color = new Color();
        }
        FlamePoint.prototype.getNextPoint = function () {
            var increment = this.config.percentIncrement * (1 - this.completion / 100);
            this.completion += (increment < 0.4 ? 0.4 : increment);
            return this.path.xyAtPercentage(this.completion);
        };
        FlamePoint.prototype.getTrailEndPoint = function (relativeCompletion) {
            if (relativeCompletion === void 0) { relativeCompletion = -4; }
            return this.path.xyAtPercentage(this.completion + relativeCompletion);
        };
        return FlamePoint;
    }());
    /**Color provides rgba and hsl
     * it generates Random colors in constructor
     */
    var Color = (function () {
        function Color(isRGB) {
            if (isRGB === void 0) { isRGB = false; }
            this.isRGB = isRGB;
            if (this.isRGB) {
                this.r = this.randomNoInRange(0, 255);
                this.g = this.randomNoInRange(0, 255);
                this.b = this.randomNoInRange(0, 255);
                this.a = this.randomNoInRange(0, 1);
            }
            else {
                Color.hue += 0.5;
                this.h = this.randomNoInRange(Color.hue - 20, Color.hue + 20); //120 +- 20
                this.s = 100;
                this.l = this.randomNoInRange(50, 70);
            }
        }
        Color.prototype.randomNoInRange = function (lower, upper) {
            return Math.round(Math.random() * (upper - lower) + lower);
        };
        Color.prototype.toString = function (decay) {
            if (decay === void 0) { decay = 0; }
            if (this.isRGB) {
                return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a * (1 - decay) + ")";
            }
            else {
                return "hsl(" + this.h + "," + this.s + "%," + this.l * (1 - decay) + "%)";
            }
        };
        Color.hue = 100;
        return Color;
    }());
    /**This is a factory to generate following
     * preBlast FlamePoint
     * postBlast flamePoint
     *
     * It also calculates the initial blast radius for points
     */
    var FlamePointFactory = (function () {
        function FlamePointFactory(config) {
            this.originPoint = new Point(0.5, 1);
            this.config = config;
            this.blastCircle = this.initBlastRadiusForConfig(this.config.maxBlastRad, this.config.flameInQuater);
            this.liteBlastCircle = this.initBlastRadiusForConfig(this.config.maxBlastRad / 2, Math.round(this.config.flameInQuater / 10));
        }
        FlamePointFactory.prototype.getPreBlastFlamePoint = function (dest, isLiteBlast) {
            if (isLiteBlast === void 0) { isLiteBlast = false; }
            return new FlamePoint(new Line(this.originPoint, dest), FlamePointStage.preBlast, this.config, isLiteBlast);
        };
        FlamePointFactory.prototype.getPostBlastFlamePoints = function (center, isLiteBlast) {
            var _this = this;
            if (isLiteBlast === void 0) { isLiteBlast = false; }
            var blastCircleBluePrint = [];
            if (isLiteBlast) {
                blastCircleBluePrint = this.liteBlastCircle;
            }
            else {
                blastCircleBluePrint = this.blastCircle;
            }
            return blastCircleBluePrint.map(function (point) { return new FlamePoint(new Line(center, point.getFactoredPoint(center, Math.random())), FlamePointStage.postBlast, _this.config, isLiteBlast); });
        };
        FlamePointFactory.prototype.initBlastRadiusForConfig = function (r, a_max) {
            var a_max_sq = a_max * a_max;
            var r_a_max = r / a_max;
            var blastCircle = [];
            for (var a = 0; a <= a_max; a++) {
                var x = (a / a_max) * (r);
                var y = r_a_max * Math.sqrt(a_max_sq - a * a);
                blastCircle.push(new Point(x, y), new Point(-x, y), new Point(x, -y), new Point(-x, -y));
            }
            return blastCircle;
        };
        return FlamePointFactory;
    }());
})(Fireworks || (Fireworks = {}));
//Useful listner that Parent Application Can have to provide different Animations
/*
this.canvas :: refrence to the DOM of Canvas

this.canvas.onclick = (event: MouseEvent) => {
    this.addFlameBlasts([new Point(event.offsetX / this.factor.x, event.offsetY / this.factor.y)])
}
this.canvas.onmousedown = (event: MouseEvent) => {
    this.mouseDown = true;
    this.mousePoints = [new Point(event.offsetX / this.factor.x, event.offsetY / this.factor.y)];
}
this.canvas.onmousemove = (event: MouseEvent) => {
    if (this.mouseDown) {
        this.mousePoints.push(new Point(event.offsetX / this.factor.x, event.offsetY / this.factor.y));
    }
}
this.canvas.onmouseup = (event: MouseEvent) => {
    this.mouseDown = false;
    this.addFlameBlasts(this.mousePoints, true);
    this.mousePoints = [];
}
*/ 

//# sourceMappingURL=data:application/json;charset=utf8;base64,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QUFDLENBQUMsRUFDaEIsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDcEIsQ0FBQztZQUNOLENBQUM7WUFDRCxNQUFNLENBQUMsV0FBVyxDQUFDO1FBQ3ZCLENBQUM7UUFDTCx3QkFBQztJQUFELENBcERBLEFBb0RDLElBQUE7QUFDTCxDQUFDLEVBMVVNLFNBQVMsS0FBVCxTQUFTLFFBMFVmO0FBRUQsaUZBQWlGO0FBQ2pGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQW9CRSIsImZpbGUiOiJGaXJld29ya3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyJtb2R1bGUgRmlyZXdvcmtzIHtcclxuICAgIC8qKkZpcmV3b3JrcyBpcyBhIG1vZHVsZSB3aGljaCB3aWxsIGNyZWF0ZSBhIGZpcmV3b3JrIGFuaW1hdGlvbiBvbiB0aGUgY2FudmFzIGVsZW1lbnRcclxuICAgICAqIHBhc3NlZCB0byB0aGUgYXBwbGljYXRpb24uIFRoaXMgd2lsbCBmaXJlIGZyb20gdGhlIGJvdHRvbSBtaWRkbGUgb2YgdGhlIGNhbnZhcyBhbmRcclxuICAgICAqIHdpbGwgZ28gdG8gdGhlIGRlc3RpbmF0aW9uIHBvaW50IHdoZXJlIGl0IHdpbGwgYmxhc3Qgcm91Z2hseSBpbiBhIGNpcmNsZVxyXG4gICAgICovXHJcblxyXG4gICAgLyoqQ29uZmlnIGlzIGEgcHVibGljIGludGVyZmFjZSBwcm92aWRlIHRvIHRoZSBlbmQtdXNlciB0byBwcm92aWRlIHRoZSByZXF1aXJlZCBjb25maWd1cmF0aW9uICovXHJcbiAgICBleHBvcnQgY2xhc3MgQ29uZmlne1xyXG4gICAgICAgIHBlcmNlbnRJbmNyZW1lbnQ6IG51bWJlcjtcclxuICAgICAgICBtYXhCbGFzdFJhZDogbnVtYmVyO1xyXG4gICAgICAgIGZsYW1lSW5RdWF0ZXI6IG51bWJlcjtcclxuICAgICAgICBhbmltYXRlQ2FsbFJhdGU6IG51bWJlcjtcclxuICAgICAgICBjb25zdHJ1Y3RvcihwZXJjZW50SW5jcmVtZW50OiBudW1iZXIgPSA1LCBtYXhCbGFzdFJhZDogbnVtYmVyID0gMC4xLCBmbGFtZUluUXVhdGVyOiBudW1iZXIgPSAyMCwgZnBzOiBudW1iZXIgPSAxMDApIHtcclxuICAgICAgICAgICAgdGhpcy5wZXJjZW50SW5jcmVtZW50ID0gcGVyY2VudEluY3JlbWVudDtcclxuICAgICAgICAgICAgdGhpcy5tYXhCbGFzdFJhZCA9IG1heEJsYXN0UmFkO1xyXG4gICAgICAgICAgICB0aGlzLmZsYW1lSW5RdWF0ZXIgPSBmbGFtZUluUXVhdGVyO1xyXG4gICAgICAgICAgICB0aGlzLmFuaW1hdGVDYWxsUmF0ZSA9IDEwMDAgLyBmcHM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqVGhpcyB3b3VsZCBwcm92aWRlIHRoZSBpbnRlcmZhY2UgdG8gZXh0ZXJuYWwgYXBwbGljYXRpb24gdG8gaW5pdGlhdGUgdGhlIGZpcmV3b3JrLlxyXG4gICAgICogXHJcbiAgICAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIEFwcCB7XHJcbiAgICAgICAgcHJpdmF0ZSBmYWN0b3I6IFBvaW50O1xyXG4gICAgICAgIHByaXZhdGUgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgICAgICBwcml2YXRlIGNvbnRleHQ6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuICAgICAgICBwcml2YXRlIGNvbmZpZzogQ29uZmlnO1xyXG4gICAgICAgIHByaXZhdGUgZmxhbWVQYXRoczogRmxhbWVQb2ludFtdO1xyXG4gICAgICAgIHByaXZhdGUgZmxhbWVQb2ludEZhY3Rvcnk6IEZsYW1lUG9pbnRGYWN0b3J5O1xyXG5cclxuICAgICAgICBwcml2YXRlIG1vdXNlRG93bjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgICAgIHByaXZhdGUgbW91c2VQb2ludHM6IFBvaW50W107XHJcblxyXG4gICAgICAgIHByaXZhdGUgaXNBbmltQWN0aXZlOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAgcHJpdmF0ZSBhbmltYXRlVGltZXI6IG51bWJlcjtcclxuICAgICAgICBwcml2YXRlIGNhbGxiYWNrT25FbXB0eTogRnVuY3Rpb247XHJcbiAgICAgICAgY29uc3RydWN0b3IoY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudCwgY29uZmlnOiBDb25maWcsIGNhbGxiYWNrT25FbXB0eTogRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMgPSBjYW52YXM7XHJcbiAgICAgICAgICAgIHRoaXMuZmFjdG9yID0gbmV3IFBvaW50KDAsIDApOyAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy51cGRhdGVDYW52YXNBbmRGYWN0b3IoKTtcclxuICAgICAgICAgICAgdGhpcy5jb25maWcgPSBjb25maWc7XHJcbiAgICAgICAgICAgIHRoaXMuZmxhbWVQb2ludEZhY3RvcnkgPSBuZXcgRmxhbWVQb2ludEZhY3RvcnkoY29uZmlnKTtcclxuICAgICAgICAgICAgdGhpcy5mbGFtZVBhdGhzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tPbkVtcHR5ID0gY2FsbGJhY2tPbkVtcHR5O1xyXG4gICAgICAgICAgICB0aGlzLmFkZExpc3RuZXJzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBwdWJsaWMgcmVzZXQoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmxhbWVQYXRocyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gXCJyZ2JhKDAsMCwwLDEpXCI7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLmZhY3Rvci54LCB0aGlzLmZhY3Rvci55KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGFkZEZsYW1lQmxhc3RzKGJsYXN0UG9pbnRzOiBQb2ludFtdLCBpc0xpdGVCbGFzdDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmxhbWVQYXRocy5wdXNoKC4uLmJsYXN0UG9pbnRzLm1hcCgocG9pbnQ6IFBvaW50KTogRmxhbWVQb2ludCA9PiB0aGlzLmZsYW1lUG9pbnRGYWN0b3J5LmdldFByZUJsYXN0RmxhbWVQb2ludChwb2ludC5kaXZpZGUodGhpcy5mYWN0b3IpLCBpc0xpdGVCbGFzdCkpKTtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzQW5pbUFjdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbmltYXRlUmVxdWVzdGVyKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzQW5pbUFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSB1cGRhdGVDYW52YXNBbmRGYWN0b3IoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmFjdG9yLnggPSB0aGlzLmNhbnZhcy5jbGllbnRXaWR0aDtcclxuICAgICAgICAgICAgdGhpcy5mYWN0b3IueSA9IHRoaXMuY2FudmFzLmNsaWVudEhlaWdodDtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmZhY3Rvci54O1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmZhY3Rvci55O1xyXG4gICAgICAgICAgICB0aGlzLnNoYWRlQ2FudmFzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgYWRkTGlzdG5lcnMoKSB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5vbnJlc2l6ZSA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDYW52YXNBbmRGYWN0b3IoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGFuaW1hdGVSZXF1ZXN0ZXIoKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmZsYW1lUGF0aHMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSgoKSA9PiB7IHRoaXMuYW5pbWF0ZSgpOyB9KTtcclxuICAgICAgICAgICAgICAgIH0sIHRoaXMuY29uZmlnLmFuaW1hdGVDYWxsUmF0ZSk7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0FuaW1BY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfSkodGhpcy5jYWxsYmFja09uRW1wdHkpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBhbmltYXRlKCkge1xyXG4gICAgICAgICAgICBsZXQgdGVtcF9wb3N0Qmxhc3RDb250YWluZXI6IEZsYW1lUG9pbnRbXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgLy9GaWx0ZXIgY29tcGxldGVkIEZsYW1lUG9pbnRcclxuICAgICAgICAgICAgdGhpcy5mbGFtZVBhdGhzID0gdGhpcy5mbGFtZVBhdGhzLmZpbHRlcigoZnBhdGhzOiBGbGFtZVBvaW50KTogYm9vbGVhbiA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZnBhdGhzLmNvbXBsZXRpb24gPj0gMTAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZwYXRocy5zdGFnZSA9PSBGbGFtZVBvaW50U3RhZ2UucHJlQmxhc3QpIHsgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcF9wb3N0Qmxhc3RDb250YWluZXIucHVzaChmcGF0aHMpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIC8vQWRkIEZsYW1lUG9pbnRzIGZyb20gdGVtcF9wb3N0Qmxhc3RDb250YWluZXIgZm9yIHN0YWdlLTIgaS5lIEZsYW1lUG9pbnRTdGFnZS5wb3N0Qmxhc3RcclxuICAgICAgICAgICAgdGhpcy5mbGFtZVBhdGhzLnB1c2goLi4udGVtcF9wb3N0Qmxhc3RDb250YWluZXIucmVkdWNlKChhcnI6IEZsYW1lUG9pbnRbXSwgZnBvaW50OiBGbGFtZVBvaW50KTogRmxhbWVQb2ludFtdID0+IHtcclxuICAgICAgICAgICAgICAgIGFyci5wdXNoKC4uLnRoaXMuZmxhbWVQb2ludEZhY3RvcnkuZ2V0UG9zdEJsYXN0RmxhbWVQb2ludHMoZnBvaW50LnBhdGguZW5kLCBmcG9pbnQuaXNMaXRlQmxhc3QpKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBhcnI7XHJcbiAgICAgICAgICAgIH0sIFtdKSk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLmRyYXdPbkNhbnZhcygpO1xyXG4gICAgICAgICAgICB0aGlzLmFuaW1hdGVSZXF1ZXN0ZXIoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBzaGFkZUNhbnZhcygpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxTdHlsZSA9IFwicmdiYSgwLDAsMCwwLjIpXCI7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsUmVjdCgwLCAwLCB0aGlzLmZhY3Rvci54LCB0aGlzLmZhY3Rvci55KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBkcmF3T25DYW52YXMoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hhZGVDYW52YXMoKTsgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuZmxhbWVQYXRocy5mb3JFYWNoKChmbGFtZVBvaW50OiBGbGFtZVBvaW50KTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnRQb2ludDogUG9pbnQgPSBmbGFtZVBvaW50LmdldE5leHRQb2ludCgpLm11bHRpcGxlKHRoaXMuZmFjdG9yKTtcclxuICAgICAgICAgICAgICAgIGxldCBlbmRQb2ludDogUG9pbnQgPSBmbGFtZVBvaW50LmdldFRyYWlsRW5kUG9pbnQoKS5tdWx0aXBsZSh0aGlzLmZhY3Rvcik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQubW92ZVRvKHN0YXJ0UG9pbnQueCwgc3RhcnRQb2ludC55KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5saW5lVG8oZW5kUG9pbnQueCwgZW5kUG9pbnQueSk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmxhbWVQb2ludC5zdGFnZSA9PSBGbGFtZVBvaW50U3RhZ2UucHJlQmxhc3QpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBmbGFtZVBvaW50LmNvbG9yLnRvU3RyaW5nKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkZWNheSA9IGZsYW1lUG9pbnQuY29tcGxldGlvbiA8IDc1ID8gMCA6IGZsYW1lUG9pbnQuY29tcGxldGlvbiAvIDEwMDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGUgPSBmbGFtZVBvaW50LmNvbG9yLnRvU3RyaW5nKGZsYW1lUG9pbnQuY29tcGxldGlvbi8xMDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LnN0cm9rZSgpO1xyXG4gICAgICAgICAgICAgICAgLy90aGlzLmNvbnRleHQuY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbiAgICAvKipTdGFnZXMgaW4gYSBmaXJld29ya1xyXG4gICAgICogcHJlQmxhc3QgOiBmb3JtcyBhIGxpbmUgYmV0d2VlbiBib3R0b20gY2VudGVyIGFuZCB0aGUgZGVzdGluYXRpb24gKGJsYXN0IHBvaW50KVxyXG4gICAgICogcG9zdEJsYXN0IDogYWRkZXMgbXVsdGlwbGUgcG9pbnRzIHdpdGggb3JpZ2luIGFzIHRoZSBibGFzdCBwb2ludCBhbmQgZGVzdGluYXRpb24gYXMgcmFuZG9tIHBvaW50cyBhcm91bmQgdGhlIGNvbmZpZy5yYWRpdXNcclxuICAgICAqL1xyXG4gICAgZW51bSBGbGFtZVBvaW50U3RhZ2Uge1xyXG4gICAgICAgIHByZUJsYXN0LFxyXG4gICAgICAgIHBvc3RCbGFzdFxyXG4gICAgfVxyXG4gICAgLyoqUG9pbnQgOiByZXByZXNlbnRzIGEgZG90IHdpdGggaXRzIGNvb3JkaW5hdGVzXHJcbiAgICAgKiBJdCBkZW5vdGUgdGhlIGNvb3JkaW5hdGVzIHVzaW5nIHggYW5kIHkgY29vcmRpbmF0ZXMgKHJlY3Rhbmd1bGFyIGNvb3JkaW5hdGUgc3lzdGVtKVxyXG4gICAgICogb3RoZXIgdXRpbGl0eSBmdW5jdGlvbnMgYXJlIGRlZmluZWQgb24gdGhpcyB0byBmYWNpbGl0YXRlIG90aGVyIGRlcGVuZGVudCBmdW5jdGlvbnNcclxuICAgICAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIFBvaW50IHtcclxuICAgICAgICB4OiBudW1iZXI7XHJcbiAgICAgICAgeTogbnVtYmVyO1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMueCA9IHg7XHJcbiAgICAgICAgICAgIHRoaXMueSA9IHk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBkaWZmKGVuZDogUG9pbnQpOiBQb2ludCB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQoXHJcbiAgICAgICAgICAgICAgICBlbmQueCAtIHRoaXMueCxcclxuICAgICAgICAgICAgICAgIGVuZC55IC0gdGhpcy55XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBhZGQocG9pbnQ6IFBvaW50KTogUG9pbnQge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KFxyXG4gICAgICAgICAgICAgICAgdGhpcy54ICsgcG9pbnQueCxcclxuICAgICAgICAgICAgICAgIHRoaXMueSArIHBvaW50LnlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIG11bHRpcGxlKGZhY3RvcjogUG9pbnQpOiBQb2ludCB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQoXHJcbiAgICAgICAgICAgICAgICB0aGlzLnggKiBmYWN0b3IueCxcclxuICAgICAgICAgICAgICAgIHRoaXMueSAqIGZhY3Rvci55XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBkaXZpZGUoZmFjdG9yOlBvaW50KTpQb2ludHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludChcclxuICAgICAgICAgICAgICAgIHRoaXMueCAvIGZhY3Rvci54LFxyXG4gICAgICAgICAgICAgICAgdGhpcy55IC8gZmFjdG9yLnlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldEZhY3RvcmVkUG9pbnQoaW5pdGlhbFBvaW50OiBQb2ludCwgZmFjdG9yOiBudW1iZXIpOiBQb2ludCB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQoXHJcbiAgICAgICAgICAgICAgICBpbml0aWFsUG9pbnQueCArIGZhY3RvciAqIHRoaXMueCxcclxuICAgICAgICAgICAgICAgIGluaXRpYWxQb2ludC55ICsgZmFjdG9yICogdGhpcy55XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqTGluZSBDbGFzcyByZXByZXNlbnRzIGEgdmlydHVhbCBsaW5lIGJldHdlZW4gdGhlIHNvdXJjZSBhbmQgZGVzdGluYXRpb24gcG9pbnRcclxuICAgICAqIGZvciBmYXN0ZXIgcGVyZm9ybWFuY2UgcmVhc29ucywgd2UgYWxzbyBzdG9yZXMgZGlmZiBiZXR3ZWVuIHRoZSBzb3VyY2UgYW5kIGRlc3RpbmF0aW9uXHJcbiAgICAgKiBcclxuICAgICAqIEl0IGhhcyBhIG1ldGhvZCB3aGljaCBjYWxjdWxhdGVzIHRoZSBwb2ludCBhdCBjZXJ0YWluIHBlcmNlbnRhZ2UgXHJcbiAgICAgKi9cclxuICAgIGNsYXNzIExpbmUge1xyXG4gICAgICAgIHByaXZhdGUgc3RhcnQ6IFBvaW50O1xyXG4gICAgICAgIHByaXZhdGUgZGlmZjogUG9pbnQ7XHJcbiAgICAgICAgcHVibGljIGVuZDogUG9pbnQ7XHJcbiAgICAgICAgY29uc3RydWN0b3Ioc3RhcnQ6IFBvaW50LCBlbmQ6IFBvaW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnQgPSBzdGFydDtcclxuICAgICAgICAgICAgdGhpcy5lbmQgPSBlbmQ7XHJcbiAgICAgICAgICAgIHRoaXMuZGlmZiA9IHRoaXMuc3RhcnQuZGlmZihlbmQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgeHlBdFBlcmNlbnRhZ2UocGVyY2VudGFnZTogbnVtYmVyKTogUG9pbnR7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRpZmYuZ2V0RmFjdG9yZWRQb2ludCh0aGlzLnN0YXJ0LCBwZXJjZW50YWdlLzEwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqRmxhbWUgUG9pbnQgcmVwcmVzZW50cyB0aGUgYnVybmluZyBwb2ludCBpbiBhbiBmaXJld29ya1xyXG4gICAgICogcGF0aCA6IGtlZXBzIHRoZSBsaW5lIHRvIHdoaWNoIHRoZSBmbGFtZSBwb2ludCB3aWxsIHRyYXZlbFxyXG4gICAgICogc3RhZ2UgOiBibGFzdCBzdGFnZSAtIHByZUJsYXN0LCBwb3N0Qmxhc3RcclxuICAgICAqIGNvbXBsZXRpb24gOiBzdG9yZXMgdGhlIHBlcmNlbnRhZ2Ugb2YgdGhlIHBhdGggd2hpY2ggZmxhbWUgaGFzIGFscmVhZHkgY292ZXJlZFxyXG4gICAgICogY29sb3IgOiBobHMgdmFsdWUgb2YgdGhlIGZsYW1lIHBvaW50XHJcbiAgICAqL1xyXG4gICAgY2xhc3MgRmxhbWVQb2ludCB7XHJcbiAgICAgICAgcGF0aDogTGluZTtcclxuICAgICAgICBzdGFnZTogRmxhbWVQb2ludFN0YWdlO1xyXG4gICAgICAgIGNvbXBsZXRpb246IG51bWJlcjtcclxuICAgICAgICBpc0xpdGVCbGFzdDogYm9vbGVhbjtcclxuICAgICAgICBjb2xvcjogQ29sb3I7XHJcbiAgICAgICAgcHJpdmF0ZSBjb25maWc6IENvbmZpZztcclxuICAgICAgICBjb25zdHJ1Y3RvcihwYXRoOiBMaW5lLCBzdGFnZTogRmxhbWVQb2ludFN0YWdlLCBjb25maWc6IENvbmZpZywgaXNMaXRlQmxhc3Q6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gICAgICAgICAgICB0aGlzLnBhdGggPSBwYXRoO1xyXG4gICAgICAgICAgICB0aGlzLnN0YWdlID0gc3RhZ2U7XHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xyXG4gICAgICAgICAgICB0aGlzLmlzTGl0ZUJsYXN0ID0gaXNMaXRlQmxhc3Q7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGxldGlvbiA9IDAuMDtcclxuICAgICAgICAgICAgdGhpcy5jb2xvciA9IG5ldyBDb2xvcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZ2V0TmV4dFBvaW50KCk6IFBvaW50IHtcclxuICAgICAgICAgICAgbGV0IGluY3JlbWVudCA9IHRoaXMuY29uZmlnLnBlcmNlbnRJbmNyZW1lbnQgKiAoMSAtIHRoaXMuY29tcGxldGlvbiAvIDEwMCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcGxldGlvbiArPSAoaW5jcmVtZW50IDwgMC40ID8gMC40IDogaW5jcmVtZW50KTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGF0aC54eUF0UGVyY2VudGFnZSh0aGlzLmNvbXBsZXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZ2V0VHJhaWxFbmRQb2ludChyZWxhdGl2ZUNvbXBsZXRpb246IG51bWJlciA9IC00KTogUG9pbnQge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wYXRoLnh5QXRQZXJjZW50YWdlKHRoaXMuY29tcGxldGlvbiArIHJlbGF0aXZlQ29tcGxldGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqQ29sb3IgcHJvdmlkZXMgcmdiYSBhbmQgaHNsIFxyXG4gICAgICogaXQgZ2VuZXJhdGVzIFJhbmRvbSBjb2xvcnMgaW4gY29uc3RydWN0b3JcclxuICAgICAqL1xyXG4gICAgY2xhc3MgQ29sb3Ige1xyXG4gICAgICAgIHI6IG51bWJlcjtcclxuICAgICAgICBnOiBudW1iZXI7XHJcbiAgICAgICAgYjogbnVtYmVyO1xyXG4gICAgICAgIGE6IG51bWJlcjtcclxuXHJcbiAgICAgICAgaDogbnVtYmVyO1xyXG4gICAgICAgIHM6IG51bWJlcjtcclxuICAgICAgICBsOiBudW1iZXI7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaXNSR0I6IGJvb2xlYW47XHJcbiAgICAgICAgcHJpdmF0ZSBzdGF0aWMgaHVlOiBudW1iZXIgPSAxMDA7XHJcbiAgICAgICAgY29uc3RydWN0b3IoaXNSR0I6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG4gICAgICAgICAgICB0aGlzLmlzUkdCID0gaXNSR0I7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzUkdCKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnIgPSB0aGlzLnJhbmRvbU5vSW5SYW5nZSgwLCAyNTUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nID0gdGhpcy5yYW5kb21Ob0luUmFuZ2UoMCwgMjU1KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYiA9IHRoaXMucmFuZG9tTm9JblJhbmdlKDAsIDI1NSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmEgPSB0aGlzLnJhbmRvbU5vSW5SYW5nZSgwLCAxKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIENvbG9yLmh1ZSArPSAwLjU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmggPSB0aGlzLnJhbmRvbU5vSW5SYW5nZShDb2xvci5odWUgLSAyMCwgQ29sb3IuaHVlKzIwKTsvLzEyMCArLSAyMFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zID0gMTAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sID0gdGhpcy5yYW5kb21Ob0luUmFuZ2UoNTAsIDcwKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIHJhbmRvbU5vSW5SYW5nZShsb3dlcjogbnVtYmVyLCB1cHBlcjogbnVtYmVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAodXBwZXIgLSBsb3dlcikgKyBsb3dlcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRvU3RyaW5nKGRlY2F5OiBudW1iZXIgPSAwKSB7Ly8wIC0gMVxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc1JHQikge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwicmdiYShcIiArIHRoaXMuciArIFwiLFwiICsgdGhpcy5nICsgXCIsXCIgKyB0aGlzLmIgKyBcIixcIiArIHRoaXMuYSAqICgxIC0gZGVjYXkpICsgXCIpXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJoc2woXCIgKyB0aGlzLmggKyBcIixcIiArIHRoaXMucyArIFwiJSxcIiArIHRoaXMubCAqICgxIC0gZGVjYXkpICsgXCIlKVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgLyoqVGhpcyBpcyBhIGZhY3RvcnkgdG8gZ2VuZXJhdGUgZm9sbG93aW5nXHJcbiAgICAgKiBwcmVCbGFzdCBGbGFtZVBvaW50XHJcbiAgICAgKiBwb3N0Qmxhc3QgZmxhbWVQb2ludFxyXG4gICAgICogXHJcbiAgICAgKiBJdCBhbHNvIGNhbGN1bGF0ZXMgdGhlIGluaXRpYWwgYmxhc3QgcmFkaXVzIGZvciBwb2ludHNcclxuICAgICAqL1xyXG4gICAgY2xhc3MgRmxhbWVQb2ludEZhY3Rvcnkge1xyXG4gICAgICAgIHByaXZhdGUgb3JpZ2luUG9pbnQ6IFBvaW50O1xyXG4gICAgICAgIHByaXZhdGUgY29uZmlnOiBDb25maWc7XHJcbiAgICAgICAgcHJpdmF0ZSBibGFzdENpcmNsZTogUG9pbnRbXTtcclxuICAgICAgICBwcml2YXRlIGxpdGVCbGFzdENpcmNsZTogUG9pbnRbXTtcclxuICAgICAgICBjb25zdHJ1Y3Rvcihjb25maWc6IENvbmZpZykge1xyXG4gICAgICAgICAgICB0aGlzLm9yaWdpblBvaW50ID0gbmV3IFBvaW50KDAuNSwgMSk7XHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xyXG4gICAgICAgICAgICB0aGlzLmJsYXN0Q2lyY2xlID0gdGhpcy5pbml0Qmxhc3RSYWRpdXNGb3JDb25maWcodGhpcy5jb25maWcubWF4Qmxhc3RSYWQsIHRoaXMuY29uZmlnLmZsYW1lSW5RdWF0ZXIpO1xyXG4gICAgICAgICAgICB0aGlzLmxpdGVCbGFzdENpcmNsZSA9IHRoaXMuaW5pdEJsYXN0UmFkaXVzRm9yQ29uZmlnKHRoaXMuY29uZmlnLm1heEJsYXN0UmFkLzIsIE1hdGgucm91bmQodGhpcy5jb25maWcuZmxhbWVJblF1YXRlci8xMCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZ2V0UHJlQmxhc3RGbGFtZVBvaW50KGRlc3Q6IFBvaW50LCBpc0xpdGVCbGFzdDogYm9vbGVhbiA9IGZhbHNlKTogRmxhbWVQb2ludCB7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgRmxhbWVQb2ludChcclxuICAgICAgICAgICAgICAgIG5ldyBMaW5lKHRoaXMub3JpZ2luUG9pbnQsIGRlc3QpLFxyXG4gICAgICAgICAgICAgICAgRmxhbWVQb2ludFN0YWdlLnByZUJsYXN0LFxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcsXHJcbiAgICAgICAgICAgICAgICBpc0xpdGVCbGFzdFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZ2V0UG9zdEJsYXN0RmxhbWVQb2ludHMoY2VudGVyOiBQb2ludCwgaXNMaXRlQmxhc3Q6IGJvb2xlYW4gPSBmYWxzZSk6IEZsYW1lUG9pbnRbXSB7XHJcbiAgICAgICAgICAgIGxldCBibGFzdENpcmNsZUJsdWVQcmludDogUG9pbnRbXSA9IFtdO1xyXG4gICAgICAgICAgICBpZiAoaXNMaXRlQmxhc3QpIHtcclxuICAgICAgICAgICAgICAgIGJsYXN0Q2lyY2xlQmx1ZVByaW50ID0gdGhpcy5saXRlQmxhc3RDaXJjbGU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBibGFzdENpcmNsZUJsdWVQcmludCA9IHRoaXMuYmxhc3RDaXJjbGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGJsYXN0Q2lyY2xlQmx1ZVByaW50Lm1hcChcclxuICAgICAgICAgICAgICAgIChwb2ludDogUG9pbnQpOiBGbGFtZVBvaW50ID0+IG5ldyBGbGFtZVBvaW50KFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBMaW5lKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjZW50ZXIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50LmdldEZhY3RvcmVkUG9pbnQoY2VudGVyLCBNYXRoLnJhbmRvbSgpKVxyXG4gICAgICAgICAgICAgICAgICAgICksXHJcbiAgICAgICAgICAgICAgICAgICAgRmxhbWVQb2ludFN0YWdlLnBvc3RCbGFzdCxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpZywgaXNMaXRlQmxhc3QpXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgaW5pdEJsYXN0UmFkaXVzRm9yQ29uZmlnKHI6IG51bWJlciwgYV9tYXg6IG51bWJlcikge1xyXG4gICAgICAgICAgICBsZXQgYV9tYXhfc3EgPSBhX21heCAqIGFfbWF4O1xyXG4gICAgICAgICAgICBsZXQgcl9hX21heCA9IHIgLyBhX21heDtcclxuICAgICAgICAgICAgbGV0IGJsYXN0Q2lyY2xlID0gW107XHJcbiAgICAgICAgICAgIGZvciAobGV0IGEgPSAwOyBhIDw9IGFfbWF4OyBhKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCB4ID0gKGEvYV9tYXgpKihyKVxyXG4gICAgICAgICAgICAgICAgbGV0IHkgPSByX2FfbWF4ICogTWF0aC5zcXJ0KGFfbWF4X3NxIC0gYSphKTtcclxuICAgICAgICAgICAgICAgIGJsYXN0Q2lyY2xlLnB1c2goXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IFBvaW50KHgsIHkpLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQb2ludCgteCwgeSksXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IFBvaW50KHgsIC15KSxcclxuICAgICAgICAgICAgICAgICAgICBuZXcgUG9pbnQoLXgsIC15KVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gYmxhc3RDaXJjbGU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vL1VzZWZ1bCBsaXN0bmVyIHRoYXQgUGFyZW50IEFwcGxpY2F0aW9uIENhbiBoYXZlIHRvIHByb3ZpZGUgZGlmZmVyZW50IEFuaW1hdGlvbnNcclxuLypcclxudGhpcy5jYW52YXMgOjogcmVmcmVuY2UgdG8gdGhlIERPTSBvZiBDYW52YXNcclxuXHJcbnRoaXMuY2FudmFzLm9uY2xpY2sgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgIHRoaXMuYWRkRmxhbWVCbGFzdHMoW25ldyBQb2ludChldmVudC5vZmZzZXRYIC8gdGhpcy5mYWN0b3IueCwgZXZlbnQub2Zmc2V0WSAvIHRoaXMuZmFjdG9yLnkpXSlcclxufVxyXG50aGlzLmNhbnZhcy5vbm1vdXNlZG93biA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xyXG4gICAgdGhpcy5tb3VzZVBvaW50cyA9IFtuZXcgUG9pbnQoZXZlbnQub2Zmc2V0WCAvIHRoaXMuZmFjdG9yLngsIGV2ZW50Lm9mZnNldFkgLyB0aGlzLmZhY3Rvci55KV07XHJcbn1cclxudGhpcy5jYW52YXMub25tb3VzZW1vdmUgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHsgICAgICAgICAgICAgICAgXHJcbiAgICBpZiAodGhpcy5tb3VzZURvd24pIHtcclxuICAgICAgICB0aGlzLm1vdXNlUG9pbnRzLnB1c2gobmV3IFBvaW50KGV2ZW50Lm9mZnNldFggLyB0aGlzLmZhY3Rvci54LCBldmVudC5vZmZzZXRZIC8gdGhpcy5mYWN0b3IueSkpO1xyXG4gICAgfVxyXG59XHJcbnRoaXMuY2FudmFzLm9ubW91c2V1cCA9IChldmVudDogTW91c2VFdmVudCkgPT4ge1xyXG4gICAgdGhpcy5tb3VzZURvd24gPSBmYWxzZTtcclxuICAgIHRoaXMuYWRkRmxhbWVCbGFzdHModGhpcy5tb3VzZVBvaW50cywgdHJ1ZSk7XHJcbiAgICB0aGlzLm1vdXNlUG9pbnRzID0gW107XHJcbn1cclxuKi8iXX0=
