export default class UnCachedBall {
  private colors: string[] = [];

  constructor(
    radius: number,
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
  }

  move() {
    this.runAngle += Math.PI / 150;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.lineWidth = 2;
    ctx.translate(300, 200);
    ctx.rotate(this.runAngle);
    for (const [index, color] of this.colors.entries()) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.arc(this.runRadius, 0, index, 0, Math.PI * 2, true);
      ctx.stroke();
    }
    ctx.restore();
  }
}
