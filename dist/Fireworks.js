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
