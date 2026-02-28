/**
 * main.js - 游戏主循环
 * 负责游戏状态管理、对象更新、碰撞检测、得分计算
 */

import Road from './road.js';
import Player from './player.js';
import Obstacle from './obstacle.js';
import Coin from './coin.js';
import UI from './ui.js';

// 游戏状态常量
const STATE_START = 'start';     // 开始界面
const STATE_PLAYING = 'playing'; // 游戏中
const STATE_GAMEOVER = 'gameover'; // 游戏结束

export default class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // 游戏状态
    this.state = STATE_START;

    // 初始化各模块
    this.road = new Road(canvas, this.ctx);
    this.player = new Player(canvas, this.ctx, this.road);
    this.ui = new UI(canvas, this.ctx);

    // 障碍物和金币列表
    this.obstacles = [];
    this.coins = [];

    // 速度配置
    this.baseSpeed = 4;
    this.speed = this.baseSpeed;
    this.maxSpeed = 16;
    // 每帧速度增量：目标60fps下约60秒内从baseSpeed加速到maxSpeed
    this.speedIncrement = (this.maxSpeed - this.baseSpeed) / (60 * 60 * 2);

    // 得分
    this.score = 0;
    this.coinCount = 0;
    this.scoreTimer = 0; // 生存时间计时器（用于里程得分）

    // 障碍物生成控制
    this.obstacleSpawnTimer = 0;
    this.obstacleSpawnInterval = 90; // 帧数间隔
    this.minObstacleInterval = 35;

    // 金币生成控制
    this.coinSpawnTimer = 0;
    this.coinSpawnInterval = 70;

    // 触摸滑动检测
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;

    // 绑定触摸事件
    this._bindTouchEvents();

    // 启动游戏循环
    this._loop = this._loop.bind(this);
    canvas.requestAnimationFrame(this._loop);
  }

  /**
   * 游戏主循环
   */
  _loop() {
    this.canvas.requestAnimationFrame(this._loop);

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.ui.update();

    if (this.state === STATE_START) {
      this._updateStart();
      this._drawStart();
    } else if (this.state === STATE_PLAYING) {
      this._updateGame();
      this._drawGame();
    } else if (this.state === STATE_GAMEOVER) {
      this._drawGame();
      this._drawGameOver();
    }
  }

  /**
   * 更新开始界面（道路动画也在转动）
   */
  _updateStart() {
    this.road.update(this.baseSpeed * 0.5);
  }

  /**
   * 绘制开始界面
   */
  _drawStart() {
    this.road.draw();
    this.player.draw();
    this.ui.drawStartScreen();
  }

  /**
   * 开始游戏（重置所有状态）
   */
  startGame() {
    this.obstacles = [];
    this.coins = [];
    this.speed = this.baseSpeed;
    this.score = 0;
    this.coinCount = 0;
    this.scoreTimer = 0;
    this.obstacleSpawnTimer = 0;
    this.coinSpawnTimer = 0;
    this.obstacleSpawnInterval = 90;

    // 重置玩家到中间车道
    this.player.lane = 1;
    this.player.targetLane = 1;
    this.player.x = this.road.getLaneCenter(1);
    this.player.targetX = this.player.x;
    this.player.isChangingLane = false;

    this.state = STATE_PLAYING;
  }

  /**
   * 更新游戏逻辑
   */
  _updateGame() {
    // 更新速度（逐渐加快）
    if (this.speed < this.maxSpeed) {
      this.speed += this.speedIncrement;
    }

    // 更新道路
    this.road.update(this.speed);

    // 更新玩家
    this.player.update();

    // 生存得分（每帧 +0.1，累积取整）
    this.scoreTimer += 0.1;
    if (this.scoreTimer >= 1) {
      this.score += Math.floor(this.scoreTimer);
      this.scoreTimer = this.scoreTimer % 1;
    }

    // 生成障碍物
    this.obstacleSpawnTimer++;
    if (this.obstacleSpawnTimer >= this.obstacleSpawnInterval) {
      this.obstacleSpawnTimer = 0;
      this._spawnObstacle();
      // 随速度提高，生成间隔缩短
      this.obstacleSpawnInterval = Math.max(
        this.minObstacleInterval,
        90 - Math.floor((this.speed - this.baseSpeed) * 3)
      );
    }

    // 生成金币
    this.coinSpawnTimer++;
    if (this.coinSpawnTimer >= this.coinSpawnInterval) {
      this.coinSpawnTimer = 0;
      this._spawnCoin();
    }

    // 更新障碍物
    const playerHitBox = this.player.getHitBox();
    for (const obs of this.obstacles) {
      obs.update(this.speed);
      if (obs.checkCollision(playerHitBox)) {
        this._gameOver();
        return;
      }
    }
    this.obstacles = this.obstacles.filter(o => !o.dead);

    // 更新金币
    for (const coin of this.coins) {
      coin.update(this.speed);
      if (coin.checkCollision(playerHitBox)) {
        coin.dead = true;
        this.coinCount++;
        this.score += 10; // 每枚金币+10分
      }
    }
    this.coins = this.coins.filter(c => !c.dead);
  }

  /**
   * 随机生成障碍物（确保不堆叠，留有可通过的车道）
   */
  _spawnObstacle() {
    // 随机1~2辆障碍车
    const count = Math.random() < 0.3 ? 2 : 1;
    const lanes = [0, 1, 2];
    // 洗牌
    for (let i = lanes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
    }
    // 取前count个车道，确保至少留一条空车道
    const selectedLanes = lanes.slice(0, Math.min(count, 2));
    // 如果选了2条车道，确保第3条是空的（总有路可走）
    if (selectedLanes.length === 2) {
      // OK，留了1条空道
    }
    for (const lane of selectedLanes) {
      this.obstacles.push(new Obstacle(this.road, lane, this.speed));
    }
  }

  /**
   * 随机生成金币
   */
  _spawnCoin() {
    const lane = Math.floor(Math.random() * this.road.laneCount);
    this.coins.push(new Coin(this.road, lane));
  }

  /**
   * 游戏结束处理
   */
  _gameOver() {
    this.ui.saveBestScore(this.score);
    this.state = STATE_GAMEOVER;
  }

  /**
   * 绘制游戏画面
   */
  _drawGame() {
    this.road.draw();

    // 绘制金币
    for (const coin of this.coins) {
      coin.draw(this.ctx);
    }

    // 绘制障碍物
    for (const obs of this.obstacles) {
      obs.draw(this.ctx);
    }

    // 绘制玩家
    this.player.draw();

    // 绘制HUD
    if (this.state === STATE_PLAYING) {
      this.ui.drawHUD(this.score, this.coinCount, this.speed, this.maxSpeed, this.baseSpeed);
    }
  }

  /**
   * 绘制游戏结束界面
   */
  _drawGameOver() {
    this.ui.drawGameOverScreen(this.score, this.coinCount);
  }

  /**
   * 绑定触摸事件
   */
  _bindTouchEvents() {
    wx.onTouchStart((e) => {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = Date.now();

      if (this.state === STATE_START) {
        // 点击开始按钮或整个屏幕均可开始
        this.startGame();
      } else if (this.state === STATE_GAMEOVER) {
        if (this.ui.isTouchOnRestartBtn(touch.clientX, touch.clientY)) {
          this.startGame();
        }
      }
    });

    wx.onTouchEnd((e) => {
      if (this.state !== STATE_PLAYING) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - this.touchStartX;
      const dy = touch.clientY - this.touchStartY;
      const dt = Date.now() - this.touchStartTime;

      // 滑动手势：水平移动 > 40px 且 水平移动 > 垂直移动
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) && dt < 500) {
        if (dx > 0) {
          this.player.moveRight();
        } else {
          this.player.moveLeft();
        }
        return;
      }

      // 点击：左半屏向左，右半屏向右
      if (dt < 300 && Math.abs(dx) < 40) {
        if (touch.clientX < this.width / 2) {
          this.player.moveLeft();
        } else {
          this.player.moveRight();
        }
      }
    });
  }
}
