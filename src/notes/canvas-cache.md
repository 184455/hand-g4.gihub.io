---
title: 6、在Canvas中使用双缓存
order: 6
---

## 双缓存是什么？

在处理计算机图形时，经常会进行清除上一帧画面，然后重新绘制新一帧的操作。如果新一帧画面渲染时间过长，就很可能出现短暂的白屏。
为了解决这个问题，我们可以先在内存中绘制新一帧画面。在绘制完成后，直接用新一帧的数据替换显示画面，就不会出现白屏了。
更多关于双缓存的解释可以看[这里](https://docs.microsoft.com/zh-cn/dotnet/desktop/winforms/advanced/double-buffered-graphics?view=netframeworkdesktop-4.8)。

## Canvas 中的双缓存

在使用 Canvas 绘制动画时，也需要进行清除上一帧再重绘下一帧的操作。但这样做通常不会引起闪屏，因为现代浏览器在渲染时都默认使用了双缓存。
可以通过下面的例子进行验证：每次点击按钮将随机重绘 5000 个圆，浏览器出现了短暂的卡顿，却依然没有发生闪屏。

```tsx | preview
import React, { useEffect, useRef, useState } from 'react';

function drawBall(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  const maxRadius = Math.min(width, height);
  const radius = Math.floor(Math.random() * maxRadius) + 1;
  const x = Math.floor(Math.random() * width);
  const y = Math.floor(Math.random() * height);
  const arr = [];
  for (var i = 0; i < 3; i++) {
    arr.push(Math.floor(Math.random() * 128 + 64));
  }
  const color = `rgb(${arr[0]},${arr[1]},${arr[2]})`;
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.lineWidth = 20;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function drawBalls(canvas: HTMLCanvasElement, times: number) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  let i = 0;
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.translate(width / 2, height / 2);
  while (i < times) {
    drawBall(ctx, width, height);
    i++;
  }
  ctx.restore();
}

function Index() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [times, setTimes] = useState(5000);

  useEffect(() => {
    draw();
  }, []);

  const draw = () => {
    drawBalls(canvasRef.current, times);
  };

  return (
    <>
      <canvas
        style={{ margin: '0 auto', display: 'block' }}
        ref={canvasRef}
        width={600}
        height={300}
      ></canvas>
      <div>
        <input
          type="number"
          value={times}
          onChange={(e) => setTimes(e.target.value)}
        />
        <button onClick={draw}>draw</button>
      </div>
    </>
  );
}

export default Index;
```

## 利用缓存处理复杂图形

虽然使用 Canvas 画图时不需要处理闪屏问题，但仍然可以使用缓存的思想来处理复杂图形以提高性能表现。
在使用 Canvas 画图时，对于需要重复绘制的复杂单元，我们可以将其绘制到一个缓存 Canvas 中。在下次重绘时直接使用缓存 Canvas 中的数据，而不是将其重绘一遍。
可以参考下面的例子：每次生成 150 个小圆进行圆周运动，小圆的半径和颜色都是随机生成，使用缓存时会将每个小圆绘制到单独的缓存 Canvas 上，每次重绘直接将缓存 Canvas 绘制到图形上。

<code src="./demos/canvas-cache/index.tsx"></code>

## 结论

双缓存常用于处理计算机图形中的闪屏问题，但 Canvas 画图时不需要，因为浏览器已经默认使用了双缓存。在 Canvas 中可以通过缓存复杂图形单元来降低性能消耗。
