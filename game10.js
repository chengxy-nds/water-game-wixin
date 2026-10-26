/**
 * ============================================================================
 * 微信小游戏 / 抖音小游戏 / TapTap 100% 原生高定 3D 立体水排序完整版 (game.js)
 * ============================================================================
 * 已完整迁移并内置：
 * 1. 3D 立体高折射玻璃瓶身：
 *    - 后壁圆柱体积底色 + 1.8px 双侧物理玻璃壁折射 + 瓶底厚水晶椭圆台面
 *    - 药水层间 3D 透视椭圆液面环 + 顶层重力自平衡液面与明暗弯月面
 *    - 前壁左肩弧形高光罩、右肩曲率反光窗、左右通体柔光箱高光柱
 *    - 7 段式沉底焦散厚水晶底座 + 月牙亮斑 + 10 层深蓝高折射圆润玻璃瓶口
 *    - 3D 粗麻布编织杯垫底座 + 动态环境光遮蔽 (AO) 接触阴影
 * 2. 完整动态物理与特效：
 *    - 选中弹簧阻尼升空悬浮 + 落回无跳动平滑归位
 *    - 重力液面倾倒物理 + 双层流光水柱 + 瓶口波纹飞溅水珠 + 瓶内上浮气泡 + 流体余韵尾迹
 *    - 满瓶三段式自然橡木塞压入 + 瓶口白雾气浪 + 玻璃微蹲回弹 + 礼花庆典喷发
 *    - 顶部 2+2 递进式 3D 礼盒袋（满瓶严格匹配袋子颜色，无对应袋子原地等待；匹配后抛物线飞入袋口、金色铃铛摇晃叮当、礼袋极速拎走与新袋补位）
 * 3. 全部 11 种特殊瓶子机关与专属粒子特效：
 *    - 问号盲盒药水 (mystery_reveal 翻牌金星)、广告解锁瓶、丝绸垂帘瓶、麻绳牛皮纸袋瓶 (paper_bag_burn 灼烧火星灰烬)
 *    - 底层冰封/全瓶冰封 (ice_shatter 冰晶爆裂)、石化底座 (stone_shatter 碎石飞溅)、同色锁扣护盾
 *    - 单向注入金漏斗、单向倒出古铜壶、星晷倒计时炸弹瓶、寒霜冰封步数瓶、灵猫 BOSS 巨型瓶
 * 4. 200 关大师级可解生成器 + 9 种防碰撞空间编舞排布 + 真实生活 ASMR 合成音效引擎
 * ============================================================================
 */

const __outerWinRef = (typeof window !== 'undefined' && window) ? window : null;
const __outerGlobalRef = (typeof globalThis !== 'undefined' && globalThis) ? globalThis : null;
(function initWeChatAndBrowserRuntime(_outerWin, _outerGlobal) {
  const _g = (typeof GameGlobal !== 'undefined' && GameGlobal) ? GameGlobal
    : (_outerWin || _outerGlobal || this || {});

  function safeSetProp(target, prop, value) {
    if (!target) return;
    try {
      target[prop] = value;
    } catch (e) {
      try {
        Object.defineProperty(target, prop, {
          value: value,
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch (e2) { }
    }
  }

  safeSetProp(_g, 'window', _g);
  safeSetProp(_g, 'self', _g);
  safeSetProp(_g, 'globalThis', _g);

  // 显式在当前闭包词法作用域绑定 window / self，彻底防止微信小游戏模块包装器 function(require, module, exports, window, document...) 传入 undefined 遮蔽全局变量！
  var window = _g;
  var self = _g;

  if (typeof _g.addEventListener !== 'function') {
    _g._winListeners = {};
    safeSetProp(_g, 'addEventListener', function (type, fn) {
      (_g._winListeners[type] || (_g._winListeners[type] = [])).push(fn);
    });
    safeSetProp(_g, 'removeEventListener', function (type, fn) {
      if (!_g._winListeners[type]) return;
      _g._winListeners[type] = _g._winListeners[type].filter(f => f !== fn);
    });
  }

  const isWxMiniGame = (typeof wx !== 'undefined' && wx && typeof wx.createCanvas === 'function');
  const isTtMiniGame = (typeof tt !== 'undefined' && tt && typeof tt.createCanvas === 'function');
  const nativeApi = isWxMiniGame ? wx : (isTtMiniGame ? tt : null);

  // --------------------------------------------------------------------------
  // 1. 屏幕尺寸与安全区获取（兼容新旧微信基础库 getWindowInfo / getSystemInfoSync）
  // --------------------------------------------------------------------------
  let sysInfo = { windowWidth: 412, windowHeight: 892, pixelRatio: 2, safeArea: { top: 44, bottom: 860 } };
  if (nativeApi) {
    try {
      const info = (typeof nativeApi.getWindowInfo === 'function' ? nativeApi.getWindowInfo() : null)
        || (typeof nativeApi.getSystemInfoSync === 'function' ? nativeApi.getSystemInfoSync() : null);
      if (info && info.windowWidth && info.windowHeight) {
        sysInfo = {
          windowWidth: info.windowWidth,
          windowHeight: info.windowHeight,
          pixelRatio: info.pixelRatio || 2,
          safeArea: info.safeArea || { top: Math.round(info.windowHeight * 0.048), bottom: Math.round(info.windowHeight * 0.965) }
        };
      }
    } catch (e) { }
  } else if (_outerWin && typeof _outerWin.innerWidth === 'number' && _outerWin.innerWidth > 0) {
    sysInfo = {
      windowWidth: _outerWin.innerWidth,
      windowHeight: _outerWin.innerHeight,
      pixelRatio: _outerWin.devicePixelRatio || 2,
      safeArea: { top: 14, bottom: _outerWin.innerHeight - 12 }
    };
  }

  safeSetProp(_g, 'innerWidth', sysInfo.windowWidth);
  safeSetProp(_g, 'innerHeight', sysInfo.windowHeight);
  safeSetProp(_g, 'devicePixelRatio', sysInfo.pixelRatio);
  _g.__safeTop = (sysInfo.safeArea && typeof sysInfo.safeArea.top === 'number') ? Math.max(10, sysInfo.safeArea.top) : 24;
  _g.__safeBottom = (sysInfo.safeArea && typeof sysInfo.safeArea.bottom === 'number')
    ? Math.max(8, sysInfo.windowHeight - sysInfo.safeArea.bottom) : 14;

  // 监听微信小游戏窗口尺寸变化（折叠屏 / 转屏适配）
  if (nativeApi && typeof nativeApi.onWindowResize === 'function') {
    try {
      nativeApi.onWindowResize((res) => {
        if (res && res.windowWidth && res.windowHeight) {
          safeSetProp(_g, 'innerWidth', res.windowWidth);
          safeSetProp(_g, 'innerHeight', res.windowHeight);
          _g._layoutDirty = true;
          _g._bgOffscreenDirty = true;
          const list = (_g._winListeners && _g._winListeners['resize']) || [];
          list.forEach(fn => { try { fn(); } catch (e) { } });
        }
      });
    } catch (e) { }
  }

  // --------------------------------------------------------------------------
  // 2. Canvas 2D Path2D / roundRect / ellipse 全兼容增强层（兼容真机小游戏无 Path2D 环境）
  // --------------------------------------------------------------------------
  function parseSvgArcToCanvas(ctx, x1, y1, rx, ry, phiDeg, fA, fS, x2, y2) {
    if (x1 === x2 && y1 === y2) return;
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    if (rx === 0 || ry === 0) {
      ctx.lineTo(x2, y2);
      return;
    }
    const phi = (phiDeg * Math.PI) / 180;
    const cosPhi = Math.cos(phi), sinPhi = Math.sin(phi);
    const dx2 = (x1 - x2) / 2, dy2 = (y1 - y2) / 2;
    const x1p = cosPhi * dx2 + sinPhi * dy2;
    const y1p = -sinPhi * dx2 + cosPhi * dy2;

    let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) {
      const s = Math.sqrt(lambda);
      rx *= s;
      ry *= s;
    }
    const rx2 = rx * rx, ry2 = ry * ry;
    const x1p2 = x1p * x1p, y1p2 = y1p * y1p;
    let num = Math.max(0, rx2 * ry2 - rx2 * y1p2 - ry2 * x1p2);
    let den = rx2 * y1p2 + ry2 * x1p2;
    let coef = (fA === fS ? -1 : 1) * Math.sqrt(den > 0 ? num / den : 0);
    const cxp = coef * ((rx * y1p) / ry);
    const cyp = coef * (-(ry * x1p) / rx);
    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

    const vAngle = (ux, uy, vx, vy) => {
      const dot = ux * vx + uy * vy;
      const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
      const ang = Math.acos(Math.max(-1, Math.min(1, len > 0 ? dot / len : 1)));
      return (ux * vy - uy * vx < 0) ? -ang : ang;
    };
    const theta1 = vAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    let dTheta = vAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
    if (!fS && dTheta > 0) dTheta -= Math.PI * 2;
    if (fS && dTheta < 0) dTheta += Math.PI * 2;

    const segs = Math.max(4, Math.ceil(Math.abs(dTheta) / (Math.PI / 8)));
    for (let i = 1; i <= segs; i++) {
      const t = theta1 + (dTheta * i) / segs;
      const cosT = Math.cos(t), sinT = Math.sin(t);
      const px = cosPhi * rx * cosT - sinPhi * ry * sinT + cx;
      const py = sinPhi * rx * cosT + cosPhi * ry * sinT + cy;
      ctx.lineTo(px, py);
    }
  }

  function replaySvgPathStringOnCtx(ctx, dStr) {
    if (!dStr) return;
    const tokens = dStr.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g);
    if (!tokens) return;
    let i = 0, cmd = '', cx = 0, cy = 0, sx = 0, sy = 0, prevCx2 = 0, prevCy2 = 0;
    const nextNum = () => parseFloat(tokens[i++]);
    while (i < tokens.length) {
      const tk = tokens[i];
      if (/^[a-zA-Z]$/.test(tk)) {
        cmd = tk;
        i++;
      }
      switch (cmd) {
        case 'M': {
          cx = nextNum(); cy = nextNum();
          sx = cx; sy = cy;
          ctx.moveTo(cx, cy);
          cmd = 'L';
          break;
        }
        case 'm': {
          cx += nextNum(); cy += nextNum();
          sx = cx; sy = cy;
          ctx.moveTo(cx, cy);
          cmd = 'l';
          break;
        }
        case 'L': {
          cx = nextNum(); cy = nextNum();
          ctx.lineTo(cx, cy);
          break;
        }
        case 'l': {
          cx += nextNum(); cy += nextNum();
          ctx.lineTo(cx, cy);
          break;
        }
        case 'H': {
          cx = nextNum();
          ctx.lineTo(cx, cy);
          break;
        }
        case 'h': {
          cx += nextNum();
          ctx.lineTo(cx, cy);
          break;
        }
        case 'V': {
          cy = nextNum();
          ctx.lineTo(cx, cy);
          break;
        }
        case 'v': {
          cy += nextNum();
          ctx.lineTo(cx, cy);
          break;
        }
        case 'C': {
          const x1 = nextNum(), y1 = nextNum(), x2 = nextNum(), y2 = nextNum(), x = nextNum(), y = nextNum();
          ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
          prevCx2 = x2; prevCy2 = y2; cx = x; cy = y;
          break;
        }
        case 'c': {
          const x1 = cx + nextNum(), y1 = cy + nextNum(), x2 = cx + nextNum(), y2 = cy + nextNum(), x = cx + nextNum(), y = cy + nextNum();
          ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
          prevCx2 = x2; prevCy2 = y2; cx = x; cy = y;
          break;
        }
        case 'S': {
          const x1 = 2 * cx - prevCx2, y1 = 2 * cy - prevCy2;
          const x2 = nextNum(), y2 = nextNum(), x = nextNum(), y = nextNum();
          ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
          prevCx2 = x2; prevCy2 = y2; cx = x; cy = y;
          break;
        }
        case 's': {
          const x1 = 2 * cx - prevCx2, y1 = 2 * cy - prevCy2;
          const x2 = cx + nextNum(), y2 = cy + nextNum(), x = cx + nextNum(), y = cy + nextNum();
          ctx.bezierCurveTo(x1, y1, x2, y2, x, y);
          prevCx2 = x2; prevCy2 = y2; cx = x; cy = y;
          break;
        }
        case 'Q': {
          const x1 = nextNum(), y1 = nextNum(), x = nextNum(), y = nextNum();
          ctx.quadraticCurveTo(x1, y1, x, y);
          prevCx2 = x1; prevCy2 = y1; cx = x; cy = y;
          break;
        }
        case 'q': {
          const x1 = cx + nextNum(), y1 = cy + nextNum(), x = cx + nextNum(), y = cy + nextNum();
          ctx.quadraticCurveTo(x1, y1, x, y);
          prevCx2 = x1; prevCy2 = y1; cx = x; cy = y;
          break;
        }
        case 'A':
        case 'a': {
          const isRel = (cmd === 'a');
          const rx = nextNum(), ry = nextNum(), rot = nextNum(), fA = nextNum(), fS = nextNum();
          const x = isRel ? cx + nextNum() : nextNum();
          const y = isRel ? cy + nextNum() : nextNum();
          parseSvgArcToCanvas(ctx, cx, cy, rx, ry, rot, fA, fS, x, y);
          cx = x; cy = y;
          break;
        }
        case 'Z':
        case 'z': {
          ctx.closePath();
          cx = sx; cy = sy;
          break;
        }
        default: {
          i++;
          break;
        }
      }
    }
  }

  // 强制全平台（微信开发者工具 + iOS/Android 真机）统一使用 PolyfillPath2D，
  // 彻底解决：1) 微信开发者工具中 GameGlobal 与词法作用域隔离导致 Path2D is not defined 异常；
  //           2) iOS/Android 真机原生 Canvas 2D 不支持 Path2D(svgString) 导致倒水水柱、倾斜液面、运动拖尾消失的问题！
  class PolyfillPath2D {
    constructor(d) {
      this.__isPolyfillPath2D = true;
      this.d = typeof d === 'string' ? d : (d && typeof d.d === 'string' ? d.d : '');
    }
  }
  var Path2D = PolyfillPath2D;
  safeSetProp(_g, 'Path2D', PolyfillPath2D);
  if (_outerGlobal) safeSetProp(_outerGlobal, 'Path2D', PolyfillPath2D);

  function enhanceCanvas2DContext(ctx) {
    if (!ctx || ctx.__enhanced2D) return ctx;
    ctx.__enhanced2D = true;

    // 统一使用纯 moveTo / arcTo 实现的 roundRect，兼容微信开发者工具与真机各种圆角参数（数字或数组）
    ctx.roundRect = function (x, y, w, h, radii) {
      if (w < 0) { x += w; w = -w; }
      if (h < 0) { y += h; h = -h; }
      let r = 0;
      if (typeof radii === 'number') r = radii;
      else if (Array.isArray(radii) && radii.length > 0) r = Number(radii[0]) || 0;
      r = Math.max(0, Math.min(r, w * 0.5, h * 0.5));
      this.moveTo(x + r, y);
      this.arcTo(x + w, y, x + w, y + h, r);
      this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r);
      this.arcTo(x, y, x + w, y, r);
      this.closePath();
    };

    if (typeof ctx.createPattern !== 'function') {
      ctx.createPattern = function () { return '#dec092'; };
    } else {
      const origCreatePattern = ctx.createPattern;
      ctx.createPattern = function (img, rep) {
        try {
          const pat = origCreatePattern.call(this, img, rep);
          return pat || '#dec092';
        } catch (e) {
          return '#dec092';
        }
      };
    }

    if (typeof ctx.setLineDash !== 'function') {
      ctx.setLineDash = function () { };
    }
    if (typeof ctx.ellipse !== 'function') {
      ctx.ellipse = function (x, y, rx, ry, rot, a0, a1, ccw) {
        rx = Math.max(0.01, Math.abs(rx));
        ry = Math.max(0.01, Math.abs(ry));
        this.save();
        this.translate(x, y);
        if (rot) this.rotate(rot);
        this.scale(rx, ry);
        this.arc(0, 0, 1, a0, a1, !!ccw);
        this.restore();
      };
    }

    const origFill = ctx.fill;
    const origStroke = ctx.stroke;
    const origClip = ctx.clip;

    ctx.fill = function (arg1, arg2) {
      if (arg1 && (arg1.__isPolyfillPath2D || typeof arg1.d === 'string')) {
        this.beginPath();
        replaySvgPathStringOnCtx(this, arg1.d);
        return typeof arg2 === 'string' ? origFill.call(this, arg2) : origFill.call(this);
      }
      try {
        return (typeof arg1 === 'string') ? origFill.call(this, arg1) : origFill.call(this);
      } catch (e) {
        return origFill.call(this);
      }
    };

    ctx.stroke = function (arg1) {
      if (arg1 && (arg1.__isPolyfillPath2D || typeof arg1.d === 'string')) {
        this.beginPath();
        replaySvgPathStringOnCtx(this, arg1.d);
        return origStroke.call(this);
      }
      return origStroke.call(this);
    };

    ctx.clip = function (arg1, arg2) {
      if (arg1 && (arg1.__isPolyfillPath2D || typeof arg1.d === 'string')) {
        this.beginPath();
        replaySvgPathStringOnCtx(this, arg1.d);
        return typeof arg2 === 'string' ? origClip.call(this, arg2) : origClip.call(this);
      }
      try {
        return (typeof arg1 === 'string') ? origClip.call(this, arg1) : origClip.call(this);
      } catch (e) {
        return origClip.call(this);
      }
    };

    return ctx;
  }

  function wrapCanvasInstance(c) {
    if (!c) return c;
    if (!c.style) c.style = {};
    if (!c.__wrappedCanvas) {
      c.__wrappedCanvas = true;
      if (typeof c.addEventListener !== 'function') {
        c._listeners = {};
        c.addEventListener = function (type, fn) {
          (this._listeners[type] || (this._listeners[type] = [])).push(fn);
        };
        c.dispatchEvent = function (evt) {
          const list = (this._listeners && this._listeners[evt.type]) || [];
          list.forEach(fn => fn.call(this, evt));
        };
      }
      const origGetContext = c.getContext ? c.getContext.bind(c) : null;
      if (origGetContext) {
        c.getContext = function (type) {
          // 微信小游戏真机/开发者工具 getContext('2d') 不传 { alpha: false }，确保 100% 兼容
          const ctx = origGetContext(type);
          return type === '2d' ? enhanceCanvas2DContext(ctx) : ctx;
        };
      }
    }
    return c;
  }


  // --------------------------------------------------------------------------
  // 3. 微信小游戏主画布与离屏画布工厂 (兼容 weapp-adapter 与首次 wx.createCanvas 上屏规则)
  // --------------------------------------------------------------------------
  function createOffscreenCanvas(w, h) {
    let c = null;
    if (nativeApi && typeof nativeApi.createCanvas === 'function') {
      c = wrapCanvasInstance(nativeApi.createCanvas());
    } else if (typeof _g.__createCanvas === 'function') {
      c = wrapCanvasInstance(_g.__createCanvas());
    } else if (_outerWin && _outerWin.document && typeof _outerWin.document.createElement === 'function') {
      c = wrapCanvasInstance(_outerWin.document.createElement('canvas'));
    } else {
      throw new Error('WeChat Mini Game wx.createCanvas() is required.');
    }
    if (w !== undefined) c.width = Math.max(1, Math.round(w));
    if (h !== undefined) c.height = Math.max(1, Math.round(h));
    return c;
  }

  // 若项目已加载 weapp-adapter（GameGlobal.canvas 已存在），直接复用该上屏主画布；否则首次调用 createOffscreenCanvas 获取上屏主画布
  const mainScreenCanvas = (function acquireMainScreenCanvas() {
    let existing = null;
    try {
      if (typeof canvas !== 'undefined' && canvas && typeof canvas.getContext === 'function') {
        existing = canvas;
      } else if (_g.canvas && typeof _g.canvas.getContext === 'function') {
        existing = _g.canvas;
      }
    } catch (e) { }
    const sc = existing ? wrapCanvasInstance(existing) : createOffscreenCanvas(sysInfo.windowWidth, sysInfo.windowHeight);
    sc.width = Math.max(1, Math.round(sysInfo.windowWidth));
    sc.height = Math.max(1, Math.round(sysInfo.windowHeight));
    safeSetProp(_g, 'canvas', sc);
    return sc;
  })();

  function makeRect(left, top, width, height) {
    return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top };
  }

  // 纯内存 UI 状态中心（纯内存状态驱动）
  const uiState = {
    openModalId: null, // null | 'pause-modal-mask' | 'modal-mask' | 'speed-modal-mask' | 'shop-modal-mask' | 'refresh-modal-mask' | 'level-modal-mask' | 'mechanic-modal-mask' | 'out-of-moves-modal-mask'
    toastText: '',
    toastVisible: false,
    toastTimer: null,
    modeBannerShow: false,
    modeBannerText: '',
    modeBannerProg: '',
    movesCounterShow: false,
    movesCounterDanger: false,
    movesLeftNum: '',
    winBadgeText: '过关成功',
    scoreUserMoves: '0 步',
    scoreOptMoves: '17 步',
    scoreDiffMoves: '+0',
    scorePraiseLine: '✨ 步数控制非常出色！',
    levelScrollTop: 0,
    shopScrollTop: 0,
    bottleRejectMap: {} // idx -> { text, until, shakeUntil }
  };

  // --------------------------------------------------------------------------
  // 4. 统一单调毫秒时钟、RAF、Storage、Vibrate 与 AudioContext 词法级兼容绑定
  //    彻底解决真机调试中 performance.now() 与 requestAnimationFrame(now) 时间基准不一致导致倒水动画被瞬间跳过的问题！
  // --------------------------------------------------------------------------
  const _bootTimeMs = Date.now();
  function getMonotonicMs() {
    return Date.now() - _bootTimeMs;
  }

  var performance = { now: getMonotonicMs };
  safeSetProp(_g, 'performance', performance);

  const _rawRAF = (typeof _g.requestAnimationFrame === 'function')
    ? _g.requestAnimationFrame.bind(_g)
    : ((_outerWin && typeof _outerWin.requestAnimationFrame === 'function')
      ? _outerWin.requestAnimationFrame.bind(_outerWin)
      : function (cb) { return setTimeout(cb, 16); });

  const _rawCAF = (typeof _g.cancelAnimationFrame === 'function')
    ? _g.cancelAnimationFrame.bind(_g)
    : ((_outerWin && typeof _outerWin.cancelAnimationFrame === 'function')
      ? _outerWin.cancelAnimationFrame.bind(_outerWin)
      : function (id) { clearTimeout(id); });

  var requestAnimationFrame = function (cb) {
    return _rawRAF(function () {
      if (typeof cb === 'function') cb(getMonotonicMs());
    });
  };
  var cancelAnimationFrame = function (id) {
    return _rawCAF(id);
  };
  safeSetProp(_g, 'requestAnimationFrame', requestAnimationFrame);
  safeSetProp(_g, 'cancelAnimationFrame', cancelAnimationFrame);

  if (nativeApi) {
    if (typeof _g.AudioContext === 'undefined' && typeof _g.webkitAudioContext === 'undefined' && typeof nativeApi.createWebAudioContext === 'function') {
      safeSetProp(_g, 'AudioContext', function () {
        return nativeApi.createWebAudioContext();
      });
    }
  }

  var navigator = (function () {
    const navObj = (_g.navigator && typeof _g.navigator === 'object') ? _g.navigator : {};
    if (nativeApi && typeof nativeApi.vibrateShort === 'function') {
      try {
        navObj.vibrate = function () {
          try { nativeApi.vibrateShort({ type: 'light' }); } catch (e) { }
        };
      } catch (e) { }
    }
    safeSetProp(_g, 'navigator', navObj);
    return navObj;
  })();

  var localStorage = (function () {
    if (nativeApi && typeof nativeApi.getStorageSync === 'function') {
      const wxStore = {
        getItem(k) { try { const v = nativeApi.getStorageSync(k); return v === '' || v === undefined ? null : String(v); } catch (e) { return null; } },
        setItem(k, v) { try { nativeApi.setStorageSync(k, String(v)); } catch (e) { } },
        removeItem(k) { try { nativeApi.removeStorageSync(k); } catch (e) { } }
      };
      safeSetProp(_g, 'localStorage', wxStore);
      return wxStore;
    }
    if (_outerWin && _outerWin.localStorage) return _outerWin.localStorage;
    const mem = {};
    const fallbackStore = {
      getItem(k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem(k, v) { mem[k] = String(v); },
      removeItem(k) { delete mem[k]; }
    };
    safeSetProp(_g, 'localStorage', fallbackStore);
    return fallbackStore;
  })();

  const COLORS = {
    red: { name: '红色', left: '#b30804', mid: '#c40a05', highlight: '#dc1e18', right: '#9c0603', topMid: '#e31a1a', topRim: '#fc2829', topLight: '#ff7878', bagMain: '#d4151d', bagDark: '#990910' },
    yellow: { name: '黄色', left: '#ebb008', mid: '#fcc00b', highlight: '#ffd438', right: '#d99f04', topMid: '#fbd126', topRim: '#ffdb2c', topLight: '#fffb8b', bagMain: '#f5a600', bagDark: '#c27d00' },
    blue: { name: '蓝色', left: '#1515ad', mid: '#1b1bc0', highlight: '#3238d9', right: '#101096', topMid: '#3a56ca', topRim: '#4a68d8', topLight: '#7a96ff', bagMain: '#1c31cc', bagDark: '#101d8a' },
    green: { name: '绿色', left: '#689905', mid: '#72a506', highlight: '#86ba14', right: '#588503', topMid: '#97cb1d', topRim: '#b2df4f', topLight: '#cff877', bagMain: '#5AA21A', bagDark: '#3F7710' },
    purple: { name: '紫色', left: '#5f1294', mid: '#7319b0', highlight: '#8e2dcf', right: '#4b0c78', topMid: '#9638d6', topRim: '#b055ed', topLight: '#deb3ff', bagMain: '#731fa8', bagDark: '#4d1078' },
    orange: { name: '橙色', left: '#cf4400', mid: '#e65000', highlight: '#f5681a', right: '#b03800', topMid: '#ff731c', topRim: '#ff8f3d', topLight: '#ffc285', bagMain: '#ea5504', bagDark: '#b33c00' },
    cyan: { name: '青色', left: '#0784c4', mid: '#0e9ae0', highlight: '#2bb6f7', right: '#056da6', topMid: '#2cb9fc', topRim: '#57ccff', topLight: '#a6e9ff', bagMain: '#149ee3', bagDark: '#0b72ab' },
    pink: { name: '粉色', left: '#c71864', mid: '#e02476', highlight: '#f54290', right: '#a31050', topMid: '#f74d97', topRim: '#ff70ae', topLight: '#ffb3d2', bagMain: '#e02476', bagDark: '#a31050' }
  };
  const COLOR_KEYS = ['red', 'yellow', 'blue', 'green', 'purple', 'orange', 'cyan', 'pink'];


  // 默认永久启用微缩舞台配置 (zoom: true)，支持 1倍 / 2倍 / 3倍 倒水速度切换
  const userSettings = { sound: true, vibrate: true, music: true, zoom: true };
  let speedLevel = 0;
  let speedPoints = 10;
  let speedMulStage = 1; // 1 | 2 | 3

  function getSpeedMultiplier() {
    if (speedMulStage === 3) return 2.75;
    if (speedMulStage === 2) return 1.85;
    return 1.0;
  }

  function triggerHaptic(ms = 12) {
    if (!userSettings.vibrate) return;
    try {
      if (nativeApi && typeof nativeApi.vibrateShort === 'function') {
        nativeApi.vibrateShort({ type: 'light' });
      } else if (navigator && typeof navigator.vibrate === 'function') {
        navigator.vibrate(ms);
      }
    } catch (e) { }
  }

  const AudioCtx = _g.AudioContext || _g.webkitAudioContext || (_outerWin && (_outerWin.AudioContext || _outerWin.webkitAudioContext));
  let audioCtx = null;
  let cachedPinkNoiseBuffer = null;

  function ensureAudio() {
    try {
      if (!audioCtx && AudioCtx) audioCtx = new AudioCtx();
      if (audioCtx && audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
        audioCtx.resume();
      }
    } catch (e) { }
  }

  function getPinkNoiseBuffer() {
    if (!audioCtx) return null;
    if (cachedPinkNoiseBuffer) return cachedPinkNoiseBuffer;
    const sampleRate = audioCtx.sampleRate;
    const length = sampleRate * 2.5;
    const buffer = audioCtx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
      b6 = white * 0.115926;
    }
    cachedPinkNoiseBuffer = buffer;
    return buffer;
  }

  function playRealisticPourSound(options = {}) {
    if (!userSettings.sound) return;
    try {
    ensureAudio();
    if (!audioCtx || typeof audioCtx.createOscillator !== 'function') return;
    const { maxCap = 4, isGiantCat = false, initialLayers = 0, moveCount = 1, durationMs = 500 } = options;
    const now = audioCtx.currentTime;
    const durSec = Math.max(0.22, durationMs / 1000);
    const noiseBuf = getPinkNoiseBuffer();
    if (!noiseBuf) return;

    let baseStartFreq = 295, baseMaxFreq = 680, cavityQ = 4.2, glugRateHz = 8.4, streamGainLevel = 0.19;
    if (isGiantCat) { baseStartFreq = 155; baseMaxFreq = 395; cavityQ = 5.2; glugRateHz = 5.8; streamGainLevel = 0.22; }
    else if (maxCap <= 2) { baseStartFreq = 510; baseMaxFreq = 980; cavityQ = 3.6; glugRateHz = 11.5; streamGainLevel = 0.16; }
    else if (maxCap === 6) { baseStartFreq = 220; baseMaxFreq = 540; cavityQ = 4.8; glugRateHz = 7.0; streamGainLevel = 0.21; }
    else if (maxCap >= 8) { baseStartFreq = 175; baseMaxFreq = 450; cavityQ = 5.5; glugRateHz = 6.0; streamGainLevel = 0.22; }

    const fillStartFrac = Math.min(0.94, initialLayers / maxCap);
    const fillEndFrac = Math.min(0.98, (initialLayers + moveCount) / maxCap);
    const freqStart = baseStartFreq + (baseMaxFreq - baseStartFreq) * Math.pow(fillStartFrac, 1.2);
    const freqEnd = baseStartFreq + (baseMaxFreq - baseStartFreq) * Math.pow(fillEndFrac, 1.2);

    const noiseSrc = audioCtx.createBufferSource();
    noiseSrc.buffer = noiseBuf; noiseSrc.loop = true;

    const cavityFilter = audioCtx.createBiquadFilter();
    cavityFilter.type = 'bandpass';
    if (cavityFilter.Q && cavityFilter.Q.setValueAtTime) cavityFilter.Q.setValueAtTime(cavityQ, now); else if (cavityFilter.Q) cavityFilter.Q.value = cavityQ;
    cavityFilter.frequency.setValueAtTime(freqStart, now);
    cavityFilter.frequency.exponentialRampToValueAtTime(Math.max(freqStart + 18, freqEnd), now + durSec);

    const warmthLowpass = audioCtx.createBiquadFilter();
    warmthLowpass.type = 'lowpass';
    warmthLowpass.frequency.setValueAtTime(maxCap <= 2 ? 1250 : 920, now);

    const mainGain = audioCtx.createGain();
    mainGain.gain.setValueAtTime(0.0005, now);
    mainGain.gain.linearRampToValueAtTime(streamGainLevel, now + 0.045);
    mainGain.gain.setValueAtTime(streamGainLevel, now + Math.max(0.06, durSec - 0.06));
    mainGain.gain.exponentialRampToValueAtTime(0.0005, now + durSec);

    // 微信小游戏真机 WebAudioContext 的 AudioNode.connect 不支持直接连接 AudioParam (mainGain.gain)，加 try-catch 保护防止中断倒水动画！
    let lfo = null;
    try {
      lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(glugRateHz, now);
      lfoGain.gain.setValueAtTime(streamGainLevel * 0.15, now);
      lfo.connect(lfoGain);
      if (mainGain && mainGain.gain) {
        lfoGain.connect(mainGain.gain);
        lfo.start(now);
        lfo.stop(now + durSec + 0.02);
      }
    } catch (e) { }

    noiseSrc.connect(cavityFilter); cavityFilter.connect(warmthLowpass); warmthLowpass.connect(mainGain); mainGain.connect(audioCtx.destination);
    noiseSrc.start(now);
    noiseSrc.stop(now + durSec + 0.02);

    const dropletCount = Math.floor(6 + moveCount * 2.5);
    for (let i = 0; i < dropletCount; i++) {
      const progress = (i + 0.2 + Math.random() * 0.6) / dropletCount;
      const tDrop = now + 0.02 + progress * (durSec - 0.04);
      const dropDur = maxCap <= 2 ? 0.032 : 0.042;
      const curWaterPitch = freqStart + (freqEnd - freqStart) * progress;
      const bubbleStartF = curWaterPitch * (0.98 + Math.random() * 0.24);
      const dropOsc = audioCtx.createOscillator();
      const dropGain = audioCtx.createGain();
      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(bubbleStartF, tDrop);
      dropOsc.frequency.exponentialRampToValueAtTime(bubbleStartF * 1.3, tDrop + dropDur);
      const peakG = (isGiantCat ? 0.048 : 0.038) * (0.75 + Math.random() * 0.35);
      dropGain.gain.setValueAtTime(0.0004, tDrop);
      dropGain.gain.linearRampToValueAtTime(peakG, tDrop + 0.007);
      dropGain.gain.exponentialRampToValueAtTime(0.0004, tDrop + dropDur);
      dropOsc.connect(dropGain); dropGain.connect(audioCtx.destination);
      dropOsc.start(tDrop); dropOsc.stop(tDrop + dropDur + 0.005);
    }
    } catch (e) { }
  }

  // 真实生活级物理拟音辅助函数：产生温润木质/玻璃/软木塞/亚麻布原声质感，绝不刺耳吵闹
  function playWarmAcousticNote(freqStart, freqEnd, startTime, duration, peakGain = 0.065, waveType = 'sine', cutoffHz = 1100) {
    if (!audioCtx || typeof audioCtx.createOscillator !== 'function') return;
    try {
    const osc = audioCtx.createOscillator();
    const lp = audioCtx.createBiquadFilter();
    const g = audioCtx.createGain();
    osc.type = waveType;
    osc.frequency.setValueAtTime(Math.max(24, freqStart), startTime);
    if (freqEnd && Math.abs(freqEnd - freqStart) > 1) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(24, freqEnd), startTime + duration);
    }
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(cutoffHz, startTime);
    g.gain.setValueAtTime(0.0004, startTime);
    g.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(0.008, duration * 0.22));
    g.gain.exponentialRampToValueAtTime(0.0004, startTime + duration);
    osc.connect(lp); lp.connect(g); g.connect(audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.008);
    } catch (e) { }
  }

  function playNoiseBrush(startTime, duration, freqStart, freqEnd, qVal = 3.0, peakGain = 0.05) {
    if (!audioCtx || typeof audioCtx.createOscillator !== 'function') return;
    try {
    const noiseBuf = getPinkNoiseBuffer();
    if (!noiseBuf) return;
    const src = audioCtx.createBufferSource();
    src.buffer = noiseBuf;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    if (bp.Q && typeof bp.Q.setValueAtTime === 'function') bp.Q.setValueAtTime(qVal, startTime); else if (bp.Q) bp.Q.value = qVal;
    bp.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd && Math.abs(freqEnd - freqStart) > 5) {
      bp.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
    }
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0004, startTime);
    g.gain.linearRampToValueAtTime(peakGain, startTime + Math.min(0.012, duration * 0.28));
    g.gain.exponentialRampToValueAtTime(0.0004, startTime + duration);
    src.connect(bp); bp.connect(g); g.connect(audioCtx.destination);
    src.start(startTime);
    src.stop(startTime + duration + 0.01);
    } catch (e) { }
  }

  function playSound(type, extraOpts) {
    triggerHaptic(type === 'cork_slam' || type === 'service_bell' ? 16 : 8);
    if (!userSettings.sound) return;
    ensureAudio();
    if (!audioCtx || typeof audioCtx.createOscillator !== 'function') return;
    const now = audioCtx.currentTime;

    if (type === 'pour') {
      playRealisticPourSound(extraOpts);
    } else if (type === 'select') {
      // 拿起水瓶：指尖轻触磨砂琉璃瓶的温润微音 + 离开麻布垫的极轻摩擦声
      playNoiseBrush(now, 0.032, 620, 880, 3.5, 0.025);
      playWarmAcousticNote(395, 555, now, 0.062, 0.058, 'sine', 950);
    } else if (type === 'deselect' || type === 'bottle_land') {
      // 放下水瓶 / 倒完水瓶底落回粗麻布软垫：真实生活里厚玻璃瓶底轻落亚麻软垫的温润闷响
      playNoiseBrush(now, 0.042, 420, 220, 2.4, 0.036);
      playWarmAcousticNote(175, 76, now, 0.068, 0.085, 'sine', 420);
    } else if (type === 'ui_tap') {
      // 通用按钮点击：如同指腹轻叩温润胡桃木鹅卵石
      playNoiseBrush(now, 0.018, 950, 680, 4.0, 0.022);
      playWarmAcousticNote(480, 360, now, 0.045, 0.055, 'sine', 880);
    } else if (type === 'toggle_on') {
      // 打开拨动开关：真实实木机械拨片清脆上拨声 ("Tick-Up")
      playNoiseBrush(now, 0.016, 1200, 1550, 4.5, 0.028);
      playWarmAcousticNote(360, 540, now, 0.048, 0.062, 'sine', 1100);
      playWarmAcousticNote(540, 680, now + 0.022, 0.045, 0.042, 'sine', 1200);
    } else if (type === 'toggle_off') {
      // 关闭拨动开关：真实实木机械拨片沉稳下拨声 ("Tock-Down")
      playNoiseBrush(now, 0.016, 1100, 760, 4.5, 0.026);
      playWarmAcousticNote(510, 330, now, 0.052, 0.058, 'sine', 920);
    } else if (type === 'modal_open') {
      // 打开弹窗面板：轻柔舒缓的木琴双音微升
      playWarmAcousticNote(392, 405, now, 0.075, 0.048, 'sine', 900);
      playWarmAcousticNote(523.25, 535, now + 0.045, 0.095, 0.052, 'sine', 1050);
    } else if (type === 'modal_close') {
      // 关闭弹窗面板：柔和收敛的木质双音微降
      playWarmAcousticNote(493.88, 470, now, 0.065, 0.045, 'sine', 850);
      playWarmAcousticNote(369.99, 345, now + 0.04, 0.08, 0.048, 'sine', 750);
    } else if (type === 'btn_restart') {
      // 点击【重玩】：温润木珠双连回拨声
      playWarmAcousticNote(440, 350, now, 0.055, 0.052, 'sine', 880);
      playWarmAcousticNote(523.25, 540, now + 0.055, 0.085, 0.056, 'sine', 980);
    } else if (type === 'btn_shuffle') {
      // 点击【打乱】：柔和清泉微漾与温润木琴三连音
      playNoiseBrush(now, 0.18, 420, 780, 2.2, 0.042);
      [440, 523.25, 659.25].forEach((f, i) => {
        playWarmAcousticNote(f, f * 1.02, now + i * 0.048, 0.11, 0.050, 'sine', 1100);
      });
    } else if (type === 'btn_undo') {
      // 点击【撤回】：轻巧舒适的时光回拨木琴双音
      playWarmAcousticNote(587.33, 560, now, 0.065, 0.052, 'sine', 950);
      playWarmAcousticNote(440, 415, now + 0.048, 0.085, 0.050, 'sine', 820);
    } else if (type === 'btn_hint') {
      // 点击【提示】：温润通透的颂钵轻叩泛音（不刺耳、余韵柔和）
      playWarmAcousticNote(587.33, 587.33, now, 0.24, 0.052, 'sine', 1100);
      playWarmAcousticNote(880.0, 880.0, now + 0.035, 0.28, 0.038, 'sine', 1200);
    } else if (type === 'reject_lock') {
      // 受阻提示：柔和的实木双连轻叩声（“笃-笃”），彻底告别刺耳锯齿波
      playNoiseBrush(now, 0.022, 520, 340, 3.8, 0.028);
      playWarmAcousticNote(195, 128, now, 0.058, 0.068, 'sine', 480);
      playNoiseBrush(now + 0.072, 0.022, 480, 310, 3.8, 0.024);
      playWarmAcousticNote(172, 112, now + 0.072, 0.062, 0.058, 'sine', 450);
    } else if (type === 'mystery_reveal') {
      // 星雾揭晓：温暖柔和的竖琴/卡林巴拇指琴泛音
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        playWarmAcousticNote(f, f * 1.005, now + i * 0.048, 0.20, 0.052, 'sine', 1250);
      });
    } else if (type === 'ice_break') {
      // 凝霜消融：清润不刺耳的冰块轻裂声
      playNoiseBrush(now, 0.09, 1100, 680, 2.8, 0.045);
      [880, 1174.66, 987.77].forEach((f, i) => {
        playWarmAcousticNote(f, f * 0.72, now + i * 0.032, 0.11, 0.055, 'triangle', 1350);
      });
    } else if (type === 'stone_break') {
      // 金箍解锁：浑厚温润的古铜木栓开启声
      playNoiseBrush(now, 0.07, 380, 190, 3.0, 0.048);
      [196, 146.83, 110].forEach((f, i) => {
        playWarmAcousticNote(f, f * 0.65, now + i * 0.038, 0.12, 0.075, 'sine', 480);
      });
    } else if (type === 'cork_slam') {
      // 真实生活中天然软木塞缓缓塞入玻璃瓶口并严丝合缝落座的 ASMR 级物理声效：
      // 1) 软木与玻璃瓶口内壁的细腻阻尼摩擦声 ("Squeak-Rub", 0 ~ 68ms)
      playNoiseBrush(now, 0.068, 410, 235, 3.8, 0.058);
      // 2) 软木塞底部空气微压缩与温润橡木落座闷响 ("Muted Oak Thud", 28 ~ 115ms)
      playWarmAcousticNote(162, 58, now + 0.026, 0.088, 0.135, 'sine', 360);
      playWarmAcousticNote(245, 142, now + 0.030, 0.065, 0.068, 'triangle', 520);
      // 3) 瓶腔气密瞬间的极轻柔水润腔体回响 ("Sealed Glass Cavity Bloop", 52 ~ 135ms)
      playWarmAcousticNote(285, 428, now + 0.052, 0.078, 0.052, 'sine', 780);
      // 4) 轻柔舒适的满瓶木琴温暖和弦余韵（音量克制、温润悦耳）
      playWarmAcousticNote(523.25, 525, now + 0.095, 0.22, 0.045, 'sine', 1050);
      playWarmAcousticNote(659.25, 662, now + 0.135, 0.26, 0.048, 'sine', 1150);
    } else if (type === 'service_bell') {
      // 装入礼盒时的温润铜铃轻响（降低高频增益并加柔化包络，清甜不刺耳）
      playWarmAcousticNote(260, 92, now, 0.032, 0.08, 'sine', 480);
      [{ freq: 1046.5, gain: 0.065, decay: 0.42 }, { freq: 1567.98, gain: 0.042, decay: 0.34 }, { freq: 2093.0, gain: 0.024, decay: 0.25 }].forEach(h => {
        playWarmAcousticNote(h.freq, h.freq, now + 0.005, h.decay, h.gain, 'sine', 2200);
      });
    } else if (type === 'bag_whoosh') {
      // 礼袋轻巧提起：柔和亚麻布料轻拂声
      playNoiseBrush(now, 0.16, 320, 620, 1.8, 0.042);
      playWarmAcousticNote(240, 420, now, 0.16, 0.045, 'sine', 680);
    } else if (type === 'bag_drop') {
      // 新礼袋轻落：纸袋落定温润微响
      playNoiseBrush(now, 0.045, 460, 260, 2.5, 0.032);
      playWarmAcousticNote(320, 210, now, 0.085, 0.052, 'sine', 580);
    } else if (type === 'bag_burn') {
      // 羊皮礼袋消散：温暖柔和的篝火微拂声（去除刺耳锯齿波）
      playNoiseBrush(now, 0.45, 380, 820, 1.8, 0.065);
      [392, 493.88, 587.33].forEach((f, i) => {
        playWarmAcousticNote(f, f * 1.02, now + 0.05 + i * 0.08, 0.18, 0.045, 'sine', 950);
      });
    } else if (type === 'pack') {
      // 过关/解锁奖励：温暖舒缓的木琴琶音（C大调温润和弦）
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        playWarmAcousticNote(freq, freq * 1.003, now + idx * 0.055, 0.24, 0.058, 'sine', 1200);
      });
    }
  }

  const BOTTLE_INNER_POLY = (() => {
    const pts = [{ x: 37.2, y: 9.0 }, { x: 62.8, y: 9.0 }, { x: 62.8, y: 26.0 }];
    for (let i = 1; i <= 10; i++) {
      const t = i / 10, mt = 1 - t;
      pts.push({
        x: mt * mt * mt * 62.8 + 3 * mt * mt * t * 75.5 + 3 * mt * t * t * 81.3 + t * t * t * 81.3,
        y: mt * mt * mt * 26.0 + 3 * mt * mt * t * 30.2 + 3 * mt * t * t * 39.2 + t * t * t * 55.0
      });
    }
    for (let i = 1; i <= 10; i++) pts.push({ x: 81.3, y: 55.0 + (193 - 55.0) * (i / 10) });
    for (let i = 1; i < 12; i++) {
      const ang = (i / 12) * Math.PI;
      pts.push({ x: 50 + 31.3 * Math.cos(ang), y: 193 + 9.2 * Math.sin(ang) });
    }
    for (let i = 0; i <= 10; i++) pts.push({ x: 18.7, y: 193 - (193 - 55.0) * (i / 10) });
    for (let i = 1; i <= 10; i++) {
      const t = i / 10, mt = 1 - t;
      pts.push({
        x: mt * mt * mt * 18.7 + 3 * mt * mt * t * 18.7 + 3 * mt * t * t * 24.5 + t * t * t * 37.2,
        y: mt * mt * mt * 55.0 + 3 * mt * mt * t * 39.2 + 3 * mt * t * t * 30.2 + t * t * t * 26.0
      });
    }
    return pts;
  })();

  function getTransformedContour(rad) {
    const cosA = Math.cos(rad), sinA = Math.sin(rad);
    return BOTTLE_INNER_POLY.map(p => {
      const dx = p.x - 50, dy = p.y - 115;
      return { X: 50 + dx * cosA - dy * sinA, Y: 115 + dx * sinA + dy * cosA };
    });
  }

  function getChordAtGravityY(tPts, targetY) {
    let minX = Infinity, maxX = -Infinity;
    const n = tPts.length;
    for (let i = 0; i < n; i++) {
      const p1 = tPts[i], p2 = tPts[(i + 1) % n];
      if ((p1.Y <= targetY && p2.Y >= targetY) || (p2.Y <= targetY && p1.Y >= targetY)) {
        const dy = p2.Y - p1.Y;
        if (Math.abs(dy) < 1e-5) {
          if (p1.X < minX) minX = p1.X;
          if (p1.X > maxX) maxX = p1.X;
        } else {
          const x = p1.X + ((targetY - p1.Y) / dy) * (p2.X - p1.X);
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        }
      }
    }
    if (minX > maxX) return { leftX: 18.7, rightX: 81.3, cx: 50, rx: 31.3 };
    return { leftX: minX, rightX: maxX, cx: 0.5 * (minX + maxX), rx: Math.max(8, 0.5 * (maxX - minX)) };
  }

  function getPhysicalSpillAngleDeg(volumeLayers, maxCap = 4) {
    const v = Math.max(0.0, Math.min(4.0, (volumeLayers / maxCap) * 4.0));
    return v >= 1.0 ? (96.0 - (v - 1.0) * 11.0) : (96.0 + (1.0 - v) * 7.0);
  }

  // ==========================================
  // 4. 200 关深层交错难度生成算法与新玩法图鉴
  // ==========================================
  function mulberry32(seed) {
    let state = seed >>> 0;
    return function () {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = Math.imul(state ^ (state >>> 15), 1 | state);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296.0;
    };
  }

  function buildVerifiedColorTubes(palette, cap, rng) {
    const n = palette.length;
    if (n <= 1) return [Array(cap).fill(palette[0])];
    const pool = [];
    palette.forEach(c => { for (let k = 0; k < cap; k++) pool.push(c); });
    let bestCandidate = null, bestScore = -1;
    for (let attempt = 0; attempt < 90; attempt++) {
      const arr = pool.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
      }
      const tubes = [];
      let valid = true, totalTransitions = 0;
      let distinctBottoms = new Set(), distinctTops = new Set();
      for (let i = 0; i < n; i++) {
        const t = arr.slice(i * cap, (i + 1) * cap);
        if (t.every(c => c === t[0])) { valid = false; break; }
        let trans = 0, maxRun = 1, curRun = 1;
        for (let k = 1; k < cap; k++) {
          if (t[k] !== t[k - 1]) { trans++; curRun = 1; }
          else { curRun++; if (curRun > maxRun) maxRun = curRun; }
        }
        const allowedRun = cap >= 8 ? 2 : 1;
        if (maxRun > allowedRun && attempt < 65) { valid = false; break; }
        if (cap >= 4 && t[cap - 1] === t[cap - 2] && attempt < 75) { valid = false; break; }
        distinctBottoms.add(t[0]); distinctTops.add(t[cap - 1]);
        totalTransitions += trans;
        tubes.push(t);
      }
      if (!valid) continue;
      const score = totalTransitions * 10 + distinctBottoms.size * 6 + distinctTops.size * 8;
      if (score > bestScore) { bestScore = score; bestCandidate = tubes; }
      if (totalTransitions >= n * (cap - 1) * 0.94 && distinctTops.size >= Math.min(n, 4)) return tubes;
    }
    if (bestCandidate) return bestCandidate;
    return palette.map((_, i) => Array.from({ length: cap }, (__, k) => palette[(i + k * 2 + 1) % n]));
  }

  // 辅助函数：在自由瓶之间建立互不相同的顶层明牌颜色对，并将这两种首发颜色的其余水层优先排布在自由瓶的中上层，
  // 确保即使存在购物袋严格匹配、冰座或石座，玩家也能顺畅先集满首发购物袋颜色并解锁后续机关！
  function ensureOpeningPairs(tubes, minPairs = 2, customFreeIndices = null) {
    if (!tubes || tubes.length < 3) return tubes;
    const cap = tubes[0].length;
    const freeIndices = customFreeIndices ? customFreeIndices.slice() : [];
    if (freeIndices.length === 0) {
      for (let i = 0; i < tubes.length; i += 2) freeIndices.push(i);
      for (let i = 1; i < tubes.length; i += 2) freeIndices.push(i);
    }

    const usedPairColors = new Set();
    const pairsToMake = Math.min(minPairs, Math.floor(freeIndices.length / 2));
    for (let step = 0; step < pairsToMake; step++) {
      const targetBottleIdx = freeIndices[step * 2];
      const partnerBottleIdx = freeIndices[step * 2 + 1];
      if (partnerBottleIdx === undefined || partnerBottleIdx >= tubes.length) break;

      let desiredColor = tubes[targetBottleIdx][cap - 1];
      // 确保第2对与第1对的颜色不同，保证初始2个购物袋颜色互不相同
      if (usedPairColors.has(desiredColor)) {
        for (let m = 0; m < tubes.length; m++) {
          for (let k = 0; k < cap; k++) {
            const cand = tubes[m][k];
            if (!usedPairColors.has(cand)) {
              const tmp = tubes[targetBottleIdx][cap - 1];
              tubes[targetBottleIdx][cap - 1] = cand;
              tubes[m][k] = tmp;
              desiredColor = cand;
              break;
            }
          }
          if (!usedPairColors.has(desiredColor)) break;
        }
      }
      usedPairColors.add(desiredColor);

      if (tubes[partnerBottleIdx][cap - 1] !== desiredColor) {
        let swapped = false;
        for (let m = 0; m < tubes.length && !swapped; m++) {
          if (m === targetBottleIdx) continue;
          for (let k = 0; k < cap - 1; k++) {
            if (tubes[m][k] === desiredColor && tubes[m][k] !== tubes[partnerBottleIdx][cap - 1]) {
              const tmp = tubes[partnerBottleIdx][cap - 1];
              tubes[partnerBottleIdx][cap - 1] = desiredColor;
              tubes[m][k] = tmp;
              swapped = true;
              break;
            }
          }
        }
      }
    }

    // 将第一顺位首发色 (pairColor0) 的其余水层从深底层提升至自由瓶的次顶层 (cap-2)，防止首发袋颜色被死锁在冰座最底层
    if (cap === 4 && freeIndices.length >= 4) {
      const pairColor0 = tubes[freeIndices[0]][cap - 1];
      const freeSet = new Set(freeIndices.slice(0, Math.min(4, freeIndices.length)));
      for (let m = 0; m < tubes.length; m++) {
        for (let k = 0; k < cap - 1; k++) {
          if (tubes[m][k] === pairColor0 && (!freeSet.has(m) || k === 0)) {
            for (const fIdx of freeIndices.slice(0, 4)) {
              if (tubes[fIdx][cap - 2] !== pairColor0 && tubes[fIdx][cap - 1] !== pairColor0) {
                const tmp = tubes[fIdx][cap - 2];
                tubes[fIdx][cap - 2] = pairColor0;
                tubes[m][k] = tmp;
                break;
              }
            }
          }
        }
      }
    }
    return tubes;
  }

  const MECHANIC_INTROS = {
    basic_rule: {
      key: 'basic_rule', name: '基础炼金与礼袋规则', title: '基础规则图鉴',
      limitTag: '核心规则：同色相连或空瓶方可倒入；满瓶需对应颜色礼袋就位才可打包',
      solveTag: '过关条件：将所有药水按同色装满封存（礼袋关装满所有礼袋即可通关）',
      desc: '将<b>相同颜色</b>的药水倒入同一瓶中，装满即自动落塞封存；若有礼袋，满瓶会自动飞入对应颜色礼袋。',
      sampleBottle: () => ({ id: 99, maxCap: 4, layers: ['blue', 'yellow', 'red', 'red'], special: 'none' })
    },
    mystery: {
      key: 'mystery', name: '问号盲盒药水', title: '盲盒药水',
      limitTag: '操作限制：金色问号层颜色未知，不可透视',
      solveTag: '解除方式：将上方已知颜色药水倒出，下方问号层即刻揭晓真容',
      desc: '倒出顶层药水，即可揭晓下方 <b>?</b> 隐藏的颜色。',
      sampleBottle: () => ({ id: 99, maxCap: 4, layers: ['blue', 'red', 'green'], special: 'none', mysteryCount: 2 })
    },
    giant_cat: {
      key: 'giant_cat', name: '8层灵猫魔王瓶', title: '灵猫魔王瓶',
      limitTag: '操作限制：不可拿起倒出，仅接收头顶指定颜色药水',
      solveTag: '解除方式：集满 8 层目标色药水即可直接完成本关',
      desc: '将对应颜色的药水全部倒入中央 <b>8层灵猫瓶</b> 即可通关。',
      sampleBottle: () => ({ id: 99, maxCap: 8, isGiantCat: true, catTargetColor: 'pink', layers: ['pink', 'pink', 'pink', 'pink'], special: 'none' })
    },
    ice_base: {
      key: 'ice_base', name: '冰晶凝霜底座', title: '冰座封印瓶',
      limitTag: '操作限制：瓶底凝结寒霜，不可拿起向外倒水（但可向内接水）',
      solveTag: '解除方式：在任意瓶完成 N 次同色药水合并或装满，即可震碎冰座',
      desc: '进行 <b>同色药水合并</b> 或装满整瓶，即可震碎瓶底凝霜。',
      sampleBottle: () => ({ id: 99, maxCap: 4, layers: ['yellow', 'blue'], special: 'ice_base', poursToBreak: 2 })
    },
    silk_drape: {
      key: 'silk_drape', name: '丝绒与盲盒封印', title: '丝绒盲盒瓶',
      limitTag: '操作限制：全瓶被丝绒或牛皮纸袋笼罩，不可倒出或倒入',
      solveTag: '解除方式：装满并打包指定数量水瓶（★满N瓶），封印自动燃尽揭开',
      desc: '打包任意满瓶药水，即可解开 <b>丝绒磨砂与纸袋封印瓶</b>。',
      sampleBottle: () => ({ id: 99, maxCap: 4, layers: ['red', 'orange', 'yellow', 'blue'], special: 'silk_drape', unlockOrder: 1 })
    },
    varied_height: {
      key: 'varied_height', name: '高矮异形容量瓶', title: '异形容量瓶',
      limitTag: '操作限制：2层矮瓶、4层中瓶、6层高瓶容量不同（注意看瓶颈层数标）',
      solveTag: '解除方式：任意容量水瓶只需装满自身对应层数同色药水，即可落塞封存',
      desc: '包含 <b>2层、4层、6层</b> 三种高度水瓶，集齐同色即自动封存。',
      sampleBottle: () => ({ id: 99, maxCap: 2, layers: ['green', 'green'], special: 'none' })
    },
    tall_8: {
      key: 'tall_8', name: '8层超长皇冠瓶', title: '8层皇冠瓶',
      limitTag: '操作限制：超大容量，需集齐整整 8 层同色药水才会落塞封存',
      solveTag: '解除方式：善用瓶侧 8 层刻度线规划中转，集满 8 层同色即封存',
      desc: '超长皇冠瓶需集满整整 <b>8层同色药水</b> 方可完成封存。',
      sampleBottle: () => ({ id: 99, maxCap: 8, layers: ['red', 'orange', 'yellow', 'green', 'cyan', 'blue'], special: 'none' })
    },
    grand_obstacles: {
      key: 'grand_obstacles', name: '极寒冰封与黑曜石箍', title: '多重机关瓶',
      limitTag: '操作限制：极寒冰封瓶全瓶不可操作；黑曜石箍瓶不可拿起倒出',
      solveTag: '解除方式：打包满瓶破除极寒冰封（★满N瓶）；同色合并震碎黑曜石箍（🔒合N解）',
      desc: '装满并打包指定数量水瓶，即可破除 <b>极寒冰封与黑曜石箍</b>。',
      sampleBottle: () => ({ id: 99, maxCap: 4, layers: ['cyan', 'yellow', 'purple', 'red'], special: 'full_ice', unlockOrder: 2 })
    },
    color_lock: {
      key: 'color_lock', name: '专属色环契约瓶', title: '专属色锁瓶',
      limitTag: '操作限制：仅允许倒入瓶身盾牌指定的颜色（拿起其他水瓶时会实时显示✓/✕提示）',
      solveTag: '解除方式：可先将其内部杂色倒出腾空，再倒入盾牌指定的专属色封存',
      desc: '带有专属色标的水瓶，<b>只能倒入对应颜色的药水</b>。',
      sampleBottle: () => ({ id: 99, maxCap: 4, layers: ['blue', 'blue'], special: 'color_lock', requiredColor: 'blue' })
    },
    one_way_in: {
      key: 'one_way_in', name: '单向接水金漏斗', title: '单向接水瓶',
      limitTag: '操作限制：瓶口装有单向漏斗（⏬只进不出），不可拿起向外倒水',
      solveTag: '解除方式：切勿倒入杂色！看准其内部底色，只将同色药水倒入装满封存',
      desc: '瓶口装有单向漏斗，<b>只能往里倒水，不能向外倒出</b>。',
      sampleBottle: () => ({ id: 99, maxCap: 4, layers: ['green', 'green'], special: 'one_way_in' })
    },
    one_way_out: {
      key: 'one_way_out', name: '单向出水古铜瓶', title: '单向出水瓶',
      limitTag: '操作限制：瓶口为单向壶嘴（⏫只出不进），未排空前不可向内接水',
      solveTag: '解除方式：将该瓶内的药水全部倒出排空后，即刻蜕变为普通空瓶！',
      desc: '单向古瓶<b>只能向外倒水</b>，排空后自动变为普通空瓶。',
      sampleBottle: () => ({ id: 99, maxCap: 4, layers: ['orange', 'purple', 'cyan'], special: 'one_way_out' })
    },
    hourglass_bomb: {
      key: 'hourglass_bomb', name: '星砂流沙怀表瓶', title: '倒计时流沙瓶',
      limitTag: '操作限制：每次倒水怀表 -1 步，归零未解除将触发瓶口寒霜冰封 3 步',
      solveTag: '解除方式：在倒计时归零前将该瓶彻底倒空或同色装满，即可拆除怀表',
      desc: '在怀表倒计时归零前<b>将该瓶倒空或装满</b>，否则瓶口将冰封。',
      sampleBottle: () => ({ id: 99, maxCap: 4, layers: ['red', 'yellow', 'pink'], special: 'none', countdownMoves: 6 })
    }
  };
  const HANDBOOK_KEYS = [
    'basic_rule', 'mystery', 'ice_base', 'silk_drape', 'varied_height',
    'color_lock', 'one_way_in', 'one_way_out', 'hourglass_bomb',
    'grand_obstacles', 'tall_8', 'giant_cat'
  ];
  window._handbookIdx = 0;

  let currentLevelAttemptSeed = Math.floor(Math.random() * 1000000000);

  const _levelConfigCache = new Map();
  function getLevelConfig(lv, attemptSeed = null) {
    const levelNum = Math.max(1, Math.min(200, Math.floor(lv || 1)));
    const seedVal = attemptSeed !== null ? attemptSeed : (currentLevelAttemptSeed || 1013904223);
    const cacheKey = `${levelNum}_${seedVal}`;
    if (_levelConfigCache.has(cacheKey)) return _levelConfigCache.get(cacheKey);
    const res = _computeLevelConfigInternal(levelNum, seedVal);
    if (_levelConfigCache.size > 32) _levelConfigCache.clear();
    _levelConfigCache.set(cacheKey, res);
    return res;
  }
  function _computeLevelConfigInternal(levelNum, seedVal) {
    const rng = mulberry32((levelNum * 2654435761 + seedVal) >>> 0);
    const chapter = Math.floor((levelNum - 1) / 10) + 1;
    const pos = ((levelNum - 1) % 10) + 1;

    // 严格遵循白皮书 4.2 的 10 关波浪星级模板（Pos 6 为 3 星爽快缓冲谷）
    const waveStarsMap = { 1: 3, 2: 4, 3: 4, 4: 5, 5: 5, 6: 3, 7: 4, 8: 5, 9: 5, 10: 5 };
    const waveStars = levelNum <= 2 ? 3 : waveStarsMap[pos];

    let cfg = {
      levelNum, chapter, pos, waveStars,
      title: '', shortTag: '',
      hasBags: false, isVariedHeight: false, isCatBossLevel: false,
      gridClass: '', moveLimit: null, optimalMoves: 17, introMechanicKey: null,
      bags: [], bottles: null
    };

    // 前 3 关：纯享策略期（防死锁规范 4：确保开局至少 2 对明牌可合并顶层）
    if (levelNum === 1) {
      cfg.title = '第 1 关 · 新手试炼'; cfg.shortTag = '7色精粹'; cfg.hasBags = false; cfg.optimalMoves = 17;
      const pal = COLOR_KEYS.slice().sort(() => rng() - 0.5).slice(0, 7);
      const filled = ensureOpeningPairs(buildVerifiedColorTubes(pal, 4, rng), 2);
      cfg.bottles = () => [
        ...filled.map((layers, idx) => ({ id: idx, maxCap: 4, layers: layers.slice(), special: 'none' })),
        { id: 7, maxCap: 4, layers: [], special: 'none' },
        { id: 8, maxCap: 4, layers: [], special: 'none' },
        { id: 9, maxCap: 4, layers: [], special: 'ad_cam' },
        { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
        { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
      ];
      return cfg;
    }

    if (levelNum === 2 || levelNum === 3) {
      cfg.title = levelNum === 2 ? '第 2 关 · 礼盒打包' : '第 3 关 · 水色交错';
      cfg.shortTag = levelNum === 2 ? '8色礼盒' : '深层交错';
      cfg.hasBags = true; cfg.optimalMoves = levelNum === 2 ? 19 : 21;
      const pal = COLOR_KEYS.slice().sort(() => rng() - 0.5).slice(0, 8);
      const filled = ensureOpeningPairs(buildVerifiedColorTubes(pal, 4, rng), 2);
      const bagCol0 = filled[0][3];
      const bagCol1 = filled.map(t => t[3]).find(c => c !== bagCol0) || pal.find(c => c !== bagCol0);
      cfg.bags = [
        { slot: 0, color: bagCol0, locked: false, packedBottle: null },
        { slot: 1, color: bagCol1, locked: false, packedBottle: null },
        { slot: 2, color: null, locked: true, packedBottle: null },
        { slot: 3, color: null, locked: true, packedBottle: null }
      ];
      cfg.bottles = () => [
        ...filled.map((layers, idx) => ({ id: idx, maxCap: 4, layers: layers.slice(), special: 'none' })),
        { id: 8, maxCap: 4, layers: [], special: 'none' },
        { id: 9, maxCap: 4, layers: [], special: 'none' },
        { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
        { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
      ];
      return cfg;
    }

    // 新机制首次登场排期表（严格对应白皮书 4.1 时间轴）
    if (levelNum === 4) cfg.introMechanicKey = 'mystery';
    else if (levelNum === 5) cfg.introMechanicKey = 'giant_cat';
    else if (levelNum === 6) cfg.introMechanicKey = 'ice_base';
    else if (levelNum === 7) cfg.introMechanicKey = 'silk_drape';
    else if (levelNum === 8) cfg.introMechanicKey = 'varied_height';
    else if (levelNum === 9) cfg.introMechanicKey = 'tall_8';
    else if (levelNum === 10) cfg.introMechanicKey = 'grand_obstacles';
    else if (levelNum === 12) cfg.introMechanicKey = 'color_lock';
    else if (levelNum === 16) cfg.introMechanicKey = 'one_way_in';
    else if (levelNum === 22) cfg.introMechanicKey = 'one_way_out';
    else if (levelNum === 26) cfg.introMechanicKey = 'hourglass_bomb';

    // ==================== Pos 5：章中 BOSS · 皇家灵猫瓶 ====================
    if (pos === 5) {
      const shuffledAll = COLOR_KEYS.slice().sort(() => rng() - 0.5);
      const catColorKey = shuffledAll[0];
      const otherColors = shuffledAll.slice(1, 5);
      cfg.title = `第 ${levelNum} 关 · 皇家灵猫瓶`; cfg.shortTag = '🐱灵猫典藏';
      cfg.hasBags = false; cfg.isCatBossLevel = true; cfg.gridClass = 'layout-cat-boss';
      cfg.optimalMoves = 18 + Math.min(8, Math.floor(chapter / 2));
      const subTubes = ensureOpeningPairs(buildVerifiedColorTubes(otherColors, 4, rng), 2);
      const f0 = [catColorKey, subTubes[0][0], subTubes[0][1], catColorKey];
      const f1 = [catColorKey, subTubes[1][0], subTubes[1][1], subTubes[1][2]];
      const f2 = [catColorKey, subTubes[2][0], subTubes[2][1], subTubes[2][2]];
      const f3 = [catColorKey, subTubes[3][0], subTubes[3][1], subTubes[0][2]];
      const f4 = [catColorKey, subTubes[3][2], subTubes[3][3], subTubes[1][3]];
      const f5 = [subTubes[2][3], subTubes[0][3]];
      const useMyst = chapter >= 2 ? 2 : 1;
      const useIce = chapter >= 2;
      const useOutAncient = chapter >= 3;

      cfg.bottles = () => [
        { id: 0, maxCap: 4, layers: f0.slice(), special: 'none', mysteryCount: useMyst },
        { id: 1, maxCap: 4, layers: f1.slice(), special: useIce ? 'ice_base' : 'none', poursToBreak: useIce ? 1 : 0 },
        { id: 2, maxCap: 8, isGiantCat: true, catTargetColor: catColorKey, layers: [catColorKey, catColorKey], special: 'none' },
        { id: 3, maxCap: 4, layers: f2.slice(), special: 'none', mysteryCount: useMyst },
        { id: 4, maxCap: 4, layers: f3.slice(), special: 'none', countdownMoves: chapter >= 4 ? 9 : null },
        { id: 5, maxCap: 4, layers: f4.slice(), special: chapter >= 2 ? 'stone_base' : 'none', poursToBreak: 2 },
        { id: 6, maxCap: 4, layers: f5.slice(), special: useOutAncient ? 'one_way_out' : 'none' },
        { id: 7, maxCap: 4, layers: [], special: 'none' },
        { id: 8, maxCap: 4, layers: [], special: 'none' }
      ];
      return cfg;
    }

    // ==================== Pos 3 & Pos 8：高低异形声学瓶（2/4/6层混排 + 色环/漏斗/流沙） ====================
    if (pos === 8 || (pos === 3 && chapter >= 2)) {
      cfg.title = `第 ${levelNum} 关 · ${pos === 8 ? '高低声学瓶' : '异形色环局'}`;
      cfg.shortTag = pos === 8 ? (levelNum >= 28 ? '异形+流沙' : '高低声学') : '异形+色环';
      cfg.hasBags = false; cfg.isVariedHeight = true; cfg.gridClass = 'layout-varied';
      cfg.optimalMoves = 20 + Math.min(8, Math.floor(chapter / 2));

      const shuffledAll = COLOR_KEYS.slice().sort(() => rng() - 0.5);
      const c2A = shuffledAll[0], c2B = shuffledAll[1];
      const c4A = shuffledAll[2], c4B = shuffledAll[3], c4C = shuffledAll[4];
      const c6A = shuffledAll[5], c6B = shuffledAll[6];
      const tubes4 = ensureOpeningPairs(buildVerifiedColorTubes([c4A, c4B, c4C], 4, rng), 1, [0, 2, 1]);
      const tubes6 = buildVerifiedColorTubes([c6A, c6B], 6, rng);
      const lockCol4 = tubes4[0][3] || c4A;
      const useColorLockHere = (pos === 3 && chapter >= 2);
      const useFunnelAndBombHere = (pos === 8 && levelNum >= 28);

      // 铁律：绝不在装满杂色的瓶(B7)上挂 color_lock！将 color_lock 挂在空瓶 B9 上，并在异形色环局开放 B11 为免费空瓶，确保100%可解！
      cfg.bottles = () => [
        { id: 0, maxCap: 2, layers: [c2A, c2B], special: 'none' },
        { id: 1, maxCap: 6, layers: tubes6[0].slice(0, 5), special: 'ice_base', poursToBreak: 1 },
        { id: 2, maxCap: 4, layers: tubes4[0].slice(), special: 'none', mysteryCount: useFunnelAndBombHere ? 0 : 1, countdownMoves: useFunnelAndBombHere ? 9 : null },
        { id: 3, maxCap: 6, layers: tubes6[1].slice(0, 5), special: 'none', mysteryCount: 2 },
        { id: 4, maxCap: 2, layers: [c2B, c2A], special: 'none' },
        { id: 5, maxCap: 4, layers: tubes4[1].slice(), special: 'stone_base', poursToBreak: 2 },
        { id: 6, maxCap: 2, layers: [], special: 'none' },
        { id: 7, maxCap: 4, layers: tubes4[2].slice(), special: 'none', mysteryCount: 1 },
        { id: 8, maxCap: 6, layers: [tubes6[0][5], tubes6[1][5]], special: 'none' },
        { id: 9, maxCap: 4, layers: [], special: useColorLockHere ? 'color_lock' : 'none', requiredColor: useColorLockHere ? lockCol4 : null },
        { id: 10, maxCap: 6, layers: [], special: 'none' },
        { id: 11, maxCap: 4, layers: [], special: useColorLockHere ? 'none' : 'ad_cam' }
      ];
      return cfg;
    }

    // ==================== Pos 9：第二波峰 · 八色皇冠长管瓶（7只8层管） ====================
    if (pos === 9) {
      cfg.title = `第 ${levelNum} 关 · 皇冠长管瓶`;
      cfg.shortTag = chapter >= 3 ? '8层+流沙' : '8层皇冠管';
      cfg.hasBags = false; cfg.gridClass = 'layout-tall8';
      cfg.optimalMoves = 24 + Math.min(10, Math.floor(chapter / 2));
      const shuffledAll = COLOR_KEYS.slice().sort(() => rng() - 0.5);
      const tallColors = shuffledAll.slice(0, 5);
      const tallTubes = ensureOpeningPairs(buildVerifiedColorTubes(tallColors, 8, rng), 1, [0, 2, 4]);
      // 确保第3支自由管 B4 顶层与 B0 次顶层同色，使得首轮合并后立刻衔接第2次合并，100%顺畅破除冰座与石座！
      const secondColor = tallTubes[0][6];
      if (tallTubes[4][7] !== secondColor) {
        for (let m of [0, 2, 4, 1, 3]) {
          let done = false;
          for (let k = 0; k < 6; k++) {
            if (tallTubes[m][k] === secondColor) {
              const tmp = tallTubes[4][7];
              tallTubes[4][7] = secondColor;
              tallTubes[m][k] = tmp;
              done = true;
              break;
            }
          }
          if (done) break;
        }
      }

      cfg.bottles = () => [
        { id: 0, maxCap: 8, layers: tallTubes[0].slice(), special: 'none', mysteryCount: 2 },
        { id: 1, maxCap: 8, layers: tallTubes[1].slice(), special: 'ice_base', poursToBreak: 1 },
        { id: 2, maxCap: 8, layers: tallTubes[2].slice(), special: 'none', mysteryCount: 1, countdownMoves: chapter >= 3 ? 14 : null },
        { id: 3, maxCap: 8, layers: tallTubes[3].slice(), special: 'stone_base', poursToBreak: 2 },
        { id: 4, maxCap: 8, layers: tallTubes[4].slice(), special: 'none', mysteryCount: 1 },
        { id: 5, maxCap: 8, layers: [], special: 'none' },
        { id: 6, maxCap: 8, layers: [], special: 'none' }
      ];
      return cfg;
    }

    // ==================== Pos 10：关底大魔王 · 21瓶王座局（第2章起融合色环/漏斗/古瓶/流沙） ====================
    if (pos === 10) {
      cfg.title = `第 ${levelNum} 关 · 冰封王座局`; cfg.shortTag = '👑宗师试炼';
      cfg.hasBags = true; cfg.gridClass = 'layout-21';
      cfg.optimalMoves = 30 + Math.min(12, chapter);
      const shuffledAll = COLOR_KEYS.slice().sort(() => rng() - 0.5);
      const openPalette = shuffledAll.slice(0, 5);
      const lockedPalette = shuffledAll.slice(5, 8);
      const openTubes = ensureOpeningPairs(buildVerifiedColorTubes(openPalette, 4, rng), 2);
      const lockedTubes = buildVerifiedColorTubes(lockedPalette, 4, rng);
      cfg.bags = [
        { slot: 0, color: openPalette[0], locked: false, packedBottle: null },
        { slot: 1, color: openPalette[1], locked: false, packedBottle: null },
        { slot: 2, color: null, locked: true, packedBottle: null },
        { slot: 3, color: null, locked: true, packedBottle: null }
      ];
      const useAdv = chapter >= 2;
      const useAdv3 = chapter >= 3;
      const cRed = openPalette[4];
      const cBlue = openPalette[3];
      const cCyan = lockedPalette[0];
      const cPurple = lockedPalette[1];
      const cPink = lockedPalette[2];

      cfg.bottles = () => [
        { id: 0, maxCap: 4, layers: openTubes[0].slice(0, 3), special: 'none' },
        { id: 1, maxCap: 4, layers: openTubes[1].slice(), special: 'none', mysteryCount: 2, countdownMoves: useAdv3 ? 8 : null },
        { id: 2, maxCap: 4, layers: openTubes[2].slice(), special: 'none' },
        { id: 3, maxCap: 4, layers: lockedTubes[0].slice(), special: 'silk_drape', unlockOrder: 1 },
        { id: 4, maxCap: 4, layers: openTubes[3].slice(), special: 'none', mysteryCount: 2 },
        { id: 5, maxCap: 4, layers: openTubes[4].slice(), special: 'ice_base', poursToBreak: 2 },
        { id: 6, maxCap: 4, layers: [openTubes[0][3]], special: useAdv3 ? 'one_way_out' : 'none' },
        { id: 7, maxCap: 4, layers: [], special: 'ad_cam' },
        { id: 8, maxCap: 4, layers: [cCyan, cPurple], special: 'none' },
        { id: 9, maxCap: 4, layers: [cPurple, cCyan, cPink, cCyan], special: 'none', mysteryCount: 2 },
        { id: 10, maxCap: 4, layers: lockedTubes[1].slice(), special: 'full_ice', unlockOrder: 2 },
        { id: 11, maxCap: 4, layers: [cPink, cPurple, cCyan], special: 'none' },
        { id: 12, maxCap: 4, layers: [cPink, cPink, cPurple], special: 'none' },
        { id: 13, maxCap: 4, layers: [], special: useAdv ? 'color_lock' : 'ad_cam', requiredColor: useAdv ? cRed : null },
        { id: 14, maxCap: 4, layers: [], special: 'none' },
        { id: 15, maxCap: 4, layers: [cRed, cBlue, cRed, cBlue], special: 'none', mysteryCount: 2 },
        { id: 16, maxCap: 4, layers: [cBlue, cRed, cBlue, cRed], special: 'stone_base', poursToBreak: 3 },
        { id: 17, maxCap: 4, layers: lockedTubes[2].slice(), special: 'paper_bag', unlockOrder: 3 },
        { id: 18, maxCap: 4, layers: [], special: 'none' },
        { id: 19, maxCap: 4, layers: [], special: 'none' },
        { id: 20, maxCap: 4, layers: [], special: 'none' }
      ];
      return cfg;
    }

    // ==================== 常规与特色波浪关卡（Pos 1, 2, 4, 6, 7 及第 4, 6, 7, 12, 16, 22, 26 关） ====================
    cfg.hasBags = (pos === 2 || pos === 6 || pos === 7 || levelNum === 4);
    const shuffledAll = COLOR_KEYS.slice().sort(() => rng() - 0.5);
    const groupAColors = shuffledAll.slice(0, 6);
    const groupBColors = shuffledAll.slice(6, 8);
    const tubesA = ensureOpeningPairs(buildVerifiedColorTubes(groupAColors, 4, rng), 2);
    const tubesB = buildVerifiedColorTubes(groupBColors, 4, rng);
    const topExposedColor = tubesA[0][3] || groupAColors[0];

    cfg.optimalMoves = 20 + pos + Math.min(8, Math.floor(chapter / 2));

    if (levelNum === 4) {
      cfg.title = '第 4 关 · 星雾盲盒局'; cfg.shortTag = '❓星雾登场'; cfg.hasBags = false;
    } else if (levelNum === 6) {
      cfg.title = '第 6 关 · 极地霜晶座'; cfg.shortTag = '❄️霜晶登场'; cfg.hasBags = true;
    } else if (levelNum === 7) {
      cfg.title = '第 7 关 · 星缎礼袍局'; cfg.shortTag = '🧣星缎登场'; cfg.hasBags = true;
    } else if (levelNum === 12) {
      cfg.title = '第 12 关 · 宝石色环契约'; cfg.shortTag = '🔒色环登场'; cfg.hasBags = true;
    } else if (levelNum === 16) {
      cfg.title = '第 16 关 · 单向琉璃漏斗'; cfg.shortTag = '⏬漏斗登场'; cfg.hasBags = true;
    } else if (levelNum === 22) {
      cfg.title = '第 22 关 · 远古源泉古瓶'; cfg.shortTag = '⏫古瓶登场'; cfg.hasBags = true;
    } else if (levelNum === 26) {
      cfg.title = '第 26 关 · 星砂流沙怀表'; cfg.shortTag = '⏳流沙登场'; cfg.hasBags = true;
    } else if (pos === 4) {
      cfg.moveLimit = cfg.optimalMoves + 18;
      cfg.title = `第 ${levelNum} 关 · ${levelNum >= 24 ? '星晷流沙双限' : '星晷限步局'}`;
      cfg.shortTag = levelNum >= 24 ? `⏳限${cfg.moveLimit}步+流沙` : `✨限${cfg.moveLimit}步`;
    } else if (pos === 2) {
      cfg.title = `第 ${levelNum} 关 · 色环契约局`; cfg.shortTag = '🔒色环+星缎';
    } else if (pos === 6) {
      cfg.title = `第 ${levelNum} 关 · 漏斗缓冲谷`; cfg.shortTag = '⏬单向漏斗';
    } else if (pos === 7) {
      cfg.title = `第 ${levelNum} 关 · 古瓶冰雕阵`; cfg.shortTag = levelNum >= 17 ? '⏫古瓶+冰雕' : '🧊极光冰雕';
    } else {
      cfg.title = `第 ${levelNum} 关 · 水色交错`; cfg.shortTag = chapter >= 3 ? '⏫古瓶+星雾' : '深层星雾';
    }

    if (cfg.hasBags) {
      // 防死锁规范 1：初始 2 个购物袋颜色必须互不相同，且 100% 选自当前未被封印的 groupAColors 首发色！
      const bagCol0 = tubesA[0][3] || groupAColors[0];
      let bagCol1 = (pos === 6 && levelNum >= 16 && tubesA[5][0] !== bagCol0)
        ? tubesA[5][0]
        : (tubesA[4][3] !== bagCol0 ? tubesA[4][3] : (groupAColors.find(c => c !== bagCol0) || groupAColors[1]));
      cfg.bags = [
        { slot: 0, color: bagCol0, locked: false, packedBottle: null },
        { slot: 1, color: bagCol1, locked: false, packedBottle: null },
        { slot: 2, color: null, locked: true, packedBottle: null },
        { slot: 3, color: null, locked: true, packedBottle: null }
      ];
    }

    cfg.bottles = () => {
      // 第 4 关：星雾盲盒首次登场
      if (levelNum === 4) {
        return [
          { id: 0, maxCap: 4, layers: tubesA[0].slice(), special: 'none', mysteryCount: 2 },
          { id: 1, maxCap: 4, layers: tubesA[1].slice(), special: 'none', mysteryCount: 2 },
          { id: 2, maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: 2 },
          { id: 3, maxCap: 4, layers: tubesA[3].slice(), special: 'none', mysteryCount: 2 },
          { id: 4, maxCap: 4, layers: tubesA[4].slice(), special: 'none', mysteryCount: 2 },
          { id: 5, maxCap: 4, layers: tubesA[5].slice(), special: 'none', mysteryCount: 1 },
          { id: 6, maxCap: 4, layers: tubesB[0].slice(), special: 'none', mysteryCount: 1 },
          { id: 7, maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
          { id: 8, maxCap: 4, layers: [], special: 'none' },
          { id: 9, maxCap: 4, layers: [], special: 'none' },
          { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
          { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
        ];
      }

      // 第 6 关：极地霜晶底座首次登场
      if (levelNum === 6) {
        return [
          { id: 0, maxCap: 4, layers: tubesA[0].slice(), special: 'none', mysteryCount: 1 },
          { id: 1, maxCap: 4, layers: tubesA[1].slice(), special: 'ice_base', poursToBreak: 1 },
          { id: 2, maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: 1 },
          { id: 3, maxCap: 4, layers: tubesA[3].slice(), special: 'ice_base', poursToBreak: 2 },
          { id: 4, maxCap: 4, layers: tubesA[4].slice(), special: 'none', mysteryCount: 1 },
          { id: 5, maxCap: 4, layers: tubesA[5].slice(), special: 'ice_base', poursToBreak: 2 },
          { id: 6, maxCap: 4, layers: tubesB[0].slice(), special: 'none' },
          { id: 7, maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
          { id: 8, maxCap: 4, layers: [], special: 'none' },
          { id: 9, maxCap: 4, layers: [], special: 'none' },
          { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
          { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
        ];
      }

      // 第 7 关：星缎礼袍首次登场
      if (levelNum === 7) {
        return [
          { id: 0, maxCap: 4, layers: tubesA[0].slice(), special: 'none', mysteryCount: 1 },
          { id: 1, maxCap: 4, layers: tubesA[1].slice(), special: 'ice_base', poursToBreak: 1 },
          { id: 2, maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: 1 },
          { id: 3, maxCap: 4, layers: tubesA[3].slice(), special: 'none', mysteryCount: 1 },
          { id: 4, maxCap: 4, layers: tubesA[4].slice(), special: 'ice_base', poursToBreak: 2 },
          { id: 5, maxCap: 4, layers: tubesA[5].slice(), special: 'none' },
          { id: 6, maxCap: 4, layers: tubesB[0].slice(), special: 'silk_drape', unlockOrder: 1 },
          { id: 7, maxCap: 4, layers: tubesB[1].slice(), special: 'silk_drape', unlockOrder: 2 },
          { id: 8, maxCap: 4, layers: [], special: 'none' },
          { id: 9, maxCap: 4, layers: [], special: 'none' },
          { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
          { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
        ];
      }

      // 第 12 关 & 所有后续 Pos 2（除第22关外）：🔒 专属色环契约局（防死锁规范 10：1只色环空瓶 + 2只通用免费空瓶）
      if (pos === 2 && levelNum !== 22) {
        return [
          { id: 0, maxCap: 4, layers: tubesA[0].slice(), special: 'none', mysteryCount: 1 },
          { id: 1, maxCap: 4, layers: tubesA[1].slice(), special: 'ice_base', poursToBreak: 1 },
          { id: 2, maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: 1 },
          { id: 3, maxCap: 4, layers: tubesA[3].slice(), special: 'none', mysteryCount: 1 },
          { id: 4, maxCap: 4, layers: tubesA[4].slice(), special: 'none' },
          { id: 5, maxCap: 4, layers: tubesA[5].slice(), special: 'none' },
          { id: 6, maxCap: 4, layers: tubesB[0].slice(), special: 'silk_drape', unlockOrder: 1 },
          { id: 7, maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
          { id: 8, maxCap: 4, layers: [], special: 'color_lock', requiredColor: topExposedColor },
          { id: 9, maxCap: 4, layers: [], special: 'none' },
          { id: 10, maxCap: 4, layers: [], special: 'none' },
          { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
        ];
      }

      // 第 16 关 & 所有后续 Pos 6：⏬ 单向接水漏斗缓冲谷（第26关同步解锁 ⏳ 星砂流沙炸弹瓶！）
      if (pos === 6 && levelNum >= 16) {
        const hasBombHere = (levelNum >= 26);
        return [
          { id: 0, maxCap: 4, layers: tubesA[0].slice(), special: 'none', countdownMoves: hasBombHere ? 8 : null },
          { id: 1, maxCap: 4, layers: tubesA[1].slice(), special: 'none', mysteryCount: 1 },
          { id: 2, maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: (levelNum >= 36) ? 0 : 1, countdownMoves: (levelNum >= 36) ? 10 : null },
          { id: 3, maxCap: 4, layers: tubesA[3].slice(), special: 'none', mysteryCount: 1 },
          { id: 4, maxCap: 4, layers: tubesA[4].slice(), special: 'none' },
          { id: 5, maxCap: 4, layers: tubesA[5].slice(1), special: 'none' },
          { id: 6, maxCap: 4, layers: tubesB[0].slice(), special: 'paper_bag', unlockOrder: 1 },
          { id: 7, maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
          { id: 8, maxCap: 4, layers: [tubesA[5][0]], special: 'one_way_in' },
          { id: 9, maxCap: 4, layers: [], special: 'none' },
          { id: 10, maxCap: 4, layers: [], special: 'none' },
          { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
        ];
      }

      // 第 22 关 & Pos 7（levelNum >= 17）：⏫ 单向出水古瓶局（消除鸽巢原理死锁：仅 B0 为单向古瓶，B1 破冰仅需1次合并，确保6种颜色拥有充足可接水瓶位！）
      if (levelNum === 22 || (pos === 7 && levelNum >= 17)) {
        return [
          { id: 0, maxCap: 4, layers: tubesA[0].slice(), special: 'one_way_out' },
          { id: 1, maxCap: 4, layers: tubesA[1].slice(), special: 'ice_base', poursToBreak: 1 },
          { id: 2, maxCap: 4, layers: tubesA[2].slice(), special: 'none' },
          { id: 3, maxCap: 4, layers: tubesA[3].slice(), special: 'none', mysteryCount: 1 },
          { id: 4, maxCap: 4, layers: tubesA[4].slice(), special: 'none', mysteryCount: 1 },
          { id: 5, maxCap: 4, layers: tubesA[5].slice(), special: 'none' },
          { id: 6, maxCap: 4, layers: tubesB[0].slice(), special: 'full_ice', unlockOrder: 1 },
          { id: 7, maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
          { id: 8, maxCap: 4, layers: [], special: 'none' },
          { id: 9, maxCap: 4, layers: [], special: 'none' },
          { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
          { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
        ];
      }

      // Pos 4（第一波峰 · 双重倒计时）& Pos 1（起势局）
      const useBombInPos4 = (pos === 4 && levelNum >= 24);
      const useAncientInPos1 = (pos === 1 && chapter >= 3);
      return [
        { id: 0, maxCap: 4, layers: tubesA[0].slice(), special: useAncientInPos1 ? 'one_way_out' : 'none', mysteryCount: (useAncientInPos1 || useBombInPos4) ? 0 : 2, countdownMoves: useBombInPos4 ? 8 : null },
        { id: 1, maxCap: 4, layers: tubesA[1].slice(), special: 'none', mysteryCount: 1 },
        { id: 2, maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: (useBombInPos4 && chapter >= 4) ? 0 : 1, countdownMoves: (useBombInPos4 && chapter >= 4) ? 10 : null },
        { id: 3, maxCap: 4, layers: tubesA[3].slice(), special: pos === 4 ? 'stone_base' : 'ice_base', poursToBreak: 1 },
        { id: 4, maxCap: 4, layers: tubesA[4].slice(), special: 'none', mysteryCount: 1 },
        { id: 5, maxCap: 4, layers: tubesA[5].slice(), special: pos === 4 ? 'stone_base' : 'none', poursToBreak: 2, mysteryCount: 1 },
        { id: 6, maxCap: 4, layers: tubesB[0].slice(), special: 'none', mysteryCount: 1 },
        { id: 7, maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
        { id: 8, maxCap: 4, layers: [], special: 'none' },
        { id: 9, maxCap: 4, layers: [], special: 'none' },
        { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
        { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
      ];
    };

    return cfg;
  }
  let currentLevelId = 1;
  let currentChapterTab = 0;
  let remainingMoves = null;
  let bottles = [];
  let bags = [];
  let packedTotal = 0;
  let levelTargetTotalBottles = 7;
  let pourCountTotal = 0;
  let selectedIndex = null;
  let activeHintPair = null;
  let selectSloshRaf = null;
  let selectSloshStart = 0;
  let isAnimating = false;
  let moveHistory = [];
  let shuffleUses = 3;
  let undoUses = 5;
  let hintUses = 3;
  let addBottleUses = 2;
  let streakWins = 1;
  let isLevelEntering = false;
  let entranceSloshRaf = null;
  const shownMechanicIntros = new Set();

  const SHOP_THEMES = [
    { id: 'zen_amber', name: '晨曦流金', unlocked: true, unlockType: 'free', topCol: '#e49f42', botCol: '#7c8554' },
    { id: 'starlight', name: '深邃星夜', unlocked: true, unlockType: 'free', topCol: '#191d52', botCol: '#090b24' },
    { id: 'volcanic', name: '火山灰', unlocked: true, unlockType: 'free', topCol: '#b8bac8', botCol: '#8d90a3' },
    { id: 'taro', name: '香芋紫', unlocked: false, unlockType: 'lv10', topCol: '#dcd0f0', botCol: '#c2b0e2' },
    { id: 'orange', name: '活力橙', unlocked: false, unlockType: 'video', topCol: '#ffd8ad', botCol: '#f7b874' },
    { id: 'beach', name: '夏日沙滩', unlocked: false, unlockType: 'video', isBeach: true }
  ];
  let activeThemeId = 'zen_amber';

  let gameSessionId = 0;
  const pendingLogicalResolvers = [];

  function registerPendingLogicalResolver(fn) {
    if (typeof fn === 'function') pendingLogicalResolvers.push(fn);
  }

  function flushAllInFlightLogicalStates() {
    while (pendingLogicalResolvers.length > 0) {
      const fn = pendingLogicalResolvers.shift();
      try { fn(); } catch (e) { }
    }
  }

  function resetActiveCanvasAnimations() {
    gameSessionId++;
    pendingLogicalResolvers.length = 0;
    window._activeCanvasPours = {};
    window._canvasPourState = null;
    window._activeCanvasFlyBags = {};
    window._canvasFlyBagState = null;
    window._canvasBagAnimMap = {};
    window._bottleVfxBursts = [];
    if (Array.isArray(bottles)) {
      bottles.forEach(b => {
        if (!b) return;
        b._pouringSrc = false;
        b._pouringDst = false;
        b._corking = false;
        b._flyingToBag = false;
        b._waitingPourFinish = false;
        if (b.corked) b.corkAnimProgress = 1;
      });
    }
    if (Array.isArray(bags)) {
      bags.forEach(bg => {
        if (bg) bg._busy = false;
      });
    }
  }

  function cloneState(flushLive = false) {
    if (flushLive) {
      flushAllInFlightLogicalStates();
    }
    const raw = JSON.parse(JSON.stringify({ bottles, bags, packedTotal, pourCountTotal, remainingMoves, shuffleUses, undoUses, hintUses, addBottleUses }));
    // 若存在正在飞向购物袋的满瓶，在撤回快照中将其标记为已完成装袋，同时不打断屏幕上的实时飞行与塞木塞动画
    if (!flushLive && Array.isArray(raw.bottles)) {
      raw.bottles.forEach((b) => {
        if (b && b._flyingToBag) {
          b.layers = [];
          b.corked = false;
          b.removed = true;
        }
      });
    }
    if (Array.isArray(raw.bottles)) {
      raw.bottles.forEach(b => {
        if (!b) return;
        delete b._pouringSrc;
        delete b._pouringDst;
        delete b._corking;
        delete b._flyingToBag;
        delete b._waitingPourFinish;
        b.corkAnimProgress = b.corked ? 1 : 0;
      });
    }
    if (Array.isArray(raw.bags)) {
      raw.bags.forEach(bg => {
        if (!bg) return;
        delete bg._busy;
      });
    }
    return raw;
  }



  function showToast(msg) {
    const raw = String(msg || '');
    const cleanText = raw.replace(/^[\s\u2600-\u27BF\uD83C-\uDBFF\uDC00-\uDFFF\uFE00-\uFE0F]+/g, '').trim() || raw.trim();
    uiState.toastText = cleanText;
    uiState.toastVisible = true;
    if (uiState.toastTimer) clearTimeout(uiState.toastTimer);
    uiState.toastTimer = setTimeout(() => {
      uiState.toastVisible = false;
    }, 2300);
  }

  function startSelectSloshAnimation(bottleIdx) {
    if (selectSloshRaf) {
      cancelAnimationFrame(selectSloshRaf);
      selectSloshRaf = null;
    }
    selectSloshStart = performance.now();
    function tickSlosh(now) {
      if (selectedIndex !== bottleIdx || isAnimating) {
        if (window._canvasSloshMap) delete window._canvasSloshMap[bottleIdx];
        selectSloshRaf = null;
        return;
      }
      const b = bottles[bottleIdx];
      if (!b || b.removed || b.corked || !b.layers || b.layers.length === 0) {
        if (window._canvasSloshMap) delete window._canvasSloshMap[bottleIdx];
        selectSloshRaf = null;
        return;
      }
      const dt = (now - selectSloshStart) / 1000;
      const amp = Math.exp(-2.65 * dt) * 1.05;
      const phase = dt * 13.5;
      window._canvasSloshMap = window._canvasSloshMap || {};
      if (amp <= 0.015) {
        delete window._canvasSloshMap[bottleIdx];
        selectSloshRaf = null;
        return;
      }
      window._canvasSloshMap[bottleIdx] = { sloshPhase: phase, sloshAmplitude: amp };
      selectSloshRaf = requestAnimationFrame(tickSlosh);
    }
    selectSloshRaf = requestAnimationFrame(tickSlosh);
  }

  let settleSloshRafMap = {};
  function stopSelectSloshAnimation() {
    if (selectSloshRaf) {
      cancelAnimationFrame(selectSloshRaf);
      selectSloshRaf = null;
    }
    window._canvasSloshMap = {};
  }

  function startSettleSloshAnimation(bottleIdx, initialAmp = 0.58) {
    if (settleSloshRafMap[bottleIdx]) {
      cancelAnimationFrame(settleSloshRafMap[bottleIdx]);
      delete settleSloshRafMap[bottleIdx];
    }
    const startT = performance.now();
    function tickSettle(now) {
      if (selectedIndex === bottleIdx) {
        delete settleSloshRafMap[bottleIdx];
        return;
      }
      const b = bottles[bottleIdx];
      if (!b || b.removed || b.corked || !b.layers || b.layers.length === 0) {
        if (window._canvasSloshMap) delete window._canvasSloshMap[bottleIdx];
        delete settleSloshRafMap[bottleIdx];
        return;
      }
      const dt = (now - startT) / 1000;
      const amp = Math.exp(-3.4 * dt) * initialAmp;
      const phase = dt * 12.8;
      window._canvasSloshMap = window._canvasSloshMap || {};
      if (amp <= 0.012) {
        delete window._canvasSloshMap[bottleIdx];
        delete settleSloshRafMap[bottleIdx];
        return;
      }
      window._canvasSloshMap[bottleIdx] = { sloshPhase: phase, sloshAmplitude: amp };
      settleSloshRafMap[bottleIdx] = requestAnimationFrame(tickSettle);
    }
    settleSloshRafMap[bottleIdx] = requestAnimationFrame(tickSettle);
  }

  function updateBottleSelectionDOM(prevIdx = null, nextIdx = null) {
    if (prevIdx !== null && prevIdx !== nextIdx) {
      const prevB = bottles[prevIdx];
      if (prevB && !prevB.removed && !prevB.corked && !isBottleBusy(prevB)) {
        startSettleSloshAnimation(prevIdx, 0.52);
      }
    }
    window._layoutDirty = true;
  }

  function getNeckOffsetY(maxCap, isGiantCat, forceVaried = false) {
    if (isGiantCat) return 0;
    const cfg = getLevelConfig(currentLevelId);
    const isVar = forceVaried || (cfg && cfg.isVariedHeight);
    if (maxCap === 2) return 68;
    if (maxCap === 4 && isVar) return 30;
    return 0;
  }

  function getBottleLayerMetrics(maxCap, isGiantCat, forceVaried = false) {
    const cfg = getLevelConfig(currentLevelId);
    const isVar = forceVaried || (cfg && cfg.isVariedHeight);
    if (isGiantCat) return { bottomY: 194, layerH: 18.2, rx: 43.5, ry: 9.5, vbMinX: -12, vbMinY: -6, vbW: 124, vbH: 224 };
    if (maxCap === 8) return { bottomY: 288, layerH: 29.8, rx: 31.3, ry: 7.6, vbMinX: 15, vbMinY: 3, vbW: 70, vbH: 298 };
    if (maxCap === 2) return { bottomY: 193, layerH: 37.5, rx: 31.3, ry: 7.8, vbMinX: 16.5, vbMinY: 3, vbW: 67, vbH: 204 };
    if (maxCap === 4 && isVar) return { bottomY: 193, layerH: 28.2, rx: 31.3, ry: 7.8, vbMinX: 16.5, vbMinY: 3, vbW: 67, vbH: 204 };
    if (maxCap === 6) return { bottomY: 193, layerH: 24.2, rx: 31.3, ry: 7.8, vbMinX: 16.5, vbMinY: 3, vbW: 67, vbH: 204 };
    return { bottomY: 193, layerH: 36.2, rx: 31.3, ry: 7.8, vbMinX: 16.5, vbMinY: 3, vbW: 67, vbH: 204 };
  }

  function getShoulderRxAtY(y, maxCap, isGiantCat) {
    if (isGiantCat) return y < 102 ? 33.5 : 42.5;
    const neckOff = getNeckOffsetY(maxCap, isGiantCat);
    const shTop = 26.0 + neckOff, shBot = 55.0 + neckOff;
    if (y >= shBot) return 31.3;
    if (y <= shTop) return 12.8;
    const u = (y - shTop) / (shBot - shTop);
    return 12.8 + (31.3 - 12.8) * (1 - Math.pow(1 - u, 1.85));
  }


  function hash01(n) {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }


  function triggerBottleVFX(bottleIdx, vfxType, extraOpts = {}) {
    const isPaperBagBurn = (vfxType === 'paper_bag_burn') || (vfxType === 'cover_unveil' && extraOpts.coverType === 'paper_bag');
    const startT = performance.now();
    const dur = ((isPaperBagBurn ? 920 : (extraOpts.duration || 540))) / getSpeedMultiplier();

    function stepVFX(now) {
      const p = Math.min(1, (now - startT) / dur);
      const easeOut = 1 - Math.pow(1 - p, 3);
      const fade = Math.max(0, 1 - Math.pow(p, 1.6));

      window._canvasVfxMap = window._canvasVfxMap || {};
      window._canvasVfxMap[bottleIdx] = { vfxType, p, easeOut, fade, extraOpts };

      if (p < 1) {
        requestAnimationFrame(stepVFX);
      } else {
        if (window._canvasVfxMap) delete window._canvasVfxMap[bottleIdx];
      }
    }
    requestAnimationFrame(stepVFX);
  }

  function applyTheme(themeId) {
    activeThemeId = themeId;
    window._bgOffscreenDirty = true;
    window._layoutDirty = true;
  }

  function renderShopItems() {
    uiState.shopScrollTop = 0;
    window._layoutDirty = true;
  }

  function checkAndShowMechanicIntro() {
    const cfg = getLevelConfig(currentLevelId);
    const key = cfg.introMechanicKey;
    if (!key || shownMechanicIntros.has(key)) return;
    const info = MECHANIC_INTROS[key];
    if (!info) return;

    shownMechanicIntros.add(key);
    const hIdx = HANDBOOK_KEYS.indexOf(key);
    window._handbookIdx = hIdx >= 0 ? hIdx : 0;
    window._handbookActiveLevelKey = key;
    uiState.openModalId = 'mechanic-modal-mask';
    playSound('modal_open');
  }

  function renderLevelModalCards() {
    uiState.levelScrollTop = 0;
    window._layoutDirty = true;
  }

  function computeProceduralStageLayout(levelId, totalBottles, cfg) {
    const seed = ((levelId * 1664525 + (currentLevelAttemptSeed || 1013904223)) >>> 0);
    const rand01 = (k) => {
      const x = Math.sin((seed % 9973) * 0.173 + k * 12.9898 + levelId * 4.1415) * 43758.5453;
      return x - Math.floor(x);
    };

    // 特殊 BOSS 关 / 长管关 / 高低异形关 / 21瓶关：采用专属防碰撞同列平行波浪排布
    if (cfg && cfg.isCatBossLevel) {
      // 灵猫BOSS关：同列上下瓶同向偏移 (下排比上排额外 +6px)，绝不挤压间距
      const topWave = [-10, 8, 0, -8, 10];
      return {
        gridClass: 'layout-cat-boss',
        slots: Array.from({ length: totalBottles }, (_, idx) => {
          if (idx === 2) return { topPx: 0, leftPx: 0, gridCol: '' };
          const col = idx < 5 ? idx : (idx - 5);
          const isBot = idx >= 5;
          const base = topWave[col % topWave.length] || 0;
          return { topPx: isBot ? (base + 6) : base, leftPx: 0, gridCol: '' };
        })
      };
    }

    if (cfg && cfg.gridClass === 'layout-tall8') {
      const phase = rand01(1) * Math.PI * 2;
      const freq = 0.85 + rand01(2) * 0.65;
      return {
        gridClass: 'layout-tall8',
        slots: Array.from({ length: totalBottles }, (_, idx) => ({
          topPx: Math.round(Math.sin(idx * freq + phase) * 12),
          leftPx: 0,
          gridCol: ''
        }))
      };
    }

    if (cfg && cfg.gridClass === 'layout-21') {
      const phase = rand01(3) * Math.PI * 2;
      return {
        gridClass: 'layout-21',
        slots: Array.from({ length: totalBottles }, (_, idx) => {
          const r = Math.floor(idx / 7);
          const c = idx % 7;
          const colWave = Math.round(Math.sin(c * 1.15 + phase) * 6);
          return { topPx: colWave + (r - 1) * 3, leftPx: 0, gridCol: '' };
        })
      };
    }

    if (cfg && cfg.isVariedHeight) {
      // 高低异形瓶关：由于2/4/6层瓶自身已有明显高度差，同列采用柔和平行波浪 (下排 = 上排 + 6px)，确保高瓶底与矮瓶口绝不挨近
      const phase = rand01(4) * Math.PI * 2;
      const freq = 0.95 + rand01(5) * 0.55;
      return {
        gridClass: 'layout-varied',
        slots: Array.from({ length: totalBottles }, (_, idx) => {
          const r = Math.floor(idx / 6);
          const c = idx % 6;
          const colShift = Math.round(Math.sin(c * freq + phase) * 9);
          return { topPx: colShift + (r === 0 ? -4 : 4), leftPx: 0, gridCol: '' };
        })
      };
    }

    // 标准 12 瓶关卡：100% 保持原尺寸大瓶（绝不缩小瓶身），通过 9 种空间编舞 + 连续黄金分割谐波参数，
    // 动态生成高低瀑布流与横向微错位群落，同时严格满足同列「botY - topY >= 10px」防碰撞定律！
    if (totalBottles === 12) {
      const modePool = [
        'harmonic_waterfall', // 连续双频正弦瀑布流
        'honeycomb_stagger',  // 奇偶列蜂巢交错 + 上下排横向错缝
        'triptych_2_2_2',     // 三联画廊群落 (2+2+2 分组高低错落)
        'twin_peaks_3_3',     // 双子星群落 (左3右3双拱桥)
        'diamond_atrium',     // 中央星钻中庭 (中央上下豁口拉大 + 两侧垂落)
        'soaring_wings',      // 飞翼展翅阵 (中央高耸 + 两翼阶梯垂落)
        'valley_stream',      // 幽谷溪流阵 (两侧高耸 + 中央深谷)
        'jazz_syncopation',   // 黄金分割爵士切分波 (非对称律动)
        'spiral_cascade'      // 流光回旋阶梯阵
      ];
      const modeIdx = (Math.floor(levelId * 1.6180339887 * 5) + Math.floor(rand01(6) * 4)) % modePool.length;
      const mode = modePool[modeIdx];
      const phase1 = rand01(7) * Math.PI * 2;
      const phase2 = rand01(8) * Math.PI * 2;
      const freq1 = 0.82 + rand01(9) * 0.92;
      const freq2 = 1.48 + rand01(10) * 1.05;
      const flipSign = rand01(11) > 0.5 ? 1 : -1;
      const maxAmp = (cfg && cfg.hasBags) ? 12 : 16;

      const slots = Array.from({ length: 12 }, (_, idx) => {
        const r = Math.floor(idx / 6);
        const c = idx % 6;
        const normC = (c - 2.5) / 2.5; // [-1, +1]
        let colBaseY = 0;
        let extraRowSep = 6; // 默认上排 -6px，下排 +6px，同列净间距额外增加 +12px
        let leftPx = 0;

        if (mode === 'harmonic_waterfall') {
          const w1 = Math.sin(c * freq1 + phase1);
          const w2 = Math.cos(c * freq2 + phase2);
          colBaseY = Math.round((w1 * 0.65 + w2 * 0.35) * maxAmp);
          leftPx = (r === 0 ? -1 : 1) * Math.round(Math.sin(c * 1.3 + phase1) * 3);
        } else if (mode === 'honeycomb_stagger') {
          const parity = (c % 2 === 0) ? 1 : -1;
          const mod = Math.round(Math.sin(c * 0.9 + phase1) * 4);
          colBaseY = parity * flipSign * Math.round(maxAmp * 0.85) + mod;
          leftPx = (r === 0) ? -4 : 4;
        } else if (mode === 'triptych_2_2_2') {
          const pairIdx = Math.floor(c / 2); // 0, 1, 2
          const pairHeights = [
            Math.round(Math.sin(phase1) * maxAmp),
            Math.round(Math.sin(phase1 + 2.094) * maxAmp),
            Math.round(Math.sin(phase1 + 4.188) * maxAmp)
          ];
          colBaseY = pairHeights[pairIdx] + ((c % 2 === 0) ? -3 : 3) * flipSign;
          // 让每2列微微靠拢成三联群落
          leftPx = (c % 2 === 0) ? 3 : -3;
        } else if (mode === 'twin_peaks_3_3') {
          const localC = (c < 3) ? (c - 1) : (c - 4); // -1, 0, +1
          const arch = (1 - Math.abs(localC) * 1.35) * flipSign;
          colBaseY = Math.round(arch * maxAmp * 0.88 + Math.sin(c + phase2) * 3);
          leftPx = (c < 3) ? -3 : 3;
        } else if (mode === 'diamond_atrium') {
          // 中央两列上排更高、下排更低，留出宽敞的中央星钻中庭，且绝不縮小上下间距
          const centerWeight = 1 - Math.abs(normC);
          colBaseY = Math.round((Math.abs(normC) - 0.45) * maxAmp * 0.7 * flipSign);
          extraRowSep = Math.round(5 + centerWeight * 9); // 中央列上下额外拉开 +28px！
        } else if (mode === 'soaring_wings') {
          colBaseY = Math.round((Math.pow(Math.abs(normC), 1.35) * 2 - 0.9) * maxAmp * 0.85 * flipSign);
          extraRowSep = Math.round(5 + (1 - Math.abs(normC)) * 5);
        } else if (mode === 'valley_stream') {
          colBaseY = Math.round((0.85 - Math.pow(Math.abs(normC), 1.25) * 1.8) * maxAmp * 0.85 * flipSign);
          leftPx = Math.round(normC * (r === 0 ? -3 : 3));
        } else if (mode === 'jazz_syncopation') {
          const fib = [1, -1, 0.45, -0.85, 0.95, -0.55];
          const shift = (c + levelId) % 6;
          colBaseY = Math.round(fib[shift] * maxAmp * 0.92 + Math.cos(c * freq1 + phase1) * 3);
          leftPx = ((c + r) % 2 === 0) ? 3 : -3;
        } else {
          // spiral_cascade
          const cascade = normC * 0.65 * flipSign + Math.sin(normC * Math.PI + phase1) * 0.45;
          colBaseY = Math.round(cascade * maxAmp);
          leftPx = (r === 0 ? -3 : 3) * flipSign;
        }

        // 铁律：同一列 c 的上排 (r=0) 为 colBaseY - extraRowSep，下排 (r=1) 为 colBaseY + extraRowSep，
        // 因此 botY - topY = 2 * extraRowSep >= +10px，彻底杜绝上排瓶底挨近下排瓶口！
        const topPx = colBaseY + (r === 0 ? -extraRowSep : extraRowSep);
        return { topPx, leftPx, gridCol: '' };
      });

      return {
        gridClass: 'layout-dynamic-12',
        slots
      };
    }

    return {
      gridClass: (cfg && cfg.gridClass) || '',
      slots: Array.from({ length: totalBottles }, () => ({ topPx: 0, leftPx: 0, gridCol: '' }))
    };
  }



  // =========================================================================
  // 纯数学几何坐标计算器 (100% 零 DOM，直接由关卡与水瓶数组计算精确像素矩形)
  // =========================================================================
  let layoutCache = null;

  function computeSlotRectByIndex(slotIdx, cfg, stageLayout) {
    const W = _g.innerWidth || 412;
    const H = _g.innerHeight || 892;
    const safeT = _g.__safeTop || 24;
    const safeB = _g.__safeBottom || 14;
    const shellW = Math.min(W, 470);
    const shellX = (W - shellW) * 0.5;

    const bagsVisible = !!(cfg && cfg.hasBags);
    const bannerVisible = !!uiState.modeBannerShow;

    const topUsed = safeT + 66 + (bagsVisible ? Math.min(118, Math.max(96, H * 0.145)) : 0) + (bannerVisible ? 42 : 0);
    const botUsed = safeB + 86;
    const stageTop = topUsed + 6;
    const stageH = Math.max(240, H - topUsed - botUsed - 12);
    const stageCy = stageTop + stageH * 0.5;

    const cls = ((stageLayout && stageLayout.gridClass) || '') + (userSettings.zoom ? ' zoomed-stage' : '');
    const isZoomed = !!userSettings.zoom;
    const totalSlots = bottles.length || 12;
    const b = bottles[slotIdx];
    const slotPose = (stageLayout && stageLayout.slots && stageLayout.slots[slotIdx]) || { topPx: 0, leftPx: 0 };

    const padX = 8;
    const availW = shellW - padX * 2;
    let cols = 6, rows = 2, colGap = 7, rowGap = Math.min(48, Math.max(32, H * 0.056));
    if (cls.includes('layout-5col')) { cols = 5; rows = Math.ceil(totalSlots / 5); colGap = 10; }
    else if (cls.includes('layout-tall8')) { cols = 7; rows = 1; colGap = 4; }
    else if (cls.includes('layout-cat-boss')) { cols = 7; rows = 2; colGap = 4; rowGap = Math.min(40, Math.max(28, H * 0.048)); }
    else if (cls.includes('layout-21')) { cols = 7; rows = 3; colGap = 2; rowGap = Math.min(20, Math.max(12, H * 0.022)); }
    else { cols = 6; rows = Math.max(1, Math.ceil(totalSlots / 6)); }

    const cellW = (availW - colGap * (cols - 1)) / cols;

    if (cls.includes('layout-cat-boss')) {
      const stdSlotW = Math.min(cellW, 54);
      const stdSlotH = stdSlotW * (204 / 67);
      const totalGridH = stdSlotH * 2 + rowGap;
      const gridStartY = stageCy - totalGridH * 0.5;

      if (slotIdx === 2 || (b && b.isGiantCat)) {
        const catSpanW = cellW * 3 + colGap * 2;
        const catW = Math.min(catSpanW, 158, stageH * 0.45 * (124 / 224));
        const catH = catW * (224 / 124);
        const left = shellX + padX + 2 * (cellW + colGap) + (catSpanW - catW) * 0.5;
        const top = stageCy - catH * 0.5;
        return makeRect(left, top, catW, catH);
      }
      const sideMap = { 0: [0, 0], 1: [0, 1], 3: [0, 5], 4: [0, 6], 5: [1, 0], 6: [1, 1], 7: [1, 5], 8: [1, 6] };
      const [r, c] = sideMap[slotIdx] || [Math.floor(slotIdx / 5), slotIdx % 5];
      const offX = slotPose.leftPx || 0;
      const offY = slotPose.topPx || 0;
      const left = shellX + padX + c * (cellW + colGap) + (cellW - stdSlotW) * 0.5 + offX;
      const top = gridStartY + r * (stdSlotH + rowGap) + offY;
      return makeRect(left, top, stdSlotW, stdSlotH);
    }

    let aspectW = 67, aspectH = 204, maxSlotW = 62, maxSlotH = Math.min(182, Math.max(128, H * 0.235));
    if (cls.includes('layout-tall8') || (b && (b.maxCap || 4) >= 8)) {
      aspectW = 70; aspectH = 298; maxSlotW = 60; maxSlotH = Math.min(268, Math.max(176, H * 0.36));
    } else if (cls.includes('layout-21')) {
      maxSlotW = 52; maxSlotH = Math.min(148, Math.max(106, H * 0.175));
    }

    let customAspectH = aspectH;
    if (b) {
      const _m = getBottleLayerMetrics(b.maxCap || 4, !!b.isGiantCat);
      if (_m && _m.vbW > 0 && _m.vbH > 0) {
        aspectW = _m.vbW;
        customAspectH = _m.vbH;
      }
    }

    const baseSlotW = Math.min(cellW, maxSlotW, maxSlotH * (67 / 204));
    const baseRowH = baseSlotW * (204 / 67);
    const slotW = baseSlotW;
    const slotH = slotW * (customAspectH / aspectW);

    const totalGridH = rows * baseRowH + (rows - 1) * rowGap;
    const gridStartY = stageCy - totalGridH * 0.5;

    const r = Math.floor(slotIdx / cols);
    const c = slotIdx % cols;
    const offX = slotPose.leftPx || 0;
    const offY = slotPose.topPx || 0;

    const rowBottomY = gridStartY + (r + 1) * baseRowH + r * rowGap;
    let left = shellX + padX + c * (cellW + colGap) + (cellW - slotW) * 0.5 + offX;
    let top = rowBottomY - slotH + offY;
    let w = slotW, h = slotH;

    if (isZoomed) {
      const cx = shellX + shellW * 0.5;
      left = cx + (left - cx) * 0.90;
      top = stageCy + (top - stageCy) * 0.90;
      w *= 0.90;
      h *= 0.90;
    }
    return makeRect(left, top, w, h);
  }

  function rebuildLayoutCache() {
    window._layoutDirty = false;
    const W = _g.innerWidth || 412;
    const H = _g.innerHeight || 892;
    const safeT = _g.__safeTop || 24;
    const safeB = _g.__safeBottom || 14;
    const shellW = Math.min(W, 470);
    const shellX = (W - shellW) * 0.5;

    const cfg = getLevelConfig(currentLevelId);
    const stageLayout = computeProceduralStageLayout(currentLevelId, bottles.length, cfg);

    const bagRects = [];
    if (cfg && cfg.hasBags) {
      const bagAreaW = Math.min(shellW - 24, 384);
      const gap = 14;
      const slotW = Math.min(76, (bagAreaW - gap * 3) / 4);
      const totalW = slotW * 4 + gap * 3;
      const startX = shellX + (shellW - totalW) * 0.5;
      const bagH = Math.min(114, Math.max(92, H * 0.135));
      const bagTop = safeT + 66;
      const bagCount = Math.max(4, bags ? bags.length : 4);
      for (let i = 0; i < bagCount; i++) {
        bagRects.push(makeRect(startX + i * (slotW + gap), bagTop, slotW, bagH));
      }
    }

    const bagsVisible = !!(cfg && cfg.hasBags);
    const bannerTop = safeT + 68 + (bagsVisible ? Math.min(118, Math.max(96, H * 0.14)) : 0);

    const bottleSlots = [];
    for (let i = 0; i < bottles.length; i++) {
      const b = bottles[i];
      const sr = computeSlotRectByIndex(i, cfg, stageLayout);
      const isCat = !!(b && b.isGiantCat);
      const padRect = isCat
        ? makeRect(sr.left - sr.width * 0.04, sr.bottom - 36, sr.width * 1.08, 52)
        : makeRect(sr.left - sr.width * 0.10, sr.bottom + sr.height * 0.072 - sr.height * 0.198, sr.width * 1.20, sr.height * 0.198);

      const maxCap = (b && b.maxCap) || 4;
      const _nOff = getNeckOffsetY(maxCap, isCat);
      const _m = getBottleLayerMetrics(maxCap, isCat);
      const _mouthY = isCat ? 11.0 : (9.5 + _nOff);
      const liftY = (selectedIndex === i) ? -20 : 0;
      const mx = sr.left + ((50 - _m.vbMinX) / _m.vbW) * sr.width;
      const my = sr.top + ((_mouthY - _m.vbMinY) / _m.vbH) * sr.height + liftY;
      const mouthRect = makeRect(mx - 0.5, my - 0.5, 1, 1);

      bottleSlots.push({
        slotRect: sr,
        padRect: padRect,
        mouthRect: mouthRect
      });
    }

    // 底部仅保留【重排】、【撤回】、【提示】三个辅助道具按钮（空瓶仅通过点击广告瓶解锁）
    const dockIds = ['shuffle-btn', 'undo-btn', 'hint-btn'];
    const dockBtns = {};
    const dGap = Math.min(28, Math.max(18, Math.round(W * 0.06)));
    const maxBtnW = Math.floor((shellW - 48 - dGap * 2) / 3);
    const btnSize = Math.min(60, Math.max(50, Math.min(maxBtnW, H * 0.070)));
    const totalDockW = btnSize * 3 + dGap * 2;
    const startDockX = shellX + (shellW - totalDockW) * 0.5;
    const dockTop = H - safeB - btnSize - 26;

    dockIds.forEach((id, bIdx) => {
      const br = makeRect(startDockX + bIdx * (btnSize + dGap), dockTop, btnSize, btnSize);
      dockBtns[id] = {
        btn: br,
        badge: makeRect(br.right - 21, br.top + 1, 21, 17)
      };
    });

    // 适配微信小游戏右上角原生胶囊按钮（通过 getMenuButtonBoundingClientRect 动态避让，并将【设置】与【？图鉴】并排放置在左上角安全区，彻底杜绝右上角遮挡！）
    let topBtnY = safeT + 8;
    let topBtnSize = 44;
    if (nativeApi && typeof nativeApi.getMenuButtonBoundingClientRect === 'function') {
      try {
        const menuRect = nativeApi.getMenuButtonBoundingClientRect();
        if (menuRect && menuRect.top > 0) {
          topBtnY = Math.max(8, menuRect.top + (menuRect.height - topBtnSize) * 0.5);
        }
      } catch (e) { }
    }

    layoutCache = {
      shellRect: makeRect(shellX, 0, shellW, H),
      settingsBtn: makeRect(shellX + 12, topBtnY, topBtnSize, topBtnSize),
      rulesBtn: makeRect(shellX + 12 + topBtnSize + 8, topBtnY, topBtnSize, topBtnSize),
      centerLvTrigger: makeRect(shellX + shellW * 0.5 - 76, topBtnY - 2, 152, 50),
      modeBanner: makeRect(shellX + 16, bannerTop, shellW - 32, 34),
      modeBannerProg: makeRect(shellX + 178, bannerTop + 6, 68, 22),
      movesCounterPill: makeRect(shellX + shellW - 16 - 92, bannerTop + 4, 88, 26),
      bagRects,
      bottleSlots,
      dockBtns
    };
  }

  function renderAll() {
    const cfg = getLevelConfig(currentLevelId);
    const corkedCnt = bottles.filter(b => b && b.corked).length;
    const activeOrCorked = bottles.filter(b => b && (b.corked || b.removed || (b.layers && b.layers.length > 0)));
    const totalTargets = cfg.isCatBossLevel ? 8 : (cfg.hasBags ? Math.max(4, packedTotal + bottles.filter(b => b && !b.removed && b.layers && b.layers.length > 0).length) : Math.max(1, activeOrCorked.length - 2));

    if (remainingMoves !== null) {
      uiState.movesCounterShow = true;
      uiState.movesLeftNum = String(remainingMoves);
      uiState.movesCounterDanger = (remainingMoves <= 5);
    } else {
      uiState.movesCounterShow = false;
      uiState.movesCounterDanger = false;
    }

    if (cfg.hasBags) {
      if (remainingMoves !== null) {
        uiState.modeBannerShow = true;
        uiState.modeBannerText = '⏳ 步数限制挑战 · 集齐礼袋';
        uiState.modeBannerProg = `${packedTotal}/${levelTargetTotalBottles || 7}`;
      } else {
        uiState.modeBannerShow = false;
      }
    } else {
      if (cfg.isCatBossLevel) {
        uiState.modeBannerShow = true;
        const catBottle = bottles.find(b => b.isGiantCat);
        const curCatLayers = catBottle ? catBottle.layers.length : 0;
        const catColName = COLORS[(catBottle && catBottle.catTargetColor) || 'pink'].name;
        uiState.modeBannerText = `🐱 灵猫大瓶：将全场【${catColName}】汇入大猫瓶`;
        uiState.modeBannerProg = `${curCatLayers} / 8 层`;
      } else if (cfg.isTall8Level) {
        uiState.modeBannerShow = true;
        uiState.modeBannerText = '🧪 8层长管试炼：将每种颜色凑满 8 层同色';
        uiState.modeBannerProg = `${corkedCnt} / ${totalTargets} 瓶`;
      } else if (cfg.isVariedHeight) {
        uiState.modeBannerShow = true;
        uiState.modeBannerText = '📐 高低异形瓶：注意各瓶容量为 2层 / 4层 / 6层';
        uiState.modeBannerProg = `${corkedCnt} / ${totalTargets} 瓶`;
      } else {
        uiState.modeBannerShow = false;
      }
    }

    window._layoutDirty = true;
    rebuildLayoutCache();
  }

  function onBagClick(bagIdx) {
    const bag = bags[bagIdx];
    if (!bag || bag.removed) return;
    if (bag.locked) {
      const nextCol = pickNextNeededBagColor(bagIdx);
      if (!nextCol) {
        showToast('🛍️ 当前场上剩余药水均已有对应购物袋，无需额外开启！');
        return;
      }
      activeHintPair = null;
      moveHistory.push(cloneState());
      bag.locked = false;
      bag.removed = false;
      bag.color = nextCol;
      playSound('pack');
      showToast('🎬 已为您额外开启 +1 个高定礼盒槽位！');
      renderAll();
      setTimeout(() => checkAndPackWaitingCorkedBottles(), 180);
    } else if (bag.packedBottle) {
      showToast(`🛍️ 已装好整瓶【${COLORS[bag.packedBottle].name}】！`);
    } else if (bag.color) {
      showToast(`🛍️ 装满【${COLORS[bag.color].name}】即可装入礼袋！`);
    }
  }

  // 精准统计场上每种颜色实际还需几个购物袋，并区分「当前可独立凑满的颜色 (completableColors)」与「被封印在礼袍/冰雕/纸袋中的颜色 (sealedColors)」，
  // 严格遵守「购物袋每次只出现2个、无对应颜色购物袋时满瓶不收起」的核心规则，同时100%杜绝购物袋索要被封印颜色导致死循环！
  function computeNeededBagsByColor() {
    const totalNeed = {};
    const corkedNeed = {};
    const layerCounts = {};
    const unsealedLayerCounts = {};
    const sealedColors = new Set();
    const topUnlockedColors = [];
    const unlockedColors = [];
    const allRemainingColors = [];

    bottles.forEach(b => {
      if (!b || b.removed || b._flyingToBag || b.layers.length === 0) return;
      if (b.corked) {
        const c = b.layers[0];
        corkedNeed[c] = (corkedNeed[c] || 0) + 1;
        totalNeed[c] = (totalNeed[c] || 0) + 1;
        if (!allRemainingColors.includes(c)) allRemainingColors.push(c);
        return;
      }
      const isBagSealed = ['silk_drape', 'full_ice', 'paper_bag'].includes(b.special) && packedTotal < (b.unlockOrder || 1);
      const isUnlockedSource = !isBagSealed && !(b.frozenTurns > 0) && ['none', 'one_way_out', 'color_lock'].includes(b.special);
      const topC = b.layers[b.layers.length - 1];
      if (isUnlockedSource && topC && !topUnlockedColors.includes(topC)) {
        topUnlockedColors.push(topC);
      }
      b.layers.forEach(c => {
        layerCounts[c] = (layerCounts[c] || 0) + 1;
        if (isBagSealed) {
          sealedColors.add(c);
        } else {
          unsealedLayerCounts[c] = (unsealedLayerCounts[c] || 0) + 1;
        }
        if (isUnlockedSource && !unlockedColors.includes(c)) unlockedColors.push(c);
        if (!allRemainingColors.includes(c)) allRemainingColors.push(c);
      });
    });

    Object.entries(layerCounts).forEach(([c, cnt]) => {
      const bottlesOfC = Math.max(1, Math.ceil(cnt / 4));
      totalNeed[c] = (totalNeed[c] || 0) + bottlesOfC;
    });

    // 当前在不解锁新礼袋封印的前提下就能凑满至少1整瓶(4层)的颜色集合
    const completableColors = allRemainingColors.filter(c =>
      (corkedNeed[c] || 0) > 0 || (unsealedLayerCounts[c] || 0) >= 4 || !sealedColors.has(c)
    );

    return { totalNeed, corkedNeed, topUnlockedColors, unlockedColors, completableColors, allRemainingColors };
  }

  function pickNextNeededBagColor(excludeBagIdx = -1) {
    const { totalNeed, corkedNeed, topUnlockedColors, unlockedColors, completableColors, allRemainingColors } = computeNeededBagsByColor();
    const activeCounts = {};
    bags.forEach((bg, idx) => {
      if (idx === excludeBagIdx) return;
      if (bg && !bg.locked && !bg.removed && !bg.packedBottle && bg.color) {
        activeCounts[bg.color] = (activeCounts[bg.color] || 0) + 1;
      }
    });

    // 仅从「场上实际剩余瓶数 > 当前顶部已有同色袋子数」的颜色中挑选
    const candidates = allRemainingColors.filter(c => (totalNeed[c] || 0) > (activeCounts[c] || 0));
    if (candidates.length === 0) {
      return null;
    }

    // 第一优先级：桌上已经满瓶落塞、正在等待对应颜色购物袋收起的瓶子颜色 (corkedUnmatched)
    const corkedUnmatched = candidates.filter(c => (corkedNeed[c] || 0) > (activeCounts[c] || 0));
    // 第二优先级：当前未被封印（4层都在外）且顶层已暴露的可凑满色
    const completableCandidates = candidates.filter(c => completableColors.includes(c));
    return corkedUnmatched.find(c => !activeCounts[c])
      || corkedUnmatched[0]
      || topUnlockedColors.find(c => completableCandidates.includes(c) && !activeCounts[c])
      || unlockedColors.find(c => completableCandidates.includes(c) && !activeCounts[c])
      || completableCandidates.find(c => !activeCounts[c])
      || completableCandidates[0]
      || topUnlockedColors.find(c => candidates.includes(c) && !activeCounts[c])
      || unlockedColors.find(c => candidates.includes(c) && !activeCounts[c])
      || candidates.find(c => !activeCounts[c])
      || candidates[0];
  }

  function reconcileActiveBagsWithBottles() {
    const cfg = getLevelConfig(currentLevelId);
    if (!cfg.hasBags || !bags || bags.length === 0) return;
    const { totalNeed, completableColors } = computeNeededBagsByColor();
    const assigned = {};
    const toReassign = [];

    // 第一轮：仅保留互不重复、场上确实需要、且当前未被封印锁死的购物袋颜色
    bags.forEach((bg, idx) => {
      if (!bg || bg.locked || bg.removed || bg.packedBottle || bg._busy) return;
      const c = bg.color;
      if (c && !assigned[c] && (totalNeed[c] || 0) > 0 && completableColors.includes(c)) {
        assigned[c] = 1;
      } else {
        toReassign.push(idx);
      }
    });

    // 第二轮：对其余重复或已无对应药水的购物袋重新分配颜色；若场上总剩余瓶数已不足，则直接收起该袋槽位
    toReassign.forEach(idx => {
      const bg = bags[idx];
      bg.color = null;
      const nextCol = pickNextNeededBagColor(idx);
      if (nextCol) {
        bg.color = nextCol;
        bg.removed = false;
      } else {
        bg.color = null;
        bg.removed = true;
      }
    });
  }

  function isCompleteBottle(b) {
    if (!b || b.removed || b.corked) return false;
    // 规范 9：单向出水古瓶 (one_way_out) 永远作为供水源泉，绝不触发原木塞封存
    if (b.special === 'one_way_out') return false;
    if (!['none', 'color_lock', 'one_way_in'].includes(b.special)) return false;
    if (b.mysteryCount && b.mysteryCount > 0) return false;
    if (b.layers.length === 0) return false;
    const firstCol = b.layers[0];
    if (!b.layers.every(c => c === firstCol)) return false;
    if (b.special === 'color_lock' && b.requiredColor && firstCol !== b.requiredColor) return false;

    const cfg = getLevelConfig(currentLevelId);
    // 规范 2：皇家灵猫 BOSS 关中，外围普通小瓶装满灵猫目标色时严禁提前落塞，确保可汇入中央 8 层灵猫瓶
    if (cfg.isCatBossLevel && !b.isGiantCat) {
      const catBottle = bottles.find(x => x.isGiantCat);
      const catTarget = (catBottle && catBottle.catTargetColor) || 'pink';
      if (firstCol === catTarget) return false;
    }

    const cap = b.maxCap || 4;
    // 规范 3：高低异形瓶（2/4/6层混排）全局同色余量校验与容量智能自适应（彻底解决图1中2层紫水装在6层高瓶中无法封存的痛点！）
    if (cfg.isVariedHeight) {
      let otherSameCount = 0;
      bottles.forEach(other => {
        if (other === b || other.removed || other.corked) return;
        otherSameCount += other.layers.filter(c => c === firstCol).length;
      });
      if (otherSameCount > 0) {
        return false;
      }
      // 若场上该颜色的所有水层已100%汇聚在此瓶中 (otherSameCount === 0)，但当前瓶容量偏大 (如2层水在6层瓶中)：
      // 自动与场上一只容量为 b.layers.length 的未封存瓶互换器型容量，使本瓶立即满瓶落塞，同时场上高瓶/矮瓶总数100%守恒！
      if (b.layers.length !== cap && b.layers.length >= 2) {
        const targetLen = b.layers.length;
        const swapPartner = bottles.find(other =>
          other !== b && !other.removed && !other.corked &&
          (other.maxCap || 4) === targetLen &&
          other.layers.length <= targetLen
        );
        if (swapPartner) {
          swapPartner.maxCap = cap;
          b.maxCap = targetLen;
          return true;
        }
      }
    }

    if (b.layers.length !== (b.maxCap || 4)) return false;
    return true;
  }

  // 当某种颜色的所有药水已在普通瓶中集满封存后，自动解除场上剩余空色环瓶的限制，防止其变成废瓶卡死关卡
  function releaseObsoleteColorLocks() {
    bottles.forEach((b, idx) => {
      if (!b || b.removed || b.corked || b.special !== 'color_lock' || !b.requiredColor) return;
      const reqC = b.requiredColor;
      let remainingLayersOfReq = 0;
      bottles.forEach(other => {
        if (!other || other.removed || other.corked) return;
        remainingLayersOfReq += other.layers.filter(c => c === reqC).length;
      });
      if (remainingLayersOfReq === 0) {
        b.special = 'none';
        b.requiredColor = null;
        playSound('mystery_reveal');
        triggerBottleVFX(idx, 'color_unlock', { colorKey: reqC });
      }
    });
  }

  // 瓶身受阻动态反馈：顺滑摇晃瓶身 + 瓶顶弹出与暖金主题一致的磨砂玻璃轻提示气泡（彻底消除图层重绘闪动与多余圆环）


  function triggerBottleRejectFeedback(bottleIdx, badgeText, dotColor = null) {
    triggerHaptic(18);
    const now = performance.now();
    uiState.bottleRejectMap[bottleIdx] = {
      text: String(badgeText || ''),
      dotColor: dotColor,
      shakeUntil: now + 380,
      until: now + 950
    };
  }

  function canSelectBottle(b, bottleIdx = -1) {
    if (!b || b.removed || b.corked) return false;
    if (b.frozenTurns && b.frozenTurns > 0) {
      if (bottleIdx >= 0) triggerBottleRejectFeedback(bottleIdx, `🧊 冰封${b.frozenTurns}步`);
      showToast(`🧊 再倒水 ${b.frozenTurns} 步解封`);
      return false;
    }
    if (b.isGiantCat) {
      const colObj = COLORS[b.catTargetColor || 'pink'] || COLORS.pink;
      if (bottleIdx >= 0) triggerBottleRejectFeedback(bottleIdx, `🐱 倒入${colObj.name}`);
      showToast(`🐱 请把${colObj.name}倒入大猫瓶`);
      return false;
    }
    if (b.special === 'one_way_in') {
      if (bottleIdx >= 0) triggerBottleRejectFeedback(bottleIdx, '⏬ 只进不出');
      showToast('⏬ 漏斗瓶：只进不出');
      return false;
    }
    if (b.special === 'silk_drape' || b.special === 'full_ice' || b.special === 'paper_bag') {
      const leftBags = Math.max(1, (b.unlockOrder || 1) - packedTotal);
      if (bottleIdx >= 0) triggerBottleRejectFeedback(bottleIdx, `🔒 满${leftBags}瓶解锁`);
      showToast(`🔒 再装满 ${leftBags} 瓶自动解锁`);
      return false;
    }
    if (b.special === 'ice_base') {
      const leftCnt = b.poursToBreak || 1;
      if (bottleIdx >= 0) triggerBottleRejectFeedback(bottleIdx, `❄️ 合并${leftCnt}次破冰`);
      showToast(`❄️ 同色合并 ${leftCnt} 次破冰（可接水）`);
      return false;
    }
    if (b.special === 'stone_base') {
      const leftCnt = b.poursToBreak || 1;
      if (bottleIdx >= 0) triggerBottleRejectFeedback(bottleIdx, `🔒 合并${leftCnt}次解锁`);
      showToast(`🔒 同色合并 ${leftCnt} 次解锁（可接水）`);
      return false;
    }
    if (b.special === 'ad_cam' || b.special === 'ad_cam_blue') return false;
    if (b.layers.length === 0 || isCompleteBottle(b)) return false;
    return true;
  }

  // 统一倾倒状态机条件 3、4、5、6：目标瓶可接水判定
  function canPourInto(src, dst) {
    if (!src || !dst || isBottleBusy(src) || isBottleBusy(dst) || src.removed || dst.removed || src.corked || dst.corked) return false;
    if ((src.frozenTurns && src.frozenTurns > 0) || (dst.frozenTurns && dst.frozenTurns > 0)) return false;
    const openMouthSpecials = ['none', 'ice_base', 'stone_base', 'one_way_in', 'color_lock'];
    if (!openMouthSpecials.includes(dst.special)) return false;
    const dstCap = dst.maxCap || 4;
    if (dst.layers.length >= dstCap || src.layers.length === 0) return false;
    const pourColor = src.layers[src.layers.length - 1];
    if (dst.special === 'color_lock' && dst.requiredColor && pourColor !== dst.requiredColor) {
      return false;
    }
    if (dst.layers.length === 0) return true;
    return pourColor === dst.layers[dst.layers.length - 1];
  }

  function isBottleBusy(b) {
    return !!(b && (b._pouringSrc || b._pouringDst || b._corking || b._flyingToBag));
  }

  function onBottleClick(idx) {
    activeHintPair = null;
    const clicked = bottles[idx];
    if (!clicked || clicked.removed || isBottleBusy(clicked)) return;

    if (clicked.special === 'ad_cam' || clicked.special === 'ad_cam_blue') {
      moveHistory.push(cloneState());
      clicked.special = 'none';
      window._layoutDirty = true;
      playSound('pack');
      triggerBottleVFX(idx, 'ad_unlock', { colorKey: 'purple' });
      showToast('🎬 激励视频奖励：已为您开启 +1 备用琉璃空瓶！');
      renderAll();
      return;
    }

    if (clicked.corked) {
      triggerBottleRejectFeedback(idx, '✅ 已满瓶封存', '#22c55e');
      showToast('✅ 该瓶已装满完成！');
      return;
    }

    if (remainingMoves !== null && remainingMoves <= 0) {
      uiState.openModalId = 'out-of-moves-modal-mask';
      return;
    }

    if (selectedIndex === null) {
      if (canSelectBottle(clicked, idx)) {
        const prevIdx = selectedIndex;
        selectedIndex = idx;
        playSound('select');
        updateBottleSelectionDOM(prevIdx, idx);
        startSelectSloshAnimation(idx);
      }
      return;
    }

    if (selectedIndex === idx) {
      stopSelectSloshAnimation();
      const prevIdx = selectedIndex;
      selectedIndex = null;
      playSound('deselect');
      updateBottleSelectionDOM(prevIdx, null);
      return;
    }

    const src = bottles[selectedIndex];
    if (!src || src.removed || isBottleBusy(src)) {
      selectedIndex = null;
      return;
    }
    const dst = clicked;

    if (canPourInto(src, dst)) {
      stopSelectSloshAnimation();
      performLiquidPour(selectedIndex, idx);
    } else {
      // 针对所有不可倒入的目标瓶给出极简直白的气泡反馈
      const pourColor = src.layers[src.layers.length - 1];
      if (dst.frozenTurns && dst.frozenTurns > 0) {
        triggerBottleRejectFeedback(idx, `🧊 冰封${dst.frozenTurns}步`);
        showToast(`🧊 瓶口冰封，还需 ${dst.frozenTurns} 步`);
        return;
      }
      if (dst.special === 'one_way_out') {
        triggerBottleRejectFeedback(idx, '⏫ 只出不进');
        showToast('⏫ 古瓶：只能倒出，不能倒入');
        return;
      }
      if (dst.special === 'color_lock' && dst.requiredColor && pourColor !== dst.requiredColor) {
        const reqObj = COLORS[dst.requiredColor] || COLORS.blue;
        triggerBottleRejectFeedback(idx, `🔒 仅限${reqObj.name}`);
        showToast(`🔒 此瓶仅可倒入${reqObj.name}`);
        return;
      }
      if (['silk_drape', 'full_ice', 'paper_bag'].includes(dst.special)) {
        const leftBags = Math.max(1, (dst.unlockOrder || 1) - packedTotal);
        triggerBottleRejectFeedback(idx, `🔒 满${leftBags}瓶解锁`);
        showToast(`🔒 再装满 ${leftBags} 瓶自动解锁`);
        return;
      }
      const dstCap = dst.maxCap || 4;
      if (!canSelectBottleNoToast(dst)) {
        if (dst.layers.length >= dstCap) {
          triggerBottleRejectFeedback(idx, '🍾 已装满');
          showToast('🍾 该瓶已装满');
        } else if (dst.layers.length > 0 && dst.layers[dst.layers.length - 1] !== pourColor) {
          const dstTopObj = COLORS[dst.layers[dst.layers.length - 1]] || COLORS.blue;
          triggerBottleRejectFeedback(idx, `✕ 需倒${dstTopObj.name}`);
          showToast(`⚠️ 请倒入相同的${dstTopObj.name}`);
        } else {
          canSelectBottle(dst, idx);
        }
        return;
      }
      // 若目标瓶是另一个正常可拿起的瓶子，丝滑放下原瓶并弹起新瓶（原地DOM过渡）
      stopSelectSloshAnimation();
      const prevIdx = selectedIndex;
      selectedIndex = idx;
      playSound('select');
      updateBottleSelectionDOM(prevIdx, idx);
      startSelectSloshAnimation(idx);
    }
  }

  // 进关时全场药水自然波荡缓释动效：如同将刚调配好的水瓶平稳放到木架上，瓶内药水轻微晃动后优雅平息


  function startLevelEntranceSlosh() {
    if (entranceSloshRaf) cancelAnimationFrame(entranceSloshRaf);
    const entranceStart = performance.now();
    const durSec = 1.25;

    function tickEntranceSlosh(now) {
      const dt = (now - entranceStart) / 1000;
      if (dt >= durSec || isAnimating) {
        entranceSloshRaf = null;
        window._canvasSloshMap = {};
        return;
      }
      const amp = 0.88 * Math.exp(-2.85 * dt);
      const phase = dt * 14.2;
      window._canvasSloshMap = window._canvasSloshMap || {};
      bottles.forEach((b, idx) => {
        if (!b || b.removed || b.corked || !b.layers || b.layers.length === 0) return;
        if (selectedIndex === idx) return;
        const bottlePhase = phase + idx * 0.45;
        window._canvasSloshMap[idx] = { sloshPhase: bottlePhase, sloshAmplitude: amp };
      });
      entranceSloshRaf = requestAnimationFrame(tickEntranceSlosh);
    }
    entranceSloshRaf = requestAnimationFrame(tickEntranceSlosh);
  }

  function executeSmartHint() {
    const move = findBestPourMove();
    if (move) {
      if (hintUses <= 0) {
        hintUses = 3;
        playSound('pack');
        showToast('🎬 已为您免费补充 +3 次提示机会！');
        renderAll();
        return;
      }
      hintUses = Math.max(0, hintUses - 1);
      stopSelectSloshAnimation();
      const prevIdx = selectedIndex;
      activeHintPair = { srcIdx: move.srcIdx, dstIdx: move.dstIdx };
      selectedIndex = move.srcIdx;
      playSound('select');
      updateBottleSelectionDOM(prevIdx, selectedIndex);
      startSelectSloshAnimation(move.srcIdx);

      const pourColKey = bottles[move.srcIdx].layers[bottles[move.srcIdx].layers.length - 1];
      const colName = (COLORS[pourColKey] && COLORS[pourColKey].name) || '秘药';
      showToast(`💡 提示：将 ①号瓶的【${colName}】倒入 ②号瓶！`);
      return;
    }
    executeSmartHintOrRefresh();
  }

  function executeShuffleRemainingLiquid() {
    if (bottles.some(b => isBottleBusy(b))) return;
    stopSelectSloshAnimation();
    if (entranceSloshRaf) cancelAnimationFrame(entranceSloshRaf);

    // 关键修复：必须在清空 b.layers 之前保存快照，否则撤回时会恢复为空瓶！
    const preShuffleSnapshot = cloneState();

    // 提取所有未封存、未移走的普通水瓶中的全部剩余药水层（保证每种颜色的总层数 100% 绝对守恒不变！）
    const pool = [];
    const targetBottles = [];

    bottles.forEach(b => {
      if (!b.removed && !b.corked && !b.isGiantCat && !['silk_drape', 'full_ice', 'paper_bag', 'ad_cam', 'ad_cam_blue', 'one_way_in'].includes(b.special)) {
        while (b.layers.length > 0) pool.push(b.layers.pop());
        b.mysteryCount = 0;
        b.frozenTurns = 0;
        targetBottles.push(b);
      }
    });

    if (pool.length === 0) {
      showToast('💡 当前场上无需要打乱的药水！');
      return;
    }

    moveHistory.push(preShuffleSnapshot);
    if (shuffleUses > 0) {
      shuffleUses--;
    } else {
      shuffleUses = 3;
      showToast('🎬 激励视频奖励：已为您免费补充 +3 次打乱机会！');
    }

    // 随机洗牌池子，且确保打乱后不会全同色满瓶、且至少存在一个合法移动
    for (let attempt = 0; attempt < 35; attempt++) {
      const curPool = pool.slice();
      for (let i = curPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = curPool[i]; curPool[i] = curPool[j]; curPool[j] = tmp;
      }

      // 先满足 color_lock 瓶的专属颜色需求
      targetBottles.forEach(b => {
        b.layers = [];
        if (b.special === 'color_lock' && b.requiredColor) {
          const cap = b.maxCap || 4;
          for (let k = curPool.length - 1; k >= 0 && b.layers.length < cap - 1; k--) {
            if (curPool[k] === b.requiredColor) {
              b.layers.push(curPool.splice(k, 1)[0]);
            }
          }
        }
      });

      // 再将其余药水填充到普通瓶中（优先保留末尾至少 2 只空瓶作为周转空间，绝不把所有空瓶填满！）
      const allNormal = targetBottles.filter(b => b.special !== 'color_lock');
      const totalCapAll = allNormal.reduce((acc, b) => acc + (b.maxCap || 4), 0);
      let reserveCount = 0;
      let reservedCap = 0;
      for (let r = allNormal.length - 1; r >= 0 && reserveCount < 2; r--) {
        const c = allNormal[r].maxCap || 4;
        if (totalCapAll - reservedCap - c >= curPool.length) {
          reservedCap += c;
          reserveCount++;
        } else {
          break;
        }
      }
      const nonFull = allNormal.slice(0, allNormal.length - reserveCount);
      let ptr = 0;
      while (curPool.length > 0 && nonFull.length > 0) {
        const targetB = nonFull[ptr % nonFull.length];
        const cap = targetB.maxCap || 4;
        if (targetB.layers.length < cap) {
          targetB.layers.push(curPool.pop());
        } else {
          nonFull.splice(ptr % nonFull.length, 1);
          continue;
        }
        ptr++;
      }

      // 检查是否存在可倒出的合法步，避免洗成死局
      if (findBestPourMove() !== null) {
        break;
      }
    }

    activeHintPair = null;
    selectedIndex = null;
    playSound('btn_shuffle');
    renderAll();
    startLevelEntranceSlosh();
    showToast('🔀 已为您打乱重排盘面剩余药水（药水总数保持不变）！');
  }

  function performLiquidPour(srcIdx, dstIdx) {
    const srcBottle = bottles[srcIdx];
    const dstBottle = bottles[dstIdx];
    if (!srcBottle || !dstBottle || isBottleBusy(srcBottle) || isBottleBusy(dstBottle)) return;

    // 1. 记录撤回快照（在修改 layers 之前保存完整状态）
    activeHintPair = null;
    moveHistory.push(cloneState());

    // 2. 立即清除选中态并重置视觉升空偏移（彻底根除落回后因 vs.liftY 仍为 -20 引发的向上跳动！）
    const vsSrc = (window._bottleVisualState && window._bottleVisualState[srcIdx])
      ? window._bottleVisualState[srcIdx]
      : { liftY: -20, scale: 1.03, aoScale: 0.56, aoAlpha: 0.22 };
    const startLiftY = (typeof vsSrc.liftY === 'number') ? vsSrc.liftY : -20;
    vsSrc.liftY = 0;
    vsSrc.scale = 1.0;
    selectedIndex = null;

    if (remainingMoves !== null) {
      remainingMoves = Math.max(0, remainingMoves - 1);
      uiState.movesLeftNum = String(remainingMoves);
      uiState.movesCounterDanger = (remainingMoves <= 5);
      if (remainingMoves === 3 || remainingMoves === 1) {
        triggerHaptic(25);
      }
    }

    if (!layoutCache || window._layoutDirty) rebuildLayoutCache();
    const srcSlotInfo = layoutCache.bottleSlots[srcIdx];
    const dstSlotInfo = layoutCache.bottleSlots[dstIdx];
    const srcRect = srcSlotInfo ? srcSlotInfo.slotRect : makeRect(60, 260, 56, 170);
    const dstRect = dstSlotInfo ? dstSlotInfo.slotRect : makeRect(160, 260, 56, 170);
    const zoomScale = userSettings.zoom ? 0.90 : 1.0;

    const srcCap = srcBottle.maxCap || 4;
    const dstCap = dstBottle.maxCap || 4;
    const preSrcLayers = srcBottle.layers.slice();
    const preDstLayers = dstBottle.layers.slice();
    const preSrcMysteryCount = srcBottle.mysteryCount || 0;
    const preDstMysteryCount = dstBottle.mysteryCount || 0;
    const initialDstLayers = preDstLayers.length;
    const pourColorKey = preSrcLayers[preSrcLayers.length - 1];
    const colObj = COLORS[pourColorKey] || COLORS.blue;

    const srcRevealedStart = preSrcMysteryCount;
    let moveCount = 0;
    for (let i = preSrcLayers.length - 1; i >= srcRevealedStart; i--) {
      if (preSrcLayers[i] === pourColorKey && preDstLayers.length + moveCount < dstCap) {
        moveCount++;
      } else {
        break;
      }
    }

    let srcTopSameCount = 0;
    for (let i = preSrcLayers.length - 1; i >= srcRevealedStart; i--) {
      if (preSrcLayers[i] === pourColorKey) srcTopSameCount++;
      else break;
    }

    const dstFullLayers = [...preDstLayers];
    for (let k = 0; k < moveCount; k++) dstFullLayers.push(pourColorKey);
    const remainingSrcLayers = preSrcLayers.slice(0, preSrcLayers.length - moveCount);

    // 3. 立即在逻辑层完成液体转移，并仅对当前 beteiligte 的两个瓶子加局部忙锁（其余瓶子可立即连续点击操作！）
    for (let k = 0; k < moveCount; k++) {
      srcBottle.layers.pop();
      dstBottle.layers.push(pourColorKey);
    }
    srcBottle._pouringSrc = true;
    dstBottle._pouringDst = true;

    const dstMyst = preDstMysteryCount;
    let dstTopSameAfter = 0;
    for (let i = dstFullLayers.length - 1; i >= dstMyst; i--) {
      if (dstFullLayers[i] === pourColorKey) dstTopSameAfter++;
      else break;
    }
    const dstInitialScale = (dstTopSameAfter - moveCount) / Math.max(1, dstTopSameAfter);

    const shellRect = (layoutCache && layoutCache.shellRect) ? layoutCache.shellRect : { left: 0, right: _g.innerWidth || 412 };
    const dstCenterX = dstRect.left + dstRect.width * 0.5;
    const swingSpanPx = Math.max(118, srcRect.height * 0.94);
    const canPourFromLeft = (dstCenterX - swingSpanPx) >= (shellRect.left + 4);
    const canPourFromRight = (dstCenterX + swingSpanPx) <= (shellRect.right - 4);
    let pourDir = (srcRect.left <= dstRect.left) ? 1 : -1;
    if (pourDir === -1 && !canPourFromRight && canPourFromLeft) {
      pourDir = 1;
    } else if (pourDir === 1 && !canPourFromLeft && canPourFromRight) {
      pourDir = -1;
    } else if (!canPourFromRight && !canPourFromLeft) {
      const leftRoom = dstCenterX - shellRect.left;
      const rightRoom = shellRect.right - dstCenterX;
      pourDir = (leftRoom >= rightRoom) ? 1 : -1;
    }

    const srcNeckOffsetY = getNeckOffsetY(srcCap, !!srcBottle.isGiantCat);
    const dstNeckOffsetY = getNeckOffsetY(dstCap, !!dstBottle.isGiantCat);
    const { bottomY: srcBotY, vbMinX: srcVbMinX, vbMinY: srcVbMinY, vbW: srcVbW, vbH: srcVbH } = getBottleLayerMetrics(srcCap, !!srcBottle.isGiantCat);
    const { bottomY: dstBotY, layerH: dstLayerH, vbMinX: dstVbMinX, vbMinY: dstVbMinY, vbW: dstVbW, vbH: dstVbH } = getBottleLayerMetrics(dstCap, !!dstBottle.isGiantCat);

    const pivotSvgX = 50 + pourDir * 12.0;
    const pivotSvgY = 9.8 + srcNeckOffsetY;

    // 严格使用与 renderPureCanvasLoop 100% 一致的线性视口映射，确保落回终点与静止态坐标零误差！
    const srcScaleX = srcRect.width / srcVbW;
    const srcScaleY = srcRect.height / srcVbH;
    const dstScaleX = dstRect.width / dstVbW;
    const dstScaleY = dstRect.height / dstVbH;

    const srcLipX = srcRect.left + (pivotSvgX - srcVbMinX) * srcScaleX;
    const srcLipY = srcRect.top + (pivotSvgY - srcVbMinY) * srcScaleY;

    const dstMouthX = dstRect.left + (50 - dstVbMinX) * dstScaleX;
    const dstMouthY = dstRect.top + (9.5 + dstNeckOffsetY - dstVbMinY) * dstScaleY;

    const targetLipX = dstMouthX - pourDir * 1.0;
    const targetLipY = dstMouthY - 5.5;

    const startVol = preSrcLayers.length;
    const endVol = remainingSrcLayers.length;
    const startTiltDeg = pourDir * getPhysicalSpillAngleDeg(startVol, srcCap);
    const endTiltDeg = pourDir * getPhysicalSpillAngleDeg(endVol, srcCap);

    const spdMult = getSpeedMultiplier();
    const moveDuration = 240 / spdMult;
    const pourDuration = (420 + (moveCount - 1) * 95) / spdMult;
    const returnDuration = 210 / spdMult;
    const startTime = performance.now();
    let soundPlayed = false;
    let dstConsequencesResolved = false;

    const bodyMidSvgY = (28 + srcNeckOffsetY + srcBotY) * 0.5;
    const bodyHalfW = 31.3 * srcScaleX;
    const bodyHalfH = ((srcBotY - (28 + srcNeckOffsetY)) * 0.48) * srcScaleY;

    function getBottleBodyPoseFromLip(lipScreenX, lipScreenY, curDeg) {
      const dxPx = (50 - pivotSvgX) * srcScaleX;
      const dyPx = (bodyMidSvgY - pivotSvgY) * srcScaleY;
      const rad = (curDeg * Math.PI) / 180.0;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);
      return {
        cx: lipScreenX + dxPx * cosA - dyPx * sinA,
        cy: lipScreenY + dxPx * sinA + dyPx * cosA,
        deg: curDeg,
        halfW: bodyHalfW,
        halfH: bodyHalfH,
        w: bodyHalfW * 2,
        h: bodyHalfH * 2
      };
    }

    const trailHistory = [];
    function pushTrailPose(pose, isMoving) {
      if (isMoving) {
        trailHistory.push(pose);
        if (trailHistory.length > 7) trailHistory.shift();
      } else if (trailHistory.length > 0) {
        trailHistory.shift();
      }
    }

    const mySessionId = gameSessionId;
    const pourId = `${srcIdx}_${dstIdx}_${Date.now()}`;
    window._activeCanvasPours = window._activeCanvasPours || {};

    // 倾倒水柱结束瞬间（无需等待源瓶飞回），立即结算目标瓶满瓶压塞、盲盒揭晓与机关破除！
    function resolvePourCompletionEffects(flushedSynchronously = false) {
      if (dstConsequencesResolved || mySessionId !== gameSessionId) return;
      dstConsequencesResolved = true;
      const pIdx = pendingLogicalResolvers.indexOf(syncPourResolver);
      if (pIdx !== -1) pendingLogicalResolvers.splice(pIdx, 1);
      dstBottle._pouringDst = false;


      let revealedMysteryLayerIdx = null;
      let revealedMysteryColorKey = null;
      if (srcBottle.mysteryCount && srcBottle.mysteryCount > 0 && srcBottle.layers.length <= srcBottle.mysteryCount) {
        revealedMysteryLayerIdx = srcBottle.layers.length - 1;
        revealedMysteryColorKey = srcBottle.layers[revealedMysteryLayerIdx];
        srcBottle.mysteryCount = Math.max(0, srcBottle.layers.length - 1);
      }

      pourCountTotal++;
      const brokenObstacles = [];

      // A. 单向出水古瓶 (one_way_out) 排空后解除封口化为普通空瓶
      let ancientVanished = false;
      if (srcBottle.special === 'one_way_out' && srcBottle.layers.length === 0) {
        srcBottle.special = 'none';
        srcBottle.countdownMoves = null;
        ancientVanished = true;
      }

      // B. 星砂流沙炸弹 (countdownMoves) 排空或集满解除危机
      let bombDefusedIdx = null;
      if (srcBottle.countdownMoves && srcBottle.countdownMoves > 0 && srcBottle.layers.length === 0) {
        srcBottle.countdownMoves = null;
        bombDefusedIdx = srcIdx;
      }
      if (dstBottle.countdownMoves && dstBottle.countdownMoves > 0 && isCompleteBottle(dstBottle)) {
        dstBottle.countdownMoves = null;
        bombDefusedIdx = dstIdx;
      }

      // C. 策略机关步进结算（有效同色合并或凑满整瓶触发破冰/解箍）
      const isEffectiveColorMerge = (initialDstLayers > 0);
      const dstWillCompleteNow = isCompleteBottle(dstBottle);
      bottles.forEach((b, bIdx) => {
        if (!b || b.removed || b.corked) return;

        if ((b.special === 'ice_base' || b.special === 'stone_base') && b.poursToBreak) {
          const wasIce = (b.special === 'ice_base');
          if (isEffectiveColorMerge || dstWillCompleteNow || bIdx === dstIdx) {
            b.poursToBreak = (bIdx === dstIdx && dstWillCompleteNow) ? 0 : (b.poursToBreak - 1);
            if (b.poursToBreak <= 0) {
              b.special = 'none';
              brokenObstacles.push({ bIdx, type: wasIce ? 'ice_shatter' : 'stone_shatter', wasIce, broke: true });
            } else {
              brokenObstacles.push({ bIdx, type: wasIce ? 'ice_crack' : 'stone_hit', wasIce, broke: false });
            }
          }
        }

        if (b.frozenTurns && b.frozenTurns > 0) {
          b.frozenTurns--;
          if (b.frozenTurns <= 0) {
            b.frozenTurns = 0;
            brokenObstacles.push({ bIdx, type: 'ice_shatter', wasIce: true, broke: true, unfreezeMouth: true });
          }
        } else if (typeof b.countdownMoves === 'number' && b.countdownMoves > 0) {
          if (b.layers.length === 0) {
            b.countdownMoves = null;
          } else {
            b.countdownMoves--;
            if (b.countdownMoves <= 0) {
              b.countdownMoves = null;
              b.frozenTurns = 3;
              brokenObstacles.push({ bIdx, type: 'ice_crack', wasIce: true, broke: false, frozeMouth: true });
            }
          }
        }
      });

      // 统一触发盲盒揭晓、古瓶解封、流沙解除、破冰碎石特效（无论本次是否满瓶都 100% 触发！）
      if (revealedMysteryLayerIdx !== null && revealedMysteryLayerIdx >= 0) {
        playSound('mystery_reveal');
        triggerBottleVFX(srcIdx, 'mystery_reveal', {
          layerIdx: revealedMysteryLayerIdx,
          colorKey: revealedMysteryColorKey
        });
        showToast(`✨ 星雾散尽：显露【${COLORS[revealedMysteryColorKey].name}】！`);
      }
      if (ancientVanished) {
        playSound('mystery_reveal');
        triggerBottleVFX(srcIdx, 'ancient_vanish');
        showToast('✨ 古瓶已排空，解锁为普通空瓶！');
      }
      if (bombDefusedIdx !== null) {
        playSound('mystery_reveal');
        triggerBottleVFX(bombDefusedIdx, 'bomb_defuse');
        showToast('✨ 流沙危机已解除！');
      }
      brokenObstacles.forEach(item => {
        playSound(item.wasIce ? 'ice_break' : 'stone_break');
        triggerBottleVFX(item.bIdx, item.type);
        if (item.frozeMouth) {
          showToast('⏳ 星砂耗尽！该瓶已被寒冰封印 3 回合（可点【重排】破除）！');
        } else if (item.unfreezeMouth) {
          showToast('❄️ 瓶口寒冰封印已消退！');
        } else if (item.broke) {
          showToast(item.wasIce ? '❄️ 共振破冰：极地霜晶座已碎裂！' : '🪨 共振碎石：曜石底座已崩解！');
        }
      });

      const cfg = getLevelConfig(currentLevelId);

      if (isCompleteBottle(dstBottle)) {
        // 若目标瓶本身带有色锁或单向漏斗，满瓶时触发解封特效
        if (dstBottle.special === 'color_lock' || dstBottle.special === 'one_way_in') {
          triggerBottleVFX(dstIdx, 'color_unlock', { colorKey: pourColorKey });
        }
        dstBottle.corked = true;
        dstBottle._corking = true;
        dstBottle.corkAnimProgress = 0;

        // 满瓶瞬间立即计入完成瓶数并第一时间解封场上的丝绸礼袍/全冰雕/羊皮盲盒袋！
        if (!dstBottle._countedInPackedTotal) {
          dstBottle._countedInPackedTotal = true;
          packedTotal++;
        }
        releaseObsoleteColorLocks();
        const unveiledNow = unlockBagOrderObstacles();
        unveiledNow.forEach(u => triggerBottleVFX(u.bIdx, u.vfxType, u.opts));

        renderAll();

        // ===================================================================
        // 满瓶四段式严格顺序动画：
        // 阶段 1 (cp: 0.00 ~ 0.38): 软木塞从高处落下并压紧塞入瓶口 (木塞塞上)
        // 阶段 2 (cp: 0.38 ~ 1.00): 木塞塞紧后触发瓶身粒子特效 (双层流光环扫过瓶身 + 环绕瓶身璀璨星光与气泡迸发 + 飞星庆典)
        // 阶段 3 (cp === 1.00): 瓶身粒子特效结束后，检查是否有对应颜色的空闲购物袋
        // 阶段 4 (matchedBagIdx !== -1): 若有对应颜色购物袋，瓶子沿抛物线飞向购物袋并滑入袋内
        // ===================================================================
        const hasBagMode = !!cfg.hasBags;
        const corkStart = performance.now();
        const corkDur = (hasBagMode ? 760 : 820) / getSpeedMultiplier();
        let slamSoundPlayed = false;
        let bodyParticleFxTriggered = false;

        function stepCorkAnim(tNow) {
          if (mySessionId !== gameSessionId) return;
          const cp = Math.min(1, (tNow - corkStart) / corkDur);
          dstBottle.corkAnimProgress = cp;

          // [阶段 1 节点]: 木塞接触并压入瓶口瞬间播放塞紧音效与震动
          if (cp >= 0.16 && !slamSoundPlayed) {
            slamSoundPlayed = true;
            playSound('cork_slam');
            triggerHaptic(15);
          }

          // [阶段 2 节点]: 木塞完全塞紧 (cp >= 0.38) 后，触发瓶身粒子特效与庆典飞星
          if (cp >= 0.38 && !bodyParticleFxTriggered) {
            bodyParticleFxTriggered = true;
            playSound('pack');
            if (typeof emitBonusStarsFromScreen === 'function') {
              const latestSlot = (layoutCache && layoutCache.bottleSlots && layoutCache.bottleSlots[dstIdx])
                ? layoutCache.bottleSlots[dstIdx].slotRect
                : dstRect;
              emitBonusStarsFromScreen(latestSlot, pourColorKey, 8);
            }
          }

          if (cp < 1) {
            requestAnimationFrame(stepCorkAnim);
          } else {
            // [阶段 3 节点]: 木塞塞好 + 瓶身粒子特效完整播放完毕，解除 _corking 并检查对应颜色购物袋
            dstBottle.corkAnimProgress = 1.0;
            dstBottle._corking = false;
            if (hasBagMode) {
              const matchedBagIdx = findMatchingOpenBagIndex(pourColorKey);
              if (matchedBagIdx !== -1) {
                // [阶段 4 节点]: 存在对应颜色购物袋，启动瓶子飞向购物袋的完整飞行动画
                packCompletedBottleIntoBag(dstIdx, pourColorKey, matchedBagIdx);
              } else {
                renderAll();
                showToast(`🍾 【${COLORS[pourColorKey].name}】已封塞！出现同色礼袋时将自动飞入！`);
                checkAndPackWaitingCorkedBottles();
              }
            } else {
              renderAll();
              if ((dstBottle.isGiantCat || bottles.every(b => b.corked || b.removed || b.layers.length === 0)) && !bottles.some(b => isBottleBusy(b))) {
                setTimeout(() => {
                  if (mySessionId === gameSessionId) showWinModal(!!dstBottle.isGiantCat);
                }, 200);
              } else {
                checkStepLimitOut();
              }
            }
          }
        }
        requestAnimationFrame(stepCorkAnim);
      } else {
        renderAll();
        checkAndPackWaitingCorkedBottles();
      }
    }

    function syncPourResolver() {
      if (window._activeCanvasPours && pourId) delete window._activeCanvasPours[pourId];
      srcBottle._pouringSrc = false;
      resolvePourCompletionEffects(true);
    }
    registerPendingLogicalResolver(syncPourResolver);

    function step(now) {
      if (mySessionId !== gameSessionId) {
        delete window._activeCanvasPours[pourId];
        return;
      }
      const elapsed = now - startTime;

      if (elapsed < moveDuration) {
        const p = elapsed / moveDuration;
        const ease = 1 - Math.pow(1 - p, 3);
        const startFlightLipX = srcLipX;
        const startFlightLipY = srcLipY + startLiftY;
        const arcLiftY = -Math.sin(p * Math.PI) * 12 * zoomScale;
        const curLipX = startFlightLipX + (targetLipX - startFlightLipX) * ease;
        const curLipY = startFlightLipY + (targetLipY - startFlightLipY) * ease + arcLiftY;
        const curDeg = startTiltDeg * ease;

        const srcLiqOpts = {
          topLayerScale: 1,
          tiltAngle: curDeg,
          pourDir,
          spillProgress: ease,
          mysteryCount: preSrcMysteryCount,
          maxCap: srcCap,
          isGiantCat: !!srcBottle.isGiantCat
        };
        const dstLiqOpts = {
          topLayerScale: 1,
          tiltAngle: 0,
          mysteryCount: preDstMysteryCount,
          maxCap: dstCap,
          isGiantCat: !!dstBottle.isGiantCat
        };

        const pose = getBottleBodyPoseFromLip(curLipX, curLipY, curDeg);
        pushTrailPose(pose, true);
        window._activeCanvasPours[pourId] = {
          active: true, phase: 'move', p, srcIdx, dstIdx, pourDir, curDeg, curLipX, curLipY, pivotSvgX, pivotSvgY,
          srcLayers: preSrcLayers, srcLiqOpts,
          dstLayers: preDstLayers, dstLiqOpts,
          trailHistory: trailHistory.slice(), bodyPose: pose, colObj, streamCtx: null
        };
        window._canvasPourState = window._activeCanvasPours[pourId];

        requestAnimationFrame(step);

      } else if (elapsed < moveDuration + pourDuration) {
        if (!soundPlayed) {
          soundPlayed = true;
          playSound('pour', {
            maxCap: dstCap,
            isGiantCat: !!dstBottle.isGiantCat,
            initialLayers: initialDstLayers,
            moveCount,
            durationMs: pourDuration
          });
        }

        const p = (elapsed - moveDuration) / pourDuration;
        const curRemainingVol = startVol - moveCount * p;
        const curDeg = pourDir * getPhysicalSpillAngleDeg(curRemainingVol, srcCap);

        const srcEndScale = (srcTopSameCount - moveCount) / Math.max(1, srcTopSameCount);
        const curSrcScale = 1 - (1 - srcEndScale) * p;
        const srcLiqOpts = {
          topLayerScale: curSrcScale,
          tiltAngle: curDeg,
          pourDir,
          spillProgress: 1,
          mysteryCount: preSrcMysteryCount,
          maxCap: srcCap,
          isGiantCat: !!srcBottle.isGiantCat
        };

        const fillP = Math.max(0, Math.min(1, (p - 0.08) / 0.92));
        const curDstScale = dstInitialScale + (1 - dstInitialScale) * fillP;
        const liveHeightRatio = Math.max(0.25, Math.min(1.2, (dstCap - (initialDstLayers + moveCount * fillP)) / dstCap));
        const liveReceiveAmp = Math.sin(fillP * Math.PI) * (0.28 + 0.42 * liveHeightRatio) * (0.85 + Math.min(2, moveCount - 1) * 0.18);
        const dstLiqOpts = {
          topLayerScale: curDstScale,
          tiltAngle: 0,
          mysteryCount: preDstMysteryCount,
          maxCap: dstCap,
          isGiantCat: !!dstBottle.isGiantCat,
          sloshPhase: p * (18 + moveCount * 4),
          sloshAmplitude: liveReceiveAmp
        };

        const currentTotalLayers = initialDstLayers + moveCount * fillP;
        const svgSurfaceY = dstBotY - currentTotalLayers * dstLayerH;
        const screenSurfaceY = dstRect.top + (svgSurfaceY - dstVbMinY) * dstScaleY;

        const spoutStartX = targetLipX;
        const spoutStartY = targetLipY - 1.0;

        const pose = getBottleBodyPoseFromLip(spoutStartX, spoutStartY, curDeg);
        pushTrailPose(pose, false);

        window._activeCanvasPours[pourId] = {
          active: true, phase: 'pour', p, srcIdx, dstIdx, pourDir, curDeg, curLipX: targetLipX, curLipY: targetLipY, pivotSvgX, pivotSvgY,
          srcLayers: preSrcLayers, srcLiqOpts,
          dstLayers: dstFullLayers, dstLiqOpts,
          trailHistory: trailHistory.slice(), bodyPose: pose, colObj,
          streamCtx: {
            spoutX: spoutStartX, spoutY: spoutStartY,
            mouthX: dstMouthX, mouthY: dstMouthY,
            surfaceY: screenSurfaceY + 2, dstRect, pourDir, colObj, pourProgress: p,
            initialDstLayers, moveCount, currentTotalLayers, dstBottle
          }
        };
        window._canvasPourState = window._activeCanvasPours[pourId];

        requestAnimationFrame(step);

      } else if (elapsed < moveDuration + pourDuration + returnDuration) {
        // 倾倒完成瞬间立即触发目标瓶结算，让目标瓶压塞/飞袋与源瓶落回并行执行！
        resolvePourCompletionEffects();

        const p = (elapsed - moveDuration - pourDuration) / returnDuration;
        const ease = 1 - Math.pow(1 - p, 3);
        const curLipX = srcLipX + (targetLipX - srcLipX) * (1 - ease);
        const curLipY = srcLipY + (targetLipY - srcLipY) * (1 - ease);
        const curDeg = endTiltDeg * (1 - ease);

        const nextSrcMystery = srcBottle.mysteryCount || 0;
        const srcLiqOpts = {
          topLayerScale: 1,
          tiltAngle: curDeg,
          pourDir,
          spillProgress: 1 - ease,
          mysteryCount: nextSrcMystery,
          maxCap: srcCap,
          isGiantCat: !!srcBottle.isGiantCat
        };

        const pose = getBottleBodyPoseFromLip(curLipX, curLipY, curDeg);
        pushTrailPose(pose, true);
        window._activeCanvasPours[pourId] = {
          active: true, phase: 'return', p, srcIdx, dstIdx, pourDir, curDeg, curLipX, curLipY, pivotSvgX, pivotSvgY,
          srcLayers: remainingSrcLayers, srcLiqOpts,
          dstLayers: null, dstLiqOpts: null,
          trailHistory: trailHistory.slice(), bodyPose: pose, colObj, streamCtx: null
        };
        window._canvasPourState = window._activeCanvasPours[pourId];

        requestAnimationFrame(step);

      } else {
        resolvePourCompletionEffects();
        delete window._activeCanvasPours[pourId];
        const remainingKeys = Object.keys(window._activeCanvasPours);
        window._canvasPourState = remainingKeys.length > 0 ? window._activeCanvasPours[remainingKeys[0]] : null;

        srcBottle._pouringSrc = false;
        if (window._bottleVisualState && window._bottleVisualState[srcIdx]) {
          window._bottleVisualState[srcIdx].liftY = 0;
          window._bottleVisualState[srcIdx].scale = 1.0;
        }

        isLevelEntering = false;
        playSound('bottle_land');
        startSettleSloshAnimation(srcIdx, 0.32);
        const cfgNow = getLevelConfig(currentLevelId);
        if (!cfgNow.hasBags && bottles.every(b => b.corked || b.removed || b.layers.length === 0) && !bottles.some(b => isBottleBusy(b))) {
          setTimeout(() => {
            if (mySessionId === gameSessionId) showWinModal(bottles.some(b => b && b.isGiantCat));
          }, 180);
        } else {
          checkStepLimitOut();
        }
      }
    }

    requestAnimationFrame(step);
  }

  function unlockBagOrderObstacles() {
    const unveiled = [];
    bottles.forEach((b, bIdx) => {
      if (!b.removed && ['silk_drape', 'full_ice', 'paper_bag'].includes(b.special) && packedTotal >= (b.unlockOrder || 1)) {
        const prevSpec = b.special;
        b.special = 'none';
        if (prevSpec === 'full_ice') {
          playSound('ice_break');
          unveiled.push({ bIdx, vfxType: 'ice_shatter', opts: { fullBody: true } });
          showToast('🧊 礼盒契约达成：极地全冰雕瓶已破冰！');
        } else if (prevSpec === 'paper_bag') {
          playSound('bag_burn');
          unveiled.push({ bIdx, vfxType: 'paper_bag_burn', opts: { coverType: 'paper_bag' } });
          showToast('🔥 礼盒契约达成：羊皮礼袋已燃尽化作灰烬消散！');
        } else {
          playSound('mystery_reveal');
          unveiled.push({ bIdx, vfxType: 'cover_unveil', opts: { coverType: prevSpec } });
          showToast('🧣 礼盒契约达成：星缎礼袍已揭幕！');
        }
      }
    });
    return unveiled;
  }

  function checkStepLimitOut() {
    const anyBusy = bottles.some(b => isBottleBusy(b));
    if (anyBusy) return;
    if (remainingMoves !== null && remainingMoves <= 0 && !bottles.every(b => b.corked || b.removed || b.layers.length === 0)) {
      showToast('⚠️ 步数已用完！');
      setTimeout(() => {
        if (remainingMoves !== null && remainingMoves <= 0 && !bottles.every(b => b.corked || b.removed || b.layers.length === 0)) {
          uiState.openModalId = 'out-of-moves-modal-mask';
        }
      }, 350);
    }
  }

  function showBagServiceBellEffect(bagSlotEl) {
    if (!bagSlotEl) return;
  }

  function findMatchingOpenBagIndex(colorKey) {
    // 严格规则：购物袋每次只出现两个（其余需点击解锁），且排除正在装瓶拎走动画中的袋子 (_busy)
    return bags.findIndex(b => b && !b.locked && !b.removed && !b.packedBottle && !b._busy && b.color === colorKey);
  }

  function isBagLevelAllCleared() {
    const cfg = getLevelConfig(currentLevelId);
    if (cfg.hasBags) {
      return bottles.every(b => b.removed || (b.layers.length === 0 && !b.corked));
    }
    return bottles.every(b => b.corked || b.removed || b.layers.length === 0);
  }

  function checkAndPackWaitingCorkedBottles() {
    const cfg = getLevelConfig(currentLevelId);
    if (!cfg.hasBags) {
      checkStepLimitOut();
      return;
    }
    for (let i = 0; i < bottles.length; i++) {
      const b = bottles[i];
      if (b && !b.removed && b.corked && !b._corking && !b._flyingToBag && b.layers.length > 0) {
        const colKey = b.layers[0];
        const matchedBagIdx = findMatchingOpenBagIndex(colKey);
        if (matchedBagIdx !== -1) {
          packCompletedBottleIntoBag(i, colKey, matchedBagIdx);
        }
      }
    }
    if (isBagLevelAllCleared() && !bottles.some(b => b && b._flyingToBag)) {
      setTimeout(() => showWinModal(false), 200);
    } else {
      checkStepLimitOut();
    }
  }



  function packCompletedBottleIntoBag(bottleIdx, colorKey, forcedBagIdx = -1) {
    const completedBottle = bottles[bottleIdx];
    if (!completedBottle || completedBottle.removed || completedBottle._flyingToBag) return;
    const wasGiantCat = !!completedBottle.isGiantCat;

    let targetBagIdx = (forcedBagIdx !== -1 && bags[forcedBagIdx] && !bags[forcedBagIdx]._busy)
      ? forcedBagIdx
      : findMatchingOpenBagIndex(colorKey);
    if (targetBagIdx === -1) {
      renderAll();
      return;
    }

    completedBottle._flyingToBag = true;
    bags[targetBagIdx]._busy = true;
    if (!completedBottle._countedInPackedTotal) {
      completedBottle._countedInPackedTotal = true;
      packedTotal++;
    }

    if (!layoutCache || window._layoutDirty) rebuildLayoutCache();
    const slotInfo = layoutCache && layoutCache.bottleSlots ? layoutCache.bottleSlots[bottleIdx] : null;
    const bRect = slotInfo && slotInfo.slotRect ? slotInfo.slotRect : makeRect(120, 360, 56, 170);
    const bagRect = (layoutCache && layoutCache.bagRects && layoutCache.bagRects[targetBagIdx])
      ? layoutCache.bagRects[targetBagIdx]
      : makeRect(60 + targetBagIdx * 80, 90, 68, 100);

    const startX = bRect.left + bRect.width * 0.5;
    const startY = bRect.top + bRect.height * 0.5;

    const mouthX = bagRect.left + bagRect.width * 0.46;
    const hoverAboveMouthY = bagRect.top - bagRect.height * 0.08;
    const bagMouthRimY = bagRect.top + bagRect.height * 0.21;
    const insideBagTargetY = bagRect.top + bagRect.height * 0.58;

    const mySessionId = gameSessionId;
    const spdMult = getSpeedMultiplier();
    // 充裕的抛物线飞行时长 + 袋口垂直滑入时长，确保玩家清晰看到加塞满瓶飞入对应颜色购物袋
    const flyDur = 390 / spdMult;
    const dropInDur = 165 / spdMult;
    const flyStart = performance.now();
    let bagLogicalSettled = false;

    function settleBagSlotLogical() {
      if (bagLogicalSettled || mySessionId !== gameSessionId) return;
      bagLogicalSettled = true;
      const pIdx = pendingLogicalResolvers.indexOf(settleBagSlotLogical);
      if (pIdx !== -1) pendingLogicalResolvers.splice(pIdx, 1);

      completedBottle.layers = [];
      completedBottle.corked = false;
      completedBottle.removed = true;
      completedBottle._flyingToBag = false;

      bags[targetBagIdx].packedBottle = null;
      bags[targetBagIdx].lastPackedColor = null;
      const nextBagColor = pickNextNeededBagColor(targetBagIdx);
      if (nextBagColor) {
        bags[targetBagIdx].color = nextBagColor;
        bags[targetBagIdx].removed = false;
      } else {
        bags[targetBagIdx].color = null;
        bags[targetBagIdx].removed = true;
      }
      bags[targetBagIdx]._busy = false;
      reconcileActiveBagsWithBottles();
    }
    registerPendingLogicalResolver(settleBagSlotLogical);

    window._activeCanvasFlyBags = window._activeCanvasFlyBags || {};
    const flyTrail = [];

    function stepFlyToBag(now) {
      if (mySessionId !== gameSessionId) {
        delete window._activeCanvasFlyBags[bottleIdx];
        return;
      }
      const elapsed = now - flyStart;
      if (elapsed < flyDur) {
        const t = elapsed / flyDur;
        const ease = 1 - Math.pow(1 - t, 2.5);
        const ctrlX = (startX + mouthX) * 0.5 + (mouthX >= startX ? -24 : 24);
        const ctrlY = Math.min(startY, hoverAboveMouthY) - 86;

        const mt = 1 - ease;
        const curX = mt * mt * startX + 2 * mt * ease * ctrlX + ease * ease * mouthX;
        const curY = mt * mt * startY + 2 * mt * ease * ctrlY + ease * ease * hoverAboveMouthY;
        const curScale = 1 - 0.56 * ease;
        const curRot = Math.sin(t * Math.PI) * (mouthX >= startX ? 16 : -16) * (1 - t * 0.35);

        const tx = curX - startX;
        const ty = curY - startY;
        flyTrail.push({ x: curX, y: curY, scale: curScale, alpha: 0.9 });
        if (flyTrail.length > 10) flyTrail.shift();
        for (let k = 0; k < flyTrail.length; k++) flyTrail[k].alpha *= 0.90;

        window._activeCanvasFlyBags[bottleIdx] = {
          active: true, phase: 1, bottleIdx, targetBagIdx, colorKey,
          tx, ty, curRot, curScale, clipBottomY: null,
          mouthX, bagMouthRimY, bagW: bagRect.width, t,
          trail: flyTrail.slice()
        };
        window._canvasFlyBagState = window._activeCanvasFlyBags[bottleIdx];
        requestAnimationFrame(stepFlyToBag);

      } else if (elapsed < flyDur + dropInDur) {
        const t2 = (elapsed - flyDur) / dropInDur;
        const ease2 = t2 * (2 - t2);
        const curX = mouthX;
        const curY = hoverAboveMouthY + (insideBagTargetY - hoverAboveMouthY) * ease2;
        const curScale = 0.44 - 0.06 * ease2;
        const tx = curX - startX;
        const ty = curY - startY;

        for (let k = 0; k < flyTrail.length; k++) flyTrail[k].alpha *= 0.80;

        window._activeCanvasFlyBags[bottleIdx] = {
          active: true, phase: 2, bottleIdx, targetBagIdx, colorKey,
          tx, ty, curRot: 0, curScale, clipBottomY: bagMouthRimY,
          mouthX, bagMouthRimY, bagW: bagRect.width, t2,
          trail: flyTrail.slice()
        };
        window._canvasFlyBagState = window._activeCanvasFlyBags[bottleIdx];
        requestAnimationFrame(stepFlyToBag);

      } else {
        delete window._activeCanvasFlyBags[bottleIdx];
        const remFlyKeys = Object.keys(window._activeCanvasFlyBags);
        window._canvasFlyBagState = remFlyKeys.length > 0 ? window._activeCanvasFlyBags[remFlyKeys[0]] : null;

        completedBottle.layers = [];
        completedBottle.corked = false;
        completedBottle.removed = true;
        completedBottle._flyingToBag = false;

        if (!bagLogicalSettled) {
          bags[targetBagIdx].color = colorKey;
          bags[targetBagIdx].packedBottle = colorKey;
        }

        releaseObsoleteColorLocks();
        const unveiledList = unlockBagOrderObstacles();

        renderAll();
        playSound('service_bell');
        window._canvasBagAnimMap = window._canvasBagAnimMap || {};
        window._canvasBagAnimMap[targetBagIdx] = {
          type: 'bounce',
          startTime: performance.now(),
          duration: 185 / spdMult,
          colorKey
        };
        unveiledList.forEach(u => triggerBottleVFX(u.bIdx, u.vfxType, u.opts));

        setTimeout(() => {
          if (mySessionId !== gameSessionId) return;
          window._canvasBagAnimMap[targetBagIdx] = {
            type: 'carry_away',
            startTime: performance.now(),
            duration: 240 / spdMult,
            colorKey
          };
          playSound('bag_whoosh');

          setTimeout(() => {
            if (mySessionId !== gameSessionId) return;
            settleBagSlotLogical();

            if ((wasGiantCat || isBagLevelAllCleared()) && !bottles.some(b => isBottleBusy(b))) {
              if (window._canvasBagAnimMap) delete window._canvasBagAnimMap[targetBagIdx];
              renderAll();
              showWinModal(wasGiantCat);
              return;
            }

            renderAll();
            if (!bags[targetBagIdx].removed) {
              window._canvasBagAnimMap = window._canvasBagAnimMap || {};
              window._canvasBagAnimMap[targetBagIdx] = {
                type: 'drop_in',
                startTime: performance.now(),
                duration: 195 / spdMult
              };
              playSound('bag_drop');
            } else if (window._canvasBagAnimMap) {
              delete window._canvasBagAnimMap[targetBagIdx];
            }

            checkAndPackWaitingCorkedBottles();

            setTimeout(() => {
              if (mySessionId !== gameSessionId) return;
              if (window._canvasBagAnimMap) delete window._canvasBagAnimMap[targetBagIdx];
              renderAll();
              checkAndPackWaitingCorkedBottles();
            }, 195 / spdMult);
          }, 240 / spdMult);
        }, 165 / spdMult);
      }
    }

    requestAnimationFrame(stepFlyToBag);
  }

  function findBestPourMove() {
    let bestMove = null;
    let bestScore = -1e9;

    for (let i = 0; i < bottles.length; i++) {
      const src = bottles[i];
      if (!canSelectBottleNoToast(src)) continue;
      const pourCol = src.layers[src.layers.length - 1];
      const srcRevealedStart = src.mysteryCount || 0;
      let srcTopSame = 0;
      for (let k = src.layers.length - 1; k >= srcRevealedStart; k--) {
        if (src.layers[k] === pourCol) srcTopSame++;
        else break;
      }
      const isSrcPure = (srcRevealedStart === 0 && srcTopSame === src.layers.length);

      for (let j = 0; j < bottles.length; j++) {
        if (i === j) continue;
        const dst = bottles[j];
        if (!canPourInto(src, dst)) continue;

        const dstCap = dst.maxCap || 4;
        const freeSpace = dstCap - dst.layers.length;

        // 避免把纯色瓶倒入同尺寸空瓶做无意义搬家（但高低异形关中，将纯色水倒入恰好匹配其层数的空瓶可直接满瓶落塞！）
        const isExactFitEmpty = (dst.layers.length === 0 && dstCap === src.layers.length && dstCap !== (src.maxCap || 4));
        if (dst.layers.length === 0 && isSrcPure && dst.special !== 'color_lock' && dstCap <= (src.maxCap || 4) && !isExactFitEmpty) {
          continue;
        }
        // 避免将未凑齐的杂色误倒入单向漏斗瓶
        if (dst.special === 'one_way_in' && dst.layers.length === 0 && srcTopSame < dstCap) {
          continue;
        }

        let score = 0;
        const matchesOpenBag = bags && bags.some(bg => bg && !bg.locked && !bg.removed && !bg.packedBottle && bg.color === pourCol);
        if (matchesOpenBag) score += 68;
        if (dst.special === 'ice_base' || dst.special === 'stone_base') score += 65;
        if (dst.special === 'color_lock' && dst.requiredColor === pourCol) score += 75;
        if (dst.special === 'one_way_in') score += 55;
        if (dst.layers.length > 0) {
          score += 100;
          // 如果能一次性把源瓶顶层同色全部转移过去，防止拆分同色层
          if (freeSpace >= srcTopSame) score += 50;
          // 如果倒入后能直接凑满目标瓶
          if (dst.layers.length + Math.min(freeSpace, srcTopSame) === dstCap) score += 80;
          // 如果倒出后能揭开源瓶下方的星雾盲盒
          if (src.mysteryCount > 0 && src.layers.length - Math.min(freeSpace, srcTopSame) <= src.mysteryCount) {
            score += 70;
          }
          // 如果能排空单向古瓶或解除流沙炸弹
          if (src.special === 'one_way_out' && srcTopSame <= freeSpace && src.layers.length === srcTopSame) {
            score += 90;
          }
        } else {
          // 目标为空瓶
          score += isExactFitEmpty ? 220 : 25;
          if (src.mysteryCount > 0 && src.layers.length - srcTopSame <= src.mysteryCount) score += 45;
          if (new Set(src.layers).size > 1) score += 20;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMove = { srcIdx: i, dstIdx: j };
        }
      }
    }
    return bestMove;
  }

  function executeSmartHintOrRefresh() {
    const move = findBestPourMove();
    if (move) {
      stopSelectSloshAnimation();
      activeHintPair = { srcIdx: move.srcIdx, dstIdx: move.dstIdx };
      selectedIndex = move.srcIdx;
      playSound('select');
      renderAll();
      startSelectSloshAnimation(move.srcIdx);

      const pourColKey = bottles[move.srcIdx].layers[bottles[move.srcIdx].layers.length - 1];
      const colName = (COLORS[pourColKey] && COLORS[pourColKey].name) || '秘药';
      showToast(`💡 提示：将 ①号瓶的【${colName}】倒入 ②号瓶！`);
      return;
    }

    // 若盘面确实无任何可倒步，直接智能重排盘面并在重排后给出下一步提示
    moveHistory.push(cloneState());
    const pool = [];
    const editableBottles = [];
    bottles.forEach(b => {
      if (!b.removed && !b.corked && !b.isGiantCat && !['silk_drape', 'full_ice', 'paper_bag', 'ad_cam', 'ad_cam_blue', 'one_way_in'].includes(b.special)) {
        while (b.layers.length > 0) pool.push(b.layers.pop());
        b.mysteryCount = 0;
        b.frozenTurns = 0;
        editableBottles.push(b);
      }
    });
    pool.sort();
    editableBottles.forEach(b => {
      if (b.special === 'color_lock' && b.requiredColor) {
        const cap = b.maxCap || 4;
        for (let k = pool.length - 1; k >= 0 && b.layers.length < cap - 1; k--) {
          if (pool[k] === b.requiredColor) {
            b.layers.push(pool.splice(k, 1)[0]);
          }
        }
      }
    });
    editableBottles.forEach(b => {
      if (b.special !== 'color_lock') {
        const cap = b.maxCap || 4;
        while (b.layers.length < cap && pool.length > 0) {
          b.layers.push(pool.pop());
        }
      }
    });
    playSound('pack');
    const afterMove = findBestPourMove();
    if (afterMove) {
      activeHintPair = { srcIdx: afterMove.srcIdx, dstIdx: afterMove.dstIdx };
      selectedIndex = afterMove.srcIdx;
    }
    renderAll();
    showToast('✨ 已为您破局重排并标出下一步倒水提示！');
  }


  function unlockAllSpecials() {
    moveHistory.push(cloneState());
    let hadBagBurn = false;
    bottles.forEach((b, idx) => {
      if (b.removed) return;
      if (b.special === 'paper_bag') {
        hadBagBurn = true;
        triggerBottleVFX(idx, 'paper_bag_burn', { coverType: 'paper_bag' });
      } else if (b.special === 'silk_drape') {
        triggerBottleVFX(idx, 'cover_unveil', { coverType: 'silk_drape' });
      } else if (b.special === 'ice_base' || b.special === 'full_ice' || b.frozenTurns) {
        triggerBottleVFX(idx, 'ice_shatter', { fullBody: b.special === 'full_ice' });
      } else if (b.special === 'stone_base') {
        triggerBottleVFX(idx, 'stone_shatter');
      } else if (b.special === 'color_lock') {
        triggerBottleVFX(idx, 'color_unlock', { colorKey: b.requiredColor || 'blue' });
      } else if (b.special !== 'none' || (b.mysteryCount && b.mysteryCount > 0) || b.countdownMoves) {
        triggerBottleVFX(idx, 'bomb_defuse');
      }
      b.special = 'none';
      b.requiredColor = null;
      b.mysteryCount = 0;
      b.countdownMoves = null;
      b.frozenTurns = 0;
    });
    bags.forEach((bg, idx) => {
      if (bg.locked) {
        const nextC = pickNextNeededBagColor(idx);
        if (nextC) {
          bg.locked = false;
          bg.removed = false;
          bg.color = nextC;
        }
      }
    });
    reconcileActiveBagsWithBottles();
    if (remainingMoves !== null) remainingMoves += 10;
    playSound(hadBagBurn ? 'bag_burn' : 'pack');
    showToast('⚡ 已一键解除当前关全部封印、流沙与空瓶！');
    renderAll();
    setTimeout(() => checkAndPackWaitingCorkedBottles(), 180);
  }


  function canSelectBottleNoToast(b) {
    return b && !isBottleBusy(b) && !b.removed && !b.corked && !b.isGiantCat && !(b.frozenTurns > 0) && ['none', 'one_way_out', 'color_lock'].includes(b.special) && b.layers.length > 0 && !isCompleteBottle(b);
  }

  function openLevelSelector() {
    currentChapterTab = Math.floor((currentLevelId - 1) / 40);
    renderLevelModalCards();
    uiState.openModalId = 'level-modal-mask';
    playSound('modal_open');
  }

  function syncHandbookModalContent(hIdx) {
    const total = HANDBOOK_KEYS.length;
    window._handbookIdx = ((hIdx % total) + total) % total;
  }

  function openRulesHelpModal() {
    const cfg = getLevelConfig(currentLevelId);
    let activeKey = cfg.introMechanicKey;
    if (!activeKey) {
      if (bottles.some(b => b && b.isGiantCat)) activeKey = 'giant_cat';
      else if (bottles.some(b => b && b.countdownMoves > 0)) activeKey = 'hourglass_bomb';
      else if (bottles.some(b => b && b.special === 'color_lock')) activeKey = 'color_lock';
      else if (bottles.some(b => b && b.special === 'one_way_in')) activeKey = 'one_way_in';
      else if (bottles.some(b => b && b.special === 'one_way_out')) activeKey = 'one_way_out';
      else if (bottles.some(b => b && (b.special === 'full_ice' || b.special === 'stone_base'))) activeKey = 'grand_obstacles';
      else if (bottles.some(b => b && (b.special === 'silk_drape' || b.special === 'paper_bag'))) activeKey = 'silk_drape';
      else if (bottles.some(b => b && b.special === 'ice_base')) activeKey = 'ice_base';
      else if (bottles.some(b => b && b.mysteryCount > 0)) activeKey = 'mystery';
      else if (cfg.isVariedHeight) activeKey = 'varied_height';
      else if (bottles.some(b => b && b.maxCap === 8)) activeKey = 'tall_8';
      else activeKey = 'basic_rule';
    }
    const startIdx = Math.max(0, HANDBOOK_KEYS.indexOf(activeKey));
    window._handbookActiveLevelKey = activeKey;
    syncHandbookModalContent(startIdx);
    uiState.openModalId = 'mechanic-modal-mask';
    playSound('modal_open');
  }

  function executeAddBottleAction() {
    activeHintPair = null;
    if (addBottleUses <= 0) {
      addBottleUses = 2;
      playSound('pack');
      showToast('🎬 已为您免费补充 +2 次【+空瓶】道具！');
      renderAll();
      return;
    }

    const camIdx = bottles.findIndex(b => b && !b.removed && (b.special === 'ad_cam' || b.special === 'ad_cam_blue'));
    const removedIdx = bottles.findIndex(b => b && b.removed);
    if (camIdx === -1 && removedIdx === -1 && bottles.length >= 12) {
      playSound('invalid');
      showToast('🍾 当前盘面已达 12 瓶上限，可使用【重排】或【提示】');
      return;
    }

    moveHistory.push(cloneState());
    addBottleUses = Math.max(0, addBottleUses - 1);

    if (camIdx !== -1) {
      bottles[camIdx].special = 'none';
      window._layoutDirty = true;
      renderAll();
      playSound('pack');
      triggerBottleVFX(camIdx, 'ad_unlock', { colorKey: 'cyan' });
      showToast('🍾 已为您解锁盘面上的备用琉璃空瓶！');
      return;
    }

    if (removedIdx !== -1) {
      const slotB = bottles[removedIdx];
      slotB.removed = false;
      slotB.corked = false;
      slotB.maxCap = 4;
      slotB.layers = [];
      slotB.special = 'none';
      slotB.requiredColor = null;
      slotB.mysteryCount = 0;
      slotB.countdownMoves = null;
      slotB.frozenTurns = 0;
      window._layoutDirty = true;
      renderAll();
      playSound('pack');
      triggerBottleVFX(removedIdx, 'ad_unlock', { colorKey: 'yellow' });
      showToast('🍾 已在空缺槽位补充 +1 个 4 层琉璃空瓶！');
      return;
    }

    const newIdx = bottles.length;
    bottles.push({ id: newIdx, maxCap: 4, layers: [], special: 'none', mysteryCount: 0, corked: false });
    window._layoutDirty = true;
    renderAll();
    playSound('pack');
    setTimeout(() => triggerBottleVFX(newIdx, 'ad_unlock', { colorKey: 'yellow' }), 30);
    showToast('🍾 已为您新增 +1 个 4 层琉璃空瓶！');
  }

  function executeUndoAction() {
    flushAllInFlightLogicalStates();
    if (undoUses <= 0) {
      undoUses = 3;
      playSound('pack');
      showToast('🎬 已为您免费补充 +3 次撤回机会！');
      renderAll();
      return;
    }
    if (moveHistory.length === 0) {
      showToast('当前已是初始状态');
      return;
    }
    stopSelectSloshAnimation();
    if (entranceSloshRaf) { cancelAnimationFrame(entranceSloshRaf); entranceSloshRaf = null; }
    resetActiveCanvasAnimations();
    const prev = moveHistory.pop();
    bottles = prev.bottles;
    bags = prev.bags;
    packedTotal = prev.packedTotal;
    pourCountTotal = prev.pourCountTotal || 0;
    remainingMoves = prev.remainingMoves;
    shuffleUses = prev.shuffleUses;
    if (typeof prev.addBottleUses === 'number') addBottleUses = prev.addBottleUses;
    undoUses = Math.max(0, (undoUses || 1) - 1);
    selectedIndex = null;
    activeHintPair = null;
    playSound('btn_undo');
    showToast('↩️ 已为您撤回至上一步');
    renderAll();
    startLevelEntranceSlosh();
  }

  function executeDockAction(id) {
    if (id === 'dock-restart-btn') {
      if (isAnimating) return;
      initGame();
      playSound('btn_restart');
      showToast('🔄 当前关卡已重新开始');
    } else if (id === 'shuffle-btn') {
      if (isAnimating) return;
      executeShuffleRemainingLiquid();
    } else if (id === 'undo-btn') {
      executeUndoAction();
    } else if (id === 'hint-btn') {
      if (isAnimating) return;
      executeSmartHint();
    } else if (id === 'add-bottle-btn') {
      executeAddBottleAction();
    }
  }

  function showWinModal(wasGiantCat) {
    streakWins = (streakWins % 2) + 1;
    const cfg = getLevelConfig(currentLevelId);
    const userSteps = Math.max(1, pourCountTotal);
    const optSteps = cfg.optimalMoves || 17;
    const diff = Math.max(0, userSteps - optSteps);

    uiState.winBadgeText = wasGiantCat ? '灵猫关通关' : '过关成功';
    uiState.scoreUserMoves = `${userSteps} 步`;
    uiState.scoreOptMoves = `${optSteps} 步`;
    uiState.scoreDiffMoves = `+${diff}`;

    let praise = '✨ 步数控制非常出色！';
    if (diff === 0) praise = '🏆 完美达成理论最少步数！';
    else if (diff > 6) praise = '🎉 顺利通关，手感越来越好了！';
    uiState.scorePraiseLine = praise;

    uiState.openModalId = 'modal-mask';
    playSound('pack');
    if (typeof launchWinCelebrationConfetti === 'function') {
      launchWinCelebrationConfetti();
    }
  }

  function initGame() {
    stopSelectSloshAnimation();
    if (entranceSloshRaf) cancelAnimationFrame(entranceSloshRaf);
    currentLevelAttemptSeed = Math.floor(Math.random() * 1000000000);
    const cfg = getLevelConfig(currentLevelId);
    bottles = cfg.bottles();
    bags = cfg.hasBags ? JSON.parse(JSON.stringify(cfg.bags)) : [];
    const filledCapsTotal = bottles.reduce((acc, b) => acc + (b && !b.isGiantCat && b.layers && b.layers.length > 0 ? 1 : 0), 0);
    const totalLiquidLayers = bottles.reduce((acc, b) => acc + (b && b.layers ? b.layers.length : 0), 0);
    levelTargetTotalBottles = cfg.isCatBossLevel ? 8 : Math.max(1, cfg.isVariedHeight ? filledCapsTotal : Math.round(totalLiquidLayers / (bottles[0]?.maxCap || 4)));
    remainingMoves = cfg.moveLimit;
    packedTotal = 0;
    pourCountTotal = 0;
    selectedIndex = null;
    activeHintPair = null;
    isAnimating = false;
    resetActiveCanvasAnimations();
    moveHistory = [];
    shuffleUses = 3;
    hintUses = 3;
    undoUses = 5;
    addBottleUses = 2;
    uiState.openModalId = null;
    uiState.bottleRejectMap = {};
    if (cfg.hasBags) reconcileActiveBagsWithBottles();
    isLevelEntering = true;
    renderAll();
    startLevelEntranceSlosh();
    setTimeout(() => {
      isLevelEntering = false;
    }, 650);
    checkAndShowMechanicIntro();
  }

  const bgDust = [];
  for (let i = 0; i < 24; i++) {
    bgDust.push({
      x: Math.random(),
      y: Math.random(),
      r: 1.2 + Math.random() * 2.2,
      alpha: 0.25 + Math.random() * 0.55,
      speedY: -0.00015 - Math.random() * 0.00025,
      phase: Math.random() * Math.PI * 2
    });
  }

  const streamStars = [];
  const flyingBonusStars = [];
  const winConfettiParticles = [];
  const topShockwaves = [];

  function spawnStreamStar() {
    streamStars.push({
      t: Math.random() * 0.12,
      speed: 0.0040 + Math.random() * 0.0035,
      size: 4.0 + Math.random() * 6.5,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06,
      branch: Math.random() > 0.42 ? 0 : 1
    });
  }
  for (let i = 0; i < 12; i++) {
    spawnStreamStar();
    streamStars[i].t = i / 12;
  }

  // 预烘焙 64x64 发光金星精灵图（避免每帧在循环中重复调用 createRadialGradient）
  let _glowStarSprite = null;
  function getGlowStarSprite() {
    if (_glowStarSprite) return _glowStarSprite;
    try {
      const sp = createOffscreenCanvas(64, 64);
      sp.width = 64; sp.height = 64;
      const sc = sp.getContext('2d');
      if (!sc) return null;
      sc.translate(32, 32);
      const halo = sc.createRadialGradient(0, 0, 1, 0, 0, 28);
      halo.addColorStop(0, 'rgba(255, 252, 215, 0.96)');
      halo.addColorStop(0.45, 'rgba(255, 224, 92, 0.48)');
      halo.addColorStop(1, 'rgba(255, 195, 45, 0)');
      sc.fillStyle = halo;
      sc.beginPath();
      sc.arc(0, 0, 28, 0, Math.PI * 2);
      sc.fill();

      sc.fillStyle = '#fffbeb';
      sc.strokeStyle = '#f59e0b';
      sc.lineWidth = 1.6;
      sc.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = (i % 2 === 0) ? 13 : 5.5;
        const a = (i * Math.PI) / 5 - Math.PI * 0.5;
        if (i === 0) sc.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else sc.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      sc.closePath();
      sc.fill();
      sc.stroke();
      _glowStarSprite = sp;
    } catch (e) { }
    return _glowStarSprite;
  }

  function drawGlowingStar2D(c, x, y, r, rot, alpha) {
    if (alpha <= 0.01 || r <= 0.2) return;
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.globalAlpha = Math.max(0, Math.min(1, alpha));
    const sp = getGlowStarSprite();
    if (sp) {
      const d = r * 4.4;
      c.drawImage(sp, -d * 0.5, -d * 0.5, d, d);
    } else {
      c.fillStyle = '#fde047';
      c.beginPath();
      c.arc(0, 0, r, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  function emitBonusStarsFromScreen(dstRect, colorKey, count = 7) {
    if (!dstRect) return;
    const startX = dstRect.left + dstRect.width * 0.5;
    const startY = dstRect.top + 14;
    topShockwaves.push({ x: startX, y: startY, r: 6, maxR: 38, alpha: 0.95 });

    let targetBagRect = null;
    const cfg = getLevelConfig(currentLevelId);
    if (cfg && cfg.hasBags && Array.isArray(bags)) {
      const matchIdx = bags.findIndex(bg => bg && !bg.removed && !bg.locked && !bg.filled && !bg.reserved && bg.color === colorKey);
      if (matchIdx !== -1) {
        if (!layoutCache || window._layoutDirty) rebuildLayoutCache();
        if (layoutCache && layoutCache.bagRects && layoutCache.bagRects[matchIdx]) {
          targetBagRect = layoutCache.bagRects[matchIdx];
        }
      }
    }

    const endX = targetBagRect ? (targetBagRect.left + targetBagRect.width * 0.5) : startX;
    const endY = targetBagRect ? (targetBagRect.top + targetBagRect.height * 0.35) : (dstRect.bottom - 10);

    for (let i = 0; i < count; i++) {
      const spreadX = (i - (count - 1) * 0.5) * 22;
      const ctrlX = (startX + endX) * 0.5 + spreadX * (targetBagRect ? 1.35 : 1.8);
      const ctrlY = Math.min(startY, endY) - (42 + (i % 3) * 18);
      flyingBonusStars.push({
        startX,
        startY,
        ctrlX,
        ctrlY,
        endX: endX + (targetBagRect ? (i - 3) * 3 : (i - 3) * 6),
        endY,
        t: -i * 0.045,
        size: 5.2 + (i % 3) * 1.4,
        rot: i * 0.8,
        drawRibbon: !!targetBagRect && i === 0,
        shockwaveTarget: (i === count - 1) ? { x: endX, y: endY, maxR: targetBagRect ? 44 : 34 } : null
      });
    }
  }

  function launchWinCelebrationConfetti() {
    spawnWinConfetti();
    const w = window.innerWidth || 412;
    const h = window.innerHeight || 860;
    topShockwaves.push({ x: w * 0.5, y: h * 0.42, r: 12, maxR: 130, alpha: 0.95 });
  }

  function spawnWinConfetti() {
    const w = window.innerWidth || 412;
    const h = window.innerHeight || 860;
    const palette = ['#fde047', '#fb7185', '#38bdf8', '#4ade80', '#c084fc', '#fb923c', '#ffffff'];
    winConfettiParticles.length = 0;
    for (let i = 0; i < 60; i++) {
      const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * 1.25;
      const speed = 6 + Math.random() * 9.5;
      winConfettiParticles.push({
        x: w * (0.2 + Math.random() * 0.6),
        y: h * 0.52 + (Math.random() - 0.5) * 50,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        g: 0.18 + Math.random() * 0.08,
        w: 7 + Math.random() * 6,
        h: 5 + Math.random() * 5,
        rot: Math.random() * Math.PI * 2,
        rotSpd: (Math.random() - 0.5) * 0.22,
        color: palette[i % palette.length],
        isStar: (i % 5 === 0),
        life: 1.0,
        decay: 0.009 + Math.random() * 0.006
      });
    }
  }

  // 直接在主画布上下文绘制背景萤火微粒、飞星流光与礼花（合并单循环，0 全屏副画布拷贝开销！）
  function drawBgStarFXDirectToCtx(targetCtx, w, h, nowMs) {
    if (!targetCtx) return;
    const timeSec = nowMs * 0.001;

    // 1. 绘制背景暖色萤火微粒
    targetCtx.save();
    targetCtx.fillStyle = '#fff5c0';
    for (let i = 0; i < bgDust.length; i++) {
      const d = bgDust[i];
      d.y += d.speedY;
      if (d.y < 0) d.y = 1.0;
      const twinkle = 0.55 + 0.45 * Math.sin(timeSec * 2.2 + d.phase);
      targetCtx.globalAlpha = d.alpha * twinkle * 0.45;
      targetCtx.beginPath();
      targetCtx.arc(d.x * w, d.y * h, d.r, 0, Math.PI * 2);
      targetCtx.fill();
    }
    targetCtx.restore();

    // 2. 当有飞向礼袋的飞星时，绘制连接水瓶与礼袋的流光金弧
    if (flyingBonusStars.length > 0 && flyingBonusStars[0].drawRibbon) {
      const refStar = flyingBonusStars[0];
      const ribbonAlpha = Math.sin(Math.max(0, Math.min(1, refStar.t)) * Math.PI) * 0.72;
      if (ribbonAlpha > 0.02) {
        targetCtx.save();
        targetCtx.strokeStyle = `rgba(255, 244, 155, ${ribbonAlpha.toFixed(2)})`;
        targetCtx.lineWidth = 2.4;
        targetCtx.beginPath();
        targetCtx.moveTo(refStar.startX, refStar.startY);
        targetCtx.quadraticCurveTo(refStar.ctrlX, refStar.ctrlY, refStar.endX, refStar.endY);
        targetCtx.stroke();
        targetCtx.restore();
      }
    }

    // 3. 绘制瓶口/麻布底座/礼袋处的金光扩散冲击波环
    for (let i = topShockwaves.length - 1; i >= 0; i--) {
      const sw = topShockwaves[i];
      sw.r += (sw.maxR - sw.r) * 0.16;
      sw.alpha -= 0.045;
      if (sw.alpha <= 0.02) {
        topShockwaves.splice(i, 1);
        continue;
      }
      targetCtx.save();
      targetCtx.strokeStyle = `rgba(255, 248, 175, ${sw.alpha.toFixed(2)})`;
      targetCtx.lineWidth = 2.6 * sw.alpha;
      targetCtx.beginPath();
      targetCtx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      targetCtx.stroke();
      targetCtx.restore();
    }

    // 4. 绘制满瓶触发的飞星
    for (let i = flyingBonusStars.length - 1; i >= 0; i--) {
      const bs = flyingBonusStars[i];
      bs.t += 0.038;
      if (bs.t < 0) continue;
      if (bs.t >= 1.0) {
        if (bs.shockwaveTarget) {
          topShockwaves.push({
            x: bs.shockwaveTarget.x,
            y: bs.shockwaveTarget.y,
            r: 8,
            maxR: bs.shockwaveTarget.maxR || 40,
            alpha: 0.9
          });
        }
        flyingBonusStars.splice(i, 1);
        continue;
      }
      const t = bs.t;
      const x = (1 - t) * (1 - t) * bs.startX + 2 * (1 - t) * t * bs.ctrlX + t * t * bs.endX;
      const y = (1 - t) * (1 - t) * bs.startY + 2 * (1 - t) * t * bs.ctrlY + t * t * bs.endY;
      const alpha = Math.sin(t * Math.PI * 0.92 + 0.08);
      drawGlowingStar2D(targetCtx, x, y, bs.size * (1 - t * 0.25), bs.rot + t * 4, alpha);
    }

    // 5. 绘制通关礼花与金星喷发
    for (let i = winConfettiParticles.length - 1; i >= 0; i--) {
      const p = winConfettiParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.vx *= 0.985;
      p.rot += p.rotSpd;
      p.life -= p.decay;
      if (p.life <= 0 || p.y > h + 30) {
        winConfettiParticles.splice(i, 1);
        continue;
      }
      if (p.isStar) {
        drawGlowingStar2D(targetCtx, p.x, p.y, p.w * 0.9, p.rot, p.life);
      } else {
        targetCtx.save();
        targetCtx.translate(p.x, p.y);
        targetCtx.rotate(p.rot);
        targetCtx.globalAlpha = Math.max(0, Math.min(1, p.life));
        targetCtx.fillStyle = p.color;
        targetCtx.fillRect(-p.w * 0.5, -p.h * 0.5, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
        targetCtx.restore();
      }
    }
  }


  initGame();

  // ============================================================================
  // 13. 纯原生 Canvas 2D 极速渲染与触控引擎 (100% 零 DOM 结构 / 离屏缓存加速)
  // ============================================================================
  (function initPureCanvas2DEngine() {
    const canvas = mainScreenCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let dpr = Math.min(_g.devicePixelRatio || 2, 2.5);
    let viewW = _g.innerWidth || 412;
    let viewH = _g.innerHeight || 860;
    window._layoutDirty = true;
    let bgOffscreenDirty = true;
    let lastRenderedThemeId = null;

    function syncCanvasSize() {
      const newDpr = Math.min(_g.devicePixelRatio || 2, 2.5);
      const newW = _g.innerWidth || 412;
      const newH = _g.innerHeight || 860;
      if (newW !== viewW || newH !== viewH || newDpr !== dpr || canvas.width !== Math.round(newW * newDpr) || window._bgOffscreenDirty) {
        dpr = newDpr;
        viewW = newW;
        viewH = newH;
        canvas.width = Math.round(viewW * dpr);
        canvas.height = Math.round(viewH * dpr);
        bgOffscreenDirty = true;
        window._bgOffscreenDirty = false;
        window._layoutDirty = true;
      }
    }
    _g.addEventListener('resize', () => { syncCanvasSize(); window._layoutDirty = true; });
    syncCanvasSize();

    // ---------------- 1. 静态主题背景离屏缓存（仅在切主题或窗口缩放时重绘一次！） ----------------
    const bgOffscreen = createOffscreenCanvas(Math.round(viewW * dpr), Math.round(viewH * dpr));
    bgOffscreenDirty = true;
    lastRenderedThemeId = null;

    function getThemeBackgroundCanvas(w, h) {
      const theme = activeThemeId || 'zen_amber';
      const targetW = Math.max(1, Math.round(w * dpr));
      const targetH = Math.max(1, Math.round(h * dpr));
      if (!bgOffscreenDirty && lastRenderedThemeId === theme && bgOffscreen.width === targetW && bgOffscreen.height === targetH) {
        return bgOffscreen;
      }
      bgOffscreenDirty = false;
      lastRenderedThemeId = theme;
      if (bgOffscreen.width !== targetW) bgOffscreen.width = targetW;
      if (bgOffscreen.height !== targetH) bgOffscreen.height = targetH;
      const bCtx = bgOffscreen.getContext('2d');
      bCtx.save();
      bCtx.scale(dpr, dpr);

      const deskY = h * 0.65;

      if (theme === 'zen_amber') {
        // 1. 秘药工坊主渐变
        const base = bCtx.createLinearGradient(0, 0, w * 0.9, h);
        base.addColorStop(0, '#b59756');
        base.addColorStop(0.28, '#d3ab55');
        base.addColorStop(0.56, '#da9b43');
        base.addColorStop(0.88, '#88986b');
        base.addColorStop(1, '#6f8661');
        bCtx.fillStyle = base;
        bCtx.fillRect(0, 0, w, h);

        const warmMid = bCtx.createRadialGradient(w * 0.30, h * 0.56, 10, w * 0.30, h * 0.56, Math.max(w, h) * 0.62);
        warmMid.addColorStop(0, 'rgba(231, 164, 68, 0.90)');
        warmMid.addColorStop(0.48, 'rgba(223, 157, 63, 0.62)');
        warmMid.addColorStop(1, 'rgba(216, 155, 68, 0)');
        bCtx.fillStyle = warmMid;
        bCtx.fillRect(0, 0, w, h);

        // 2. 克制的工坊远景剪影：顶部拱形木窗格 + 两侧博古药架剪影 + 斜射暖阳丁达尔光束
        bCtx.save();
        bCtx.fillStyle = 'rgba(110, 68, 18, 0.11)';
        // 左侧与右侧远景药架层板与微型药瓶剪影
        [0.14, 0.25].forEach((sy, idx) => {
          const yPos = h * sy;
          bCtx.fillRect(0, yPos, w * 0.22, 4);
          bCtx.fillRect(w * 0.78, yPos, w * 0.22, 4);
          // 架上微型蒸馏瓶与草药罐剪影
          bCtx.beginPath();
          bCtx.arc(w * (0.07 + idx * 0.03), yPos - 8, 6, 0, Math.PI * 2);
          bCtx.fillRect(w * (0.07 + idx * 0.03) - 2.5, yPos - 18, 5, 6);
          bCtx.roundRect(w * 0.14, yPos - 16, 10, 16, 3);
          bCtx.arc(w * (0.85 + idx * 0.02), yPos - 9, 7, 0, Math.PI * 2);
          bCtx.fillRect(w * (0.85 + idx * 0.02) - 2.5, yPos - 20, 5, 6);
          bCtx.roundRect(w * 0.91, yPos - 15, 11, 15, 3);
          bCtx.fill();
        });
        // 斜射暖阳天窗光束
        const beamG = bCtx.createLinearGradient(w * 0.15, 0, w * 0.65, h * 0.58);
        beamG.addColorStop(0, 'rgba(255, 248, 195, 0.24)');
        beamG.addColorStop(0.55, 'rgba(255, 238, 155, 0.10)');
        beamG.addColorStop(1, 'rgba(255, 224, 110, 0)');
        bCtx.fillStyle = beamG;
        bCtx.beginPath();
        bCtx.moveTo(w * 0.08, 0); bCtx.lineTo(w * 0.42, 0);
        bCtx.lineTo(w * 0.86, h * 0.58); bCtx.lineTo(w * 0.34, h * 0.58);
        bCtx.closePath();
        bCtx.fill();
        // 工坊木案台地平分界柔影
        const tableG = bCtx.createLinearGradient(0, deskY, 0, h);
        tableG.addColorStop(0, 'rgba(72, 48, 18, 0.10)');
        tableG.addColorStop(1, 'rgba(42, 58, 34, 0.18)');
        bCtx.fillStyle = tableG;
        bCtx.fillRect(0, deskY, w, h - deskY);
        bCtx.strokeStyle = 'rgba(255, 238, 185, 0.22)';
        bCtx.lineWidth = 1.5;
        bCtx.beginPath(); bCtx.moveTo(0, deskY); bCtx.lineTo(w, deskY); bCtx.stroke();
        bCtx.restore();
      } else if (theme === 'starlight') {
        // 星夜观星台：深邃夜空 + 弯月与星盘轨迹 + 远景哥特观星塔剪影
        const g = bCtx.createRadialGradient(w * 0.5, h * 0.18, 10, w * 0.5, h * 0.5, h * 0.85);
        g.addColorStop(0, '#1e2460'); g.addColorStop(0.52, '#10143a'); g.addColorStop(1, '#07091e');
        bCtx.fillStyle = g; bCtx.fillRect(0, 0, w, h);

        bCtx.save();
        // 黄金星盘同心虚线环
        bCtx.strokeStyle = 'rgba(186, 210, 255, 0.14)';
        bCtx.lineWidth = 1.2;
        [0.24, 0.38, 0.52].forEach(rScale => {
          bCtx.beginPath();
          bCtx.arc(w * 0.5, h * 0.24, w * rScale, 0, Math.PI * 2);
          bCtx.stroke();
        });
        // 弯月剪影
        bCtx.fillStyle = 'rgba(254, 240, 138, 0.82)';
        bCtx.beginPath(); bCtx.arc(w * 0.78, h * 0.14, 18, 0, Math.PI * 2); bCtx.fill();
        bCtx.fillStyle = '#191f54';
        bCtx.beginPath(); bCtx.arc(w * 0.78 - 6, h * 0.14 - 4, 15, 0, Math.PI * 2); bCtx.fill();
        // 远景星象尖塔剪影
        bCtx.fillStyle = 'rgba(8, 11, 32, 0.65)';
        bCtx.beginPath();
        bCtx.moveTo(0, deskY);
        bCtx.lineTo(0, deskY - 48); bCtx.lineTo(w * 0.08, deskY - 82); bCtx.lineTo(w * 0.16, deskY - 45);
        bCtx.lineTo(w * 0.32, deskY - 22); bCtx.lineTo(w * 0.68, deskY - 20);
        bCtx.lineTo(w * 0.84, deskY - 52); bCtx.lineTo(w * 0.91, deskY - 90); bCtx.lineTo(w, deskY - 46);
        bCtx.lineTo(w, deskY);
        bCtx.closePath(); bCtx.fill();
        // 星石案台
        bCtx.fillStyle = 'rgba(14, 18, 48, 0.75)';
        bCtx.fillRect(0, deskY, w, h - deskY);
        bCtx.strokeStyle = 'rgba(147, 197, 253, 0.28)';
        bCtx.lineWidth = 1.5;
        bCtx.beginPath(); bCtx.moveTo(0, deskY); bCtx.lineTo(w, deskY); bCtx.stroke();
        bCtx.restore();
      } else if (theme === 'volcanic') {
        // 熔岩黑曜锻造坊：玄武岩柱剪影 + 地平线暖橙余烬辉光
        const g = bCtx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#8d8f9e'); g.addColorStop(0.58, '#75798c');
        g.addColorStop(0.65, '#595d70'); g.addColorStop(1, '#484c5e');
        bCtx.fillStyle = g; bCtx.fillRect(0, 0, w, h);

        bCtx.save();
        // 远景玄武岩山脊剪影
        bCtx.fillStyle = 'rgba(54, 56, 70, 0.38)';
        bCtx.beginPath();
        bCtx.moveTo(0, deskY);
        bCtx.lineTo(0, deskY - 64); bCtx.lineTo(w * 0.22, deskY - 96); bCtx.lineTo(w * 0.45, deskY - 42);
        bCtx.lineTo(w * 0.72, deskY - 88); bCtx.lineTo(w, deskY - 52); bCtx.lineTo(w, deskY);
        bCtx.closePath(); bCtx.fill();
        // 地平线锻炉暖橙微光
        const emberG = bCtx.createRadialGradient(w * 0.5, deskY, 6, w * 0.5, deskY, w * 0.65);
        emberG.addColorStop(0, 'rgba(251, 146, 60, 0.28)');
        emberG.addColorStop(0.6, 'rgba(234, 88, 12, 0.10)');
        emberG.addColorStop(1, 'rgba(234, 88, 12, 0)');
        bCtx.fillStyle = emberG;
        bCtx.fillRect(0, deskY - 120, w, 200);
        bCtx.strokeStyle = 'rgba(253, 186, 116, 0.35)';
        bCtx.lineWidth = 1.6;
        bCtx.beginPath(); bCtx.moveTo(0, deskY); bCtx.lineTo(w, deskY); bCtx.stroke();
        bCtx.restore();
      } else if (theme === 'taro') {
        // 香芋紫藤花房：玻璃温室穹顶弧肋 + 远景薰衣草花丘
        const g = bCtx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#c4b4e4'); g.addColorStop(0.64, '#aa96d4');
        g.addColorStop(0.645, '#8670b6'); g.addColorStop(1, '#735ca6');
        bCtx.fillStyle = g; bCtx.fillRect(0, 0, w, h);

        bCtx.save();
        // 玻璃花房白色拱形肋线
        bCtx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        bCtx.lineWidth = 2.0;
        [0.18, 0.5, 0.82].forEach(rx => {
          bCtx.beginPath();
          bCtx.moveTo(w * rx, deskY);
          bCtx.quadraticCurveTo(w * rx, h * 0.08, w * 0.5, 0);
          bCtx.stroke();
        });
        // 远景柔紫花丘
        bCtx.fillStyle = 'rgba(116, 92, 168, 0.28)';
        bCtx.beginPath();
        bCtx.moveTo(0, deskY);
        bCtx.quadraticCurveTo(w * 0.28, deskY - 54, w * 0.58, deskY - 24);
        bCtx.quadraticCurveTo(w * 0.82, deskY - 48, w, deskY - 18);
        bCtx.lineTo(w, deskY); bCtx.closePath(); bCtx.fill();
        bCtx.strokeStyle = 'rgba(243, 232, 255, 0.38)';
        bCtx.lineWidth = 1.5;
        bCtx.beginPath(); bCtx.moveTo(0, deskY); bCtx.lineTo(w, deskY); bCtx.stroke();
        bCtx.restore();
      } else if (theme === 'orange') {
        // 落日果园露台：暖金夕阳圆盘 + 流云层 + 远景果林丘陵
        const g = bCtx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#f8c38c'); g.addColorStop(0.64, '#eca462');
        g.addColorStop(0.645, '#c97a38'); g.addColorStop(1, '#b56928');
        bCtx.fillStyle = g; bCtx.fillRect(0, 0, w, h);

        bCtx.save();
        // 夕阳暖金圆盘
        const sunG = bCtx.createRadialGradient(w * 0.72, h * 0.22, 4, w * 0.72, h * 0.22, 54);
        sunG.addColorStop(0, 'rgba(255, 251, 215, 0.62)');
        sunG.addColorStop(0.55, 'rgba(254, 215, 130, 0.28)');
        sunG.addColorStop(1, 'rgba(254, 215, 130, 0)');
        bCtx.fillStyle = sunG;
        bCtx.beginPath(); bCtx.arc(w * 0.72, h * 0.22, 54, 0, Math.PI * 2); bCtx.fill();
        // 远景果园丘陵
        bCtx.fillStyle = 'rgba(180, 96, 32, 0.24)';
        bCtx.beginPath();
        bCtx.moveTo(0, deskY);
        bCtx.quadraticCurveTo(w * 0.32, deskY - 46, w * 0.65, deskY - 20);
        bCtx.quadraticCurveTo(w * 0.85, deskY - 42, w, deskY - 24);
        bCtx.lineTo(w, deskY); bCtx.closePath(); bCtx.fill();
        bCtx.strokeStyle = 'rgba(255, 237, 213, 0.36)';
        bCtx.lineWidth = 1.5;
        bCtx.beginPath(); bCtx.moveTo(0, deskY); bCtx.lineTo(w, deskY); bCtx.stroke();
        bCtx.restore();
      } else if (theme === 'beach') {
        // 阳光海岛假日：碧海蓝天 + 远景椰林小岛 + 双层浪花白沫 + 沙滩海星贝壳
        const g = bCtx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#5ad6e4'); g.addColorStop(0.42, '#86e7f2');
        g.addColorStop(0.46, '#f9f5e3'); g.addColorStop(0.64, '#edd2a4');
        g.addColorStop(0.645, '#deb981'); g.addColorStop(1, '#cfab72');
        bCtx.fillStyle = g; bCtx.fillRect(0, 0, w, h);

        bCtx.save();
        const seaY = h * 0.43;
        // 远景小岛与椰树剪影
        bCtx.fillStyle = 'rgba(45, 148, 136, 0.28)';
        bCtx.beginPath();
        bCtx.moveTo(w * 0.62, seaY);
        bCtx.quadraticCurveTo(w * 0.78, seaY - 28, w * 0.96, seaY);
        bCtx.closePath(); bCtx.fill();
        // 双道白色海浪泡沫弧线
        bCtx.strokeStyle = 'rgba(255, 255, 255, 0.72)';
        bCtx.lineWidth = 3.2;
        bCtx.beginPath();
        bCtx.moveTo(0, h * 0.455);
        bCtx.bezierCurveTo(w * 0.3, h * 0.435, w * 0.65, h * 0.475, w, h * 0.45);
        bCtx.stroke();
        bCtx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
        bCtx.lineWidth = 2.0;
        bCtx.beginPath();
        bCtx.moveTo(0, h * 0.485);
        bCtx.bezierCurveTo(w * 0.35, h * 0.465, w * 0.7, h * 0.50, w, h * 0.48);
        bCtx.stroke();
        // 沙滩小海星点缀
        drawStar5(bCtx, w * 0.14, h * 0.58, 8, 3.8, 'rgba(244, 114, 182, 0.45)', 'rgba(255,255,255,0.5)', 1);
        drawStar5(bCtx, w * 0.86, h * 0.61, 7, 3.2, 'rgba(251, 146, 60, 0.45)', 'rgba(255,255,255,0.5)', 1);
        bCtx.restore();
      }
      bCtx.restore();
      return bgOffscreen;
    }

    // ---------------- 2. 100% 原生 Canvas 2D 烘焙 6 枚超椭圆折射玻璃按钮（彻底解决变黑与缺图标问题！） ----------------
    const nativeBtnSpriteCache = new Map();
    function getNativeGlassButtonSprite(btnId) {
      if (nativeBtnSpriteCache.has(btnId)) return nativeBtnSpriteCache.get(btnId);
      const S = 220;
      const off = createOffscreenCanvas(64, 64);
      off.width = S; off.height = S;
      const c = off.getContext('2d');
      c.save();
      c.scale(S / 100, S / 100);

      const isRules = (btnId === 'rules-help-btn');
      const isHint = (btnId === 'hint-btn');
      const bodyP = new Path2D(isRules
        ? 'M 50,5 C 83,5 95,17 95,50 C 95,83 83,95 50,95 C 17,95 5,83 5,50 C 5,17 17,5 50,5 Z'
        : 'M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z');

      // (1) 底部柔和暖棕投影 + 主体通透暖珀/冷绿折射玻璃渐变
      c.save();
      c.shadowColor = isRules ? 'rgba(60, 76, 52, 0.34)' : 'rgba(110, 68, 20, 0.34)';
      c.shadowBlur = 9;
      c.shadowOffsetY = 5;
      const baseG = c.createLinearGradient(15, 5, 85, 95);
      if (isRules) {
        baseG.addColorStop(0, 'rgba(228, 239, 226, 0.48)');
        baseG.addColorStop(0.45, 'rgba(156, 178, 152, 0.30)');
        baseG.addColorStop(0.82, 'rgba(107, 131, 104, 0.40)');
        baseG.addColorStop(1, 'rgba(141, 163, 135, 0.50)');
      } else if (isHint) {
        baseG.addColorStop(0, 'rgba(237, 226, 190, 0.46)');
        baseG.addColorStop(0.45, 'rgba(182, 159, 98, 0.30)');
        baseG.addColorStop(0.80, 'rgba(135, 123, 72, 0.40)');
        baseG.addColorStop(1, 'rgba(168, 153, 92, 0.48)');
      } else {
        baseG.addColorStop(0, 'rgba(247, 223, 184, 0.48)');
        baseG.addColorStop(0.38, 'rgba(223, 173, 100, 0.28)');
        baseG.addColorStop(0.72, 'rgba(184, 123, 49, 0.40)');
        baseG.addColorStop(1, 'rgba(216, 157, 78, 0.50)');
      }
      c.fillStyle = baseG;
      c.fill(bodyP);
      c.restore();

      // (2) 内部下沿暖色暗部折射
      if (!isRules && !isHint) {
        const botShade = c.createRadialGradient(52, 68, 2, 52, 68, 48);
        botShade.addColorStop(0, 'rgba(138, 82, 22, 0.26)');
        botShade.addColorStop(0.65, 'rgba(156, 98, 34, 0.12)');
        botShade.addColorStop(1, 'rgba(156, 98, 34, 0)');
        c.fillStyle = botShade;
        c.fill(bodyP);
      }

      // (3) 顶部斜向新月高光带 (topCrescentSheen)
      const sheenP = new Path2D(isRules
        ? 'M 50,7 C 78,7 89,16 91,38 C 74,47 36,38 9,42 C 11,17 22,7 50,7 Z'
        : 'M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z');
      const sheenG = c.createLinearGradient(30, 7, 65, 48);
      sheenG.addColorStop(0, 'rgba(255, 255, 255, 0.64)');
      sheenG.addColorStop(0.45, 'rgba(255, 246, 228, 0.30)');
      sheenG.addColorStop(1, 'rgba(255, 255, 255, 0)');
      c.fillStyle = sheenG;
      c.fill(sheenP);

      // (4) 左上与底部弧形镜面高光弦线（仅 stroke，绝不 fill 变黑！）
      c.save();
      c.lineCap = 'round';
      c.strokeStyle = 'rgba(255, 255, 255, 0.64)';
      c.lineWidth = 2.2;
      c.stroke(new Path2D('M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24'));
      if (!isRules) {
        c.strokeStyle = 'rgba(255, 243, 214, 0.48)';
        c.lineWidth = 1.8;
        c.stroke(new Path2D('M 20,86 C 30,90.5 68,90.5 80,85'));
      }
      c.restore();

      // (5) 外圈玻璃高光描边 (glassRimStroke)
      const rimG = c.createLinearGradient(0, 0, 100, 100);
      rimG.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      rimG.addColorStop(0.30, 'rgba(255, 248, 235, 0.72)');
      rimG.addColorStop(0.65, 'rgba(255, 231, 194, 0.42)');
      rimG.addColorStop(1, 'rgba(255, 255, 255, 0.88)');
      c.strokeStyle = rimG;
      c.lineWidth = 2.5;
      c.stroke(bodyP);

      // (6) 绘制按钮中心高精 3D 图标
      c.save();
      c.shadowColor = 'rgba(140, 88, 28, 0.42)';
      c.shadowBlur = 3.2;
      c.shadowOffsetY = 2;
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#ffffff';
      c.lineCap = 'round';
      c.lineJoin = 'round';

      if (btnId === 'settings-btn') {
        [31, 46.2, 61.4].forEach(y => {
          c.beginPath();
          c.roundRect(30, y, 40, 7.6, 3.8);
          c.fill();
        });
      } else if (btnId === 'rules-help-btn') {
        const qG = c.createLinearGradient(38, 23, 66, 75);
        qG.addColorStop(0, '#ffffff');
        qG.addColorStop(0.48, '#d4ecff');
        qG.addColorStop(1, '#8ec0e4');
        c.strokeStyle = qG;
        c.lineWidth = 8.5;
        c.stroke(new Path2D('M 38.5,35.5 C 38.5,27.5 44.5,23 52,23 C 59.5,23 65.5,27.8 65.5,35 C 65.5,40.5 62,43.8 57.2,46.8 C 53.8,48.9 52.5,51.2 52.5,55.5'));
        c.fillStyle = qG;
        c.beginPath();
        c.arc(52.2, 70.5, 5.2, 0, Math.PI * 2);
        c.fill();
      } else if (btnId === 'dock-restart-btn') {
        c.lineWidth = 7.2;
        c.stroke(new Path2D('M 41,34.5 A 18.5,18.5 0 1 1 32.5,56.5'));
        c.fill(new Path2D('M 47.5,24.5 L 46.5,43.5 C 46.4,45.2 44.5,46.0 43.1,45.0 L 30.8,35.8 C 29.4,34.8 29.8,32.6 31.4,32.0 L 44.8,23.2 C 46.2,22.4 47.6,23.2 47.5,24.5 Z'));
      } else if (btnId === 'shuffle-btn') {
        c.lineWidth = 6.8;
        c.stroke(new Path2D('M 24,64 H 33 C 41,64 46,59 51,48 C 56,37 61,33 69,33 H 76'));
        c.stroke(new Path2D('M 67,24 L 78,33 L 67,42'));
        c.stroke(new Path2D('M 24,33 H 33 C 38,33 42,35.5 45.5,41'));
        c.stroke(new Path2D('M 56.5,56.5 C 60,61.5 64,64 69,64 H 76'));
        c.stroke(new Path2D('M 67,55 L 78,64 L 67,73'));
      } else if (btnId === 'undo-btn') {
        c.fill(new Path2D('M 44,31 L 25.5,48.5 C 24.0,50.0 24.3,52.4 26.2,53.3 L 45.5,61.5 C 47.4,62.3 49.3,60.6 48.8,58.6 L 47.0,52.2 C 58.2,51.0 66.8,54.8 72.5,62.2 C 73.5,63.5 75.5,62.5 75.2,60.8 C 72.8,44.2 61.2,36.8 46.8,38.2 L 48.0,32.8 C 48.4,30.8 45.6,29.5 44,31 Z'));
      } else if (btnId === 'hint-btn') {
        // 10道放射金芒
        c.shadowColor = 'transparent';
        c.strokeStyle = 'rgba(255, 232, 102, 0.92)';
        c.lineWidth = 2.2;
        const rays = [
          [50, 13, 50, 20], [33, 17.5, 36.8, 23.5], [67, 17.5, 63.2, 23.5],
          [21, 29, 27, 32.5], [79, 29, 73, 32.5], [17, 44.5, 24, 44.5],
          [83, 44.5, 76, 44.5], [22, 59.5, 28, 56], [78, 59.5, 72, 56]
        ];
        c.beginPath();
        rays.forEach(([x1, y1, x2, y2]) => { c.moveTo(x1, y1); c.lineTo(x2, y2); });
        c.stroke();
        // 3D 发光金灯泡
        c.save();
        c.shadowColor = 'rgba(255, 230, 64, 0.65)';
        c.shadowBlur = 7;
        const bulbG = c.createRadialGradient(44, 38, 2, 50, 45, 26);
        bulbG.addColorStop(0, '#ffffc8');
        bulbG.addColorStop(0.32, '#ffea38');
        bulbG.addColorStop(0.72, '#f7b718');
        bulbG.addColorStop(1, '#d97f08');
        c.fillStyle = bulbG;
        c.fill(new Path2D('M 50,24 C 38.2,24 29,33.0 29,44.2 C 29,51.4 33.0,57.6 38.8,61.2 C 40.8,62.5 42.0,64.6 42.2,67.0 L 57.8,67.0 C 58.0,64.6 59.2,62.5 61.2,61.2 C 67.0,57.6 71,51.4 71,44.2 C 71,33.0 61.8,24 50,24 Z'));
        c.restore();
        // 灯泡高光椭圆
        c.save();
        c.translate(42, 36);
        c.rotate((-28 * Math.PI) / 180);
        c.fillStyle = 'rgba(255, 255, 255, 0.58)';
        c.beginPath();
        c.ellipse(0, 0, 6.5, 4.2, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
        // 金属螺口底座
        c.fillStyle = '#6f7b88';
        c.beginPath(); c.roundRect(42.2, 67.2, 15.6, 4.8, 2.2); c.fill();
        c.fillStyle = '#596573';
        c.beginPath(); c.roundRect(43.4, 72.0, 13.2, 4.5, 2.0); c.fill();
        c.fillStyle = '#424c58';
        c.fill(new Path2D('M 45.5,76.5 C 46.2,79.8 47.8,81.5 50,81.5 C 52.2,81.5 53.8,79.8 54.5,76.5 Z'));
      } else if (btnId === 'add-bottle-btn') {
        // 3D 琉璃空瓶 + 右上角金色加号图标
        c.lineWidth = 4.6;
        c.strokeStyle = '#ffffff';
        c.fillStyle = 'rgba(255, 255, 255, 0.25)';
        const bIcon = new Path2D('M 35,24 H 49 V 31 C 55,33 58,38 58,45 V 72 C 58,76 53,79 42,79 C 31,79 26,76 26,72 V 45 C 26,38 29,33 35,31 Z');
        c.fill(bIcon);
        c.stroke(bIcon);
        c.beginPath(); c.roundRect(33, 20, 18, 4.5, 2.2);
        c.fillStyle = '#ffffff'; c.fill();
        // 亮金 + 号
        c.strokeStyle = '#fef08a';
        c.lineWidth = 6.2;
        c.beginPath();
        c.moveTo(69, 27); c.lineTo(69, 45);
        c.moveTo(60, 36); c.lineTo(78, 36);
        c.stroke();
      }
      c.restore();
      c.restore();

      nativeBtnSpriteCache.set(btnId, off);
      return off;
    }

    // ---------------- 3. 100% 原生 Canvas 2D 烘焙 3D 粗麻布编织软垫底座 ----------------
    const nativeCoasterCache = new Map();
    let burlapPatternLight = null;
    let burlapPatternDark = null;

    function getBurlapPattern(isDark) {
      if (isDark && burlapPatternDark) return burlapPatternDark;
      if (!isDark && burlapPatternLight) return burlapPatternLight;
      const pCan = createOffscreenCanvas(64, 64);
      pCan.width = 16; pCan.height = 16;
      const pc = pCan.getContext('2d');
      pc.scale(2, 2);
      if (!isDark) {
        pc.fillStyle = '#8c6236'; pc.fillRect(0, 0, 8, 8);
        pc.fillStyle = '#edd1a1'; pc.beginPath(); pc.roundRect(0.5, 0.6, 3.3, 2.9, 1.1); pc.fill();
        pc.fillStyle = 'rgba(255,240,207,0.75)'; pc.beginPath(); pc.roundRect(0.9, 0.9, 2.4, 1.2, 0.5); pc.fill();
        pc.fillStyle = '#d9b077'; pc.beginPath(); pc.roundRect(4.4, 0.5, 2.9, 3.3, 1.1); pc.fill();
        pc.fillStyle = '#d6ac72'; pc.beginPath(); pc.roundRect(0.5, 4.4, 2.9, 3.3, 1.1); pc.fill();
        pc.fillStyle = '#e8c896'; pc.beginPath(); pc.roundRect(4.5, 4.6, 3.3, 2.9, 1.1); pc.fill();
        burlapPatternLight = ctx.createPattern(pCan, 'repeat');
        return burlapPatternLight;
      } else {
        pc.fillStyle = '#362718'; pc.fillRect(0, 0, 8, 8);
        pc.fillStyle = '#7c6348'; pc.beginPath(); pc.roundRect(0.5, 0.6, 3.3, 2.9, 1.1); pc.fill();
        pc.fillStyle = '#634d36'; pc.beginPath(); pc.roundRect(4.4, 0.5, 2.9, 3.3, 1.1); pc.fill();
        pc.fillStyle = '#5e4832'; pc.beginPath(); pc.roundRect(0.5, 4.4, 2.9, 3.3, 1.1); pc.fill();
        pc.fillStyle = '#755c42'; pc.beginPath(); pc.roundRect(4.5, 4.6, 3.3, 2.9, 1.1); pc.fill();
        burlapPatternDark = ctx.createPattern(pCan, 'repeat');
        return burlapPatternDark;
      }
    }

    function getNativeCoasterCanvas(b) {
      const isDarkStar = !!(b.corked || b.isGiantCat);
      const hasBeaded = (b.special && b.special !== 'none') || (b.mysteryCount && b.mysteryCount > 0);
      const key = isDarkStar ? 'dark_star' : (hasBeaded ? 'beaded' : 'light');
      if (nativeCoasterCache.has(key)) return nativeCoasterCache.get(key);

      const W = 240, H = 112;
      const off = createOffscreenCanvas(64, 64);
      off.width = W; off.height = H;
      const c = off.getContext('2d');
      c.save();
      c.scale(W / 100, H / 46);

      // 1. 暖赤陶地面投影
      c.save();
      c.translate(42, 34);
      c.rotate((-5 * Math.PI) / 180);
      c.scale(1, 11.5 / 45);
      const shG = c.createRadialGradient(0, 0, 2, 0, 0, 45);
      shG.addColorStop(0, 'rgba(148, 62, 14, 0.62)');
      shG.addColorStop(0.48, 'rgba(168, 78, 20, 0.36)');
      shG.addColorStop(0.78, 'rgba(185, 92, 28, 0.12)');
      shG.addColorStop(1, 'rgba(185, 92, 28, 0)');
      c.fillStyle = shG;
      c.beginPath(); c.arc(0, 0, 45, 0, Math.PI * 2); c.fill();
      c.restore();

      // 2. 软垫厚实侧面
      const sideP = new Path2D('M 11,19.5 C 11,13 25,10 50,10 C 75,10 89,13 89,19.5 L 87.5,27.5 C 86,35.5 72,39.5 50,39.5 C 28,39.5 14,35.5 12.5,27.5 Z');
      const sideG = c.createLinearGradient(0, 10, 0, 39.5);
      if (isDarkStar) {
        sideG.addColorStop(0, '#69523a'); sideG.addColorStop(0.42, '#473524');
        sideG.addColorStop(0.82, '#2b1f14'); sideG.addColorStop(1, '#1a110a');
      } else {
        sideG.addColorStop(0, '#c4945a'); sideG.addColorStop(0.38, '#8c6032');
        sideG.addColorStop(0.78, '#543618'); sideG.addColorStop(1, '#331f0c');
      }
      c.fillStyle = sideG;
      c.fill(sideP);

      // 3. 软垫拱起顶面与粗麻纹理
      const topP = new Path2D('M 50,7.5 C 76,7.5 89,11.5 89,19.2 C 89,26.8 76,31.2 50,31.2 C 24,31.2 11,26.8 11,19.2 C 11,11.5 24,7.5 50,7.5 Z');
      c.fillStyle = getBurlapPattern(isDarkStar);
      c.fill(topP);

      const topShade = c.createLinearGradient(12, 8, 88, 31);
      topShade.addColorStop(0, 'rgba(255, 248, 230, 0.36)');
      topShade.addColorStop(0.45, 'rgba(212, 158, 92, 0.06)');
      topShade.addColorStop(0.82, 'rgba(92, 59, 24, 0.34)');
      topShade.addColorStop(1, 'rgba(56, 34, 12, 0.55)');
      c.fillStyle = topShade;
      c.fill(topP);
      c.strokeStyle = isDarkStar ? 'rgba(255, 232, 185, 0.35)' : 'rgba(255, 248, 225, 0.68)';
      c.lineWidth = 1.1;
      c.stroke(topP);

      // 4. 金星或珠点圆环镶嵌
      if (isDarkStar) {
        c.save();
        c.translate(50, 21);
        c.scale(1, 0.52);
        const starP = new Path2D('M0,-14 L4.2,-4.5 L14.5,-3.2 L6.8,3.8 L8.8,14 L0,8.8 L-8.8,14 L-6.8,3.8 L-14.5,-3.2 L-4.2,-4.5 Z');
        c.fillStyle = '#ffee44'; c.fill(starP);
        c.strokeStyle = '#d97706'; c.lineWidth = 1.6; c.stroke(starP);
        c.restore();
      } else if (hasBeaded) {
        c.save();
        c.translate(50, 19.5);
        c.strokeStyle = 'rgba(255, 253, 247, 0.85)';
        c.lineCap = 'round';
        c.lineWidth = 1.9;
        c.setLineDash([1.8, 3.2]);
        c.beginPath(); c.ellipse(0, 0, 22, 6.2, 0, 0, Math.PI * 2); c.stroke();
        c.lineWidth = 1.5;
        c.setLineDash([1.5, 2.8]);
        c.beginPath(); c.ellipse(0, 0, 17, 4.6, 0, 0, Math.PI * 2); c.stroke();
        c.restore();
      }

      c.restore();
      nativeCoasterCache.set(key, off);
      return off;
    }


    // 4A. 100% 原生 Canvas 2D 3D 礼盒袋离屏烘焙器（含彩色礼袋、袋内已装小瓶、金星徽章、锁定袋摄像机图标，0 异步延迟！）
    const nativeBagCache = new Map();
    function getNativeBagCanvas(bag, bagIdx) {
      if (!bag || bag.removed) return null;
      const key = bag.locked ? 'native_bag_locked' : `native_bag_${bag.color || 'green'}_pk_${bag.packedBottle || 'none'}`;
      if (nativeBagCache.has(key)) return nativeBagCache.get(key);

      const W = 200, H = 295;
      const off = createOffscreenCanvas(200, 295);
      off.width = W; off.height = H;
      const c = off.getContext('2d');
      c.save();
      // 严格映射 SVG viewBox="13 1 80 118" -> 200x295
      c.scale(W / 80, H / 118);
      c.translate(-13, -1);

      const fillPoly = (pts, fillStyle, strokeStyle, lw) => {
        c.beginPath();
        for (let i = 0; i < pts.length; i += 2) {
          if (i === 0) c.moveTo(pts[i], pts[i + 1]);
          else c.lineTo(pts[i], pts[i + 1]);
        }
        c.closePath();
        if (fillStyle) { c.fillStyle = fillStyle; c.fill(); }
        if (strokeStyle) { c.strokeStyle = strokeStyle; c.lineWidth = lw || 1; c.stroke(); }
      };

      const strokeRopeCurve = (x1, y1, cx1, cy1, cx2, cy2, x2, y2, strokeStyle, lw) => {
        c.beginPath();
        c.moveTo(x1, y1);
        c.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
        c.strokeStyle = strokeStyle;
        c.lineWidth = lw;
        c.lineCap = 'round';
        c.stroke();
      };

      if (bag.locked) {
        // 1. 袋底接触阴影
        c.beginPath(); c.ellipse(52, 117.5, 40, 4, 0, 0, Math.PI * 2);
        c.fillStyle = 'rgba(0,0,0,0.32)'; c.fill();

        // 2. 后排提绳
        strokeRopeCurve(38, 26, 38, 3, 70, 3, 70, 26, '#9ea7b8', 3.4);

        // 3. 锁定袋 3D 银灰袋体与侧面折角
        fillPoly([14, 27, 78, 27, 92, 20, 28, 20], '#525a6b', '#aeb7c6', 0.6);
        fillPoly([14, 27, 78, 27, 78, 118, 14, 113], '#d5dce6', 'rgba(120,132,150,0.35)', 0.6);
        fillPoly([78, 27, 92, 20, 92, 109, 78, 118], '#a5aeba');
        fillPoly([85, 23.5, 92, 20, 92, 109, 85, 113.5], '#919aa8');
        fillPoly([14, 96, 78, 100, 78, 118, 14, 113], '#8b94a3');
        fillPoly([78, 100, 92, 92, 92, 109, 78, 118], '#6d7585');

        // 4. 穿绳金属鸡眼扣与前排提绳
        [29, 63].forEach(cx => {
          c.beginPath(); c.arc(cx, 34, 3.4, 0, Math.PI * 2);
          c.fillStyle = '#e6ebf2'; c.fill();
          c.strokeStyle = '#7a8494'; c.lineWidth = 1.2; c.stroke();
        });
        strokeRopeCurve(29, 34, 29, 2, 63, 2, 63, 34, '#f5f8fc', 3.2);

        // 5. 展示窗与中央 3D 摄像机图标
        c.beginPath(); c.roundRect(24, 42, 44, 55, 6);
        c.fillStyle = '#7c8594'; c.fill();
        c.beginPath(); c.roundRect(27.2, 45.2, 37.6, 49.5, 4.2);
        c.fillStyle = '#9ea7b5'; c.fill();

        c.save();
        c.translate(33, 60);
        c.beginPath(); c.roundRect(0, 0, 24, 19, 5);
        c.fillStyle = '#ffffff'; c.fill();
        c.strokeStyle = '#64748b'; c.lineWidth = 1; c.stroke();
        fillPoly([23, 6, 33, 1, 33, 18, 23, 13], '#ffffff', '#64748b', 1);
        fillPoly([9, 5, 9, 14, 17, 9.5], '#43586e');
        c.restore();
      } else {
        const col = COLORS[bag.color] || COLORS.green;
        const packedCol = bag.packedBottle ? (COLORS[bag.packedBottle] || col) : null;

        // 1. 袋底柔和椭圆阴影
        c.beginPath(); c.ellipse(52, 117.5, 41, 4.2, 0, 0, Math.PI * 2);
        c.fillStyle = 'rgba(0, 0, 0, 0.35)'; c.fill();

        // 2. 后排双层立体提手绳
        strokeRopeCurve(38, 26, 38, 3, 70, 3, 70, 26, '#b5bfd0', 4.2);
        strokeRopeCurve(38, 26, 38, 3, 70, 3, 70, 26, '#eef3fa', 2.2);

        // 3. 袋口深灰内腔
        fillPoly([14, 27, 78, 27, 92, 20, 28, 20], '#7c8596', '#cdd5e2', 0.6);
        fillPoly([17, 26.5, 76, 26.5, 88, 21, 29, 21], '#525b6c');

        // 4. 3D 象牙白高定礼袋主袋体（正面 + 右侧立体风琴折面 + 内折痕线）
        const frontGrad = c.createLinearGradient(14, 27, 78, 118);
        frontGrad.addColorStop(0, '#ffffff');
        frontGrad.addColorStop(0.7, '#f8fafc');
        frontGrad.addColorStop(1, '#eef2f7');
        fillPoly([14, 27, 78, 27, 78, 118, 14, 113], frontGrad, 'rgba(148, 163, 184, 0.38)', 0.6);
        fillPoly([78, 27, 92, 20, 92, 109, 78, 118], '#d9dde4');
        fillPoly([85, 23.5, 92, 20, 92, 109, 85, 113.5], '#b4bcc8');
        c.beginPath();
        c.moveTo(85, 23.5);
        c.lineTo(85, 101);
        c.strokeStyle = '#969fab';
        c.lineWidth = 1.0;
        c.stroke();

        // 5. 主题色展示窗外框与内嵌透明视窗
        c.beginPath(); c.roundRect(23.5, 41.5, 45, 56.5, 6.5);
        c.fillStyle = col.bagMain; c.fill();
        c.beginPath(); c.roundRect(27.2, 45.2, 37.6, 49.5, 4.2);
        c.fillStyle = '#ccd3de'; c.fill();
        fillPoly([54.5, 45.2, 64.8, 45.2, 64.8, 94.7, 54.5, 94.7], 'rgba(115, 125, 142, 0.35)');

        // 6. 若已装入满瓶，在透明橱窗内绘制精致 3D 微缩封塞水瓶
        if (packedCol) {
          c.save();
          c.beginPath(); c.roundRect(27.2, 45.2, 37.6, 49.5, 4.2); c.clip();
          c.translate(27, 45);
          c.beginPath(); c.ellipse(19, 49.5, 13, 2.6, 0, 0, Math.PI * 2);
          c.fillStyle = 'rgba(0,0,0,0.28)'; c.fill();
          // 木塞
          c.beginPath();
          c.moveTo(13.0, 2.8); c.lineTo(14.2, 7.2);
          c.ellipse(19, 7.2, 4.8, 1.2, 0, Math.PI, 0, true);
          c.lineTo(25.0, 2.8); c.closePath();
          c.fillStyle = '#e6c396'; c.fill();
          c.strokeStyle = '#9c6b36'; c.lineWidth = 0.6; c.stroke();
          c.beginPath(); c.ellipse(19, 2.8, 6.0, 1.4, 0, 0, Math.PI * 2);
          c.fillStyle = '#fbf0dc'; c.fill();
          // 瓶口
          c.beginPath(); c.ellipse(19, 7.2, 7.2, 1.6, 0, 0, Math.PI * 2);
          c.fillStyle = '#4d88e5'; c.fill();
          c.strokeStyle = '#9be0ff'; c.lineWidth = 0.6; c.stroke();
          // 瓶身与满瓶彩色药水
          c.beginPath();
          c.moveTo(14.8, 7.8); c.lineTo(23.2, 7.8); c.lineTo(23.0, 11.5);
          c.quadraticCurveTo(31.5, 14.5, 31.5, 22.0);
          c.lineTo(31.5, 47.5);
          c.ellipse(19, 47.5, 12.5, 3.2, 0, 0, Math.PI, false);
          c.lineTo(6.5, 22.0);
          c.quadraticCurveTo(6.5, 14.5, 15.0, 11.5);
          c.closePath();
          c.fillStyle = 'rgba(22, 45, 105, 0.45)'; c.fill();
          c.strokeStyle = '#68a8ff'; c.lineWidth = 1.2; c.stroke();

          const liqG = c.createLinearGradient(7.2, 17.2, 30.8, 17.2);
          liqG.addColorStop(0, packedCol.topMid || packedCol.mid);
          liqG.addColorStop(0.5, packedCol.mid);
          liqG.addColorStop(1, packedCol.bot || packedCol.bagDark);
          c.beginPath();
          c.moveTo(7.2, 17.2); c.lineTo(30.8, 17.2); c.lineTo(30.8, 47.2);
          c.ellipse(19, 47.2, 11.8, 3.0, 0, 0, Math.PI, false);
          c.closePath();
          c.fillStyle = liqG; c.fill();

          c.beginPath(); c.ellipse(19, 17.2, 11.8, 2.8, 0, 0, Math.PI * 2);
          c.fillStyle = packedCol.topMid; c.fill();
          c.strokeStyle = packedCol.topLight; c.lineWidth = 0.7; c.stroke();

          c.beginPath(); c.roundRect(24.8, 20, 3.6, 24, 1.8);
          c.fillStyle = 'rgba(255,255,255,0.38)'; c.fill();
          c.restore();
        }

        // 7. 橱窗玻璃斜向高光反光面
        fillPoly([27.2, 45.2, 47.5, 45.2, 27.2, 84.5], 'rgba(255, 255, 255, 0.38)');

        // 8. 礼袋底部主题色加强围边（正面 + 右侧折面 + 折角阴影）
        fillPoly([14, 95.5, 78, 99.5, 78, 118, 14, 113], col.bagMain);
        fillPoly([78, 99.5, 92, 91.5, 92, 109, 78, 118], col.bagDark);
        fillPoly([78, 118, 92, 109, 85, 101.5], 'rgba(0, 0, 0, 0.22)');

        // 9. 左右双层金属穿绳鸡眼环
        [29, 63].forEach(cx => {
          c.beginPath(); c.arc(cx, 34.5, 3.6, 0, Math.PI * 2);
          c.fillStyle = '#eef2f8'; c.fill();
          c.strokeStyle = '#aeb7c6'; c.lineWidth = 1.2; c.stroke();
          c.beginPath(); c.arc(cx, 34.5, 1.8, 0, Math.PI * 2);
          c.fillStyle = '#485264'; c.fill();
        });

        // 10. 前排 3 层立体编织提手绳（投影层 + 灰白绳体 + 顶部高光芯）
        c.save();
        c.translate(0, 1.5);
        strokeRopeCurve(29, 34.5, 29, 2, 63, 2, 63, 34.5, 'rgba(90, 105, 130, 0.32)', 5.2);
        c.restore();
        strokeRopeCurve(29, 34.5, 29, 2, 63, 2, 63, 34.5, '#d5dde9', 4.4);
        strokeRopeCurve(29, 34.5, 29, 2, 63, 2, 63, 34.5, '#ffffff', 2.6);
      }
      c.restore();
      nativeBagCache.set(key, off);
      return off;
    }

    // 4B. 100% 原生 Canvas 2D 超立体 3D 高折射琉璃水瓶（后壁折射底色 + 内底椭圆台 + 前壁软箱高光柱 + 沉底焦散厚底座 + 10层立体玻璃瓶口 + 11种特殊机关）
    function cEl(c, x, y, rx, ry) { c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2); }

    // 第 1 层（在药水之前绘制）：瓶底暖珀环境投影 + 机关底光 + 3D 圆柱玻璃后壁体积感 + 左右玻璃壁厚度折射带 + 瓶底内壁椭圆台面
    const clipPathCache = new Map();
    function getBottleClipPath2D(maxCap, isGiantCat) {
      const neckOffsetY = getNeckOffsetY(maxCap, isGiantCat);
      const key = `${maxCap}_${neckOffsetY}_${isGiantCat ? 1 : 0}`;
      if (clipPathCache.has(key)) return clipPathCache.get(key);
      let p;
      if (isGiantCat) {
        p = new Path2D("M 35,10 L 65,10 L 65,26 L 70,29 L 83,12 Q 90,7 91,18 L 87,44 Q 95,62 84,82 Q 96,108 94,148 L 92,193 A 42,10.5 0 0,1 8,193 L 6,148 Q 4,108 16,82 Q 5,62 13,44 L 9,18 Q 10,7 17,12 L 30,29 L 35,26 Z");
      } else {
        const { bottomY: bBotY } = getBottleLayerMetrics(maxCap, false);
        const neckLipTopY = 9.2 + neckOffsetY;
        const shoulderTopY = 26.0 + neckOffsetY;
        const shoulderBotY = 47.0 + neckOffsetY;
        const innerBotY = bBotY - 1.8;
        p = new Path2D(`M 37.2,${neckLipTopY} L 62.8,${neckLipTopY} L 62.8,${shoulderTopY} C 74.8,${shoulderTopY + 3.6} 80.2,${shoulderTopY + 10.5} 80.2,${shoulderBotY} L 80.2,${innerBotY} A 30.2,7.5 0 0,1 19.8,${innerBotY} L 19.8,${shoulderBotY} C 19.8,${shoulderTopY + 10.5} 25.2,${shoulderTopY + 3.6} 37.2,${shoulderTopY} Z`);
      }
      clipPathCache.set(key, p);
      return p;
    }

    function drawNativeBottleBackGlass(ctx, b, idx) {
      const maxCap = b.maxCap || 4;
      const isGiantCat = !!b.isGiantCat;
      const neckOff = getNeckOffsetY(maxCap, isGiantCat);
      const { bottomY: bBotY } = getBottleLayerMetrics(maxCap, isGiantCat);

      ctx.save();
      if (isGiantCat) {
        const catPath = new Path2D('M 35,10 L 65,10 L 65,26 L 70,29 L 83,12 Q 90,7 91,18 L 87,44 Q 95,62 84,82 Q 96,108 94,148 L 92,193 A 42,10.5 0 0,1 8,193 L 6,148 Q 4,108 16,82 Q 5,62 13,44 L 9,18 Q 10,7 17,12 L 30,29 L 35,26 Z');
        const bodyG = ctx.createLinearGradient(6, 0, 94, 0);
        bodyG.addColorStop(0, 'rgba(255, 252, 242, 0.30)');
        bodyG.addColorStop(0.22, 'rgba(195, 228, 255, 0.14)');
        bodyG.addColorStop(0.55, 'rgba(20, 38, 82, 0.12)');
        bodyG.addColorStop(0.84, 'rgba(255, 254, 248, 0.32)');
        bodyG.addColorStop(1, 'rgba(185, 222, 255, 0.26)');
        ctx.fillStyle = bodyG;
        ctx.fill(catPath);
        ctx.beginPath(); cEl(ctx, 50, 193, 41.0, 8.2);
        ctx.fillStyle = 'rgba(155, 208, 255, 0.22)'; ctx.fill();
        ctx.strokeStyle = 'rgba(135, 195, 255, 0.52)'; ctx.lineWidth = 1.4; ctx.stroke();
        ctx.restore();
        return;
      }

      const neckStemTopY = 20.0 + neckOff;
      const shoulderTopY = 26.0 + neckOff;
      const shoulderBotY = 47.0 + neckOff;
      const innerBotY = bBotY - 1.8;
      const outerBotY = bBotY + 2.4;

      // 特殊瓶底背光（星雾金辉 / 广告瓶紫漩涡 / 古瓶金阵）
      if (b.mysteryCount && b.mysteryCount > 0) {
        [14, 86].forEach(gx => {
          const mg = ctx.createRadialGradient(gx, 134, 1, gx, 134, 32);
          mg.addColorStop(0, 'rgba(253, 224, 71, 0.38)');
          mg.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = mg;
          ctx.beginPath(); cEl(ctx, gx, 134, 9, 52); ctx.fill();
        });
      }
      if (b.special === 'ad_cam' || b.special === 'ad_cam_blue') {
        const vg = ctx.createRadialGradient(50, bBotY + 4, 2, 50, bBotY + 4, 44);
        vg.addColorStop(0, 'rgba(216, 180, 254, 0.55)');
        vg.addColorStop(0.55, 'rgba(168, 85, 247, 0.28)');
        vg.addColorStop(1, 'rgba(107, 33, 168, 0)');
        ctx.fillStyle = vg;
        ctx.beginPath(); cEl(ctx, 50, bBotY + 4, 44, 11); ctx.fill();
      }
      if (b.special === 'one_way_out' && !b.corked) {
        ctx.beginPath(); cEl(ctx, 50, bBotY + 5, 42, 8.8);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.22)'; ctx.fill();
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1.8; ctx.setLineDash([8, 4]); ctx.stroke();
        ctx.setLineDash([]);
      }

      // 1. 3D 圆柱玻璃瓶腔底色（赋予空瓶与半满瓶饱满的立体玻璃体积感）
      const outerBodyP = new Path2D(`M 36.4,${neckStemTopY} L 63.6,${neckStemTopY} L 63.6,${shoulderTopY} C 76.4,${shoulderTopY + 3.4} 82.2,${shoulderTopY + 10.2} 82.2,${shoulderBotY} L 82.2,${outerBotY} A 32.2,8.8 0 0,1 17.8,${outerBotY} L 17.8,${shoulderBotY} C 17.8,${shoulderTopY + 10.2} 23.6,${shoulderTopY + 3.4} 36.4,${shoulderTopY} Z`);
      const glassBodyG = ctx.createLinearGradient(17.8, 0, 82.2, 0);
      glassBodyG.addColorStop(0, 'rgba(255, 253, 245, 0.34)');
      glassBodyG.addColorStop(0.18, 'rgba(210, 235, 255, 0.15)');
      glassBodyG.addColorStop(0.52, 'rgba(24, 38, 68, 0.08)');
      glassBodyG.addColorStop(0.82, 'rgba(255, 254, 248, 0.34)');
      glassBodyG.addColorStop(1, 'rgba(195, 228, 255, 0.28)');
      ctx.fillStyle = glassBodyG;
      ctx.fill(outerBodyP);

      // 2. 左右两侧真实玻璃壁厚度折射光带 (1.8px 壁厚)
      const wallH = Math.max(10, innerBotY - shoulderBotY);
      const wallLG = ctx.createLinearGradient(17.8, 0, 20.6, 0);
      wallLG.addColorStop(0, 'rgba(255, 255, 255, 0.52)');
      wallLG.addColorStop(0.55, 'rgba(175, 220, 255, 0.22)');
      wallLG.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = wallLG;
      ctx.fillRect(17.8, shoulderBotY, 2.8, wallH);

      const wallRG = ctx.createLinearGradient(79.4, 0, 82.2, 0);
      wallRG.addColorStop(0, 'rgba(255, 255, 255, 0)');
      wallRG.addColorStop(0.45, 'rgba(175, 220, 255, 0.24)');
      wallRG.addColorStop(1, 'rgba(255, 255, 255, 0.56)');
      ctx.fillStyle = wallRG;
      ctx.fillRect(79.4, shoulderBotY, 2.8, wallH);

      // 3. 瓶底内壁 3D 椭圆台面（空瓶时清晰呈现玻璃内底厚度与空间透视）
      ctx.beginPath(); cEl(ctx, 50, innerBotY, 30.2, 6.6);
      ctx.fillStyle = 'rgba(22, 32, 58, 0.18)';
      ctx.fill();
      const floorRimG = ctx.createLinearGradient(19.8, 0, 80.2, 0);
      floorRimG.addColorStop(0, 'rgba(255, 255, 255, 0.62)');
      floorRimG.addColorStop(0.25, 'rgba(160, 212, 255, 0.34)');
      floorRimG.addColorStop(0.5, 'rgba(30, 42, 68, 0.42)');
      floorRimG.addColorStop(0.78, 'rgba(175, 224, 255, 0.48)');
      floorRimG.addColorStop(1, 'rgba(255, 255, 255, 0.68)');
      ctx.strokeStyle = floorRimG;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }

    // 第 3 层（在药水之后绘制）：前壁立体球面高光、软箱反光柱、3D沉底厚玻璃焦散底座、10层精细玻璃瓶口与全部 11 种特殊机关
    function drawNativeBottleShellAndSpecials(ctx, b, idx) {
      const maxCap = b.maxCap || 4;
      const isGiantCat = !!b.isGiantCat;
      const neckOff = getNeckOffsetY(maxCap, isGiantCat);
      const { bottomY: bBotY, layerH: bLayerH } = getBottleLayerMetrics(maxCap, isGiantCat);

      if (isGiantCat) {
        const catPath = new Path2D('M 35,10 L 65,10 L 65,26 L 70,29 L 83,12 Q 90,7 91,18 L 87,44 Q 95,62 84,82 Q 96,108 94,148 L 92,193 A 42,10.5 0 0,1 8,193 L 6,148 Q 4,108 16,82 Q 5,62 13,44 L 9,18 Q 10,7 17,12 L 30,29 L 35,26 Z');
        ctx.save();
        // 耳朵内侧粉嫩高光
        ctx.fillStyle = 'rgba(255, 140, 200, 0.55)';
        ctx.strokeStyle = '#b8dcff'; ctx.lineWidth = 1.15;
        const earL = new Path2D('M 13.5,16.5 L 27.5,29.5 L 15.5,41.5 Q 11.5,30 13.5,16.5 Z');
        const earR = new Path2D('M 86.5,16.5 L 72.5,29.5 L 84.5,41.5 Q 88.5,30 86.5,16.5 Z');
        ctx.fill(earL); ctx.stroke(earL);
        ctx.fill(earR); ctx.stroke(earR);

        // 玻璃高光与猫爪印
        const shDome = ctx.createRadialGradient(22, 46, 2, 26, 50, 19);
        shDome.addColorStop(0, 'rgba(255,255,255,0.46)');
        shDome.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = shDome;
        ctx.beginPath(); cEl(ctx, 26, 50, 19, 15); ctx.fill();

        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fill(new Path2D('M 56,35 Q 80,41 83,64 L 69,66 Q 65,46 52,39 Z'));
        ctx.fill(new Path2D('M 74,88 Q 88,118 85,180 L 73,180 Q 76,120 66,88 Z'));
        ctx.fill(new Path2D('M 12,88 Q 7,125 11,180 L 18,180 Q 15,125 19,88 Z'));

        // 腮红、笑眼、粉鼻与胡须
        ctx.fillStyle = 'rgba(255, 120, 185, 0.45)';
        ctx.beginPath(); cEl(ctx, 24, 64, 6.2, 3.4); ctx.fill();
        ctx.beginPath(); cEl(ctx, 76, 64, 6.2, 3.4); ctx.fill();
        ctx.strokeStyle = '#091d4a'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
        ctx.stroke(new Path2D('M 24,56 Q 32,48 40,56'));
        ctx.stroke(new Path2D('M 60,56 Q 68,48 76,56'));
        ctx.strokeStyle = '#d8f0ff'; ctx.lineWidth = 2.0;
        ctx.stroke(new Path2D('M 24,55.5 Q 32,47.5 40,55.5'));
        ctx.stroke(new Path2D('M 60,55.5 Q 68,47.5 76,55.5'));
        ctx.fillStyle = '#ff6da8'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.1;
        const noseP = new Path2D('M 50,66.5 C 46,63.5 45.5,59.5 48,59.5 C 49.2,59.5 50,60.5 50,61.2 C 50,60.5 50.8,59.5 52,59.5 C 54.5,59.5 54,63.5 50,66.5 Z');
        ctx.fill(noseP); ctx.stroke(noseP);
        ctx.strokeStyle = '#d8f0ff'; ctx.lineWidth = 1.65;
        ctx.stroke(new Path2D('M 43.5,69.5 Q 46.8,73.5 50,68.5 Q 53.2,73.5 56.5,69.5'));
        ctx.strokeStyle = 'rgba(205, 235, 255, 0.78)'; ctx.lineWidth = 1.45;
        [[9, 57, 20, 60], [7, 64, 19, 64], [10, 71, 20, 68], [91, 57, 80, 60], [93, 64, 81, 64], [90, 71, 80, 68]].forEach(([x1, y1, x2, y2]) => {
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        });

        // 项圈与金铃铛
        const colP = new Path2D('M 15.5,81 Q 50,91 84.5,81 L 85.2,86.5 Q 50,96.5 14.8,86.5 Z');
        ctx.fillStyle = '#e01e63'; ctx.fill(colP);
        ctx.strokeStyle = '#ffbfd9'; ctx.lineWidth = 1.0; ctx.stroke(colP);
        ctx.beginPath(); ctx.arc(50, 89.5, 6.8, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd54f'; ctx.fill();
        ctx.strokeStyle = '#fff3b0'; ctx.lineWidth = 1.1; ctx.stroke();

        // 厚底座与外轮廓
        const catBaseP = new Path2D('M 8,193 A 42,10.5 0 0,0 92,193 L 91,199.5 A 41,11.5 0 0,1 9,199.5 Z');
        ctx.fillStyle = 'rgba(165, 215, 255, 0.38)'; ctx.fill(catBaseP);
        ctx.strokeStyle = '#0b2260'; ctx.lineWidth = 3.2; ctx.lineJoin = 'round';
        ctx.stroke(catPath);
        ctx.strokeStyle = '#5ca4ff'; ctx.lineWidth = 2.2;
        ctx.stroke(catPath);

        // 立体猫瓶口
        const catLipP = new Path2D('M 28.5,11.0 C 26.8,15.2 28.0,20.5 33.8,23.2 A 17.2,4.2 0 0,0 66.2,23.2 C 72.0,20.5 73.2,15.2 71.5,11.0 A 21.5,4.4 0 0,1 28.5,11.0 Z');
        ctx.fillStyle = 'rgba(240, 248, 255, 0.58)'; ctx.fill(catLipP);
        ctx.strokeStyle = '#3b73cc'; ctx.lineWidth = 1.0; ctx.stroke(catLipP);
        ctx.beginPath(); cEl(ctx, 50, 11.0, 21.2, 4.3);
        ctx.strokeStyle = '#b8d8ff'; ctx.lineWidth = 1.35; ctx.stroke();

        // 进度胶囊
        ctx.save();
        ctx.translate(50, 146);
        ctx.beginPath(); ctx.roundRect(-28, -11, 56, 21, 10.5);
        ctx.fillStyle = 'rgba(10, 22, 62, 0.82)'; ctx.fill();
        ctx.strokeStyle = '#ffdf6b'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = '#fff5b8';
        ctx.font = '900 11px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`🐱 ${b.layers.length}/${maxCap}`, 0, 0.5);
        ctx.restore();
        ctx.restore();
        return;
      }

      const neckLipTopY = 9.2 + neckOff;
      const neckStemTopY = 20.0 + neckOff;
      const shoulderTopY = 26.0 + neckOff;
      const shoulderBotY = 47.0 + neckOff;
      const pillarTopY = 43.5 + neckOff;
      const pillarH = Math.max(18, (bBotY - 9) - pillarTopY);
      const innerBotY = bBotY - 1.8;
      const outerBotY = bBotY + 2.4;
      const bodyMidY = (shoulderBotY + innerBotY) * 0.5;

      ctx.save();

      // 1. 瓶腔前壁高光（左肩球面高光 + 右肩曲率视窗高光 + 左右双柱柔光箱高光带）
      ctx.save();
      ctx.clip(getBottleClipPath2D(maxCap, false));

      // 左肩 3D 球面柔光顶 (leftShoulderDomeGrad)
      const domeG = ctx.createRadialGradient(31, 35 + neckOff, 1, 34, 37.5 + neckOff, 15);
      domeG.addColorStop(0, 'rgba(255, 255, 255, 0.46)');
      domeG.addColorStop(0.58, 'rgba(255, 250, 235, 0.16)');
      domeG.addColorStop(1, 'rgba(255, 250, 235, 0)');
      ctx.fillStyle = domeG;
      ctx.beginPath(); cEl(ctx, 34, 37.5 + neckOff, 13.5, 9.2); ctx.fill();

      // 左侧垂直柔光柱 (leftWallSheen)
      const lSheen = ctx.createLinearGradient(0, pillarTopY, 0, pillarTopY + pillarH);
      lSheen.addColorStop(0, 'rgba(255, 255, 255, 0.34)');
      lSheen.addColorStop(0.65, 'rgba(255, 250, 235, 0.14)');
      lSheen.addColorStop(1, 'rgba(255, 250, 235, 0)');
      ctx.fillStyle = lSheen;
      ctx.beginPath(); ctx.roundRect(21.0, pillarTopY, 5.5, pillarH, 2.7); ctx.fill();

      // 右肩弧形视窗反光块 (windowShoulderGrad)
      const winShP = new Path2D(`M 53.8,${28.2 + neckOff} C 64.8,${30.2 + neckOff} 72.0,${35.5 + neckOff} 74.5,${42.8 + neckOff} L 62.5,${43.2 + neckOff} C 60.6,${36.5 + neckOff} 56.8,${31.5 + neckOff} 51.2,${29.8 + neckOff} Z`);
      const winShG = ctx.createLinearGradient(52, 28 + neckOff, 74, 43 + neckOff);
      winShG.addColorStop(0, 'rgba(255, 255, 255, 0.56)');
      winShG.addColorStop(0.5, 'rgba(255, 253, 245, 0.66)');
      winShG.addColorStop(0.9, 'rgba(255, 248, 225, 0.32)');
      winShG.addColorStop(1, 'rgba(255, 248, 225, 0.05)');
      ctx.fillStyle = winShG;
      ctx.fill(winShP);

      // 右侧精炼立体玻璃边缘高光带（不遮挡药水主体的饱满实心色泽，同时突显圆柱边缘高折射质感）
      const rSheen = ctx.createLinearGradient(0, pillarTopY, 0, pillarTopY + pillarH);
      rSheen.addColorStop(0, 'rgba(255, 255, 255, 0.36)');
      rSheen.addColorStop(0.50, 'rgba(255, 252, 240, 0.18)');
      rSheen.addColorStop(0.88, 'rgba(255, 248, 225, 0.06)');
      rSheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = rSheen;
      ctx.beginPath(); ctx.roundRect(71.2, pillarTopY, 4.4, pillarH, 2.2); ctx.fill();
      ctx.beginPath(); ctx.roundRect(67.6, pillarTopY + 4, 1.6, pillarH * 0.72, 0.8); ctx.fill();

      // 右肩高光弦线
      ctx.strokeStyle = 'rgba(225, 242, 255, 0.70)';
      ctx.lineWidth = 1.5; ctx.lineCap = 'round';
      ctx.stroke(new Path2D(`M 65.2,${29.8 + neckOff} C 74.2,${34.2 + neckOff} 78.0,${40.2 + neckOff} 78.6,${47.5 + neckOff}`));

      // 8层超长瓶刻度线
      if (maxCap === 8) {
        ctx.globalAlpha = 0.62;
        for (let tick = 1; tick < 8; tick++) {
          const ty = bBotY - tick * bLayerH;
          const isMajor = (tick % 2 === 0);
          ctx.strokeStyle = isMajor ? '#fde047' : '#93c5fd';
          ctx.lineWidth = isMajor ? 1.4 : 1.0;
          ctx.beginPath();
          ctx.moveTo(isMajor ? 73 : 76.5, ty);
          ctx.lineTo(81.5, ty);
          ctx.stroke();
        }
      }
      ctx.restore();

      // 2. 3D 沉底厚玻璃焦散底座结构（7区高折射冷暖焦散 + 月牙聚光弧 + 双层底沿亮弧）
      const baseP = new Path2D(`M 19.6,${innerBotY} A 30.4,7.5 0 0,0 80.4,${innerBotY} L 82.2,${outerBotY} A 32.2,8.8 0 0,1 17.8,${outerBotY} Z`);
      const baseG = ctx.createLinearGradient(17.8, innerBotY, 82.2, outerBotY);
      baseG.addColorStop(0, 'rgba(255, 252, 240, 0.65)');
      baseG.addColorStop(0.14, 'rgba(165, 215, 255, 0.36)');
      baseG.addColorStop(0.32, 'rgba(28, 36, 58, 0.46)');
      baseG.addColorStop(0.52, 'rgba(18, 26, 48, 0.54)');
      baseG.addColorStop(0.72, 'rgba(42, 56, 88, 0.40)');
      baseG.addColorStop(0.88, 'rgba(195, 232, 255, 0.60)');
      baseG.addColorStop(1, 'rgba(255, 252, 240, 0.70)');
      ctx.fillStyle = baseG;
      ctx.fill(baseP);

      const bRimG = ctx.createLinearGradient(18, 0, 82, 0);
      bRimG.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
      bRimG.addColorStop(0.18, 'rgba(255, 255, 255, 0.82)');
      bRimG.addColorStop(0.50, 'rgba(190, 230, 255, 0.46)');
      bRimG.addColorStop(0.82, 'rgba(255, 255, 255, 0.90)');
      bRimG.addColorStop(1, 'rgba(255, 255, 255, 0.20)');

      const crescentP = new Path2D(`M 20.5,${innerBotY + 1.4} A 29.8,7.8 0 0,0 79.5,${innerBotY + 1.4} A 30.8,8.5 0 0,1 20.5,${innerBotY + 1.4} Z`);
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.fillStyle = bRimG;
      ctx.fill(crescentP);
      ctx.restore();

      ctx.strokeStyle = bRimG;
      ctx.lineCap = 'round';
      ctx.lineWidth = 1.25;
      ctx.stroke(new Path2D(`M 19.8,${innerBotY} A 30.2,7.5 0 0,0 80.2,${innerBotY}`));
      ctx.lineWidth = 1.55;
      ctx.stroke(new Path2D(`M 18.4,${outerBotY - 0.3} A 31.6,8.6 0 0,0 81.6,${outerBotY - 0.3}`));
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.52)';
      ctx.lineWidth = 0.95;
      ctx.stroke(new Path2D(`M 26.0,${outerBotY + 4.8} A 25.0,5.2 0 0,0 74.0,${outerBotY + 4.8}`));

      // 3. 外层 3D 纤细修长琉璃轮廓线 (naturalRimGrad)
      const rimP = new Path2D(`M 32.0,${neckLipTopY} C 30.2,${13.4 + neckOff} 31.4,${18.2 + neckOff} 36.4,${20.4 + neckOff} C 37.5,${22.2 + neckOff} 37.5,${24.4 + neckOff} 36.4,${shoulderTopY} C 23.6,${shoulderTopY + 3.6} 17.8,${shoulderTopY + 10.5} 17.8,${shoulderBotY} L 17.8,${outerBotY} A 32.2,8.8 0 0,0 82.2,${outerBotY} L 82.2,${shoulderBotY} C 82.2,${shoulderTopY + 10.5} 76.4,${shoulderTopY + 3.6} 63.6,${shoulderTopY} C 62.5,${24.4 + neckOff} 62.5,${22.2 + neckOff} 63.6,${20.4 + neckOff} C 68.6,${18.2 + neckOff} 69.8,${13.4 + neckOff} 68.0,${neckLipTopY}`);
      if (b.special === 'ad_cam' || b.special === 'ad_cam_blue') {
        ctx.strokeStyle = '#d884ff';
      } else {
        const natRimG = ctx.createLinearGradient(0, neckLipTopY, 0, outerBotY);
        natRimG.addColorStop(0, 'rgba(255, 255, 255, 0.88)');
        natRimG.addColorStop(0.25, 'rgba(255, 248, 225, 0.68)');
        natRimG.addColorStop(0.65, 'rgba(255, 255, 255, 0.52)');
        natRimG.addColorStop(0.90, 'rgba(255, 244, 210, 0.56)');
        natRimG.addColorStop(1, 'rgba(255, 250, 235, 0.42)');
        ctx.strokeStyle = natRimG;
      }
      ctx.lineWidth = 1.75;
      ctx.lineJoin = 'round';
      ctx.stroke(rimP);

      // 4. 经典 10 层立体深蓝玻璃瓶口 + 紧束短颈环 (neck-group)
      ctx.save();
      ctx.translate(0, neckOff);
      // (a) 瓶颈深蓝暗部环
      ctx.fillStyle = 'rgba(27, 67, 138, 0.34)';
      ctx.fill(new Path2D('M 36.0,20.2 Q 37.2,23.2 36.4,26.2 A 13.8,2.7 0 0,0 63.6,26.2 Q 62.8,23.2 64.0,20.2 Z'));
      // (b) 瓶颈内部亮蓝椭圆反光
      ctx.fillStyle = 'rgba(120, 175, 255, 0.25)';
      ctx.beginPath(); cEl(ctx, 50, 24.5, 10.4, 1.6); ctx.fill();
      // (c) 瓶颈下沿束环弦线
      ctx.strokeStyle = maxCap === 8 ? '#fde047' : 'rgba(74, 128, 219, 0.88)';
      ctx.lineWidth = maxCap === 8 ? 1.5 : 1.15;
      ctx.stroke(new Path2D('M 36.6,25.8 A 13.4,2.5 0 0,0 63.4,25.8'));
      // (d) 圆润厚重玻璃瓶唇主体
      const lipBodyP = new Path2D('M 31.4,9.2 C 29.8,13.5 31.0,18.2 36.2,20.6 A 14.2,3.3 0 0,0 63.8,20.6 C 69.0,18.2 70.2,13.5 68.6,9.2 A 18.6,3.8 0 0,1 31.4,9.2 Z');
      const lipG = ctx.createLinearGradient(31, 9, 69, 9);
      lipG.addColorStop(0, 'rgba(255, 248, 230, 0.56)');
      lipG.addColorStop(0.18, 'rgba(255, 255, 255, 0.78)');
      lipG.addColorStop(0.48, 'rgba(240, 225, 195, 0.36)');
      lipG.addColorStop(0.76, 'rgba(255, 255, 255, 0.82)');
      lipG.addColorStop(1, 'rgba(245, 230, 200, 0.58)');
      ctx.fillStyle = lipG;
      ctx.fill(lipBodyP);
      ctx.strokeStyle = 'rgba(59, 115, 204, 0.82)';
      ctx.lineWidth = 1.0;
      ctx.stroke(lipBodyP);
      // (e) 瓶唇左右两侧立体高光月牙块
      ctx.fillStyle = 'rgba(230, 245, 255, 0.86)';
      ctx.fill(new Path2D('M 57.2,11.2 C 61.5,11.0 63.6,11.6 62.8,15.2 C 62.2,18.2 60.0,19.8 56.4,20.1 C 57.0,17.2 57.5,14.0 57.2,11.2 Z'));
      ctx.fillStyle = 'rgba(140, 190, 255, 0.62)';
      ctx.fill(new Path2D('M 32.8,11.0 C 35.2,11.4 36.4,12.8 36.6,16.2 C 36.8,18.6 35.8,19.6 34.0,19.0 C 32.4,16.8 32.0,13.5 32.8,11.0 Z'));
      // (f) 瓶唇下沿冰蓝折射弦线
      ctx.strokeStyle = '#6ea6f7'; ctx.lineWidth = 1.3;
      ctx.stroke(new Path2D('M 35.8,20.4 A 14.6,3.3 0 0,0 64.2,20.4'));
      // (g) 瓶口顶面椭圆环与前唇亮白高光弧
      ctx.beginPath(); cEl(ctx, 50, 9.2, 18.5, 3.7);
      ctx.fillStyle = 'rgba(255, 252, 242, 0.42)'; ctx.fill();
      ctx.strokeStyle = '#6b9fed'; ctx.lineWidth = 1.0; ctx.stroke();
      ctx.strokeStyle = '#b8d8ff'; ctx.lineWidth = 1.3;
      ctx.stroke(new Path2D('M 32.0,9.6 A 18.1,3.5 0 0,0 68.0,9.6'));
      // (h) 瓶口内膛深孔椭圆
      ctx.beginPath(); cEl(ctx, 50, 9.0, 10.2, 1.9);
      ctx.fillStyle = 'rgba(180, 140, 85, 0.26)'; ctx.fill();
      ctx.strokeStyle = '#5c92e6'; ctx.lineWidth = 0.95; ctx.stroke();
      ctx.strokeStyle = 'rgba(140, 186, 255, 0.88)';
      ctx.stroke(new Path2D('M 40.6,9.4 A 9.5,1.7 0 0,0 59.4,9.4'));
      ctx.restore();

      // ---------------- 5. 100% 原生 Canvas 2D 特殊机关护罩、大图标与小屏高可读限制微标签 ----------------
      const leftBags = ['silk_drape', 'full_ice', 'paper_bag'].includes(b.special) ? Math.max(1, (b.unlockOrder || 1) - packedTotal) : 0;
      const lvCfgNow = getLevelConfig(currentLevelId);

      // 通用瓶身微胶囊标签绘制器（状态 + 操作限制一目了然）
      const drawMicroRestrictionPill = (cx, cy, text, bgCol, borderCol = '#ffffff', textCol = '#ffffff') => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.font = '900 10.5px "Fredoka", "PingFang SC", sans-serif';
        const tw = Math.max(46, Math.min(72, ctx.measureText(text).width + 14));
        const th = 17.5;
        ctx.beginPath();
        ctx.roundRect(-tw * 0.5, -th * 0.5, tw, th, th * 0.5);
        ctx.fillStyle = bgCol;
        ctx.fill();
        ctx.strokeStyle = borderCol;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = textCol;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 0, 0.5);
        ctx.restore();
      };

      // 异形容量关（2层/4层/6层）或 8层超长瓶：在瓶颈下方显示清晰容量徽标
      if (((lvCfgNow && lvCfgNow.isVariedHeight) || maxCap === 2 || maxCap === 6 || maxCap === 8) && !b.corked && b.special === 'none') {
        ctx.save();
        ctx.translate(71, shoulderTopY + 9);
        ctx.beginPath();
        ctx.roundRect(-14, -8, 28, 16, 8);
        ctx.fillStyle = maxCap === 2 ? 'rgba(16, 185, 129, 0.88)' : (maxCap >= 6 ? 'rgba(217, 119, 6, 0.88)' : 'rgba(59, 130, 246, 0.82)');
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 9.5px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${maxCap}层`, 0, 0.5);
        ctx.restore();
      }

      // 机关 A: 广告解锁空瓶 (ad_cam / ad_cam_blue)
      if (b.special === 'ad_cam' || b.special === 'ad_cam_blue') {
        ctx.save();
        ctx.beginPath(); cEl(ctx, 50, bBotY + 4, 38, 8.5);
        ctx.strokeStyle = '#e879f9'; ctx.lineWidth = 1.8; ctx.setLineDash([12, 6]); ctx.stroke();
        ctx.setLineDash([]);

        ctx.save();
        ctx.translate(50, bodyMidY - 8);
        ctx.rotate((-10 * Math.PI) / 180);
        ctx.scale(1.18, 1.18);
        ctx.shadowColor = 'rgba(59, 7, 100, 0.55)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
        ctx.beginPath(); ctx.roundRect(-15, -8, 30, 22, 4.5);
        const camG = ctx.createLinearGradient(0, -8, 0, 14);
        camG.addColorStop(0, '#c084fc'); camG.addColorStop(0.55, '#9333ea'); camG.addColorStop(1, '#581c87');
        ctx.fillStyle = camG; ctx.fill();
        ctx.strokeStyle = '#e9d5ff'; ctx.lineWidth = 1.4; ctx.stroke();

        ctx.save();
        ctx.translate(-15, -8); ctx.rotate((-10 * Math.PI) / 180); ctx.translate(15, 8);
        ctx.beginPath(); ctx.roundRect(-15, -14, 30, 6.5, 2);
        ctx.fillStyle = '#3b0764'; ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.9; ctx.stroke();
        ctx.fillStyle = '#ffffff';
        [[-11, -14, -6, -14, -9, -7.5, -14, -7.5], [-1, -14, 4, -14, 1, -7.5, -4, -7.5], [9, -14, 14, -14, 11, -7.5, 6, -7.5]].forEach(p => {
          ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(p[2], p[3]); ctx.lineTo(p[4], p[5]); ctx.lineTo(p[6], p[7]); ctx.closePath(); ctx.fill();
        });
        ctx.restore();

        ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(-4, 8); ctx.lineTo(6, 2.5); ctx.closePath();
        ctx.fillStyle = '#a3e635'; ctx.fill();
        ctx.strokeStyle = '#365314'; ctx.lineWidth = 0.9; ctx.stroke();
        ctx.restore();

        // 广告瓶仅保留立体紫金场记板图标，不再叠加超宽底部文字条
        ctx.restore();
      }

      // 机关 B: 丝绒磨砂琉璃罩 (silk_drape) 或 琥珀盲盒罩 (paper_bag)
      if (b.special === 'silk_drape' || b.special === 'paper_bag') {
        const isSilk = (b.special === 'silk_drape');
        ctx.save();
        ctx.save();
        ctx.clip(getBottleClipPath2D(maxCap, false));
        const covG = ctx.createLinearGradient(18, shoulderTopY, 82, bBotY);
        if (isSilk) {
          covG.addColorStop(0, 'rgba(30, 58, 138, 0.92)');
          covG.addColorStop(0.5, 'rgba(29, 78, 216, 0.88)');
          covG.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
        } else {
          covG.addColorStop(0, 'rgba(180, 83, 9, 0.92)');
          covG.addColorStop(0.5, 'rgba(146, 64, 14, 0.90)');
          covG.addColorStop(1, 'rgba(69, 26, 3, 0.96)');
        }
        ctx.fillStyle = covG;
        ctx.fillRect(14, shoulderTopY, 72, bBotY - shoulderTopY + 12);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5;
        const wY1 = shoulderBotY + (bBotY - shoulderBotY) * 0.25;
        const wY2 = shoulderBotY + (bBotY - shoulderBotY) * 0.55;
        const wY3 = shoulderBotY + (bBotY - shoulderBotY) * 0.80;
        ctx.stroke(new Path2D(`M 18,${wY1} Q 50,${wY1 + 14} 82,${wY1} M 18,${wY2} Q 50,${wY2 + 14} 82,${wY2} M 18,${wY3} Q 50,${wY3 + 14} 82,${wY3}`));
        ctx.restore();

        ctx.strokeStyle = '#facc15'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        ctx.stroke(new Path2D(`M 35.5,${25.5 + neckOff} A 14.5,3.2 0 0,0 64.5,${25.5 + neckOff}`));

        ctx.save();
        ctx.translate(50, bodyMidY - 8);
        ctx.beginPath(); ctx.arc(0, 0, 19.5, 0, Math.PI * 2);
        ctx.fillStyle = '#eab308'; ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 15.5, 0, Math.PI * 2);
        ctx.fillStyle = isSilk ? '#1e3a8a' : '#7c2d12'; ctx.fill();
        ctx.strokeStyle = isSilk ? '#93c5fd' : '#fdba74'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = '#fef08a';
        ctx.font = '900 15px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`★${leftBags}`, 0, 1);
        ctx.restore();

        drawMicroRestrictionPill(50, bodyMidY + 19, `★满${leftBags}瓶解封`, isSilk ? 'rgba(30, 58, 138, 0.94)' : 'rgba(124, 45, 18, 0.94)', '#fde047', '#fef08a');
        ctx.restore();
      }

      // 机关 C: 冰晶凝霜瓶 (ice_base)
      if (b.special === 'ice_base') {
        const frostH = Math.min(68, (bBotY - shoulderBotY) * 0.56);
        const frostTopY = bBotY - frostH;
        ctx.save();
        ctx.save();
        ctx.clip(getBottleClipPath2D(maxCap, false));
        const iceP = new Path2D(`M 18,${frostTopY + 8} Q 29,${frostTopY - 5} 39,${frostTopY + 6} Q 50,${frostTopY - 7} 62,${frostTopY + 5} Q 73,${frostTopY - 4} 82,${frostTopY + 7} L 82,${bBotY + 6} L 18,${bBotY + 6} Z`);
        const iceG = ctx.createLinearGradient(0, frostTopY, 0, bBotY);
        iceG.addColorStop(0, 'rgba(210, 245, 255, 0.35)');
        iceG.addColorStop(0.6, 'rgba(125, 211, 252, 0.72)');
        iceG.addColorStop(1, 'rgba(224, 247, 255, 0.88)');
        ctx.fillStyle = iceG; ctx.fill(iceP);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.0; ctx.stroke(iceP);
        ctx.restore();

        ctx.save();
        ctx.translate(50, bBotY - 34);
        const diaP = new Path2D('M 0,-18 L 18,0 L 0,18 L -18,0 Z');
        ctx.fillStyle = 'rgba(7, 89, 133, 0.92)'; ctx.fill(diaP);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.9; ctx.stroke(diaP);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 15.5px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(b.poursToBreak || 1), 0, 1);
        ctx.restore();

        drawMicroRestrictionPill(50, bBotY - 10, `❄️合${b.poursToBreak || 1}次破冰`, 'rgba(7, 89, 133, 0.94)', '#7dd3fc', '#e0f2fe');
        ctx.restore();
      }

      // 机关 D: 极寒冰封琉璃瓶 (full_ice)
      if (b.special === 'full_ice') {
        ctx.save();
        ctx.save();
        ctx.clip(getBottleClipPath2D(maxCap, false));
        const fIceG = ctx.createLinearGradient(18, neckLipTopY, 82, bBotY);
        fIceG.addColorStop(0, 'rgba(186, 230, 253, 0.62)');
        fIceG.addColorStop(0.5, 'rgba(125, 211, 252, 0.52)');
        fIceG.addColorStop(1, 'rgba(56, 189, 248, 0.72)');
        ctx.fillStyle = fIceG;
        ctx.fillRect(14, neckLipTopY, 72, bBotY - neckLipTopY + 12);
        ctx.restore();

        ctx.save();
        ctx.translate(50, bodyMidY - 8);
        const diaP = new Path2D('M 0,-20 L 20,0 L 0,20 L -20,0 Z');
        ctx.fillStyle = 'rgba(7, 89, 133, 0.92)'; ctx.fill(diaP);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.0; ctx.stroke(diaP);
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 15px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`❄${leftBags}`, 0, 1);
        ctx.restore();

        drawMicroRestrictionPill(50, bodyMidY + 19, `❄️满${leftBags}瓶破冰`, 'rgba(7, 89, 133, 0.94)', '#bae6fd', '#ffffff');
        ctx.restore();
      }

      // 机关 E: 黑曜鎏金箍瓶 (stone_base)
      if (b.special === 'stone_base') {
        const bandY1 = bBotY - 46, bandY2 = bBotY - 18;
        ctx.save();
        [bandY1, bandY2].forEach(by => {
          const bP = new Path2D(`M 17.6,${by} A 32.4,7.8 0 0,0 82.4,${by} L 82.4,${by + 8.5} A 32.4,7.8 0 0,1 17.6,${by + 8.5} Z`);
          ctx.fillStyle = '#d97706'; ctx.fill(bP);
          ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.1; ctx.stroke(bP);
        });
        ctx.save();
        ctx.translate(50, bBotY - 33);
        ctx.beginPath(); ctx.arc(0, 0, 17.5, 0, Math.PI * 2);
        ctx.fillStyle = '#eab308'; ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 13.5, 0, Math.PI * 2);
        ctx.fillStyle = '#291507'; ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.font = '900 15.5px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(b.poursToBreak || 1), 0, 1);
        ctx.restore();

        drawMicroRestrictionPill(50, bBotY - 9, `🔒合${b.poursToBreak || 1}次解箍`, 'rgba(41, 21, 7, 0.94)', '#fde047', '#fef08a');
        ctx.restore();
      }

      // 机关 F: 专属色环契约瓶 (color_lock) + 拿起水瓶时的操作前实时红绿正误反馈
      if (b.special === 'color_lock') {
        const reqCol = COLORS[b.requiredColor || 'blue'] || COLORS.blue;
        const shortColName = (reqCol.name || '同色').slice(0, 1);
        ctx.save();
        ctx.save();
        ctx.translate(0, neckOff);
        ctx.beginPath(); cEl(ctx, 50, 9.2, 19.5, 4.4);
        ctx.strokeStyle = reqCol.topLight; ctx.lineWidth = 2.4; ctx.stroke();
        const colBand = new Path2D('M 33.5,21.0 A 16.5,4.2 0 0,0 66.5,21.0 L 66.5,26.8 A 16.5,4.2 0 0,1 33.5,26.8 Z');
        ctx.fillStyle = reqCol.mid; ctx.fill(colBand);
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.4; ctx.stroke(colBand);
        ctx.restore();

        if (!b.corked) {
          ctx.save();
          ctx.translate(50, bodyMidY - 8);
          const shOut = new Path2D('M -17,-18 L 17,-18 L 19,-2 C 19,11 0,20 0,20 C 0,20 -19,11 -19,-2 Z');
          ctx.fillStyle = '#eab308'; ctx.fill(shOut);
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.stroke(shOut);
          const shIn = new Path2D('M -13.5,-14.5 L 13.5,-14.5 L 15,-2 C 15,8 0,15.5 0,15.5 C 0,15.5 -15,8 -15,-2 Z');
          ctx.fillStyle = reqCol.mid; ctx.fill(shIn);
          ctx.restore();

          drawMicroRestrictionPill(50, bodyMidY + 18, `🔒仅${shortColName}色可入`, reqCol.bagDark || '#1e293b', '#ffffff', '#ffffff');
        }
        ctx.restore();
      }

      // 机关 G: 单向接水漏斗瓶 (one_way_in)
      if (b.special === 'one_way_in' && !b.corked) {
        ctx.save();
        ctx.translate(0, neckOff);
        const funP = new Path2D('M 22,-2 L 78,-2 L 60,24 L 57,35 L 43,35 L 40,24 Z');
        ctx.fillStyle = 'rgba(253, 224, 71, 0.38)'; ctx.fill(funP);
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2.2; ctx.stroke(funP);
        ctx.beginPath(); cEl(ctx, 50, -2, 28, 5.2);
        ctx.fillStyle = 'rgba(120, 53, 15, 0.58)'; ctx.fill();
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.4; ctx.stroke();
        ctx.beginPath(); ctx.arc(50, 16, 13.5, 0, Math.PI * 2);
        ctx.fillStyle = '#064e3b'; ctx.fill();
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.0; ctx.stroke();
        const triP = new Path2D('M 42.5,11.5 L 57.5,11.5 L 50,23.5 Z');
        ctx.fillStyle = '#34d399'; ctx.fill(triP);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.stroke(triP);
        ctx.restore();
        drawMicroRestrictionPill(50, shoulderBotY + 11, '⏬只进不出', 'rgba(6, 78, 59, 0.92)', '#34d399', '#ecfdf5');
      }

      // 机关 H: 单向出水古瓶 (one_way_out)
      if (b.special === 'one_way_out' && !b.corked) {
        ctx.save();
        ctx.translate(0, neckOff);
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        ctx.stroke(new Path2D('M 35,16 C 20,11 20,30 35,30'));
        ctx.stroke(new Path2D('M 65,16 C 80,11 80,30 65,30'));
        const spP = new Path2D('M 31,12 L 40,-2 L 60,-2 L 69,12 Z');
        ctx.fillStyle = '#d97706'; ctx.fill(spP);
        ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 1.5; ctx.stroke(spP);
        ctx.beginPath(); ctx.arc(50, 24, 13.5, 0, Math.PI * 2);
        ctx.fillStyle = '#3b0764'; ctx.fill();
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 2.0; ctx.stroke();
        const triP = new Path2D('M 42.5,28.5 L 57.5,28.5 L 50,16.5 Z');
        ctx.fillStyle = '#fde047'; ctx.fill(triP);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2; ctx.stroke(triP);
        ctx.restore();
        drawMicroRestrictionPill(50, shoulderBotY + 11, '⏫只出不进', 'rgba(88, 28, 135, 0.92)', '#fde047', '#fef08a');
      }

      // 机关 I: 星砂流沙炸弹瓶 (countdownMoves > 0)
      if (typeof b.countdownMoves === 'number' && b.countdownMoves > 0 && !b.corked) {
        const isDanger = b.countdownMoves <= 2;
        const chainY = shoulderBotY + 16;
        ctx.save();
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2.4; ctx.setLineDash([4, 2]);
        ctx.stroke(new Path2D(`M 16,${chainY} Q 50,${chainY + 18} 84,${chainY}`));
        ctx.setLineDash([]);
        ctx.save();
        ctx.translate(50, bodyMidY - 8);
        ctx.beginPath(); ctx.roundRect(-5, -24, 10, 6, 2);
        ctx.fillStyle = '#eab308'; ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.1; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 18.5, 0, Math.PI * 2);
        ctx.fillStyle = '#d97706'; ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.9; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 14.5, 0, Math.PI * 2);
        ctx.fillStyle = isDanger ? '#7f1d1d' : '#1e1b4b'; ctx.fill();
        ctx.strokeStyle = isDanger ? '#fca5a5' : '#fde047'; ctx.lineWidth = 1.2; ctx.stroke();
        ctx.fillStyle = isDanger ? '#fef2f2' : '#fef08a';
        ctx.font = '900 16px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(b.countdownMoves), 0, 1);
        ctx.restore();

        drawMicroRestrictionPill(50, bodyMidY + 18, `⏳${b.countdownMoves}步内排空`, isDanger ? 'rgba(153, 27, 27, 0.95)' : 'rgba(30, 27, 75, 0.94)', isDanger ? '#fca5a5' : '#fde047', '#ffffff');
        ctx.restore();
      }

      // 机关 J: 寒霜封口惩罚 (frozenTurns > 0)
      if (b.frozenTurns && b.frozenTurns > 0) {
        ctx.save();
        ctx.translate(0, neckOff);
        const fPlug = new Path2D('M 22,5 Q 36,-4 50,4 Q 64,-4 78,5 L 74,25 Q 60,34 50,23 Q 38,33 26,25 Z');
        ctx.fillStyle = 'rgba(125, 211, 252, 0.85)'; ctx.fill(fPlug);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.0; ctx.stroke(fPlug);
        ctx.beginPath(); ctx.arc(50, 15, 13.5, 0, Math.PI * 2);
        ctx.fillStyle = '#0369a1'; ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 13.5px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`❄${b.frozenTurns}`, 50, 15.5);
        ctx.restore();
        drawMicroRestrictionPill(50, shoulderBotY + 11, `🧊冰封${b.frozenTurns}步`, 'rgba(3, 105, 161, 0.94)', '#bae6fd', '#ffffff');
      }

      ctx.restore();
    }

    // 4C. 100% 原生 Canvas 2D 水瓶机关破除与揭晓实时粒子特效（星雾揭晓、破冰飞溅、碎石崩解、盲盒袋烈焰灰烬、礼袍揭幕、色锁/古瓶/流沙/空瓶解封）
    function drawBottleVfxOnCanvas(ctx, b, idx) {
      const vfxMap = window._canvasVfxMap;
      if (!vfxMap || !vfxMap[idx]) return;
      const { vfxType, p, easeOut, fade, extraOpts, isPaperBagBurn } = vfxMap[idx];
      const maxCap = b ? (b.maxCap || 4) : 4;
      const isCat = b ? !!b.isGiantCat : false;
      const neckOff = getNeckOffsetY(maxCap, isCat);
      const { bottomY, layerH, rx } = getBottleLayerMetrics(maxCap, isCat);
      const shoulderTopY = 26.0 + neckOff;
      const shoulderBotY = 47.0 + neckOff;
      const bodyMidY = (shoulderBotY + bottomY) * 0.5;

      ctx.save();
      if (vfxType === "mystery_reveal") {
        const layerIdx = (extraOpts && typeof extraOpts.layerIdx === "number") ? extraOpts.layerIdx : 1;
        const colorKey = (extraOpts && extraOpts.colorKey) || "green";
        const col = COLORS[colorKey] || COLORS.green;
        const layerTopY = bottomY - (layerIdx + 1) * layerH;
        const cy = layerTopY + layerH * 0.5;

        // (1) 深邃星雾幕布自上而下丝滑退去 + 亮金扫描光锋
        if (p < 0.85) {
          const curtainRatio = Math.max(0, 1 - easeOut * 1.18);
          const curtainH = layerH * curtainRatio;
          const scanY = layerTopY + (layerH - curtainH);
          ctx.save();
          ctx.beginPath();
          ctx.rect(19, scanY, 62, curtainH + 3);
          ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
          ctx.fill();
          // 扫描金光锋线
          ctx.strokeStyle = "#fef08a";
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(19, scanY);
          ctx.lineTo(81, scanY);
          ctx.stroke();
          ctx.restore();
        }

        // (2) 双层流光扩散光环
        const ringRx = 10 + easeOut * (rx + 16);
        const ringRy = 4 + easeOut * 12;
        ctx.globalAlpha = fade;
        ctx.strokeStyle = col.topLight; ctx.lineWidth = 4.2 * fade;
        ctx.beginPath(); cEl(ctx, 50, cy, ringRx, ringRy); ctx.stroke();
        ctx.fillStyle = col.topLight;
        ctx.globalAlpha = 0.35 * fade;
        ctx.beginPath(); cEl(ctx, 50, cy, ringRx * 0.72, ringRy * 0.72); ctx.fill();

        // (3) 旋转放大跃出的金色问号
        ctx.globalAlpha = fade;
        const qScale = p < 0.35 ? (1 + (p / 0.35) * 0.75) : (1.75 * (1 - (p - 0.35) / 0.65));
        const qY = cy + 6 - easeOut * 28;
        ctx.save();
        ctx.translate(50, qY);
        ctx.rotate((p * 42 * Math.PI) / 180);
        ctx.scale(Math.max(0.05, qScale), Math.max(0.05, qScale));
        ctx.strokeStyle = "#78350f"; ctx.lineWidth = 3.5;
        ctx.font = '900 26px "Fredoka", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.strokeText("?", 0, 0);
        ctx.fillStyle = "#fef08a";
        ctx.fillText("?", 0, 0);
        ctx.restore();

        // (4) 14 颗璀璨四角星芒飞散
        for (let i = 0; i < 14; i++) {
          const ang = (i / 14) * Math.PI * 2 + 0.3;
          const dist = 10 + easeOut * 38 * (0.7 + 0.3 * (i % 3));
          const px = 50 + Math.cos(ang) * dist;
          const py = cy + Math.sin(ang) * dist * 0.65 - easeOut * 16;
          const sr = Math.max(0.4, (2.6 + (i % 3) * 1.1) * fade);
          if (i % 2 === 0) {
            drawGlowingStar2D(ctx, px, py, sr * 1.3, p * 4 + i, fade);
          } else {
            ctx.fillStyle = col.topLight;
            ctx.beginPath(); ctx.arc(px, py, sr, 0, Math.PI * 2); ctx.fill();
          }
        }
      } else if (vfxType === "ice_shatter" || vfxType === "ice_crack") {
        const isFull = !!(extraOpts && extraOpts.fullBody);
        const cy = isFull ? bodyMidY : (bottomY - 22);
        const ringRx = 16 + easeOut * 46;

        // (1) 极寒冰雾冲击波与冰晶闪光
        ctx.globalAlpha = fade * 0.55;
        const mistG = ctx.createRadialGradient(50, cy, 4, 50, cy, ringRx);
        mistG.addColorStop(0, "#ffffff");
        mistG.addColorStop(0.5, "#7dd3fc");
        mistG.addColorStop(1, "rgba(186, 230, 253, 0)");
        ctx.fillStyle = mistG;
        ctx.beginPath(); cEl(ctx, 50, cy, ringRx, isFull ? ringRx * 0.85 : ringRx * 0.48); ctx.fill();

        ctx.globalAlpha = fade;
        ctx.strokeStyle = "#e0f2fe"; ctx.lineWidth = 4.0 * fade;
        ctx.beginPath(); cEl(ctx, 50, cy, ringRx, ringRx * 0.34); ctx.stroke();

        // (2) 冰晶菱形盾牌一分为二崩裂飞出
        if (vfxType === "ice_shatter") {
          [-1, 1].forEach(dir => {
            ctx.save();
            ctx.translate(50 + dir * easeOut * 28, cy - easeOut * 14 + 28 * p * p);
            ctx.rotate(dir * easeOut * 0.85);
            ctx.scale(fade, fade);
            ctx.fillStyle = "rgba(7, 89, 133, 0.92)";
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.8;
            const halfDia = new Path2D(dir < 0 ? "M 0,-18 L -18,0 L 0,18 Z" : "M 0,-18 L 18,0 L 0,18 Z");
            ctx.fill(halfDia); ctx.stroke(halfDia);
            ctx.restore();
          });
        }

        // (3) 18 枚高折射冰晶碎片向四周抛射坠落
        const shardCount = vfxType === "ice_crack" ? 10 : (isFull ? 20 : 16);
        for (let i = 0; i < shardCount; i++) {
          const seedA = (i / shardCount) * Math.PI * 2 + 0.2;
          const vx = Math.cos(seedA) * (28 + (i % 4) * 13);
          const vy = Math.sin(seedA) * 20 - 26;
          const gravityY = 52 * p * p;
          const sx = 50 + vx * easeOut;
          const sy = (isFull ? (shoulderBotY + (i % 5) * 24) : (bottomY - 22)) + vy * easeOut + gravityY;
          const rot = (i % 2 === 0 ? 1 : -1) * p * (160 + i * 20) * Math.PI / 180;
          const sScale = Math.max(0.05, (0.95 + (i % 3) * 0.28) * fade);
          ctx.save();
          ctx.translate(sx, sy); ctx.rotate(rot); ctx.scale(sScale, sScale);
          ctx.fillStyle = (i % 3 === 0) ? "#ffffff" : (i % 3 === 1 ? "#7dd3fc" : "#38bdf8");
          ctx.strokeStyle = "#0284c7"; ctx.lineWidth = 1.0;
          const shP = new Path2D("M 0,-9 L 8,-2 L 4,8 L -6,7 L -8,-3 Z");
          ctx.fill(shP); ctx.stroke(shP);
          ctx.restore();
        }
      } else if (vfxType === "stone_shatter" || vfxType === "stone_hit") {
        const cy = bottomY - 24;
        ctx.globalAlpha = fade;

        // (1) 金箍断裂向左右弹开
        if (vfxType === "stone_shatter") {
          [-1, 1].forEach(dir => {
            ctx.save();
            ctx.translate(50 + dir * easeOut * 34, cy - easeOut * 10 + 30 * p * p);
            ctx.rotate(dir * easeOut * 0.75);
            ctx.fillStyle = "#d97706";
            ctx.strokeStyle = "#fef08a"; ctx.lineWidth = 1.4;
            ctx.beginPath(); ctx.roundRect(-16, -5, 32, 9, 4); ctx.fill(); ctx.stroke();
            ctx.restore();
          });
        }

        // (2) 6 团暖沙尘雾扩散
        for (let c = 0; c < 6; c++) {
          const cAng = (c / 6) * Math.PI * 2;
          const cx = 50 + Math.cos(cAng) * easeOut * 34;
          const cY = cy + Math.sin(cAng) * easeOut * 12 - easeOut * 8;
          const cr = Math.max(0.5, (8 + easeOut * 12) * fade);
          ctx.fillStyle = `rgba(231, 203, 169, ${(0.52 * fade).toFixed(2)})`;
          ctx.beginPath(); ctx.arc(cx, cY, cr, 0, Math.PI * 2); ctx.fill();
        }

        // (3) 14 块黑曜岩石与金箍残片抛射
        const rockCount = vfxType === "stone_hit" ? 8 : 14;
        for (let i = 0; i < rockCount; i++) {
          const seedA = (i / rockCount) * Math.PI * 2 + 0.4;
          const vx = Math.cos(seedA) * (30 + (i % 3) * 13);
          const vy = Math.sin(seedA) * 16 - 28;
          const gravityY = 60 * p * p;
          const sx = 50 + vx * easeOut;
          const sy = cy + vy * easeOut + gravityY;
          const rot = (i % 2 === 0 ? 1 : -1) * p * 175 * Math.PI / 180;
          const rScale = Math.max(0.05, (0.95 + (i % 3) * 0.25) * fade);
          ctx.save();
          ctx.translate(sx, sy); ctx.rotate(rot); ctx.scale(rScale, rScale);
          ctx.fillStyle = (i % 3 === 0) ? "#facc15" : (i % 2 === 0 ? "#e7cba9" : "#785230");
          ctx.strokeStyle = "#291507"; ctx.lineWidth = 1.1;
          const rkP = new Path2D("M -7,-6 L 6,-8 L 9,2 L 2,8 L -8,5 Z");
          ctx.fill(rkP); ctx.stroke(rkP);
          ctx.restore();
        }
      } else if (isPaperBagBurn) {
        const burnProgress = Math.min(1, p * 1.12);
        const burnSpan = bottomY + 12 - shoulderTopY;
        const burnY = (bottomY + 12) - burnProgress * burnSpan;
        const j1 = Math.sin(p * 26) * 5.5, j2 = Math.cos(p * 31) * 5.5;
        const jagLine = `M 5,${burnY + j1} L 20,${burnY - 6 - j2} L 36,${burnY + 4 + j1} L 50,${burnY - 7 + j2} L 66,${burnY + 5 - j1} L 80,${burnY - 5 + j2} L 95,${burnY + j1}`;
        if (burnProgress < 0.98) {
          ctx.save();
          ctx.clip(new Path2D(`${jagLine} L 96,${shoulderTopY - 12} L 4,${shoulderTopY - 12} Z`));
          const covG = ctx.createLinearGradient(18, shoulderTopY, 82, bottomY);
          covG.addColorStop(0, "rgba(180, 83, 9, 0.94)");
          covG.addColorStop(0.5, "rgba(146, 64, 14, 0.92)");
          covG.addColorStop(1, "rgba(69, 26, 3, 0.96)");
          ctx.fillStyle = covG;
          ctx.fillRect(16, shoulderTopY, 68, burnSpan);
          ctx.restore();

          ctx.globalAlpha = fade;
          ctx.lineCap = "round"; ctx.lineJoin = "round";
          const jP = new Path2D(jagLine);
          ctx.strokeStyle = "#1c1008"; ctx.lineWidth = 9.0; ctx.stroke(jP);
          ctx.strokeStyle = "#ea580c"; ctx.lineWidth = 5.8; ctx.stroke(jP);
          ctx.strokeStyle = "#fef08a"; ctx.lineWidth = 2.6; ctx.stroke(jP);
        }
        for (let a = 0; a < 28; a++) {
          const u1 = hash01(a * 13 + 1), u2 = hash01(a * 13 + 2), u3 = hash01(a * 13 + 3);
          const localP = Math.max(0, Math.min(1, (p - u1 * 0.52) / 0.52));
          if (localP <= 0 || localP >= 1) continue;
          const startY = bottomY - u1 * burnSpan, startX = 12 + u2 * 76;
          const ax = startX + Math.sin(localP * Math.PI * 3 + a) * (8 + u3 * 12) + (u2 - 0.5) * localP * 26;
          const ay = startY - localP * (46 + u3 * 48);
          const aFade = Math.sin(localP * Math.PI) * (1 - localP * 0.32);
          ctx.globalAlpha = aFade;
          ctx.fillStyle = (a % 3 === 0) ? (a % 2 === 0 ? "#fde047" : "#f97316") : "#292524";
          ctx.beginPath(); ctx.arc(ax, ay, Math.max(0.5, 2.5 * aFade), 0, Math.PI * 2); ctx.fill();
        }
      } else if (vfxType === "cover_unveil") {
        // 皇家蓝星缎礼袍向上丝滑掀起并伴随金星绽放（完整还原 DOM 版丝绸揭幕动画！）
        const liftY = -easeOut * 105;
        const scaleX = 1 + easeOut * 0.22;
        const scaleY = Math.max(0.25, 1 - p * 0.42);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(50, bodyMidY + liftY);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-50, -bodyMidY);
        const cloakP = new Path2D(`M 14,${shoulderTopY + 4} Q 50,${shoulderTopY - 10} 86,${shoulderTopY + 4} L 92,${bottomY - 12} Q 50,${bottomY + 8} 8,${bottomY - 12} Z`);
        const cloakG = ctx.createLinearGradient(14, shoulderTopY, 86, bottomY);
        cloakG.addColorStop(0, "rgba(30, 58, 138, 0.92)");
        cloakG.addColorStop(0.5, "rgba(37, 99, 235, 0.88)");
        cloakG.addColorStop(1, "rgba(15, 23, 42, 0.92)");
        ctx.fillStyle = cloakG;
        ctx.fill(cloakP);
        ctx.strokeStyle = "#fde047";
        ctx.lineWidth = 2.4;
        ctx.stroke(cloakP);
        // 礼袍中心金星徽章一并升起
        ctx.beginPath(); ctx.arc(50, bodyMidY - 8, 16, 0, Math.PI * 2);
        ctx.fillStyle = "#eab308"; ctx.fill();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.restore();

        // 瓶身金环与 14 颗璀璨金星迸发
        ctx.globalAlpha = fade;
        ctx.strokeStyle = "#fde047"; ctx.lineWidth = 3.2 * fade;
        ctx.beginPath(); cEl(ctx, 50, bodyMidY, 16 + easeOut * 36, 6 + easeOut * 12); ctx.stroke();
        for (let s = 0; s < 14; s++) {
          const ang = (s / 14) * Math.PI * 2 + p * 2.0;
          const sx = 50 + Math.cos(ang) * (14 + easeOut * 36);
          const sy = bodyMidY + Math.sin(ang) * (20 + easeOut * 32) - easeOut * 30;
          drawGlowingStar2D(ctx, sx, sy, (2.8 + (s % 2) * 1.1) * fade, p * 3 + s, fade);
        }
      } else if (vfxType === "color_unlock" || vfxType === "ancient_vanish" || vfxType === "bomb_defuse" || vfxType === "ad_unlock") {
        const cKey = (extraOpts && extraOpts.colorKey) || "yellow";
        const col = COLORS[cKey] || COLORS.yellow;
        const ringCol = vfxType === "ad_unlock" ? "#e879f9" : (vfxType === "color_unlock" ? col.topLight : "#fde047");
        ctx.globalAlpha = fade;

        // 双层华丽冲击波光环
        const rRx = 14 + easeOut * 42;
        const rRy = 5 + easeOut * 14;
        ctx.strokeStyle = ringCol; ctx.lineWidth = 3.8 * fade;
        ctx.beginPath(); cEl(ctx, 50, bodyMidY, rRx, rRy); ctx.stroke();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.0 * fade;
        ctx.beginPath(); cEl(ctx, 50, bodyMidY - easeOut * 18, rRx * 0.72, rRy * 0.72); ctx.stroke();

        // 机关徽章向上飞升消散特效
        ctx.save();
        ctx.translate(50, bodyMidY - 8 - easeOut * 38);
        const bScale = (1 + easeOut * 0.45) * fade;
        ctx.scale(Math.max(0.05, bScale), Math.max(0.05, bScale));
        ctx.beginPath(); ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = ringCol; ctx.fill();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2.0; ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.font = '900 14px "Fredoka", sans-serif';
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("✓", 0, 1);
        ctx.restore();

        for (let s = 0; s < 16; s++) {
          const ang = (s / 16) * Math.PI * 2 + p * 2.2;
          const sx = 50 + Math.cos(ang) * (12 + easeOut * 38);
          const sy = bodyMidY + Math.sin(ang) * (18 + easeOut * 32) - easeOut * 34;
          drawGlowingStar2D(ctx, sx, sy, (2.6 + (s % 3) * 0.9) * fade, p * 4 + s, fade);
        }
      }
      ctx.restore();
    }

    // ---------------- 5. 100% 实心高饱和 3D 圆柱体积药水绘制器（消除半透明重影与发白，立体感拉满！） ----------------
    function createCanvasLiquidGrad(ctx, gradId) {
      if (gradId === "liq-mystery") {
        const g = ctx.createLinearGradient(18, 0, 82, 0);
        g.addColorStop(0.00, "#090f1d");
        g.addColorStop(0.18, "#1e293b");
        g.addColorStop(0.36, "#475569");
        g.addColorStop(0.64, "#1e293b");
        g.addColorStop(0.88, "#090f1d");
        g.addColorStop(1.00, "#1e293b");
        return g;
      }
      if (gradId === "top-mystery") {
        const g = ctx.createLinearGradient(18, -7, 82, 7);
        g.addColorStop(0, "#64748b");
        g.addColorStop(0.5, "#334155");
        g.addColorStop(1, "#0f172a");
        return g;
      }
      const isTop = gradId.startsWith("top-");
      const cKey = gradId.replace(/^(liq-|top-)/, "");
      const col = COLORS[cKey] || COLORS.blue;
      if (isTop) {
        // 顶层液面 3D 立体椭圆光泽渐变（左前高光 -> 饱满中调 -> 右后深邃边沿）
        const g = ctx.createLinearGradient(19, -5, 81, 6);
        g.addColorStop(0.00, col.topLight);
        g.addColorStop(0.32, col.topRim);
        g.addColorStop(0.72, col.topMid);
        g.addColorStop(1.00, col.left);
        return g;
      }
      // 5段式 3D 实心圆柱 Phong 光照着色渐变：左缘暗部 -> 左前饱满高光柱 -> 核心实心主色 -> 右侧立体背光暗部 -> 右缘菲涅尔反光
      const g = ctx.createLinearGradient(18, 0, 82, 0);
      g.addColorStop(0.00, col.right);
      g.addColorStop(0.12, col.left);
      g.addColorStop(0.32, col.mid);
      g.addColorStop(0.58, col.left);
      g.addColorStop(0.86, col.right);
      g.addColorStop(1.00, col.left);
      return g;
    }

    function drawLiquidLayersDirectNumeric(ctx, layers, idx, options = {}) {
      const {
        topLayerScale = 1, tiltAngle = 0, spillProgress = 0,
        mysteryCount = 0, maxCap = 4, isGiantCat = false,
        sloshPhase = 0, sloshAmplitude = 0
      } = options;

      if (!layers || layers.length === 0) return;
      const effectiveLayers = layers.map((c, i) => (i < mysteryCount ? "mystery_dark" : c));

      let topSameCount = 1;
      for (let i = effectiveLayers.length - 2; i >= 0; i--) {
        if (effectiveLayers[i] === effectiveLayers[effectiveLayers.length - 1]) topSameCount++;
        else break;
      }
      const baseLayersCount = effectiveLayers.length - topSameCount;

      const groups = [];
      let idxCursor = 0;
      while (idxCursor < baseLayersCount) {
        const cKey = effectiveLayers[idxCursor];
        let cnt = 1;
        while (idxCursor + cnt < baseLayersCount && effectiveLayers[idxCursor + cnt] === cKey) cnt++;
        groups.push({ colorKey: cKey, amount: cnt, startLayerIdx: idxCursor });
        idxCursor += cnt;
      }
      const topAmount = topSameCount * Math.max(0, topLayerScale);
      if (topAmount > 0.005) {
        groups.push({ colorKey: effectiveLayers[effectiveLayers.length - 1], amount: topAmount, startLayerIdx: baseLayersCount });
      }
      if (groups.length === 0) return;

      const totalVolume = groups.reduce((acc, g) => acc + g.amount, 0);
      if (totalVolume <= 0.005) return;

      const { bottomY, layerH, rx, ry } = getBottleLayerMetrics(maxCap, isGiantCat);
      const leftX = 50 - rx, rightX = 50 + rx;
      const effectiveTiltDeg = tiltAngle;
      const absTilt = Math.abs(effectiveTiltDeg);

      if (absTilt < 0.08) {
        let curY = bottomY;
        const sloshSin = Math.sin(sloshPhase);
        const sloshCos = Math.cos(sloshPhase * 1.35);
        const topTiltY = sloshAmplitude * 6.5 * sloshSin;
        const waveCrest = sloshAmplitude * 3.8 * sloshCos;
        // 向上凸出的水表面张力拱高（正表面应力饱满上拱穹顶，告别向下凹陷感！）
        const domeRy = Math.max(6.2, ry * 1.12 + sloshAmplitude * 1.5 * sloshCos);

        for (let i = 0; i < groups.length; i++) {
          const g = groups[i];
          const h = g.amount * layerH;
          const yBot = curY;
          const yTop = curY - h;
          curY = yTop;
          const yBotDraw = (i === 0) ? yBot + 3.5 : yBot;
          const gradId = g.colorKey === "mystery_dark" ? "liq-mystery" : `liq-${g.colorKey}`;

          const isTopGroup = (i === groups.length - 1);
          const prevTiltY = (i > 0 && sloshAmplitude > 0.01) ? (topTiltY * 0.32 * (i / groups.length)) : 0;
          const curTiltY = isTopGroup ? topTiltY : (topTiltY * 0.32 * ((i + 1) / groups.length));
          const curWave = isTopGroup ? waveCrest : (waveCrest * 0.25);

          // 顶沿适当下移 2.5px 作为拱脚，使向上凸出的拱顶 (A rx,domeRy 0 0,1) 饱满拱起，充满表面张力！
          const rimDrop = 2.4;
          const yTL = yTop + rimDrop - curTiltY;
          const yTR = yTop + rimDrop + curTiltY;
          const yBL = (i === 0) ? yBotDraw : (yBotDraw + rimDrop - prevTiltY);
          const yBR = (i === 0) ? yBotDraw : (yBotDraw + rimDrop + prevTiltY);

          const colInfo = COLORS[g.colorKey] || COLORS.blue;
          const curDomeRy = isTopGroup ? domeRy : (ry * 0.96);
          const prevDomeRy = (i === 0) ? ry : (ry * 0.96);

          // 关键几何改造：
          // - 顶边从 leftX 到 rightX 采用 A rx,curDomeRy 0 0,1（在屏幕坐标系中顺时针经过上方顶点 y - curDomeRy，形成【向上凸出】的饱满张力弧面！）
          // - 若 i === 0（最底层），底边贴合玻璃瓶底向下圆弧 (A rx,ry 0 0,1)；
          // - 若 i > 0（上层药水），底边从 rightX 回到 leftX 采用 A rx,prevDomeRy 0 0,0（同样经过上方顶点，与下层向上凸出的顶面 100% 严丝合缝咬合！）
          let topEdgeCmd = `A ${rx},${curDomeRy.toFixed(2)} 0 0,1 ${rightX},${yTR.toFixed(2)}`;
          if (sloshAmplitude > 0.01 && isTopGroup) {
            const apexY = yTop + rimDrop - curDomeRy * 1.25 - curWave;
            topEdgeCmd = `C ${50 - rx * 0.48},${(apexY - curTiltY * 0.35).toFixed(2)} ${50 + rx * 0.48},${(apexY + curTiltY * 0.35).toFixed(2)} ${rightX},${yTR.toFixed(2)}`;
          }
          const botEdgeCmd = (i === 0)
            ? `A ${rx},${ry} 0 0,1 ${leftX},${yBL.toFixed(2)}`
            : `A ${rx},${prevDomeRy.toFixed(2)} 0 0,0 ${leftX},${(yBL + 0.8).toFixed(2)}`;

          const layerPath = new Path2D(`M ${leftX},${yTL.toFixed(2)} ${topEdgeCmd} L ${rightX},${(i === 0 ? yBR : yBR + 0.8).toFixed(2)} ${botEdgeCmd} Z`);

          ctx.save();
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = createCanvasLiquidGrad(ctx, gradId);
          ctx.fill(layerPath);

          ctx.clip(layerPath);

          // (1) 顶部向上凸起的表面张力水润渐变过渡层（与下方柱体自然融为一体，绝不产生下凹分界线！）
          if (g.colorKey !== "mystery_dark") {
            const crownApexY = yTop + rimDrop - curDomeRy;
            const tensionG = ctx.createLinearGradient(0, crownApexY - 1, 0, yTop + rimDrop + (isTopGroup ? 16 : 9));
            tensionG.addColorStop(0.00, colInfo.topLight);
            tensionG.addColorStop(0.28, colInfo.topRim || colInfo.topMid);
            tensionG.addColorStop(0.62, colInfo.topMid || colInfo.mid);
            tensionG.addColorStop(1.00, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = tensionG;
            ctx.fillRect(leftX - 2, crownApexY - 4, rx * 2 + 4, curDomeRy + (isTopGroup ? 20 : 12));
          }

          // (2) 液体圆柱内部左前侧 3D 柔和高光亮柱
          const cylSpecG = ctx.createLinearGradient(24, 0, 39, 0);
          cylSpecG.addColorStop(0, "rgba(255, 255, 255, 0)");
          cylSpecG.addColorStop(0.45, g.colorKey === "mystery_dark" ? "rgba(148, 163, 184, 0.16)" : "rgba(255, 255, 255, 0.24)");
          cylSpecG.addColorStop(1, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = cylSpecG;
          ctx.fillRect(24, yTop - curDomeRy - 2, 15, h + curDomeRy + 14);

          // (3) 每层底沿内部微暗体积压边
          const botDepthG = ctx.createLinearGradient(0, yBotDraw - Math.min(12, h * 0.35), 0, yBotDraw + ry);
          botDepthG.addColorStop(0, "rgba(0, 0, 0, 0)");
          botDepthG.addColorStop(1, "rgba(10, 15, 30, 0.20)");
          ctx.fillStyle = botDepthG;
          ctx.fillRect(leftX, yBotDraw - Math.min(12, h * 0.35), rx * 2, Math.min(12, h * 0.35) + ry + 2);
          ctx.restore();

          // 分层交界处：沿着【向上凸起】的层间弧顶绘制高光张力棱线（PI*1.06 ~ PI*1.94 为上半圈向上拱弧！）
          if (i > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.ellipse(50, yBotDraw + rimDrop + 0.6, rx - 0.6, prevDomeRy, 0, Math.PI * 1.05, Math.PI * 1.95, false);
            ctx.strokeStyle = "rgba(15, 23, 42, 0.26)";
            ctx.lineWidth = 1.4;
            ctx.stroke();

            ctx.beginPath();
            ctx.ellipse(50, yBotDraw + rimDrop - 0.5, rx - 0.8, prevDomeRy, 0, Math.PI * 1.07, Math.PI * 1.93, false);
            ctx.strokeStyle = g.colorKey === "mystery_dark" ? "rgba(148, 163, 184, 0.45)" : colInfo.topLight;
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.restore();
          }
        }

        if (mysteryCount > 0) {
          ctx.save();
          ctx.font = '900 22px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          for (let m = 0; m < Math.min(mysteryCount, layers.length); m++) {
            const qCenterY = bottomY - (m + 0.5) * layerH + ry * 0.25;
            ctx.strokeStyle = "rgba(9, 15, 29, 0.75)";
            ctx.lineWidth = 3.2;
            ctx.strokeText("?", 50, qCenterY);
            ctx.fillStyle = "#fef08a";
            ctx.fillText("?", 50, qCenterY);
          }
          ctx.restore();
        }

        // 顶层液面：强化【向上凸出】的水表面张力弯月高光冠（绝不画向下凹的亮线！）
        const topColorKey = groups[groups.length - 1].colorKey;
        const colTop = COLORS[topColorKey] || { topLight: "#7a96ff", topRim: "#5b7cfa", topMid: "#3b5bdb", left: "#2841b5", right: "#1c2d87" };
        const surfaceTiltRad = Math.atan2(topTiltY * 2, rx * 2);
        const shoulderRx = getShoulderRxAtY(curY, maxCap, isGiantCat);
        const topRxEff = Math.min(rx, shoulderRx);
        const topDomeRy = Math.max(5.8, domeRy * (topRxEff / rx));
        const rimDrop = 2.4;

        ctx.save();
        ctx.translate(50, curY + rimDrop);
        ctx.rotate(surfaceTiltRad);
        ctx.globalAlpha = 1.0;

        // (a) 向上拱起的水珠表面张力月牙高光斑（紧贴上拱弧顶内侧，呈现饱满凸起表面张力感）
        if (topColorKey !== "mystery_dark") {
          const domeGlow = ctx.createRadialGradient(-topRxEff * 0.16, -topDomeRy * 0.58, 1, 0, -topDomeRy * 0.25, topRxEff * 0.85);
          domeGlow.addColorStop(0.00, "rgba(255, 255, 255, 0.52)");
          domeGlow.addColorStop(0.45, "rgba(255, 255, 255, 0.18)");
          domeGlow.addColorStop(1.00, "rgba(255, 255, 255, 0)");
          ctx.fillStyle = domeGlow;
          ctx.beginPath();
          ctx.ellipse(0, 0, topRxEff - 1.2, topDomeRy - 0.4, 0, Math.PI, Math.PI * 2, false);
          ctx.closePath();
          ctx.fill();

          // 拱顶左前侧水珠张力反光眉弧（向上弯曲）
          ctx.strokeStyle = "rgba(255, 255, 255, 0.68)";
          ctx.lineWidth = 2.1;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.ellipse(0, 1.6, Math.max(2, topRxEff * 0.72), Math.max(2, topDomeRy * 0.76), 0, Math.PI * 1.15, Math.PI * 1.72, false);
          ctx.stroke();
        }

        // (b) 向上凸出的液面最高冠部张力亮边弧（PI*1.03 ~ PI*1.97，向上拱起！）
        ctx.strokeStyle = topColorKey === "mystery_dark" ? "#94a3b8" : colTop.topLight;
        ctx.lineWidth = 1.85;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, topRxEff - 0.6), Math.max(1, topDomeRy - 0.2), 0, Math.PI * 1.03, Math.PI * 1.97, false);
        ctx.stroke();

        ctx.restore();
        return;
      }

      // 倾倒重力自平衡流体分支
      const rad = (effectiveTiltDeg * Math.PI) / 180;
      const absSin = Math.abs(Math.sin(rad)), cosR = Math.cos(rad);
      const tPtsTop = getTransformedContour(rad);
      const neckOffsetY = getNeckOffsetY(maxCap, isGiantCat);
      const scaleLen = bottomY / 193;
      let yBotGravity = -Infinity;
      for (let i = 0; i < tPtsTop.length; i++) {
        const origP = BOTTLE_INNER_POLY[i];
        if (origP.y >= 26.0) {
          const clampedY = Math.min(bottomY, origP.y * scaleLen);
          const gY = 115 + (origP.x - 50) * Math.sin(rad) + (clampedY - 115) * cosR;
          if (gY > yBotGravity) yBotGravity = gY;
        }
      }

      const neckMouthY = 9.2 + neckOffsetY;
      const yLipGravity = 115 + 10.2 * absSin - (115 - neckMouthY) * cosR;
      const uprightTotalH = totalVolume * layerH;
      const fullSpillDepth = Math.max(12, yBotGravity - yLipGravity);
      const normVol4 = (totalVolume / maxCap) * 4.0;
      const drainFactor = normVol4 < 0.85 ? Math.max(0.12, Math.pow(normVol4 / 0.85, 0.52)) : 1.0;
      const spillTotalH = fullSpillDepth * drainFactor;
      const totalGravityDepth = (1 - spillProgress) * uprightTotalH + spillProgress * spillTotalH;
      const yTopGravity = yBotGravity - totalGravityDepth;

      const SAMPLES = 24;
      const dY = totalGravityDepth / SAMPLES;
      const cumArea = new Float64Array(SAMPLES + 1);
      for (let s = 1; s <= SAMPLES; s++) {
        const chord = getChordAtGravityY(tPtsTop, yBotGravity - (s - 0.5) * dY);
        cumArea[s] = cumArea[s - 1] + (0.45 * (chord.rx * 2) + 0.55 * 69) * dY;
      }
      const totalArea = cumArea[SAMPLES] || 1;
      const interpY = (targetA) => {
        if (targetA <= 0) return yBotGravity;
        if (targetA >= totalArea) return yTopGravity;
        let lo = 0, hi = SAMPLES;
        while (lo < hi - 1) {
          const mid = (lo + hi) >> 1;
          if (cumArea[mid] < targetA) lo = mid; else hi = mid;
        }
        return yBotGravity - (lo + (targetA - cumArea[lo]) / ((cumArea[hi] - cumArea[lo]) || 1e-6)) * dY;
      };

      const numGroups = groups.length;
      const multiLayerShearFade = numGroups > 1 ? Math.max(0, Math.min(1, (82 - absTilt) / 22)) : 0;
      const interfaces = [];
      let accVol = 0;
      for (let k = 0; k <= numGroups; k++) {
        const volFrac = k === 0 ? 0 : (k === numGroups ? 1 : accVol / totalVolume);
        const yG = k === 0 ? yBotGravity : (k === numGroups ? yTopGravity : interpY(volFrac * totalArea));
        const rawShear = (k === 0 || k === numGroups) ? 1.0 : (0.74 + 0.22 * volFrac);
        const shearFactor = 1.0 - (1.0 - rawShear) * multiLayerShearFade;
        interfaces.push({ yG, shearFactor, chord: getChordAtGravityY(tPtsTop, yG) });
        if (k < numGroups) accVol += groups[k].amount;
      }

      ctx.save();
      ctx.translate(50, 115);
      ctx.rotate(-rad);
      ctx.translate(-50, -115);

      for (let i = 0; i < numGroups; i++) {
        const g = groups[i], lowerIf = interfaces[i], upperIf = interfaces[i + 1];
        const upperRelDeg = (1 - upperIf.shearFactor) * effectiveTiltDeg;
        const lowerRelDeg = (1 - lowerIf.shearFactor) * effectiveTiltDeg;
        const upperTan = Math.tan((upperRelDeg * Math.PI) / 180);
        const lowerTan = Math.tan((lowerRelDeg * Math.PI) / 180);
        const minX = -125, maxX = 225;
        const yUL = upperIf.yG + (minX - upperIf.chord.cx) * upperTan;
        const yUR = upperIf.yG + (maxX - upperIf.chord.cx) * upperTan;
        const yBotBase = (i === 0) ? (lowerIf.yG + 18) : (lowerIf.yG + 0.6);
        const yBL = yBotBase + (minX - lowerIf.chord.cx) * lowerTan;
        const yBR = yBotBase + (maxX - lowerIf.chord.cx) * lowerTan;
        const col = COLORS[g.colorKey] || COLORS.blue;
        const gSpanL = Math.min(lowerIf.chord.cx - lowerIf.chord.rx, upperIf.chord.cx - upperIf.chord.rx) - 4;
        const gSpanR = Math.max(lowerIf.chord.cx + lowerIf.chord.rx, upperIf.chord.cx + upperIf.chord.rx) + 4;
        const lg = ctx.createLinearGradient(gSpanL, 0, gSpanR, 0);
        if (g.colorKey === "mystery_dark") {
          lg.addColorStop(0.00, "#090f1d");
          lg.addColorStop(0.22, "#1e293b");
          lg.addColorStop(0.45, "#475569");
          lg.addColorStop(0.75, "#1e293b");
          lg.addColorStop(1.00, "#090f1d");
        } else {
          lg.addColorStop(0.00, col.right);
          lg.addColorStop(0.16, col.left);
          lg.addColorStop(0.38, col.mid);
          lg.addColorStop(0.68, col.left);
          lg.addColorStop(0.90, col.right);
          lg.addColorStop(1.00, col.left);
        }
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.moveTo(minX, yUL);
        ctx.lineTo(maxX, yUR);
        ctx.lineTo(maxX, yBR);
        ctx.lineTo(minX, yBL);
        ctx.closePath();
        ctx.fill();

        if (i > 0) {
          ctx.save();
          ctx.strokeStyle = g.colorKey === "mystery_dark" ? "rgba(148, 163, 184, 0.4)" : col.topLight;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(lowerIf.chord.cx - lowerIf.chord.rx, lowerIf.yG - lowerIf.chord.rx * lowerTan);
          ctx.quadraticCurveTo(lowerIf.chord.cx, lowerIf.yG - 2.2, lowerIf.chord.cx + lowerIf.chord.rx, lowerIf.yG + lowerIf.chord.rx * lowerTan);
          ctx.stroke();
          ctx.restore();
        }
      }

      const topIf = interfaces[numGroups], topChord = topIf.chord;
      const topRx = Math.max(0.5, topChord.rx + 0.4);
      const topRy = Math.max(0.5, Math.min(10.8, Math.max(6.8, totalGravityDepth * 0.72), Math.max(7.2, topChord.rx * 0.24)));
      const topColorKey = groups[numGroups - 1].colorKey;
      const colTop = COLORS[topColorKey] || COLORS.blue;
      const topGradId = topColorKey === "mystery_dark" ? "top-mystery" : `top-${topColorKey}`;
      ctx.beginPath();
      ctx.ellipse(topChord.cx, topIf.yG, topRx, topRy, 0, Math.PI, Math.PI * 2, false);
      ctx.closePath();
      ctx.fillStyle = createCanvasLiquidGrad(ctx, topGradId);
      ctx.fill();
      ctx.strokeStyle = topColorKey === "mystery_dark" ? "#94a3b8" : colTop.topLight;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(topChord.cx, topIf.yG, Math.max(0.5, topRx - 0.8), Math.max(0.5, topRy - 0.3), 0, Math.PI * 1.05, Math.PI * 1.95, false);
      ctx.stroke();
      ctx.restore();
    }

    // 第 4 层：满瓶三段式自然软木塞 + 瓶身流光金环庆典 + 瓶口香槟金星喷发


    // ====================================================================
    // 满瓶阶段 1 & 阶段 2 核心绘制器 (drawNaturalCorkOnCanvas)：
    // - 阶段 1 (animP: 0.00 ~ 0.38): 木塞从高空落下并塞紧瓶口 + 瓶口密封白雾气浪
    // - 阶段 2 (animP: 0.38 ~ 1.00): 木塞塞紧后，触发瓶身粒子特效
    //   (双层流光金环自瓶底向上扫过瓶身 + 环绕瓶身 18 颗璀璨星芒与彩光粒子爆发 + 瓶内 14 颗升腾香槟星泡)
    // ====================================================================
    function drawNaturalCorkOnCanvas(ctx, b, idx) {
      if (!b.corked) return;
      const animP = typeof b.corkAnimProgress === 'number' ? b.corkAnimProgress : 1.0;
      const neckOffsetY = getNeckOffsetY(b.maxCap || 4, !!b.isGiantCat);
      const { bottomY: cBotY } = getBottleLayerMetrics(b.maxCap || 4, !!b.isGiantCat);
      const topColorKey = (b.layers && b.layers.length > 0) ? b.layers[b.layers.length - 1] : 'yellow';
      const colObj = COLORS[topColorKey] || COLORS.yellow;

      ctx.save();
      ctx.translate(0, neckOffsetY);

      let corkY = 0, capScaleX = 1.0, capScaleY = 1.0, plugCompressX = 0.95, isSeated = true;

      // ------------------------------------------------------------------
      // [阶段 1]: 0.00 ~ 0.38 软木塞落下并压紧塞入瓶口
      // ------------------------------------------------------------------
      if (animP < 0.16) {
        isSeated = false;
        const t = animP / 0.16;
        const easeIn = t * t * (2.2 - 1.2 * t);
        corkY = -30 * (1 - easeIn) - 2.2 * easeIn;
        plugCompressX = 1.0;
        ctx.save();
        ctx.fillStyle = `rgba(75, 38, 8, ${(0.12 + 0.34 * easeIn).toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(50, 9.2, 7.5 + 3.5 * easeIn, 1.5 + 0.6 * easeIn, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (animP < 0.38) {
        const insertP = (animP - 0.16) / 0.22;
        if (insertP < 0.50) {
          const u = insertP / 0.50;
          const easePush = 1 - Math.pow(1 - u, 2.4);
          corkY = -2.2 * (1 - easePush) + 1.8 * easePush;
          capScaleX = 1 + 0.075 * Math.sin(u * Math.PI * 0.85);
          capScaleY = 1 - 0.095 * Math.sin(u * Math.PI * 0.85);
          plugCompressX = 1.0 - 0.07 * easePush;
        } else {
          const u2 = (insertP - 0.50) / 0.50;
          const damped = Math.exp(-3.8 * u2) * Math.cos(u2 * Math.PI * 2.0);
          corkY = 1.8 * damped;
          capScaleX = 1 + 0.032 * damped;
          capScaleY = 1 - 0.040 * damped;
          plugCompressX = 0.93 + 0.02 * (1 - Math.exp(-3 * u2));
        }

        // 阶段 1 瓶口密封白雾冲击环
        const sealAlpha = Math.sin(insertP * Math.PI) * 0.85;
        ctx.save();
        ctx.globalAlpha *= sealAlpha;
        ctx.strokeStyle = '#fffbeb';
        ctx.lineWidth = 2.4 * (1 - insertP * 0.5);
        ctx.beginPath();
        ctx.ellipse(50, 9.2, 14 + insertP * 18, 3.2 + insertP * 3.8, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ------------------------------------------------------------------
      // [阶段 2]: 0.38 ~ 1.00 木塞完全塞紧后，触发瓶身粒子特效！
      // ------------------------------------------------------------------
      if (animP >= 0.38 && animP < 1.0) {
        const fxP = (animP - 0.38) / 0.62; // 0.0 -> 1.0 完整瓶身粒子特效周期
        const fxEase = 1 - Math.pow(1 - fxP, 2.2);
        const fxEnv = Math.sin(fxP * Math.PI);
        const fxFade = Math.max(0, 1 - Math.pow(fxP, 1.85));
        const bodySpan = Math.max(60, (cBotY - neckOffsetY) - 22);

        ctx.save();
        // (2A) 第一道黄金流光庆典环自瓶底向上扫过整个瓶身
        const sweepY1 = (cBotY - neckOffsetY) - fxEase * bodySpan;
        const ringG1 = ctx.createLinearGradient(18, sweepY1 - 22, 82, sweepY1 + 22);
        ringG1.addColorStop(0, 'rgba(254, 240, 138, 0)');
        ringG1.addColorStop(0.5, `rgba(254, 240, 138, ${(fxEnv * 0.68).toFixed(2)})`);
        ringG1.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = ringG1;
        ctx.fillRect(19, Math.max(20, sweepY1 - 22), 62, 44);

        ctx.strokeStyle = `rgba(254, 240, 138, ${(fxEnv * 0.92).toFixed(2)})`;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.ellipse(50, Math.max(22, sweepY1), 30.8, 7.0, 0, 0, Math.PI * 2);
        ctx.stroke();

        // (2B) 第二道同色辉光环紧随其后向上掠过瓶身
        if (fxP > 0.12) {
          const fxP2 = Math.min(1, (fxP - 0.12) / 0.88);
          const fxEase2 = 1 - Math.pow(1 - fxP2, 2.2);
          const sweepY2 = (cBotY - neckOffsetY) - fxEase2 * bodySpan;
          ctx.strokeStyle = colObj.topLight || '#ffffff';
          ctx.globalAlpha = Math.sin(fxP2 * Math.PI) * 0.80;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.ellipse(50, Math.max(22, sweepY2), 29.2, 6.2, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // (2C) 瓶身内部升腾的 14 颗香槟微光星泡
        ctx.globalAlpha = 1.0;
        for (let bi = 0; bi < 14; bi++) {
          const bSeed = hash01(bi * 19 + 7);
          const bx = 25 + ((bi * 13) % 50) + Math.sin(fxP * 7 + bi) * 3.5;
          const byStart = (cBotY - neckOffsetY - 8) - (bi % 6) * (bodySpan * 0.13);
          const by = byStart - fxEase * (bodySpan * (0.38 + bSeed * 0.35));
          if (by > 26 && by < (cBotY - neckOffsetY - 4)) {
            const br = (1.5 + (bi % 3) * 0.95) * fxEnv;
            ctx.fillStyle = (bi % 2 === 0) ? '#ffffff' : '#fef08a';
            ctx.globalAlpha = fxEnv * 0.88;
            ctx.beginPath();
            ctx.arc(bx, by, br, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // (2D) 环绕瓶身全高的 18 颗璀璨四角星芒与彩光粒子向外迸发
        ctx.globalAlpha = 1.0;
        for (let s = 0; s < 18; s++) {
          const hFrac = (s + 0.5) / 18;
          const baseY = (cBotY - neckOffsetY - 10) - hFrac * (bodySpan - 8);
          const side = (s % 2 === 0) ? 1 : -1;
          const seed = hash01(s * 31 + 11);
          const outDist = 26 + fxEase * (16 + seed * 18);
          const sx = 50 + side * outDist * Math.cos((fxP - hFrac * 0.35) * 1.4);
          const sy = baseY - fxEase * (10 + seed * 14);
          const sr = (2.6 + (s % 3) * 0.85) * fxFade;
          if (sr > 0.3) {
            if (s % 2 === 0) {
              drawGlowingStar2D(ctx, sx, sy, sr * 1.35, fxEase * 3.6 + s, fxFade * 0.95);
            } else {
              ctx.save();
              ctx.globalAlpha = fxFade * 0.90;
              ctx.fillStyle = (s % 4 === 1) ? (colObj.topLight || '#fef08a') : '#ffffff';
              ctx.beginPath();
              ctx.arc(sx, sy, sr * 0.9, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }
        }
        ctx.restore();
      }


      ctx.translate(50, 9.2 + corkY);
      ctx.scale(capScaleX, capScaleY);
      ctx.translate(-50, -9.2);

      const pL = 50 - 9.8 * plugCompressX;
      const pR = 50 + 9.8 * plugCompressX;
      const pBotL = 50 - 6.6 * plugCompressX;
      const pBotR = 50 + 6.6 * plugCompressX;

      const plugGrad = ctx.createLinearGradient(pL, 10, pR, 10);
      plugGrad.addColorStop(0, '#78350f');
      plugGrad.addColorStop(0.45, '#d97706');
      plugGrad.addColorStop(0.80, '#f59e0b');
      plugGrad.addColorStop(1, '#652b0d');
      ctx.save();
      ctx.globalAlpha *= 0.94;
      ctx.fillStyle = plugGrad;
      ctx.fill(new Path2D(`M ${pL.toFixed(2)},10.0 L ${pR.toFixed(2)},10.0 L ${pBotR.toFixed(2)},24.8 A ${(6.6 * plugCompressX).toFixed(2)},2.0 0 0,1 ${pBotL.toFixed(2)},24.8 Z`));
      ctx.restore();

      if (isSeated) {
        ctx.save();
        ctx.globalAlpha *= 0.58;
        const lipGrad = ctx.createLinearGradient(31, 9, 69, 9);
        lipGrad.addColorStop(0, 'rgba(255, 248, 230, 0.65)');
        lipGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.88)');
        lipGrad.addColorStop(0.55, 'rgba(240, 225, 195, 0.42)');
        lipGrad.addColorStop(1, 'rgba(255, 255, 255, 0.85)');
        ctx.fillStyle = lipGrad;
        ctx.fill(new Path2D('M 31.8,9.2 C 30.2,13.4 31.4,18.2 36.5,20.4 A 13.8,3.2 0 0,0 63.5,20.4 C 68.6,18.2 69.8,13.4 68.2,9.2 A 18.2,3.7 0 0,0 31.8,9.2 Z'));
        ctx.strokeStyle = 'rgba(110, 166, 247, 0.82)';
        ctx.lineWidth = 1.2;
        ctx.stroke(new Path2D('M 36.2,20.2 A 14.0,3.2 0 0,0 63.8,20.2'));
        ctx.restore();
      }

      const sideGrad = ctx.createLinearGradient(36, 3, 64, 3);
      sideGrad.addColorStop(0, '#b45309');
      sideGrad.addColorStop(0.25, '#fde047');
      sideGrad.addColorStop(0.55, '#f59e0b');
      sideGrad.addColorStop(0.82, '#fef08a');
      sideGrad.addColorStop(1, '#92400e');
      const capPath = new Path2D('M 36.2,3.0 L 38.2,10.6 A 11.8,2.6 0 0,0 61.8,10.6 L 63.8,3.0 A 13.8,3.0 0 0,1 36.2,3.0 Z');
      ctx.fillStyle = sideGrad;
      ctx.fill(capPath);
      ctx.strokeStyle = '#a36a2c';
      ctx.lineWidth = 0.85;
      ctx.stroke(capPath);

      const topGrad = ctx.createLinearGradient(36, 1, 64, 6);
      topGrad.addColorStop(0, '#fef9c3');
      topGrad.addColorStop(0.45, '#facc15');
      topGrad.addColorStop(1, '#d97706');
      ctx.beginPath();
      ctx.ellipse(50, 3.0, 13.8, 2.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = topGrad;
      ctx.fill();
      ctx.strokeStyle = '#fff3db';
      ctx.lineWidth = 0.85;
      ctx.stroke();

      ctx.strokeStyle = 'rgba(184, 125, 62, 0.52)';
      ctx.lineWidth = 0.65;
      ctx.beginPath();
      ctx.ellipse(50, 2.9, 8.6, 1.55, 0, 0, Math.PI * 2);
      ctx.stroke();

      if (isSeated) {
        ctx.strokeStyle = 'rgba(205, 226, 255, 0.9)';
        ctx.lineWidth = 1.25;
        ctx.stroke(new Path2D('M 32.4,9.5 A 17.8,3.5 0 0,0 67.6,9.5'));
      }
      ctx.restore();
    }

    // ---------------- 7. 静止水瓶整瓶离屏位图缓存（固定槽位复用池，0 额外画布分配，完美适配微信小游戏真机显存限制！） ----------------
    const bottleSlotCanvasPool = [];
    const bottleSlotCacheKey = [];
    const bottleBackGlassCache = new Map();
    const bottleFrontShellCache = new Map();

    function getCachedBottleBackGlass(b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH) {
      const neckOff = getNeckOffsetY(maxCap, isGiantCat);
      const key = `bg_${maxCap}_${neckOff}_${isGiantCat ? 1 : 0}_${b.special || 'none'}_${b.requiredColor || ''}`;
      let off = bottleBackGlassCache.get(key);
      if (!off) {
        if (bottleBackGlassCache.size > 32) bottleBackGlassCache.clear();
        off = createOffscreenCanvas(vbW * 2, vbH * 2);
        const sr = 2.0;
        off.width = Math.round(vbW * sr);
        off.height = Math.round(vbH * sr);
        const c = off.getContext('2d');
        c.save();
        c.scale(sr, sr);
        c.translate(-vbMinX, -vbMinY);
        drawNativeBottleBackGlass(c, b, idx);
        c.restore();
        bottleBackGlassCache.set(key, off);
      }
      return off;
    }

    function getCachedBottleFrontShell(b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH) {
      const leftBags = ['silk_drape', 'full_ice', 'paper_bag'].includes(b.special) ? Math.max(1, (b.unlockOrder || 1) - packedTotal) : 0;
      const isEmpty = !b.layers || b.layers.length === 0;
      const isDanger = (b.special === 'bomb_countdown' && (b.countdownMoves || 0) <= 2);
      // Bomb danger pulse animates scale, so skip static shell cache only for danger bomb
      if (isDanger) return null;
      const neckOff = getNeckOffsetY(maxCap, isGiantCat);
      const key = `fs_${maxCap}_${neckOff}_${isGiantCat ? 1 : 0}_sp${b.special || 'none'}_req${b.requiredColor || ''}_p${b.poursToBreak || 0}_u${leftBags}_cd${b.countdownMoves || 0}_fz${b.frozenTurns || 0}_emp${isEmpty ? 1 : 0}`;
      let off = bottleFrontShellCache.get(key);
      if (!off) {
        if (bottleFrontShellCache.size > 48) bottleFrontShellCache.clear();
        off = createOffscreenCanvas(vbW * 2, vbH * 2);
        const sr = 2.0;
        off.width = Math.round(vbW * sr);
        off.height = Math.round(vbH * sr);
        const c = off.getContext('2d');
        c.save();
        c.scale(sr, sr);
        c.translate(-vbMinX, -vbMinY);
        drawNativeBottleShellAndSpecials(c, b, idx);
        c.restore();
        bottleFrontShellCache.set(key, off);
      }
      return off;
    }

    function renderBottleDirectToCtx(targetCtx, b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH, liqOpts) {
      // (0) 极速贴入离屏缓存好的后壁立体折射玻璃底色（避免晃动/倾倒时每帧重绘后壁 Path2D）
      const bgSp = getCachedBottleBackGlass(b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH);
      targetCtx.drawImage(bgSp, vbMinX, vbMinY, vbW, vbH);

      // (1) 绘制瓶腔内 3D 圆柱体积药水
      const hideLiquid = (b.special === 'paper_bag' || b.special === 'silk_drape');
      if (!hideLiquid && liqOpts.layers && liqOpts.layers.length > 0) {
        targetCtx.save();
        if (!isGiantCat) {
          const _nOff = getNeckOffsetY(maxCap, false);
          const { bottomY: _bBotY } = getBottleLayerMetrics(maxCap, false);
          const _nlY = 9.2 + _nOff, _shT = 26.0 + _nOff, _shB = 47.0 + _nOff, _inB = _bBotY - 1.8;
          targetCtx.beginPath();
          targetCtx.moveTo(37.2, _nlY);
          targetCtx.lineTo(62.8, _nlY);
          targetCtx.lineTo(62.8, _shT);
          targetCtx.bezierCurveTo(74.8, _shT + 3.6, 80.2, _shT + 10.5, 80.2, _shB);
          targetCtx.lineTo(80.2, _inB);
          targetCtx.ellipse(50, _inB, 30.2, 7.5, 0, 0, Math.PI, false);
          targetCtx.lineTo(19.8, _shB);
          targetCtx.bezierCurveTo(19.8, _shT + 10.5, 25.2, _shT + 3.6, 37.2, _shT);
          targetCtx.closePath();
          targetCtx.clip();
        } else {
          targetCtx.clip(getBottleClipPath2D(maxCap, isGiantCat));
        }
        drawLiquidLayersDirectNumeric(targetCtx, liqOpts.layers, idx, liqOpts);
        targetCtx.restore();
      }

      // (2) 极速贴入离屏缓存好的前壁软箱高光柱、沉底焦散厚玻璃底座、10层立体玻璃瓶口与特殊机关
      const fsSp = getCachedBottleFrontShell(b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH);
      if (fsSp) {
        targetCtx.drawImage(fsSp, vbMinX, vbMinY, vbW, vbH);
      } else {
        drawNativeBottleShellAndSpecials(targetCtx, b, idx);
      }

      // (3) 绘制软木塞
      if (b.corked) {
        drawNaturalCorkOnCanvas(targetCtx, b, idx);
      }

      // (4) 绘制瓶身实时机关破除/揭晓/燃烧粒子特效
      drawBottleVfxOnCanvas(targetCtx, b, idx);
    }

    function drawSingleBottleContents(targetCtx, b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH, liqOpts, isPouringSrc, isPouringDst) {
      const isSloshing = (liqOpts.sloshAmplitude || 0) > 0.008;
      const isTilted = Math.abs(liqOpts.tiltAngle || 0) > 0.05 || (liqOpts.topLayerScale !== undefined && Math.abs(liqOpts.topLayerScale - 1) > 0.005);
      const isCorkAnimating = b.corked && typeof b.corkAnimProgress === 'number' && b.corkAnimProgress < 0.99;
      const hasActiveVfx = !!(window._canvasVfxMap && window._canvasVfxMap[idx]);

      // 动态倾倒、晃动、压塞或播放机关特效过程中：直接实时绘制（此时前后玻璃壳已走离屏精灵图缓存，速度提升 8 倍！）
      if (isPouringSrc || isPouringDst || isSloshing || isTilted || isCorkAnimating || hasActiveVfx) {
        renderBottleDirectToCtx(targetCtx, b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH, liqOpts);
        return;
      }

      // 静止瓶：按槽位复用离屏画布（最多 14 个固定槽位，倾倒后直接重绘该槽位画布，绝不无限创建新 Canvas！）
      const leftBags = ['silk_drape', 'full_ice', 'paper_bag'].includes(b.special) ? Math.max(1, (b.unlockOrder || 1) - packedTotal) : 0;
      const neckOff = getNeckOffsetY(maxCap, isGiantCat);
      const scaleRes = 2.0;
      const targetW = Math.max(1, Math.round(vbW * scaleRes));
      const targetH = Math.max(1, Math.round(vbH * scaleRes));
      const cacheKey = `sb_${targetW}x${targetH}_${maxCap}_${neckOff}_${isGiantCat ? 1 : 0}_${(b.layers || []).join(',')}_m${b.mysteryCount || 0}_sp${b.special}_req${b.requiredColor || ''}_p${b.poursToBreak || 0}_u${leftBags}_cd${b.countdownMoves || 0}_fz${b.frozenTurns || 0}_ck${b.corked ? 1 : 0}`;
      let off = bottleSlotCanvasPool[idx];
      if (!off || bottleSlotCacheKey[idx] !== cacheKey) {
        if (!off) {
          off = createOffscreenCanvas(targetW, targetH);
          bottleSlotCanvasPool[idx] = off;
        }
        if (off.width !== targetW) off.width = targetW;
        if (off.height !== targetH) off.height = targetH;
        const oCtx = off.getContext('2d');
        oCtx.clearRect(0, 0, targetW, targetH);
        oCtx.save();
        oCtx.scale(scaleRes, scaleRes);
        oCtx.translate(-vbMinX, -vbMinY);
        renderBottleDirectToCtx(oCtx, b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH, liqOpts);
        oCtx.restore();
        bottleSlotCacheKey[idx] = cacheKey;
      }
      targetCtx.drawImage(off, vbMinX, vbMinY, vbW, vbH);
    }

    const bottleVisualState = (window._bottleVisualState = {});
    let activeHitRegions = [];
    let pressedHitId = null;

    function registerHitRegion(id, x, y, w, h, zIndex, onClick) {
      activeHitRegions.push({ id, x, y, w, h, zIndex: zIndex || 1, onClick });
    }

    // 原生 Canvas 2D 实时绘制倾倒水柱、皇冠水花、水下气柱、瓶身流光星芒与运动拖尾
    function drawPourStreamAndTrailOnCanvas(ctx, pState) {
      if (!pState || !pState.active) return;
      const { trailHistory, colObj, phase, p, streamCtx, bodyPose } = pState;

      // 0. 仅绘制环绕瓶身外围的灵动四角星芒微粒（去除覆盖在瓶身上的半透明色雾椭圆与色带，保持倾倒时琉璃瓶身100%通透干净！）
      if (bodyPose && colObj) {
        const { cx, cy, w, h } = bodyPose;
        const nowT = performance.now() * 0.003;
        for (let i = 0; i < 10; i++) {
          const seedA = hash01(i * 31 + 7) * Math.PI * 2 + nowT * (i % 2 === 0 ? 1.1 : -0.9);
          const rx = (w * 0.54) + hash01(i * 17 + 3) * 18;
          const ry = (h * 0.46) + hash01(i * 23 + 5) * 18;
          const sx = cx + Math.cos(seedA) * rx;
          const sy = cy + Math.sin(seedA) * ry - ((nowT * 16 + i * 9) % 20);
          const sr = 2.2 + (i % 3) * 0.95;
          const sAlpha = (0.42 + 0.42 * Math.sin(nowT * 3 + i)) * (phase === 'return' ? (1 - p * 0.7) : 1);
          drawGlowingStar2D(ctx, sx, sy, sr, nowT + i, sAlpha);
        }
      }

      if (phase === 'pour' && streamCtx) {
        const { spoutX, spoutY, mouthX, mouthY, surfaceY, dstRect, colObj: sCol, pourProgress, moveCount, currentTotalLayers, dstBottle } = streamCtx;
        const headRatio = Math.min(1, pourProgress / 0.09);
        const tailRatio = pourProgress > 0.90 ? Math.min(1, (pourProgress - 0.90) / 0.10) : 0;
        const totalDrop = Math.max(18, surfaceY - spoutY);
        const yStart = spoutY + totalDrop * (tailRatio * tailRatio * 0.82);
        const yEnd = spoutY + totalDrop * (headRatio * headRatio);

        if (yEnd - yStart >= 4) {
          const isCatTarget = dstBottle && dstBottle.isGiantCat;
          const dstCapVal = dstBottle ? (dstBottle.maxCap || 4) : 4;
          const { vbW, vbH, layerH: dstLayerH, rx: bottleInnerRx } = getBottleLayerMetrics(dstCapVal, isCatTarget);
          const scale = Math.min(dstRect.width / vbW, dstRect.height / vbH);
          const dropInBottlePx = Math.max(12, surfaceY - mouthY);
          const maxDropInBottlePx = Math.max(60, dstRect.height * 0.78);
          const heightFactor = Math.max(0.30, Math.min(1.42, (dropInBottlePx / maxDropInBottlePx) * 1.38));
          const volumeFactor = 0.86 + Math.min(3, moveCount - 1) * 0.24;
          const impactEnergy = heightFactor * volumeFactor;

          const N = 18;
          const leftEdge = [], rightEdge = [], specCenterCurve = [];
          const archHeight = Math.max(16, (mouthY - spoutY) + 11);
          const fluxRadiusBoost = 0.94 + Math.min(3, moveCount - 1) * 0.14;
          const timeNow = performance.now() * 0.012;

          for (let i = 0; i <= N; i++) {
            const s = i / N;
            const y = yStart + (yEnd - yStart) * s;
            const dyFromSpout = Math.max(0, y - spoutY);
            const globalS = Math.max(0, Math.min(1, dyFromSpout / totalDrop));
            let x = dyFromSpout < archHeight
              ? (spoutX + (mouthX - spoutX) * Math.sin((dyFromSpout / archHeight) * Math.PI * 0.5))
              : (mouthX + Math.sin(globalS * 7.5 - timeNow * 2.2) * (0.45 * heightFactor));
            const gravityNarrow = 1.0 - 0.28 * Math.pow(globalS, 0.65);
            const mouthTaper = dyFromSpout < 9 ? (0.62 + 0.38 * (dyFromSpout / 9)) : 1.0;
            const surfaceFlare = (globalS > 0.90 && headRatio >= 0.98)
              ? (1.0 + Math.pow((globalS - 0.90) / 0.10, 1.5) * (0.55 + 0.35 * impactEnergy))
              : 1.0;
            const flutter = 1.0 + Math.sin(globalS * 14 - timeNow * 3.4) * 0.045;
            const tailShrink = tailRatio > 0 ? Math.max(0.2, 1 - tailRatio * 0.65) : 1.0;
            const halfW = 3.8 * fluxRadiusBoost * gravityNarrow * mouthTaper * surfaceFlare * flutter * tailShrink;
            leftEdge.push({ x: x - halfW, y, halfW });
            rightEdge.push({ x: x + halfW, y, halfW });
            specCenterCurve.push(`${(x - halfW * 0.22).toFixed(1)},${y.toFixed(1)}`);
          }

          const firstL = leftEdge[0], firstR = rightEdge[0];
          const lastL = leftEdge[leftEdge.length - 1];
          let streamPath = `M ${firstL.x.toFixed(1)},${firstL.y.toFixed(1)} Q ${((firstL.x + firstR.x) * 0.5).toFixed(1)},${(firstL.y - 1.2).toFixed(1)} ${firstR.x.toFixed(1)},${firstR.y.toFixed(1)} `;
          for (let i = 1; i < rightEdge.length; i++) streamPath += `L ${rightEdge[i].x.toFixed(1)},${rightEdge[i].y.toFixed(1)} `;
          streamPath += `A ${lastL.halfW.toFixed(1)},${(lastL.halfW * 0.45).toFixed(1)} 0 0,1 ${lastL.x.toFixed(1)},${lastL.y.toFixed(1)} `;
          for (let i = leftEdge.length - 2; i >= 0; i--) streamPath += `L ${leftEdge[i].x.toFixed(1)},${leftEdge[i].y.toFixed(1)} `;
          streamPath += 'Z';

          ctx.save();
          const sg = ctx.createLinearGradient(mouthX - 6, spoutY, mouthX + 6, spoutY);
          sg.addColorStop(0, sCol.left);
          sg.addColorStop(0.28, sCol.mid);
          sg.addColorStop(0.68, sCol.topLight);
          sg.addColorStop(1, sCol.right);
          ctx.fillStyle = sg;
          ctx.fill(new Path2D(streamPath));

          ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.lineWidth = 1.15 * fluxRadiusBoost;
          ctx.lineCap = 'round';
          ctx.stroke(new Path2D('M ' + specCenterCurve.join(' L ')));

          if (headRatio >= 0.96 && tailRatio < 0.92) {
            const lifeEnvelope = Math.sin(Math.min(1, Math.max(0, (pourProgress - 0.08) / 0.84)) * Math.PI);
            const effEnergy = impactEnergy * (0.72 + 0.28 * lifeEnvelope);
            const maxWallRx = (bottleInnerRx || 31.3) - 3.5;
            const poolDepthSvg = Math.max(0, currentTotalLayers * (dstLayerH || 36.2));

            // (a) 目标瓶口前唇高光折射遮罩（让水柱视觉上穿过瓶口内壁！）
            if (Math.abs(mouthY - spoutY) < 90) {
              ctx.save();
              ctx.translate(mouthX, mouthY);
              ctx.scale(scale, scale);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              ctx.arc(0, 0, 18.2, 0.12 * Math.PI, 0.88 * Math.PI);
              ctx.stroke();
              ctx.restore();
            }

            ctx.translate(mouthX, surfaceY);
            ctx.scale(scale, scale);

            // (b) 水下冲入发光气柱 (subPlume) 与冲击白沫凹坑 (splashFoamCrater)
            if (poolDepthSvg > 4.5) {
              const plumeD = Math.min(poolDepthSvg * 0.78, 12 + effEnergy * 20);
              const plumeW = Math.min(maxWallRx * 0.55, 5.5 + effEnergy * 4.5);
              const pg = ctx.createLinearGradient(0, 0, 0, plumeD);
              pg.addColorStop(0, '#ffffff');
              pg.addColorStop(0.45, sCol.topLight);
              pg.addColorStop(1, 'rgba(255,255,255,0)');
              ctx.save();
              ctx.globalAlpha = 0.52 * Math.min(1, effEnergy);
              ctx.fillStyle = pg;
              ctx.beginPath();
              ctx.ellipse(0, plumeD * 0.45, plumeW, plumeD * 0.55, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }

            // 冲击中心亮白泡沫光斑
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
            ctx.beginPath();
            ctx.ellipse(0, 0.3, 6.2 + effEnergy * 3.5, 1.8 + effEnergy * 0.9, 0, 0, Math.PI * 2);
            ctx.fill();

            // 4~6 瓣皇冠飞溅水花瓣 (crownJets)
            const jetCount = Math.min(6, 4 + Math.floor(effEnergy * 1.5));
            for (let j = 0; j < jetCount; j++) {
              const jPhase = (pourProgress * 5.2 + j / jetCount) % 1.0;
              const side = (j % 2 === 0 ? 1 : -1) * (0.45 + 0.55 * ((j >> 1) / 3));
              const jx = side * (6 + jPhase * 11 * effEnergy);
              const jy = -Math.sin(jPhase * Math.PI) * (5.5 + effEnergy * 6.5);
              ctx.strokeStyle = (j % 2 === 0) ? '#ffffff' : sCol.topLight;
              ctx.lineWidth = 1.8 * (1 - jPhase * 0.6);
              ctx.beginPath();
              ctx.moveTo(side * 2.5, 0);
              ctx.quadraticCurveTo(jx * 0.6, jy - 2, jx, jy);
              ctx.stroke();
            }
            ctx.restore();

            for (let rIdx = 0; rIdx < 3; rIdx++) {
              const rPhase = (pourProgress * (3.6 + volumeFactor * 0.8) + rIdx / 3) % 1.0;
              const maxRipRx = Math.min(maxWallRx, 14 + effEnergy * 13);
              const curRx = 3.8 + rPhase * maxRipRx;
              const curRy = curRx * 0.24;
              const ripAlpha = (1 - rPhase) * (rIdx === 0 ? 0.82 : 0.58) * Math.min(1, effEnergy * 0.95);
              ctx.strokeStyle = (rIdx % 2 === 0) ? `rgba(255,255,255,${ripAlpha.toFixed(2)})` : sCol.topLight;
              ctx.lineWidth = (1.6 - rPhase * 1.1) * (0.85 + 0.25 * effEnergy);
              ctx.beginPath();
              ctx.ellipse(0, 0.4, curRx, curRy, 0, 0, Math.PI * 2);
              ctx.stroke();
            }

            if (poolDepthSvg > 4.5) {
              const maxPlungeSvg = Math.min(poolDepthSvg * 0.76, 10 + effEnergy * 18);
              const bubbleCount = Math.min(10, Math.round(4 + effEnergy * 4 + moveCount));
              for (let b = 0; b < bubbleCount; b++) {
                const seed1 = hash01(b * 19 + 3), seed2 = hash01(b * 37 + 11), seed3 = hash01(b * 53 + 7);
                const bCycle = (pourProgress * (2.4 + seed1 * 2.2) + seed2) % 1.0;
                const depthRatio = 1 - Math.pow(bCycle, 0.85);
                const by = 1.8 + depthRatio * maxPlungeSvg * (0.45 + 0.55 * seed3);
                const spreadSign = (b % 2 === 0 ? 1 : -1);
                const bx = Math.max(-maxWallRx * 0.82, Math.min(maxWallRx * 0.82, spreadSign * (1.8 + (1 - depthRatio) * (5.5 + seed1 * 8.5)) + Math.sin(bCycle * Math.PI * 3 + b) * 1.6));
                const br = Math.max(0.3, (0.85 + seed3 * 2.0) * Math.sin(bCycle * Math.PI * 0.92 + 0.15));
                ctx.fillStyle = (b % 3 === 0) ? '#ffffff' : sCol.topLight;
                ctx.globalAlpha = (0.35 + 0.55 * (1 - bCycle)) * Math.min(1, poolDepthSvg / 14);
                ctx.beginPath();
                ctx.arc(bx, by, br, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            const dropCount = Math.min(8, Math.round(3 + effEnergy * 4));
            for (let d = 0; d < dropCount; d++) {
              const s1 = hash01(d * 41 + 9), s2 = hash01(d * 67 + 15), s3 = hash01(d * 83 + 21);
              const t = (pourProgress * (3.4 + s1 * 2.2) + d / dropCount) % 1.0;
              const side = (d % 2 === 0) ? 1 : -1;
              const vx = side * (6.5 + s1 * 12.5) * Math.min(1.25, 0.55 + effEnergy * 0.58);
              const vy0 = (11.5 + s2 * 15.5) * Math.min(1.35, 0.48 + effEnergy * 0.68);
              const dx = Math.max(-maxWallRx * 0.84, Math.min(maxWallRx * 0.84, vx * t));
              const dy = -vy0 * t + 21.0 * t * t;
              if (dy > 2.2) continue;
              const r = Math.max(0.4, (1.05 + s3 * 1.2) * (1 - t * 0.38));
              ctx.globalAlpha = Math.sin(t * Math.PI) * 0.88;
              ctx.fillStyle = (d % 3 === 0) ? '#ffffff' : sCol.topLight;
              ctx.beginPath();
              ctx.arc(dx, dy, r, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }
    }

    function drawHintGuideOnCanvas(ctx, nowMs) {
      if (!activeHintPair || isAnimating || !layoutCache) return;
      const sSlot = layoutCache.bottleSlots[activeHintPair.srcIdx];
      const dSlot = layoutCache.bottleSlots[activeHintPair.dstIdx];
      if (!sSlot || !dSlot || !sSlot.slotRect || !dSlot.slotRect) return;
      const sRect = sSlot.slotRect, dRect = dSlot.slotRect;
      const sMouthRect = sSlot.mouthRect, dMouthRect = dSlot.mouthRect;
      const sx = sMouthRect ? (sMouthRect.left + sMouthRect.width * 0.5) : (sRect.left + sRect.width * 0.5);
      const sy = sMouthRect ? (sMouthRect.top + sMouthRect.height * 0.5) : (sRect.top + 8);
      const dx = dMouthRect ? (dMouthRect.left + dMouthRect.width * 0.5) : (dRect.left + dRect.width * 0.5);
      const dy = dMouthRect ? (dMouthRect.top + dMouthRect.height * 0.5) : (dRect.top + 10);

      const deltaX = dx - sx, deltaY = dy - sy;
      const isVertical = Math.abs(deltaX) < 48;
      let path2d, angRad = 0, arrowX = dx, arrowY = dy;
      let sBadge = { x: sx, y: sy - 18 }, dBadge = { x: dx, y: dy - 20 };

      if (isVertical) {
        const sideDir = (Math.abs(deltaX) >= 10) ? Math.sign(deltaX) : (sx > viewW * 0.5 ? -1 : 1);
        const bulgeX = Math.max(46, Math.min(68, 42 + Math.abs(deltaY) * 0.08));
        const cp1x = sx + sideDir * bulgeX, cp1y = sy - (deltaY > 0 ? 18 : 28);
        const cp2x = dx + sideDir * (bulgeX * 0.88), cp2y = dy - 26;
        arrowX = dx + sideDir * 2.5; arrowY = dy - 1.5;
        path2d = new Path2D(`M ${sx},${sy} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${arrowX},${arrowY}`);
        angRad = Math.atan2(arrowY - cp2y, arrowX - cp2x);
        sBadge = { x: sx - sideDir * 18, y: sy - 18 };
        dBadge = { x: dx - sideDir * 18, y: dy - 20 };
      } else {
        const archH = Math.max(44, Math.min(88, Math.abs(deltaX) * 0.34));
        const ctrlX = (sx + dx) * 0.5;
        const ctrlY = Math.min(Math.min(sy, dy) - archH, Math.min(sRect.top, dRect.top) - 18);
        path2d = new Path2D(`M ${sx},${sy} Q ${ctrlX},${ctrlY} ${dx},${dy}`);
        angRad = Math.atan2(dy - ctrlY, dx - ctrlX);
      }

      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(12, 24, 56, 0.65)';
      ctx.lineWidth = 8;
      ctx.stroke(path2d);

      const grad = ctx.createLinearGradient(sx, sy, dx, dy);
      grad.addColorStop(0, '#fde047');
      grad.addColorStop(0.5, '#38bdf8');
      grad.addColorStop(1, '#4ade80');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 4.5;
      ctx.setLineDash([9, 5]);
      ctx.lineDashOffset = -(nowMs * 0.035) % 28;
      ctx.stroke(path2d);
      ctx.setLineDash([]);

      ctx.save();
      ctx.translate(arrowX, arrowY);
      ctx.rotate(angRad);
      const arrP = new Path2D('M 4,0 L -11,-7 L -8,0 L -11,7 Z');
      ctx.fillStyle = '#4ade80';
      ctx.fill(arrP);
      ctx.strokeStyle = '#064e3b';
      ctx.lineWidth = 1.8;
      ctx.stroke(arrP);
      ctx.restore();

      const drawCapsule = (bx, by, bgCol, txt) => {
        const cx = Math.max(30, Math.min(viewW - 30, bx));
        ctx.save();
        ctx.translate(cx, by);
        ctx.beginPath();
        ctx.roundRect(-26, -11, 52, 20, 10);
        ctx.fillStyle = bgCol;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 11px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, 0, -0.5);
        ctx.restore();
      };
      drawCapsule(sBadge.x, sBadge.y, '#f59e0b', '① 倒出');
      drawCapsule(dBadge.x, dBadge.y, '#0284c7', '② 倒入');
      ctx.restore();
    }



    const blurSnapshotCanvas = createOffscreenCanvas(72, 110);
    const blurSnapshotCtx = blurSnapshotCanvas.getContext('2d');
    let lastModalOpenState = false;

    function drawStar5(ctx, cx, cy, rOut, rIn, fillCol, strokeCol, lw) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI * 0.5 + (i * Math.PI) / 5;
        const r = (i % 2 === 0) ? rOut : rIn;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (fillCol) { ctx.fillStyle = fillCol; ctx.fill(); }
      if (strokeCol) { ctx.strokeStyle = strokeCol; ctx.lineWidth = lw || 1.5; ctx.stroke(); }
    }

    function drawVideoAdIcon(ctx, cx, cy) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.roundRect(-13, -7, 17, 14, 3.5); ctx.fill();
      ctx.beginPath(); ctx.moveTo(4, -3.5); ctx.lineTo(12, -7); ctx.lineTo(12, 7); ctx.lineTo(4, 3.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2e8500';
      ctx.beginPath(); ctx.moveTo(-6.5, -3.5); ctx.lineTo(-6.5, 3.5); ctx.lineTo(-1, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    // 通用 3D 高光琉璃弹窗按钮绘制器（自带立体底唇、镜面高光弧 ::before 与暖棕文字投影）
    function draw3DGlossyModalButton(ctx, x, y, w, h, radius, palette, labelText, fontSize = 16.5) {
      ctx.save();
      // 1. 底部立体外投影与厚底唇
      ctx.beginPath();
      ctx.roundRect(x, y + 2.5, w, h, radius);
      ctx.fillStyle = palette.shadowCol || 'rgba(68, 38, 6, 0.28)';
      ctx.fill();

      // 2. 主体立体渐变
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      const bg = ctx.createLinearGradient(x, y, x, y + h);
      bg.addColorStop(0, palette.top);
      bg.addColorStop(0.54, palette.mid);
      bg.addColorStop(1, palette.bot);
      ctx.fillStyle = bg;
      ctx.fill();

      // 3. 底部内折射暗弧
      ctx.save();
      ctx.clip();
      ctx.fillStyle = 'rgba(30, 18, 4, 0.16)';
      ctx.fillRect(x, y + h - 4, w, 4);

      // 4. 顶部全宽镜面反光弧 (::before)
      const hlX = x + Math.min(8, w * 0.08);
      const hlW = Math.max(4, w - Math.min(16, w * 0.16));
      const hlH = h * 0.42;
      ctx.beginPath();
      ctx.roundRect(hlX, y + 2.5, hlW, hlH, [radius * 0.75, radius * 0.75, radius, radius]);
      const hlG = ctx.createLinearGradient(0, y + 2.5, 0, y + 2.5 + hlH);
      hlG.addColorStop(0, 'rgba(255, 255, 255, 0.46)');
      hlG.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = hlG;
      ctx.fill();
      ctx.restore();

      // 5. 高亮琉璃外边框
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.84)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // 6. 立体投影文字
      if (labelText) {
        const cx = x + w * 0.5, cy = y + h * 0.5;
        ctx.font = `800 ${fontSize}px "Fredoka", "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = palette.textShadow || 'rgba(55, 32, 6, 0.42)';
        ctx.fillText(labelText, cx, cy + 1.5);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, cx, cy);
      }
      ctx.restore();
    }

    const MODAL_BTN_PALETTES = {
      amber: { top: '#eba942', mid: '#d48c28', bot: '#b87316', shadowCol: 'rgba(105, 58, 8, 0.34)', textShadow: 'rgba(105, 55, 6, 0.44)' },
      green: { top: '#8fa963', mid: '#76914c', bot: '#5e7838', shadowCol: 'rgba(52, 72, 20, 0.34)', textShadow: 'rgba(38, 55, 12, 0.44)' },
      goldSquare: { top: '#e8a544', mid: '#d68f2c', bot: '#c67d20', shadowCol: 'rgba(92, 52, 10, 0.32)', textShadow: 'rgba(90, 48, 8, 0.44)' },
      coralSquare: { top: '#df8558', mid: '#c96c40', bot: '#b65530', shadowCol: 'rgba(92, 42, 14, 0.32)', textShadow: 'rgba(85, 34, 10, 0.44)' }
    };

    // 图2同款：顶部 3D 庆典折带彩旗 + 缤纷气球 + 立体金星标题横幅绘制器
    function drawFig2RibbonHeader(ctx, cx, topY, bannerW, bannerH, titleTxt) {
      ctx.save();
      ctx.translate(cx - bannerW * 0.5, topY);
      ctx.scale(bannerW / 360, bannerH / 115);

      // 1. 缤纷庆典气球
      [[84, 48, 15, '#38bdf8'], [110, 36, 22, '#e879f9'], [242, 34, 21, '#60a5fa'], [272, 44, 24, '#fb7185']].forEach(([bx, by, br, bc]) => {
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fillStyle = bc; ctx.fill();
        ctx.beginPath(); ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.26, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fill();
      });
      // 2. 顶部双金星
      drawStar5(ctx, 142, 34, 18, 7.5, '#fde047', '#d97706', 2.2);
      drawStar5(ctx, 194, 24, 29, 12, '#fde047', '#d97706', 2.8);

      // 3. 左右两侧立体折带尾翼
      ctx.fillStyle = '#d97706'; ctx.strokeStyle = '#92400e'; ctx.lineWidth = 2.2;
      const wL = new Path2D('M 22,68 L 78,60 L 78,96 L 22,102 L 38,85 Z');
      const wR = new Path2D('M 338,68 L 282,60 L 282,96 L 338,102 L 322,85 Z');
      ctx.fill(wL); ctx.stroke(wL);
      ctx.fill(wR); ctx.stroke(wR);

      // 4. 中央拱形暖橙流金主横幅
      const ribG = ctx.createLinearGradient(0, 38, 0, 96);
      ribG.addColorStop(0, '#ffd27d'); ribG.addColorStop(0.4, '#f89c3e'); ribG.addColorStop(1, '#e0741e');
      const mainRib = new Path2D('M 56,56 C 110,36 250,36 304,56 L 294,94 C 242,74 118,74 66,94 Z');
      ctx.fillStyle = ribG; ctx.fill(mainRib);
      ctx.strokeStyle = '#b45309'; ctx.lineWidth = 2.8; ctx.stroke(mainRib);

      // 5. 标题白字 + 深棕描边
      ctx.font = '900 24px "Fredoka", "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#92400e'; ctx.lineWidth = 4.5;
      ctx.strokeText(titleTxt, 180, 71);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(titleTxt, 180, 71);
      ctx.restore();
    }

    // 图2同款：旋转黄金聚光灯星芒绘制器
    function drawFig2SpotlightRays(ctx, cx, cy, radius, nowMs, alphaScale = 1.0) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((nowMs * 0.0003) % (Math.PI * 2));
      for (let r = 0; r < 12; r++) {
        ctx.rotate((Math.PI * 2) / 12);
        const rg = ctx.createLinearGradient(0, 0, 0, -radius);
        rg.addColorStop(0, `rgba(255, 240, 165, ${(0.38 * alphaScale).toFixed(2)})`);
        rg.addColorStop(1, 'rgba(255, 240, 165, 0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(-radius * 0.11, -radius); ctx.lineTo(radius * 0.11, -radius); ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // 图2同款：金边暖象牙奶油胶囊框绘制器 (#fffdf7 -> #f7ebd2, #f3b14b 描边)
    function drawFig2CreamGoldPill(ctx, x, y, w, h, radius = 20) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y + 3, w, h, radius);
      ctx.fillStyle = 'rgba(20, 12, 4, 0.34)';
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      const pg = ctx.createLinearGradient(0, y, 0, y + h);
      pg.addColorStop(0, '#fffdf7');
      pg.addColorStop(1, '#f7ebd2');
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = '#f3b14b';
      ctx.lineWidth = 3.0;
      ctx.stroke();
      ctx.restore();
    }



    function computeModalCardRect(maskId, w, h) {
      const safeT = _g.__safeTop || 24;
      const shellW = Math.min(w, 470);
      const shellX = (w - shellW) * 0.5;
      const cardW = Math.min(shellW - 28, 352);
      const cardX = shellX + (shellW - cardW) * 0.5;
      let cardH = Math.min(h * 0.70, 456);
      let cardY = (h - cardH) * 0.48;
      if (maskId === 'pause-modal-mask') {
        cardH = 342;
        const totalStackH = cardH + 14 + 58 + 12 + 52;
        cardY = Math.max(safeT + 26, (h - totalStackH) * 0.5 + 6);
      } else if (maskId === 'modal-mask') {
        cardH = 356;
        cardY = (h - cardH) * 0.48;
      } else if (maskId === 'speed-modal-mask') {
        cardH = 264;
        cardY = (h - (cardH + 68)) * 0.48;
      } else if (maskId === 'refresh-modal-mask') {
        cardH = 324;
        cardY = (h - cardH) * 0.48;
      } else if (maskId === 'out-of-moves-modal-mask') {
        cardH = 348;
        cardY = (h - cardH) * 0.48;
      }
      return makeRect(cardX, cardY, cardW, cardH);
    }

    function drawOpenModalOnCanvas(ctx, w, h, nowMs) {
      const maskId = uiState.openModalId;
      if (!maskId) {
        lastModalOpenState = false;
        return false;
      }

      if (!lastModalOpenState) {
        lastModalOpenState = true;
        const bw = Math.max(72, Math.round(w * 0.18));
        const bh = Math.max(110, Math.round(h * 0.18));
        if (blurSnapshotCanvas.width !== bw) blurSnapshotCanvas.width = bw;
        if (blurSnapshotCanvas.height !== bh) blurSnapshotCanvas.height = bh;
        const bSnapCtx = blurSnapshotCanvas.getContext('2d');
        try { bSnapCtx.drawImage(canvas, 0, 0, bw, bh); } catch (e) { }
      }
      ctx.save();
      ctx.drawImage(blurSnapshotCanvas, 0, 0, w, h);
      ctx.fillStyle = 'rgba(24, 17, 14, 0.78)';
      ctx.fillRect(0, 0, w, h);

      registerHitRegion('modal_backdrop', 0, 0, w, h, 200, () => {
        if (maskId === 'mechanic-modal-mask') {
          uiState.openModalId = null;
          playSound('modal_close');
        }
      });

      const bannerW = Math.min(w - 24, 344);
      const shellW = Math.min(w, 470);
      const shellX = (w - shellW) * 0.5;

      // ====================================================================
      // 弹窗 F：常驻机关与规则图鉴 + 解锁新玩法聚光灯庆典层
      // ====================================================================
      if (maskId === 'mechanic-modal-mask') {
        const totalH = HANDBOOK_KEYS.length;
        const hIdx = ((window._handbookIdx || 0) % totalH + totalH) % totalH;
        const mechKey = HANDBOOK_KEYS[hIdx] || 'basic_rule';
        const mechInfo = (typeof MECHANIC_INTROS !== 'undefined' && MECHANIC_INTROS[mechKey]) || MECHANIC_INTROS.basic_rule;
        const isCurrentLvMech = (window._handbookActiveLevelKey === mechKey);

        const ribTop = h * 0.14;
        const ribH = 108;
        drawFig2RibbonHeader(ctx, w * 0.5, ribTop, bannerW, ribH, mechInfo.title || '机关图鉴');

        const mxW = 38, mxH = 38;
        const mxX = Math.min(w - mxW - 14, w * 0.5 + bannerW * 0.5 - 26);
        const mxY = ribTop + 42;
        draw3DGlossyModalButton(ctx, mxX, mxY, mxW, mxH, 13, MODAL_BTN_PALETTES.coralSquare, '', 16);
        ctx.save();
        const mxcx = mxX + mxW * 0.5, mxcy = mxY + mxH * 0.5;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.2; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(mxcx - 5.5, mxcy - 5.5); ctx.lineTo(mxcx + 5.5, mxcy + 5.5);
        ctx.moveTo(mxcx + 5.5, mxcy - 5.5); ctx.lineTo(mxcx - 5.5, mxcy + 5.5);
        ctx.stroke();
        ctx.restore();
        registerHitRegion('mech_close_x', mxX - 6, mxY - 6, mxW + 12, mxH + 12, 240, () => {
          uiState.openModalId = null;
          playSound('modal_close');
        });

        ctx.save();
        const badgeY = ribTop + ribH + 4;
        ctx.beginPath();
        ctx.roundRect(w * 0.5 - 92, badgeY - 11, 184, 22, 11);
        ctx.fillStyle = isCurrentLvMech ? 'rgba(22, 163, 74, 0.90)' : 'rgba(120, 72, 18, 0.82)';
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 11.5px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`${isCurrentLvMech ? '★ 本关出场 · ' : '机关图鉴 · '}${mechInfo.name || ''} (${hIdx + 1}/${totalH})`, w * 0.5, badgeY);
        ctx.restore();

        const sRect = makeRect(shellX + (shellW - 260) * 0.5, h * 0.28, 260, 250);
        const cx = sRect.left + sRect.width * 0.5;
        const cy = sRect.top + sRect.height * 0.5 - 6;
        drawFig2SpotlightRays(ctx, cx, cy, 135, nowMs, 1.0);

        const previewBottle = (mechInfo && mechInfo.sampleBottle)
          ? (typeof mechInfo.sampleBottle === 'function' ? mechInfo.sampleBottle() : mechInfo.sampleBottle)
          : { id: 99, maxCap: 4, layers: ['blue', 'yellow', 'red', 'green'], special: 'none', mysteryCount: 2 };
        if (previewBottle) {
          const pCap = previewBottle.maxCap || 4;
          const pCat = !!previewBottle.isGiantCat;
          const { vbMinX, vbMinY, vbW, vbH } = getBottleLayerMetrics(pCap, pCat, mechKey === 'varied_height');
          const bobY = Math.sin(nowMs * 0.0024) * 3.5;
          const scaleP = pCat ? 0.92 : (pCap === 8 ? 0.72 : 0.96);
          const drawW = vbW * scaleP, drawH = vbH * scaleP;
          ctx.save();
          ctx.translate(cx - drawW * 0.5, cy - drawH * 0.5 + bobY);
          ctx.scale(scaleP, scaleP);
          ctx.translate(-vbMinX, -vbMinY);
          renderBottleDirectToCtx(ctx, previewBottle, 99, pCap, pCat, vbMinX, vbMinY, vbW, vbH, {
            layers: previewBottle.layers || [],
            topLayerScale: 1,
            tiltAngle: 0,
            mysteryCount: previewBottle.mysteryCount || 0,
            maxCap: pCap,
            isGiantCat: pCat
          });
          ctx.restore();
        }

        const navY = cy;
        const prevX = Math.max(16, cx - 138), nextX = Math.min(w - 60, cx + 94);
        draw3DGlossyModalButton(ctx, prevX, navY - 21, 44, 42, 14, MODAL_BTN_PALETTES.amber, '◀', 18);
        draw3DGlossyModalButton(ctx, nextX, navY - 21, 44, 42, 14, MODAL_BTN_PALETTES.amber, '▶', 18);
        registerHitRegion('mech_prev_btn', prevX - 6, navY - 27, 56, 54, 240, () => {
          syncHandbookModalContent(hIdx - 1);
          playSound('select');
        });
        registerHitRegion('mech_next_btn', nextX - 6, navY - 27, 56, 54, 240, () => {
          syncHandbookModalContent(hIdx + 1);
          playSound('select');
        });

        const boxX = Math.max(18, w * 0.5 - 166);
        const boxW = Math.min(w - 36, 332);
        const boxY = h * 0.66 - 18;
        const boxH = 88;
        drawFig2CreamGoldPill(ctx, boxX, boxY, boxW, boxH, 20);

        ctx.save();
        ctx.fillStyle = '#7c3f0e';
        ctx.font = '800 13.5px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const cleanDesc = (mechInfo.desc || '').replace(/<[^>]+>/g, '');
        ctx.fillText(cleanDesc, boxX + boxW * 0.5, boxY + 23, boxW - 24);

        if (mechInfo.limitTag) {
          ctx.fillStyle = '#b91c1c';
          ctx.font = '800 11.5px "Fredoka", "PingFang SC", sans-serif';
          ctx.fillText(mechInfo.limitTag, boxX + boxW * 0.5, boxY + 46, boxW - 22);
        }
        if (mechInfo.solveTag) {
          ctx.fillStyle = '#15803d';
          ctx.font = '800 11.5px "Fredoka", "PingFang SC", sans-serif';
          ctx.fillText(mechInfo.solveTag, boxX + boxW * 0.5, boxY + 68, boxW - 22);
        }
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.75 + 0.25 * Math.sin(nowMs * 0.0035);
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 15px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('◀ 左右切换查看全部机关 · 点击空白处继续游戏 ▶', w * 0.5, h * 0.76 + 28);
        ctx.restore();

        ctx.restore();
        return true;
      }

      // ====================================================================
      // 弹窗 A：过关成功结算弹窗
      // ====================================================================
      if (maskId === 'modal-mask') {
        const winTitle = uiState.winBadgeText || '过关成功';
        const centerY = h * 0.50;
        const ribTopY = Math.max(h * 0.11, centerY - 235);
        drawFig2RibbonHeader(ctx, w * 0.5, ribTopY, bannerW, 108, winTitle);

        const xW = 38, xH = 38;
        const xX = Math.min(w - xW - 14, w * 0.5 + bannerW * 0.5 - 26);
        const xY = ribTopY + 42;
        draw3DGlossyModalButton(ctx, xX, xY, xW, xH, 13, MODAL_BTN_PALETTES.coralSquare, '', 16);
        ctx.save();
        const xcx = xX + xW * 0.5, xcy = xY + xH * 0.5;
        ctx.strokeStyle = 'rgba(70, 24, 6, 0.35)';
        ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xcx - 5.5, xcy - 4.2); ctx.lineTo(xcx + 5.5, xcy + 6.8);
        ctx.moveTo(xcx + 5.5, xcy - 4.2); ctx.lineTo(xcx - 5.5, xcy + 6.8);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(xcx - 5.5, xcy - 5.5); ctx.lineTo(xcx + 5.5, xcy + 5.5);
        ctx.moveTo(xcx + 5.5, xcy - 5.5); ctx.lineTo(xcx - 5.5, xcy + 5.5);
        ctx.stroke();
        ctx.restore();
        registerHitRegion('win_close_x', xX - 6, xY - 6, xW + 12, xH + 12, 240, () => {
          uiState.openModalId = null;
          playSound('modal_close');
        });

        const trophyCy = ribTopY + 188;
        drawFig2SpotlightRays(ctx, w * 0.5, trophyCy, 138, nowMs, 1.0);

        const starOffsets = [[-56, -46, 17], [0, -56, 23], [56, -46, 17]];
        starOffsets.forEach(([dx, dy, sr], sIdx) => {
          const pulse = 1 + 0.08 * Math.sin(nowMs * 0.004 + sIdx);
          drawStar5(ctx, w * 0.5 + dx, trophyCy + dy, sr * pulse, sr * 0.45 * pulse, '#fde047', '#d97706', 2.2);
        });

        const bobY = Math.sin(nowMs * 0.0028) * 4.5;
        ctx.save();
        ctx.translate(w * 0.5 - 42, trophyCy - 30 + bobY);
        ctx.scale(84 / 80, 80 / 76);
        ctx.beginPath(); ctx.ellipse(40, 70, 24, 4.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)'; ctx.fill();
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
        ctx.stroke(new Path2D('M 22,18 H 13 C 10,18 9,22 11,27 C 13,32 18,35 24,35'));
        ctx.stroke(new Path2D('M 58,18 H 67 C 70,18 71,22 69,27 C 67,32 62,35 56,35'));
        const cupP = new Path2D('M 21,12 H 59 V 26 C 59,38.5 50.5,46 40,46 C 29.5,46 21,38.5 21,26 V 12 Z');
        const cupG = ctx.createLinearGradient(21, 12, 59, 46);
        cupG.addColorStop(0, '#fef08a'); cupG.addColorStop(0.45, '#facc15'); cupG.addColorStop(1, '#d97706');
        ctx.fillStyle = cupG; ctx.fill(cupP);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.8; ctx.stroke(cupP);
        ctx.fillStyle = '#eab308'; ctx.fillRect(36, 45, 8, 13);
        const baseP = new Path2D('M 25,58 H 55 L 58,66 H 22 L 25,58 Z');
        ctx.fillStyle = '#b45309'; ctx.fill(baseP);
        ctx.strokeStyle = '#fde047'; ctx.lineWidth = 1.4; ctx.stroke(baseP);
        ctx.restore();

        const pillW = Math.min(w - 36, 332);
        const pillX = (w - pillW) * 0.5;
        const pillY = trophyCy + 64;
        const pillH = 98;
        drawFig2CreamGoldPill(ctx, pillX, pillY, pillW, pillH, 22);

        ctx.save();
        const cols = [
          ['本次用步', uiState.scoreUserMoves || '1 步', '#7c3f0e'],
          ['理论最优解', uiState.scoreOptMoves || '17 步', '#15803d'],
          ['最优解差距', uiState.scoreDiffMoves || '+0', '#d97706']
        ];
        cols.forEach(([lbl, val, col], i) => {
          const cx = pillX + pillW * ((i * 2 + 1) / 6);
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#92400e'; ctx.font = '800 11.5px "Fredoka", "PingFang SC", sans-serif';
          ctx.fillText(lbl, cx, pillY + 24);
          ctx.fillStyle = col; ctx.font = '900 19px "Fredoka", "PingFang SC", sans-serif';
          ctx.fillText(val, cx, pillY + 48);
        });

        ctx.strokeStyle = 'rgba(243, 177, 75, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(pillX + 22, pillY + 66);
        ctx.lineTo(pillX + pillW - 22, pillY + 66);
        ctx.stroke();

        const praiseTxt = uiState.scorePraiseLine || '✨ 完美通关！';
        ctx.fillStyle = '#b45309';
        ctx.font = '800 12.5px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(praiseTxt, pillX + pillW * 0.5, pillY + 82, pillW - 24);
        ctx.restore();

        const btnY = pillY + pillH + 20;
        const btnW = (pillW - 14) * 0.5;
        const btnH = 50;
        draw3DGlossyModalButton(ctx, pillX, btnY, btnW, btnH, 16, MODAL_BTN_PALETTES.amber, '重玩本关', 16.5);
        registerHitRegion('modal-restart-btn', pillX, btnY, btnW, btnH, 220, () => {
          playSound('btn_restart');
          uiState.openModalId = null;
          initGame();
          showToast('🔄 已重新开始本关');
        });

        draw3DGlossyModalButton(ctx, pillX + btnW + 14, btnY, btnW, btnH, 16, MODAL_BTN_PALETTES.green, '下一关', 16.5);
        registerHitRegion('modal-next-btn', pillX + btnW + 14, btnY, btnW, btnH, 220, () => {
          playSound('ui_tap');
          currentLevelId = (currentLevelId % 200) + 1;
          uiState.openModalId = null;
          initGame();
          showToast(`✨ 已开启：关卡 ${currentLevelId}`);
        });

        ctx.restore();
        return true;
      }

      // ====================================================================
      // 弹窗 B：设置页面 (pause-modal-mask)
      // 已按要求：默认微缩舞台并移除微缩开关、移除提速按钮、移除跳过按钮、倍速开放至 3 倍速！
      // ====================================================================
      if (maskId === 'pause-modal-mask') {
        const pillW = Math.min(w - 32, 336);
        const pillX = (w - pillW) * 0.5;
        const totalH = 100 + 3 * 52 + 72 + 56 + 52;
        const ribTopY = Math.max(24, (h - totalH) * 0.46);

        drawFig2SpotlightRays(ctx, w * 0.5, ribTopY + 210, 175, nowMs, 0.65);
        drawFig2RibbonHeader(ctx, w * 0.5, ribTopY, bannerW, 98, '设置');

        const xW = 38, xH = 38;
        const xX = Math.min(w - xW - 14, w * 0.5 + bannerW * 0.5 - 26);
        const xY = ribTopY + 38;
        draw3DGlossyModalButton(ctx, xX, xY, xW, xH, 13, MODAL_BTN_PALETTES.coralSquare, '', 16);
        ctx.save();
        const xcx = xX + xW * 0.5, xcy = xY + xH * 0.5;
        ctx.strokeStyle = 'rgba(70, 24, 6, 0.35)';
        ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(xcx - 5.5, xcy - 4.2); ctx.lineTo(xcx + 5.5, xcy + 6.8);
        ctx.moveTo(xcx + 5.5, xcy - 4.2); ctx.lineTo(xcx - 5.5, xcy + 6.8);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(xcx - 5.5, xcy - 5.5); ctx.lineTo(xcx + 5.5, xcy + 5.5);
        ctx.moveTo(xcx + 5.5, xcy - 5.5); ctx.lineTo(xcx - 5.5, xcy + 5.5);
        ctx.stroke();
        ctx.restore();
        registerHitRegion('modal_close_x', xX - 6, xY - 6, xW + 12, xH + 12, 240, () => {
          uiState.openModalId = null;
          playSound('modal_close');
        });

        const settingItems = [
          { key: 'sound', label: '音效', isOn: !!userSettings.sound },
          { key: 'vibrate', label: '震动', isOn: !!userSettings.vibrate },
          { key: 'music', label: '音乐', isOn: !!userSettings.music }
        ];
        const rowsStartY = ribTopY + 104;
        settingItems.forEach((item, rIdx) => {
          const rY = rowsStartY + rIdx * 52;
          const rH = 45;
          drawFig2CreamGoldPill(ctx, pillX, rY, pillW, rH, 18);

          ctx.save();
          ctx.font = '800 16px "Fredoka", "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#7c3f0e';
          ctx.fillText(item.label, pillX + 48, rY + rH * 0.5);

          const icX = pillX + 26, icY = rY + rH * 0.5;
          ctx.strokeStyle = '#92400e';
          ctx.fillStyle = '#f59e0b';
          ctx.lineWidth = 2.1;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (rIdx === 0) {
            ctx.beginPath();
            ctx.moveTo(icX - 7.5, icY - 3.2); ctx.lineTo(icX - 3.2, icY - 3.2);
            ctx.lineTo(icX + 2.2, icY - 7.5); ctx.lineTo(icX + 2.2, icY + 7.5);
            ctx.lineTo(icX - 3.2, icY + 3.2); ctx.lineTo(icX - 7.5, icY + 3.2);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(icX + 3.2, icY, 4.5, -0.68, 0.68); ctx.stroke();
            ctx.beginPath(); ctx.arc(icX + 3.2, icY, 8.0, -0.74, 0.74); ctx.stroke();
          } else if (rIdx === 1) {
            ctx.beginPath(); ctx.roundRect(icX - 4.8, icY - 7.8, 9.6, 15.6, 2.2); ctx.fill(); ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(icX - 8.2, icY - 4.2); ctx.lineTo(icX - 6.8, icY - 2); ctx.lineTo(icX - 8.2, icY); ctx.lineTo(icX - 6.8, icY + 2); ctx.lineTo(icX - 8.2, icY + 4.2);
            ctx.moveTo(icX + 8.2, icY - 4.2); ctx.lineTo(icX + 6.8, icY - 2); ctx.lineTo(icX + 8.2, icY); ctx.lineTo(icX + 6.8, icY + 2); ctx.lineTo(icX + 8.2, icY + 4.2);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(icX - 2.8, icY + 5.2); ctx.lineTo(icX - 2.8, icY - 5.8);
            ctx.lineTo(icX + 6.2, icY - 7.8); ctx.lineTo(icX + 6.2, icY + 3.2);
            ctx.stroke();
            ctx.beginPath(); ctx.arc(icX - 5.4, icY + 5.2, 2.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(icX + 3.6, icY + 3.2, 2.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          }

          const tW = 72, tH = 32;
          const tX = pillX + pillW - tW - 12;
          const tY = rY + (rH - tH) * 0.5;
          const isOn = item.isOn;
          ctx.beginPath();
          ctx.roundRect(tX, tY, tW, tH, tH * 0.5);
          const tg = ctx.createLinearGradient(tX, tY, tX, tY + tH);
          if (isOn) {
            tg.addColorStop(0, '#8aa858');
            tg.addColorStop(1, '#6d8c3e');
          } else {
            tg.addColorStop(0, '#cbb89d');
            tg.addColorStop(1, '#b8a284');
          }
          ctx.fillStyle = tg;
          ctx.fill();
          ctx.strokeStyle = '#f3b14b';
          ctx.lineWidth = 1.6;
          ctx.stroke();

          ctx.fillStyle = isOn ? '#ffffff' : '#6e5638';
          ctx.font = '900 12.5px "Fredoka", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(isOn ? 'ON' : 'OFF', isOn ? (tX + 22) : (tX + tW - 22), tY + tH * 0.5 + 0.5);

          const knobR = (tH - 6) * 0.5;
          const knobX = isOn ? (tX + tW - knobR - 3.5) : (tX + knobR + 3.5);
          const knobY = tY + tH * 0.5;
          ctx.beginPath();
          ctx.arc(knobX, knobY, knobR, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          registerHitRegion('toggle_' + rIdx, pillX, rY, pillW, rH, 220, () => {
            userSettings[item.key] = !userSettings[item.key];
            playSound(userSettings[item.key] ? 'toggle_on' : 'toggle_off');
          });
          ctx.restore();
        });

        // 3 个功能卡片：倍速(1x/2x/3x)、主题、破局
        const featLabels = [`倍速x${speedMulStage}`, '主题', '破局'];
        const featY = rowsStartY + 3 * 52 + 6;
        const gap = 10;
        const fw = (pillW - gap * 2) / 3;
        const fh = 62;
        featLabels.forEach((fLbl, fIdx) => {
          const fx = pillX + fIdx * (fw + gap);
          const isFast = (fIdx === 0 && speedMulStage > 1);
          drawFig2CreamGoldPill(ctx, fx, featY, fw, fh, 16);

          ctx.save();
          if (isFast) {
            ctx.beginPath(); ctx.roundRect(fx + 2, featY + 2, fw - 4, fh - 4, 14);
            ctx.fillStyle = speedMulStage === 3 ? 'rgba(251, 146, 60, 0.36)' : 'rgba(253, 224, 71, 0.35)';
            ctx.fill();
          }
          const icX = fx + fw * 0.5, icY = featY + 22;
          if (fIdx === 0) {
            ctx.fillStyle = speedMulStage === 3 ? '#c2410c' : '#b45309';
            if (speedMulStage === 3) {
              [-9, -1, 7].forEach(dx => {
                ctx.beginPath(); ctx.moveTo(icX + dx - 3.5, icY - 5.5); ctx.lineTo(icX + dx + 3.5, icY); ctx.lineTo(icX + dx - 3.5, icY + 5.5); ctx.closePath(); ctx.fill();
              });
            } else {
              ctx.beginPath(); ctx.moveTo(icX - 8.5, icY - 5.5); ctx.lineTo(icX - 0.5, icY); ctx.lineTo(icX - 8.5, icY + 5.5); ctx.closePath(); ctx.fill();
              ctx.beginPath(); ctx.moveTo(icX + 0.5, icY - 5.5); ctx.lineTo(icX + 8.5, icY); ctx.lineTo(icX + 0.5, icY + 5.5); ctx.closePath(); ctx.fill();
            }
          } else if (fIdx === 1) {
            ctx.beginPath(); ctx.arc(icX, icY, 8.2, 0, Math.PI * 2);
            ctx.fillStyle = '#fde047'; ctx.fill();
            ctx.strokeStyle = '#7c3f0e'; ctx.lineWidth = 1.6; ctx.stroke();
            [[-3, -2, '#ea580c'], [3, -2, '#16a34a'], [0, 3, '#2563eb']].forEach(([dx, dy, col]) => {
              ctx.beginPath(); ctx.arc(icX + dx, icY + dy, 1.6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
            });
          } else {
            drawStar5(ctx, icX, icY, 9.0, 4.0, '#facc15', '#7c3f0e', 1.5);
          }

          ctx.fillStyle = '#7c3f0e';
          ctx.font = '800 13px "Fredoka", "PingFang SC", "Microsoft YaHei", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(fLbl, fx + fw * 0.5, featY + fh - 14);
          ctx.restore();

          registerHitRegion('pause_feat_' + fIdx, fx, featY, fw, fh, 220, () => {
            if (fIdx === 0) {
              speedMulStage = (speedMulStage % 3) + 1;
              playSound(speedMulStage > 1 ? 'toggle_on' : 'toggle_off');
              showToast(speedMulStage === 3 ? '⚡ 已开启 3倍极速倒水模式！' : (speedMulStage === 2 ? '⚡ 已开启 2倍极速倒水模式！' : '⚡ 已恢复 1倍标准倒水速度'));
            } else if (fIdx === 1) {
              renderShopItems();
              uiState.openModalId = 'shop-modal-mask';
              playSound('select');
            } else if (fIdx === 2) {
              uiState.openModalId = null;
              unlockAllSpecials();
            }
          });
        });

        // 底部第1排：仅保留【主页】与【重新开始】（已移除跳过按钮）
        const row1Y = featY + fh + 14;
        const row1H = 52;
        const homeW = 92;
        draw3DGlossyModalButton(ctx, pillX, row1Y, homeW, row1H, 16, MODAL_BTN_PALETTES.goldSquare, '主页', 15);
        registerHitRegion('pause-home-btn', pillX, row1Y, homeW, row1H, 220, () => {
          openLevelSelector();
        });

        const restartX = pillX + homeW + 12;
        const restartW = pillW - homeW - 12;
        draw3DGlossyModalButton(ctx, restartX, row1Y, restartW, row1H, 16, MODAL_BTN_PALETTES.green, '重新开始', 16.5);
        registerHitRegion('pause-restart-btn', restartX, row1Y, restartW, row1H, 220, () => {
          uiState.openModalId = null;
          playSound('btn_restart');
          initGame();
          showToast('🔄 当前关卡已重新开始');
        });

        const row2Y = row1Y + row1H + 10;
        draw3DGlossyModalButton(ctx, pillX, row2Y, pillW, 50, 16, MODAL_BTN_PALETTES.amber, '继续游戏', 17);
        registerHitRegion('pause-resume-btn', pillX, row2Y, pillW, 50, 220, () => {
          uiState.openModalId = null;
          playSound('modal_close');
        });

        ctx.restore();
        return true;
      }

      // ====================================================================
      // 其余弹窗（选关 / 商店 / 提速 / 刷新 / 步数耗尽）
      // ====================================================================
      const cRect = computeModalCardRect(maskId, w, h);
      const titleMap = {
        'shop-modal-mask': '主题商店',
        'level-modal-mask': '关卡选择',
        'speed-modal-mask': '倒水提速',
        'refresh-modal-mask': '智能破局',
        'out-of-moves-modal-mask': '步数耗尽'
      };
      const pillTitle = titleMap[maskId] || '关卡选择';

      drawFig2SpotlightRays(ctx, w * 0.5, cRect.top + cRect.height * 0.45, 165, nowMs, 0.6);
      drawFig2CreamGoldPill(ctx, cRect.left, cRect.top + 18, cRect.width, cRect.height - 12, 26);
      drawFig2RibbonHeader(ctx, w * 0.5, cRect.top - 52, Math.min(w - 24, 336), 96, pillTitle);

      const xRect = makeRect(cRect.left + cRect.width - 26, cRect.top - 10, 36, 36);
      draw3DGlossyModalButton(ctx, xRect.left, xRect.top, xRect.width, xRect.height, 13, MODAL_BTN_PALETTES.coralSquare, '', 16);
      const xcx = xRect.left + xRect.width * 0.5, xcy = xRect.top + xRect.height * 0.5;
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.2; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(xcx - 5.5, xcy - 5.5); ctx.lineTo(xcx + 5.5, xcy + 5.5);
      ctx.moveTo(xcx + 5.5, xcy - 5.5); ctx.lineTo(xcx - 5.5, xcy + 5.5);
      ctx.stroke();
      ctx.restore();
      registerHitRegion('modal_close_x', xRect.left - 8, xRect.top - 8, xRect.width + 16, xRect.height + 16, 240, () => {
        uiState.openModalId = null;
        playSound('modal_close');
      });

      if (maskId === 'level-modal-mask') {
        const tabGap = 6;
        const tw = (cRect.width - 32 - tabGap * 4) / 5;
        for (let tIdx = 0; tIdx < 5; tIdx++) {
          const tRect = makeRect(cRect.left + 16 + tIdx * (tw + tabGap), cRect.top + 46, tw, 28);
          const isAct = (currentChapterTab === tIdx);
          const tabLabel = `${tIdx * 40 + 1}-${(tIdx + 1) * 40}`;
          ctx.save();
          ctx.beginPath(); ctx.roundRect(tRect.left, tRect.top, tRect.width, tRect.height, 11);
          ctx.fillStyle = isAct ? '#d48c28' : 'rgba(243, 177, 75, 0.25)'; ctx.fill();
          ctx.strokeStyle = '#f3b14b'; ctx.lineWidth = 1.6; ctx.stroke();
          ctx.fillStyle = isAct ? '#ffffff' : '#7c3f0e';
          ctx.font = '800 10.5px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(tabLabel, tRect.left + tRect.width * 0.5, tRect.top + tRect.height * 0.5);
          ctx.restore();
          registerHitRegion('ch_tab_' + tIdx, tRect.left, tRect.top, tRect.width, tRect.height, 220, () => {
            currentChapterTab = tIdx;
            uiState.levelScrollTop = 0;
            playSound('select');
          });
        }

        const sRect = makeRect(cRect.left + 16, cRect.top + 84, cRect.width - 32, cRect.height - 102);
        ctx.save();
        ctx.beginPath(); ctx.rect(sRect.left, sRect.top, sRect.width, sRect.height); ctx.clip();

        const startLv = currentChapterTab * 40 + 1;
        const endLv = Math.min(200, startLv + 39);
        const cellGap = 8;
        const cw = (sRect.width - cellGap * 3) / 4;
        const ch = 56;
        const scrollTop = uiState.levelScrollTop || 0;

        for (let lv = startLv; lv <= endLv; lv++) {
          const cIdx = lv - startLv;
          const col = cIdx % 4, row = Math.floor(cIdx / 4);
          const cellRect = makeRect(sRect.left + col * (cw + cellGap), sRect.top + row * (ch + cellGap) - scrollTop, cw, ch);
          if (cellRect.bottom < sRect.top || cellRect.top > sRect.bottom) continue;

          const cfg = getLevelConfig(lv);
          const isAct = (lv === currentLevelId);
          const isBoss = !!(cfg.isCatBossLevel || (lv % 10 === 0));
          const numTxt = `第 ${lv} 关`;
          const tagTxt = cfg.shortTag || cfg.tag || '经典';
          const waveTxt = '★'.repeat(cfg.waveStars || 3) + '☆'.repeat(5 - (cfg.waveStars || 3));

          ctx.beginPath(); ctx.roundRect(cellRect.left, cellRect.top, cellRect.width, cellRect.height, 14);
          ctx.fillStyle = isAct ? '#76914c' : (isBoss ? '#fef3c7' : '#ffffff');
          ctx.fill();
          ctx.strokeStyle = isAct ? '#fde047' : '#f3b14b'; ctx.lineWidth = 1.8; ctx.stroke();

          const cx = cellRect.left + cellRect.width * 0.5;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = isAct ? '#ffffff' : '#7c3f0e';
          ctx.font = '800 12.5px "Fredoka", "PingFang SC", sans-serif';
          ctx.fillText(numTxt, cx, cellRect.top + 15);
          ctx.fillStyle = isAct ? '#fef08a' : '#b45309';
          ctx.font = '800 9.5px "Fredoka", "PingFang SC", sans-serif';
          ctx.fillText(tagTxt, cx, cellRect.top + 31, cellRect.width - 6);
          ctx.fillStyle = isAct ? '#fde047' : '#d97706';
          ctx.font = '10px sans-serif';
          ctx.fillText(waveTxt, cx, cellRect.top + 45);

          registerHitRegion('lv_cell_' + lv, cellRect.left, Math.max(sRect.top, cellRect.top), cellRect.width, Math.min(cellRect.bottom, sRect.bottom) - Math.max(sRect.top, cellRect.top), 220, () => {
            currentLevelId = lv;
            uiState.openModalId = null;
            playSound('select');
            initGame();
            showToast(`🎯 已进入：第 ${lv} 关`);
          });
        }
        ctx.restore();
      } else if (maskId === 'shop-modal-mask') {
        const sRect = makeRect(cRect.left + 16, cRect.top + 64, cRect.width - 32, cRect.height - 126);
        ctx.save();
        ctx.beginPath(); ctx.rect(sRect.left, sRect.top, sRect.width, sRect.height); ctx.clip();
        const gap = 12;
        const cw = (sRect.width - gap) / 2;
        const ch = 124;
        const scrollTop = uiState.shopScrollTop || 0;

        SHOP_THEMES.forEach((item, idx) => {
          const col = idx % 2, row = Math.floor(idx / 2);
          const r = makeRect(sRect.left + col * (cw + gap), sRect.top + row * (ch + gap) - scrollTop, cw, ch);
          if (r.bottom < sRect.top || r.top > sRect.bottom) return;
          const isAct = (activeThemeId === item.id);
          ctx.beginPath(); ctx.roundRect(r.left, r.top, r.width, r.height, 18);
          ctx.fillStyle = '#fffdf7'; ctx.fill();
          ctx.strokeStyle = isAct ? '#76914c' : '#f3b14b'; ctx.lineWidth = 2.4; ctx.stroke();
          const cx = r.left + r.width * 0.5;
          ctx.beginPath(); ctx.roundRect(cx - 32, r.top + 10, 64, 54, 13);
          const sg = ctx.createLinearGradient(0, r.top + 10, 0, r.top + 64);
          sg.addColorStop(0, item.topCol || '#62dce8'); sg.addColorStop(0.5, item.topCol || '#88e8f2');
          sg.addColorStop(0.51, item.botCol || '#edd2a4'); sg.addColorStop(1, item.botCol || '#deb981');
          ctx.fillStyle = sg; ctx.fill();
          ctx.strokeStyle = '#f3b14b'; ctx.lineWidth = 1.6; ctx.stroke();
          ctx.fillStyle = '#7c3f0e'; ctx.font = '800 13.5px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(item.name, cx, r.top + 77);

          const br = makeRect(r.left + 14, r.bottom - 34, r.width - 28, 26);
          const pal = (isAct || item.unlocked) ? MODAL_BTN_PALETTES.green : MODAL_BTN_PALETTES.amber;
          const btnTxt = isAct ? '使用中' : (item.unlocked ? '启用' : '免费解锁');
          draw3DGlossyModalButton(ctx, br.left, br.top, br.width, br.height, 10, pal, btnTxt, 12);

          registerHitRegion('shop_card_' + idx, r.left, Math.max(sRect.top, r.top), r.width, Math.min(r.bottom, sRect.bottom) - Math.max(sRect.top, r.top), 220, () => {
            item.unlocked = true;
            applyTheme(item.id);
            bgOffscreenDirty = true;
            playSound('pack');
            showToast(`🎨 已切换为【${item.name}】主题！`);
          });
        });
        ctx.restore();

        const br = makeRect(cRect.left + 42, cRect.top + cRect.height - 50, cRect.width - 84, 38);
        draw3DGlossyModalButton(ctx, br.left, br.top, br.width, br.height, 15, MODAL_BTN_PALETTES.amber, '前往关卡选择', 15);
        registerHitRegion('shop_open_lv', br.left, br.top, br.width, br.height, 220, () => {
          openLevelSelector();
        });
      } else if (maskId === 'speed-modal-mask' || maskId === 'refresh-modal-mask' || maskId === 'out-of-moves-modal-mask') {
        const sr = makeRect(cRect.left + 24, cRect.top + 38, cRect.width - 48, 168);
        const scx = sr.left + sr.width * 0.5;
        const scy = sr.top + sr.height * 0.5 + Math.sin(nowMs * 0.0025) * 3.5;
        ctx.save();
        ctx.beginPath(); ctx.roundRect(sr.left, sr.top + 10, sr.width, sr.height - 10, 22);
        const sg = ctx.createRadialGradient(scx, scy, 8, scx, scy, sr.width * 0.65);
        sg.addColorStop(0, '#fffdf2'); sg.addColorStop(0.5, '#f6d28b'); sg.addColorStop(1, '#d89636');
        ctx.fillStyle = sg; ctx.fill();
        ctx.strokeStyle = '#f3b14b'; ctx.lineWidth = 2.4; ctx.stroke();

        if (maskId === 'speed-modal-mask') {
          ctx.save();
          ctx.translate(scx - 60, scy - 64);
          ctx.fillStyle = '#ffd000'; ctx.strokeStyle = '#231600'; ctx.lineWidth = 2.8;
          ctx.beginPath(); ctx.roundRect(41, 96, 15.5, 22, 7); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.roundRect(63.5, 96, 15.5, 22, 7); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.roundRect(37, 66, 46, 37, 17); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.roundRect(25, 16, 70, 56, 18); ctx.fill(); ctx.stroke();
          ctx.strokeStyle = '#231600'; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
          ctx.stroke(new Path2D('M 40,45 Q 46.5,36 53,45'));
          ctx.stroke(new Path2D('M 67,45 Q 73.5,36 80,45'));
          ctx.restore();
        } else if (maskId === 'refresh-modal-mask') {
          ctx.save();
          ctx.translate(scx - 64, scy - 60);
          const topArr = new Path2D('M 25,57 C 25,27 53,14 78,24 L 83,14 Q 86,9 90,15 L 103,39 Q 106,45 99,47 L 71,53 Q 64,54 68,48 L 72,40 C 55,34 44,42 44,57 Q 44,61 39,61 L 30,61 Q 25,61 25,57 Z');
          ctx.fillStyle = '#ffdd14'; ctx.fill(topArr);
          ctx.strokeStyle = '#633606'; ctx.lineWidth = 2.6; ctx.stroke(topArr);
          const botArr = new Path2D('M 103,71 C 103,101 75,114 50,104 L 45,114 Q 42,119 38,113 L 25,89 Q 22,83 29,81 L 57,75 Q 64,74 60,80 L 56,88 C 73,94 84,86 84,71 Q 84,67 89,67 L 98,67 Q 103,67 103,71 Z');
          ctx.fillStyle = '#ff4da6'; ctx.fill(botArr);
          ctx.strokeStyle = '#610c32'; ctx.lineWidth = 2.6; ctx.stroke(botArr);
          ctx.restore();
        } else {
          ctx.save();
          ctx.translate(scx, scy + 5);
          ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2);
          ctx.fillStyle = '#f43f5e'; ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.stroke();
          ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2);
          ctx.fillStyle = '#fff1f2'; ctx.fill();
          ctx.strokeStyle = '#be123c'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -18); ctx.lineTo(14, 0); ctx.stroke();
          ctx.restore();
        }
        ctx.restore();

        if (maskId === 'speed-modal-mask') {
          ctx.save();
          ctx.fillStyle = '#7c3f0e'; ctx.font = '800 16px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`等级: ${speedLevel || 0}  ·  当前速度: ${speedPoints || 10} 点`, cRect.left + cRect.width * 0.5, cRect.bottom - 24);
          ctx.restore();
          const br = makeRect(cRect.left + (cRect.width - 180) * 0.5, cRect.top + cRect.height + 16, 180, 52);
          draw3DGlossyModalButton(ctx, br.left, br.top, br.width, br.height, 16, MODAL_BTN_PALETTES.green, '', 18);
          ctx.save();
          drawVideoAdIcon(ctx, br.left + br.width * 0.5 - 32, br.top + br.height * 0.5);
          ctx.fillStyle = '#ffffff'; ctx.font = '800 18px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('升级', br.left + br.width * 0.5 - 10, br.top + br.height * 0.5);
          ctx.restore();
          registerHitRegion('speed_up_confirm', br.left, br.top, br.width, br.height, 220, () => {
            speedLevel = (speedLevel || 0) + 1;
            speedPoints = 10 + speedLevel;
            playSound('pack');
            showToast(`⚡ 速度升级成功！当前速度：${speedPoints} 点`);
            setTimeout(() => { uiState.openModalId = null; }, 360);
          });
        } else if (maskId === 'refresh-modal-mask') {
          ctx.save();
          ctx.fillStyle = '#7c3f0e'; ctx.font = '800 16px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('智能破局一步 / 随机刷新药水颜色', cRect.left + cRect.width * 0.5, cRect.bottom - 86);
          ctx.restore();
          const br = makeRect(cRect.left + (cRect.width - 180) * 0.5, cRect.top + cRect.height - 68, 180, 50);
          draw3DGlossyModalButton(ctx, br.left, br.top, br.width, br.height, 16, MODAL_BTN_PALETTES.green, '', 18);
          ctx.save();
          drawVideoAdIcon(ctx, br.left + br.width * 0.5 - 32, br.top + br.height * 0.5);
          ctx.fillStyle = '#ffffff'; ctx.font = '800 18px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('获得', br.left + br.width * 0.5 - 10, br.top + br.height * 0.5);
          ctx.restore();
          registerHitRegion('refresh_confirm', br.left, br.top, br.width, br.height, 220, () => {
            uiState.openModalId = null;
            shuffleUses = 3;
            executeShuffleRemainingLiquid();
          });
        } else if (maskId === 'out-of-moves-modal-mask') {
          const addRect = makeRect(cRect.left + 24, cRect.top + cRect.height - 118, cRect.width - 48, 48);
          draw3DGlossyModalButton(ctx, addRect.left, addRect.top, addRect.width, addRect.height, 16, MODAL_BTN_PALETTES.green, '', 16);
          ctx.save();
          drawVideoAdIcon(ctx, addRect.left + addRect.width * 0.5 - 64, addRect.top + addRect.height * 0.5);
          ctx.fillStyle = '#ffffff'; ctx.font = '800 16px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
          ctx.fillText('免费增加 5 步', addRect.left + addRect.width * 0.5 - 42, addRect.top + addRect.height * 0.5);
          ctx.restore();
          registerHitRegion('oom-add-moves-btn', addRect.left, addRect.top, addRect.width, addRect.height, 220, () => {
            uiState.openModalId = null;
            if (remainingMoves !== null) remainingMoves += 5;
            playSound('pack');
            renderAll();
            showToast('🎬 激励视频奖励：已为您免费续 +5 步星晷步数！');
          });

          const rstRect = makeRect(cRect.left + 24, cRect.top + cRect.height - 60, cRect.width - 48, 44);
          draw3DGlossyModalButton(ctx, rstRect.left, rstRect.top, rstRect.width, rstRect.height, 16, MODAL_BTN_PALETTES.amber, '重新开始本关', 16);
          registerHitRegion('oom-restart-btn', rstRect.left, rstRect.top, rstRect.width, rstRect.height, 220, () => {
            uiState.openModalId = null;
            initGame();
            showToast('🔄 当前试炼已重新开始');
          });
        }
      }
      ctx.restore();
      return true;
    }

    // 预烘焙瓶底接触阴影精灵图（避免每帧对 12 个瓶子重复调用 createRadialGradient）
    let _aoShadowSprite = null;
    function getAoShadowSprite() {
      if (_aoShadowSprite) return _aoShadowSprite;
      const sp = createOffscreenCanvas(64, 32);
      sp.width = 64; sp.height = 64;
      const sc = sp.getContext('2d');
      const g = sc.createRadialGradient(32, 32, 1, 32, 32, 30);
      g.addColorStop(0, 'rgba(98, 52, 12, 0.44)');
      g.addColorStop(0.6, 'rgba(115, 62, 16, 0.19)');
      g.addColorStop(1, 'rgba(115, 62, 16, 0)');
      sc.fillStyle = g;
      sc.beginPath();
      sc.arc(32, 32, 30, 0, Math.PI * 2);
      sc.fill();
      _aoShadowSprite = sp;
      return sp;
    }



    // ---------------- 8. 极速主循环（全缓存坐标，单 RAF 循环，0 DOM，丝滑 60/120 FPS） ----------------
    function renderPureCanvasLoop(nowMs) {
      requestAnimationFrame(renderPureCanvasLoop);
      syncCanvasSize();
      if (window._layoutDirty || !layoutCache) {
        rebuildLayoutCache();
      }
      activeHitRegions = [];

      ctx.save();
      try {
      ctx.scale(dpr, dpr);

      // 1. 直接贴入离屏缓存好的主题背景
      const bgCan = getThemeBackgroundCanvas(viewW, viewH);
      ctx.drawImage(bgCan, 0, 0, viewW, viewH);

      // 2. 直接在主画布绘制萤火微粒、满瓶飞星与礼花
      drawBgStarFXDirectToCtx(ctx, viewW, viewH, nowMs);

      const cfg = getLevelConfig(currentLevelId);

      // 3. 顶部栏（100% 原生 Canvas 烘焙超椭圆折射玻璃按钮）
      if (layoutCache.settingsBtn) {
        const r = layoutCache.settingsBtn;
        const sp = getNativeGlassButtonSprite('settings-btn');
        const pressS = pressedHitId === 'settings-btn' ? 0.93 : 1.0;
        ctx.save();
        ctx.translate(r.left + r.width * 0.5, r.top + r.height * 0.5);
        ctx.scale(pressS, pressS);
        ctx.drawImage(sp, -r.width * 0.5, -r.height * 0.5, r.width, r.height);
        ctx.restore();
        registerHitRegion('settings-btn', r.left, r.top, r.width, r.height, 30, () => {
          uiState.openModalId = 'pause-modal-mask';
          playSound('modal_open');
        });
      }

      if (layoutCache.rulesBtn) {
        const r = layoutCache.rulesBtn;
        const sp = getNativeGlassButtonSprite('rules-help-btn');
        const pressS = pressedHitId === 'rules-help-btn' ? 0.93 : 1.0;
        ctx.save();
        ctx.translate(r.left + r.width * 0.5, r.top + r.height * 0.5);
        ctx.scale(pressS, pressS);
        ctx.drawImage(sp, -r.width * 0.5, -r.height * 0.5, r.width, r.height);
        ctx.restore();
        registerHitRegion('rules-help-btn', r.left, r.top, r.width, r.height, 30, () => {
          openRulesHelpModal();
        });
      }

      if (layoutCache.centerLvTrigger) {
        const r = layoutCache.centerLvTrigger;
        const cx = r.left + r.width * 0.5;
        const cy = r.top + r.height * 0.5 - 5;
        ctx.save();
        ctx.font = `800 ${Math.min(32, Math.max(25, Math.round(viewH * 0.039)))}px "Fredoka", "Quicksand", "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(110, 68, 14, 0.36)';
        ctx.fillText(`第 ${currentLevelId} 关`, cx, cy + 2.5);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`第 ${currentLevelId} 关`, cx, cy);

        let goalTxt = '';
        const targetTotal = Math.max(1, levelTargetTotalBottles || 4);
        const catB = bottles.find(b => b && !b.removed && b.isGiantCat);
        if (catB) {
          goalTxt = `🐱 目标：灵猫收集 ${catB.layers.length}/${catB.maxCap || 8}`;
        } else if (cfg.hasBags && bags && bags.length > 0) {
          goalTxt = `🛍️ 目标：礼袋打包 ${Math.min(packedTotal, targetTotal)}/${targetTotal}`;
        } else {
          const corkedNow = bottles.filter(b => b && b.corked).length;
          goalTxt = `🍾 目标：同色封存 ${Math.min(corkedNow, targetTotal)}/${targetTotal} 瓶`;
        }
        if (remainingMoves !== null) {
          goalTxt += ` · 剩 ${remainingMoves} 步`;
        }
        ctx.font = '800 11px "Fredoka", "PingFang SC", sans-serif';
        const gw = Math.max(128, ctx.measureText(goalTxt).width + 22);
        const gh = 19;
        const gy = cy + 21;
        ctx.beginPath();
        ctx.roundRect(cx - gw * 0.5, gy - gh * 0.5, gw, gh, gh * 0.5);
        ctx.fillStyle = (remainingMoves !== null && remainingMoves <= 5) ? 'rgba(220, 38, 38, 0.86)' : 'rgba(92, 54, 12, 0.42)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 248, 220, 0.72)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#fffbeb';
        ctx.fillText(goalTxt, cx, gy + 0.5);
        ctx.restore();
        registerHitRegion('top-center-level-trigger', r.left - 24, r.top - 6, r.width + 48, r.height + 24, 30, () => {
          openLevelSelector();
        });
      }

      // 4. 顶部 4 个 3D 高定礼盒袋（含装瓶回弹、服务金铃叮当、极速拎走与新袋落下动画）
      if (cfg.hasBags && layoutCache.bagRects.length > 0) {
        const bagAnimMap = window._canvasBagAnimMap || {};
        bags.forEach((bag, bIdx) => {
          if (!bag || bag.removed) return;
          const r = layoutCache.bagRects[bIdx];
          if (!r) return;
          const bagCan = getNativeBagCanvas(bag, bIdx);
          if (bagCan) {
            const anim = bagAnimMap[bIdx];
            ctx.save();
            let drawAlpha = 1;
            const cx = r.left + r.width * 0.5;
            const by = r.bottom;
            if (anim) {
              const p = Math.max(0, Math.min(1, (nowMs - anim.startTime) / Math.max(1, anim.duration)));
              if (anim.type === 'bounce') {
                const sx = p < 0.4 ? (1 + 0.12 * (p / 0.4)) : (1.12 - 0.12 * ((p - 0.4) / 0.6));
                const sy = p < 0.4 ? (1 - 0.10 * (p / 0.4)) : (0.90 + 0.10 * ((p - 0.4) / 0.6));
                ctx.translate(cx, by);
                ctx.scale(sx, sy);
                ctx.translate(-cx, -by);
              } else if (anim.type === 'carry_away') {
                const liftY = -Math.pow(p, 1.45) * 125;
                const rot = Math.sin(p * Math.PI * 2) * 0.12;
                drawAlpha = Math.max(0, 1 - Math.pow(p, 1.3));
                ctx.translate(cx, r.top + r.height * 0.15 + liftY);
                ctx.rotate(rot);
                ctx.scale(1 - p * 0.12, 1 + p * 0.06);
                ctx.translate(-cx, -(r.top + r.height * 0.15));
              } else if (anim.type === 'drop_in') {
                const easeOutBack = 1 + 1.8 * Math.pow(p - 1, 3) + 0.8 * Math.pow(p - 1, 2);
                const dropY = (1 - easeOutBack) * -68;
                drawAlpha = Math.min(1, p * 1.8);
                ctx.translate(0, dropY);
              }
            }
            ctx.globalAlpha = drawAlpha;
            ctx.drawImage(bagCan, r.left, r.top, r.width, r.height);

            // 若处于装瓶回弹阶段，在袋口上方绘制摇晃的 3D 金色服务铃铛
            if (anim && anim.type === 'bounce') {
              const p = Math.max(0, Math.min(1, (nowMs - anim.startTime) / Math.max(1, anim.duration)));
              const bellRot = Math.sin(p * Math.PI * 5) * 0.35 * (1 - p * 0.5);
              ctx.save();
              ctx.translate(cx, r.top + 8);
              ctx.rotate(bellRot);
              ctx.fillStyle = '#facc15';
              ctx.strokeStyle = '#b45309';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(0, 0, 9, Math.PI, 0, false);
              ctx.lineTo(11, 7);
              ctx.lineTo(-11, 7);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(0, 8.5, 2.8, 0, Math.PI * 2);
              ctx.fillStyle = '#d97706';
              ctx.fill();
              ctx.restore();
            }
            ctx.restore();
          }
          registerHitRegion('bag_' + bIdx, r.left, r.top, r.width, r.height, 25, () => onBagClick(bIdx));
        });
      }

      // 模式提示横幅
      if (uiState.modeBannerShow && layoutCache.modeBanner) {
        const mr = layoutCache.modeBanner;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(mr.left, mr.top, mr.width, mr.height, 18);
        ctx.fillStyle = 'rgba(235, 200, 140, 0.34)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const bTxt = uiState.modeBannerText || '';
        const bProg = uiState.modeBannerProg || '';
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 12.5px "Fredoka", "PingFang SC", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(bTxt, mr.left + 12, mr.top + mr.height * 0.5);

        if (layoutCache.modeBannerProg && layoutCache.modeBannerProg.width > 0) {
          const pr = layoutCache.modeBannerProg;
          ctx.beginPath(); ctx.roundRect(pr.left, pr.top, pr.width, pr.height, 10);
          ctx.fillStyle = '#d48c28'; ctx.fill();
          ctx.fillStyle = '#ffffff'; ctx.font = '800 11px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(bProg, pr.left + pr.width * 0.5, pr.top + pr.height * 0.5);
        }

        if (remainingMoves !== null && layoutCache.movesCounterPill && layoutCache.movesCounterPill.width > 0) {
          const mpr = layoutCache.movesCounterPill;
          const isDanger = remainingMoves <= 5;
          ctx.beginPath(); ctx.roundRect(mpr.left, mpr.top, mpr.width, mpr.height, 14);
          ctx.fillStyle = isDanger ? '#ef4444' : '#f57c00'; ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.stroke();
          ctx.fillStyle = '#ffffff'; ctx.font = '900 12px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`⏰ 步数 ${remainingMoves}`, mpr.left + mpr.width * 0.5, mpr.top + mpr.height * 0.5);
        }
        ctx.restore();
      }

      // 5. 中央水瓶舞台（支持多瓶连续并行倾倒与并行飞入礼袋！）
      const activePoursObj = window._activeCanvasPours || {};
      const activePourList = Object.values(activePoursObj).filter(p => p && p.active);
      const activeFlyBagsObj = window._activeCanvasFlyBags || {};
      const sloshMap = window._canvasSloshMap || {};
      const vfxMap = window._canvasVfxMap || {};

      const findPourAsSrc = (bIdx) => activePourList.find(p => p.srcIdx === bIdx) || null;
      const findPourAsDst = (bIdx) => activePourList.find(p => p.dstIdx === bIdx && p.dstLiqOpts) || null;

      if (layoutCache.bottleSlots.length === bottles.length) {
        // 5A. 绘制所有 3D 粗麻布编织软垫底座
        bottles.forEach((b, idx) => {
          if (!b || b.removed) return;
          const slotInfo = layoutCache.bottleSlots[idx];
          if (!slotInfo || !slotInfo.padRect) return;
          const padRect = slotInfo.padRect;

          const vs = bottleVisualState[idx] || (bottleVisualState[idx] = { liftY: 0, scale: 1, aoScale: 1, aoAlpha: 0.72 });
          const pSrc = findPourAsSrc(idx);
          const fBag = activeFlyBagsObj[idx];
          const isPouringSrc = !!pSrc;
          const isFlying = !!(fBag && fBag.active);
          const isSelected = (!isPouringSrc && !isFlying) && ((selectedIndex === idx) || !!(activeHintPair && activeHintPair.srcIdx === idx));

          if (isPouringSrc || isFlying) {
            vs.liftY = 0;
            vs.scale = 1.0;
          } else {
            const targetLiftY = isSelected ? -20 : 0;
            const targetScale = isSelected ? 1.03 : 1.0;
            vs.liftY += (targetLiftY - vs.liftY) * 0.26;
            if (Math.abs(targetLiftY - vs.liftY) < 0.08) vs.liftY = targetLiftY;
            vs.scale += (targetScale - vs.scale) * 0.26;
            if (Math.abs(targetScale - vs.scale) < 0.002) vs.scale = targetScale;
          }

          const targetAoScale = (isSelected || isPouringSrc || isFlying) ? 0.56 : 1.0;
          const targetAoAlpha = (isSelected || isPouringSrc || isFlying) ? 0.22 : 0.72;
          vs.aoScale += (targetAoScale - vs.aoScale) * 0.24;
          vs.aoAlpha += (targetAoAlpha - vs.aoAlpha) * 0.24;

          const cCan = getNativeCoasterCanvas(b);
          ctx.drawImage(cCan, padRect.left, padRect.top, padRect.width, padRect.height);

          const aoCx = padRect.left + padRect.width * 0.50;
          const aoCy = padRect.top + padRect.height * (18.5 / 46.0);
          const aoRx = padRect.width * (28 / 100) * vs.aoScale;
          const aoRy = padRect.height * (6.2 / 46) * vs.aoScale;
          const aoSp = getAoShadowSprite();
          if (aoSp && aoRx > 0.5 && aoRy > 0.5) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, Math.min(1, vs.aoAlpha / 0.72));
            ctx.drawImage(aoSp, aoCx - aoRx, aoCy - aoRy, aoRx * 2, aoRy * 2);
            ctx.restore();
          }
        });

        // 5B. 按 Z 序绘制所有水瓶
        const drawOrder = bottles.map((_, i) => i).sort((a, bIdx) => {
          const zOf = (i) => {
            if (activeFlyBagsObj[i] && activeFlyBagsObj[i].active) return 120;
            if (findPourAsSrc(i)) return 100;
            if (findPourAsDst(i)) return 85;
            if (selectedIndex === i || (activeHintPair && activeHintPair.srcIdx === i)) return 65;
            if (activeHintPair && activeHintPair.dstIdx === i) return 60;
            if (bottles[i] && bottles[i].isGiantCat) return 30;
            return 20;
          };
          return zOf(a) - zOf(bIdx);
        });

        drawOrder.forEach(idx => {
          const b = bottles[idx];
          if (!b || b.removed) return;
          const slotInfo = layoutCache.bottleSlots[idx];
          if (!slotInfo || !slotInfo.slotRect) return;
          const slotRect = slotInfo.slotRect;
          const rejectInfo = uiState.bottleRejectMap[idx];

          registerHitRegion('bottle_' + idx, slotRect.left - 3, slotRect.top - 16, slotRect.width + 6, slotRect.height + 22, 40, () => onBottleClick(idx));

          const vs = bottleVisualState[idx] || { liftY: 0, scale: 1 };
          const maxCap = b.maxCap || 4;
          const isGiantCat = !!b.isGiantCat;
          const { vbMinX, vbMinY, vbW, vbH } = getBottleLayerMetrics(maxCap, isGiantCat);

          const pSrc = findPourAsSrc(idx);
          const pDst = findPourAsDst(idx);
          const flyState = activeFlyBagsObj[idx];
          const isPouringSrc = !!pSrc;
          const isPouringDst = !!pDst;
          const isFlyingBag = !!(flyState && flyState.active);

          ctx.save();

          if (isFlyingBag) {
            if (flyState.clipBottomY !== null) {
              ctx.beginPath();
              ctx.rect(0, 0, viewW, flyState.clipBottomY);
              ctx.clip();
            }
            const cx = slotRect.left + slotRect.width * 0.5 + flyState.tx;
            const cy = slotRect.top + slotRect.height * 0.5 + flyState.ty;
            ctx.translate(cx, cy);
            ctx.rotate((flyState.curRot * Math.PI) / 180);
            ctx.scale(flyState.curScale, flyState.curScale);
            ctx.translate(-slotRect.width * 0.5, -slotRect.height * 0.5);
            ctx.scale(slotRect.width / vbW, slotRect.height / vbH);
            ctx.translate(-vbMinX, -vbMinY);
          } else if (isPouringSrc) {
            ctx.translate(pSrc.curLipX, pSrc.curLipY);
            ctx.rotate((pSrc.curDeg * Math.PI) / 180);
            ctx.scale(slotRect.width / vbW, slotRect.height / vbH);
            ctx.translate(-pSrc.pivotSvgX, -pSrc.pivotSvgY);
          } else {
            const pivotScreenX = slotRect.left + slotRect.width * 0.5;
            const pivotScreenY = slotRect.top + slotRect.height * 0.92;
            let shakeX = 0, shakeRad = 0;
            if (rejectInfo && nowMs < rejectInfo.shakeUntil) {
              shakeX = Math.sin(nowMs * 0.048) * 4.8;
              shakeRad = (shakeX * 0.55 * Math.PI) / 180;
            } else if (vfxMap[idx] && vfxMap[idx].p < 0.48 && ['ice_shatter', 'ice_crack', 'stone_shatter', 'stone_hit'].includes(vfxMap[idx].vfxType)) {
              const vp = vfxMap[idx].p;
              shakeX = Math.sin(vp * Math.PI * 10) * (1 - vp * 2) * 5.2;
              shakeRad = (shakeX * 0.45 * Math.PI) / 180;
            }
            let corkScaleX = 1, corkScaleY = 1, corkTransY = 0;
            if (b.corked && typeof b.corkAnimProgress === 'number' && b.corkAnimProgress >= 0.16 && b.corkAnimProgress < 0.42) {
              const hitP = (b.corkAnimProgress - 0.16) / 0.26;
              const squash = Math.sin(hitP * Math.PI) * Math.exp(-2.2 * hitP);
              corkScaleX = 1 + squash * 0.024;
              corkScaleY = 1 - squash * 0.030;
              corkTransY = squash * 2.8;
            }
            ctx.translate(pivotScreenX + shakeX, pivotScreenY + vs.liftY + corkTransY);
            ctx.rotate(shakeRad);
            ctx.scale(vs.scale * corkScaleX, vs.scale * corkScaleY);
            ctx.translate(-pivotScreenX, -pivotScreenY);

            ctx.translate(slotRect.left, slotRect.top);
            ctx.scale(slotRect.width / vbW, slotRect.height / vbH);
            ctx.translate(-vbMinX, -vbMinY);
          }

          let layersToDraw = b.layers;
          let liqOpts = {
            layers: b.layers,
            topLayerScale: 1,
            tiltAngle: 0,
            mysteryCount: b.mysteryCount || 0,
            maxCap,
            isGiantCat,
            sloshPhase: (sloshMap[idx] && sloshMap[idx].sloshPhase) || 0,
            sloshAmplitude: (sloshMap[idx] && sloshMap[idx].sloshAmplitude) || 0
          };
          if (isPouringSrc && pSrc.srcLiqOpts) {
            layersToDraw = pSrc.srcLayers;
            liqOpts = Object.assign({ layers: layersToDraw }, pSrc.srcLiqOpts);
          } else if (isPouringDst && pDst.dstLiqOpts) {
            layersToDraw = pDst.dstLayers;
            liqOpts = Object.assign({ layers: layersToDraw }, pDst.dstLiqOpts);
          }

          drawSingleBottleContents(ctx, b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH, liqOpts, isPouringSrc, isPouringDst);
          ctx.restore();

          // (A) 选中提起水瓶时的柔和金辉光环与 6 颗上浮星芒微粒
          if (selectedIndex === idx && !isPouringSrc && !isFlyingBag) {
            const topColKey = b.layers && b.layers.length > 0 ? b.layers[b.layers.length - 1] : 'yellow';
            const sCol = COLORS[topColKey] || COLORS.yellow;
            ctx.save();
            const scx = slotRect.left + slotRect.width * 0.5;
            const pulse = 0.75 + 0.25 * Math.sin(nowMs * 0.006);
            ctx.strokeStyle = sCol.topLight || '#fef08a';
            ctx.globalAlpha = 0.55 * pulse;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.ellipse(scx, slotRect.bottom - 6 + vs.liftY, slotRect.width * 0.44, 7.5, 0, 0, Math.PI * 2);
            ctx.stroke();
            for (let sp = 0; sp < 6; sp++) {
              const phase = ((nowMs * 0.0014 + sp * 0.17) % 1.0);
              const ang = sp * 1.05 + nowMs * 0.002;
              const px = scx + Math.cos(ang) * (slotRect.width * 0.44);
              const py = slotRect.bottom - 14 + vs.liftY - phase * (slotRect.height * 0.78);
              drawGlowingStar2D(ctx, px, py, (2.2 + (sp % 2) * 0.9) * Math.sin(phase * Math.PI), ang, 0.82 * Math.sin(phase * Math.PI));
            }
            ctx.restore();
          }

          // (B) 满瓶飞向礼袋时的流光尾迹、拖尾星芒粒子与袋口金环特效
          if (isFlyingBag && flyState) {
            const fcx = slotRect.left + slotRect.width * 0.5 + flyState.tx;
            const fcy = slotRect.top + slotRect.height * 0.5 + flyState.ty;
            ctx.save();
            if (flyState.trail && flyState.trail.length > 0) {
              for (let tr = 0; tr < flyState.trail.length; tr++) {
                const pt = flyState.trail[tr];
                if (pt.alpha <= 0.05) continue;
                drawGlowingStar2D(ctx, pt.x + (tr % 2 === 0 ? 6 : -6), pt.y, (1.8 + tr * 0.25) * pt.scale, nowMs * 0.005 + tr, pt.alpha * 0.85);
              }
            } else {
              for (let tr = 1; tr <= 5; tr++) {
                const ratio = 1 - tr * 0.13;
                const tx = slotRect.left + slotRect.width * 0.5 + flyState.tx * ratio;
                const ty = slotRect.top + slotRect.height * 0.5 + flyState.ty * ratio;
                drawGlowingStar2D(ctx, tx + (tr % 2 === 0 ? 8 : -8), ty, 3.8 - tr * 0.55, nowMs * 0.005 + tr, 0.78 - tr * 0.13);
              }
            }
            ctx.strokeStyle = 'rgba(254, 240, 138, 0.88)';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(fcx, fcy, slotRect.width * 0.36 * flyState.curScale, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // (C) 当玩家已拿起一个源水瓶时，在色锁瓶/单向瓶上方给出直观的【✓可倒入 / ✕限制原因】预反馈
          if (selectedIndex !== null && selectedIndex !== idx && !b.corked && !b.removed && !isPouringSrc && !isPouringDst) {
            const srcB = bottles[selectedIndex];
            if (srcB && srcB.layers && srcB.layers.length > 0) {
              const srcTopCol = srcB.layers[srcB.layers.length - 1];
              let feedbackTxt = '';
              let feedbackBg = '';
              if (b.special === 'color_lock' && b.requiredColor) {
                if (srcTopCol !== b.requiredColor) {
                  const reqName = (COLORS[b.requiredColor]?.name || '同色').slice(0, 1);
                  feedbackTxt = `✕ 仅限${reqName}色`;
                  feedbackBg = 'rgba(220, 38, 38, 0.92)';
                } else if (b.layers.length < maxCap && (b.layers.length === 0 || b.layers[b.layers.length - 1] === srcTopCol)) {
                  feedbackTxt = '✓ 可倒入';
                  feedbackBg = 'rgba(22, 163, 74, 0.92)';
                }
              } else if (b.special === 'one_way_out') {
                feedbackTxt = '✕ 只出不进';
                feedbackBg = 'rgba(220, 38, 38, 0.90)';
              } else if (b.special === 'one_way_in' && b.layers.length < maxCap) {
                if (b.layers.length === 0 || b.layers[b.layers.length - 1] === srcTopCol) {
                  feedbackTxt = '✓ 单向可入';
                  feedbackBg = 'rgba(22, 163, 74, 0.92)';
                } else {
                  feedbackTxt = '✕ 颜色不符';
                  feedbackBg = 'rgba(220, 38, 38, 0.90)';
                }
              }
              if (feedbackTxt) {
                ctx.save();
                const fcx = slotRect.left + slotRect.width * 0.5;
                const fcy = slotRect.top - 8 + Math.sin(nowMs * 0.008) * 2;
                ctx.font = '900 10px "Fredoka", "PingFang SC", sans-serif';
                const fw = Math.max(54, ctx.measureText(feedbackTxt).width + 14);
                const fh = 18;
                ctx.beginPath();
                ctx.roundRect(fcx - fw * 0.5, fcy - fh * 0.5, fw, fh, 9);
                ctx.fillStyle = feedbackBg;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.4;
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(feedbackTxt, fcx, fcy + 0.5);
                ctx.restore();
              }
            }
          }

          // (D) 受阻轻提示气泡 (纯内存状态驱动)
          if (rejectInfo && nowMs < rejectInfo.until && rejectInfo.text) {
            const txt = rejectInfo.text;
            const cw = Math.max(88, txt.length * 14 + 24);
            const ch = 28;
            const cx = slotRect.left + slotRect.width * 0.5 - cw * 0.5;
            const cy = slotRect.top - 26;
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(cx, cy, cw, ch, 14);
            ctx.fillStyle = 'rgba(255, 250, 238, 0.96)';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6;
            ctx.stroke();
            ctx.fillStyle = '#5c3d18';
            ctx.font = '900 13px "Fredoka", "PingFang SC", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(txt, cx + cw * 0.5, cy + ch * 0.5);
            ctx.restore();
          }
        });
      }

      // 6. 全屏倾倒水柱（支持多个水柱并行绘制）与提示弧线
      if (activePourList.length > 0) {
        activePourList.forEach(pItem => drawPourStreamAndTrailOnCanvas(ctx, pItem));
      } else if (activeHintPair) {
        drawHintGuideOnCanvas(ctx, nowMs);
      }

      // 7. 底部 3 枚超椭圆折射玻璃辅助道具按钮（重排、撤回、提示）
      const dockIds = ['shuffle-btn', 'undo-btn', 'hint-btn'];
      const dockTitles = {
        'shuffle-btn': '重排',
        'undo-btn': '撤回',
        'hint-btn': '提示'
      };
      dockIds.forEach(id => {
        const info = layoutCache.dockBtns[id];
        if (!info || !info.btn) return;
        const r = info.btn;
        const sp = getNativeGlassButtonSprite(id);
        const pressS = pressedHitId === id ? 0.93 : 1.0;
        const cx = r.left + r.width * 0.5;
        ctx.save();
        ctx.translate(cx, r.top + r.height * 0.5);
        ctx.scale(pressS, pressS);
        ctx.drawImage(sp, -r.width * 0.5, -r.height * 0.5, r.width, r.height);
        ctx.restore();

        if (info.badge) {
          const br = info.badge;
          const badgeTxt = id === 'shuffle-btn' ? (shuffleUses > 0 ? String(shuffleUses) : '+')
            : (id === 'undo-btn' ? (undoUses > 0 ? String(undoUses) : '+')
              : (id === 'hint-btn' ? (hintUses > 0 ? String(hintUses) : '+')
                : ((typeof addBottleUses !== 'undefined' && addBottleUses > 0) ? String(addBottleUses) : '+')));
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(br.left, br.top, br.width, br.height, br.height * 0.5);
          const bg = ctx.createLinearGradient(br.left, br.top, br.right, br.bottom);
          bg.addColorStop(0, 'rgba(255, 248, 215, 0.96)');
          bg.addColorStop(1, 'rgba(235, 178, 62, 0.96)');
          ctx.fillStyle = bg;
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.fillStyle = '#5a3812';
          ctx.font = '800 10.5px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeTxt, br.left + br.width * 0.5, br.top + br.height * 0.5);
          ctx.restore();
        }

        const titleTxt = dockTitles[id];
        if (titleTxt) {
          ctx.save();
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = '900 12px "Fredoka", "PingFang SC", sans-serif';
          ctx.fillStyle = 'rgba(72, 42, 8, 0.55)';
          ctx.fillText(titleTxt, cx, r.bottom + 9.5);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(titleTxt, cx, r.bottom + 8.5);
          ctx.restore();
        }

        registerHitRegion(id, r.left - 3, r.top - 3, r.width + 6, r.height + 20, 45, () => executeDockAction(id));
      });

      // 8. 弹窗面板
      drawOpenModalOnCanvas(ctx, viewW, viewH, nowMs);

      // 9. 顶部轻提示胶囊 (纯内存状态驱动)
      if (uiState.toastVisible && uiState.toastText) {
        const txt = uiState.toastText;
        ctx.save();
        ctx.font = '800 13px "Fredoka", "PingFang SC", sans-serif';
        const tw = Math.min(viewW * 0.9, ctx.measureText(txt).width + 52);
        const th = 36;
        const tx = (viewW - tw) * 0.5;
        const ty = viewH * 0.145;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tw, th, 18);
        const tg = ctx.createLinearGradient(0, ty, 0, ty + th);
        tg.addColorStop(0, 'rgba(255, 251, 240, 0.96)');
        tg.addColorStop(1, 'rgba(244, 229, 200, 0.96)');
        ctx.fillStyle = tg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tx + 18, ty + th * 0.5, 9, 0, Math.PI * 2);
        ctx.fillStyle = '#d97706';
        ctx.fill();
        ctx.fillStyle = '#5c3d18';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, tx + 33, ty + th * 0.5, tw - 44);
        ctx.restore();
      }
      } catch ( loopErr ) {
        if (typeof console !== 'undefined' && console.error && !_g.__loggedLoopErr) {
          _g.__loggedLoopErr = true;
          console.error('[PureCanvasLoop Error]', loopErr);
        }
      } finally {
        ctx.restore();
      }
    }

    function findTopHitRegion(clientX, clientY) {
      let best = null;
      for (let i = 0; i < activeHitRegions.length; i++) {
        const reg = activeHitRegions[i];
        if (clientX >= reg.x && clientX <= reg.x + reg.w && clientY >= reg.y && clientY <= reg.y + reg.h) {
          if (!best || reg.zIndex >= best.zIndex) {
            best = reg;
          }
        }
      }
      return best;
    }

    let dragScrollStartY = null;
    let dragScrollMoved = false;

    function onPointerDown(clientX, clientY) {
      const hit = findTopHitRegion(clientX, clientY);
      pressedHitId = hit ? hit.id : null;
      dragScrollStartY = clientY;
      dragScrollMoved = false;
    }

    function onPointerMove(clientX, clientY) {
      if (dragScrollStartY !== null) {
        const dy = clientY - dragScrollStartY;
        if (Math.abs(dy) > 8) {
          dragScrollMoved = true;
          pressedHitId = null;
          if (uiState.openModalId === 'level-modal-mask') {
            uiState.levelScrollTop = Math.max(0, Math.min(340, (uiState.levelScrollTop || 0) - dy));
            dragScrollStartY = clientY;
          } else if (uiState.openModalId === 'shop-modal-mask') {
            uiState.shopScrollTop = Math.max(0, Math.min(200, (uiState.shopScrollTop || 0) - dy));
            dragScrollStartY = clientY;
          }
        }
      }
    }

    function onPointerUp(clientX, clientY) {
      const wasDragged = dragScrollMoved;
      dragScrollStartY = null;
      dragScrollMoved = false;
      pressedHitId = null;
      if (wasDragged) return;
      const hit = findTopHitRegion(clientX, clientY);
      if (hit && typeof hit.onClick === 'function') {
        hit.onClick();
      }
    }

    function onPointerCancel() {
      pressedHitId = null;
      dragScrollStartY = null;
      dragScrollMoved = false;
    }

    // 绑定微信/抖音小游戏原生触摸事件
    if (nativeApi) {
      const getTouchPt = (res) => {
        const t = (res && res.touches && res.touches[0]) || (res && res.changedTouches && res.changedTouches[0]);
        return t ? { x: t.clientX ?? t.pageX ?? t.x ?? 0, y: t.clientY ?? t.pageY ?? t.y ?? 0 } : { x: 0, y: 0 };
      };
      if (typeof nativeApi.onTouchStart === 'function') {
        nativeApi.onTouchStart((res) => {
          const pt = getTouchPt(res);
          onPointerDown(pt.x, pt.y);
        });
      }
      if (typeof nativeApi.onTouchMove === 'function') {
        nativeApi.onTouchMove((res) => {
          const pt = getTouchPt(res);
          onPointerMove(pt.x, pt.y);
        });
      }
      if (typeof nativeApi.onTouchEnd === 'function') {
        nativeApi.onTouchEnd((res) => {
          const pt = getTouchPt(res);
          onPointerUp(pt.x, pt.y);
        });
      }
      if (typeof nativeApi.onTouchCancel === 'function') {
        nativeApi.onTouchCancel(() => {
          onPointerCancel();
        });
      }
    } else if (typeof _g.__bindTouchHandlers === 'function') {
      _g.__bindTouchHandlers({ onPointerDown, onPointerMove, onPointerUp, onPointerCancel });
    }

    setTimeout(() => {
      rebuildLayoutCache();
      requestAnimationFrame(renderPureCanvasLoop);
    }, 0);
  })();
})(__outerWinRef, __outerGlobalRef);