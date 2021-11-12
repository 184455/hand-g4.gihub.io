export default class cachedBall {
  private colors: string[] = [];
  private cachedCanvas!: HTMLCanvasElement;

  constructor(
    private radius: number,
    private runRadius: number,
    private runAngle: number,
  ) {
    let r = 0;
    while (r < radius) {
      this.colors.push(
        `#${Math.floor(Math.random() * 268435455).toString(16)}`,
      );
      r += 1;
    }
    this.initCachedCanvas();
  }

  initCachedCanvas() {
    this.cachedCanvas = document.createElement('canvas');
    this.cachedCanvas.width = this.radius * 2;
    this.cachedCanvas.height = this.radius * 2;
    const ctx = this.cachedCanvas.getContext('2d')!;
    ctx.lineWidth = 2;
    for (const [index, color] of this.colors.entries()) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.arc(this.radius, this.radius, index, 0, Math.PI * 2, true);
      ctx.stroke();
    }
  }

  move() {
    this.runAngle += Math.PI / 150;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.translate(300, 200);
    ctx.rotate(this.runAngle);
    ctx.drawImage(this.cachedCanvas, this.runRadius - this.radius, 0);
    ctx.restore();
  }
}
