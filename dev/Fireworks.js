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
        }
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
            window.ontouchstart = function (event) {
                var a = event.changedTouches;
                //a[0].
            };
            this.canvas.ontouchstart = function (event) {
                _this.mouseDown = true;
                //this.mousePoints = [new Point(event.offsetX / this.factor.x, event.offsetY / this.factor.y)];
            };
            this.canvas.ontouchmove = function (event) {
                if (_this.mouseDown) {
                }
            };
            this.canvas.ontouchend = function (event) {
                _this.mouseDown = false;
                _this.addFlameBlasts(event.changedTouches.map(function (u) {
                    return new Point(u.clientX, u.clientY);
                }), true);
                _this.mousePoints = [];
            };
            this.canvas.onclick = function (event) {
                _this.addFlameBlasts([new Point(event.offsetX / _this.factor.x, event.offsetY / _this.factor.y)]);
            };
            this.canvas.onmousedown = function (event) {
                _this.mouseDown = true;
                _this.mousePoints = [new Point(event.offsetX / _this.factor.x, event.offsetY / _this.factor.y)];
            };
            this.canvas.onmousemove = function (event) {
                if (_this.mouseDown) {
                    _this.mousePoints.push(new Point(event.offsetX / _this.factor.x, event.offsetY / _this.factor.y));
                }
            };
            this.canvas.onmouseup = function (event) {
                _this.mouseDown = false;
                _this.addFlameBlasts(_this.mousePoints, true);
                _this.mousePoints = [];
            };
        };
        App.prototype.addFlameBlasts = function (blastPoints, isLiteBlast) {
            var _this = this;
            if (isLiteBlast === void 0) { isLiteBlast = false; }
            (_a = this.flamePaths).push.apply(_a, blastPoints.map(function (point) { return _this.flamePointFactory.getPreBlastFlamePoint(point, isLiteBlast); }));
            console.log();
            if (!this.isAnimActive) {
                this.animateRequester();
                this.isAnimActive = true;
            }
            var _a;
        };
        App.prototype.animateRequester = function () {
            var _this = this;
            if (this.flamePaths.length) {
                requestAnimationFrame(function () { _this.animate(); });
            }
            else {
                this.isAnimActive = false;
                (function (callback) { callback(); })(this.callbackOnEmpty);
            }
            //this.animateTimer = setTimeout(() => {
            //    if (this.flamePaths.length) {
            //        requestAnimationFrame(() => { this.animate();});
            //    } else {
            //        this.isAnimActive = false;
            //    }
            //}, 500);//this.config.animateCallRate
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
        App.prototype.processPoints = function (flamePoint) {
            var _this = this;
            var xarr = [-2, -1, 0, 1, 2];
            var yarr = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
            var point = flamePoint.getNextPoint().multiple(this.factor);
            yarr.forEach(function (y) {
                xarr.forEach(function (x) {
                    _this.updateColorAtIndex(_this.getImageDataIndex(point.add(new Point(x, y))), flamePoint.color, flamePoint.completion);
                });
            });
            this.context.putImageData(this.canvasData, 0, 0);
        };
        App.prototype.getImageDataIndex = function (point) {
            return (point.x + point.y * this.factor.x) * 4;
        };
        App.prototype.updateColorAtIndex = function (index, color, completion) {
            this.canvasData.data[index + 0] = 100; //color.r;
            this.canvasData.data[index + 1] = 100; //color.g;
            this.canvasData.data[index + 2] = 100; //color.b;
            this.canvasData.data[index + 3] = 1; //color.a / completion;
        };
        App.prototype.reset = function () {
            this.flamePaths = [];
            this.context.fillStyle = "rgba(0,0,0,1)";
            this.context.fillRect(0, 0, this.factor.x, this.factor.y);
        };
        return App;
    }());
    Fireworks.App = App;
    var FlamePointStage;
    (function (FlamePointStage) {
        FlamePointStage[FlamePointStage["preBlast"] = 0] = "preBlast";
        FlamePointStage[FlamePointStage["postBlast"] = 1] = "postBlast";
    })(FlamePointStage || (FlamePointStage = {}));
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
        Point.prototype.getFactoredPoint = function (initialPoint, factor) {
            return new Point(initialPoint.x + factor * this.x, initialPoint.y + factor * this.y);
        };
        return Point;
    }());
    Fireworks.Point = Point;
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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkZpcmV3b3Jrcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFPLFNBQVMsQ0FvV2Y7QUFwV0QsV0FBTyxTQUFTLEVBQUMsQ0FBQztJQUNkOzs7T0FHRztJQUVILGdHQUFnRztJQUNoRztRQUtJLGdCQUFZLGdCQUE0QixFQUFFLFdBQXlCLEVBQUUsYUFBMEIsRUFBRSxHQUFpQjtZQUF0RyxnQ0FBNEIsR0FBNUIsb0JBQTRCO1lBQUUsMkJBQXlCLEdBQXpCLGlCQUF5QjtZQUFFLDZCQUEwQixHQUExQixrQkFBMEI7WUFBRSxtQkFBaUIsR0FBakIsU0FBaUI7WUFDOUcsSUFBSSxDQUFDLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDO1lBQ3pDLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQy9CLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ25DLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUN0QyxDQUFDO1FBQ0wsYUFBQztJQUFELENBWEEsQUFXQyxJQUFBO0lBWFksZ0JBQU0sU0FXbEIsQ0FBQTtJQUNEO1FBZUksYUFBWSxNQUF5QixFQUFFLE1BQWMsRUFBRSxlQUF5QjtZQU54RSxjQUFTLEdBQVksS0FBSyxDQUFDO1lBRzNCLGlCQUFZLEdBQVksS0FBSyxDQUFDO1lBSWxDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFNUMsSUFBSSxDQUFDLHFCQUFxQixFQUFFLENBQUM7WUFDN0IsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7WUFDckIsSUFBSSxDQUFDLGlCQUFpQixHQUFHLElBQUksaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkQsSUFBSSxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7UUFDM0MsQ0FBQztRQUNPLG1DQUFxQixHQUE3QjtZQUNJLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUN2QixDQUFDO1FBQ00seUJBQVcsR0FBbEI7WUFBQSxpQkEyQ0M7WUExQ0csTUFBTSxDQUFDLFFBQVEsR0FBRyxVQUFDLEtBQUs7Z0JBQ3BCLEtBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ2pDLENBQUMsQ0FBQTtZQUNELE1BQU0sQ0FBQyxZQUFZLEdBQUcsVUFBQyxLQUFpQjtnQkFDcEMsSUFBSSxDQUFDLEdBQWMsS0FBSyxDQUFDLGNBQWMsQ0FBQztnQkFDeEMsT0FBTztZQUNYLENBQUMsQ0FBQTtZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLFVBQUMsS0FBVTtnQkFDbEMsS0FBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7Z0JBQ3RCLCtGQUErRjtZQUNuRyxDQUFDLENBQUE7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsR0FBRyxVQUFDLEtBQWlCO2dCQUN4QyxFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztnQkFFckIsQ0FBQztZQUNMLENBQUMsQ0FBQTtZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLFVBQUMsS0FBaUI7Z0JBQ3ZDLEtBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO2dCQUN2QixLQUFJLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFVBQUMsQ0FBUTtvQkFDbEQsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFBO2dCQUMxQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDVixLQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztZQUMxQixDQUFDLENBQUE7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxVQUFDLEtBQWlCO2dCQUNwQyxLQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO1lBQ2xHLENBQUMsQ0FBQztZQUNGLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFHLFVBQUMsS0FBaUI7Z0JBQ3hDLEtBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO2dCQUN0QixLQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqRyxDQUFDLENBQUE7WUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsR0FBRyxVQUFDLEtBQWlCO2dCQUN4QyxFQUFFLENBQUMsQ0FBQyxLQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDakIsS0FBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxLQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsT0FBTyxHQUFHLEtBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbkcsQ0FBQztZQUNMLENBQUMsQ0FBQTtZQUNELElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxHQUFHLFVBQUMsS0FBaUI7Z0JBQ3RDLEtBQUksQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO2dCQUN2QixLQUFJLENBQUMsY0FBYyxDQUFDLEtBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQzVDLEtBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO1lBQzFCLENBQUMsQ0FBQTtRQUdMLENBQUM7UUFDTSw0QkFBYyxHQUFyQixVQUFzQixXQUFvQixFQUFFLFdBQTRCO1lBQXhFLGlCQU9DO1lBUDJDLDJCQUE0QixHQUE1QixtQkFBNEI7WUFDcEUsTUFBQSxJQUFJLENBQUMsVUFBVSxFQUFDLElBQUksV0FBSSxXQUFXLENBQUMsR0FBRyxDQUFDLFVBQUMsS0FBWSxJQUFpQixPQUFBLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsV0FBVyxDQUFDLEVBQWhFLENBQWdFLENBQUMsQ0FBQyxDQUFDO1lBQ3pJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQTtZQUNiLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO2dCQUN4QixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztZQUM3QixDQUFDOztRQUNMLENBQUM7UUFDTyw4QkFBZ0IsR0FBeEI7WUFBQSxpQkFlQztZQWRHLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztnQkFDekIscUJBQXFCLENBQUMsY0FBUSxLQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRCxDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7Z0JBQzFCLENBQUMsVUFBVSxRQUFRLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFaEUsQ0FBQztZQUNELHdDQUF3QztZQUN4QyxtQ0FBbUM7WUFDbkMsMERBQTBEO1lBQzFELGNBQWM7WUFDZCxvQ0FBb0M7WUFDcEMsT0FBTztZQUNQLHVDQUF1QztRQUMzQyxDQUFDO1FBQ08scUJBQU8sR0FBZjtZQUFBLGlCQXFCQztZQXBCRyxJQUFJLHVCQUF1QixHQUFpQixFQUFFLENBQUM7WUFFL0MsNkJBQTZCO1lBQzdCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsVUFBQyxNQUFrQjtnQkFDeEQsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUMzQixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO3dCQUMzQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQ3pDLENBQUM7b0JBQ0QsTUFBTSxDQUFDLEtBQUssQ0FBQztnQkFDakIsQ0FBQztnQkFDRCxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxDQUFDO1lBQ0gsd0ZBQXdGO1lBQ3hGLE1BQUEsSUFBSSxDQUFDLFVBQVUsRUFBQyxJQUFJLFdBQUksdUJBQXVCLENBQUMsTUFBTSxDQUFDLFVBQUMsR0FBaUIsRUFBRSxNQUFrQjtnQkFDekYsR0FBRyxDQUFDLElBQUksT0FBUixHQUFHLEVBQVMsS0FBSSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO2dCQUNqRyxNQUFNLENBQUMsR0FBRyxDQUFDO1lBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFFUixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7O1FBQzVCLENBQUM7UUFDTyx5QkFBVyxHQUFuQjtZQUNJLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLGlCQUFpQixDQUFDO1lBQzNDLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBQ08sMEJBQVksR0FBcEI7WUFBQSxpQkFvQkM7WUFuQkcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQUMsVUFBc0I7Z0JBQzNDLElBQUksVUFBVSxHQUFVLFVBQVUsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN4RSxJQUFJLFFBQVEsR0FBVSxVQUFVLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUMxRSxLQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUN6QixLQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDaEQsS0FBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7b0JBQy9DLEtBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7Z0JBQzNELENBQUM7Z0JBQUMsSUFBSSxDQUFDLENBQUM7b0JBQ0osSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDLFVBQVUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDO29CQUN6RSxLQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsVUFBVSxHQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNwRixDQUFDO2dCQUNELEtBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ3RCLDJCQUEyQjtZQUkvQixDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFDTywyQkFBYSxHQUFyQixVQUFzQixVQUFzQjtZQUE1QyxpQkFVQztZQVRHLElBQUksSUFBSSxHQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2QyxJQUFJLElBQUksR0FBYSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRCxJQUFJLEtBQUssR0FBVSxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuRSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQztnQkFDWCxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQUMsQ0FBQztvQkFDWCxLQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxVQUFVLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDekgsQ0FBQyxDQUFDLENBQUE7WUFDTixDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFDTywrQkFBaUIsR0FBekIsVUFBMEIsS0FBWTtZQUNsQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUNPLGdDQUFrQixHQUExQixVQUEyQixLQUFhLEVBQUUsS0FBWSxFQUFDLFVBQWlCO1lBQ3BFLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUEsQ0FBQSxVQUFVO1lBQy9DLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUEsQ0FBQSxVQUFVO1lBQy9DLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUEsQ0FBQSxVQUFVO1lBQy9DLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUEsQ0FBQSx1QkFBdUI7UUFDOUQsQ0FBQztRQUNNLG1CQUFLLEdBQVo7WUFDSSxJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxlQUFlLENBQUM7WUFDekMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlELENBQUM7UUFDTCxVQUFDO0lBQUQsQ0E3S0EsQUE2S0MsSUFBQTtJQTdLWSxhQUFHLE1BNktmLENBQUE7SUFDRCxJQUFLLGVBR0o7SUFIRCxXQUFLLGVBQWU7UUFDaEIsNkRBQVEsQ0FBQTtRQUNSLCtEQUFTLENBQUE7SUFDYixDQUFDLEVBSEksZUFBZSxLQUFmLGVBQWUsUUFHbkI7SUFDRDtRQUdJLGVBQVksQ0FBUyxFQUFFLENBQVM7WUFDNUIsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNmLENBQUM7UUFDTSxvQkFBSSxHQUFYLFVBQVksR0FBVTtZQUNsQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQ1osR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUNkLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FDakIsQ0FBQztRQUNOLENBQUM7UUFDTSxtQkFBRyxHQUFWLFVBQVcsS0FBWTtZQUNuQixNQUFNLENBQUMsSUFBSSxLQUFLLENBQ1osSUFBSSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUNoQixJQUFJLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQ25CLENBQUM7UUFDTixDQUFDO1FBQ00sd0JBQVEsR0FBZixVQUFnQixNQUFhO1lBQ3pCLE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FDWixJQUFJLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEVBQ2pCLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FDcEIsQ0FBQztRQUNOLENBQUM7UUFDTSxnQ0FBZ0IsR0FBdkIsVUFBd0IsWUFBbUIsRUFBRSxNQUFjO1lBQ3ZELE1BQU0sQ0FBQyxJQUFJLEtBQUssQ0FDWixZQUFZLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUNoQyxZQUFZLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUNuQyxDQUFDO1FBQ04sQ0FBQztRQUNMLFlBQUM7SUFBRCxDQS9CQSxBQStCQyxJQUFBO0lBL0JZLGVBQUssUUErQmpCLENBQUE7SUFDRDtRQUlJLGNBQVksS0FBWSxFQUFFLEdBQVU7WUFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDbkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7WUFDZixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3JDLENBQUM7UUFDTSw2QkFBYyxHQUFyQixVQUFzQixVQUFrQjtZQUNwQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVUsR0FBQyxHQUFHLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBQ0wsV0FBQztJQUFELENBWkEsQUFZQyxJQUFBO0lBQ0Q7UUFPSSxvQkFBWSxJQUFVLEVBQUUsS0FBc0IsRUFBRSxNQUFjLEVBQUUsV0FBNEI7WUFBNUIsMkJBQTRCLEdBQTVCLG1CQUE0QjtZQUN4RixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNuQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztZQUMvQixJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztZQUN0QixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksS0FBSyxFQUFFLENBQUM7UUFDN0IsQ0FBQztRQUNNLGlDQUFZLEdBQW5CO1lBQ0ksSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQzNFLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUN2RCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3JELENBQUM7UUFDTSxxQ0FBZ0IsR0FBdkIsVUFBd0Isa0JBQStCO1lBQS9CLGtDQUErQixHQUEvQixzQkFBOEIsQ0FBQztZQUNuRCxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxDQUFDO1FBQzFFLENBQUM7UUFDTCxpQkFBQztJQUFELENBdkJBLEFBdUJDLElBQUE7SUFDRDtRQVlJLGVBQVksS0FBc0I7WUFBdEIscUJBQXNCLEdBQXRCLGFBQXNCO1lBQzlCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1lBQ25CLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNiLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDeEMsQ0FBQztZQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNKLEtBQUssQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDO2dCQUNqQixJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsS0FBSyxDQUFDLEdBQUcsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFBLFdBQVc7Z0JBQ3ZFLElBQUksQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO2dCQUNiLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDMUMsQ0FBQztRQUNMLENBQUM7UUFDTywrQkFBZSxHQUF2QixVQUF3QixLQUFhLEVBQUUsS0FBYTtZQUNoRCxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDL0QsQ0FBQztRQUNELHdCQUFRLEdBQVIsVUFBUyxLQUFpQjtZQUFqQixxQkFBaUIsR0FBakIsU0FBaUI7WUFDdEIsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ2IsTUFBTSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUM3RixDQUFDO1lBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ0osTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQztZQUMvRSxDQUFDO1FBQ0wsQ0FBQztRQXhCYyxTQUFHLEdBQVcsR0FBRyxDQUFDO1FBeUJyQyxZQUFDO0lBQUQsQ0FwQ0EsQUFvQ0MsSUFBQTtJQUNEO1FBS0ksMkJBQVksTUFBYztZQUN0QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyQyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztZQUNyQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3JHLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUgsQ0FBQztRQUNNLGlEQUFxQixHQUE1QixVQUE2QixJQUFXLEVBQUUsV0FBNEI7WUFBNUIsMkJBQTRCLEdBQTVCLG1CQUE0QjtZQUNsRSxNQUFNLENBQUMsSUFBSSxVQUFVLENBQ2pCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEVBQ2hDLGVBQWUsQ0FBQyxRQUFRLEVBQ3hCLElBQUksQ0FBQyxNQUFNLEVBQ1gsV0FBVyxDQUNkLENBQUM7UUFDTixDQUFDO1FBQ00sbURBQXVCLEdBQTlCLFVBQStCLE1BQWEsRUFBRSxXQUE0QjtZQUExRSxpQkFnQkM7WUFoQjZDLDJCQUE0QixHQUE1QixtQkFBNEI7WUFDdEUsSUFBSSxvQkFBb0IsR0FBWSxFQUFFLENBQUM7WUFDdkMsRUFBRSxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztnQkFDZCxvQkFBb0IsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ2hELENBQUM7WUFBQyxJQUFJLENBQUMsQ0FBQztnQkFDSixvQkFBb0IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1lBQzVDLENBQUM7WUFDRCxNQUFNLENBQUMsb0JBQW9CLENBQUMsR0FBRyxDQUMzQixVQUFDLEtBQVksSUFBaUIsT0FBQSxJQUFJLFVBQVUsQ0FDeEMsSUFBSSxJQUFJLENBQ0osTUFBTSxFQUNOLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQ2hELEVBQ0QsZUFBZSxDQUFDLFNBQVMsRUFDekIsS0FBSSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsRUFOQyxDQU1ELENBQ2hDLENBQUM7UUFDTixDQUFDO1FBQ08sb0RBQXdCLEdBQWhDLFVBQWlDLENBQVMsRUFBRSxLQUFhO1lBQ3JELElBQUksUUFBUSxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUM7WUFDN0IsSUFBSSxPQUFPLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztZQUN4QixJQUFJLFdBQVcsR0FBRyxFQUFFLENBQUM7WUFDckIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtnQkFDckIsSUFBSSxDQUFDLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsR0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDNUMsV0FBVyxDQUFDLElBQUksQ0FDWixJQUFJLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ2YsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQ2hCLElBQUksS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUNoQixJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUNwQixDQUFDO1lBQ04sQ0FBQztZQUNELE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDdkIsQ0FBQztRQUNMLHdCQUFDO0lBQUQsQ0FwREEsQUFvREMsSUFBQTtBQUNMLENBQUMsRUFwV00sU0FBUyxLQUFULFNBQVMsUUFvV2YiLCJmaWxlIjoiRmlyZXdvcmtzLmpzIiwic291cmNlc0NvbnRlbnQiOlsibW9kdWxlIEZpcmV3b3JrcyB7XHJcbiAgICAvKipGaXJld29ya3MgaXMgYSBtb2R1bGUgd2hpY2ggd2lsbCBjcmVhdGUgYSBmaXJld29yayBhbmltYXRpb24gb24gdGhlIGNhbnZhcyBlbGVtZW50XHJcbiAgICAgKiBwYXNzZWQgdG8gdGhlIGFwcGxpY2F0aW9uLiBUaGlzIHdpbGwgZmlyZSBmcm9tIHRoZSBib3R0b20gbWlkZGxlIG9mIHRoZSBjYW52YXMgYW5kXHJcbiAgICAgKiB3aWxsIGdvIHRvIHRoZSBkZXN0aW5hdGlvbiBwb2ludCB3aGVyZSBpdCB3aWxsIGJsYXN0IHJvdWdobHkgaW4gYSBjaXJjbGVcclxuICAgICAqL1xyXG5cclxuICAgIC8qKkNvbmZpZyBpcyBhIHB1YmxpYyBpbnRlcmZhY2UgcHJvdmlkZSB0byB0aGUgZW5kLXVzZXIgdG8gcHJvdmlkZSB0aGUgcmVxdWlyZWQgY29uZmlndXJhdGlvbiAqL1xyXG4gICAgZXhwb3J0IGNsYXNzIENvbmZpZ3tcclxuICAgICAgICBwZXJjZW50SW5jcmVtZW50OiBudW1iZXI7XHJcbiAgICAgICAgbWF4Qmxhc3RSYWQ6IG51bWJlcjtcclxuICAgICAgICBmbGFtZUluUXVhdGVyOiBudW1iZXI7XHJcbiAgICAgICAgYW5pbWF0ZUNhbGxSYXRlOiBudW1iZXI7XHJcbiAgICAgICAgY29uc3RydWN0b3IocGVyY2VudEluY3JlbWVudDogbnVtYmVyID0gNSwgbWF4Qmxhc3RSYWQ6IG51bWJlciA9IDAuMSwgZmxhbWVJblF1YXRlcjogbnVtYmVyID0gMjAsIGZwczogbnVtYmVyID0gMTAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGVyY2VudEluY3JlbWVudCA9IHBlcmNlbnRJbmNyZW1lbnQ7XHJcbiAgICAgICAgICAgIHRoaXMubWF4Qmxhc3RSYWQgPSBtYXhCbGFzdFJhZDtcclxuICAgICAgICAgICAgdGhpcy5mbGFtZUluUXVhdGVyID0gZmxhbWVJblF1YXRlcjtcclxuICAgICAgICAgICAgdGhpcy5hbmltYXRlQ2FsbFJhdGUgPSAxMDAwIC8gZnBzO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGV4cG9ydCBjbGFzcyBBcHAge1xyXG4gICAgICAgIHByaXZhdGUgZmFjdG9yOiBQb2ludDtcclxuICAgICAgICBwcml2YXRlIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICAgICAgcHJpdmF0ZSBjb250ZXh0OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcbiAgICAgICAgcHJpdmF0ZSBjYW52YXNEYXRhOiBJbWFnZURhdGE7XHJcbiAgICAgICAgcHJpdmF0ZSBjb25maWc6IENvbmZpZztcclxuICAgICAgICBwcml2YXRlIGZsYW1lUGF0aHM6IEZsYW1lUG9pbnRbXTtcclxuICAgICAgICBwcml2YXRlIGZsYW1lUG9pbnRGYWN0b3J5OiBGbGFtZVBvaW50RmFjdG9yeTtcclxuXHJcbiAgICAgICAgcHJpdmF0ZSBtb3VzZURvd246IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgICAgICBwcml2YXRlIG1vdXNlUG9pbnRzOiBQb2ludFtdO1xyXG5cclxuICAgICAgICBwcml2YXRlIGlzQW5pbUFjdGl2ZTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgICAgIHByaXZhdGUgYW5pbWF0ZVRpbWVyOiBudW1iZXI7XHJcbiAgICAgICAgcHJpdmF0ZSBjYWxsYmFja09uRW1wdHk6IEZ1bmN0aW9uO1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQsIGNvbmZpZzogQ29uZmlnLCBjYWxsYmFja09uRW1wdHk6IEZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgICAgICAgICB0aGlzLmZhY3RvciA9IG5ldyBQb2ludCgwLCAwKTsgICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ2FudmFzQW5kRmFjdG9yKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlnID0gY29uZmlnO1xyXG4gICAgICAgICAgICB0aGlzLmZsYW1lUG9pbnRGYWN0b3J5ID0gbmV3IEZsYW1lUG9pbnRGYWN0b3J5KGNvbmZpZyk7XHJcbiAgICAgICAgICAgIHRoaXMuZmxhbWVQYXRocyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmNhbGxiYWNrT25FbXB0eSA9IGNhbGxiYWNrT25FbXB0eTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSB1cGRhdGVDYW52YXNBbmRGYWN0b3IoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmFjdG9yLnggPSB0aGlzLmNhbnZhcy5jbGllbnRXaWR0aDtcclxuICAgICAgICAgICAgdGhpcy5mYWN0b3IueSA9IHRoaXMuY2FudmFzLmNsaWVudEhlaWdodDtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLmZhY3Rvci54O1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmZhY3Rvci55O1xyXG4gICAgICAgICAgICB0aGlzLnNoYWRlQ2FudmFzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBhZGRMaXN0bmVycygpIHtcclxuICAgICAgICAgICAgd2luZG93Lm9ucmVzaXplID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNhbnZhc0FuZEZhY3RvcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHdpbmRvdy5vbnRvdWNoc3RhcnQgPSAoZXZlbnQ6IFRvdWNoRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBhOiBUb3VjaExpc3QgPSBldmVudC5jaGFuZ2VkVG91Y2hlcztcclxuICAgICAgICAgICAgICAgIC8vYVswXS5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5vbnRvdWNoc3RhcnQgPSAoZXZlbnQ6IGFueSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZURvd24gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgLy90aGlzLm1vdXNlUG9pbnRzID0gW25ldyBQb2ludChldmVudC5vZmZzZXRYIC8gdGhpcy5mYWN0b3IueCwgZXZlbnQub2Zmc2V0WSAvIHRoaXMuZmFjdG9yLnkpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5vbnRvdWNobW92ZSA9IChldmVudDogVG91Y2hFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy90aGlzLm1vdXNlUG9pbnRzLnB1c2gobmV3IFBvaW50KGV2ZW50Lm9mZnNldFggLyB0aGlzLmZhY3Rvci54LCBldmVudC5vZmZzZXRZIC8gdGhpcy5mYWN0b3IueSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLm9udG91Y2hlbmQgPSAoZXZlbnQ6IFRvdWNoRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEZsYW1lQmxhc3RzKGV2ZW50LmNoYW5nZWRUb3VjaGVzLm1hcCgodTogVG91Y2gpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KHUuY2xpZW50WCwgdS5jbGllbnRZKVxyXG4gICAgICAgICAgICAgICAgfSksIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZVBvaW50cyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLm9uY2xpY2sgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkRmxhbWVCbGFzdHMoW25ldyBQb2ludChldmVudC5vZmZzZXRYIC8gdGhpcy5mYWN0b3IueCwgZXZlbnQub2Zmc2V0WSAvIHRoaXMuZmFjdG9yLnkpXSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXMub25tb3VzZWRvd24gPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMubW91c2VQb2ludHMgPSBbbmV3IFBvaW50KGV2ZW50Lm9mZnNldFggLyB0aGlzLmZhY3Rvci54LCBldmVudC5vZmZzZXRZIC8gdGhpcy5mYWN0b3IueSldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLm9ubW91c2Vtb3ZlID0gKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubW91c2VEb3duKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3VzZVBvaW50cy5wdXNoKG5ldyBQb2ludChldmVudC5vZmZzZXRYIC8gdGhpcy5mYWN0b3IueCwgZXZlbnQub2Zmc2V0WSAvIHRoaXMuZmFjdG9yLnkpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5vbm1vdXNldXAgPSAoZXZlbnQ6IE1vdXNlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMubW91c2VEb3duID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZEZsYW1lQmxhc3RzKHRoaXMubW91c2VQb2ludHMsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tb3VzZVBvaW50cyA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGFkZEZsYW1lQmxhc3RzKGJsYXN0UG9pbnRzOiBQb2ludFtdLCBpc0xpdGVCbGFzdDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmxhbWVQYXRocy5wdXNoKC4uLmJsYXN0UG9pbnRzLm1hcCgocG9pbnQ6IFBvaW50KTogRmxhbWVQb2ludCA9PiB0aGlzLmZsYW1lUG9pbnRGYWN0b3J5LmdldFByZUJsYXN0RmxhbWVQb2ludChwb2ludCwgaXNMaXRlQmxhc3QpKSk7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKClcclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzQW5pbUFjdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbmltYXRlUmVxdWVzdGVyKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzQW5pbUFjdGl2ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSBhbmltYXRlUmVxdWVzdGVyKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5mbGFtZVBhdGhzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHsgdGhpcy5hbmltYXRlKCk7IH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0FuaW1BY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIChmdW5jdGlvbiAoY2FsbGJhY2spIHsgY2FsbGJhY2soKTsgfSkodGhpcy5jYWxsYmFja09uRW1wdHkpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy90aGlzLmFuaW1hdGVUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAvLyAgICBpZiAodGhpcy5mbGFtZVBhdGhzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCgpID0+IHsgdGhpcy5hbmltYXRlKCk7fSk7XHJcbiAgICAgICAgICAgIC8vICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICB0aGlzLmlzQW5pbUFjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvLyAgICB9XHJcbiAgICAgICAgICAgIC8vfSwgNTAwKTsvL3RoaXMuY29uZmlnLmFuaW1hdGVDYWxsUmF0ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGFuaW1hdGUoKSB7XHJcbiAgICAgICAgICAgIGxldCB0ZW1wX3Bvc3RCbGFzdENvbnRhaW5lcjogRmxhbWVQb2ludFtdID0gW107XHJcblxyXG4gICAgICAgICAgICAvL0ZpbHRlciBjb21wbGV0ZWQgRmxhbWVQb2ludFxyXG4gICAgICAgICAgICB0aGlzLmZsYW1lUGF0aHMgPSB0aGlzLmZsYW1lUGF0aHMuZmlsdGVyKChmcGF0aHM6IEZsYW1lUG9pbnQpOiBib29sZWFuID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChmcGF0aHMuY29tcGxldGlvbiA+PSAxMDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZnBhdGhzLnN0YWdlID09IEZsYW1lUG9pbnRTdGFnZS5wcmVCbGFzdCkgeyAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wX3Bvc3RCbGFzdENvbnRhaW5lci5wdXNoKGZwYXRocyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgLy9BZGQgRmxhbWVQb2ludHMgZnJvbSB0ZW1wX3Bvc3RCbGFzdENvbnRhaW5lciBmb3Igc3RhZ2UtMiBpLmUgRmxhbWVQb2ludFN0YWdlLnBvc3RCbGFzdFxyXG4gICAgICAgICAgICB0aGlzLmZsYW1lUGF0aHMucHVzaCguLi50ZW1wX3Bvc3RCbGFzdENvbnRhaW5lci5yZWR1Y2UoKGFycjogRmxhbWVQb2ludFtdLCBmcG9pbnQ6IEZsYW1lUG9pbnQpOiBGbGFtZVBvaW50W10gPT4ge1xyXG4gICAgICAgICAgICAgICAgYXJyLnB1c2goLi4udGhpcy5mbGFtZVBvaW50RmFjdG9yeS5nZXRQb3N0Qmxhc3RGbGFtZVBvaW50cyhmcG9pbnQucGF0aC5lbmQsIGZwb2ludC5pc0xpdGVCbGFzdCkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFycjtcclxuICAgICAgICAgICAgfSwgW10pKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd09uQ2FudmFzKCk7XHJcbiAgICAgICAgICAgIHRoaXMuYW5pbWF0ZVJlcXVlc3RlcigpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIHNoYWRlQ2FudmFzKCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRleHQuZmlsbFN0eWxlID0gXCJyZ2JhKDAsMCwwLDAuMilcIjtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMuZmFjdG9yLngsIHRoaXMuZmFjdG9yLnkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGRyYXdPbkNhbnZhcygpIHtcclxuICAgICAgICAgICAgdGhpcy5zaGFkZUNhbnZhcygpOyAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5mbGFtZVBhdGhzLmZvckVhY2goKGZsYW1lUG9pbnQ6IEZsYW1lUG9pbnQpOiB2b2lkID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBzdGFydFBvaW50OiBQb2ludCA9IGZsYW1lUG9pbnQuZ2V0TmV4dFBvaW50KCkubXVsdGlwbGUodGhpcy5mYWN0b3IpO1xyXG4gICAgICAgICAgICAgICAgbGV0IGVuZFBvaW50OiBQb2ludCA9IGZsYW1lUG9pbnQuZ2V0VHJhaWxFbmRQb2ludCgpLm11bHRpcGxlKHRoaXMuZmFjdG9yKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5tb3ZlVG8oc3RhcnRQb2ludC54LCBzdGFydFBvaW50LnkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250ZXh0LmxpbmVUbyhlbmRQb2ludC54LCBlbmRQb2ludC55KTtcclxuICAgICAgICAgICAgICAgIGlmIChmbGFtZVBvaW50LnN0YWdlID09IEZsYW1lUG9pbnRTdGFnZS5wcmVCbGFzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IGZsYW1lUG9pbnQuY29sb3IudG9TdHJpbmcoKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlY2F5ID0gZmxhbWVQb2ludC5jb21wbGV0aW9uIDwgNzUgPyAwIDogZmxhbWVQb2ludC5jb21wbGV0aW9uIC8gMTAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29udGV4dC5zdHJva2VTdHlsZSA9IGZsYW1lUG9pbnQuY29sb3IudG9TdHJpbmcoZmxhbWVQb2ludC5jb21wbGV0aW9uLzEwMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRleHQuc3Ryb2tlKCk7XHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuY29udGV4dC5jbG9zZVBhdGgoKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgcHJvY2Vzc1BvaW50cyhmbGFtZVBvaW50OiBGbGFtZVBvaW50KSB7XHJcbiAgICAgICAgICAgIGxldCB4YXJyOiBudW1iZXJbXSA9IFstMiwgLTEsIDAsIDEsIDJdO1xyXG4gICAgICAgICAgICBsZXQgeWFycjogbnVtYmVyW10gPSBbLTQsIC0zLCAtMiwgLTEsIDAsIDEsIDIsIDMsIDRdO1xyXG4gICAgICAgICAgICBsZXQgcG9pbnQ6IFBvaW50ID0gZmxhbWVQb2ludC5nZXROZXh0UG9pbnQoKS5tdWx0aXBsZSh0aGlzLmZhY3Rvcik7XHJcbiAgICAgICAgICAgIHlhcnIuZm9yRWFjaCgoeSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgeGFyci5mb3JFYWNoKCh4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xvckF0SW5kZXgodGhpcy5nZXRJbWFnZURhdGFJbmRleChwb2ludC5hZGQobmV3IFBvaW50KHgsIHkpKSksIGZsYW1lUG9pbnQuY29sb3IsIGZsYW1lUG9pbnQuY29tcGxldGlvbik7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LnB1dEltYWdlRGF0YSh0aGlzLmNhbnZhc0RhdGEsIDAsIDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGdldEltYWdlRGF0YUluZGV4KHBvaW50OiBQb2ludCk6IG51bWJlciB7XHJcbiAgICAgICAgICAgIHJldHVybiAocG9pbnQueCArIHBvaW50LnkgKiB0aGlzLmZhY3Rvci54KSAqIDQ7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHByaXZhdGUgdXBkYXRlQ29sb3JBdEluZGV4KGluZGV4OiBudW1iZXIsIGNvbG9yOiBDb2xvcixjb21wbGV0aW9uOm51bWJlcikge1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhc0RhdGEuZGF0YVtpbmRleCArIDBdID0gMTAwLy9jb2xvci5yO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhc0RhdGEuZGF0YVtpbmRleCArIDFdID0gMTAwLy9jb2xvci5nO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhc0RhdGEuZGF0YVtpbmRleCArIDJdID0gMTAwLy9jb2xvci5iO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhc0RhdGEuZGF0YVtpbmRleCArIDNdID0gMS8vY29sb3IuYSAvIGNvbXBsZXRpb247XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyByZXNldCgpIHtcclxuICAgICAgICAgICAgdGhpcy5mbGFtZVBhdGhzID0gW107XHJcbiAgICAgICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgPSBcInJnYmEoMCwwLDAsMSlcIjtcclxuICAgICAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMuZmFjdG9yLngsIHRoaXMuZmFjdG9yLnkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGVudW0gRmxhbWVQb2ludFN0YWdlIHtcclxuICAgICAgICBwcmVCbGFzdCxcclxuICAgICAgICBwb3N0Qmxhc3RcclxuICAgIH1cclxuICAgIGV4cG9ydCBjbGFzcyBQb2ludCB7XHJcbiAgICAgICAgeDogbnVtYmVyO1xyXG4gICAgICAgIHk6IG51bWJlcjtcclxuICAgICAgICBjb25zdHJ1Y3Rvcih4OiBudW1iZXIsIHk6IG51bWJlcikge1xyXG4gICAgICAgICAgICB0aGlzLnggPSB4O1xyXG4gICAgICAgICAgICB0aGlzLnkgPSB5O1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZGlmZihlbmQ6IFBvaW50KTogUG9pbnQge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KFxyXG4gICAgICAgICAgICAgICAgZW5kLnggLSB0aGlzLngsXHJcbiAgICAgICAgICAgICAgICBlbmQueSAtIHRoaXMueVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgYWRkKHBvaW50OiBQb2ludCk6IFBvaW50IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludChcclxuICAgICAgICAgICAgICAgIHRoaXMueCArIHBvaW50LngsXHJcbiAgICAgICAgICAgICAgICB0aGlzLnkgKyBwb2ludC55XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHB1YmxpYyBtdWx0aXBsZShmYWN0b3I6IFBvaW50KTogUG9pbnQge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KFxyXG4gICAgICAgICAgICAgICAgdGhpcy54ICogZmFjdG9yLngsXHJcbiAgICAgICAgICAgICAgICB0aGlzLnkgKiBmYWN0b3IueVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwdWJsaWMgZ2V0RmFjdG9yZWRQb2ludChpbml0aWFsUG9pbnQ6IFBvaW50LCBmYWN0b3I6IG51bWJlcik6IFBvaW50IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludChcclxuICAgICAgICAgICAgICAgIGluaXRpYWxQb2ludC54ICsgZmFjdG9yICogdGhpcy54LFxyXG4gICAgICAgICAgICAgICAgaW5pdGlhbFBvaW50LnkgKyBmYWN0b3IgKiB0aGlzLnlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBjbGFzcyBMaW5lIHtcclxuICAgICAgICBwcml2YXRlIHN0YXJ0OiBQb2ludDtcclxuICAgICAgICBwcml2YXRlIGRpZmY6IFBvaW50O1xyXG4gICAgICAgIHB1YmxpYyBlbmQ6IFBvaW50O1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKHN0YXJ0OiBQb2ludCwgZW5kOiBQb2ludCkge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0ID0gc3RhcnQ7XHJcbiAgICAgICAgICAgIHRoaXMuZW5kID0gZW5kO1xyXG4gICAgICAgICAgICB0aGlzLmRpZmYgPSB0aGlzLnN0YXJ0LmRpZmYoZW5kKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIHh5QXRQZXJjZW50YWdlKHBlcmNlbnRhZ2U6IG51bWJlcik6IFBvaW50e1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kaWZmLmdldEZhY3RvcmVkUG9pbnQodGhpcy5zdGFydCwgcGVyY2VudGFnZS8xMDApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNsYXNzIEZsYW1lUG9pbnQge1xyXG4gICAgICAgIHBhdGg6IExpbmU7XHJcbiAgICAgICAgc3RhZ2U6IEZsYW1lUG9pbnRTdGFnZTtcclxuICAgICAgICBjb21wbGV0aW9uOiBudW1iZXI7XHJcbiAgICAgICAgaXNMaXRlQmxhc3Q6IGJvb2xlYW47XHJcbiAgICAgICAgY29sb3I6IENvbG9yO1xyXG4gICAgICAgIHByaXZhdGUgY29uZmlnOiBDb25maWc7XHJcbiAgICAgICAgY29uc3RydWN0b3IocGF0aDogTGluZSwgc3RhZ2U6IEZsYW1lUG9pbnRTdGFnZSwgY29uZmlnOiBDb25maWcsIGlzTGl0ZUJsYXN0OiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXRoID0gcGF0aDtcclxuICAgICAgICAgICAgdGhpcy5zdGFnZSA9IHN0YWdlO1xyXG4gICAgICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcclxuICAgICAgICAgICAgdGhpcy5pc0xpdGVCbGFzdCA9IGlzTGl0ZUJsYXN0O1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBsZXRpb24gPSAwLjA7XHJcbiAgICAgICAgICAgIHRoaXMuY29sb3IgPSBuZXcgQ29sb3IoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldE5leHRQb2ludCgpOiBQb2ludCB7XHJcbiAgICAgICAgICAgIGxldCBpbmNyZW1lbnQgPSB0aGlzLmNvbmZpZy5wZXJjZW50SW5jcmVtZW50ICogKDEgLSB0aGlzLmNvbXBsZXRpb24gLyAxMDApO1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBsZXRpb24gKz0gKGluY3JlbWVudCA8IDAuNCA/IDAuNCA6IGluY3JlbWVudCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBhdGgueHlBdFBlcmNlbnRhZ2UodGhpcy5jb21wbGV0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldFRyYWlsRW5kUG9pbnQocmVsYXRpdmVDb21wbGV0aW9uOiBudW1iZXIgPSAtNCk6IFBvaW50IHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucGF0aC54eUF0UGVyY2VudGFnZSh0aGlzLmNvbXBsZXRpb24gKyByZWxhdGl2ZUNvbXBsZXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNsYXNzIENvbG9yIHtcclxuICAgICAgICByOiBudW1iZXI7XHJcbiAgICAgICAgZzogbnVtYmVyO1xyXG4gICAgICAgIGI6IG51bWJlcjtcclxuICAgICAgICBhOiBudW1iZXI7XHJcblxyXG4gICAgICAgIGg6IG51bWJlcjtcclxuICAgICAgICBzOiBudW1iZXI7XHJcbiAgICAgICAgbDogbnVtYmVyO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlzUkdCOiBib29sZWFuO1xyXG4gICAgICAgIHByaXZhdGUgc3RhdGljIGh1ZTogbnVtYmVyID0gMTAwO1xyXG4gICAgICAgIGNvbnN0cnVjdG9yKGlzUkdCOiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICAgICAgdGhpcy5pc1JHQiA9IGlzUkdCO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5pc1JHQikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yID0gdGhpcy5yYW5kb21Ob0luUmFuZ2UoMCwgMjU1KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZyA9IHRoaXMucmFuZG9tTm9JblJhbmdlKDAsIDI1NSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmIgPSB0aGlzLnJhbmRvbU5vSW5SYW5nZSgwLCAyNTUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hID0gdGhpcy5yYW5kb21Ob0luUmFuZ2UoMCwgMSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBDb2xvci5odWUgKz0gMC41O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oID0gdGhpcy5yYW5kb21Ob0luUmFuZ2UoQ29sb3IuaHVlIC0gMjAsIENvbG9yLmh1ZSsyMCk7Ly8xMjAgKy0gMjBcclxuICAgICAgICAgICAgICAgIHRoaXMucyA9IDEwMDtcclxuICAgICAgICAgICAgICAgIHRoaXMubCA9IHRoaXMucmFuZG9tTm9JblJhbmdlKDUwLCA3MCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcHJpdmF0ZSByYW5kb21Ob0luUmFuZ2UobG93ZXI6IG51bWJlciwgdXBwZXI6IG51bWJlcikge1xyXG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogKHVwcGVyIC0gbG93ZXIpICsgbG93ZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0b1N0cmluZyhkZWNheTogbnVtYmVyID0gMCkgey8vMCAtIDFcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNSR0IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBcInJnYmEoXCIgKyB0aGlzLnIgKyBcIixcIiArIHRoaXMuZyArIFwiLFwiICsgdGhpcy5iICsgXCIsXCIgKyB0aGlzLmEgKiAoMSAtIGRlY2F5KSArIFwiKVwiO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiaHNsKFwiICsgdGhpcy5oICsgXCIsXCIgKyB0aGlzLnMgKyBcIiUsXCIgKyB0aGlzLmwgKiAoMSAtIGRlY2F5KSArIFwiJSlcIjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGNsYXNzIEZsYW1lUG9pbnRGYWN0b3J5IHtcclxuICAgICAgICBwcml2YXRlIG9yaWdpblBvaW50OiBQb2ludDtcclxuICAgICAgICBwcml2YXRlIGNvbmZpZzogQ29uZmlnO1xyXG4gICAgICAgIHByaXZhdGUgYmxhc3RDaXJjbGU6IFBvaW50W107XHJcbiAgICAgICAgcHJpdmF0ZSBsaXRlQmxhc3RDaXJjbGU6IFBvaW50W107XHJcbiAgICAgICAgY29uc3RydWN0b3IoY29uZmlnOiBDb25maWcpIHtcclxuICAgICAgICAgICAgdGhpcy5vcmlnaW5Qb2ludCA9IG5ldyBQb2ludCgwLjUsIDEpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcclxuICAgICAgICAgICAgdGhpcy5ibGFzdENpcmNsZSA9IHRoaXMuaW5pdEJsYXN0UmFkaXVzRm9yQ29uZmlnKHRoaXMuY29uZmlnLm1heEJsYXN0UmFkLCB0aGlzLmNvbmZpZy5mbGFtZUluUXVhdGVyKTtcclxuICAgICAgICAgICAgdGhpcy5saXRlQmxhc3RDaXJjbGUgPSB0aGlzLmluaXRCbGFzdFJhZGl1c0ZvckNvbmZpZyh0aGlzLmNvbmZpZy5tYXhCbGFzdFJhZC8yLCBNYXRoLnJvdW5kKHRoaXMuY29uZmlnLmZsYW1lSW5RdWF0ZXIvMTApKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldFByZUJsYXN0RmxhbWVQb2ludChkZXN0OiBQb2ludCwgaXNMaXRlQmxhc3Q6IGJvb2xlYW4gPSBmYWxzZSk6IEZsYW1lUG9pbnQge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3IEZsYW1lUG9pbnQoXHJcbiAgICAgICAgICAgICAgICBuZXcgTGluZSh0aGlzLm9yaWdpblBvaW50LCBkZXN0KSxcclxuICAgICAgICAgICAgICAgIEZsYW1lUG9pbnRTdGFnZS5wcmVCbGFzdCxcclxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLFxyXG4gICAgICAgICAgICAgICAgaXNMaXRlQmxhc3RcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcHVibGljIGdldFBvc3RCbGFzdEZsYW1lUG9pbnRzKGNlbnRlcjogUG9pbnQsIGlzTGl0ZUJsYXN0OiBib29sZWFuID0gZmFsc2UpOiBGbGFtZVBvaW50W10ge1xyXG4gICAgICAgICAgICBsZXQgYmxhc3RDaXJjbGVCbHVlUHJpbnQ6IFBvaW50W10gPSBbXTtcclxuICAgICAgICAgICAgaWYgKGlzTGl0ZUJsYXN0KSB7XHJcbiAgICAgICAgICAgICAgICBibGFzdENpcmNsZUJsdWVQcmludCA9IHRoaXMubGl0ZUJsYXN0Q2lyY2xlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYmxhc3RDaXJjbGVCbHVlUHJpbnQgPSB0aGlzLmJsYXN0Q2lyY2xlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBibGFzdENpcmNsZUJsdWVQcmludC5tYXAoXHJcbiAgICAgICAgICAgICAgICAocG9pbnQ6IFBvaW50KTogRmxhbWVQb2ludCA9PiBuZXcgRmxhbWVQb2ludChcclxuICAgICAgICAgICAgICAgICAgICBuZXcgTGluZShcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2VudGVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb2ludC5nZXRGYWN0b3JlZFBvaW50KGNlbnRlciwgTWF0aC5yYW5kb20oKSlcclxuICAgICAgICAgICAgICAgICAgICApLFxyXG4gICAgICAgICAgICAgICAgICAgIEZsYW1lUG9pbnRTdGFnZS5wb3N0Qmxhc3QsXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maWcsIGlzTGl0ZUJsYXN0KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBwcml2YXRlIGluaXRCbGFzdFJhZGl1c0ZvckNvbmZpZyhyOiBudW1iZXIsIGFfbWF4OiBudW1iZXIpIHtcclxuICAgICAgICAgICAgbGV0IGFfbWF4X3NxID0gYV9tYXggKiBhX21heDtcclxuICAgICAgICAgICAgbGV0IHJfYV9tYXggPSByIC8gYV9tYXg7XHJcbiAgICAgICAgICAgIGxldCBibGFzdENpcmNsZSA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBhID0gMDsgYSA8PSBhX21heDsgYSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgeCA9IChhL2FfbWF4KSoocilcclxuICAgICAgICAgICAgICAgIGxldCB5ID0gcl9hX21heCAqIE1hdGguc3FydChhX21heF9zcSAtIGEqYSk7XHJcbiAgICAgICAgICAgICAgICBibGFzdENpcmNsZS5wdXNoKFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQb2ludCh4LCB5KSxcclxuICAgICAgICAgICAgICAgICAgICBuZXcgUG9pbnQoLXgsIHkpLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBQb2ludCh4LCAteSksXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IFBvaW50KC14LCAteSlcclxuICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGJsYXN0Q2lyY2xlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuIl19
