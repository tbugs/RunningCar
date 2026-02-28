/**
 * player.js - 玩家赛车类
 * 负责赛车的位置、车道切换动画、碰撞矩形和渲染
 */

export default class Player {
  constructor(canvas, ctx, road) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.road = road;

    // 赛车尺寸
    this.width = road.laneWidth * 0.55;
    this.height = this.width * 2;

    // 当前车道（0=左, 1=中, 2=右）
    this.lane = 1;
    this.targetLane = 1;

    // 屏幕底部固定位置
    this.y = canvas.height - this.height - 30;

    // X坐标（动画用）
    this.x = road.getLaneCenter(this.lane);
    this.targetX = this.x;

    // 切换车道动画速度（像素/帧）
    this.laneChangeSpeed = 10;

    // 是否正在切换车道
    this.isChangingLane = false;

    // 赛车颜色
    this.color = '#E63946';
    this.windowColor = '#ADE8F4';
    this.wheelColor = '#222222';
  }

  /**
   * 向左切换车道
   */
  moveLeft() {
    if (this.targetLane > 0) {
      this.targetLane--;
      this.targetX = this.road.getLaneCenter(this.targetLane);
      this.isChangingLane = true;
    }
  }

  /**
   * 向右切换车道
   */
  moveRight() {
    if (this.targetLane < this.road.laneCount - 1) {
      this.targetLane++;
      this.targetX = this.road.getLaneCenter(this.targetLane);
      this.isChangingLane = true;
    }
  }

  /**
   * 更新玩家状态（每帧调用）
   */
  update() {
    if (this.isChangingLane) {
      const diff = this.targetX - this.x;
      if (Math.abs(diff) <= this.laneChangeSpeed) {
        this.x = this.targetX;
        this.lane = this.targetLane;
        this.isChangingLane = false;
      } else {
        this.x += diff > 0 ? this.laneChangeSpeed : -this.laneChangeSpeed;
      }
    }
  }

  /**
   * 获取碰撞矩形（比视觉略小，让游戏更公平）
   */
  getHitBox() {
    const margin = 6;
    return {
      x: this.x - this.width / 2 + margin,
      y: this.y + margin,
      width: this.width - margin * 2,
      height: this.height - margin * 2,
    };
  }

  /**
   * 绘制赛车
   */
  draw() {
    const ctx = this.ctx;
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;

    ctx.save();

    // 车身阴影
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // 车身主体
    ctx.fillStyle = this.color;
    _roundRect(ctx, x - w / 2, y, w, h, 6);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 前挡风玻璃
    ctx.fillStyle = this.windowColor;
    _roundRect(ctx, x - w / 2 + w * 0.12, y + h * 0.1, w * 0.76, h * 0.22, 4);
    ctx.fill();

    // 后挡风玻璃
    ctx.fillStyle = this.windowColor;
    _roundRect(ctx, x - w / 2 + w * 0.12, y + h * 0.65, w * 0.76, h * 0.16, 4);
    ctx.fill();

    // 车灯（前）
    ctx.fillStyle = '#FFFACD';
    ctx.fillRect(x - w / 2 + 4, y + 4, w * 0.25, 6);
    ctx.fillRect(x + w / 2 - 4 - w * 0.25, y + 4, w * 0.25, 6);

    // 尾灯（后）
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(x - w / 2 + 4, y + h - 10, w * 0.25, 6);
    ctx.fillRect(x + w / 2 - 4 - w * 0.25, y + h - 10, w * 0.25, 6);

    // 轮子
    this._drawWheel(x - w / 2 - 4, y + h * 0.15, 7, 12);
    this._drawWheel(x + w / 2 + 4, y + h * 0.15, 7, 12);
    this._drawWheel(x - w / 2 - 4, y + h * 0.7, 7, 12);
    this._drawWheel(x + w / 2 + 4, y + h * 0.7, 7, 12);

    ctx.restore();
  }

  /**
   * 绘制单个轮子
   */
  _drawWheel(x, y, rx, ry) {
    const ctx = this.ctx;
    ctx.fillStyle = this.wheelColor;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    // 轮毂
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.ellipse(x, y, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 工具函数：绘制圆角矩形路径
 */
function _roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
