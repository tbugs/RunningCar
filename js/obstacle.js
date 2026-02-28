/**
 * obstacle.js - 障碍车辆类
 * 负责障碍车辆的随机生成、移动、碰撞检测
 */

// 障碍车辆颜色池
const OBSTACLE_COLORS = [
  { body: '#1D3557', window: '#A8DADC' },
  { body: '#457B9D', window: '#CAF0F8' },
  { body: '#2D6A4F', window: '#B7E4C7' },
  { body: '#6D4C41', window: '#FFCCBC' },
  { body: '#6A0572', window: '#E0B3F0' },
];

export default class Obstacle {
  /**
   * @param {object} road - Road实例
   * @param {number} lane - 所在车道(0/1/2)
   * @param {number} speed - 初始速度
   */
  constructor(road, lane, speed) {
    this.road = road;

    // 尺寸与玩家车相似
    this.laneWidth = road.laneWidth;
    this.width = this.laneWidth * 0.55;
    this.height = this.width * 2;

    this.lane = lane;
    this.x = road.getLaneCenter(lane);
    this.y = -this.height - 10; // 从屏幕顶部外生成

    this.speed = speed;

    // 随机颜色
    const colorSet = OBSTACLE_COLORS[Math.floor(Math.random() * OBSTACLE_COLORS.length)];
    this.color = colorSet.body;
    this.windowColor = colorSet.window;

    // 是否已被移除
    this.dead = false;
  }

  /**
   * 更新位置
   */
  update(speed) {
    this.y += speed;
    if (this.y > this.road.canvas.height + this.height) {
      this.dead = true;
    }
  }

  /**
   * 获取碰撞矩形
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
   * 检测与玩家的矩形碰撞
   * @param {object} playerHitBox - 玩家碰撞矩形
   */
  checkCollision(playerHitBox) {
    const b = this.getHitBox();
    return (
      b.x < playerHitBox.x + playerHitBox.width &&
      b.x + b.width > playerHitBox.x &&
      b.y < playerHitBox.y + playerHitBox.height &&
      b.y + b.height > playerHitBox.y
    );
  }

  /**
   * 绘制障碍车辆（朝向屏幕方向，即车头朝下）
   */
  draw(ctx) {
    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;

    ctx.save();

    // 阴影
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    // 车身
    ctx.fillStyle = this.color;
    _roundRect(ctx, x - w / 2, y, w, h, 6);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 前挡风玻璃（障碍车下方是车头）
    ctx.fillStyle = this.windowColor;
    _roundRect(ctx, x - w / 2 + w * 0.12, y + h * 0.63, w * 0.76, h * 0.22, 4);
    ctx.fill();

    // 后挡风玻璃
    ctx.fillStyle = this.windowColor;
    _roundRect(ctx, x - w / 2 + w * 0.12, y + h * 0.1, w * 0.76, h * 0.16, 4);
    ctx.fill();

    // 车灯（障碍车下方）
    ctx.fillStyle = '#FF4444';
    ctx.fillRect(x - w / 2 + 4, y + h - 10, w * 0.25, 6);
    ctx.fillRect(x + w / 2 - 4 - w * 0.25, y + h - 10, w * 0.25, 6);

    // 前灯
    ctx.fillStyle = '#FFFACD';
    ctx.fillRect(x - w / 2 + 4, y + 4, w * 0.25, 6);
    ctx.fillRect(x + w / 2 - 4 - w * 0.25, y + 4, w * 0.25, 6);

    // 轮子
    _drawWheel(ctx, x - w / 2 - 4, y + h * 0.15, 7, 12);
    _drawWheel(ctx, x + w / 2 + 4, y + h * 0.15, 7, 12);
    _drawWheel(ctx, x - w / 2 - 4, y + h * 0.7, 7, 12);
    _drawWheel(ctx, x + w / 2 + 4, y + h * 0.7, 7, 12);

    ctx.restore();
  }
}

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

function _drawWheel(ctx, x, y, rx, ry) {
  ctx.fillStyle = '#222222';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#888888';
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.5, ry * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
}
