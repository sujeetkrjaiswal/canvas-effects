# canvas-effects #

## QuickStart : Fireworks ##

### HTML File ###
```html
<!DOCTYPE html>
<html>
<head>
	<title>Canvas-Effect</title>
	<style>
		body,canvas{margin:0;padding:0;border:0;}
		#canvasPlayArea{width:100%;height: 100vh;background-color: rgba(0,0,0,1)}
	</style>
</head>
<body>
<canvas id="canvasPlayArea"></canvas>
<script src="./Fireworks.js"></script>
<script src="./app.js"></script>
</body>
</html>
```

### JavaScript ###
```JavaScript
if (window.addEventListener) { // Mozilla, Netscape, Firefox
    window.addEventListener('load', InitDemo, false);
} else if (window.attachEvent) { // IE
    window.attachEvent('onload', InitDemo);
}
function InitDemo(){
    var canvas = document.getElementById("canvasPlayArea");
    var mousePoints = [];
    var mouseDown = false;
    var config = new Fireworks.Config()
    var fireworkApp = new Fireworks.App(canvas,config,function(){console.log("Fire points are now empty")})
    canvas.onclick = function(event) {
        fireworkApp.addFlameBlasts([new Fireworks.Point(event.offsetX , event.offsetY )])
    }
    canvas.onmousedown = (event) => {
        mouseDown = true;
        mousePoints = [new Fireworks.Point(event.offsetX, event.offsetY)];
    }
    canvas.onmousemove = (event) => {                
        if (mouseDown) {
            mousePoints.push(new Fireworks.Point(event.offsetX, event.offsetY));
        }
    }
    canvas.onmouseup = (event) => {
        mouseDown = false;
        fireworkApp.addFlameBlasts(mousePoints, true);
        mousePoints = [];
    }
}
```