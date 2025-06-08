/*
Provides only one function: lineCircle()

return value:
  if the circle is colliding with the line then
  the function will return the closest point on the line
  to the circle

parameters:
  line:
    an object with two vectors
    called a and b. Has to have
    a width variable.

  circle:
    an object with a position vector
    and has to have a radius

example:
  const collision = lineCircle(line, circle);
  if (collision) {
    console.log(collision);
    const collisionX = collision.x;
    const collisionY = collision.y;
  }

*/
function lineCircle(line, circle) {
  function pointCircle(point, circle, pointradius) {
      let dx = point.x - circle.position.x;
      let dy = point.y - circle.position.y;
      let d = Math.sqrt(dx * dx + dy * dy);
  
      //ctx.fillStyle = "red"
      //ctx.beginPath();
      //ctx.arc(point.x, point.y, pointradius, 0, Math.PI * 2);
      //ctx.fill();
      //ctx.closePath();
  
      if (d <= circle.radius + pointradius) return true;
      return false;
  }
  function linePoint(line, point) {
      let lenX = line.a.x - line.b.x;
      let lenY = line.a.y - line.b.y;
      let len = Math.sqrt(lenX * lenX + lenY * lenY);
      let dxa = line.a.x - point.x;
      let dya = line.a.y - point.y;
      let dxb = line.b.x - point.x;
      let dyb = line.b.y - point.y;
      let da = Math.sqrt(dxa * dxa + dya * dya);
      let db = Math.sqrt(dxb * dxb + dyb * dyb);
      let buffer = 0.1;
      if (da + db - buffer < len && da + db + buffer > len) return true;
      return false;
  }
  //find the length of the line
  const lenX = line.a.x - line.b.x;
  const lenY = line.a.y - line.b.y;
  const len = Math.sqrt(lenX * lenX + lenY * lenY);

  //naming
  const cx = circle.position.x;
  const cy = circle.position.y;
  const x1 = line.a.x;
  const x2 = line.b.x;
  const y1 = line.a.y;
  const y2 = line.b.y;

  //find the closest point on the line
  const dot = ( ((cx-x1)*(x2-x1)) + ((cy-y1)*(y2-y1)) ) / Math.pow(len,2);

  const closestX = x1 + (dot * (x2-x1));
  const closestY = y1 + (dot * (y2-y1));

  const dx = closestX - cx;
  const dy = closestY - cy;
  const d = Math.sqrt(dx * dx + dy * dy);

  //check if either of the line points are colliding with the circle
  const pointA = pointCircle(line.a, circle, line.width);
  const pointB = pointCircle(line.b, circle, line.width);

  if (pointA && !linePoint(line, {x: closestX, y: closestY })) return { closestX: line.a.x, closestY: line.a.y };
  if (pointB && !linePoint(line, {x: closestX, y: closestY })) return { closestX: line.b.x, closestY: line.b.y };
  
  //if closest point on line is not on the line
  if (!linePoint(line, {x: closestX, y: closestY })) return false;
  
  // ctx.strokeStyle = "lightgray";
  // ctx.lineWidth = 3;
  // ctx.beginPath();
  // ctx.moveTo(circle.position.x, circle.position.y);
  // ctx.lineTo(closestX, closestY);
  // ctx.stroke();
  // ctx.closePath();
  // ctx.fillStyle = "red";
  // ctx.beginPath();
  // ctx.arc(closestX, closestY, line.width, 0, Math.PI * 2);
  // ctx.fill();
  // ctx.closePath();
 
  //if the circle is touching the closest point
  if (d < circle.radius + line.width) return { closestX, closestY };

  return false;
}