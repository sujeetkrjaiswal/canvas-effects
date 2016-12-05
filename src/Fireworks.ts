module Fireworks {
    /**Fireworks is a module which will create a firework animation on the canvas element
     * passed to the application. This will fire from the bottom middle of the canvas and
     * will go to the destination point where it will blast roughly in a circle
     */

    /**Config is a public interface provide to the end-user to provide the required configuration */
    export class Config{
        percentIncrement: number;
        maxBlastRad: number;
        flameInQuater: number;
        animateCallRate: number;
        constructor(percentIncrement: number = 5, maxBlastRad: number = 0.1, flameInQuater: number = 20, fps: number = 100) {
            this.percentIncrement = percentIncrement;
            this.maxBlastRad = maxBlastRad;
            this.flameInQuater = flameInQuater;
            this.animateCallRate = 1000 / fps;
        }
    }
    /**This would provide the interface to external application to initiate the firework.
     * 
    */
    export class App {
        private factor: Point;
        private canvas: HTMLCanvasElement;
        private context: CanvasRenderingContext2D;
        private config: Config;
        private flamePaths: FlamePoint[];
        private flamePointFactory: FlamePointFactory;

        private mouseDown: boolean = false;
        private mousePoints: Point[];

        private isAnimActive: boolean = false;
        private animateTimer: number;
        private callbackOnEmpty: Function;
        constructor(canvas: HTMLCanvasElement, config: Config, callbackOnEmpty: Function) {
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

        public reset() {
            this.flamePaths = [];
            this.context.fillStyle = "rgba(0,0,0,1)";
            this.context.fillRect(0, 0, this.factor.x, this.factor.y);
        }
        public addFlameBlasts(blastPoints: Point[], isLiteBlast: boolean = false) {
            this.flamePaths.push(...blastPoints.map((point: Point): FlamePoint => this.flamePointFactory.getPreBlastFlamePoint(point.divide(this.factor), isLiteBlast)));
            if (!this.isAnimActive) {
                this.animateRequester();
                this.isAnimActive = true;
            }
        }
        private updateCanvasAndFactor() {
            this.factor.x = this.canvas.clientWidth;
            this.factor.y = this.canvas.clientHeight;
            this.canvas.width = this.factor.x;
            this.canvas.height = this.factor.y;
            this.shadeCanvas();
        }
        private addListners() {
            window.onresize = (event) => {
                this.updateCanvasAndFactor();
            }
        }
        private animateRequester() {
            if (this.flamePaths.length) {
                setTimeout(()=> {
                    requestAnimationFrame(() => { this.animate(); });
                }, this.config.animateCallRate);                
            } else {
                this.isAnimActive = false;
                (function (callback) { callback(); })(this.callbackOnEmpty);
                
            }
        }
        private animate() {
            let temp_postBlastContainer: FlamePoint[] = [];

            //Filter completed FlamePoint
            this.flamePaths = this.flamePaths.filter((fpaths: FlamePoint): boolean => {
                if (fpaths.completion >= 100) {
                    if (fpaths.stage == FlamePointStage.preBlast) {                        
                        temp_postBlastContainer.push(fpaths);
                    }
                    return false;
                }
                return true;
            });
            //Add FlamePoints from temp_postBlastContainer for stage-2 i.e FlamePointStage.postBlast
            this.flamePaths.push(...temp_postBlastContainer.reduce((arr: FlamePoint[], fpoint: FlamePoint): FlamePoint[] => {
                arr.push(...this.flamePointFactory.getPostBlastFlamePoints(fpoint.path.end, fpoint.isLiteBlast));
                return arr;
            }, []));
            
            this.drawOnCanvas();
            this.animateRequester();
        }
        private shadeCanvas() {
            this.context.fillStyle = "rgba(0,0,0,0.2)";
            this.context.fillRect(0, 0, this.factor.x, this.factor.y);
        }
        private drawOnCanvas() {
            this.shadeCanvas();          
            this.flamePaths.forEach((flamePoint: FlamePoint): void => {
                let startPoint: Point = flamePoint.getNextPoint().multiple(this.factor);
                let endPoint: Point = flamePoint.getTrailEndPoint().multiple(this.factor);
                this.context.beginPath();
                this.context.moveTo(startPoint.x, startPoint.y);
                this.context.lineTo(endPoint.x, endPoint.y);
                if (flamePoint.stage == FlamePointStage.preBlast) {
                    this.context.strokeStyle = flamePoint.color.toString();
                } else {
                    let decay = flamePoint.completion < 75 ? 0 : flamePoint.completion / 100;
                    this.context.strokeStyle = flamePoint.color.toString(flamePoint.completion/100);
                }
                this.context.stroke();
                //this.context.closePath();
                
                        
                             
            });
        }

    }
    /**Stages in a firework
     * preBlast : forms a line between bottom center and the destination (blast point)
     * postBlast : addes multiple points with origin as the blast point and destination as random points around the config.radius
     */
    enum FlamePointStage {
        preBlast,
        postBlast
    }
    /**Point : represents a dot with its coordinates
     * It denote the coordinates using x and y coordinates (rectangular coordinate system)
     * other utility functions are defined on this to facilitate other dependent functions
     */
    export class Point {
        x: number;
        y: number;
        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
        }
        public diff(end: Point): Point {
            return new Point(
                end.x - this.x,
                end.y - this.y
            );
        }
        public add(point: Point): Point {
            return new Point(
                this.x + point.x,
                this.y + point.y
            );
        }
        public multiple(factor: Point): Point {
            return new Point(
                this.x * factor.x,
                this.y * factor.y
            );
        }
        public divide(factor:Point):Point{
            return new Point(
                this.x / factor.x,
                this.y / factor.y
            );
        }
        public getFactoredPoint(initialPoint: Point, factor: number): Point {
            return new Point(
                initialPoint.x + factor * this.x,
                initialPoint.y + factor * this.y
            );
        }
    }
    /**Line Class represents a virtual line between the source and destination point
     * for faster performance reasons, we also stores diff between the source and destination
     * 
     * It has a method which calculates the point at certain percentage 
     */
    class Line {
        private start: Point;
        private diff: Point;
        public end: Point;
        constructor(start: Point, end: Point) {
            this.start = start;
            this.end = end;
            this.diff = this.start.diff(end);
        }
        public xyAtPercentage(percentage: number): Point{
            return this.diff.getFactoredPoint(this.start, percentage/100);
        }
    }
    /**Flame Point represents the burning point in an firework
     * path : keeps the line to which the flame point will travel
     * stage : blast stage - preBlast, postBlast
     * completion : stores the percentage of the path which flame has already covered
     * color : hls value of the flame point
    */
    class FlamePoint {
        path: Line;
        stage: FlamePointStage;
        completion: number;
        isLiteBlast: boolean;
        color: Color;
        private config: Config;
        constructor(path: Line, stage: FlamePointStage, config: Config, isLiteBlast: boolean = false) {
            this.path = path;
            this.stage = stage;
            this.config = config;
            this.isLiteBlast = isLiteBlast;
            this.completion = 0.0;
            this.color = new Color();
        }
        public getNextPoint(): Point {
            let increment = this.config.percentIncrement * (1 - this.completion / 100);
            this.completion += (increment < 0.4 ? 0.4 : increment);
            return this.path.xyAtPercentage(this.completion);
        }
        public getTrailEndPoint(relativeCompletion: number = -4): Point {
            return this.path.xyAtPercentage(this.completion + relativeCompletion);
        }
    }
    /**Color provides rgba and hsl 
     * it generates Random colors in constructor
     */
    class Color {
        r: number;
        g: number;
        b: number;
        a: number;

        h: number;
        s: number;
        l: number;
        
        isRGB: boolean;
        private static hue: number = 100;
        constructor(isRGB: boolean = false) {
            this.isRGB = isRGB;
            if (this.isRGB) {
                this.r = this.randomNoInRange(0, 255);
                this.g = this.randomNoInRange(0, 255);
                this.b = this.randomNoInRange(0, 255);
                this.a = this.randomNoInRange(0, 1);
            } else {
                Color.hue += 0.5;
                this.h = this.randomNoInRange(Color.hue - 20, Color.hue+20);//120 +- 20
                this.s = 100;
                this.l = this.randomNoInRange(50, 70);
            }
        }
        private randomNoInRange(lower: number, upper: number) {
            return Math.round(Math.random() * (upper - lower) + lower);
        }
        toString(decay: number = 0) {//0 - 1
            if (this.isRGB) {
                return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a * (1 - decay) + ")";
            } else {
                return "hsl(" + this.h + "," + this.s + "%," + this.l * (1 - decay) + "%)";
            }
        }
    }
    /**This is a factory to generate following
     * preBlast FlamePoint
     * postBlast flamePoint
     * 
     * It also calculates the initial blast radius for points
     */
    class FlamePointFactory {
        private originPoint: Point;
        private config: Config;
        private blastCircle: Point[];
        private liteBlastCircle: Point[];
        constructor(config: Config) {
            this.originPoint = new Point(0.5, 1);
            this.config = config;
            this.blastCircle = this.initBlastRadiusForConfig(this.config.maxBlastRad, this.config.flameInQuater);
            this.liteBlastCircle = this.initBlastRadiusForConfig(this.config.maxBlastRad/2, Math.round(this.config.flameInQuater/10));
        }
        public getPreBlastFlamePoint(dest: Point, isLiteBlast: boolean = false): FlamePoint {
            return new FlamePoint(
                new Line(this.originPoint, dest),
                FlamePointStage.preBlast,
                this.config,
                isLiteBlast
            );
        }
        public getPostBlastFlamePoints(center: Point, isLiteBlast: boolean = false): FlamePoint[] {
            let blastCircleBluePrint: Point[] = [];
            if (isLiteBlast) {
                blastCircleBluePrint = this.liteBlastCircle;
            } else {
                blastCircleBluePrint = this.blastCircle;
            }
            return blastCircleBluePrint.map(
                (point: Point): FlamePoint => new FlamePoint(
                    new Line(
                        center,
                        point.getFactoredPoint(center, Math.random())
                    ),
                    FlamePointStage.postBlast,
                    this.config, isLiteBlast)
            );
        }
        private initBlastRadiusForConfig(r: number, a_max: number) {
            let a_max_sq = a_max * a_max;
            let r_a_max = r / a_max;
            let blastCircle = [];
            for (let a = 0; a <= a_max; a++) {
                let x = (a/a_max)*(r)
                let y = r_a_max * Math.sqrt(a_max_sq - a*a);
                blastCircle.push(
                    new Point(x, y),
                    new Point(-x, y),
                    new Point(x, -y),
                    new Point(-x, -y)
                );
            }
            return blastCircle;
        }
    }
}

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