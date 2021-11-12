import React, { useEffect, useRef } from 'react';
// @ts-ignore
import Stats from 'stats.js';

export default function ({ Ball }: { Ball: any }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<any[]>([]);
  const statsRef = useRef<Stats>(new Stats());
  const runningRef = useRef(false);

  // 执行动画
  useEffect(() => {
    const canvas: HTMLCanvasElement = canvasRef.current!;
    let i = 0;
    while (i < 150) {
      const initAngle = Math.random() * Math.PI * 2;
      const runRadius = (Math.floor(Math.random() * 8) + 1) * 30;
      const raduis = Math.floor(Math.random() * 20) + 10;
      ballsRef.current.push(new Ball(raduis, runRadius, initAngle));
      i++;
    }
    runningRef.current = true;
    run(canvas.getContext('2d')!);
    return () => {
      runningRef.current = false;
    };
  }, []);

  // 显示fps
  useEffect(() => {
    const stats: Stats = statsRef.current;
    stats.dom.style.position = 'absolute';
    stats.dom.style.left = 'inital';
    stats.dom.style.right = '0px';
    stats.dom.style.top = '0px';
    wrapperRef.current!.appendChild(stats.dom);
    return () => stats.dom.remove();
  }, []);

  const run = (ctx: CanvasRenderingContext2D) => {
    statsRef.current.update();
    ctx.clearRect(0, 0, 600, 400);
    draw(ctx);
    for (const ball of ballsRef.current) {
      ball.move();
      ball.draw(ctx);
    }
    if (runningRef.current) {
      requestAnimationFrame(() => run(ctx));
    }
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    let r = 30;
    while (r < 300) {
      ctx.beginPath();
      ctx.arc(300, 200, r, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.stroke();
      r += 30;
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={wrapperRef}>
      <canvas
        style={{ display: 'block', margin: '0 auto' }}
        width={600}
        height={400}
        ref={canvasRef}
      >
        not support
      </canvas>
    </div>
  );
}
