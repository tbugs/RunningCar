/**
 * game.js - 游戏入口文件
 * 初始化Canvas，获取屏幕尺寸，启动游戏主循环
 */

import Game from './js/main.js';

// 获取系统信息，适配不同手机屏幕
const systemInfo = wx.getSystemInfoSync();
const screenWidth = systemInfo.screenWidth;
const screenHeight = systemInfo.screenHeight;

// 创建游戏画布
const canvas = wx.createCanvas();
canvas.width = screenWidth;
canvas.height = screenHeight;

// 启动游戏
const game = new Game(canvas);
