/**
 * ui.js - UI管理模块
 * 负责开始界面、游戏HUD、结束界面的绘制和交互
 */

export default class UI {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;

    // 按钮区域（用于触摸判断）
    this.startBtnRect = null;
    this.restartBtnRect = null;

    // 动画计时器
    this.animTimer = 0;

    // 最高分（从本地存储读取）
    this.bestScore = this._loadBestScore();
  }

  /**
   * 从本地存储读取最高分
   */
  _loadBestScore() {
    try {
      return wx.getStorageSync('bestScore') || 0;
    } catch (e) {
      return 0;
    }
  }

  /**
   * 保存最高分到本地存储
   */
  saveBestScore(score) {
    if (score > this.bestScore) {
      this.bestScore = score;
      try {
        wx.setStorageSync('bestScore', score);
      } catch (e) {
        // 忽略存储错误
      }
    }
  }

  /**
   * 更新动画计时器
   */
  update() {
    this.animTimer += 0.03;
  }

  /**
   * 绘制开始界面
   */
  drawStartScreen() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, w, h);

    // 标题背景光晕
    const pulse = (Math.sin(this.animTimer * 1.5) + 1) / 2;
    ctx.fillStyle = `rgba(230, 57, 70, ${0.15 + pulse * 0.1})`;
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.3, w * 0.45, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 游戏标题
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 标题阴影
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = `bold ${Math.floor(w * 0.12)}px Arial`;
    ctx.fillText('RunningCar', w / 2 + 3, h * 0.28 + 3);

    // 标题主体
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(w * 0.12)}px Arial`;
    ctx.fillText('RunningCar', w / 2, h * 0.28);

    // 副标题（赛车emoji + 文字）
    ctx.font = `${Math.floor(w * 0.065)}px Arial`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText('🏎️  极速赛车  🏎️', w / 2, h * 0.38);

    // 操作说明
    ctx.font = `${Math.floor(w * 0.038)}px Arial`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText('触摸左侧/右侧切换车道', w / 2, h * 0.47);
    ctx.fillText('躲避障碍车，收集金币！', w / 2, h * 0.52);

    // 最高分
    if (this.bestScore > 0) {
      ctx.font = `${Math.floor(w * 0.042)}px Arial`;
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`🏆 最高分: ${this.bestScore}`, w / 2, h * 0.6);
    }

    // 开始按钮
    const btnW = w * 0.55;
    const btnH = h * 0.075;
    const btnX = (w - btnW) / 2;
    const btnY = h * 0.68;
    this.startBtnRect = { x: btnX, y: btnY, width: btnW, height: btnH };

    // 按钮背景（脉冲动画）
    const btnScale = 1 + pulse * 0.03;
    ctx.save();
    ctx.translate(w / 2, btnY + btnH / 2);
    ctx.scale(btnScale, btnScale);

    // 按钮阴影
    ctx.shadowColor = '#E63946';
    ctx.shadowBlur = 15;

    // 按钮渐变
    const grad = ctx.createLinearGradient(-btnW / 2, 0, btnW / 2, 0);
    grad.addColorStop(0, '#E63946');
    grad.addColorStop(1, '#FF6B6B');
    ctx.fillStyle = grad;
    _roundRect(ctx, -btnW / 2, -btnH / 2, btnW, btnH, btnH / 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(h * 0.033)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('点击开始 🚀', 0, 0);

    ctx.restore();
  }

  /**
   * 绘制游戏中HUD（得分、金币数）
   * @param {number} score - 当前分数
   * @param {number} coins - 当前金币数
   * @param {number} speed - 当前速度（用于显示速度条）
   * @param {number} maxSpeed - 最大速度
   * @param {number} baseSpeed - 基础速度
   */
  drawHUD(score, coins, speed, maxSpeed, baseSpeed) {
    const ctx = this.ctx;
    const w = this.width;

    // 左上角：得分
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    _roundRect(ctx, 8, 8, w * 0.42, 46, 8);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(w * 0.042)}px Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🏁 ${score}`, 18, 31);

    // 右上角：金币数
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    _roundRect(ctx, w - w * 0.38 - 8, 8, w * 0.38, 46, 8);
    ctx.fill();

    ctx.fillStyle = '#FFD700';
    ctx.font = `bold ${Math.floor(w * 0.042)}px Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(`🪙 × ${coins}`, w - 14, 31);

    // 速度条（底部）
    const barWidth = w * 0.4;
    const barHeight = 6;
    const barX = (w - barWidth) / 2;
    const barY = this.height - 14;
    const speedRatio = Math.min(1, (speed - baseSpeed) / (maxSpeed - baseSpeed));

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    _roundRect(ctx, barX, barY, barWidth, barHeight, 3);
    ctx.fill();

    const barColor = speedRatio < 0.5 ? '#4CAF50' : speedRatio < 0.8 ? '#FF9800' : '#F44336';
    ctx.fillStyle = barColor;
    _roundRect(ctx, barX, barY, barWidth * speedRatio, barHeight, 3);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `${Math.floor(w * 0.028)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('SPEED', w / 2, barY - 1);
  }

  /**
   * 绘制游戏结束界面
   * @param {number} score - 本次得分
   * @param {number} coins - 本次金币数
   */
  drawGameOverScreen(score, coins) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, 0, w, h);

    // 面板背景
    const panelW = w * 0.82;
    const panelH = h * 0.52;
    const panelX = (w - panelW) / 2;
    const panelY = (h - panelH) / 2;

    ctx.fillStyle = 'rgba(20, 20, 40, 0.92)';
    _roundRect(ctx, panelX, panelY, panelW, panelH, 16);
    ctx.fill();

    ctx.strokeStyle = '#E63946';
    ctx.lineWidth = 2;
    _roundRect(ctx, panelX, panelY, panelW, panelH, 16);
    ctx.stroke();

    // "Game Over" 标题
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = '#E63946';
    ctx.font = `bold ${Math.floor(w * 0.1)}px Arial`;
    ctx.fillText('Game Over', w / 2, panelY + panelH * 0.18);

    // 分隔线
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + 20, panelY + panelH * 0.32);
    ctx.lineTo(panelX + panelW - 20, panelY + panelH * 0.32);
    ctx.stroke();

    // 本次得分
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.floor(w * 0.04)}px Arial`;
    ctx.fillText('本次得分', w / 2, panelY + panelH * 0.42);
    ctx.font = `bold ${Math.floor(w * 0.09)}px Arial`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(score, w / 2, panelY + panelH * 0.55);

    // 金币数
    ctx.font = `${Math.floor(w * 0.038)}px Arial`;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`🪙 收集金币: ${coins}`, w / 2, panelY + panelH * 0.67);

    // 历史最高分
    ctx.font = `${Math.floor(w * 0.038)}px Arial`;
    ctx.fillStyle = score >= this.bestScore ? '#FFD700' : 'rgba(255,255,255,0.7)';
    ctx.fillText(`🏆 最高分: ${this.bestScore}`, w / 2, panelY + panelH * 0.78);

    if (score >= this.bestScore && score > 0) {
      ctx.fillStyle = '#FF6B6B';
      ctx.font = `bold ${Math.floor(w * 0.036)}px Arial`;
      ctx.fillText('🎉 新纪录！', w / 2, panelY + panelH * 0.89);
    }

    // 重新开始按钮
    const btnW = w * 0.55;
    const btnH = h * 0.07;
    const btnX = (w - btnW) / 2;
    const btnY = panelY + panelH + h * 0.04;
    this.restartBtnRect = { x: btnX, y: btnY, width: btnW, height: btnH };

    const pulse = (Math.sin(this.animTimer * 2) + 1) / 2;
    ctx.shadowColor = '#E63946';
    ctx.shadowBlur = 10 + pulse * 8;

    const grad = ctx.createLinearGradient(btnX, 0, btnX + btnW, 0);
    grad.addColorStop(0, '#E63946');
    grad.addColorStop(1, '#FF6B6B');
    ctx.fillStyle = grad;
    _roundRect(ctx, btnX, btnY, btnW, btnH, btnH / 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.floor(h * 0.032)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('重新开始 🔄', w / 2, btnY + btnH / 2);
  }

  /**
   * 判断触摸点是否在开始按钮内
   */
  isTouchOnStartBtn(touchX, touchY) {
    if (!this.startBtnRect) return false;
    const r = this.startBtnRect;
    return touchX >= r.x && touchX <= r.x + r.width &&
           touchY >= r.y && touchY <= r.y + r.height;
  }

  /**
   * 判断触摸点是否在重新开始按钮内
   */
  isTouchOnRestartBtn(touchX, touchY) {
    if (!this.restartBtnRect) return false;
    const r = this.restartBtnRect;
    return touchX >= r.x && touchX <= r.x + r.width &&
           touchY >= r.y && touchY <= r.y + r.height;
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
