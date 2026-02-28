/**
 * road.js - 道路渲染模块
 * 负责绘制滚动公路、车道线、路边装饰
 */

export default class Road {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;

    // 道路区域（左右各留边距作为草地）
    this.roadMargin = this.width * 0.08;
    this.roadLeft = this.roadMargin;
    this.roadRight = this.width - this.roadMargin;
    this.roadWidth = this.roadRight - this.roadLeft;

    // 3条车道
    this.laneCount = 3;
    this.laneWidth = this.roadWidth / this.laneCount;

    // 车道中心X坐标
    this.laneCenters = [];
    for (let i = 0; i < this.laneCount; i++) {
      this.laneCenters.push(this.roadLeft + this.laneWidth * i + this.laneWidth / 2);
    }

    // 道路滚动偏移量
    this.scrollY = 0;

    // 虚线段参数
    this.dashLen = 40;
    this.dashGap = 30;
    this.dashPeriod = this.dashLen + this.dashGap;

    // 路边装饰（树木/草地标记）
    this.decorations = this._initDecorations();
  }

  /**
   * 初始化路边装饰物
   */
  _initDecorations() {
    const items = [];
    const count = 12;
    for (let i = 0; i < count; i++) {
      // 左侧装饰
      items.push({
        x: this.roadMargin * 0.4,
        y: (i / count) * this.height,
        side: 'left',
        type: i % 2 === 0 ? 'tree' : 'bush',
      });
      // 右侧装饰
      items.push({
        x: this.width - this.roadMargin * 0.4,
        y: ((i + 0.5) / count) * this.height,
        side: 'right',
        type: i % 2 === 0 ? 'bush' : 'tree',
      });
    }
    return items;
  }

  /**
   * 获取指定车道的中心X坐标
   */
  getLaneCenter(laneIndex) {
    return this.laneCenters[laneIndex];
  }

  /**
   * 更新道路滚动
   * @param {number} speed - 当前游戏速度（像素/帧）
   */
  update(speed) {
    this.scrollY = (this.scrollY + speed) % this.dashPeriod;
    // 更新装饰物位置
    for (const d of this.decorations) {
      d.y += speed;
      if (d.y > this.height + 40) {
        d.y -= this.height + 80;
      }
    }
  }

  /**
   * 绘制道路
   */
  draw() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 绘制草地背景
    ctx.fillStyle = '#4a7c3f';
    ctx.fillRect(0, 0, w, h);

    // 绘制路边深绿色草地纹理
    ctx.fillStyle = '#3d6b34';
    ctx.fillRect(0, 0, this.roadLeft - 2, h);
    ctx.fillRect(this.roadRight + 2, 0, w - this.roadRight - 2, h);

    // 绘制道路主体
    ctx.fillStyle = '#555555';
    ctx.fillRect(this.roadLeft, 0, this.roadWidth, h);

    // 绘制道路边界线（黄色实线）
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.roadLeft, 0);
    ctx.lineTo(this.roadLeft, h);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.roadRight, 0);
    ctx.lineTo(this.roadRight, h);
    ctx.stroke();

    // 绘制车道分隔线（白色虚线）
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    for (let i = 1; i < this.laneCount; i++) {
      const x = this.roadLeft + this.laneWidth * i;
      this._drawDashedLine(x, h);
    }

    // 绘制路边装饰
    for (const d of this.decorations) {
      this._drawDecoration(d);
    }
  }

  /**
   * 绘制滚动虚线
   */
  _drawDashedLine(x, h) {
    const ctx = this.ctx;
    ctx.beginPath();
    let y = -this.dashPeriod + this.scrollY;
    while (y < h + this.dashPeriod) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + this.dashLen);
      y += this.dashPeriod;
    }
    ctx.stroke();
  }

  /**
   * 绘制路边装饰（树木/草丛）
   */
  _drawDecoration(d) {
    const ctx = this.ctx;
    if (d.type === 'tree') {
      // 树干
      ctx.fillStyle = '#8B5E3C';
      ctx.fillRect(d.x - 4, d.y - 5, 8, 14);
      // 树冠
      ctx.fillStyle = '#2d5a27';
      ctx.beginPath();
      ctx.arc(d.x, d.y - 12, 12, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 草丛
      ctx.fillStyle = '#5a8f4e';
      ctx.beginPath();
      ctx.arc(d.x, d.y, 9, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(d.x - 7, d.y, 6, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(d.x + 7, d.y, 6, Math.PI, Math.PI * 2);
      ctx.fill();
    }
  }
}
