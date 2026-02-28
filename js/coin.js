/**
 * coin.js - 金币系统
 * 负责金币的随机生成、收集检测、旋转/闪烁动画
 */

export default class Coin {
  /**
   * @param {object} road - Road实例
   * @param {number} lane - 所在车道(0/1/2)
   */
  constructor(road, lane) {
    this.road = road;
    this.lane = lane;
    this.x = road.getLaneCenter(lane);
    this.y = -20;

    // 金币半径
    this.radius = 14;

    // 是否已收集/移出屏幕
    this.dead = false;

    // 旋转动画参数（模拟3D翻转用椭圆宽度变化）
    this.flipAngle = 0;
    this.flipSpeed = 0.08;

    // 闪烁计时器
    this.glowTimer = 0;
  }

  /**
   * 更新金币状态
   * @param {number} speed - 当前游戏速度
   */
  update(speed) {
    this.y += speed;
    this.flipAngle += this.flipSpeed;
    this.glowTimer += 0.05;

    if (this.y > this.road.canvas.height + this.radius) {
      this.dead = true;
    }
  }

  /**
   * 获取碰撞圆（用于和玩家矩形检测）
   */
  getHitBox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }

  /**
   * 检测与玩家矩形碰撞
   * @param {object} playerHitBox - 玩家碰撞矩形
   */
  checkCollision(playerHitBox) {
    // 圆矩形碰撞检测
    const closestX = Math.max(playerHitBox.x, Math.min(this.x, playerHitBox.x + playerHitBox.width));
    const closestY = Math.max(playerHitBox.y, Math.min(this.y, playerHitBox.y + playerHitBox.height));
    const dx = this.x - closestX;
    const dy = this.y - closestY;
    return dx * dx + dy * dy < this.radius * this.radius;
  }

  /**
   * 绘制金币（带旋转动画和光晕效果）
   */
  draw(ctx) {
    const x = this.x;
    const y = this.y;
    const r = this.radius;

    // 翻转动画：用椭圆横轴变化模拟硬币翻转
    const scaleX = Math.abs(Math.cos(this.flipAngle));
    const rx = Math.max(r * scaleX, 2);

    // 光晕强度（0~1）
    const glow = (Math.sin(this.glowTimer) + 1) / 2;

    ctx.save();

    // 外圈光晕
    if (glow > 0.3) {
      ctx.globalAlpha = glow * 0.4;
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.ellipse(x, y, rx + 5, r + 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 金币背面（翻转到一半时颜色变深）
    const isFront = Math.cos(this.flipAngle) >= 0;
    ctx.fillStyle = isFront ? '#FFD700' : '#B8860B';

    ctx.beginPath();
    ctx.ellipse(x, y, rx, r, 0, 0, Math.PI * 2);
    ctx.fill();

    // 边缘高光
    ctx.strokeStyle = isFront ? '#FFF176' : '#DAA520';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, r, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 中间 "$" 符号（只在正面显示）
    if (isFront && rx > r * 0.3) {
      ctx.fillStyle = '#B8860B';
      ctx.font = `bold ${Math.floor(r * 1.1)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = Math.min(1, scaleX * 2);
      ctx.fillText('$', x, y);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }
}
