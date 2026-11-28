import { useRef, useState, useEffect } from 'react';

type Segment = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  color: string;
  width: number;
};

// Draws one segment. Used for your own drawing AND for incoming drawing.
function drawSegment(canvas: HTMLCanvasElement, s: Segment) {
  const ctx = canvas.getContext('2d')!;
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(s.x0, s.y0);
  ctx.lineTo(s.x1, s.y1);
  ctx.stroke();
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [color, setColor] = useState('#ff0000');
  const [width, setWidth] = useState(4);

  // Open the WebSocket once, when the component appears
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080');
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const seg: Segment = JSON.parse(event.data);
      drawSegment(canvasRef.current!, seg);
    };

    return () => ws.close(); // close it when the component goes away
  }, []);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // Draw locally, then send to the server
  const drawAndSend = (seg: Segment) => {
    drawSegment(canvasRef.current!, seg);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(seg));
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getPos(e);
    isDrawing.current = true;
    lastPos.current = { x, y };
    // a zero-length segment draws a dot when you just click
    drawAndSend({ x0: x, y0: y, x1: x, y1: y, color, width });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !lastPos.current) return;
    const { x, y } = getPos(e);
    drawAndSend({
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: x,
      y1: y,
      color,
      width,
    });
    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <>
      <div style={{ marginBottom: 10, display: 'flex', gap: 16, alignItems: 'center' }}>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
        <input
          type="range"
          min={1}
          max={20}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        />
        <span>{width}px</span>
        <button onClick={clear}>Clear</button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ border: '1px solid #999' }}
      />
    </>
  );
}