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

(function initWeChatAndBrowserRuntime() {
  const _g = (typeof GameGlobal !== 'undefined') ? GameGlobal
           : (typeof window !== 'undefined') ? window
           : (typeof globalThis !== 'undefined') ? globalThis : this;

  if (typeof _g.window === 'undefined') {
    _g.window = _g;
  }
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
      } catch (e2) {}
    }
  }
  if (typeof _g.addEventListener !== 'function') {
    _g._winListeners = {};
    _g.addEventListener = function (type, fn) {
      (_g._winListeners[type] || (_g._winListeners[type] = [])).push(fn);
    };
    _g.removeEventListener = function (type, fn) {
      if (!_g._winListeners[type]) return;
      _g._winListeners[type] = _g._winListeners[type].filter(f => f !== fn);
    };
  }

  const isWxMiniGame = (typeof wx !== 'undefined' && typeof wx.createCanvas === 'function');
  const isTtMiniGame = (typeof tt !== 'undefined' && typeof tt.createCanvas === 'function');
  const nativeApi = isWxMiniGame ? wx : (isTtMiniGame ? tt : null);

  // --------------------------------------------------------------------------
  // 1. 屏幕尺寸与安全区获取
  // --------------------------------------------------------------------------
  let sysInfo = { windowWidth: 412, windowHeight: 892, pixelRatio: 2, safeArea: { top: 44, bottom: 860 } };
  if (nativeApi && typeof nativeApi.getSystemInfoSync === 'function') {
    try {
      const info = nativeApi.getSystemInfoSync();
      if (info && info.windowWidth && info.windowHeight) {
        sysInfo = {
          windowWidth: info.windowWidth,
          windowHeight: info.windowHeight,
          pixelRatio: info.pixelRatio || 2,
          safeArea: info.safeArea || { top: Math.round(info.windowHeight * 0.048), bottom: Math.round(info.windowHeight * 0.965) }
        };
      }
    } catch (e) {}
  } else if (typeof _g.innerWidth === 'number' && _g.innerWidth > 0) {
    sysInfo = {
      windowWidth: _g.innerWidth,
      windowHeight: _g.innerHeight,
      pixelRatio: _g.devicePixelRatio || 2,
      safeArea: { top: 14, bottom: _g.innerHeight - 12 }
    };
  }

  if (!_g.innerWidth) _g.innerWidth = sysInfo.windowWidth;
  if (!_g.innerHeight) _g.innerHeight = sysInfo.windowHeight;
  if (!_g.devicePixelRatio) _g.devicePixelRatio = sysInfo.pixelRatio;
  _g.__safeTop = (sysInfo.safeArea && typeof sysInfo.safeArea.top === 'number') ? Math.max(10, sysInfo.safeArea.top) : 24;
  _g.__safeBottom = (sysInfo.safeArea && typeof sysInfo.safeArea.bottom === 'number')
    ? Math.max(8, sysInfo.windowHeight - sysInfo.safeArea.bottom) : 14;

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

  class PolyfillPath2D {
    constructor(d) {
      this.__isPolyfillPath2D = true;
      this.d = typeof d === 'string' ? d : (d && d.d ? d.d : '');
    }
  }
  if (typeof _g.Path2D === 'undefined') {
    _g.Path2D = PolyfillPath2D;
  }

  function enhanceCanvas2DContext(ctx) {
    if (!ctx || ctx.__enhanced2D) return ctx;
    ctx.__enhanced2D = true;

    if (typeof ctx.roundRect !== 'function') {
      ctx.roundRect = function (x, y, w, h, radii) {
        let r = 0;
        if (typeof radii === 'number') r = radii;
        else if (Array.isArray(radii) && radii.length > 0) r = Number(radii[0]) || 0;
        r = Math.max(0, Math.min(r, Math.abs(w) * 0.5, Math.abs(h) * 0.5));
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
      };
    }

    if (typeof ctx.createPattern !== 'function') {
      ctx.createPattern = function () { return '#dec092'; };
    }
    if (typeof ctx.setLineDash !== 'function') {
      ctx.setLineDash = function () {};
    }
    if (typeof ctx.ellipse !== 'function') {
      ctx.ellipse = function (x, y, rx, ry, rot, a0, a1, ccw) {
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
      if (arg1 && arg1.__isPolyfillPath2D) {
        this.beginPath();
        replaySvgPathStringOnCtx(this, arg1.d);
        return arg2 !== undefined ? origFill.call(this, arg2) : origFill.call(this);
      }
      try {
        return arguments.length > 0 ? origFill.apply(this, arguments) : origFill.call(this);
      } catch (e) {
        if (arg1 && arg1.d) {
          this.beginPath();
          replaySvgPathStringOnCtx(this, arg1.d);
          return origFill.call(this);
        }
      }
    };

    ctx.stroke = function (arg1) {
      if (arg1 && arg1.__isPolyfillPath2D) {
        this.beginPath();
        replaySvgPathStringOnCtx(this, arg1.d);
        return origStroke.call(this);
      }
      try {
        return arguments.length > 0 ? origStroke.apply(this, arguments) : origStroke.call(this);
      } catch (e) {
        if (arg1 && arg1.d) {
          this.beginPath();
          replaySvgPathStringOnCtx(this, arg1.d);
          return origStroke.call(this);
        }
      }
    };

    ctx.clip = function (arg1, arg2) {
      if (arg1 && arg1.__isPolyfillPath2D) {
        this.beginPath();
        replaySvgPathStringOnCtx(this, arg1.d);
        return arg2 !== undefined ? origClip.call(this, arg2) : origClip.call(this);
      }
      try {
        return arguments.length > 0 ? origClip.apply(this, arguments) : origClip.call(this);
      } catch (e) {
        if (arg1 && arg1.d) {
          this.beginPath();
          replaySvgPathStringOnCtx(this, arg1.d);
          return origClip.call(this);
        }
      }
    };

    return ctx;
  }

  function wrapCanvasInstance(c) {
    if (!c || c.__wrappedCanvas) return c;
    c.__wrappedCanvas = true;
    if (!c.style) c.style = {};
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
      c.getContext = function (type, opts) {
        const ctx = origGetContext(type, opts);
        return type === '2d' ? enhanceCanvas2DContext(ctx) : ctx;
      };
    }
    return c;
  }

  // --------------------------------------------------------------------------
  // 3. 微信小游戏主画布与离屏画布分配 + 纯数学 UI/水瓶布局计算器 (0 DOM 依赖)
  // --------------------------------------------------------------------------
  let mainScreenCanvas = null;
  if (nativeApi && typeof nativeApi.createCanvas === 'function') {
    mainScreenCanvas = wrapCanvasInstance(nativeApi.createCanvas());
    mainScreenCanvas.id = 'pure-game-canvas';
  }

  // 判断当前是否处于无真实 DOM 布局的小游戏环境
  const hasRealBrowserDOM = !nativeApi && (typeof document !== 'undefined') &&
    typeof document.createElement === 'function' &&
    typeof document.getElementById === 'function' &&
    !!document.body;

  if (!hasRealBrowserDOM) {
    // 构建极速轻量级虚拟 DOM 树 + 100% 精准数学坐标计算引擎
    const idRegistry = new Map();

    class VClassList {
      constructor(node) { this.node = node; this.set = new Set(); }
      _syncFromStr(s) {
        this.set.clear();
        String(s || '').split(/\s+/).filter(Boolean).forEach(c => this.set.add(c));
      }
      _syncToNode() {
        this.node._className = Array.from(this.set).join(' ');
        _g._layoutDirty = true;
      }
      add(...cls) { cls.forEach(c => c && this.set.add(c)); this._syncToNode(); }
      remove(...cls) { cls.forEach(c => this.set.delete(c)); this._syncToNode(); }
      contains(c) { return this.set.has(c); }
      toggle(c, force) {
        const shouldAdd = force !== undefined ? !!force : !this.set.has(c);
        if (shouldAdd) this.set.add(c); else this.set.delete(c);
        this._syncToNode();
        return shouldAdd;
      }
    }

    class VNode {
      constructor(tagName = 'div') {
        this.tagName = String(tagName).toUpperCase();
        this._id = '';
        this._className = '';
        this.classList = new VClassList(this);
        this.style = { setProperty(k, v) { this[k] = v; }, getPropertyValue(k) { return this[k] || ''; } };
        this.dataset = {};
        this.attributes = {};
        this.children = [];
        this.parentNode = null;
        this._textContent = '';
        this._innerHTML = '';
        this._listeners = {};
        this.scrollTop = 0;
      }
      get id() { return this._id; }
      set id(v) {
        if (this._id && idRegistry.get(this._id) === this) idRegistry.delete(this._id);
        this._id = String(v || '');
        if (this._id) idRegistry.set(this._id, this);
      }
      get className() { return this._className; }
      set className(v) {
        this._className = String(v || '');
        this.classList._syncFromStr(this._className);
        _g._layoutDirty = true;
      }
      get textContent() {
        if (this.children.length > 0) {
          const childTxt = this.children.map(c => c.textContent).join('');
          return this._textContent ? (this._textContent + ' ' + childTxt).trim() : childTxt;
        }
        return this._textContent;
      }
      set textContent(v) {
        this._textContent = String(v ?? '');
        this.children = [];
      }
      get innerHTML() { return this._innerHTML; }
      set innerHTML(html) {
        this._innerHTML = String(html ?? '');
        this.children.forEach(c => unregisterSubtree(c));
        this.children = [];
        this._textContent = '';
        if (this._innerHTML.trim()) {
          parseMiniHTMLIntoParent(this._innerHTML, this);
        }
        _g._layoutDirty = true;
      }
      setAttribute(k, v) {
        this.attributes[k] = String(v);
        if (k === 'id') this.id = v;
        else if (k === 'class') this.className = v;
        else if (k.startsWith('data-')) {
          const camel = k.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase());
          this.dataset[camel] = String(v);
        }
      }
      getAttribute(k) {
        if (k === 'id') return this._id;
        if (k === 'class') return this._className;
        return this.attributes[k] ?? null;
      }
      appendChild(child) {
        if (!child) return null;
        if (child.parentNode) {
          const idx = child.parentNode.children.indexOf(child);
          if (idx !== -1) child.parentNode.children.splice(idx, 1);
        }
        child.parentNode = this;
        this.children.push(child);
        registerSubtree(child);
        _g._layoutDirty = true;
        return child;
      }
      remove() {
        if (this.parentNode) {
          const idx = this.parentNode.children.indexOf(this);
          if (idx !== -1) this.parentNode.children.splice(idx, 1);
          this.parentNode = null;
        }
        unregisterSubtree(this);
        _g._layoutDirty = true;
      }
      addEventListener(type, fn) {
        (this._listeners[type] || (this._listeners[type] = [])).push(fn);
      }
      removeEventListener(type, fn) {
        if (!this._listeners[type]) return;
        this._listeners[type] = this._listeners[type].filter(f => f !== fn);
      }
      click() {
        const list = this._listeners['click'] || [];
        list.forEach(fn => fn.call(this, { target: this, currentTarget: this, stopPropagation() {}, preventDefault() {} }));
      }
      querySelector(sel) {
        return this.querySelectorAll(sel)[0] || null;
      }
      querySelectorAll(sel) {
        const results = [];
        const parts = String(sel).trim().split(/\s+/);
        const matchSingle = (node, token) => {
          if (!token) return false;
          if (token.startsWith('#')) return node._id === token.slice(1);
          if (token.startsWith('.')) {
            const classes = token.slice(1).split('.');
            return classes.every(c => node.classList.contains(c));
          }
          if (token.includes('.')) {
            const [tag, ...classes] = token.split('.');
            return node.tagName.toLowerCase() === tag.toLowerCase() && classes.every(c => node.classList.contains(c));
          }
          return node.tagName.toLowerCase() === token.toLowerCase();
        };
        const hasAncestorMatching = (node, pIdx) => {
          let cur = node.parentNode;
          while (cur && cur !== this) {
            if (matchSingle(cur, parts[pIdx])) {
              if (pIdx === 0) return true;
              if (hasAncestorMatching(cur, pIdx - 1)) return true;
            }
            cur = cur.parentNode;
          }
          return false;
        };
        const walk = (n) => {
          for (let i = 0; i < n.children.length; i++) {
            const ch = n.children[i];
            if (matchSingle(ch, parts[parts.length - 1])) {
              if (parts.length === 1 || hasAncestorMatching(ch, parts.length - 2)) {
                results.push(ch);
              }
            }
            walk(ch);
          }
        };
        walk(this);
        return results;
      }
      getBoundingClientRect() {
        return computeVNodeRect(this);
      }
    }

    function registerSubtree(node) {
      if (!node) return;
      if (node._id) idRegistry.set(node._id, node);
      if (node.children) node.children.forEach(registerSubtree);
    }
    function unregisterSubtree(node) {
      if (!node) return;
      if (node._id && idRegistry.get(node._id) === node) idRegistry.delete(node._id);
      if (node.children) node.children.forEach(unregisterSubtree);
    }

    function parseMiniHTMLIntoParent(html, parentNode) {
      const tagRe = /<\/?([a-zA-Z0-9-]+)([^>]*?)\s*(\/?)>|([^<]+)/g;
      const stack = [parentNode];
      let m;
      const voidTags = new Set(['IMG', 'BR', 'HR', 'INPUT', 'META', 'LINK', 'CIRCLE', 'RECT', 'LINE', 'PATH', 'POLYGON', 'POLYLINE', 'ELLIPSE', 'STOP']);
      while ((m = tagRe.exec(html)) !== null) {
        if (m[4] !== undefined) {
          const txt = m[4].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
          if (txt && stack.length > 0) {
            const top = stack[stack.length - 1];
            top._textContent = (top._textContent ? top._textContent + ' ' : '') + txt;
          }
          continue;
        }
        const fullMatch = m[0];
        const isClosing = fullMatch.startsWith('</');
        const tagName = m[1];
        const attrStr = m[2] || '';
        const isSelfClosing = m[3] === '/' || voidTags.has(tagName.toUpperCase());

        if (isClosing) {
          if (stack.length > 1) stack.pop();
          continue;
        }
        const el = new VNode(tagName);
        const attrRe = /([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
        let am;
        while ((am = attrRe.exec(attrStr)) !== null) {
          el.setAttribute(am[1], am[2] !== undefined ? am[2] : am[3]);
        }
        stack[stack.length - 1].appendChild(el);
        if (!isSelfClosing) {
          stack.push(el);
        }
      }
    }

    // 纯数学布局计算器：针对小游戏屏幕尺寸直接计算每个 UI 元素、水瓶、瓶口、软垫与弹窗的精确坐标
    function makeRect(left, top, width, height) {
      return { left, top, right: left + width, bottom: top + height, width, height, x: left, y: top };
    }

    function computeSlotRectByIndex(gridNode, slotIdx) {
      const W = _g.innerWidth || 412;
      const H = _g.innerHeight || 892;
      const safeT = _g.__safeTop || 24;
      const safeB = _g.__safeBottom || 14;
      const shellW = Math.min(W, 470);
      const shellX = (W - shellW) * 0.5;

      const bagsEl = idRegistry.get('bags-stage');
      const bagsVisible = bagsEl && !bagsEl.classList.contains('hidden');
      const bannerEl = idRegistry.get('mode-banner');
      const bannerVisible = bannerEl && bannerEl.classList.contains('show');

      const topUsed = safeT + 66 + (bagsVisible ? Math.min(118, Math.max(96, H * 0.145)) : 0) + (bannerVisible ? 42 : 0);
      const botUsed = safeB + 86;
      const stageTop = topUsed + 6;
      const stageH = Math.max(240, H - topUsed - botUsed - 12);
      const stageCy = stageTop + stageH * 0.5;

      const cls = gridNode ? gridNode.className : '';
      const isZoomed = cls.includes('zoomed-stage');
      const totalSlots = gridNode ? gridNode.children.length : 12;
      const slotNode = gridNode && gridNode.children[slotIdx];

      const padX = 8;
      const availW = shellW - padX * 2;
      let cols = 6, rows = 2, colGap = 7, rowGap = Math.min(48, Math.max(32, H * 0.056));
      if (cls.includes('layout-5col')) { cols = 5; rows = Math.ceil(totalSlots / 5); colGap = 10; }
      else if (cls.includes('layout-tall8')) { cols = 7; rows = 1; colGap = 4; }
      else if (cls.includes('layout-cat-boss')) { cols = 7; rows = 2; colGap = 4; rowGap = Math.min(40, Math.max(28, H * 0.048)); }
      else if (cls.includes('layout-21')) { cols = 7; rows = 3; colGap = 2; rowGap = Math.min(20, Math.max(12, H * 0.022)); }
      else { cols = 6; rows = Math.max(1, Math.ceil(totalSlots / 6)); }

      const cellW = (availW - colGap * (cols - 1)) / cols;

      // 特殊处理灵猫 BOSS 关 (7列 x 2行，idx=2 为跨 3-5 列 1-2 行的中央大猫瓶)
      if (cls.includes('layout-cat-boss')) {
        const stdSlotW = Math.min(cellW, 54);
        const stdSlotH = stdSlotW * (204 / 67);
        const totalGridH = stdSlotH * 2 + rowGap;
        const gridStartY = stageCy - totalGridH * 0.5;

        if (slotIdx === 2 || (slotNode && slotNode.classList.contains('giant-cat-slot'))) {
          const catSpanW = cellW * 3 + colGap * 2;
          const catW = Math.min(catSpanW, 158, stageH * 0.45 * (124 / 224));
          const catH = catW * (224 / 124);
          const left = shellX + padX + 2 * (cellW + colGap) + (catSpanW - catW) * 0.5;
          const top = stageCy - catH * 0.5;
          return makeRect(left, top, catW, catH);
        }
        // 其余 8 个普通瓶分布在左右各 2 列 (col = 0,1 和 5,6)
        const sideMap = { 0: [0,0], 1: [0,1], 3: [0,5], 4: [0,6], 5: [1,0], 6: [1,1], 7: [1,5], 8: [1,6] };
        const [r, c] = sideMap[slotIdx] || [Math.floor(slotIdx / 5), slotIdx % 5];
        const offX = slotNode ? (parseFloat(slotNode.style.left) || 0) : 0;
        const offY = slotNode ? (parseFloat(slotNode.style.top) || 0) : 0;
        const left = shellX + padX + c * (cellW + colGap) + (cellW - stdSlotW) * 0.5 + offX;
        const top = gridStartY + r * (stdSlotH + rowGap) + offY;
        return makeRect(left, top, stdSlotW, stdSlotH);
      }

      // 常规 / 8层长管 / 21瓶 / 高低异形排布
      let aspectW = 67, aspectH = 204, maxSlotW = 62, maxSlotH = Math.min(182, Math.max(128, H * 0.235));
      if (cls.includes('layout-tall8') || (slotNode && slotNode.classList.contains('tall-8-slot'))) {
        aspectW = 70; aspectH = 298; maxSlotW = 60; maxSlotH = Math.min(268, Math.max(176, H * 0.36));
      } else if (cls.includes('layout-21')) {
        maxSlotW = 52; maxSlotH = Math.min(148, Math.max(106, H * 0.175));
      }

      // 检查是否高低异形瓶（根据 viewBox 高度自适应）
      let customAspectH = aspectH;
      if (slotNode) {
        const svgNode = slotNode.querySelector('.bottle-svg');
        const vb = svgNode && svgNode.getAttribute('viewBox');
        if (vb) {
          const parts = vb.trim().split(/\s+/).map(Number);
          if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            aspectW = parts[2];
            customAspectH = parts[3];
          }
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
      const offX = slotNode ? (parseFloat(slotNode.style.left) || 0) : 0;
      const offY = slotNode ? (parseFloat(slotNode.style.top) || 0) : 0;

      // align-items: end（底部对齐行底）
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

    function computeVNodeRect(node) {
      const W = _g.innerWidth || 412;
      const H = _g.innerHeight || 892;
      const safeT = _g.__safeTop || 24;
      const safeB = _g.__safeBottom || 14;
      const shellW = Math.min(W, 470);
      const shellX = (W - shellW) * 0.5;

      if (!node) return makeRect(0, 0, 0, 0);
      const id = node._id;
      const cls = node._className || '';

      if (cls.includes('app-shell')) return makeRect(shellX, 0, shellW, H);
      if (id === 'settings-btn') return makeRect(shellX + 14, safeT + 8, 52, 52);
      if (id === 'rules-help-btn') return makeRect(shellX + shellW - 14 - 52, safeT + 8, 52, 52);
      if (id === 'top-center-level-trigger' || id === 'zen-big-num-wrap') {
        return makeRect(shellX + shellW * 0.5 - 85, safeT + 8, 170, 50);
      }

      // 顶部 4 个购物袋槽位
      if (cls.includes('bag-slot') && node.parentNode && node.parentNode._id === 'bags-stage') {
        const idx = node.parentNode.children.indexOf(node);
        const bagAreaW = Math.min(shellW - 24, 384);
        const bagAreaX = shellX + (shellW - bagAreaW) * 0.5;
        const gap = 14;
        const slotW = Math.min(76, (bagAreaW - gap * 3) / 4);
        const totalW = slotW * 4 + gap * 3;
        const startX = shellX + (shellW - totalW) * 0.5;
        const bagH = Math.min(114, Math.max(92, H * 0.135));
        const bagTop = safeT + 66;
        return makeRect(startX + idx * (slotW + gap), bagTop, slotW, bagH);
      }

      // 模式提示栏与步数胶囊
      const bagsEl = idRegistry.get('bags-stage');
      const bagsVisible = bagsEl && !bagsEl.classList.contains('hidden');
      const bannerTop = safeT + 68 + (bagsVisible ? Math.min(118, Math.max(96, H * 0.14)) : 0);
      if (id === 'mode-banner') return makeRect(shellX + 16, bannerTop, shellW - 32, 34);
      if (id === 'mode-banner-progress') return makeRect(shellX + 178, bannerTop + 6, 68, 22);
      if (id === 'moves-counter-pill') return makeRect(shellX + shellW - 16 - 92, bannerTop + 4, 88, 26);

      // 水瓶槽位、麻布软垫与瓶口锚点
      const gridEl = idRegistry.get('bottles-grid');
      if (cls.includes('bottle-slot') && node.parentNode === gridEl) {
        const idx = gridEl.children.indexOf(node);
        return computeSlotRectByIndex(gridEl, Math.max(0, idx));
      }
      if (cls.includes('bottle-svg') && node.parentNode && node.parentNode.classList.contains('bottle-slot')) {
        return computeVNodeRect(node.parentNode);
      }
      if (cls.includes('burlap-coaster-pad') && node.parentNode && node.parentNode.classList.contains('bottle-slot')) {
        const sr = computeVNodeRect(node.parentNode);
        if (node.parentNode.classList.contains('giant-cat-slot')) {
          return makeRect(sr.left - sr.width * 0.04, sr.bottom - 36, sr.width * 1.08, 52);
        }
        const padW = sr.width * 1.20;
        const padH = sr.height * 0.198;
        return makeRect(sr.left - sr.width * 0.10, sr.bottom + sr.height * 0.072 - padH, padW, padH);
      }
      if (id && (id.startsWith('mouth-center-') || id.startsWith('lip-left-') || id.startsWith('lip-right-'))) {
        const idx = parseInt(id.split('-').pop(), 10);
        const slotNode = gridEl && gridEl.children[idx];
        const sr = computeSlotRectByIndex(gridEl, idx);
        const svgNode = slotNode ? slotNode.querySelector('.bottle-svg') : null;
        let vbMinX = 16.5, vbMinY = 0, vbW = 67, vbH = 204;
        const vb = svgNode && svgNode.getAttribute('viewBox');
        if (vb) {
          const p = vb.trim().split(/\s+/).map(Number);
          if (p.length === 4) { vbMinX = p[0]; vbMinY = p[1]; vbW = p[2]; vbH = p[3]; }
        }
        const cxAttr = parseFloat(node.getAttribute('cx') || '50');
        const cyAttr = parseFloat(node.getAttribute('cy') || '9.5');
        const isSel = slotNode && slotNode.classList.contains('selected');
        const liftY = isSel ? -20 : 0;
        const px = sr.left + ((cxAttr - vbMinX) / vbW) * sr.width;
        const py = sr.top + ((cyAttr - vbMinY) / vbH) * sr.height + liftY;
        return makeRect(px - 0.5, py - 0.5, 1, 1);
      }

      // 底部 5 枚玻璃辅助道具按钮与角标（预留底部双行文字与效果预告空间）
      const dockIds = ['dock-restart-btn', 'shuffle-btn', 'undo-btn', 'hint-btn', 'add-bottle-btn'];
      if (dockIds.includes(id)) {
        const bIdx = dockIds.indexOf(id);
        const gap = Math.min(11, Math.max(7, W * 0.022));
        const maxBtnW = Math.floor((shellW - 24 - gap * 4) / 5);
        const btnSize = Math.min(62, Math.max(50, Math.min(maxBtnW, H * 0.072)));
        const totalW = btnSize * 5 + gap * 4;
        const startX = shellX + (shellW - totalW) * 0.5;
        const top = H - safeB - btnSize - 26;
        return makeRect(startX + bIdx * (btnSize + gap), top, btnSize, btnSize);
      }
      if (id === 'shuffle-count' || id === 'undo-count-badge' || id === 'hint-count' || id === 'add-bottle-count') {
        const parentBtnId = id === 'shuffle-count' ? 'shuffle-btn'
                          : (id === 'undo-count-badge' ? 'undo-btn'
                          : (id === 'hint-count' ? 'hint-btn' : 'add-bottle-btn'));
        const pr = computeVNodeRect(idRegistry.get(parentBtnId));
        return makeRect(pr.right - 21, pr.top + 1, 21, 17);
      }

      // 弹窗面板与子控件坐标（根据所属弹窗精准计算卡片高度，消除设置弹窗底部留白！）
      const findModalMaskId = (n) => {
        let cur = n;
        while (cur) {
          if (cur._id && cur._id.endsWith('modal-mask')) return cur._id;
          cur = cur.parentNode;
        }
        return 'pause-modal-mask';
      };
      const maskId = findModalMaskId(node);
      const cardW = Math.min(shellW - 28, 352);
      const cardX = shellX + (shellW - cardW) * 0.5;
      let cardH = Math.min(H * 0.70, 456);
      let cardY = (H - cardH) * 0.48;
      if (maskId === 'pause-modal-mask') {
        cardH = 342;
        const totalStackH = cardH + 14 + 58 + 12 + 52;
        cardY = Math.max(safeT + 26, (H - totalStackH) * 0.5 + 6);
      } else if (maskId === 'modal-mask') {
        cardH = 356;
        cardY = (H - cardH) * 0.48;
      } else if (maskId === 'speed-modal-mask') {
        cardH = 264;
        cardY = (H - (cardH + 68)) * 0.48;
      } else if (maskId === 'refresh-modal-mask') {
        cardH = 324;
        cardY = (H - cardH) * 0.48;
      } else if (maskId === 'out-of-moves-modal-mask') {
        cardH = 348;
        cardY = (H - cardH) * 0.48;
      }

      if (cls.includes('casual-modal-card')) {
        return makeRect(cardX, cardY, cardW, cardH);
      }
      if (cls.includes('casual-header-pill')) {
        return makeRect(cardX + (cardW - 172) * 0.5, cardY - 21, 172, 42);
      }
      if (cls.includes('casual-close-btn')) {
        return makeRect(cardX + cardW - 26, cardY - 12, 36, 36);
      }

      // 暂停设置面板内部元素（紧凑精致排布，0 底部多余空白）
      if (cls.includes('pause-setting-row')) {
        const pCard = node.parentNode;
        const rows = pCard ? pCard.querySelectorAll('.pause-setting-row') : [];
        const rIdx = Math.max(0, rows.indexOf(node));
        return makeRect(cardX + 18, cardY + 34 + rIdx * 54, cardW - 36, 46);
      }
      if (cls.includes('casual-toggle')) {
        const rowRect = computeVNodeRect(node.parentNode);
        return makeRect(rowRect.right - 86, rowRect.top + (rowRect.height - 34) * 0.5, 74, 34);
      }
      if (cls.includes('pause-feature-btn')) {
        const pCard = idRegistry.get('pause-modal-mask')?.querySelector('.casual-modal-card');
        const fBtns = pCard ? pCard.querySelectorAll('.pause-feature-btn') : [];
        const fIdx = Math.max(0, fBtns.indexOf(node));
        const gap = 8;
        const fw = (cardW - 36 - gap * 3) / 4;
        return makeRect(cardX + 18 + fIdx * (fw + gap), cardY + 254, fw, 68);
      }
      if (id === 'pause-home-btn') return makeRect(cardX, cardY + cardH + 14, 62, 58);
      if (id === 'pause-restart-btn') return makeRect(cardX + 74, cardY + cardH + 14, cardW - 148, 58);
      if (id === 'pause-skip-btn') return makeRect(cardX + cardW - 62, cardY + cardH + 14, 62, 58);
      if (id === 'pause-resume-btn') return makeRect(cardX, cardY + cardH + 84, cardW, 52);

      // 选关面板内部元素
      if (cls.includes('chapter-tab-btn')) {
        const tIdx = Number(node.dataset.ch || 0);
        const gap = 6;
        const tw = (cardW - 32 - gap * 4) / 5;
        return makeRect(cardX + 16 + tIdx * (tw + gap), cardY + 46, tw, 28);
      }
      if (id === 'level-grid-list') {
        return makeRect(cardX + 16, cardY + 84, cardW - 32, cardH - 102);
      }
      if (cls.includes('level-cell')) {
        const listEl = idRegistry.get('level-grid-list');
        const sr = computeVNodeRect(listEl);
        const idx = listEl ? Math.max(0, listEl.children.indexOf(node)) : 0;
        const col = idx % 4, row = Math.floor(idx / 4);
        const gap = 8;
        const cw = (sr.width - gap * 3) / 4;
        const ch = 56;
        const scrollTop = listEl ? (listEl.scrollTop || 0) : 0;
        return makeRect(sr.left + col * (cw + gap), sr.top + row * (ch + gap) - scrollTop, cw, ch);
      }

      // 商店面板内部元素
      if (cls.includes('shop-awning-header')) {
        return makeRect(cardX - 8, cardY - 32, cardW + 16, 92);
      }
      if (id === 'shop-grid') {
        return makeRect(cardX + 16, cardY + 64, cardW - 32, cardH - 126);
      }
      if (cls.includes('shop-item-card')) {
        const shopGrid = idRegistry.get('shop-grid');
        const sr = computeVNodeRect(shopGrid);
        const idx = shopGrid ? Math.max(0, shopGrid.children.indexOf(node)) : 0;
        const col = idx % 2, row = Math.floor(idx / 2);
        const gap = 12;
        const cw = (sr.width - gap) / 2;
        const ch = 124;
        const scrollTop = shopGrid ? (shopGrid.scrollTop || 0) : 0;
        return makeRect(sr.left + col * (cw + gap), sr.top + row * (ch + gap) - scrollTop, cw, ch);
      }
      if (cls.includes('shop-action-btn')) {
        const cr = computeVNodeRect(node.parentNode);
        return makeRect(cr.left + 14, cr.bottom - 34, cr.width - 28, 26);
      }
      if (id === 'shop-open-levels-btn') {
        return makeRect(cardX + 42, cardY + cardH - 50, cardW - 84, 38);
      }

      // 过关结算弹窗内部元素
      if (cls.includes('win-celebration-hero')) return makeRect(cardX + 20, cardY + 34, cardW - 40, 130);
      if (node.tagName === 'SVG' && node.parentNode && node.parentNode.classList.contains('win-trophy-wrap')) {
        return makeRect(cardX + cardW * 0.5 - 38, cardY + 84, 76, 72);
      }
      if (cls.includes('win-star-item')) {
        const sIdx = cls.includes('s1') ? 0 : (cls.includes('s2') ? 1 : 2);
        const sz = sIdx === 1 ? 44 : 34;
        const cx = cardX + cardW * 0.5 + (sIdx - 1) * 52;
        const cy = cardY + (sIdx === 1 ? 52 : 60);
        return makeRect(cx - sz * 0.5, cy - sz * 0.5, sz, sz);
      }
      if (cls.includes('win-scorecard')) return makeRect(cardX + 20, cardY + 174, cardW - 40, 64);
      if (id === 'score-praise-line') return makeRect(cardX + 20, cardY + 252, cardW - 40, 24);
      if (id === 'modal-restart-btn') return makeRect(cardX + 20, cardY + 290, (cardW - 52) * 0.5, 48);
      if (id === 'modal-next-btn') return makeRect(cardX + 20 + (cardW - 52) * 0.5 + 12, cardY + 290, (cardW - 52) * 0.5, 48);

      // 提速 / 刷新 / 步数耗尽弹窗内部元素
      if (cls.includes('pastel-sunburst-box')) return makeRect(cardX + 24, cardY + 38, cardW - 48, 168);
      if (id === 'speed-upgrade-confirm-btn') return makeRect(cardX + (cardW - 180) * 0.5, cardY + cardH + 16, 180, 52);
      if (id === 'refresh-confirm-btn') return makeRect(cardX + (cardW - 180) * 0.5, cardY + cardH - 68, 180, 50);
      if (id === 'oom-add-moves-btn') return makeRect(cardX + 24, cardY + cardH - 118, cardW - 48, 48);
      if (id === 'oom-restart-btn') return makeRect(cardX + 24, cardY + cardH - 60, cardW - 48, 44);

      // 解锁新玩法聚光灯庆典层
      if (cls.includes('mech-ribbon-header')) return makeRect(shellX + (shellW - 340) * 0.5, H * 0.14, 340, 108);
      if (cls.includes('mech-open-spotlight')) return makeRect(shellX + (shellW - 260) * 0.5, H * 0.28, 260, 250);
      if (id === 'mech-desc') return makeRect(shellX + 28, H * 0.66, shellW - 56, 54);
      if (id === 'mech-close-btn') return makeRect(shellX + 40, H * 0.76, shellW - 80, 36);

      return makeRect(0, 0, 0, 0);
    }

    const vBody = new VNode('body');
    vBody.setAttribute('data-theme', 'zen_amber');
    vBody.className = 'pure-canvas-mode';

    const vDoc = {
      body: vBody,
      documentElement: new VNode('html'),
      createElement(tag) {
        const t = String(tag).toLowerCase();
        if (t === 'canvas') {
          if (nativeApi && typeof nativeApi.createCanvas === 'function') {
            return wrapCanvasInstance(nativeApi.createCanvas());
          }
        }
        return new VNode(tag);
      },
      createElementNS(_ns, tag) {
        return new VNode(tag);
      },
      getElementById(id) {
        if (id === 'pure-game-canvas' && mainScreenCanvas) return mainScreenCanvas;
        if (id === 'bg-star-canvas') {
          if (!this._bgStarOffscreen) {
            this._bgStarOffscreen = (nativeApi && typeof nativeApi.createCanvas === 'function')
              ? wrapCanvasInstance(nativeApi.createCanvas())
              : wrapCanvasInstance({ width: 412, height: 892, getContext: () => null });
          }
          return this._bgStarOffscreen;
        }
        return idRegistry.get(id) || null;
      },
      querySelector(sel) {
        return vBody.querySelector(sel);
      },
      querySelectorAll(sel) {
        return vBody.querySelectorAll(sel);
      },
      addEventListener() {},
      removeEventListener() {}
    };

    const targets = [_g];
    if (typeof GameGlobal !== 'undefined' && GameGlobal && !targets.includes(GameGlobal)) targets.push(GameGlobal);
    if (typeof window !== 'undefined' && window && !targets.includes(window)) targets.push(window);
    if (typeof globalThis !== 'undefined' && globalThis && !targets.includes(globalThis)) targets.push(globalThis);
    targets.forEach(t => safeSetProp(t, 'document', vDoc));
    try { document = vDoc; } catch (e) {}
    parseMiniHTMLIntoParent("<canvas id=\"pure-game-canvas\"></canvas>\n  <!-- 全局共享 SVG <defs>（大幅缩减 DOM 体积 + 提供 3D 弹窗高光渐变） -->\n  <svg id=\"shared-svg-defs\" width=\"0\" height=\"0\" style=\"position:absolute;width:0;height:0;overflow:hidden;pointer-events:none\" aria-hidden=\"true\">\n    <defs id=\"global-bottle-defs\"></defs>\n    <defs id=\"global-ui-3d-defs\">\n      <!-- 100% 移植自用户 HTML 的原图级超椭圆玻璃按钮滤镜与材质渐变 -->\n      <filter id=\"btnDropShadow\" x=\"-20%\" y=\"-15%\" width=\"140%\" height=\"145%\">\n        <feDropShadow dx=\"0\" dy=\"5\" stdDeviation=\"4.5\" flood-color=\"#6e4414\" flood-opacity=\"0.34\"/>\n      </filter>\n      <filter id=\"rulesDropShadow\" x=\"-20%\" y=\"-15%\" width=\"140%\" height=\"145%\">\n        <feDropShadow dx=\"0\" dy=\"4\" stdDeviation=\"4\" flood-color=\"#3c4c34\" flood-opacity=\"0.34\"/>\n      </filter>\n      <filter id=\"iconShadow\" x=\"-25%\" y=\"-25%\" width=\"150%\" height=\"150%\">\n        <feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"1.6\" flood-color=\"#8c581c\" flood-opacity=\"0.42\"/>\n      </filter>\n      <filter id=\"bulbGlow\" x=\"-40%\" y=\"-40%\" width=\"180%\" height=\"180%\">\n        <feGaussianBlur stdDeviation=\"3.5\" result=\"blur\"/>\n        <feMerge>\n          <feMergeNode in=\"blur\"/>\n          <feMergeNode in=\"SourceGraphic\"/>\n        </feMerge>\n      </filter>\n      <linearGradient id=\"warmGlassBase\" x1=\"15%\" y1=\"5%\" x2=\"85%\" y2=\"95%\">\n        <stop offset=\"0%\" stop-color=\"#f7dfb8\" stop-opacity=\"0.48\"/>\n        <stop offset=\"38%\" stop-color=\"#dfad64\" stop-opacity=\"0.28\"/>\n        <stop offset=\"72%\" stop-color=\"#b87b31\" stop-opacity=\"0.40\"/>\n        <stop offset=\"100%\" stop-color=\"#d89d4e\" stop-opacity=\"0.50\"/>\n      </linearGradient>\n      <linearGradient id=\"hintGlassBase\" x1=\"15%\" y1=\"5%\" x2=\"85%\" y2=\"95%\">\n        <stop offset=\"0%\" stop-color=\"#ede2be\" stop-opacity=\"0.46\"/>\n        <stop offset=\"45%\" stop-color=\"#b69f62\" stop-opacity=\"0.30\"/>\n        <stop offset=\"80%\" stop-color=\"#877b48\" stop-opacity=\"0.40\"/>\n        <stop offset=\"100%\" stop-color=\"#a8995c\" stop-opacity=\"0.48\"/>\n      </linearGradient>\n      <linearGradient id=\"rulesGlassBase\" x1=\"15%\" y1=\"5%\" x2=\"85%\" y2=\"95%\">\n        <stop offset=\"0%\" stop-color=\"#e4efe2\" stop-opacity=\"0.48\"/>\n        <stop offset=\"45%\" stop-color=\"#9cb298\" stop-opacity=\"0.30\"/>\n        <stop offset=\"82%\" stop-color=\"#6b8368\" stop-opacity=\"0.40\"/>\n        <stop offset=\"100%\" stop-color=\"#8da387\" stop-opacity=\"0.50\"/>\n      </linearGradient>\n      <linearGradient id=\"topCrescentSheen\" x1=\"30%\" y1=\"0%\" x2=\"65%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#ffffff\" stop-opacity=\"0.64\"/>\n        <stop offset=\"45%\" stop-color=\"#fff6e4\" stop-opacity=\"0.30\"/>\n        <stop offset=\"100%\" stop-color=\"#ffffff\" stop-opacity=\"0.0\"/>\n      </linearGradient>\n      <radialGradient id=\"innerBottomShade\" cx=\"52%\" cy=\"68%\" r=\"48%\">\n        <stop offset=\"0%\" stop-color=\"#8a5216\" stop-opacity=\"0.26\"/>\n        <stop offset=\"65%\" stop-color=\"#9c6222\" stop-opacity=\"0.12\"/>\n        <stop offset=\"100%\" stop-color=\"#9c6222\" stop-opacity=\"0.0\"/>\n      </radialGradient>\n      <linearGradient id=\"glassRimStroke\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#ffffff\" stop-opacity=\"0.95\"/>\n        <stop offset=\"30%\" stop-color=\"#fff8eb\" stop-opacity=\"0.72\"/>\n        <stop offset=\"65%\" stop-color=\"#ffe7c2\" stop-opacity=\"0.42\"/>\n        <stop offset=\"100%\" stop-color=\"#ffffff\" stop-opacity=\"0.88\"/>\n      </linearGradient>\n      <radialGradient id=\"bulb3DGrad\" cx=\"36%\" cy=\"32%\" r=\"64%\">\n        <stop offset=\"0%\" stop-color=\"#ffffc8\"/>\n        <stop offset=\"32%\" stop-color=\"#ffea38\"/>\n        <stop offset=\"72%\" stop-color=\"#f7b718\"/>\n        <stop offset=\"100%\" stop-color=\"#d97f08\"/>\n      </radialGradient>\n      <linearGradient id=\"question3DGrad\" x1=\"25%\" y1=\"10%\" x2=\"75%\" y2=\"90%\">\n        <stop offset=\"0%\" stop-color=\"#ffffff\"/>\n        <stop offset=\"48%\" stop-color=\"#d4ecff\"/>\n        <stop offset=\"100%\" stop-color=\"#8ec0e4\"/>\n      </linearGradient>\n\n      <!-- 100% 复刻原图 image_55d85b 的 3D 粗麻布编织软垫纹理与立体体积光影定义 -->\n      <pattern id=\"burlapWeaveLightPat\" width=\"8\" height=\"8\" patternUnits=\"userSpaceOnUse\">\n        <rect width=\"8\" height=\"8\" fill=\"#8c6236\"/>\n        <!-- 经纬交错的饱满枕状粗麻线节 -->\n        <rect x=\"0.5\" y=\"0.6\" width=\"3.3\" height=\"2.9\" rx=\"1.1\" fill=\"#edd1a1\"/>\n        <rect x=\"0.9\" y=\"0.9\" width=\"2.4\" height=\"1.2\" rx=\"0.5\" fill=\"#fff0cf\" opacity=\"0.75\"/>\n        <rect x=\"4.4\" y=\"0.5\" width=\"2.9\" height=\"3.3\" rx=\"1.1\" fill=\"#d9b077\"/>\n        <rect x=\"4.8\" y=\"0.9\" width=\"1.3\" height=\"2.4\" rx=\"0.5\" fill=\"#f7dfb2\" opacity=\"0.65\"/>\n        <rect x=\"0.5\" y=\"4.4\" width=\"2.9\" height=\"3.3\" rx=\"1.1\" fill=\"#d6ac72\"/>\n        <rect x=\"0.9\" y=\"4.8\" width=\"1.3\" height=\"2.4\" rx=\"0.5\" fill=\"#f5dca8\" opacity=\"0.65\"/>\n        <rect x=\"4.5\" y=\"4.6\" width=\"3.3\" height=\"2.9\" rx=\"1.1\" fill=\"#e8c896\"/>\n        <rect x=\"4.9\" y=\"4.9\" width=\"2.4\" height=\"1.2\" rx=\"0.5\" fill=\"#ffeed0\" opacity=\"0.72\"/>\n      </pattern>\n      <pattern id=\"burlapWeaveDarkPat\" width=\"8\" height=\"8\" patternUnits=\"userSpaceOnUse\">\n        <rect width=\"8\" height=\"8\" fill=\"#362718\"/>\n        <rect x=\"0.5\" y=\"0.6\" width=\"3.3\" height=\"2.9\" rx=\"1.1\" fill=\"#7c6348\"/>\n        <rect x=\"0.9\" y=\"0.9\" width=\"2.4\" height=\"1.2\" rx=\"0.5\" fill=\"#9c8062\" opacity=\"0.65\"/>\n        <rect x=\"4.4\" y=\"0.5\" width=\"2.9\" height=\"3.3\" rx=\"1.1\" fill=\"#634d36\"/>\n        <rect x=\"0.5\" y=\"4.4\" width=\"2.9\" height=\"3.3\" rx=\"1.1\" fill=\"#5e4832\"/>\n        <rect x=\"4.5\" y=\"4.6\" width=\"3.3\" height=\"2.9\" rx=\"1.1\" fill=\"#755c42\"/>\n        <rect x=\"4.9\" y=\"4.9\" width=\"2.4\" height=\"1.2\" rx=\"0.5\" fill=\"#94785a\" opacity=\"0.6\"/>\n      </pattern>\n      <!-- 软垫顶面左上受光、右下暖褐的立体球面光影罩 -->\n      <linearGradient id=\"burlapTopShade\" x1=\"12%\" y1=\"8%\" x2=\"88%\" y2=\"92%\">\n        <stop offset=\"0%\" stop-color=\"#fff8e6\" stop-opacity=\"0.38\"/>\n        <stop offset=\"45%\" stop-color=\"#d49e5c\" stop-opacity=\"0.06\"/>\n        <stop offset=\"82%\" stop-color=\"#5c3b18\" stop-opacity=\"0.36\"/>\n        <stop offset=\"100%\" stop-color=\"#38220c\" stop-opacity=\"0.58\"/>\n      </linearGradient>\n      <!-- 软垫厚实侧面：原图标志性的上亮金棕、下深巧克力的体积过渡 -->\n      <linearGradient id=\"burlapSideWallLight\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#c4945a\"/>\n        <stop offset=\"38%\" stop-color=\"#8c6032\"/>\n        <stop offset=\"78%\" stop-color=\"#543618\"/>\n        <stop offset=\"100%\" stop-color=\"#331f0c\"/>\n      </linearGradient>\n      <linearGradient id=\"burlapSideWallDark\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#69523a\"/>\n        <stop offset=\"42%\" stop-color=\"#473524\"/>\n        <stop offset=\"82%\" stop-color=\"#2b1f14\"/>\n        <stop offset=\"100%\" stop-color=\"#1a110a\"/>\n      </linearGradient>\n      <!-- 原图浮空麻布块下方的暖赤陶橘色柔和投影 -->\n      <radialGradient id=\"terracottaShadowGrad\" cx=\"50%\" cy=\"50%\" r=\"50%\">\n        <stop offset=\"0%\" stop-color=\"rgba(148, 62, 14, 0.62)\"/>\n        <stop offset=\"48%\" stop-color=\"rgba(168, 78, 20, 0.36)\"/>\n        <stop offset=\"78%\" stop-color=\"rgba(185, 92, 28, 0.12)\"/>\n        <stop offset=\"100%\" stop-color=\"rgba(185, 92, 28, 0.0)\"/>\n      </radialGradient>\n      <!-- 瓶底与麻布软垫接触处的暖琥珀柔和遮蔽影（杜绝空瓶底部发灰发脏） -->\n      <radialGradient id=\"burlapContactAOGrad\" cx=\"50%\" cy=\"50%\" r=\"50%\">\n        <stop offset=\"0%\" stop-color=\"rgba(98, 52, 12, 0.42)\"/>\n        <stop offset=\"60%\" stop-color=\"rgba(115, 62, 16, 0.18)\"/>\n        <stop offset=\"100%\" stop-color=\"rgba(115, 62, 16, 0.0)\"/>\n      </radialGradient>\n      <!-- 3D 黄色旋转箭头（顶面高光渐变 + 底部温暖琥珀3D立体厚度渐变，完全复刻参考图） -->\n      <linearGradient id=\"arrowYellowTop3D\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#fff978\"/>\n        <stop offset=\"45%\" stop-color=\"#ffdd14\"/>\n        <stop offset=\"100%\" stop-color=\"#f5a600\"/>\n      </linearGradient>\n      <linearGradient id=\"arrowYellowSide3D\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#e68a00\"/>\n        <stop offset=\"100%\" stop-color=\"#b85d00\"/>\n      </linearGradient>\n      <!-- 3D 玫粉旋转箭头（顶面高光渐变 + 底部深玫红3D立体厚度渐变，完全复刻参考图） -->\n      <linearGradient id=\"arrowPinkTop3D\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#ff99d6\"/>\n        <stop offset=\"45%\" stop-color=\"#ff4da6\"/>\n        <stop offset=\"100%\" stop-color=\"#e01972\"/>\n      </linearGradient>\n      <linearGradient id=\"arrowPinkSide3D\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#c91464\"/>\n        <stop offset=\"100%\" stop-color=\"#8f0843\"/>\n      </linearGradient>\n      <!-- 3D 速度升级小黄人全身球面立体光影 -->\n      <radialGradient id=\"mascotHead3D\" cx=\"35%\" cy=\"28%\" r=\"72%\">\n        <stop offset=\"0%\" stop-color=\"#fffb9e\"/>\n        <stop offset=\"36%\" stop-color=\"#ffe119\"/>\n        <stop offset=\"78%\" stop-color=\"#f5a600\"/>\n        <stop offset=\"100%\" stop-color=\"#c27400\"/>\n      </radialGradient>\n      <radialGradient id=\"mascotTorso3D\" cx=\"38%\" cy=\"30%\" r=\"70%\">\n        <stop offset=\"0%\" stop-color=\"#fff580\"/>\n        <stop offset=\"45%\" stop-color=\"#ffd60a\"/>\n        <stop offset=\"85%\" stop-color=\"#e09000\"/>\n        <stop offset=\"100%\" stop-color=\"#ad6200\"/>\n      </radialGradient>\n      <linearGradient id=\"mascotLimb3D\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#fff275\"/>\n        <stop offset=\"50%\" stop-color=\"#ffd000\"/>\n        <stop offset=\"100%\" stop-color=\"#bf6e00\"/>\n      </linearGradient>\n      <filter id=\"ui3dDropShadow\" x=\"-20%\" y=\"-15%\" width=\"140%\" height=\"145%\">\n        <feDropShadow dx=\"0\" dy=\"6\" stdDeviation=\"4.5\" flood-color=\"#2c1654\" flood-opacity=\"0.28\"/>\n      </filter>\n    \n      <linearGradient id=\"funnelGoldGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#fffbeb\"/>\n        <stop offset=\"35%\" stop-color=\"#fde047\"/>\n        <stop offset=\"75%\" stop-color=\"#eab308\"/>\n        <stop offset=\"100%\" stop-color=\"#a16207\"/>\n      </linearGradient>\n      <linearGradient id=\"ancientSpoutGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\">\n        <stop offset=\"0%\" stop-color=\"#78350f\"/>\n        <stop offset=\"30%\" stop-color=\"#f59e0b\"/>\n        <stop offset=\"65%\" stop-color=\"#fef08a\"/>\n        <stop offset=\"100%\" stop-color=\"#92400e\"/>\n      </linearGradient>\n      <linearGradient id=\"bombGoldBadgeGrad\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#fef08a\"/>\n        <stop offset=\"50%\" stop-color=\"#f59e0b\"/>\n        <stop offset=\"100%\" stop-color=\"#b45309\"/>\n      </linearGradient>\n      <linearGradient id=\"bombRedBadgeGrad\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#fda4af\"/>\n        <stop offset=\"45%\" stop-color=\"#f43f5e\"/>\n        <stop offset=\"100%\" stop-color=\"#9f1239\"/>\n      </linearGradient>\n    </defs>\n  </svg>\n  <div class=\"ambient-glow\"></div>\n  <!-- 2D 顶层动态魔法星光粒子流与飞星特效画布（100%提取自参考图实现 HTML #fx-canvas） -->\n  <canvas id=\"bg-star-canvas\"></canvas>\n\n  <div class=\"app-shell\">\n    <!-- 1. 原图级高定顶部栏（左上超椭圆玻璃菜单 + 中央关卡与步数 + 右上超椭圆玻璃规则） -->\n    <div class=\"top-bar\">\n      <!-- 左上：100%复刻原图超椭圆暖色玻璃【设置】按钮 -->\n      <div class=\"frosted-top-action\" id=\"settings-btn\" title=\"打开设置与菜单\">\n        <svg class=\"svg-btn-top\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#btnDropShadow)\">\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#warmGlassBase)\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#innerBottomShade)\" />\n            <path d=\"M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.65\" />\n            <path d=\"M 20,86 C 30,90.5 68,90.5 80,85\" stroke=\"#fff3d6\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\"0.48\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.5\" />\n          </g>\n          <g filter=\"url(#iconShadow)\">\n            <rect x=\"30\" y=\"31\" width=\"40\" height=\"7.6\" rx=\"3.8\" fill=\"#ffffff\"/>\n            <rect x=\"30\" y=\"46.2\" width=\"40\" height=\"7.6\" rx=\"3.8\" fill=\"#ffffff\"/>\n            <rect x=\"30\" y=\"61.4\" width=\"40\" height=\"7.6\" rx=\"3.8\" fill=\"#ffffff\"/>\n          </g>\n        </svg>\n        <span class=\"frosted-top-label\">设置</span>\n      </div>\n\n      <!-- 居中：上方「第 X 关」 + 下方动态进度/剩余步数副标题（点击打开200关选单） -->\n      <div class=\"top-center-group\" id=\"top-center-level-trigger\" title=\"点击打开200关选单\">\n        <div class=\"zen-big-num-wrap\" id=\"zen-big-num-wrap\">\n          <div class=\"zen-big-num\" id=\"zen-header-big-num\">第 1 关</div>\n        </div>\n        <div class=\"level-pill\" id=\"level-pill-title\">已封存 0/7</div>\n      </div>\n\n      <!-- 右上：100%复刻原图超椭圆冷绿折射玻璃【规则】按钮 -->\n      <div class=\"frosted-top-action\" id=\"rules-help-btn\" title=\"查看游戏规则\">\n        <svg class=\"svg-btn-top\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#rulesDropShadow)\">\n            <path d=\"M 50,5 C 83,5 95,17 95,50 C 95,83 83,95 50,95 C 17,95 5,83 5,50 C 5,17 17,5 50,5 Z\" fill=\"url(#rulesGlassBase)\" />\n            <path d=\"M 50,7 C 78,7 89,16 91,38 C 74,47 36,38 9,42 C 11,17 22,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 16,32 C 18,16 30,10 50,10 C 66,10 77,14 82,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.65\" />\n            <path d=\"M 50,5 C 83,5 95,17 95,50 C 95,83 83,95 50,95 C 17,95 5,83 5,50 C 5,17 17,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.4\" />\n          </g>\n          <g filter=\"url(#iconShadow)\">\n            <path d=\"M 38.5,35.5 C 38.5,27.5 44.5,23 52,23 C 59.5,23 65.5,27.8 65.5,35 C 65.5,40.5 62,43.8 57.2,46.8 C 53.8,48.9 52.5,51.2 52.5,55.5\"\n                  stroke=\"url(#question3DGrad)\" stroke-width=\"8.5\" stroke-linecap=\"round\" fill=\"none\"/>\n            <circle cx=\"52.2\" cy=\"70.5\" r=\"5.2\" fill=\"url(#question3DGrad)\"/>\n          </g>\n        </svg>\n        <span class=\"frosted-top-label\">规则</span>\n      </div>\n    </div>\n\n    <!-- 2A. 礼盒打包模式专属：顶部 4 个高精 3D 礼盒袋 -->\n    <div class=\"bags-stage\" id=\"bags-stage\"></div>\n\n    <!-- 2B. 特殊BOSS或限步提示栏（常规关卡自动隐藏，保持参考图极简呼吸感） -->\n    <div class=\"mode-banner\" id=\"mode-banner\">\n      <div class=\"mode-banner-left\">\n        <span id=\"mode-banner-text\">🎯 将同色水归类装满</span>\n        <span class=\"mode-banner-tag\" id=\"mode-banner-progress\">完成 0/7</span>\n      </div>\n      <div class=\"moves-counter-pill\" id=\"moves-counter-pill\">\n        <svg class=\"alarm-clock-svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\">\n          <circle cx=\"12\" cy=\"13\" r=\"7.8\" fill=\"#ffffff\" stroke=\"#c2410c\" stroke-width=\"1.8\"/>\n          <polyline points=\"12,9.0 12,13 15,14.5\" stroke=\"#ea580c\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n          <path d=\"M4.5,4.5 L7.5,7\" stroke=\"#fbbf24\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>\n          <path d=\"M19.5,4.5 L16.5,7\" stroke=\"#fbbf24\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>\n          <circle cx=\"12\" cy=\"13\" r=\"1.6\" fill=\"#ea580c\"/>\n        </svg>\n        <span class=\"moves-label\">步数</span>\n        <span class=\"moves-num\" id=\"moves-left-num\">15</span>\n      </div>\n    </div>\n\n    <!-- 3. 中央自适应 2.5D 瓶子舞台 -->\n    <div class=\"bottles-stage\" id=\"bottles-stage\">\n      <div class=\"bottles-grid\" id=\"bottles-grid\"></div>\n    </div>\n\n    <!-- 4. 底部 4 枚 100% 原图质感超椭圆 SVG 玻璃按钮（重玩 / 打乱 / 撤回 / 提示） -->\n    <div class=\"bottom-dock-wrap\">\n      <!-- 按钮 1：重玩（100%复刻原图 Restart 环形圆角三角箭头） -->\n      <div class=\"medallion-btn\" id=\"dock-restart-btn\" title=\"重新开始本关\">\n        <svg class=\"svg-btn-bottom\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#btnDropShadow)\">\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#warmGlassBase)\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#innerBottomShade)\" />\n            <path d=\"M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.62\" />\n            <path d=\"M 20,86 C 30,90.5 68,90.5 80,85\" stroke=\"#fff3d6\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\"0.48\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.5\" />\n          </g>\n          <g filter=\"url(#iconShadow)\">\n            <path d=\"M 41,34.5 A 18.5,18.5 0 1 1 32.5,56.5\" stroke=\"#ffffff\" stroke-width=\"7.2\" stroke-linecap=\"round\" fill=\"none\"/>\n            <path d=\"M 47.5,24.5 L 46.5,43.5 C 46.4,45.2 44.5,46.0 43.1,45.0 L 30.8,35.8 C 29.4,34.8 29.8,32.6 31.4,32.0 L 44.8,23.2 C 46.2,22.4 47.6,23.2 47.5,24.5 Z\" fill=\"#ffffff\"/>\n          </g>\n        </svg>\n        <span class=\"medallion-label\">重玩</span>\n      </div>\n\n      <!-- 按钮 2：打乱（超椭圆玻璃 + 双箭头交叉洗牌图标） -->\n      <div class=\"medallion-btn\" id=\"shuffle-btn\" title=\"打乱重排场上剩余水（总数不变）\">\n        <svg class=\"svg-btn-bottom\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#btnDropShadow)\">\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#warmGlassBase)\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#innerBottomShade)\" />\n            <path d=\"M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.62\" />\n            <path d=\"M 20,86 C 30,90.5 68,90.5 80,85\" stroke=\"#fff3d6\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\"0.48\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.5\" />\n          </g>\n          <g filter=\"url(#iconShadow)\">\n            <path d=\"M 24,64 H 33 C 41,64 46,59 51,48 C 56,37 61,33 69,33 H 76\" stroke=\"#ffffff\" stroke-width=\"6.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n            <path d=\"M 67,24 L 78,33 L 67,42\" stroke=\"#ffffff\" stroke-width=\"6.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n            <path d=\"M 24,33 H 33 C 38,33 42,35.5 45.5,41\" stroke=\"#ffffff\" stroke-width=\"6.8\" stroke-linecap=\"round\"/>\n            <path d=\"M 56.5,56.5 C 60,61.5 64,64 69,64 H 76\" stroke=\"#ffffff\" stroke-width=\"6.8\" stroke-linecap=\"round\"/>\n            <path d=\"M 67,55 L 78,64 L 67,73\" stroke=\"#ffffff\" stroke-width=\"6.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n          </g>\n        </svg>\n        <div class=\"medallion-badge\" id=\"shuffle-count\">3</div>\n        <span class=\"medallion-label\">打乱</span>\n      </div>\n\n      <!-- 按钮 3：撤回（100%复刻原图 Undo 流线型左弯实心箭头） -->\n      <div class=\"medallion-btn\" id=\"undo-btn\" title=\"撤回上一步\">\n        <svg class=\"svg-btn-bottom\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#btnDropShadow)\">\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#warmGlassBase)\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#innerBottomShade)\" />\n            <path d=\"M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.62\" />\n            <path d=\"M 20,86 C 30,90.5 68,90.5 80,85\" stroke=\"#fff3d6\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\"0.48\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.5\" />\n          </g>\n          <g filter=\"url(#iconShadow)\">\n            <path d=\"M 44,31 L 25.5,48.5 C 24.0,50.0 24.3,52.4 26.2,53.3 L 45.5,61.5 C 47.4,62.3 49.3,60.6 48.8,58.6 L 47.0,52.2 C 58.2,51.0 66.8,54.8 72.5,62.2 C 73.5,63.5 75.5,62.5 75.2,60.8 C 72.8,44.2 61.2,36.8 46.8,38.2 L 48.0,32.8 C 48.4,30.8 45.6,29.5 44,31 Z\" fill=\"#ffffff\"/>\n          </g>\n        </svg>\n        <div class=\"medallion-badge\" id=\"undo-count-badge\">5</div>\n        <span class=\"medallion-label\">撤回</span>\n      </div>\n\n      <!-- 按钮 4：提示（100%复刻原图 Hint 10道放射金芒与 3D 球体发光灯泡） -->\n      <div class=\"medallion-btn\" id=\"hint-btn\" title=\"智能提示下一步最优倒法\">\n        <svg class=\"svg-btn-bottom\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#btnDropShadow)\">\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#hintGlassBase)\" />\n            <path d=\"M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.62\" />\n            <path d=\"M 20,86 C 30,90.5 68,90.5 80,85\" stroke=\"#fff3d6\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\"0.45\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.5\" />\n          </g>\n          <g stroke=\"#ffe866\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.92\">\n            <line x1=\"50\" y1=\"13\" x2=\"50\" y2=\"20\"/>\n            <line x1=\"33\" y1=\"17.5\" x2=\"36.8\" y2=\"23.5\"/>\n            <line x1=\"67\" y1=\"17.5\" x2=\"63.2\" y2=\"23.5\"/>\n            <line x1=\"21\" y1=\"29\" x2=\"27\" y2=\"32.5\"/>\n            <line x1=\"79\" y1=\"29\" x2=\"73\" y2=\"32.5\"/>\n            <line x1=\"17\" y1=\"44.5\" x2=\"24\" y2=\"44.5\"/>\n            <line x1=\"83\" y1=\"44.5\" x2=\"76\" y2=\"44.5\"/>\n            <line x1=\"22\" y1=\"59.5\" x2=\"28\" y2=\"56\"/>\n            <line x1=\"78\" y1=\"59.5\" x2=\"72\" y2=\"56\"/>\n          </g>\n          <g filter=\"url(#bulbGlow)\">\n            <path d=\"M 50,24 C 38.2,24 29,33.0 29,44.2 C 29,51.4 33.0,57.6 38.8,61.2 C 40.8,62.5 42.0,64.6 42.2,67.0 L 57.8,67.0 C 58.0,64.6 59.2,62.5 61.2,61.2 C 67.0,57.6 71,51.4 71,44.2 C 71,33.0 61.8,24 50,24 Z\" fill=\"url(#bulb3DGrad)\"/>\n            <ellipse cx=\"42\" cy=\"36\" rx=\"6.5\" ry=\"4.2\" transform=\"rotate(-28 42 36)\" fill=\"#ffffff\" opacity=\"0.55\"/>\n          </g>\n          <rect x=\"42.2\" y=\"67.2\" width=\"15.6\" height=\"4.8\" rx=\"2.2\" fill=\"#6f7b88\"/>\n          <rect x=\"43.4\" y=\"72.0\" width=\"13.2\" height=\"4.5\" rx=\"2.0\" fill=\"#596573\"/>\n          <path d=\"M 45.5,76.5 C 46.2,79.8 47.8,81.5 50,81.5 C 52.2,81.5 53.8,79.8 54.5,76.5 Z\" fill=\"#424c58\"/>\n        </svg>\n        <div class=\"medallion-badge\" id=\"hint-count\">3</div>\n        <span class=\"medallion-label\">提示</span>\n      </div>\n\n      <!-- 按钮 5：+空瓶（功能恒定透明：优先解锁紫晶广告空瓶，否则新增1个4层空瓶槽位） -->\n      <div class=\"medallion-btn\" id=\"add-bottle-btn\" title=\"解锁或新增 1 个空瓶槽位\">\n        <div class=\"medallion-badge\" id=\"add-bottle-count\">2</div>\n        <span class=\"medallion-label\">+空瓶</span>\n      </div>\n    </div>\n  </div>\n\n  <!-- 全屏流体与星尘光效层 -->\n  <svg id=\"fx-overlay\"></svg>\n  <div class=\"toast-msg\" id=\"toast-msg\"></div>\n\n  <!-- ==================== 弹窗 A：暂停设置面板（完全复刻参考图5 3D高光版） ==================== -->\n  <div class=\"modal-mask\" id=\"pause-modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\">设置</div>\n      <div class=\"casual-close-btn\" id=\"pause-close-btn\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n\n      <div class=\"pause-setting-row\">\n        <div class=\"pause-setting-left\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#ffffff\" stroke=\"#31659c\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\" fill=\"#ffffff\"/>\n            <path d=\"M15.54 8.46a5 5 0 0 1 0 7.07\" fill=\"none\"/>\n            <path d=\"M19.07 4.93a10 10 0 0 1 0 14.14\" fill=\"none\"/>\n          </svg>\n          <span>声音</span>\n        </div>\n        <div class=\"casual-toggle on\" id=\"toggle-sound\" data-key=\"sound\">\n          <span class=\"casual-toggle-check\">✔</span>\n          <div class=\"casual-toggle-knob\"></div>\n        </div>\n      </div>\n\n      <div class=\"pause-setting-row\">\n        <div class=\"pause-setting-left\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#ffffff\" stroke=\"#31659c\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <rect x=\"7\" y=\"4\" width=\"10\" height=\"16\" rx=\"2\" fill=\"#ffffff\"/>\n            <path d=\"M3 8l2 2-2 2 2 2-2 2\" fill=\"none\"/>\n            <path d=\"M21 8l-2 2 2 2-2 2 2 2\" fill=\"none\"/>\n          </svg>\n          <span>震动</span>\n        </div>\n        <div class=\"casual-toggle on\" id=\"toggle-vibrate\" data-key=\"vibrate\">\n          <span class=\"casual-toggle-check\">✔</span>\n          <div class=\"casual-toggle-knob\"></div>\n        </div>\n      </div>\n\n      <div class=\"pause-setting-row\">\n        <div class=\"pause-setting-left\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#ffffff\" stroke=\"#31659c\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <path d=\"M9 18V5l12-2v13\" fill=\"none\"/>\n            <circle cx=\"6\" cy=\"18\" r=\"3\" fill=\"#ffffff\"/>\n            <circle cx=\"18\" cy=\"16\" r=\"3\" fill=\"#ffffff\"/>\n          </svg>\n          <span>音乐</span>\n        </div>\n        <div class=\"casual-toggle on\" id=\"toggle-music\" data-key=\"music\">\n          <span class=\"casual-toggle-check\">✔</span>\n          <div class=\"casual-toggle-knob\"></div>\n        </div>\n      </div>\n\n      <div class=\"pause-setting-row\" style=\"margin-bottom:10px;\">\n        <div class=\"pause-setting-left\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#31659c\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <polyline points=\"15 3 21 3 21 9\"/>\n            <polyline points=\"9 21 3 21 3 15\"/>\n            <line x1=\"21\" y1=\"3\" x2=\"14\" y2=\"10\"/>\n            <line x1=\"3\" y1=\"21\" x2=\"10\" y2=\"14\"/>\n          </svg>\n          <span>缩放</span>\n        </div>\n        <div class=\"casual-toggle on\" id=\"toggle-zoom\" data-key=\"zoom\">\n          <span class=\"casual-toggle-check\">✔</span>\n          <div class=\"casual-toggle-knob\"></div>\n        </div>\n      </div>\n\n      <!-- 速度x2、提速升级、主题商店、一键破局 快捷入口（整合于设置面板中） -->\n      <div class=\"pause-feature-bar\">\n        <div class=\"pause-feature-btn\" id=\"speed-x2-btn\" title=\"切换2倍倒水速度\">\n          <div class=\"pause-feature-icon\">\n            <svg width=\"20\" height=\"15\" viewBox=\"0 0 24 18\" fill=\"#8c5820\">\n              <polygon points=\"2,2 12,9 2,16\"/>\n              <polygon points=\"12,2 22,9 12,16\"/>\n            </svg>\n          </div>\n          <span class=\"pause-feature-label\" id=\"speed-x2-label\">速度x2</span>\n        </div>\n\n        <div class=\"pause-feature-btn\" id=\"upgrade-open-btn\" title=\"打开速度升级面板\">\n          <div class=\"pause-feature-icon\">\n            <svg width=\"20\" height=\"20\" viewBox=\"0 0 36 36\">\n              <path d=\"M18,5 L28,17 L22,17 L22,30 L14,30 L14,17 L8,17 Z\" fill=\"#e5a344\" stroke=\"#7c4a12\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n            </svg>\n          </div>\n          <span class=\"pause-feature-label\">提速</span>\n        </div>\n\n        <div class=\"pause-feature-btn\" id=\"shop-open-btn\" title=\"打开主题商店\">\n          <div class=\"pause-feature-icon\">\n            <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#7c4a12\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n              <circle cx=\"12\" cy=\"12\" r=\"9\" fill=\"#f7df94\"/>\n              <circle cx=\"9\" cy=\"10\" r=\"1.5\" fill=\"#c87816\" stroke=\"none\"/>\n              <circle cx=\"15\" cy=\"10\" r=\"1.5\" fill=\"#6d8c3e\" stroke=\"none\"/>\n              <circle cx=\"12\" cy=\"15\" r=\"1.5\" fill=\"#b8582d\" stroke=\"none\"/>\n            </svg>\n          </div>\n          <span class=\"pause-feature-label\">主题</span>\n        </div>\n\n        <div class=\"pause-feature-btn\" id=\"quick-unlock-btn\" title=\"一键解锁当前关所有机关\">\n          <div class=\"pause-feature-icon\">\n            <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\">\n              <path d=\"M12 3L14.4 9.2L21 9.8L16 14.2L17.5 20.8L12 17.3L6.5 20.8L8 14.2L3 9.8L9.6 9.2L12 3Z\"\n                    fill=\"#f5b942\" stroke=\"#7c4a12\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n            </svg>\n          </div>\n          <span class=\"pause-feature-label\">破局</span>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"pause-bottom-actions\">\n      <div class=\"pause-mid-row\">\n        <div class=\"casual-square-btn yellow\" id=\"pause-home-btn\" title=\"打开200关选单\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#ffffff\" style=\"filter:drop-shadow(0 2px 0 #8f5200);\"><path d=\"M12 3L3 10h3v10h12V10h3L12 3z\"/></svg>\n          <span>主页</span>\n        </div>\n        <button class=\"casual-green-btn\" id=\"pause-restart-btn\">重新开始</button>\n        <div class=\"casual-square-btn pink\" id=\"pause-skip-btn\" title=\"跳至下一关\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#ffffff\" style=\"filter:drop-shadow(0 2px 0 #7a0932);\"><polygon points=\"5,4 15,12 5,20\"/><rect x=\"16\" y=\"4\" width=\"3.5\" height=\"16\" rx=\"1\"/></svg>\n          <span>跳过</span>\n        </div>\n      </div>\n      <button class=\"casual-cyan-btn\" id=\"pause-resume-btn\">继续游戏</button>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 B：速度升级面板（100%复刻参考图1 3D立体小黄人、发光星芒与果冻按钮） ==================== -->\n  <div class=\"modal-mask\" id=\"speed-modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\">速度升级</div>\n      <div class=\"casual-close-btn\" id=\"speed-close-btn\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n\n      <div class=\"pastel-sunburst-box\">\n        <div class=\"pastel-sunburst-rays\"></div>\n        <div class=\"pastel-sunburst-content\">\n          <svg width=\"122\" height=\"138\" viewBox=\"0 0 120 136\" filter=\"url(#ui3dDropShadow)\">\n            <!-- 四角白星芒 -->\n            <path d=\"M14,74 L18,65 L22,74 L31,78 L22,82 L18,91 L14,82 L5,78 Z\" fill=\"#ffffff\"/>\n            <path d=\"M96,46 L100,37 L104,46 L113,50 L104,54 L100,63 L96,54 L87,50 Z\" fill=\"#ffffff\"/>\n            <!-- 脚底 3D 柔和阴影 -->\n            <ellipse cx=\"60\" cy=\"125\" rx=\"28\" ry=\"6.5\" fill=\"rgba(45, 55, 95, 0.24)\"/>\n            <!-- 左右 3D 立体手臂（带琥珀暗部、黑色粗描边与亮白高光点） -->\n            <ellipse cx=\"30\" cy=\"84\" rx=\"9\" ry=\"15\" transform=\"rotate(28, 30, 84)\" fill=\"url(#mascotLimb3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <ellipse cx=\"26\" cy=\"82\" rx=\"3.2\" ry=\"6.5\" transform=\"rotate(28, 26, 82)\" fill=\"rgba(255,255,255,0.65)\"/>\n            <ellipse cx=\"90\" cy=\"84\" rx=\"9\" ry=\"15\" transform=\"rotate(-28, 90, 84)\" fill=\"url(#mascotLimb3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <ellipse cx=\"94\" cy=\"82\" rx=\"3.2\" ry=\"6.5\" transform=\"rotate(-28, 94, 82)\" fill=\"rgba(255,255,255,0.65)\"/>\n            <!-- 双腿与立体圆脚掌 -->\n            <rect x=\"41\" y=\"96\" width=\"15.5\" height=\"22\" rx=\"7\" fill=\"url(#mascotLimb3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <rect x=\"63.5\" y=\"96\" width=\"15.5\" height=\"22\" rx=\"7\" fill=\"url(#mascotLimb3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <ellipse cx=\"48\" cy=\"118\" rx=\"10\" ry=\"6\" fill=\"url(#mascotHead3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <ellipse cx=\"46\" cy=\"116.5\" rx=\"4.5\" ry=\"2\" fill=\"rgba(255,255,255,0.75)\"/>\n            <ellipse cx=\"72\" cy=\"118\" rx=\"10\" ry=\"6\" fill=\"url(#mascotHead3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <ellipse cx=\"74\" cy=\"116.5\" rx=\"4.5\" ry=\"2\" fill=\"rgba(255,255,255,0.75)\"/>\n            <!-- 3D 圆润躯干 + 颈部投影与肚皮高光 -->\n            <rect x=\"37\" y=\"66\" width=\"46\" height=\"37\" rx=\"17\" fill=\"url(#mascotTorso3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <path d=\"M40,70 Q60,77 80,70\" fill=\"none\" stroke=\"rgba(165, 90, 0, 0.45)\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n            <ellipse cx=\"55\" cy=\"84\" rx=\"12\" ry=\"9\" fill=\"rgba(255, 255, 210, 0.45)\"/>\n            <!-- 3D 方圆大头（带底侧琥珀体积暗面、顶面与右侧高光弧线） -->\n            <rect x=\"25\" y=\"16\" width=\"70\" height=\"56\" rx=\"18\" fill=\"url(#mascotHead3D)\" stroke=\"#231600\" stroke-width=\"3.0\"/>\n            <!-- 下颌 3D 体积暗影 -->\n            <path d=\"M29,58 Q60,70 91,58 L91,63 Q60,73 29,63 Z\" fill=\"rgba(175, 95, 0, 0.35)\"/>\n            <!-- 头顶与右侧亮白 3D 高光弧（完全对标参考图1小黄人脑门与右脸高光） -->\n            <path d=\"M35,22.5 Q60,19.5 84,23.5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"4.2\" stroke-linecap=\"round\" opacity=\"0.92\"/>\n            <path d=\"M88,28 Q91,42 88.5,56\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3.6\" stroke-linecap=\"round\" opacity=\"0.82\"/>\n            <!-- 弯月笑眼 -->\n            <path d=\"M40,45 Q46.5,36 53,45\" fill=\"none\" stroke=\"#231600\" stroke-width=\"4.6\" stroke-linecap=\"round\"/>\n            <path d=\"M67,45 Q73.5,36 80,45\" fill=\"none\" stroke=\"#231600\" stroke-width=\"4.6\" stroke-linecap=\"round\"/>\n          </svg>\n        </div>\n      </div>\n\n      <div class=\"speed-level-title\">等级: <span id=\"speed-lv-num\">0</span></div>\n      <div class=\"speed-prog-bar\">\n        <div class=\"speed-prog-fill\" id=\"speed-prog-fill\" style=\"width: 0%;\"></div>\n        <span class=\"speed-prog-txt\" id=\"speed-prog-txt\">升级进度: 0%</span>\n      </div>\n      <div class=\"speed-cur-line\">当前速度: <b id=\"speed-pts-num\">10</b> 点</div>\n      <div class=\"speed-foot-tip\">每次升级+1点速度</div>\n    </div>\n\n    <div style=\"margin-top: 18px;\">\n      <button class=\"casual-green-btn\" id=\"speed-upgrade-confirm-btn\">\n        <svg width=\"28\" height=\"20\" viewBox=\"0 0 28 20\" fill=\"#ffffff\">\n          <rect x=\"1\" y=\"2\" width=\"18\" height=\"16\" rx=\"4\"/>\n          <polygon points=\"19,7 27,3 27,17 19,13\" stroke-linejoin=\"round\"/>\n          <polygon points=\"8,6.5 8,13.5 14,10\" fill=\"#2e8500\"/>\n        </svg>\n        <span>升级</span>\n      </button>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 C：刷新/提示获得面板（100%复刻参考图3 厚立体双色旋转箭头 + 3D果冻按钮） ==================== -->\n  <div class=\"modal-mask\" id=\"refresh-modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\">刷新</div>\n      <div class=\"casual-close-btn\" id=\"refresh-close-btn\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n\n      <div class=\"pastel-sunburst-box\" style=\"height: 174px;\">\n        <div class=\"pastel-sunburst-rays\"></div>\n        <div class=\"pastel-sunburst-content\">\n          <svg width=\"136\" height=\"136\" viewBox=\"0 0 128 128\" filter=\"url(#ui3dDropShadow)\">\n            <!-- 左右四角白星芒 -->\n            <path d=\"M18,76 L21.5,67 L25,76 L34,79.5 L25,83 L21.5,92 L18,83 L9,79.5 Z\" fill=\"#ffffff\"/>\n            <path d=\"M103,44 L106.5,35 L110,44 L119,47.5 L110,51 L106.5,60 L103,51 L94,47.5 Z\" fill=\"#ffffff\"/>\n\n            <!-- 上方 3D 圆胖果冻黄箭头（细棕外轮廓 + 饱满琥珀3D下沿 + 亮黄圆润主体 + 白色弧形高光） -->\n            <g>\n              <path d=\"M25,57 C25,27 53,14 78,24 L83,14 Q86,9 90,15 L103,39 Q106,45 99,47 L71,53 Q64,54 68,48 L72,40 C55,34 44,42 44,57 Q44,61 39,61 L30,61 Q25,61 25,57 Z\"\n                    fill=\"url(#arrowYellowSide3D)\" stroke=\"#633606\" stroke-width=\"4.2\" stroke-linejoin=\"round\" transform=\"translate(0, 4.5)\"/>\n              <path d=\"M25,57 C25,27 53,14 78,24 L83,14 Q86,9 90,15 L103,39 Q106,45 99,47 L71,53 Q64,54 68,48 L72,40 C55,34 44,42 44,57 Q44,61 39,61 L30,61 Q25,61 25,57 Z\"\n                    fill=\"url(#arrowYellowTop3D)\" stroke=\"#633606\" stroke-width=\"2.4\" stroke-linejoin=\"round\"/>\n              <!-- 顶部亮白果冻高光弧线 -->\n              <path d=\"M31,49 C35,31 53,21 75,27\" fill=\"none\" stroke=\"#fffde0\" stroke-width=\"4.8\" stroke-linecap=\"round\" opacity=\"0.92\"/>\n              <circle cx=\"29.5\" cy=\"55\" r=\"2.2\" fill=\"#fffde0\" opacity=\"0.92\"/>\n            </g>\n\n            <!-- 下方 3D 圆胖果冻粉箭头（细紫红外轮廓 + 饱满深粉3D下沿 + 樱粉圆润主体 + 粉白弧形高光） -->\n            <g>\n              <path d=\"M103,71 C103,101 75,114 50,104 L45,114 Q42,119 38,113 L25,89 Q22,83 29,81 L57,75 Q64,74 60,80 L56,88 C73,94 84,86 84,71 Q84,67 89,67 L98,67 Q103,67 103,71 Z\"\n                    fill=\"url(#arrowPinkSide3D)\" stroke=\"#610c32\" stroke-width=\"4.2\" stroke-linejoin=\"round\" transform=\"translate(0, 4.5)\"/>\n              <path d=\"M103,71 C103,101 75,114 50,104 L45,114 Q42,119 38,113 L25,89 Q22,83 29,81 L57,75 Q64,74 60,80 L56,88 C73,94 84,86 84,71 Q84,67 89,67 L98,67 Q103,67 103,71 Z\"\n                    fill=\"url(#arrowPinkTop3D)\" stroke=\"#610c32\" stroke-width=\"2.4\" stroke-linejoin=\"round\"/>\n              <!-- 粉箭头立体高光弧线 -->\n              <path d=\"M97,79 C93,97 75,107 53,101\" fill=\"none\" stroke=\"#ffd9ee\" stroke-width=\"4.6\" stroke-linecap=\"round\" opacity=\"0.88\"/>\n              <circle cx=\"98.5\" cy=\"73\" r=\"2.2\" fill=\"#ffffff\" opacity=\"0.90\"/>\n            </g>\n          </svg>\n        </div>\n      </div>\n\n      <div style=\"font-size: 18px; font-weight: 900; color: #5c3d18; margin: 12px 0 18px; letter-spacing: 0.5px;\">智能破局一步 / 随机刷新药水颜色</div>\n\n      <button class=\"casual-green-btn\" id=\"refresh-confirm-btn\">\n        <svg width=\"28\" height=\"20\" viewBox=\"0 0 28 20\" fill=\"#ffffff\">\n          <rect x=\"1\" y=\"2\" width=\"18\" height=\"16\" rx=\"4\"/>\n          <polygon points=\"19,7 27,3 27,17 19,13\" stroke-linejoin=\"round\"/>\n          <polygon points=\"8,6.5 8,13.5 14,10\" fill=\"#2e8500\"/>\n        </svg>\n        <span>获得</span>\n      </button>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 D：主题商店面板（复刻参考图2 3D粉白遮阳篷 + 霓虹灯泡招牌 + 6套主题） ==================== -->\n  <div class=\"modal-mask\" id=\"shop-modal-mask\">\n    <div class=\"casual-modal-card shop-modal-card\">\n      <div class=\"casual-header-pill\">主题背景</div>\n      <div class=\"shop-awning-header\">\n        <svg viewBox=\"0 0 380 98\" width=\"100%\" height=\"100%\" style=\"overflow:visible;\">\n          <!-- 遮阳篷立体斜顶 -->\n          <path d=\"M12,48 Q30,24 65,22 L315,22 Q350,24 368,48 L376,66 L4,66 Z\" fill=\"#f472b6\" stroke=\"#be185d\" stroke-width=\"2.2\"/>\n          <polygon points=\"62,22 112,22 102,66 44,66\" fill=\"#fce7f3\"/>\n          <polygon points=\"164,22 216,22 216,66 164,66\" fill=\"#fce7f3\"/>\n          <polygon points=\"268,22 318,22 336,66 278,66\" fill=\"#fce7f3\"/>\n          <!-- 遮阳篷顶部弧形柔光高光带 -->\n          <path d=\"M24,42 Q190,32 356,42\" fill=\"none\" stroke=\"rgba(255,255,255,0.55)\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n          <!-- 7 瓣 3D 波浪垂帘（带厚底暗影边与亮面） -->\n          <g transform=\"translate(0, 4)\">\n            <path d=\"M4,62 A26,20 0 0,0 56,62 Z\" fill=\"#d88bb8\"/>\n            <path d=\"M56,62 A26,20 0 0,0 108,62 Z\" fill=\"#be185d\"/>\n            <path d=\"M108,62 A26,20 0 0,0 160,62 Z\" fill=\"#d88bb8\"/>\n            <path d=\"M160,62 A27,20 0 0,0 214,62 Z\" fill=\"#be185d\"/>\n            <path d=\"M214,62 A26,20 0 0,0 266,62 Z\" fill=\"#d88bb8\"/>\n            <path d=\"M266,62 A26,20 0 0,0 318,62 Z\" fill=\"#be185d\"/>\n            <path d=\"M318,62 A28,20 0 0,0 376,62 Z\" fill=\"#d88bb8\"/>\n          </g>\n          <path d=\"M4,62 A26,20 0 0,0 56,62 Z\" fill=\"#fbcfe8\" stroke=\"#db2777\" stroke-width=\"1.5\"/>\n          <path d=\"M56,62 A26,20 0 0,0 108,62 Z\" fill=\"#ec4899\" stroke=\"#be185d\" stroke-width=\"1.5\"/>\n          <path d=\"M108,62 A26,20 0 0,0 160,62 Z\" fill=\"#fbcfe8\" stroke=\"#db2777\" stroke-width=\"1.5\"/>\n          <path d=\"M160,62 A27,20 0 0,0 214,62 Z\" fill=\"#ec4899\" stroke=\"#be185d\" stroke-width=\"1.5\"/>\n          <path d=\"M214,62 A26,20 0 0,0 266,62 Z\" fill=\"#fbcfe8\" stroke=\"#db2777\" stroke-width=\"1.5\"/>\n          <path d=\"M266,62 A26,20 0 0,0 318,62 Z\" fill=\"#ec4899\" stroke=\"#be185d\" stroke-width=\"1.5\"/>\n          <path d=\"M318,62 A28,20 0 0,0 376,62 Z\" fill=\"#fbcfe8\" stroke=\"#db2777\" stroke-width=\"1.5\"/>\n          <!-- 紫色鎏金灯泡招牌 -->\n          <path d=\"M72,44 L64,14 Q62,2 78,2 L145,2 Q190,-8 235,2 L302,2 Q318,2 316,14 L308,44 Z\"\n                fill=\"#7e22ce\" stroke=\"#d97706\" stroke-width=\"7\" stroke-linejoin=\"round\" transform=\"translate(0, 3)\"/>\n          <path d=\"M72,44 L64,14 Q62,2 78,2 L145,2 Q190,-8 235,2 L302,2 Q318,2 316,14 L308,44 Z\"\n                fill=\"#9333ea\" stroke=\"#fbbf24\" stroke-width=\"5.5\" stroke-linejoin=\"round\"/>\n          <!-- 7 颗发光金灯泡 -->\n          <circle cx=\"65\" cy=\"18\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"105\" cy=\"4\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"148\" cy=\"1\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"190\" cy=\"-2\" r=\"6.5\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"232\" cy=\"1\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"275\" cy=\"4\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"315\" cy=\"18\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <text x=\"190\" y=\"32\" text-anchor=\"middle\" fill=\"#ffffff\" font-size=\"26\" font-weight=\"900\"\n                style=\"-webkit-text-stroke: 4px #581c87; paint-order: stroke fill; filter: drop-shadow(0 2px 0 #3b0764);\">商店</text>\n        </svg>\n      </div>\n      <div class=\"casual-close-btn\" id=\"shop-close-btn\" style=\"top: -18px;\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n\n      <div class=\"shop-grid\" id=\"shop-grid\"></div>\n\n      <div style=\"margin-top: 12px;\">\n        <button class=\"casual-cyan-btn\" id=\"shop-open-levels-btn\" style=\"font-size:16px;padding:9px 24px;min-width:168px;\">🗺️ 打开 200 关选单</button>\n      </div>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 E：200关选关面板 ==================== -->\n  <div class=\"modal-mask\" id=\"level-modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\">关卡选择</div>\n      <div class=\"casual-close-btn\" id=\"level-modal-close-btn\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n      <div style=\"font-size:12.5px;font-weight:800;color:#7c582c;margin-bottom:6px;\">200关大师级试炼 · 点击任一关卡立即挑战</div>\n      <div class=\"chapter-tabs\" id=\"chapter-tabs\">\n        <button class=\"chapter-tab-btn active\" data-ch=\"0\">1-40关</button>\n        <button class=\"chapter-tab-btn\" data-ch=\"1\">41-80关</button>\n        <button class=\"chapter-tab-btn\" data-ch=\"2\">81-120关</button>\n        <button class=\"chapter-tab-btn\" data-ch=\"3\">121-160关</button>\n        <button class=\"chapter-tab-btn\" data-ch=\"4\">161-200关</button>\n      </div>\n      <div class=\"level-grid-scroll\" id=\"level-grid-list\"></div>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 F：100%复刻参考图2 (IMG_6674) 悬浮绶带聚光灯【解锁新玩法】展示层 ==================== -->\n  <div class=\"modal-mask\" id=\"mechanic-modal-mask\">\n    <div class=\"mech-ceremony-wrap\">\n      <!-- 顶部：3D 彩球金星簇拥 + 橙金折叠绶带横幅（复刻图2「解锁新玩法」） -->\n      <div class=\"mech-ribbon-header\">\n        <svg viewBox=\"0 0 360 115\" width=\"100%\" height=\"100%\" style=\"overflow:visible;\">\n          <defs>\n            <linearGradient id=\"ribbonMainGrad\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n              <stop offset=\"0%\" stop-color=\"#ffd27d\"/>\n              <stop offset=\"35%\" stop-color=\"#f89c3e\"/>\n              <stop offset=\"100%\" stop-color=\"#e0741e\"/>\n            </linearGradient>\n            <linearGradient id=\"ribbonWingGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n              <stop offset=\"0%\" stop-color=\"#f28829\"/>\n              <stop offset=\"100%\" stop-color=\"#c95b10\"/>\n            </linearGradient>\n            <radialGradient id=\"orbPinkGrad\" cx=\"35%\" cy=\"30%\" r=\"65%\">\n              <stop offset=\"0%\" stop-color=\"#ffd6f5\"/><stop offset=\"45%\" stop-color=\"#e879f9\"/><stop offset=\"100%\" stop-color=\"#a21caf\"/>\n            </radialGradient>\n            <radialGradient id=\"orbBlueGrad\" cx=\"35%\" cy=\"30%\" r=\"65%\">\n              <stop offset=\"0%\" stop-color=\"#dbeafe\"/><stop offset=\"45%\" stop-color=\"#60a5fa\"/><stop offset=\"100%\" stop-color=\"#1d4ed8\"/>\n            </radialGradient>\n            <radialGradient id=\"orbCoralGrad\" cx=\"35%\" cy=\"30%\" r=\"65%\">\n              <stop offset=\"0%\" stop-color=\"#ffe4e6\"/><stop offset=\"45%\" stop-color=\"#fb7185\"/><stop offset=\"100%\" stop-color=\"#be123c\"/>\n            </radialGradient>\n            <radialGradient id=\"orbCyanGrad\" cx=\"35%\" cy=\"30%\" r=\"65%\">\n              <stop offset=\"0%\" stop-color=\"#e0f2fe\"/><stop offset=\"45%\" stop-color=\"#38bdf8\"/><stop offset=\"100%\" stop-color=\"#0369a1\"/>\n            </radialGradient>\n          </defs>\n\n          <!-- 绶带后方簇拥的 3D 彩色庆典气球与双金星（100%复刻图2顶部元素） -->\n          <circle cx=\"84\" cy=\"48\" r=\"15\" fill=\"url(#orbCyanGrad)\" />\n          <circle cx=\"110\" cy=\"36\" r=\"22\" fill=\"url(#orbPinkGrad)\" />\n          <circle cx=\"242\" cy=\"34\" r=\"21\" fill=\"url(#orbBlueGrad)\" />\n          <circle cx=\"272\" cy=\"44\" r=\"24\" fill=\"url(#orbCoralGrad)\" />\n\n          <!-- 左侧小金星 -->\n          <g transform=\"translate(142, 34) rotate(-14)\">\n            <path d=\"M0,-18 L5.2,-6 L18,-4.2 L8.5,4.5 L11,17.5 L0,11 L-11,17.5 L-8.5,4.5 L-18,-4.2 L-5.2,-6 Z\"\n                  fill=\"url(#funnelGoldGrad)\" stroke=\"#d97706\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n          </g>\n          <!-- 中央大主金星 -->\n          <g transform=\"translate(194, 24) rotate(8)\">\n            <path d=\"M0,-29 L8.5,-9.5 L29,-6.8 L13.8,7.2 L17.8,28 L0,17.8 L-17.8,28 L-13.8,7.2 L-29,-6.8 L-8.5,-9.5 Z\"\n                  fill=\"url(#funnelGoldGrad)\" stroke=\"#d97706\" stroke-width=\"2.8\" stroke-linejoin=\"round\"\n                  style=\"filter:drop-shadow(0 4px 8px rgba(180, 83, 9, 0.45));\"/>\n            <path d=\"M0,-23 L6,-7.5 L22,-5 L10,5.5 L13,21 L0,13.5\" fill=\"rgba(255,255,255,0.35)\"/>\n          </g>\n\n          <!-- 左右两侧燕尾折叠飘带翼 -->\n          <path d=\"M 22,68 L 78,60 L 78,96 L 22,102 L 38,85 Z\" fill=\"url(#ribbonWingGrad)\" stroke=\"#b45309\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n          <polygon points=\"62,62 78,60 78,96 62,88\" fill=\"#8c3905\"/>\n          <path d=\"M 338,68 L 282,60 L 282,96 L 338,102 L 322,85 Z\" fill=\"url(#ribbonWingGrad)\" stroke=\"#b45309\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n          <polygon points=\"298,62 282,60 282,96 298,88\" fill=\"#8c3905\"/>\n\n          <!-- 中央拱起 3D 橙金主绶带 -->\n          <path d=\"M 56,56 C 110,36 250,36 304,56 L 294,94 C 242,74 118,74 66,94 Z\"\n                fill=\"url(#ribbonMainGrad)\" stroke=\"#c2590a\" stroke-width=\"2.8\" stroke-linejoin=\"round\"/>\n          <!-- 绶带内侧金线描边与高光 -->\n          <path d=\"M 62,60 C 114,41 246,41 298,60\" fill=\"none\" stroke=\"#fff7ed\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.82\"/>\n          <path d=\"M 70,88 C 120,70 240,70 290,88\" fill=\"none\" stroke=\"#fed7aa\" stroke-width=\"1.5\" stroke-linecap=\"round\" opacity=\"0.65\"/>\n\n          <!-- 绶带中央标题文字 -->\n          <text id=\"mech-title\" x=\"180\" y=\"75\" text-anchor=\"middle\" fill=\"#ffffff\" font-size=\"27\" font-weight=\"900\"\n                style=\"letter-spacing: 2px; paint-order: stroke fill; stroke: #b45309; stroke-width: 5.5px; stroke-linejoin: round; filter: drop-shadow(0 2px 2px rgba(120, 45, 5, 0.55));\">解锁新玩法</text>\n        </svg>\n      </div>\n\n      <!-- 中央：开放式旋转金芒聚光灯 + 四角闪烁星芒 + 新道具水瓶本体 -->\n      <div class=\"mech-open-spotlight\">\n        <div class=\"mech-open-rays\"></div>\n        <div class=\"mech-open-glow-core\"></div>\n        <svg class=\"mech-sparkles-layer\" viewBox=\"0 0 280 256\">\n          <!-- 左上、左下、右上、右下闪烁四角星与五角星 -->\n          <path d=\"M46,136 L50,124 L54,136 L66,140 L54,144 L50,156 L46,144 L34,140 Z\" fill=\"#fef08a\"/>\n          <path d=\"M226,98 L230,86 L234,98 L246,102 L234,106 L230,118 L226,106 L214,102 Z\" fill=\"#fef08a\"/>\n          <path d=\"M188,184 L191,176 L194,184 L202,187 L194,190 L191,198 L188,190 L180,187 Z\" fill=\"#ffffff\"/>\n          <circle cx=\"72\" cy=\"96\" r=\"4\" fill=\"#fffbeb\" opacity=\"0.85\"/>\n          <circle cx=\"204\" cy=\"146\" r=\"3.5\" fill=\"#fffbeb\" opacity=\"0.85\"/>\n          <circle cx=\"88\" cy=\"176\" r=\"3\" fill=\"#fde047\" opacity=\"0.75\"/>\n        </svg>\n        <div class=\"mech-bottle-hero\" id=\"mech-preview-stage\"></div>\n      </div>\n\n      <div class=\"mech-carousel-dot\"></div>\n\n      <!-- 底部：图2同款双层金边米白说明横幅 + 点击任意位置继续 -->\n      <div class=\"mech-scroll-pill\" id=\"mech-desc\">倒出顶层药水，即可揭晓下方隐藏的颜色。</div>\n      <div class=\"mech-tap-anywhere\" id=\"mech-close-btn\">点击任意位置继续</div>\n      <!-- 兼容隐藏字段 -->\n      <div id=\"mech-badge\" style=\"display:none;\"></div>\n      <div id=\"mech-sub\" style=\"display:none;\"></div>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 G：过关结算弹窗（精简高定庆典版） ==================== -->\n  <div class=\"modal-mask\" id=\"modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\" id=\"modal-badge-pill\">过关成功</div>\n      <div class=\"casual-close-btn\" id=\"win-close-x-btn\">\n        <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.2\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n\n      <!-- 3D 璀璨三星与黄金圣杯动效舞台 -->\n      <div class=\"win-celebration-hero\">\n        <div class=\"win-stars-row\">\n          <svg class=\"win-star-item s1\" width=\"34\" height=\"34\" viewBox=\"0 0 36 36\">\n            <path d=\"M18 3L22.4 12.2L32.5 13.5L25.1 20.6L26.9 30.7L18 25.8L9.1 30.7L10.9 20.6L3.5 13.5L13.6 12.2L18 3Z\" fill=\"url(#funnelGoldGrad)\" stroke=\"#ffffff\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n          </svg>\n          <svg class=\"win-star-item s2\" width=\"44\" height=\"44\" viewBox=\"0 0 36 36\">\n            <path d=\"M18 3L22.4 12.2L32.5 13.5L25.1 20.6L26.9 30.7L18 25.8L9.1 30.7L10.9 20.6L3.5 13.5L13.6 12.2L18 3Z\" fill=\"url(#funnelGoldGrad)\" stroke=\"#ffffff\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n          </svg>\n          <svg class=\"win-star-item s3\" width=\"34\" height=\"34\" viewBox=\"0 0 36 36\">\n            <path d=\"M18 3L22.4 12.2L32.5 13.5L25.1 20.6L26.9 30.7L18 25.8L9.1 30.7L10.9 20.6L3.5 13.5L13.6 12.2L18 3Z\" fill=\"url(#funnelGoldGrad)\" stroke=\"#ffffff\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n          </svg>\n        </div>\n        <div class=\"win-trophy-wrap\">\n          <svg width=\"76\" height=\"72\" viewBox=\"0 0 80 76\" fill=\"none\">\n            <ellipse cx=\"40\" cy=\"70\" rx=\"24\" ry=\"4\" fill=\"rgba(120, 72, 12, 0.22)\"/>\n            <!-- 双耳手柄 -->\n            <path d=\"M22 18H13C10 18 9 22 11 27C13 32 18 35 24 35\" stroke=\"url(#funnelGoldGrad)\" stroke-width=\"4.2\" stroke-linecap=\"round\"/>\n            <path d=\"M58 18H67C70 18 71 22 69 27C67 32 62 35 56 35\" stroke=\"url(#funnelGoldGrad)\" stroke-width=\"4.2\" stroke-linecap=\"round\"/>\n            <!-- 奖杯主体 -->\n            <path d=\"M21 12H59V26C59 38.5 50.5 46 40 46C29.5 46 21 38.5 21 26V12Z\" fill=\"url(#funnelGoldGrad)\" stroke=\"#ffffff\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n            <!-- 奖杯高光弧 -->\n            <path d=\"M26 17V25C26 32 29.5 37.5 34.5 40\" stroke=\"rgba(255,255,255,0.78)\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n            <!-- 奖杯柱与底座 -->\n            <rect x=\"36\" y=\"45\" width=\"8\" height=\"13\" rx=\"2\" fill=\"url(#funnelGoldGrad)\"/>\n            <path d=\"M25 58H55L58 66H22L25 58Z\" fill=\"url(#ancientSpoutGrad)\" stroke=\"#ffffff\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/>\n          </svg>\n        </div>\n      </div>\n\n      <div class=\"win-scorecard\">\n        <div>\n          <div class=\"score-col-label\">本次用步</div>\n          <div class=\"score-col-val\" id=\"score-user-moves\">14 步</div>\n        </div>\n        <div class=\"score-divider\"></div>\n        <div>\n          <div class=\"score-col-label\">理论最优解</div>\n          <div class=\"score-col-val cyan\" id=\"score-opt-moves\">12 步</div>\n        </div>\n        <div class=\"score-divider\"></div>\n        <div>\n          <div class=\"score-col-label\">最优解差距</div>\n          <div class=\"score-col-val amber\" id=\"score-diff-moves\">+2</div>\n        </div>\n      </div>\n      <div style=\"font-size:12.5px;font-weight:800;color:#b46914;margin-bottom:14px;\" id=\"score-praise-line\">✨ 步数控制非常出色！</div>\n      <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;\">\n        <button class=\"casual-cyan-btn\" id=\"modal-restart-btn\" style=\"min-width:0;width:100%;padding:12px 0;font-size:16.5px;\">重玩本关</button>\n        <button class=\"casual-green-btn\" id=\"modal-next-btn\" style=\"min-width:0;width:100%;padding:12px 0;font-size:16.5px;\">下一关</button>\n      </div>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 H：星晷步数耗尽 · 续步救援弹窗（修复漏洞5） ==================== -->\n  <div class=\"modal-mask\" id=\"out-of-moves-modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\">步数耗尽</div>\n      <div class=\"casual-close-btn\" id=\"oom-close-x-btn\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n      <div class=\"pastel-sunburst-box\" style=\"height: 150px;\">\n        <div class=\"pastel-sunburst-rays\"></div>\n        <div class=\"pastel-sunburst-content\">\n          <svg width=\"110\" height=\"110\" viewBox=\"0 0 110 110\" filter=\"url(#ui3dDropShadow)\">\n            <circle cx=\"55\" cy=\"58\" r=\"38\" fill=\"url(#bombRedBadgeGrad)\" stroke=\"#ffffff\" stroke-width=\"4\"/>\n            <circle cx=\"55\" cy=\"58\" r=\"30\" fill=\"#fff1f2\" stroke=\"#f43f5e\" stroke-width=\"2.5\"/>\n            <line x1=\"55\" y1=\"58\" x2=\"55\" y2=\"38\" stroke=\"#be123c\" stroke-width=\"4.5\" stroke-linecap=\"round\"/>\n            <line x1=\"55\" y1=\"58\" x2=\"70\" y2=\"58\" stroke=\"#f43f5e\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n            <circle cx=\"55\" cy=\"58\" r=\"4.5\" fill=\"#9f1239\"/>\n            <rect x=\"46\" y=\"12\" width=\"18\" height=\"6\" rx=\"3\" fill=\"#fbbf24\" stroke=\"#78350f\" stroke-width=\"2\"/>\n          </svg>\n        </div>\n      </div>\n      <div style=\"font-size:18px;font-weight:900;color:#be123c;margin-bottom:6px;\">⚠️ 步数已用尽！</div>\n      <div style=\"font-size:13px;font-weight:800;color:#7c582c;margin-bottom:16px;\">是否增加 +5 步继续游戏？</div>\n      <button class=\"casual-green-btn\" id=\"oom-add-moves-btn\" style=\"width:100%;margin-bottom:10px;\">\n        <svg width=\"26\" height=\"18\" viewBox=\"0 0 28 20\" fill=\"#ffffff\">\n          <rect x=\"1\" y=\"2\" width=\"18\" height=\"16\" rx=\"4\"/>\n          <polygon points=\"19,7 27,3 27,17 19,13\" stroke-linejoin=\"round\"/>\n          <polygon points=\"8,6.5 8,13.5 14,10\" fill=\"#2e8500\"/>\n        </svg>\n        <span>免费增加 5 步</span>\n      </button>\n      <button class=\"casual-cyan-btn\" id=\"oom-restart-btn\" style=\"width:100%;padding:9px 0;font-size:16px;\">↻ 重新挑战本关</button>\n    </div>\n  </div>", vBody);

    // 绑定微信/抖音小游戏触摸事件到主画布 pointer 事件
    if (nativeApi && mainScreenCanvas) {
      const getTouchPt = (res) => {
        const t = (res && res.touches && res.touches[0]) || (res && res.changedTouches && res.changedTouches[0]);
        return t ? { x: t.clientX ?? t.pageX ?? t.x ?? 0, y: t.clientY ?? t.pageY ?? t.y ?? 0 } : { x: 0, y: 0 };
      };
      if (typeof nativeApi.onTouchStart === 'function') {
        nativeApi.onTouchStart((res) => {
          const pt = getTouchPt(res);
          mainScreenCanvas.dispatchEvent({ type: 'pointerdown', clientX: pt.x, clientY: pt.y });
        });
      }
      if (typeof nativeApi.onTouchMove === 'function') {
        nativeApi.onTouchMove((res) => {
          const pt = getTouchPt(res);
          mainScreenCanvas.dispatchEvent({ type: 'pointermove', clientX: pt.x, clientY: pt.y });
        });
      }
      if (typeof nativeApi.onTouchEnd === 'function') {
        nativeApi.onTouchEnd((res) => {
          const pt = getTouchPt(res);
          mainScreenCanvas.dispatchEvent({ type: 'pointerup', clientX: pt.x, clientY: pt.y });
        });
      }
      if (typeof nativeApi.onTouchCancel === 'function') {
        nativeApi.onTouchCancel(() => {
          mainScreenCanvas.dispatchEvent({ type: 'pointercancel' });
        });
      }
    }
  } else {
    // 浏览器环境：若页面中尚未挂载游戏节点，则自动注入样式与容器，做到单 JS 文件即插即用
    if (!document.getElementById('pure-game-canvas')) {
      const styleEl = document.createElement('style');
      styleEl.textContent = "\n    :root {\n      --safe-top: env(safe-area-inset-top, 0px);\n      --safe-bottom: env(safe-area-inset-bottom, 0px);\n      --app-max-w: 460px;\n      /* 100% 提取自参考图实现 HTML：左上暖金、左下琥珀橘、右侧鼠尾草绿的三层柔和渐变 */\n      --stage-bg:\n        radial-gradient(circle at 46% 19%, rgba(255, 232, 135, 0.44) 0%, rgba(255, 224, 110, 0) 38%),\n        radial-gradient(ellipse 68% 58% at 30% 56%, #e7a444 0%, #df9d3f 48%, rgba(216, 155, 68, 0) 100%),\n        linear-gradient(112deg, #b59756 0%, #d3ab55 28%, #da9b43 56%, #88986b 88%, #6f8661 100%);\n      --stage-glow: radial-gradient(ellipse at 46% 18%, rgba(255, 240, 150, 0.36) 0%, rgba(232, 165, 68, 0.10) 48%, rgba(120, 80, 20, 0) 75%);\n      --dock-bg: transparent;\n      --dock-border: rgba(255, 255, 255, 0.68);\n    }\n\n    body[data-theme=\"zen_amber\"] {\n      --stage-bg:\n        radial-gradient(circle at 46% 19%, rgba(255, 232, 135, 0.44) 0%, rgba(255, 224, 110, 0) 38%),\n        radial-gradient(ellipse 68% 58% at 30% 56%, #e7a444 0%, #df9d3f 48%, rgba(216, 155, 68, 0) 100%),\n        linear-gradient(112deg, #b59756 0%, #d3ab55 28%, #da9b43 56%, #88986b 88%, #6f8661 100%);\n      --stage-glow: radial-gradient(ellipse at 46% 18%, rgba(255, 240, 150, 0.36) 0%, rgba(232, 165, 68, 0.10) 48%, rgba(120, 80, 20, 0) 75%);\n      --dock-bg: transparent;\n      --dock-border: rgba(255, 255, 255, 0.68);\n    }\n\n    body[data-theme=\"volcanic\"] {\n      --stage-bg: linear-gradient(180deg, #989aa9 0%, #8a8d9e 64%, #6a6e82 64.1%, #62667a 100%);\n      --stage-glow: radial-gradient(ellipse at 50% 24%, rgba(255, 255, 255, 0.18) 0%, rgba(15, 23, 42, 0) 70%);\n      --dock-bg: linear-gradient(180deg, #5863b8 0%, #3d468f 100%);\n      --dock-border: #9aa7ff;\n    }\n\n    body[data-theme=\"taro\"] {\n      --stage-bg: linear-gradient(180deg, #bfaee0 0%, #a894d1 64%, #836eb3 64.1%, #745ea6 100%);\n      --stage-glow: radial-gradient(ellipse at 50% 24%, rgba(255, 240, 255, 0.26) 0%, rgba(50, 20, 80, 0) 70%);\n      --dock-bg: linear-gradient(180deg, #9b82db 0%, #7d62c7 100%);\n      --dock-border: #decfff;\n    }\n\n    body[data-theme=\"orange\"] {\n      --stage-bg: linear-gradient(180deg, #f7bf88 0%, #eba463 64%, #c97a38 64.1%, #b56928 100%);\n      --stage-glow: radial-gradient(ellipse at 50% 24%, rgba(255, 250, 220, 0.30) 0%, rgba(90, 40, 0, 0) 70%);\n      --dock-bg: linear-gradient(180deg, #f28c48 0%, #d96b27 100%);\n      --dock-border: #ffd6b0;\n    }\n\n    body[data-theme=\"beach\"] {\n      --stage-bg: linear-gradient(180deg, #62dce8 0%, #88e8f2 44%, #f7f2dc 46%, #edd2a4 64%, #deb981 64.1%, #cfab72 100%);\n      --stage-glow: radial-gradient(ellipse at 50% 20%, rgba(255, 255, 255, 0.35) 0%, rgba(0, 80, 120, 0) 70%);\n      --dock-bg: linear-gradient(180deg, #4cc9f0 0%, #2b9fd9 100%);\n      --dock-border: #b8f2ff;\n    }\n\n    body[data-theme=\"starlight\"] {\n      --stage-bg: radial-gradient(ellipse at 50% 18%, #191d52 0%, #0d1030 52%, #07081c 100%);\n      --stage-glow: radial-gradient(ellipse at 50% 16%, rgba(124, 58, 237, 0.22) 0%, rgba(30, 58, 138, 0.12) 45%, rgba(7, 8, 28, 0) 75%);\n      --dock-bg: linear-gradient(180deg, #2a3180 0%, #171b4d 100%);\n      --dock-border: #434ea8;\n    }\n\n    body[data-theme=\"emerald\"] {\n      --stage-bg: linear-gradient(180deg, #74c69d 0%, #52b788 64%, #3b8c66 64.1%, #2d6a4f 100%);\n      --stage-glow: radial-gradient(ellipse at 50% 24%, rgba(220, 255, 235, 0.28) 0%, rgba(10, 50, 30, 0) 70%);\n      --dock-bg: linear-gradient(180deg, #40916c 0%, #2d6a4f 100%);\n      --dock-border: #b7e4c7;\n    }\n\n    * {\n      margin: 0;\n      padding: 0;\n      box-sizing: border-box;\n      user-select: none;\n      -webkit-user-select: none;\n      -webkit-touch-callout: none;\n      -webkit-tap-highlight-color: transparent;\n      touch-action: manipulation;\n    }\n\n    html, body {\n      width: 100%;\n      max-width: 100vw;\n      height: 100%;\n      height: 100dvh;\n      overflow: hidden;\n      background: var(--stage-bg);\n      font-family: \"Fredoka\", \"Quicksand\", \"SF Pro Rounded\", ui-rounded, \"Hiragino Maru Gothic ProN\", \"Rounded Mplus 1c\", \"YouYuan\", \"幼圆\", \"PingFang SC\", \"Hiragino Sans GB\", \"Microsoft YaHei\", sans-serif;\n      font-feature-settings: \"cv01\" on, \"ss01\" on;\n      -webkit-font-smoothing: antialiased;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: space-between;\n      color: #ffffff;\n      position: fixed;\n      inset: 0;\n      transition: background 0.35s ease;\n    }\n\n    .ambient-glow {\n      position: absolute;\n      top: -40px;\n      left: 50%;\n      transform: translateX(-50%);\n      width: min(100vw, 460px);\n      height: 320px;\n      background: var(--stage-glow);\n      pointer-events: none;\n      z-index: 0;\n    }\n\n    .app-shell {\n      position: relative;\n      width: 100%;\n      max-width: min(100vw, var(--app-max-w));\n      height: 100%;\n      height: 100dvh;\n      display: flex;\n      flex-direction: column;\n      justify-content: space-between;\n      gap: clamp(2px, 0.7dvh, 8px);\n      padding: calc(var(--safe-top) + 6px) clamp(6px, 2vw, 12px) 0;\n      overflow: visible;\n      z-index: 2;\n    }\n\n    /* 2D 顶层动态星光粒子流与萤火微粒画布（提取自参考图实现 HTML #fx-canvas） */\n    #bg-star-canvas {\n      position: fixed;\n      inset: 0;\n      width: 100vw;\n      height: 100dvh;\n      pointer-events: none;\n      z-index: 3;\n    }\n\n    /* ==================== 1. 顶部 UI：中央大字号数字/副标题 + 左右磨砂玻璃按钮（100%提取自参考图 HTML） ==================== */\n    .top-bar {\n      width: 100%;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      padding: 8px 14px 4px;\n      min-height: clamp(58px, 8.6dvh, 72px);\n      flex-shrink: 0;\n      position: relative;\n      z-index: 15;\n    }\n\n    /* 顶部原图级超椭圆 SVG 折射玻璃按钮（100%复刻 image_55d85b 鹅卵石超椭圆曲率与斜向新月反光带） */\n    .frosted-top-action {\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      cursor: pointer;\n      pointer-events: auto;\n      flex-shrink: 0;\n      z-index: 18;\n    }\n    .svg-btn-top {\n      width: clamp(44px, 6.4vh, 54px);\n      height: clamp(44px, 6.4vh, 54px);\n      display: block;\n      transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.15s ease;\n    }\n    .frosted-top-action:hover .svg-btn-top {\n      transform: translateY(-2px) scale(1.04);\n      filter: brightness(1.06);\n    }\n    .frosted-top-action:active .svg-btn-top {\n      transform: translateY(1.5px) scale(0.95);\n      filter: brightness(0.96);\n    }\n    .frosted-top-label {\n      display: none !important;\n    }\n\n    /* 顶部中央极简圆润大数字（100%对标参考图2 image_703222：无背景框、与左右按钮严格等高居中对齐） */\n    .top-center-group {\n      position: absolute;\n      left: 50%;\n      top: 50%;\n      transform: translate(-50%, -50%);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      cursor: pointer;\n      pointer-events: auto;\n      z-index: 16;\n    }\n    .zen-big-num-wrap {\n      position: relative;\n      display: inline-flex;\n      align-items: center;\n      justify-content: center;\n      padding: 0 8px;\n      background: none;\n      border: none;\n      box-shadow: none;\n      backdrop-filter: none;\n      -webkit-backdrop-filter: none;\n    }\n    .zen-big-num-wrap::before,\n    .zen-big-num-wrap::after {\n      display: none !important;\n    }\n    /* 清新Q弹圆润字体风格 */\n    .zen-big-num,\n    .level-pill,\n    .casual-header-pill,\n    .casual-green-btn,\n    .casual-cyan-btn,\n    .score-col-val,\n    .medallion-badge,\n    .rules-question,\n    .bottle-reject-callout,\n    .toast-msg {\n      font-family: \"Fredoka\", \"Quicksand\", \"SF Pro Rounded\", ui-rounded, \"Hiragino Maru Gothic ProN\", \"Rounded Mplus 1c\", \"YouYuan\", \"幼圆\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif;\n    }\n    .zen-big-num {\n      font-family: \"Fredoka\", \"Quicksand\", \"SF Pro Rounded\", ui-rounded, \"PingFang SC\", \"Microsoft YaHei\", sans-serif;\n      font-size: clamp(28px, 4.4vh, 36px);\n      font-weight: 800;\n      line-height: 1;\n      letter-spacing: 1.5px;\n      color: #ffffff;\n      -webkit-text-stroke: 0px transparent;\n      text-shadow:\n        0 2.5px 7px rgba(110, 68, 14, 0.34),\n        0 0 14px rgba(255, 245, 200, 0.20);\n      position: relative;\n      z-index: 2;\n      white-space: nowrap;\n    }\n    .zen-big-num::before,\n    .zen-big-num::after {\n      display: none !important;\n    }\n    /* 已封存数量文案直接隐藏 */\n    .level-pill {\n      display: none !important;\n    }\n\n    /* ==================== 2. 顶部 4 个 3D 礼盒袋 & 模式横幅 ==================== */\n    .bags-stage {\n      width: 100%;\n      max-width: 392px;\n      margin: 0 auto;\n      display: grid;\n      grid-template-columns: repeat(4, minmax(0, 1fr));\n      gap: clamp(12px, 3.2vw, 18px);\n      padding: 2px 12px 0;\n      height: clamp(98px, 15.8dvh, 128px);\n      align-items: end;\n      justify-items: center;\n      flex-shrink: 0;\n      position: relative;\n      z-index: 6;\n      min-width: 0;\n    }\n    .bags-stage.hidden { display: none !important; }\n\n    .bag-slot {\n      width: 100%;\n      max-width: 76px;\n      height: 100%;\n      min-width: 0;\n      min-height: 0;\n      position: relative;\n      display: flex;\n      align-items: flex-end;\n      justify-content: center;\n      cursor: pointer;\n      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);\n    }\n    .bag-slot svg {\n      width: 100%;\n      height: 100%;\n      max-width: 100%;\n      max-height: 100%;\n      display: block;\n      overflow: visible;\n    }\n    .bag-slot.packing-bounce { animation: bagPackBounce 0.26s cubic-bezier(0.34, 1.56, 0.64, 1); }\n    @keyframes bagPackBounce {\n      0% { transform: scale(1); }\n      35% { transform: scale(1.12, 0.90) translateY(4px); }\n      72% { transform: scale(0.97, 1.05) translateY(-4px); }\n      100% { transform: scale(1); }\n    }\n    .bag-bottle-drop-in { animation: bagBottleSlideIn 0.22s cubic-bezier(0.22, 1.35, 0.5, 1) forwards; }\n    @keyframes bagBottleSlideIn {\n      0% { transform: translate(27px, 12px); opacity: 0.4; }\n      100% { transform: translate(27px, 45px); opacity: 1; }\n    }\n    .bag-slot.bag-carry-away {\n      transform-origin: 50% 8%;\n      animation: bagCarryAwayAnim 0.30s cubic-bezier(0.32, 0, 0.67, 0) forwards;\n      pointer-events: none;\n    }\n    @keyframes bagCarryAwayAnim {\n      0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }\n      22%  { transform: translateY(3px) rotate(-6deg) scale(1.03, 0.96); opacity: 1; }\n      52%  { transform: translateY(-42px) rotate(7deg) scale(0.97, 1.05); opacity: 0.95; }\n      100% { transform: translateY(-155px) rotate(-5deg) scale(0.84); opacity: 0; }\n    }\n    .bag-slot.bag-drop-in {\n      transform-origin: 50% 100%;\n      animation: bagDropInAnim 0.26s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;\n    }\n    @keyframes bagDropInAnim {\n      0%   { transform: translateY(-115px) scale(0.86, 1.12); opacity: 0; }\n      58%  { transform: translateY(7px) scale(1.08, 0.91); opacity: 1; }\n      80%  { transform: translateY(-4px) scale(0.97, 1.03); opacity: 1; }\n      100% { transform: translateY(0) scale(1); opacity: 1; }\n    }\n    .bag-bell-fx {\n      position: absolute;\n      top: -18px;\n      left: 50%;\n      transform: translateX(-50%);\n      width: 68px;\n      height: 52px;\n      pointer-events: none;\n      z-index: 40;\n      animation: bellPopSwing 0.62s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;\n    }\n    @keyframes bellPopSwing {\n      0%   { transform: translateX(-50%) translateY(10px) scale(0.3) rotate(0deg); opacity: 0; }\n      26%  { transform: translateX(-50%) translateY(-4px) scale(1.16) rotate(-15deg); opacity: 1; }\n      48%  { transform: translateX(-50%) translateY(-6px) scale(1.06) rotate(13deg); opacity: 1; }\n      70%  { transform: translateX(-50%) translateY(-8px) scale(1.0) rotate(-7deg); opacity: 0.92; }\n      100% { transform: translateX(-50%) translateY(-16px) scale(0.85) rotate(0deg); opacity: 0; }\n    }\n\n    .mode-banner {\n      display: none;\n      align-items: center;\n      justify-content: space-between;\n      width: calc(100% - 6px);\n      margin: 2px auto 0;\n      padding: 6px 12px;\n      border-radius: 18px;\n      background: linear-gradient(155deg, rgba(255, 248, 232, 0.34) 0%, rgba(215, 175, 110, 0.28) 100%);\n      backdrop-filter: blur(10px);\n      -webkit-backdrop-filter: blur(10px);\n      border: 1.5px solid rgba(255, 255, 255, 0.65);\n      box-shadow: 0 4px 14px rgba(85, 48, 8, 0.18), inset 0 1.5px 2px rgba(255, 255, 255, 0.55);\n      font-size: clamp(11.5px, 1.75dvh, 13px);\n      font-weight: 800;\n      color: #ffffff;\n      flex-shrink: 0;\n      z-index: 10;\n      gap: 8px;\n    }\n    .mode-banner.show { display: flex; }\n\n    .mode-banner-left {\n      display: flex;\n      align-items: center;\n      gap: 7px;\n      min-width: 0;\n      flex: 1;\n      overflow: hidden;\n    }\n    #mode-banner-text {\n      white-space: nowrap;\n      overflow: hidden;\n      text-overflow: ellipsis;\n      text-shadow: 0 1.5px 3px rgba(90, 52, 10, 0.45);\n    }\n    .mode-banner-tag {\n      padding: 2.5px 9px;\n      border-radius: 11px;\n      background: linear-gradient(155deg, #e5a344 0%, #c88022 100%);\n      border: 1.4px solid rgba(255, 255, 255, 0.88);\n      color: #ffffff;\n      font-size: 11px;\n      font-weight: 800;\n      white-space: nowrap;\n      box-shadow: 0 2px 5px rgba(85, 48, 8, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.55);\n      flex-shrink: 0;\n    }\n\n    /* 3D 步数胶囊：移至下方状态栏右侧与完成进度并排，言简意赅，带⏰闹钟提醒 */\n    .moves-counter-pill {\n      display: none;\n      align-items: center;\n      gap: 5px;\n      padding: 3px 10px 3px 8px;\n      border-radius: 15px;\n      background: linear-gradient(180deg, #ffb300 0%, #f57c00 50%, #e65100 100%);\n      border: 1.8px solid #ffffff;\n      outline: 1.2px solid #b33900;\n      box-shadow:\n        0 3px 0 #8f2d00,\n        0 4px 8px rgba(0, 0, 0, 0.3),\n        inset 0 1.5px 2px rgba(255, 255, 255, 0.7);\n      color: #ffffff;\n      font-size: 12px;\n      font-weight: 900;\n      letter-spacing: 0.3px;\n      text-shadow: 0 1.5px 2px rgba(120, 35, 0, 0.75);\n      white-space: nowrap;\n      flex-shrink: 0;\n      transition: all 0.22s ease;\n    }\n    .moves-counter-pill.show { display: inline-flex; }\n\n    /* 步数偏低时（<= 5步）醒目⏰危险警报样式与震颤动画 */\n    .moves-counter-pill.alarm-danger {\n      background: linear-gradient(180deg, #ff5252 0%, #ff1744 50%, #d50000 100%);\n      outline-color: #7f0000;\n      box-shadow:\n        0 3px 0 #5c0000,\n        0 0 14px rgba(255, 23, 68, 0.9),\n        inset 0 1.5px 2px rgba(255, 205, 210, 0.85);\n      animation: alarmBadgePulse 0.75s infinite ease-in-out;\n    }\n    @keyframes alarmBadgePulse {\n      0%, 100% { transform: scale(1); }\n      50% { transform: scale(1.08); }\n    }\n    .moves-counter-pill.alarm-danger .alarm-clock-svg {\n      animation: alarmBellRing 0.5s infinite ease-in-out;\n    }\n    @keyframes alarmBellRing {\n      0%, 100% { transform: rotate(0deg); }\n      20% { transform: rotate(-16deg); }\n      40% { transform: rotate(16deg); }\n      60% { transform: rotate(-12deg); }\n      80% { transform: rotate(12deg); }\n    }\n\n    /* ==================== 3. 中央瓶子舞台与左下/右下迷你悬浮按钮 ==================== */\n    .bottles-stage {\n      flex: 1;\n      width: 100%;\n      min-width: 0;\n      min-height: 0;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      padding: clamp(8px, 1.6dvh, 16px) clamp(2px, 1vw, 6px) clamp(8px, 1.8dvh, 16px);\n      position: relative;\n      z-index: 30;\n      overflow: visible;\n    }\n\n    .bottles-grid {\n      width: 100%;\n      height: auto;\n      max-height: 100%;\n      min-width: 0;\n      min-height: 0;\n      display: grid;\n      grid-template-columns: repeat(6, minmax(0, 1fr));\n      grid-template-rows: repeat(2, auto);\n      column-gap: clamp(5px, 1.5vw, 9px);\n      row-gap: clamp(36px, 6.4dvh, 52px);\n      padding: 16px 2px 18px;\n      align-content: center;\n      align-items: end;\n      justify-items: center;\n      transition: transform 0.2s ease;\n    }\n    .bottles-grid.zoomed-stage {\n      transform: scale(0.90);\n      transform-origin: center center;\n    }\n    .bottles-grid.layout-dynamic-12 {\n      grid-template-columns: repeat(6, minmax(0, 1fr));\n      grid-template-rows: repeat(2, auto);\n      column-gap: clamp(5px, 1.5vw, 9px);\n      row-gap: clamp(38px, 6.6dvh, 54px);\n      padding: 18px 2px 20px;\n    }\n    .bottles-grid.layout-5col { grid-template-columns: repeat(5, minmax(0, 1fr)); column-gap: clamp(7px, 2vw, 12px); }\n    .bottles-grid.layout-varied { grid-template-columns: repeat(6, minmax(0, 1fr)); grid-template-rows: repeat(2, auto); row-gap: clamp(36px, 6.0dvh, 50px); padding: 16px 2px 18px; }\n    .bottles-grid.layout-tall8 { grid-template-columns: repeat(7, minmax(0, 1fr)); grid-template-rows: auto; column-gap: clamp(3px, 1vw, 6px); align-items: center; padding: 14px 1px; }\n    .bottles-grid.layout-cat-boss { grid-template-columns: repeat(7, minmax(0, 1fr)); grid-template-rows: repeat(2, auto); column-gap: clamp(3px, 1vw, 6px); row-gap: clamp(32px, 5.4dvh, 44px); align-items: center; padding: 14px 2px; }\n    .bottles-grid.layout-21 { width: calc(100% + 10px); margin-left: -5px; margin-right: -5px; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-template-rows: repeat(3, auto); column-gap: 1px; row-gap: clamp(16px, 2.6dvh, 24px); padding: 6px 0; }\n\n    /* 关键修复：将 .bottle-slot 的宽度与高度严格锁定为 67:204 黄金比例，绝不因 max-height 截断导致瓶身变窄而垫子偏宽！ */\n    .bottle-slot {\n      --slot-max-h: clamp(132px, 24.5dvh, 186px);\n      position: relative;\n      width: min(100%, 62px, calc(var(--slot-max-h) * 67 / 204));\n      min-width: 0;\n      min-height: 0;\n      aspect-ratio: 67 / 204;\n      height: auto;\n      display: flex;\n      align-items: flex-end;\n      justify-content: center;\n      cursor: pointer;\n      transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s, opacity 0.25s;\n      will-change: transform;\n      z-index: 20;\n    }\n    /* 100% 借鉴原图 image_55d85b 的 3D 粗麻布编织软垫底座（采用与瓶身宽度严格绑定的百分比尺寸，任何屏幕下瓶底与软垫100%严丝合缝！） */\n    .burlap-coaster-pad {\n      position: absolute;\n      left: -10%;\n      right: -10%;\n      bottom: -7.2%;\n      height: 19.8%;\n      pointer-events: none;\n      z-index: 1;\n      transition: transform 0.24s ease, filter 0.24s ease;\n    }\n    .giant-cat-slot .burlap-coaster-pad {\n      left: -4%;\n      right: -4%;\n      bottom: -16px;\n      height: 52px;\n    }\n    .burlap-coaster-pad svg {\n      width: 100%;\n      height: 100%;\n      display: block;\n      overflow: visible;\n    }\n    /* 当瓶子被选中拿起时：采用弹簧阻尼物理曲线丝滑升空 + 微幅放大 + 柔和呼吸悬浮，软垫留在原位并自然卸力回弹 */\n    @keyframes selectedBottleFloat {\n      0%, 100% { transform: translateY(-22px) scale(1.035); }\n      50%      { transform: translateY(-25.5px) scale(1.042); }\n    }\n    @keyframes coasterLandingSquish {\n      0%   { transform: translateY(0) scale(1, 1); }\n      38%  { transform: translateY(2.2px) scale(1.045, 0.88); }\n      72%  { transform: translateY(-0.8px) scale(0.99, 1.02); }\n      100% { transform: translateY(0) scale(1, 1); }\n    }\n    @keyframes bottleLandingSettle {\n      0%   { transform: translateY(-22px) scale(1.035); }\n      62%  { transform: translateY(2.2px) scale(1.018, 0.975); }\n      84%  { transform: translateY(-1.2px) scale(0.995, 1.008); }\n      100% { transform: translateY(0) scale(1, 1); }\n    }\n    @keyframes bottleShuffleWave {\n      0%   { transform: translateY(0) scale(1) rotate(0deg); }\n      34%  { transform: translateY(-18px) scale(0.95, 1.05) rotate(-5deg); }\n      68%  { transform: translateY(3px) scale(1.03, 0.97) rotate(3deg); }\n      100% { transform: translateY(0) scale(1) rotate(0deg); }\n    }\n    @keyframes bottleUndoRewind {\n      0%   { transform: translateY(0) scale(1); }\n      35%  { transform: translateY(-10px) scale(0.96, 1.04); }\n      75%  { transform: translateY(2px) scale(1.02, 0.98); }\n      100% { transform: translateY(0) scale(1); }\n    }\n    .bottle-slot:not(.selected):not(.pouring-source):active .bottle-svg {\n      transform: translateY(2.5px) scale(1.025, 0.965);\n      transition: transform 0.09s ease-out;\n    }\n    .bottle-slot.selected {\n      transform: none;\n      z-index: 50;\n    }\n    .bottle-slot.selected .bottle-svg {\n      transform: translateY(-20px) scale(1.03);\n      filter: drop-shadow(0 14px 15px rgba(62, 34, 6, 0.34)) drop-shadow(0 0 9px rgba(255, 238, 155, 0.35));\n    }\n    .bottle-slot.selected .burlap-coaster-pad {\n      transform: translateY(-1.0px) scale(0.988, 1.015);\n    }\n    .bottle-slot.settling .burlap-coaster-pad {\n      animation: coasterLandingSquish 0.28s cubic-bezier(0.25, 0.96, 0.38, 1);\n    }\n    .bottle-slot.shuffle-wave-anim .bottle-svg {\n      animation: bottleShuffleWave 0.44s cubic-bezier(0.22, 1.28, 0.36, 1);\n    }\n    .bottle-slot.undo-rewind-anim .bottle-svg {\n      animation: bottleUndoRewind 0.34s cubic-bezier(0.22, 1.28, 0.36, 1);\n    }\n    .bottle-slot.selected .burlap-contact-ao,\n    .bottle-slot.pouring-source .burlap-contact-ao {\n      transform: scale(0.56);\n      opacity: 0.22;\n    }\n    .bottle-slot.pouring-source .burlap-coaster-pad {\n      opacity: 1 !important;\n    }\n    .bottles-grid.layout-21 .bottle-slot { --slot-max-h: clamp(112px, 19.2dvh, 156px); width: min(100%, 54px, calc(var(--slot-max-h) * 67 / 204)); }\n    .bottle-slot.bottle-removed { opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }\n    .bottle-slot.tall-8-slot { --slot-max-h: clamp(180px, 40dvh, 276px); width: min(100%, 64px, calc(var(--slot-max-h) * 70 / 298)); aspect-ratio: 70 / 298; height: auto; }\n    .bottle-slot.giant-cat-slot { --slot-max-h: clamp(198px, 42dvh, 296px); grid-column: 3 / 6; grid-row: 1 / 3; width: min(100%, 168px, calc(var(--slot-max-h) * 124 / 224)); aspect-ratio: 124 / 224; height: auto; align-self: center; z-index: 30; }\n    .bottle-slot.pouring-source { z-index: 100 !important; transition: none !important; filter: drop-shadow(0 10px 16px rgba(55, 30, 6, 0.34)); }\n    .bottle-slot.selected .bottle-ground-shadow,\n    .bottle-slot.hint-source-slot .bottle-ground-shadow,\n    .bottle-slot.pouring-source .bottle-ground-shadow { opacity: 0 !important; transition: opacity 0.25s ease; }\n    .bottle-ground-shadow { transition: opacity 0.25s ease; }\n    .bottle-slot.pouring-source .shoulder-sheen { opacity: 0.14 !important; }\n    .bottle-slot.pouring-source .capacity-tag-badge { opacity: 0 !important; transition: opacity 0.12s ease; }\n    .bottle-slot.pouring-target { z-index: 85 !important; }\n    .bottle-svg {\n      position: relative;\n      z-index: 2;\n      width: 100%;\n      height: 100%;\n      max-width: 100%;\n      max-height: 100%;\n      display: block;\n      overflow: visible;\n      transform-origin: 50% 92%;\n      transition: transform 0.26s cubic-bezier(0.22, 1.08, 0.36, 1), filter 0.24s ease;\n      will-change: transform, filter;\n    }\n    .bottle-slot.pouring-source .bottle-svg {\n      transition: none !important;\n      animation: none !important;\n    }\n\n    /* 舞台底部两侧的轻量辅助按钮：左【速度x2 / 速度升级】，右【主题商店】 */\n    .stage-float-group-left {\n      position: absolute;\n      bottom: 6px;\n      left: 4px;\n      z-index: 35;\n      display: flex;\n      align-items: flex-end;\n      gap: 8px;\n    }\n    .stage-float-btn {\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      cursor: pointer;\n      transition: transform 0.12s;\n    }\n    .stage-float-btn:active { transform: scale(0.92); }\n    .stage-float-btn.right {\n      position: absolute;\n      bottom: 6px;\n      right: 4px;\n      z-index: 35;\n    }\n    .stage-float-box {\n      position: relative;\n      width: 36px;\n      height: 30px;\n      border-radius: 9px;\n      background: linear-gradient(180deg, #ffffff 0%, #dbe5f5 100%);\n      border: 2px solid #45587a;\n      box-shadow: 0 3px 0 #2d3b54, 0 5px 10px rgba(0, 0, 0, 0.28), inset 0 2px 1px #ffffff;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n    }\n    .stage-float-btn.active-2x .stage-float-box {\n      background: linear-gradient(180deg, #fff176 0%, #fbc02d 55%, #f57f17 100%);\n      border-color: #5d2906;\n      box-shadow: 0 3px 0 #451b02, 0 5px 10px rgba(0, 0, 0, 0.32), inset 0 2px 1px #fffde7;\n    }\n    .stage-float-cam {\n      position: absolute;\n      top: -6px;\n      right: -8px;\n      background: #ffffff;\n      border: 1.5px solid #45587a;\n      border-radius: 5px;\n      padding: 1px 3px;\n      font-size: 8px;\n      line-height: 1;\n      color: #33415c;\n      font-weight: 900;\n      box-shadow: 0 1.5px 0 #2d3b54;\n    }\n    .stage-float-txt {\n      margin-top: 2px;\n      font-size: 11px;\n      font-weight: 900;\n      color: #ffffff;\n      -webkit-text-stroke: 3px #232d42;\n      paint-order: stroke fill;\n      text-shadow: 0 1.5px 0 #161d2b;\n      letter-spacing: 0.3px;\n    }\n\n    /* ==================== 4. 底部 4 枚原图级超椭圆 SVG 玻璃按钮栏（100%对标 image_55d85b 与用户 HTML） ==================== */\n    .bottom-dock-wrap {\n      width: auto;\n      max-width: 96vw;\n      margin: 2px auto calc(var(--safe-bottom) + 12px);\n      padding: 2px 12px 6px;\n      background: transparent;\n      border: none;\n      box-shadow: none;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      gap: clamp(11px, 3.0vw, 16px);\n      height: auto;\n      flex-shrink: 0;\n      position: relative;\n      z-index: 25;\n    }\n\n    /* 进关瓶子自然交错落定入场动画 */\n    @keyframes bottleStaggerEnter {\n      0% {\n        opacity: 0;\n        transform: translateY(32px) scale(0.90);\n      }\n      65% {\n        opacity: 1;\n        transform: translateY(-5px) scale(1.02);\n      }\n      85% {\n        transform: translateY(2px) scale(0.99);\n      }\n      100% {\n        opacity: 1;\n        transform: translateY(0) scale(1);\n      }\n    }\n    .bottle-slot.level-enter-anim {\n      animation: bottleStaggerEnter 0.50s cubic-bezier(0.22, 1.25, 0.36, 1) both;\n    }\n\n    .medallion-btn {\n      position: relative;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      cursor: pointer;\n      -webkit-tap-highlight-color: transparent;\n    }\n    .svg-btn-bottom {\n      width: clamp(62px, 8.6vh, 74px);\n      height: clamp(62px, 8.6vh, 74px);\n      display: block;\n      transition: transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.14s ease;\n    }\n    .medallion-btn:hover .svg-btn-bottom {\n      transform: translateY(-2px) scale(1.04);\n      filter: brightness(1.06);\n    }\n    .medallion-btn:active .svg-btn-bottom {\n      transform: translateY(1.5px) scale(0.95);\n      filter: brightness(0.96);\n    }\n    .medallion-label {\n      display: none !important;\n    }\n\n    /* 温润半透明暖金次数角标 */\n    .medallion-badge {\n      position: absolute;\n      top: -2px;\n      right: -2px;\n      bottom: auto;\n      min-width: 20px;\n      height: 20px;\n      padding: 0 5px;\n      border-radius: 10px;\n      background: linear-gradient(145deg, rgba(255, 248, 215, 0.94) 0%, rgba(235, 178, 62, 0.94) 100%);\n      border: 1.4px solid rgba(255, 255, 255, 0.9);\n      box-shadow: 0 3px 7px rgba(85, 48, 8, 0.26);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      font-size: 11px;\n      font-weight: 800;\n      color: #5a3812;\n      line-height: 1;\n      z-index: 6;\n    }\n\n    #fx-overlay {\n      position: fixed;\n      inset: 0;\n      width: 100vw;\n      height: 100dvh;\n      pointer-events: none;\n      z-index: 95;\n    }\n\n    /* 与晨曦流金弹窗一致的暖象牙香槟磨砂玻璃轻提示胶囊 */\n    .toast-msg {\n      position: fixed;\n      top: 14.5%;\n      left: 50%;\n      transform: translateX(-50%) translateY(-10px);\n      background: linear-gradient(155deg, rgba(255, 251, 240, 0.92) 0%, rgba(244, 229, 200, 0.92) 100%);\n      border: 1.5px solid rgba(255, 255, 255, 0.9);\n      color: #5c3d18;\n      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.75);\n      padding: 6px 16px 6px 10px;\n      border-radius: 999px;\n      font-size: 13px;\n      font-weight: 800;\n      letter-spacing: 0.3px;\n      backdrop-filter: blur(10px);\n      -webkit-backdrop-filter: blur(10px);\n      box-shadow:\n        0 8px 20px rgba(85, 48, 8, 0.22),\n        inset 0 1.5px 2px rgba(255, 255, 255, 0.92);\n      z-index: 220;\n      opacity: 0;\n      pointer-events: none;\n      display: inline-flex;\n      align-items: center;\n      gap: 8px;\n      transition: opacity 0.26s ease, transform 0.26s cubic-bezier(0.34, 1.56, 0.64, 1);\n      white-space: nowrap;\n      max-width: 92vw;\n    }\n    .toast-msg.show {\n      opacity: 1;\n      transform: translateX(-50%) translateY(0);\n    }\n    .toast-icon-orb {\n      width: 24px;\n      height: 24px;\n      border-radius: 50%;\n      background: radial-gradient(circle at 35% 28%, #fde68a 0%, #d97706 75%, #92400e 100%);\n      border: 1.2px solid rgba(255, 255, 255, 0.85);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      flex-shrink: 0;\n    }\n    .toast-text-span {\n      overflow: hidden;\n      text-overflow: ellipsis;\n    }\n\n    /* ==================== 5. 与主界面完全统一的【高定暖金香槟磨砂玻璃弹窗体系】 ==================== */\n    .modal-mask {\n      position: fixed;\n      inset: 0;\n      background: rgba(44, 30, 12, 0.0);\n      backdrop-filter: blur(0px);\n      -webkit-backdrop-filter: blur(0px);\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      z-index: 160;\n      opacity: 0;\n      visibility: hidden;\n      pointer-events: none;\n      transition:\n        opacity 0.30s cubic-bezier(0.22, 1, 0.36, 1),\n        background 0.30s cubic-bezier(0.22, 1, 0.36, 1),\n        backdrop-filter 0.30s cubic-bezier(0.22, 1, 0.36, 1),\n        -webkit-backdrop-filter 0.30s cubic-bezier(0.22, 1, 0.36, 1),\n        visibility 0s linear 0.30s;\n      padding: 14px;\n      perspective: 900px;\n    }\n    .modal-mask.show {\n      opacity: 1;\n      visibility: visible;\n      background: rgba(44, 30, 12, 0.48);\n      backdrop-filter: blur(11px);\n      -webkit-backdrop-filter: blur(11px);\n      pointer-events: auto;\n      transition:\n        opacity 0.30s cubic-bezier(0.22, 1, 0.36, 1),\n        background 0.30s cubic-bezier(0.22, 1, 0.36, 1),\n        backdrop-filter 0.30s cubic-bezier(0.22, 1, 0.36, 1),\n        -webkit-backdrop-filter 0.30s cubic-bezier(0.22, 1, 0.36, 1),\n        visibility 0s linear 0s;\n    }\n\n    /* 高定暖象牙磨砂玻璃卡片（带3D阻尼弹簧升起与内部元素级联入场） */\n    .casual-modal-card {\n      position: relative;\n      width: min(90vw, 352px);\n      background: linear-gradient(155deg, rgba(255, 251, 242, 0.94) 0%, rgba(244, 232, 208, 0.92) 100%);\n      backdrop-filter: blur(20px);\n      -webkit-backdrop-filter: blur(20px);\n      border: 2px solid rgba(255, 255, 255, 0.88);\n      border-radius: 28px;\n      padding: 36px 18px 22px;\n      text-align: center;\n      color: #5c3d18;\n      box-shadow:\n        0 20px 46px rgba(68, 38, 6, 0.32),\n        0 4px 12px rgba(68, 38, 6, 0.16),\n        inset 0 2px 3px rgba(255, 255, 255, 0.92),\n        inset 0 -3px 6px rgba(190, 150, 92, 0.22);\n      transform: translateY(24px) scale(0.86) rotateX(6deg);\n      opacity: 0;\n      transition:\n        transform 0.38s cubic-bezier(0.20, 1.34, 0.34, 1),\n        opacity 0.26s cubic-bezier(0.22, 1, 0.36, 1);\n      will-change: transform, opacity;\n    }\n    .modal-mask.show .casual-modal-card {\n      transform: translateY(0) scale(1) rotateX(0deg);\n      opacity: 1;\n    }\n    .pause-bottom-actions {\n      transform: translateY(18px) scale(0.92);\n      opacity: 0;\n      transition:\n        transform 0.40s cubic-bezier(0.20, 1.32, 0.34, 1) 0.06s,\n        opacity 0.28s ease 0.06s;\n    }\n    .modal-mask.show .pause-bottom-actions {\n      transform: translateY(0) scale(1);\n      opacity: 1;\n    }\n    /* 弹窗内子项级联浮入动画 */\n    @keyframes modalItemCascadeIn {\n      0%   { opacity: 0; transform: translateY(12px) scale(0.95); }\n      100% { opacity: 1; transform: translateY(0) scale(1); }\n    }\n    .modal-mask.show .pause-setting-row:nth-of-type(1) { animation: modalItemCascadeIn 0.34s cubic-bezier(0.22, 1.25, 0.36, 1) 0.03s both; }\n    .modal-mask.show .pause-setting-row:nth-of-type(2) { animation: modalItemCascadeIn 0.34s cubic-bezier(0.22, 1.25, 0.36, 1) 0.06s both; }\n    .modal-mask.show .pause-setting-row:nth-of-type(3) { animation: modalItemCascadeIn 0.34s cubic-bezier(0.22, 1.25, 0.36, 1) 0.09s both; }\n    .modal-mask.show .pause-setting-row:nth-of-type(4) { animation: modalItemCascadeIn 0.34s cubic-bezier(0.22, 1.25, 0.36, 1) 0.12s both; }\n    .modal-mask.show .pause-feature-btn:nth-child(1) { animation: modalItemCascadeIn 0.36s cubic-bezier(0.22, 1.32, 0.36, 1) 0.14s both; }\n    .modal-mask.show .pause-feature-btn:nth-child(2) { animation: modalItemCascadeIn 0.36s cubic-bezier(0.22, 1.32, 0.36, 1) 0.17s both; }\n    .modal-mask.show .pause-feature-btn:nth-child(3) { animation: modalItemCascadeIn 0.36s cubic-bezier(0.22, 1.32, 0.36, 1) 0.20s both; }\n    .modal-mask.show .pause-feature-btn:nth-child(4) { animation: modalItemCascadeIn 0.36s cubic-bezier(0.22, 1.32, 0.36, 1) 0.23s both; }\n    .modal-mask.show .win-scorecard { animation: modalItemCascadeIn 0.38s cubic-bezier(0.22, 1.25, 0.36, 1) 0.15s both; }\n    .pause-setting-row {\n      transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s ease;\n    }\n    .pause-setting-row:active {\n      transform: scale(0.985);\n    }\n    .casual-toggle-knob {\n      transition: left 0.26s cubic-bezier(0.22, 1.48, 0.36, 1), transform 0.18s ease !important;\n    }\n    .casual-toggle:active .casual-toggle-knob {\n      transform: scaleX(1.16) scaleY(0.92);\n    }\n    @keyframes levelCellWaveIn {\n      0%   { opacity: 0; transform: translateY(14px) scale(0.88); }\n      70%  { opacity: 1; transform: translateY(-2px) scale(1.02); }\n      100% { opacity: 1; transform: translateY(0) scale(1); }\n    }\n    .level-cell {\n      transition: transform 0.18s cubic-bezier(0.22, 1.35, 0.36, 1), box-shadow 0.18s ease, background 0.2s ease !important;\n    }\n    .level-cell:hover {\n      transform: translateY(-2px) scale(1.03);\n      box-shadow: 0 6px 12px rgba(95, 58, 14, 0.16);\n    }\n    .level-cell:active {\n      transform: translateY(1px) scale(0.93) !important;\n    }\n    .level-cell.wave-enter {\n      animation: levelCellWaveIn 0.34s cubic-bezier(0.22, 1.28, 0.36, 1) both;\n    }\n    .chapter-tab-btn {\n      transition: transform 0.18s cubic-bezier(0.22, 1.35, 0.36, 1), background 0.22s ease, color 0.2s ease, box-shadow 0.22s ease;\n    }\n    .chapter-tab-btn:active {\n      transform: scale(0.93);\n    }\n    .shop-item-card {\n      transition: transform 0.20s cubic-bezier(0.22, 1.35, 0.36, 1), box-shadow 0.20s ease, border-color 0.20s ease !important;\n    }\n    .shop-item-card:hover {\n      transform: translateY(-2.5px) scale(1.02);\n      box-shadow: 0 8px 18px rgba(95, 58, 14, 0.18), inset 0 2px 3px #ffffff;\n    }\n    .shop-item-card:active {\n      transform: translateY(1px) scale(0.95) !important;\n    }\n    .shop-item-card.active-theme {\n      border-color: #8aa858;\n      box-shadow: 0 6px 16px rgba(109, 140, 62, 0.24), inset 0 2px 3px #ffffff;\n    }\n    .shop-item-card.shop-wave-enter {\n      animation: levelCellWaveIn 0.36s cubic-bezier(0.22, 1.28, 0.36, 1) both;\n    }\n    @keyframes shopCheckPop {\n      0%   { transform: scale(0.2) rotate(-25deg); opacity: 0; }\n      70%  { transform: scale(1.18) rotate(6deg); opacity: 1; }\n      100% { transform: scale(1) rotate(0deg); opacity: 1; }\n    }\n    .shop-check-badge {\n      animation: shopCheckPop 0.34s cubic-bezier(0.22, 1.45, 0.36, 1) both;\n    }\n    @keyframes badgeBumpAnim {\n      0%   { transform: scale(1); }\n      40%  { transform: scale(1.28); }\n      100% { transform: scale(1); }\n    }\n    .medallion-badge.badge-bump {\n      animation: badgeBumpAnim 0.30s cubic-bezier(0.22, 1.5, 0.36, 1);\n    }\n\n    /* 高定流金磨砂玻璃标题胶囊（丝滑穹顶反光弧，无粗糙圆点） */\n    .casual-header-pill {\n      position: absolute;\n      top: -22px;\n      left: 50%;\n      transform: translateX(-50%);\n      min-width: 172px;\n      padding: 8px 28px 9px;\n      border-radius: 999px;\n      background: linear-gradient(165deg, #ebb252 0%, #d48e2c 55%, #b87318 100%);\n      border: 1.5px solid rgba(255, 255, 255, 0.78);\n      box-shadow:\n        0 8px 20px rgba(92, 50, 8, 0.28),\n        inset 0 2px 3px rgba(255, 255, 255, 0.75),\n        inset 0 -3px 6px rgba(95, 48, 5, 0.28);\n      font-size: 18px;\n      font-weight: 800;\n      color: #ffffff;\n      letter-spacing: 2px;\n      -webkit-text-stroke: 0px transparent;\n      text-shadow: 0 1.5px 0 rgba(115, 62, 8, 0.36), 0 2px 5px rgba(85, 45, 6, 0.28);\n      white-space: nowrap;\n      overflow: hidden;\n      z-index: 5;\n    }\n    .casual-header-pill::before {\n      content: \"\";\n      position: absolute;\n      top: 2px;\n      left: 10%;\n      right: 10%;\n      height: 42%;\n      border-radius: 999px;\n      background: linear-gradient(180deg, rgba(255, 255, 255, 0.46) 0%, rgba(255, 255, 255, 0) 100%);\n      pointer-events: none;\n    }\n\n    /* 高定磨砂玻璃关闭方钮（采用超椭圆 + 顶部柔和反光弧） */\n    .casual-close-btn {\n      position: absolute;\n      top: -12px;\n      right: -10px;\n      width: 36px;\n      height: 36px;\n      border-radius: 36%;\n      background: linear-gradient(155deg, #df8558 0%, #c46236 60%, #a84c24 100%);\n      border: 1.5px solid rgba(255, 255, 255, 0.82);\n      box-shadow:\n        0 6px 14px rgba(95, 42, 12, 0.26),\n        inset 0 2px 3px rgba(255, 255, 255, 0.68),\n        inset 0 -2px 5px rgba(80, 28, 8, 0.28);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      cursor: pointer;\n      z-index: 10;\n      overflow: hidden;\n      transition: transform 0.14s ease;\n    }\n    .casual-close-btn::before {\n      content: \"\";\n      position: absolute;\n      top: 3px;\n      left: 5px;\n      right: 5px;\n      height: 38%;\n      border-radius: 40% 40% 50% 50%;\n      background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 100%);\n      pointer-events: none;\n    }\n    .casual-close-btn svg {\n      filter: drop-shadow(0 1px 2px rgba(70, 24, 6, 0.35));\n    }\n    .casual-close-btn:active {\n      transform: scale(0.92);\n    }\n\n    /* 璀璨晨曦流金聚光灯展台（温暖明亮蜜金底色 + 羽化柔光神光旋转 + 3D流光底座，完美凸显琉璃瓶） */\n    .pastel-sunburst-box {\n      position: relative;\n      width: 100%;\n      height: 172px;\n      border-radius: 22px;\n      overflow: hidden;\n      background:\n        radial-gradient(circle at 50% 44%, rgba(255, 253, 242, 0.96) 0%, rgba(255, 236, 178, 0.92) 32%, rgba(238, 184, 92, 0.94) 70%, rgba(212, 142, 46, 0.96) 100%);\n      border: 2px solid rgba(255, 255, 255, 0.88);\n      margin-bottom: 12px;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      box-shadow:\n        inset 0 2px 10px rgba(255, 255, 255, 0.75),\n        inset 0 -8px 20px rgba(155, 88, 14, 0.26),\n        0 6px 16px rgba(110, 62, 10, 0.16);\n    }\n    /* 3D 舞台底部发光黄金聚光底座与两侧闪烁四角星芒 */\n    .pastel-sunburst-box::before {\n      content: \"\";\n      position: absolute;\n      bottom: 10px;\n      left: 50%;\n      transform: translateX(-50%);\n      width: 118px;\n      height: 22px;\n      border-radius: 50%;\n      background: radial-gradient(ellipse at center, rgba(255, 252, 225, 0.95) 0%, rgba(255, 215, 95, 0.55) 48%, rgba(185, 110, 20, 0) 76%);\n      box-shadow: 0 0 18px rgba(255, 230, 120, 0.85);\n      z-index: 1;\n      pointer-events: none;\n    }\n    .pastel-sunburst-box::after {\n      content: \"✦\";\n      position: absolute;\n      top: 18px;\n      right: 34px;\n      font-size: 20px;\n      color: #ffffff;\n      text-shadow: 0 0 10px #fde047, -148px 24px 0 #ffffff, -148px 24px 10px #fde047, -18px 98px 0 rgba(255,255,255,0.85), -132px 88px 0 rgba(255,248,190,0.9);\n      animation: stageSparkleTwinkle 2.4s ease-in-out infinite;\n      z-index: 1;\n      pointer-events: none;\n    }\n    @keyframes stageSparkleTwinkle {\n      0%, 100% { opacity: 0.65; transform: scale(0.92); }\n      50% { opacity: 1; transform: scale(1.12); }\n    }\n    /* 丝滑羽化无锯齿柔光旋转神光束 + 双层呼吸魔法光环 */\n    .pastel-sunburst-rays {\n      position: absolute;\n      width: 240%;\n      height: 240%;\n      left: -70%;\n      top: -70%;\n      background: conic-gradient(\n        from 0deg,\n        rgba(255, 255, 255, 0.45) 0deg,\n        rgba(255, 255, 255, 0.0) 15deg,\n        rgba(255, 248, 210, 0.42) 30deg,\n        rgba(255, 255, 255, 0.0) 45deg,\n        rgba(255, 255, 255, 0.45) 60deg,\n        rgba(255, 255, 255, 0.0) 75deg,\n        rgba(255, 248, 210, 0.42) 90deg,\n        rgba(255, 255, 255, 0.0) 105deg,\n        rgba(255, 255, 255, 0.45) 120deg,\n        rgba(255, 255, 255, 0.0) 135deg,\n        rgba(255, 248, 210, 0.42) 150deg,\n        rgba(255, 255, 255, 0.0) 165deg,\n        rgba(255, 255, 255, 0.45) 180deg,\n        rgba(255, 255, 255, 0.0) 195deg,\n        rgba(255, 248, 210, 0.42) 210deg,\n        rgba(255, 255, 255, 0.0) 225deg,\n        rgba(255, 255, 255, 0.45) 240deg,\n        rgba(255, 255, 255, 0.0) 255deg,\n        rgba(255, 248, 210, 0.42) 270deg,\n        rgba(255, 255, 255, 0.0) 285deg,\n        rgba(255, 255, 255, 0.45) 300deg,\n        rgba(255, 255, 255, 0.0) 315deg,\n        rgba(255, 248, 210, 0.42) 330deg,\n        rgba(255, 255, 255, 0.0) 345deg,\n        rgba(255, 255, 255, 0.45) 360deg\n      );\n      filter: blur(2.5px);\n      -webkit-mask-image: radial-gradient(circle at center, rgba(0,0,0,1) 12%, rgba(0,0,0,0.65) 34%, rgba(0,0,0,0) 56%);\n      mask-image: radial-gradient(circle at center, rgba(0,0,0,1) 12%, rgba(0,0,0,0.65) 34%, rgba(0,0,0,0) 56%);\n      animation: smoothGodRaysSpin 22s linear infinite;\n      pointer-events: none;\n    }\n    .pastel-sunburst-rays::after {\n      content: \"\";\n      position: absolute;\n      left: 50%;\n      top: 50%;\n      width: 118px;\n      height: 118px;\n      transform: translate(-50%, -50%);\n      border-radius: 50%;\n      border: 2px dashed rgba(255, 255, 255, 0.72);\n      box-shadow:\n        0 0 24px rgba(255, 245, 180, 0.85),\n        inset 0 0 18px rgba(255, 250, 210, 0.65);\n      pointer-events: none;\n    }\n    @keyframes smoothGodRaysSpin {\n      from { transform: rotate(0deg); }\n      to   { transform: rotate(360deg); }\n    }\n    .pastel-sunburst-content {\n      position: relative;\n      z-index: 2;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      animation: floatBounce 2.6s ease-in-out infinite;\n      /* 为展台内的琉璃水瓶赋予立体暖棕外廓光影，使透明玻璃瓶在明亮金光舞台上100%清晰立体 */\n      filter:\n        drop-shadow(0 0 2px rgba(125, 68, 10, 0.62))\n        drop-shadow(0 8px 14px rgba(115, 62, 8, 0.34));\n    }\n    @keyframes floatBounce {\n      0%, 100% { transform: translateY(0); }\n      50% { transform: translateY(-5px); }\n    }\n\n    /* 丝滑玻璃质感主按钮（去除左上粗糙斜椭圆点，采用全宽弧形顶部镜面高光 + 细腻立体内折射） */\n    .casual-green-btn {\n      position: relative;\n      display: inline-flex;\n      align-items: center;\n      justify-content: center;\n      gap: 9px;\n      min-width: 180px;\n      padding: 12px 30px 13px;\n      border-radius: 16px;\n      background: linear-gradient(165deg, #8fa963 0%, #76914c 52%, #5e7838 100%);\n      border: 1.5px solid rgba(255, 255, 255, 0.72);\n      box-shadow:\n        0 8px 18px rgba(58, 78, 24, 0.30),\n        inset 0 2px 3px rgba(255, 255, 255, 0.68),\n        inset 0 -3px 6px rgba(38, 52, 14, 0.28);\n      font-size: 17px;\n      font-weight: 800;\n      color: #ffffff;\n      letter-spacing: 1px;\n      -webkit-text-stroke: 0px transparent;\n      text-shadow: 0 1.5px 0 rgba(38, 55, 12, 0.38), 0 2px 5px rgba(36, 50, 12, 0.28);\n      cursor: pointer;\n      overflow: hidden;\n      transition: transform 0.14s ease, box-shadow 0.14s ease;\n    }\n    .casual-green-btn::before {\n      content: \"\";\n      position: absolute;\n      top: 3px;\n      left: 8px;\n      right: 8px;\n      width: auto;\n      height: 40%;\n      border-radius: 12px 12px 50% 50%;\n      background: linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 100%);\n      transform: none;\n      pointer-events: none;\n    }\n    .casual-green-btn svg {\n      filter: drop-shadow(0 1.5px 2px rgba(36, 50, 12, 0.35));\n      flex-shrink: 0;\n    }\n    .casual-green-btn:hover {\n      transform: translateY(-1px) scale(1.01);\n    }\n    .casual-green-btn:active {\n      transform: translateY(1px) scale(0.97);\n    }\n\n    /* 丝滑流金琥珀玻璃次按钮（与参考图 HTML .modal-btn 质感完全一致） */\n    .casual-cyan-btn {\n      position: relative;\n      display: inline-flex;\n      align-items: center;\n      justify-content: center;\n      gap: 8px;\n      min-width: 180px;\n      padding: 12px 30px 13px;\n      border-radius: 16px;\n      background: linear-gradient(165deg, #eba942 0%, #d48c28 54%, #b87316 100%);\n      border: 1.5px solid rgba(255, 255, 255, 0.72);\n      box-shadow:\n        0 8px 18px rgba(115, 65, 10, 0.28),\n        inset 0 2px 3px rgba(255, 255, 255, 0.68),\n        inset 0 -3px 6px rgba(90, 46, 6, 0.28);\n      font-size: 17px;\n      font-weight: 800;\n      color: #ffffff;\n      letter-spacing: 1px;\n      -webkit-text-stroke: 0px transparent;\n      text-shadow: 0 1.5px 0 rgba(110, 56, 6, 0.38), 0 2px 5px rgba(85, 45, 6, 0.28);\n      cursor: pointer;\n      overflow: hidden;\n      transition: transform 0.14s ease, box-shadow 0.14s ease;\n    }\n    .casual-cyan-btn::before {\n      content: \"\";\n      position: absolute;\n      top: 3px;\n      left: 8px;\n      right: 8px;\n      width: auto;\n      height: 40%;\n      border-radius: 12px 12px 50% 50%;\n      background: linear-gradient(180deg, rgba(255, 255, 255, 0.42) 0%, rgba(255, 255, 255, 0) 100%);\n      transform: none;\n      pointer-events: none;\n    }\n    .casual-cyan-btn:hover {\n      transform: translateY(-1px) scale(1.01);\n    }\n    .casual-cyan-btn:active {\n      transform: translateY(1px) scale(0.97);\n    }\n\n    /* 设置弹窗的 4 行亚麻暖沙凹槽栏与温润拨动开关 */\n    .pause-setting-row {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      background: rgba(232, 215, 185, 0.52);\n      border: 1.5px solid rgba(255, 255, 255, 0.78);\n      border-radius: 16px;\n      padding: 9px 14px;\n      margin-bottom: 9px;\n      box-shadow:\n        inset 0 2px 4px rgba(138, 96, 42, 0.12),\n        0 1.5px 0 rgba(255, 255, 255, 0.7);\n    }\n    .pause-setting-left {\n      display: flex;\n      align-items: center;\n      gap: 10px;\n      font-size: 16px;\n      font-weight: 800;\n      color: #5c3d18;\n      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);\n    }\n    .pause-setting-left svg {\n      stroke: #7c5224 !important;\n      filter: drop-shadow(0 1px 1px rgba(255, 255, 255, 0.6));\n    }\n\n    .casual-toggle {\n      position: relative;\n      width: 74px;\n      height: 34px;\n      border-radius: 17px;\n      background: linear-gradient(180deg, #cbb89d 0%, #d8c8b0 100%);\n      border: 1.6px solid rgba(255, 255, 255, 0.82);\n      box-shadow:\n        inset 0 2.5px 4px rgba(92, 62, 24, 0.24),\n        0 1.5px 0 rgba(255, 255, 255, 0.8);\n      cursor: pointer;\n      transition: all 0.2s ease;\n    }\n    .casual-toggle.on {\n      background: linear-gradient(145deg, #8aa858 0%, #6d8c3e 100%);\n      border-color: rgba(255, 255, 255, 0.88);\n      box-shadow:\n        inset 0 2px 4px rgba(42, 60, 14, 0.28),\n        0 1.5px 0 rgba(255, 255, 255, 0.8);\n    }\n    .casual-toggle-knob {\n      position: absolute;\n      top: 2px;\n      left: 2.5px;\n      width: 26px;\n      height: 26px;\n      border-radius: 50%;\n      background: radial-gradient(circle at 38% 30%, #ffffff 0%, #fdfaf3 70%, #efe4d0 100%);\n      border: 1.5px solid rgba(255, 255, 255, 0.95);\n      box-shadow:\n        0 2px 5px rgba(72, 45, 12, 0.28),\n        inset 0 1.5px 2px #ffffff;\n      transition: left 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);\n    }\n    .casual-toggle.on .casual-toggle-knob {\n      left: 42px;\n    }\n    .casual-toggle-check {\n      position: absolute;\n      top: 50%;\n      transform: translateY(-50%);\n      font-size: 14px;\n      font-weight: 900;\n    }\n    .casual-toggle.on .casual-toggle-check {\n      left: 12px;\n      color: #ffffff;\n    }\n    .casual-toggle:not(.on) .casual-toggle-check {\n      right: 12px;\n      color: #7c684e;\n    }\n\n    .pause-bottom-actions {\n      margin-top: 14px;\n      width: min(90vw, 352px);\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      gap: 12px;\n    }\n    .pause-mid-row {\n      width: 100%;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      gap: 12px;\n    }\n    /* 底部弹窗磨砂玻璃方钮（与主界面磨砂玻璃圆角方框风格完全统一） */\n    .casual-square-btn {\n      position: relative;\n      width: 62px;\n      height: 58px;\n      border-radius: 18px;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      cursor: pointer;\n      transition: transform 0.12s;\n      font-size: 12px;\n      font-weight: 800;\n      color: #ffffff;\n      backdrop-filter: blur(12px);\n      -webkit-backdrop-filter: blur(12px);\n      -webkit-text-stroke: 0px transparent;\n      text-shadow: 0 1.5px 3px rgba(75, 40, 8, 0.38);\n    }\n    .casual-square-btn::before {\n      content: \"\";\n      position: absolute;\n      top: 3px;\n      left: 6px;\n      right: 6px;\n      width: auto;\n      height: 38%;\n      border-radius: 38% 38% 50% 50%;\n      background: linear-gradient(180deg, rgba(255, 255, 255, 0.44) 0%, rgba(255, 255, 255, 0) 100%);\n      transform: none;\n      pointer-events: none;\n    }\n    .casual-square-btn:active { transform: translateY(2px) scale(0.94); }\n    .casual-square-btn.yellow {\n      background: linear-gradient(145deg, rgba(232, 165, 68, 0.88) 0%, rgba(198, 125, 32, 0.92) 100%);\n      border: 1.8px solid rgba(255, 255, 255, 0.84);\n      box-shadow:\n        0 6px 14px rgba(92, 52, 10, 0.25),\n        inset 0 2px 3px rgba(255, 255, 255, 0.65);\n    }\n    .casual-square-btn.pink {\n      background: linear-gradient(145deg, rgba(216, 122, 82, 0.88) 0%, rgba(182, 85, 48, 0.92) 100%);\n      border: 1.8px solid rgba(255, 255, 255, 0.84);\n      box-shadow:\n        0 6px 14px rgba(92, 42, 14, 0.25),\n        inset 0 2px 3px rgba(255, 255, 255, 0.65);\n    }\n\n    /* 商店专属：与高定暖金磨砂弹窗统一 */\n    .shop-modal-card {\n      padding-top: 38px;\n    }\n    .shop-awning-header {\n      display: none;\n    }\n    .shop-grid {\n      display: grid;\n      grid-template-columns: repeat(2, 1fr);\n      gap: 10px;\n      max-height: min(50dvh, 330px);\n      overflow-y: auto;\n      scrollbar-width: none;\n      padding: 4px 2px 6px;\n    }\n    .shop-grid::-webkit-scrollbar { display: none; }\n    .shop-item-card {\n      background: linear-gradient(155deg, rgba(255, 255, 255, 0.78) 0%, rgba(242, 228, 202, 0.72) 100%);\n      border: 1.8px solid rgba(255, 255, 255, 0.9);\n      outline: none;\n      border-radius: 18px;\n      padding: 11px 10px 9px;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      gap: 6px;\n      box-shadow:\n        0 4px 12px rgba(95, 58, 14, 0.12),\n        inset 0 2px 3px #ffffff;\n      cursor: pointer;\n      transition: transform 0.12s;\n    }\n    .shop-item-card:active { transform: scale(0.96); }\n    .shop-swatch {\n      position: relative;\n      width: 64px;\n      height: 58px;\n      border-radius: 14px;\n      border: 2px solid rgba(255, 255, 255, 0.92);\n      box-shadow:\n        0 3px 8px rgba(72, 42, 10, 0.18),\n        inset 0 2px 3px rgba(255, 255, 255, 0.48);\n      overflow: visible;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n    }\n    .shop-swatch-inner {\n      width: 100%;\n      height: 100%;\n      border-radius: 11.5px;\n      overflow: hidden;\n      position: relative;\n    }\n    .shop-check-badge {\n      position: absolute;\n      top: -8px;\n      right: -10px;\n      width: 28px;\n      height: 26px;\n      z-index: 4;\n      filter: drop-shadow(0 2px 3px rgba(0, 0, 0, 0.22));\n    }\n    .shop-item-name {\n      font-size: 14px;\n      font-weight: 800;\n      color: #5c3d18;\n    }\n    .shop-action-btn {\n      width: 100%;\n      padding: 6px 0;\n      border-radius: 11px;\n      font-size: 12.5px;\n      font-weight: 800;\n      color: #ffffff;\n      cursor: pointer;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      gap: 4px;\n      -webkit-text-stroke: 0px transparent;\n      transition: transform 0.12s;\n    }\n    .shop-action-btn.in-use {\n      background: linear-gradient(145deg, #8aa858 0%, #6d8c3e 100%);\n      border: 1.5px solid rgba(255, 255, 255, 0.85);\n      box-shadow: 0 3px 8px rgba(68, 88, 28, 0.22);\n    }\n    .shop-action-btn.unlock-gold {\n      background: linear-gradient(145deg, #e5a344 0%, #c88022 100%);\n      border: 1.5px solid rgba(255, 255, 255, 0.85);\n      box-shadow: 0 3px 8px rgba(110, 62, 10, 0.22);\n    }\n\n    /* 速度升级弹窗 */\n    .speed-level-title {\n      font-size: 18px;\n      font-weight: 800;\n      color: #5c3d18;\n      -webkit-text-stroke: 0px transparent;\n      text-shadow: none;\n      margin-bottom: 7px;\n      letter-spacing: 0.6px;\n    }\n    .speed-level-title span {\n      color: #c87816;\n      font-weight: 900;\n    }\n    .speed-prog-bar {\n      position: relative;\n      width: 88%;\n      height: 20px;\n      margin: 0 auto 12px;\n      background: rgba(218, 198, 168, 0.65);\n      border: 1.5px solid rgba(255, 255, 255, 0.85);\n      border-radius: 10px;\n      overflow: hidden;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      box-shadow: inset 0 2px 4px rgba(95, 62, 20, 0.18);\n    }\n    .speed-prog-fill {\n      position: absolute;\n      left: 0;\n      top: 0;\n      bottom: 0;\n      width: 0%;\n      background: linear-gradient(90deg, #8aa858 0%, #a3be6c 100%);\n      border-radius: 9px;\n      transition: width 0.3s ease;\n    }\n    .speed-prog-txt {\n      position: relative;\n      z-index: 2;\n      font-size: 11.5px;\n      font-weight: 800;\n      color: #5c3d18;\n      -webkit-text-stroke: 0px transparent;\n      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);\n    }\n    .speed-cur-line {\n      font-size: 16px;\n      font-weight: 800;\n      color: #5c3d18;\n      margin-bottom: 12px;\n      letter-spacing: 0.5px;\n    }\n    .speed-cur-line b {\n      color: #c87816;\n      font-size: 20px;\n      margin: 0 4px;\n    }\n    .speed-foot-tip {\n      background: rgba(232, 215, 185, 0.52);\n      border-top: 1.5px solid rgba(255, 255, 255, 0.75);\n      border-radius: 0 0 26px 26px;\n      margin: 0 -18px -22px;\n      padding: 10px 0 12px;\n      font-size: 12.5px;\n      font-weight: 800;\n      color: #7c582c;\n    }\n\n    /* 200关选关面板与通关结算卡片（高定暖金亚麻配色） */\n    .chapter-tabs {\n      display: grid;\n      grid-template-columns: repeat(5, minmax(0, 1fr));\n      gap: 5px;\n      margin: 4px 0 10px;\n    }\n    .chapter-tab-btn {\n      min-width: 0;\n      padding: 6px 2px;\n      border-radius: 11px;\n      background: rgba(235, 220, 192, 0.65);\n      border: 1.5px solid rgba(255, 255, 255, 0.82);\n      color: #6e491e;\n      font-size: 10.5px;\n      font-weight: 800;\n      cursor: pointer;\n      white-space: nowrap;\n      overflow: hidden;\n      text-overflow: ellipsis;\n    }\n    .chapter-tab-btn.active {\n      background: linear-gradient(145deg, #e29f42 0%, #c47e22 100%);\n      border-color: rgba(255, 255, 255, 0.9);\n      box-shadow: 0 3px 8px rgba(112, 62, 10, 0.24);\n      color: #ffffff;\n    }\n    .level-grid-scroll {\n      max-height: min(46dvh, 300px);\n      overflow-y: auto;\n      overflow-x: hidden;\n      scrollbar-width: none;\n      padding: 2px 2px 6px;\n      margin-bottom: 10px;\n      display: grid;\n      grid-template-columns: repeat(4, minmax(0, 1fr));\n      gap: 7px;\n    }\n    .level-grid-scroll::-webkit-scrollbar { display: none; }\n    .level-cell {\n      min-width: 0;\n      overflow: hidden;\n      padding: 8px 4px 6px;\n      border-radius: 14px;\n      background: rgba(255, 255, 255, 0.72);\n      border: 1.5px solid rgba(255, 255, 255, 0.92);\n      box-shadow: 0 3px 8px rgba(95, 58, 14, 0.10);\n      cursor: pointer;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      gap: 2px;\n      transition: transform 0.12s;\n    }\n    .level-cell:active { transform: scale(0.94); }\n    .level-cell.active {\n      background: linear-gradient(145deg, #8aa858 0%, #6d8c3e 100%);\n      border-color: rgba(255, 255, 255, 0.95);\n      color: #ffffff;\n      box-shadow: 0 4px 10px rgba(68, 88, 28, 0.25);\n    }\n    .level-cell.boss-cell {\n      background: rgba(254, 240, 215, 0.88);\n      border-color: #eab308;\n    }\n    .level-cell-num { font-size: 13px; font-weight: 800; color: #5c3d18; }\n    .level-cell.active .level-cell-num { color: #ffffff; }\n    .level-cell-tag { font-size: 9.5px; font-weight: 800; color: #b46914; white-space: nowrap; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }\n    .level-cell.active .level-cell-tag { color: #fef08a; }\n    .level-cell-wave { font-size: 8.5px; color: #d97706; letter-spacing: -0.5px; }\n\n    .win-scorecard {\n      display: grid;\n      grid-template-columns: 1fr 1px 1fr 1px 1fr;\n      align-items: center;\n      background: rgba(235, 220, 192, 0.52);\n      border: 1.5px solid rgba(255, 255, 255, 0.82);\n      border-radius: 18px;\n      padding: 10px 6px;\n      margin-bottom: 10px;\n      box-shadow: inset 0 2px 4px rgba(138, 96, 42, 0.12);\n    }\n    .score-divider { width: 1px; height: 32px; background: rgba(180, 145, 95, 0.35); }\n    .score-col-label { font-size: 11px; font-weight: 800; color: #7c582c; margin-bottom: 2px; }\n    .score-col-val { font-size: 18px; font-weight: 900; color: #5c3d18; }\n    .score-col-val.cyan { color: #5f8033; }\n    .score-col-val.amber { color: #c87816; }\n\n    /* 通关弹窗专属：3D金杯与三颗金星依次弹入庆典动效 */\n    .win-celebration-hero {\n      position: relative;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      margin: 4px 0 12px;\n      padding: 12px 10px 10px;\n      border-radius: 20px;\n      background:\n        radial-gradient(circle at 50% 45%, rgba(255, 232, 140, 0.42) 0%, rgba(235, 195, 115, 0.14) 60%, transparent 85%);\n    }\n    .win-stars-row {\n      display: flex;\n      align-items: flex-end;\n      justify-content: center;\n      gap: 10px;\n      margin-bottom: 4px;\n    }\n    .win-star-item {\n      opacity: 0;\n      transform: scale(0.2) rotate(-25deg);\n      filter: drop-shadow(0 4px 10px rgba(215, 130, 12, 0.42));\n    }\n    .modal-mask.show .win-star-item.s1 {\n      animation: winStarPopIn 0.52s cubic-bezier(0.34, 1.56, 0.64, 1) 0.08s forwards;\n    }\n    .modal-mask.show .win-star-item.s2 {\n      animation: winStarPopInCenter 0.58s cubic-bezier(0.34, 1.56, 0.64, 1) 0.22s forwards;\n    }\n    .modal-mask.show .win-star-item.s3 {\n      animation: winStarPopIn 0.52s cubic-bezier(0.34, 1.56, 0.64, 1) 0.36s forwards;\n    }\n    @keyframes winStarPopIn {\n      0%   { opacity: 0; transform: scale(0.2) rotate(-25deg) translateY(12px); }\n      70%  { opacity: 1; transform: scale(1.15) rotate(6deg) translateY(-2px); }\n      100% { opacity: 1; transform: scale(1) rotate(0deg) translateY(0); }\n    }\n    @keyframes winStarPopInCenter {\n      0%   { opacity: 0; transform: scale(0.2) translateY(16px); }\n      70%  { opacity: 1; transform: scale(1.26) translateY(-6px); }\n      100% { opacity: 1; transform: scale(1.14) translateY(-4px); }\n    }\n    .win-trophy-wrap {\n      animation: winTrophyFloat 2.4s ease-in-out infinite;\n      filter: drop-shadow(0 8px 16px rgba(145, 82, 12, 0.32));\n    }\n    @keyframes winTrophyFloat {\n      0%, 100% { transform: translateY(0) scale(1); }\n      50% { transform: translateY(-5px) scale(1.04); }\n    }\n    @keyframes winNextBtnPulse {\n      0%, 100% { transform: scale(1); box-shadow: 0 8px 18px rgba(58, 78, 24, 0.30), inset 0 2px 3px rgba(255, 255, 255, 0.68); }\n      50% { transform: scale(1.03); box-shadow: 0 10px 24px rgba(82, 118, 32, 0.45), 0 0 16px rgba(163, 210, 92, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.82); }\n    }\n    .modal-mask.show #modal-next-btn {\n      animation: winNextBtnPulse 2.0s ease-in-out infinite;\n    }\n\n\n    @media (max-height: 700px) {\n      .bags-stage { height: 104px; }\n      .bottles-grid { row-gap: clamp(28px, 4.8dvh, 40px); }\n      .bottles-grid.layout-21 { row-gap: clamp(6px, 1.2dvh, 12px); }\n      .bottom-dock-wrap { padding: 2px 16px 20px; margin-bottom: 6px; }\n    }\n\n    @keyframes bombPulseAnim {\n      0%, 100% { transform: translate(50px, 84px) scale(1); }\n      50% { transform: translate(50px, 84px) scale(1.14); }\n    }\n    .bomb-badge-danger {\n      animation: bombPulseAnim 0.65s infinite ease-in-out;\n    }\n\n    .pause-feature-bar {\n      display: grid;\n      grid-template-columns: repeat(4, 1fr);\n      gap: 8px;\n      margin-top: 4px;\n    }\n    .pause-feature-btn {\n      background: linear-gradient(155deg, rgba(255, 255, 255, 0.78) 0%, rgba(242, 228, 202, 0.70) 100%);\n      border: 1.5px solid rgba(255, 255, 255, 0.90);\n      border-radius: 16px;\n      padding: 8px 4px 6px;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      gap: 4px;\n      cursor: pointer;\n      box-shadow: 0 4px 10px rgba(95, 58, 14, 0.12), inset 0 1.5px 2px #ffffff;\n      transition: transform 0.12s;\n    }\n    .pause-feature-btn:active {\n      transform: translateY(2px) scale(0.95);\n    }\n    .pause-feature-btn.active-2x {\n      background: linear-gradient(145deg, #f7df94 0%, #e5b346 100%);\n      border-color: #ffffff;\n    }\n    .pause-feature-icon {\n      width: 34px;\n      height: 28px;\n      border-radius: 10px;\n      background: rgba(255, 255, 255, 0.85);\n      border: 1.2px solid rgba(218, 195, 158, 0.65);\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      box-shadow: 0 2px 4px rgba(95, 58, 14, 0.08);\n    }\n    .pause-feature-label {\n      font-size: 12px;\n      font-weight: 800;\n      color: #5c3d18;\n    }\n\n    .bottle-slot.hint-source-slot {\n      z-index: 65;\n    }\n    .bottle-slot.hint-source-slot .bottle-svg {\n      transform: translateY(-20px) scale(1.03);\n      filter: drop-shadow(0 0 11px rgba(250, 204, 21, 0.88)) drop-shadow(0 14px 15px rgba(68, 38, 8, 0.34));\n    }\n    .bottle-slot.hint-target-slot {\n      filter: drop-shadow(0 0 12px rgba(56, 189, 248, 0.95)) drop-shadow(0 8px 12px rgba(0, 0, 0, 0.55));\n      animation: hintTargetPulse 1.1s infinite ease-in-out;\n      z-index: 60;\n    }\n    @keyframes hintTargetPulse {\n      0%, 100% { transform: translateY(0) scale(1); }\n      50% { transform: translateY(-6px) scale(1.04); }\n    }\n    @keyframes hintArrowDash {\n      to { stroke-dashoffset: -28; }\n    }\n\n    /* 瓶身受阻轻盈Q弹摇晃（去除导致图层闪烁的红色滤镜突变，仅保留顺滑物理摇晃） */\n    @keyframes bottleRejectShakeAnim {\n      0%, 100% { transform: translateX(0) rotate(0deg); }\n      20% { transform: translateX(-5.5px) rotate(-3.2deg); }\n      40% { transform: translateX(5.5px) rotate(3.2deg); }\n      60% { transform: translateX(-3.8px) rotate(-2.0deg); }\n      80% { transform: translateX(2.8px) rotate(1.4deg); }\n    }\n    .bottle-slot.bottle-reject-shake {\n      animation: bottleRejectShakeAnim 0.38s cubic-bezier(0.36, 0.07, 0.19, 0.97);\n      z-index: 90 !important;\n    }\n    .bottle-slot.color-lock-match {\n      filter: drop-shadow(0 0 11px rgba(74, 222, 128, 0.92)) !important;\n    }\n    .bottle-slot.color-lock-mismatch {\n      opacity: 0.88;\n    }\n    /* 与晨曦流金磨砂玻璃主题完全统一的瓶顶轻提示气泡（暖琥珀香槟磨砂玻璃质感） */\n    .bottle-reject-callout {\n      position: absolute;\n      top: -22px;\n      left: 50%;\n      transform: translateX(-50%);\n      background: linear-gradient(160deg, rgba(255, 252, 242, 0.97) 0%, rgba(245, 228, 195, 0.97) 100%);\n      border: 1.8px solid rgba(255, 255, 255, 0.96);\n      border-radius: 999px;\n      padding: 5px 13px;\n      font-size: 13.5px;\n      font-weight: 900;\n      color: #5c3d18;\n      letter-spacing: 0.3px;\n      text-shadow: 0 1px 0 rgba(255, 255, 255, 0.8);\n      white-space: nowrap;\n      pointer-events: none;\n      z-index: 110;\n      display: inline-flex;\n      align-items: center;\n      gap: 4px;\n      backdrop-filter: blur(8px);\n      -webkit-backdrop-filter: blur(8px);\n      box-shadow:\n        0 6px 14px rgba(92, 52, 10, 0.24),\n        inset 0 1.5px 2px rgba(255, 255, 255, 0.95),\n        inset 0 -2px 4px rgba(188, 145, 82, 0.22);\n      animation: bottleCalloutPop 1.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;\n    }\n    .bottle-reject-callout::after {\n      content: \"\";\n      position: absolute;\n      bottom: -5px;\n      left: 50%;\n      transform: translateX(-50%);\n      border-width: 5px 5px 0 5px;\n      border-style: solid;\n      border-color: rgba(242, 225, 192, 0.96) transparent transparent transparent;\n      filter: drop-shadow(0 1px 1px rgba(92, 52, 10, 0.18));\n    }\n    @keyframes bottleCalloutPop {\n      0%   { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.65); }\n      16%  { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1.08); }\n      28%  { opacity: 1; transform: translateX(-50%) translateY(0px) scale(1); }\n      78%  { opacity: 1; transform: translateX(-50%) translateY(-2px) scale(1); }\n      100% { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.9); }\n    }\n\n    /* ==================== 100% 复刻参考图2 (IMG_6674) 的无边框悬浮舞台式【解锁新玩法】庆典层 ==================== */\n    #mechanic-modal-mask {\n      background: radial-gradient(circle at 50% 44%, rgba(42, 30, 18, 0.68) 0%, rgba(12, 9, 18, 0.84) 100%);\n      backdrop-filter: blur(7px);\n      -webkit-backdrop-filter: blur(7px);\n      cursor: pointer;\n    }\n    .mech-ceremony-wrap {\n      position: relative;\n      width: min(94vw, 390px);\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      padding: 10px 8px 6px;\n      transform: scale(0.86);\n      transition: transform 0.34s cubic-bezier(0.34, 1.56, 0.64, 1);\n      pointer-events: none;\n    }\n    #mechanic-modal-mask.show .mech-ceremony-wrap {\n      transform: scale(1);\n    }\n    .mech-ribbon-header {\n      position: relative;\n      width: min(92vw, 356px);\n      height: 112px;\n      margin-bottom: -8px;\n      z-index: 6;\n      filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.42));\n      animation: mechRibbonFloat 3s ease-in-out infinite;\n    }\n    @keyframes mechRibbonFloat {\n      0%, 100% { transform: translateY(0); }\n      50% { transform: translateY(-4px); }\n    }\n    .mech-open-spotlight {\n      position: relative;\n      width: 280px;\n      height: 256px;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      margin: 0 auto;\n      z-index: 4;\n    }\n    /* 图2同款：开放式暖金放射神光束（无方框边界，自然向四周羽化消融） */\n    .mech-open-rays {\n      position: absolute;\n      width: 320px;\n      height: 320px;\n      left: 50%;\n      top: 50%;\n      margin-left: -160px;\n      margin-top: -160px;\n      background: conic-gradient(\n        from 0deg,\n        rgba(255, 238, 155, 0.55) 0deg,\n        rgba(255, 238, 155, 0.0) 14deg,\n        rgba(255, 215, 95, 0.42) 28deg,\n        rgba(255, 238, 155, 0.0) 44deg,\n        rgba(255, 238, 155, 0.58) 60deg,\n        rgba(255, 238, 155, 0.0) 76deg,\n        rgba(255, 215, 95, 0.42) 92deg,\n        rgba(255, 238, 155, 0.0) 108deg,\n        rgba(255, 238, 155, 0.55) 124deg,\n        rgba(255, 238, 155, 0.0) 140deg,\n        rgba(255, 215, 95, 0.45) 156deg,\n        rgba(255, 238, 155, 0.0) 172deg,\n        rgba(255, 238, 155, 0.55) 188deg,\n        rgba(255, 238, 155, 0.0) 204deg,\n        rgba(255, 215, 95, 0.42) 220deg,\n        rgba(255, 238, 155, 0.0) 236deg,\n        rgba(255, 238, 155, 0.58) 252deg,\n        rgba(255, 238, 155, 0.0) 268deg,\n        rgba(255, 215, 95, 0.42) 284deg,\n        rgba(255, 238, 155, 0.0) 300deg,\n        rgba(255, 238, 155, 0.55) 316deg,\n        rgba(255, 238, 155, 0.0) 332deg,\n        rgba(255, 215, 95, 0.45) 348deg,\n        rgba(255, 238, 155, 0.0) 360deg\n      );\n      -webkit-mask-image: radial-gradient(circle at center, rgba(0,0,0,1) 8%, rgba(0,0,0,0.75) 36%, rgba(0,0,0,0) 68%);\n      mask-image: radial-gradient(circle at center, rgba(0,0,0,1) 8%, rgba(0,0,0,0.75) 36%, rgba(0,0,0,0) 68%);\n      animation: smoothGodRaysSpin 20s linear infinite;\n      pointer-events: none;\n    }\n    .mech-open-glow-core {\n      position: absolute;\n      width: 210px;\n      height: 210px;\n      border-radius: 50%;\n      background: radial-gradient(circle, rgba(255, 244, 175, 0.72) 0%, rgba(255, 204, 72, 0.28) 46%, rgba(255, 180, 30, 0) 74%);\n      pointer-events: none;\n    }\n    .mech-sparkles-layer {\n      position: absolute;\n      inset: 0;\n      pointer-events: none;\n      z-index: 3;\n      animation: stageSparkleTwinkle 2.2s ease-in-out infinite;\n    }\n    .mech-bottle-hero {\n      position: relative;\n      z-index: 5;\n      width: 88px;\n      height: 196px;\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.55)) drop-shadow(0 0 16px rgba(255, 230, 120, 0.45));\n      animation: floatBounce 2.6s ease-in-out infinite;\n    }\n    /* 图2同款：水瓶下方圆润白点指示器 */\n    .mech-carousel-dot {\n      width: 9px;\n      height: 9px;\n      border-radius: 50%;\n      background: #ffffff;\n      box-shadow: 0 0 8px rgba(255, 255, 255, 0.9);\n      margin: 2px 0 14px;\n      z-index: 6;\n    }\n    /* 图2同款：双层金边米白横幅说明条 */\n    .mech-scroll-pill {\n      position: relative;\n      width: min(88vw, 336px);\n      padding: 13px 20px;\n      border-radius: 999px;\n      background: linear-gradient(180deg, #fffdf7 0%, #f9f1df 100%);\n      border: 3.5px solid #f3b14b;\n      outline: 2px solid #a86414;\n      box-shadow:\n        0 8px 22px rgba(0, 0, 0, 0.42),\n        inset 0 2px 4px #ffffff,\n        inset 0 -3px 6px rgba(215, 155, 65, 0.28);\n      font-size: 15px;\n      font-weight: 800;\n      color: #9c5816;\n      line-height: 1.45;\n      text-align: center;\n      letter-spacing: 0.4px;\n      z-index: 6;\n    }\n    .mech-scroll-pill b {\n      color: #c2410c;\n      font-weight: 900;\n    }\n    /* 图2同款：底部「点击任意位置继续」呼吸文字 */\n    .mech-tap-anywhere {\n      margin-top: 26px;\n      font-size: 16px;\n      font-weight: 800;\n      color: #ffffff;\n      letter-spacing: 1px;\n      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.65);\n      animation: tapContinuePulse 1.8s ease-in-out infinite;\n      z-index: 6;\n    }\n    @keyframes tapContinuePulse {\n      0%, 100% { opacity: 0.68; transform: scale(0.98); }\n      50% { opacity: 1; transform: scale(1.03); }\n    }\n\n\n    /* ==================== 纯 Canvas 2D 跨平台渲染引擎（微信小游戏 / 抖音小游戏 / TapTap 100% 视觉无损版） ==================== */\n    #pure-game-canvas {\n      position: fixed;\n      inset: 0;\n      width: 100vw;\n      height: 100dvh;\n      display: block;\n      z-index: 9999;\n      touch-action: none;\n      user-select: none;\n      -webkit-user-select: none;\n      cursor: default;\n    }\n    body.pure-canvas-mode .ambient-glow,\n    body.pure-canvas-mode #bg-star-canvas,\n    body.pure-canvas-mode .app-shell,\n    body.pure-canvas-mode #fx-overlay,\n    body.pure-canvas-mode #toast-msg,\n    body.pure-canvas-mode .modal-mask {\n      opacity: 0 !important;\n      pointer-events: none !important;\n      z-index: -1 !important;\n    }\n    body.pure-canvas-mode .bottle-slot,\n    body.pure-canvas-mode .bottle-slot.selected,\n    body.pure-canvas-mode .bottle-slot.settling,\n    body.pure-canvas-mode .bottle-slot.level-enter-anim,\n    body.pure-canvas-mode .bag-slot {\n      transform: none !important;\n      animation: none !important;\n      transition: none !important;\n    }\n\n  ";
      document.head.appendChild(styleEl);
      document.body.setAttribute('data-theme', 'zen_amber');
      document.body.classList.add('pure-canvas-mode');
      const wrap = document.createElement('div');
      wrap.innerHTML = "<canvas id=\"pure-game-canvas\"></canvas>\n  <!-- 全局共享 SVG <defs>（大幅缩减 DOM 体积 + 提供 3D 弹窗高光渐变） -->\n  <svg id=\"shared-svg-defs\" width=\"0\" height=\"0\" style=\"position:absolute;width:0;height:0;overflow:hidden;pointer-events:none\" aria-hidden=\"true\">\n    <defs id=\"global-bottle-defs\"></defs>\n    <defs id=\"global-ui-3d-defs\">\n      <!-- 100% 移植自用户 HTML 的原图级超椭圆玻璃按钮滤镜与材质渐变 -->\n      <filter id=\"btnDropShadow\" x=\"-20%\" y=\"-15%\" width=\"140%\" height=\"145%\">\n        <feDropShadow dx=\"0\" dy=\"5\" stdDeviation=\"4.5\" flood-color=\"#6e4414\" flood-opacity=\"0.34\"/>\n      </filter>\n      <filter id=\"rulesDropShadow\" x=\"-20%\" y=\"-15%\" width=\"140%\" height=\"145%\">\n        <feDropShadow dx=\"0\" dy=\"4\" stdDeviation=\"4\" flood-color=\"#3c4c34\" flood-opacity=\"0.34\"/>\n      </filter>\n      <filter id=\"iconShadow\" x=\"-25%\" y=\"-25%\" width=\"150%\" height=\"150%\">\n        <feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"1.6\" flood-color=\"#8c581c\" flood-opacity=\"0.42\"/>\n      </filter>\n      <filter id=\"bulbGlow\" x=\"-40%\" y=\"-40%\" width=\"180%\" height=\"180%\">\n        <feGaussianBlur stdDeviation=\"3.5\" result=\"blur\"/>\n        <feMerge>\n          <feMergeNode in=\"blur\"/>\n          <feMergeNode in=\"SourceGraphic\"/>\n        </feMerge>\n      </filter>\n      <linearGradient id=\"warmGlassBase\" x1=\"15%\" y1=\"5%\" x2=\"85%\" y2=\"95%\">\n        <stop offset=\"0%\" stop-color=\"#f7dfb8\" stop-opacity=\"0.48\"/>\n        <stop offset=\"38%\" stop-color=\"#dfad64\" stop-opacity=\"0.28\"/>\n        <stop offset=\"72%\" stop-color=\"#b87b31\" stop-opacity=\"0.40\"/>\n        <stop offset=\"100%\" stop-color=\"#d89d4e\" stop-opacity=\"0.50\"/>\n      </linearGradient>\n      <linearGradient id=\"hintGlassBase\" x1=\"15%\" y1=\"5%\" x2=\"85%\" y2=\"95%\">\n        <stop offset=\"0%\" stop-color=\"#ede2be\" stop-opacity=\"0.46\"/>\n        <stop offset=\"45%\" stop-color=\"#b69f62\" stop-opacity=\"0.30\"/>\n        <stop offset=\"80%\" stop-color=\"#877b48\" stop-opacity=\"0.40\"/>\n        <stop offset=\"100%\" stop-color=\"#a8995c\" stop-opacity=\"0.48\"/>\n      </linearGradient>\n      <linearGradient id=\"rulesGlassBase\" x1=\"15%\" y1=\"5%\" x2=\"85%\" y2=\"95%\">\n        <stop offset=\"0%\" stop-color=\"#e4efe2\" stop-opacity=\"0.48\"/>\n        <stop offset=\"45%\" stop-color=\"#9cb298\" stop-opacity=\"0.30\"/>\n        <stop offset=\"82%\" stop-color=\"#6b8368\" stop-opacity=\"0.40\"/>\n        <stop offset=\"100%\" stop-color=\"#8da387\" stop-opacity=\"0.50\"/>\n      </linearGradient>\n      <linearGradient id=\"topCrescentSheen\" x1=\"30%\" y1=\"0%\" x2=\"65%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#ffffff\" stop-opacity=\"0.64\"/>\n        <stop offset=\"45%\" stop-color=\"#fff6e4\" stop-opacity=\"0.30\"/>\n        <stop offset=\"100%\" stop-color=\"#ffffff\" stop-opacity=\"0.0\"/>\n      </linearGradient>\n      <radialGradient id=\"innerBottomShade\" cx=\"52%\" cy=\"68%\" r=\"48%\">\n        <stop offset=\"0%\" stop-color=\"#8a5216\" stop-opacity=\"0.26\"/>\n        <stop offset=\"65%\" stop-color=\"#9c6222\" stop-opacity=\"0.12\"/>\n        <stop offset=\"100%\" stop-color=\"#9c6222\" stop-opacity=\"0.0\"/>\n      </radialGradient>\n      <linearGradient id=\"glassRimStroke\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#ffffff\" stop-opacity=\"0.95\"/>\n        <stop offset=\"30%\" stop-color=\"#fff8eb\" stop-opacity=\"0.72\"/>\n        <stop offset=\"65%\" stop-color=\"#ffe7c2\" stop-opacity=\"0.42\"/>\n        <stop offset=\"100%\" stop-color=\"#ffffff\" stop-opacity=\"0.88\"/>\n      </linearGradient>\n      <radialGradient id=\"bulb3DGrad\" cx=\"36%\" cy=\"32%\" r=\"64%\">\n        <stop offset=\"0%\" stop-color=\"#ffffc8\"/>\n        <stop offset=\"32%\" stop-color=\"#ffea38\"/>\n        <stop offset=\"72%\" stop-color=\"#f7b718\"/>\n        <stop offset=\"100%\" stop-color=\"#d97f08\"/>\n      </radialGradient>\n      <linearGradient id=\"question3DGrad\" x1=\"25%\" y1=\"10%\" x2=\"75%\" y2=\"90%\">\n        <stop offset=\"0%\" stop-color=\"#ffffff\"/>\n        <stop offset=\"48%\" stop-color=\"#d4ecff\"/>\n        <stop offset=\"100%\" stop-color=\"#8ec0e4\"/>\n      </linearGradient>\n\n      <!-- 100% 复刻原图 image_55d85b 的 3D 粗麻布编织软垫纹理与立体体积光影定义 -->\n      <pattern id=\"burlapWeaveLightPat\" width=\"8\" height=\"8\" patternUnits=\"userSpaceOnUse\">\n        <rect width=\"8\" height=\"8\" fill=\"#8c6236\"/>\n        <!-- 经纬交错的饱满枕状粗麻线节 -->\n        <rect x=\"0.5\" y=\"0.6\" width=\"3.3\" height=\"2.9\" rx=\"1.1\" fill=\"#edd1a1\"/>\n        <rect x=\"0.9\" y=\"0.9\" width=\"2.4\" height=\"1.2\" rx=\"0.5\" fill=\"#fff0cf\" opacity=\"0.75\"/>\n        <rect x=\"4.4\" y=\"0.5\" width=\"2.9\" height=\"3.3\" rx=\"1.1\" fill=\"#d9b077\"/>\n        <rect x=\"4.8\" y=\"0.9\" width=\"1.3\" height=\"2.4\" rx=\"0.5\" fill=\"#f7dfb2\" opacity=\"0.65\"/>\n        <rect x=\"0.5\" y=\"4.4\" width=\"2.9\" height=\"3.3\" rx=\"1.1\" fill=\"#d6ac72\"/>\n        <rect x=\"0.9\" y=\"4.8\" width=\"1.3\" height=\"2.4\" rx=\"0.5\" fill=\"#f5dca8\" opacity=\"0.65\"/>\n        <rect x=\"4.5\" y=\"4.6\" width=\"3.3\" height=\"2.9\" rx=\"1.1\" fill=\"#e8c896\"/>\n        <rect x=\"4.9\" y=\"4.9\" width=\"2.4\" height=\"1.2\" rx=\"0.5\" fill=\"#ffeed0\" opacity=\"0.72\"/>\n      </pattern>\n      <pattern id=\"burlapWeaveDarkPat\" width=\"8\" height=\"8\" patternUnits=\"userSpaceOnUse\">\n        <rect width=\"8\" height=\"8\" fill=\"#362718\"/>\n        <rect x=\"0.5\" y=\"0.6\" width=\"3.3\" height=\"2.9\" rx=\"1.1\" fill=\"#7c6348\"/>\n        <rect x=\"0.9\" y=\"0.9\" width=\"2.4\" height=\"1.2\" rx=\"0.5\" fill=\"#9c8062\" opacity=\"0.65\"/>\n        <rect x=\"4.4\" y=\"0.5\" width=\"2.9\" height=\"3.3\" rx=\"1.1\" fill=\"#634d36\"/>\n        <rect x=\"0.5\" y=\"4.4\" width=\"2.9\" height=\"3.3\" rx=\"1.1\" fill=\"#5e4832\"/>\n        <rect x=\"4.5\" y=\"4.6\" width=\"3.3\" height=\"2.9\" rx=\"1.1\" fill=\"#755c42\"/>\n        <rect x=\"4.9\" y=\"4.9\" width=\"2.4\" height=\"1.2\" rx=\"0.5\" fill=\"#94785a\" opacity=\"0.6\"/>\n      </pattern>\n      <!-- 软垫顶面左上受光、右下暖褐的立体球面光影罩 -->\n      <linearGradient id=\"burlapTopShade\" x1=\"12%\" y1=\"8%\" x2=\"88%\" y2=\"92%\">\n        <stop offset=\"0%\" stop-color=\"#fff8e6\" stop-opacity=\"0.38\"/>\n        <stop offset=\"45%\" stop-color=\"#d49e5c\" stop-opacity=\"0.06\"/>\n        <stop offset=\"82%\" stop-color=\"#5c3b18\" stop-opacity=\"0.36\"/>\n        <stop offset=\"100%\" stop-color=\"#38220c\" stop-opacity=\"0.58\"/>\n      </linearGradient>\n      <!-- 软垫厚实侧面：原图标志性的上亮金棕、下深巧克力的体积过渡 -->\n      <linearGradient id=\"burlapSideWallLight\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#c4945a\"/>\n        <stop offset=\"38%\" stop-color=\"#8c6032\"/>\n        <stop offset=\"78%\" stop-color=\"#543618\"/>\n        <stop offset=\"100%\" stop-color=\"#331f0c\"/>\n      </linearGradient>\n      <linearGradient id=\"burlapSideWallDark\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#69523a\"/>\n        <stop offset=\"42%\" stop-color=\"#473524\"/>\n        <stop offset=\"82%\" stop-color=\"#2b1f14\"/>\n        <stop offset=\"100%\" stop-color=\"#1a110a\"/>\n      </linearGradient>\n      <!-- 原图浮空麻布块下方的暖赤陶橘色柔和投影 -->\n      <radialGradient id=\"terracottaShadowGrad\" cx=\"50%\" cy=\"50%\" r=\"50%\">\n        <stop offset=\"0%\" stop-color=\"rgba(148, 62, 14, 0.62)\"/>\n        <stop offset=\"48%\" stop-color=\"rgba(168, 78, 20, 0.36)\"/>\n        <stop offset=\"78%\" stop-color=\"rgba(185, 92, 28, 0.12)\"/>\n        <stop offset=\"100%\" stop-color=\"rgba(185, 92, 28, 0.0)\"/>\n      </radialGradient>\n      <!-- 瓶底与麻布软垫接触处的暖琥珀柔和遮蔽影（杜绝空瓶底部发灰发脏） -->\n      <radialGradient id=\"burlapContactAOGrad\" cx=\"50%\" cy=\"50%\" r=\"50%\">\n        <stop offset=\"0%\" stop-color=\"rgba(98, 52, 12, 0.42)\"/>\n        <stop offset=\"60%\" stop-color=\"rgba(115, 62, 16, 0.18)\"/>\n        <stop offset=\"100%\" stop-color=\"rgba(115, 62, 16, 0.0)\"/>\n      </radialGradient>\n      <!-- 3D 黄色旋转箭头（顶面高光渐变 + 底部温暖琥珀3D立体厚度渐变，完全复刻参考图） -->\n      <linearGradient id=\"arrowYellowTop3D\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#fff978\"/>\n        <stop offset=\"45%\" stop-color=\"#ffdd14\"/>\n        <stop offset=\"100%\" stop-color=\"#f5a600\"/>\n      </linearGradient>\n      <linearGradient id=\"arrowYellowSide3D\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#e68a00\"/>\n        <stop offset=\"100%\" stop-color=\"#b85d00\"/>\n      </linearGradient>\n      <!-- 3D 玫粉旋转箭头（顶面高光渐变 + 底部深玫红3D立体厚度渐变，完全复刻参考图） -->\n      <linearGradient id=\"arrowPinkTop3D\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#ff99d6\"/>\n        <stop offset=\"45%\" stop-color=\"#ff4da6\"/>\n        <stop offset=\"100%\" stop-color=\"#e01972\"/>\n      </linearGradient>\n      <linearGradient id=\"arrowPinkSide3D\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#c91464\"/>\n        <stop offset=\"100%\" stop-color=\"#8f0843\"/>\n      </linearGradient>\n      <!-- 3D 速度升级小黄人全身球面立体光影 -->\n      <radialGradient id=\"mascotHead3D\" cx=\"35%\" cy=\"28%\" r=\"72%\">\n        <stop offset=\"0%\" stop-color=\"#fffb9e\"/>\n        <stop offset=\"36%\" stop-color=\"#ffe119\"/>\n        <stop offset=\"78%\" stop-color=\"#f5a600\"/>\n        <stop offset=\"100%\" stop-color=\"#c27400\"/>\n      </radialGradient>\n      <radialGradient id=\"mascotTorso3D\" cx=\"38%\" cy=\"30%\" r=\"70%\">\n        <stop offset=\"0%\" stop-color=\"#fff580\"/>\n        <stop offset=\"45%\" stop-color=\"#ffd60a\"/>\n        <stop offset=\"85%\" stop-color=\"#e09000\"/>\n        <stop offset=\"100%\" stop-color=\"#ad6200\"/>\n      </radialGradient>\n      <linearGradient id=\"mascotLimb3D\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#fff275\"/>\n        <stop offset=\"50%\" stop-color=\"#ffd000\"/>\n        <stop offset=\"100%\" stop-color=\"#bf6e00\"/>\n      </linearGradient>\n      <filter id=\"ui3dDropShadow\" x=\"-20%\" y=\"-15%\" width=\"140%\" height=\"145%\">\n        <feDropShadow dx=\"0\" dy=\"6\" stdDeviation=\"4.5\" flood-color=\"#2c1654\" flood-opacity=\"0.28\"/>\n      </filter>\n    \n      <linearGradient id=\"funnelGoldGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#fffbeb\"/>\n        <stop offset=\"35%\" stop-color=\"#fde047\"/>\n        <stop offset=\"75%\" stop-color=\"#eab308\"/>\n        <stop offset=\"100%\" stop-color=\"#a16207\"/>\n      </linearGradient>\n      <linearGradient id=\"ancientSpoutGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"0%\">\n        <stop offset=\"0%\" stop-color=\"#78350f\"/>\n        <stop offset=\"30%\" stop-color=\"#f59e0b\"/>\n        <stop offset=\"65%\" stop-color=\"#fef08a\"/>\n        <stop offset=\"100%\" stop-color=\"#92400e\"/>\n      </linearGradient>\n      <linearGradient id=\"bombGoldBadgeGrad\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#fef08a\"/>\n        <stop offset=\"50%\" stop-color=\"#f59e0b\"/>\n        <stop offset=\"100%\" stop-color=\"#b45309\"/>\n      </linearGradient>\n      <linearGradient id=\"bombRedBadgeGrad\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n        <stop offset=\"0%\" stop-color=\"#fda4af\"/>\n        <stop offset=\"45%\" stop-color=\"#f43f5e\"/>\n        <stop offset=\"100%\" stop-color=\"#9f1239\"/>\n      </linearGradient>\n    </defs>\n  </svg>\n  <div class=\"ambient-glow\"></div>\n  <!-- 2D 顶层动态魔法星光粒子流与飞星特效画布（100%提取自参考图实现 HTML #fx-canvas） -->\n  <canvas id=\"bg-star-canvas\"></canvas>\n\n  <div class=\"app-shell\">\n    <!-- 1. 原图级高定顶部栏（左上超椭圆玻璃菜单 + 中央关卡与步数 + 右上超椭圆玻璃规则） -->\n    <div class=\"top-bar\">\n      <!-- 左上：100%复刻原图超椭圆暖色玻璃【设置】按钮 -->\n      <div class=\"frosted-top-action\" id=\"settings-btn\" title=\"打开设置与菜单\">\n        <svg class=\"svg-btn-top\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#btnDropShadow)\">\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#warmGlassBase)\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#innerBottomShade)\" />\n            <path d=\"M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.65\" />\n            <path d=\"M 20,86 C 30,90.5 68,90.5 80,85\" stroke=\"#fff3d6\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\"0.48\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.5\" />\n          </g>\n          <g filter=\"url(#iconShadow)\">\n            <rect x=\"30\" y=\"31\" width=\"40\" height=\"7.6\" rx=\"3.8\" fill=\"#ffffff\"/>\n            <rect x=\"30\" y=\"46.2\" width=\"40\" height=\"7.6\" rx=\"3.8\" fill=\"#ffffff\"/>\n            <rect x=\"30\" y=\"61.4\" width=\"40\" height=\"7.6\" rx=\"3.8\" fill=\"#ffffff\"/>\n          </g>\n        </svg>\n        <span class=\"frosted-top-label\">设置</span>\n      </div>\n\n      <!-- 居中：上方「第 X 关」 + 下方动态进度/剩余步数副标题（点击打开200关选单） -->\n      <div class=\"top-center-group\" id=\"top-center-level-trigger\" title=\"点击打开200关选单\">\n        <div class=\"zen-big-num-wrap\" id=\"zen-big-num-wrap\">\n          <div class=\"zen-big-num\" id=\"zen-header-big-num\">第 1 关</div>\n        </div>\n        <div class=\"level-pill\" id=\"level-pill-title\">已封存 0/7</div>\n      </div>\n\n      <!-- 右上：100%复刻原图超椭圆冷绿折射玻璃【规则】按钮 -->\n      <div class=\"frosted-top-action\" id=\"rules-help-btn\" title=\"查看游戏规则\">\n        <svg class=\"svg-btn-top\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#rulesDropShadow)\">\n            <path d=\"M 50,5 C 83,5 95,17 95,50 C 95,83 83,95 50,95 C 17,95 5,83 5,50 C 5,17 17,5 50,5 Z\" fill=\"url(#rulesGlassBase)\" />\n            <path d=\"M 50,7 C 78,7 89,16 91,38 C 74,47 36,38 9,42 C 11,17 22,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 16,32 C 18,16 30,10 50,10 C 66,10 77,14 82,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.65\" />\n            <path d=\"M 50,5 C 83,5 95,17 95,50 C 95,83 83,95 50,95 C 17,95 5,83 5,50 C 5,17 17,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.4\" />\n          </g>\n          <g filter=\"url(#iconShadow)\">\n            <path d=\"M 38.5,35.5 C 38.5,27.5 44.5,23 52,23 C 59.5,23 65.5,27.8 65.5,35 C 65.5,40.5 62,43.8 57.2,46.8 C 53.8,48.9 52.5,51.2 52.5,55.5\"\n                  stroke=\"url(#question3DGrad)\" stroke-width=\"8.5\" stroke-linecap=\"round\" fill=\"none\"/>\n            <circle cx=\"52.2\" cy=\"70.5\" r=\"5.2\" fill=\"url(#question3DGrad)\"/>\n          </g>\n        </svg>\n        <span class=\"frosted-top-label\">规则</span>\n      </div>\n    </div>\n\n    <!-- 2A. 礼盒打包模式专属：顶部 4 个高精 3D 礼盒袋 -->\n    <div class=\"bags-stage\" id=\"bags-stage\"></div>\n\n    <!-- 2B. 特殊BOSS或限步提示栏（常规关卡自动隐藏，保持参考图极简呼吸感） -->\n    <div class=\"mode-banner\" id=\"mode-banner\">\n      <div class=\"mode-banner-left\">\n        <span id=\"mode-banner-text\">🎯 将同色水归类装满</span>\n        <span class=\"mode-banner-tag\" id=\"mode-banner-progress\">完成 0/7</span>\n      </div>\n      <div class=\"moves-counter-pill\" id=\"moves-counter-pill\">\n        <svg class=\"alarm-clock-svg\" width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" fill=\"none\">\n          <circle cx=\"12\" cy=\"13\" r=\"7.8\" fill=\"#ffffff\" stroke=\"#c2410c\" stroke-width=\"1.8\"/>\n          <polyline points=\"12,9.0 12,13 15,14.5\" stroke=\"#ea580c\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n          <path d=\"M4.5,4.5 L7.5,7\" stroke=\"#fbbf24\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>\n          <path d=\"M19.5,4.5 L16.5,7\" stroke=\"#fbbf24\" stroke-width=\"2.6\" stroke-linecap=\"round\"/>\n          <circle cx=\"12\" cy=\"13\" r=\"1.6\" fill=\"#ea580c\"/>\n        </svg>\n        <span class=\"moves-label\">步数</span>\n        <span class=\"moves-num\" id=\"moves-left-num\">15</span>\n      </div>\n    </div>\n\n    <!-- 3. 中央自适应 2.5D 瓶子舞台 -->\n    <div class=\"bottles-stage\" id=\"bottles-stage\">\n      <div class=\"bottles-grid\" id=\"bottles-grid\"></div>\n    </div>\n\n    <!-- 4. 底部 4 枚 100% 原图质感超椭圆 SVG 玻璃按钮（重玩 / 打乱 / 撤回 / 提示） -->\n    <div class=\"bottom-dock-wrap\">\n      <!-- 按钮 1：重玩（100%复刻原图 Restart 环形圆角三角箭头） -->\n      <div class=\"medallion-btn\" id=\"dock-restart-btn\" title=\"重新开始本关\">\n        <svg class=\"svg-btn-bottom\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#btnDropShadow)\">\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#warmGlassBase)\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#innerBottomShade)\" />\n            <path d=\"M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.62\" />\n            <path d=\"M 20,86 C 30,90.5 68,90.5 80,85\" stroke=\"#fff3d6\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\"0.48\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.5\" />\n          </g>\n          <g filter=\"url(#iconShadow)\">\n            <path d=\"M 41,34.5 A 18.5,18.5 0 1 1 32.5,56.5\" stroke=\"#ffffff\" stroke-width=\"7.2\" stroke-linecap=\"round\" fill=\"none\"/>\n            <path d=\"M 47.5,24.5 L 46.5,43.5 C 46.4,45.2 44.5,46.0 43.1,45.0 L 30.8,35.8 C 29.4,34.8 29.8,32.6 31.4,32.0 L 44.8,23.2 C 46.2,22.4 47.6,23.2 47.5,24.5 Z\" fill=\"#ffffff\"/>\n          </g>\n        </svg>\n        <span class=\"medallion-label\">重玩</span>\n      </div>\n\n      <!-- 按钮 2：打乱（超椭圆玻璃 + 双箭头交叉洗牌图标） -->\n      <div class=\"medallion-btn\" id=\"shuffle-btn\" title=\"打乱重排场上剩余水（总数不变）\">\n        <svg class=\"svg-btn-bottom\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#btnDropShadow)\">\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#warmGlassBase)\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#innerBottomShade)\" />\n            <path d=\"M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.62\" />\n            <path d=\"M 20,86 C 30,90.5 68,90.5 80,85\" stroke=\"#fff3d6\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\"0.48\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.5\" />\n          </g>\n          <g filter=\"url(#iconShadow)\">\n            <path d=\"M 24,64 H 33 C 41,64 46,59 51,48 C 56,37 61,33 69,33 H 76\" stroke=\"#ffffff\" stroke-width=\"6.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n            <path d=\"M 67,24 L 78,33 L 67,42\" stroke=\"#ffffff\" stroke-width=\"6.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n            <path d=\"M 24,33 H 33 C 38,33 42,35.5 45.5,41\" stroke=\"#ffffff\" stroke-width=\"6.8\" stroke-linecap=\"round\"/>\n            <path d=\"M 56.5,56.5 C 60,61.5 64,64 69,64 H 76\" stroke=\"#ffffff\" stroke-width=\"6.8\" stroke-linecap=\"round\"/>\n            <path d=\"M 67,55 L 78,64 L 67,73\" stroke=\"#ffffff\" stroke-width=\"6.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n          </g>\n        </svg>\n        <div class=\"medallion-badge\" id=\"shuffle-count\">3</div>\n        <span class=\"medallion-label\">打乱</span>\n      </div>\n\n      <!-- 按钮 3：撤回（100%复刻原图 Undo 流线型左弯实心箭头） -->\n      <div class=\"medallion-btn\" id=\"undo-btn\" title=\"撤回上一步\">\n        <svg class=\"svg-btn-bottom\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#btnDropShadow)\">\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#warmGlassBase)\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#innerBottomShade)\" />\n            <path d=\"M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.62\" />\n            <path d=\"M 20,86 C 30,90.5 68,90.5 80,85\" stroke=\"#fff3d6\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\"0.48\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.5\" />\n          </g>\n          <g filter=\"url(#iconShadow)\">\n            <path d=\"M 44,31 L 25.5,48.5 C 24.0,50.0 24.3,52.4 26.2,53.3 L 45.5,61.5 C 47.4,62.3 49.3,60.6 48.8,58.6 L 47.0,52.2 C 58.2,51.0 66.8,54.8 72.5,62.2 C 73.5,63.5 75.5,62.5 75.2,60.8 C 72.8,44.2 61.2,36.8 46.8,38.2 L 48.0,32.8 C 48.4,30.8 45.6,29.5 44,31 Z\" fill=\"#ffffff\"/>\n          </g>\n        </svg>\n        <div class=\"medallion-badge\" id=\"undo-count-badge\">5</div>\n        <span class=\"medallion-label\">撤回</span>\n      </div>\n\n      <!-- 按钮 4：提示（100%复刻原图 Hint 10道放射金芒与 3D 球体发光灯泡） -->\n      <div class=\"medallion-btn\" id=\"hint-btn\" title=\"智能提示下一步最优倒法\">\n        <svg class=\"svg-btn-bottom\" viewBox=\"0 0 100 100\" fill=\"none\">\n          <g filter=\"url(#btnDropShadow)\">\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" fill=\"url(#hintGlassBase)\" />\n            <path d=\"M 50,7 C 80,7 91,16 92,43 C 70,50 34,39 8,46 C 9,17 20,7 50,7 Z\" fill=\"url(#topCrescentSheen)\" />\n            <path d=\"M 14,34 C 16,16 27,9.5 50,9.5 C 68,9.5 79,13.5 84,24\" stroke=\"#ffffff\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.62\" />\n            <path d=\"M 20,86 C 30,90.5 68,90.5 80,85\" stroke=\"#fff3d6\" stroke-width=\"1.8\" stroke-linecap=\"round\" opacity=\"0.45\" />\n            <path d=\"M 50,5 C 84,5 95,16 95,50 C 95,84 84,95 50,95 C 16,95 5,84 5,50 C 5,16 16,5 50,5 Z\" stroke=\"url(#glassRimStroke)\" stroke-width=\"2.5\" />\n          </g>\n          <g stroke=\"#ffe866\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.92\">\n            <line x1=\"50\" y1=\"13\" x2=\"50\" y2=\"20\"/>\n            <line x1=\"33\" y1=\"17.5\" x2=\"36.8\" y2=\"23.5\"/>\n            <line x1=\"67\" y1=\"17.5\" x2=\"63.2\" y2=\"23.5\"/>\n            <line x1=\"21\" y1=\"29\" x2=\"27\" y2=\"32.5\"/>\n            <line x1=\"79\" y1=\"29\" x2=\"73\" y2=\"32.5\"/>\n            <line x1=\"17\" y1=\"44.5\" x2=\"24\" y2=\"44.5\"/>\n            <line x1=\"83\" y1=\"44.5\" x2=\"76\" y2=\"44.5\"/>\n            <line x1=\"22\" y1=\"59.5\" x2=\"28\" y2=\"56\"/>\n            <line x1=\"78\" y1=\"59.5\" x2=\"72\" y2=\"56\"/>\n          </g>\n          <g filter=\"url(#bulbGlow)\">\n            <path d=\"M 50,24 C 38.2,24 29,33.0 29,44.2 C 29,51.4 33.0,57.6 38.8,61.2 C 40.8,62.5 42.0,64.6 42.2,67.0 L 57.8,67.0 C 58.0,64.6 59.2,62.5 61.2,61.2 C 67.0,57.6 71,51.4 71,44.2 C 71,33.0 61.8,24 50,24 Z\" fill=\"url(#bulb3DGrad)\"/>\n            <ellipse cx=\"42\" cy=\"36\" rx=\"6.5\" ry=\"4.2\" transform=\"rotate(-28 42 36)\" fill=\"#ffffff\" opacity=\"0.55\"/>\n          </g>\n          <rect x=\"42.2\" y=\"67.2\" width=\"15.6\" height=\"4.8\" rx=\"2.2\" fill=\"#6f7b88\"/>\n          <rect x=\"43.4\" y=\"72.0\" width=\"13.2\" height=\"4.5\" rx=\"2.0\" fill=\"#596573\"/>\n          <path d=\"M 45.5,76.5 C 46.2,79.8 47.8,81.5 50,81.5 C 52.2,81.5 53.8,79.8 54.5,76.5 Z\" fill=\"#424c58\"/>\n        </svg>\n        <div class=\"medallion-badge\" id=\"hint-count\">3</div>\n        <span class=\"medallion-label\">提示</span>\n      </div>\n\n      <!-- 按钮 5：+空瓶（功能恒定透明：优先解锁紫晶广告空瓶，否则新增1个4层空瓶槽位） -->\n      <div class=\"medallion-btn\" id=\"add-bottle-btn\" title=\"解锁或新增 1 个空瓶槽位\">\n        <div class=\"medallion-badge\" id=\"add-bottle-count\">2</div>\n        <span class=\"medallion-label\">+空瓶</span>\n      </div>\n    </div>\n  </div>\n\n  <!-- 全屏流体与星尘光效层 -->\n  <svg id=\"fx-overlay\"></svg>\n  <div class=\"toast-msg\" id=\"toast-msg\"></div>\n\n  <!-- ==================== 弹窗 A：暂停设置面板（完全复刻参考图5 3D高光版） ==================== -->\n  <div class=\"modal-mask\" id=\"pause-modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\">设置</div>\n      <div class=\"casual-close-btn\" id=\"pause-close-btn\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n\n      <div class=\"pause-setting-row\">\n        <div class=\"pause-setting-left\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#ffffff\" stroke=\"#31659c\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <polygon points=\"11 5 6 9 2 9 2 15 6 15 11 19 11 5\" fill=\"#ffffff\"/>\n            <path d=\"M15.54 8.46a5 5 0 0 1 0 7.07\" fill=\"none\"/>\n            <path d=\"M19.07 4.93a10 10 0 0 1 0 14.14\" fill=\"none\"/>\n          </svg>\n          <span>声音</span>\n        </div>\n        <div class=\"casual-toggle on\" id=\"toggle-sound\" data-key=\"sound\">\n          <span class=\"casual-toggle-check\">✔</span>\n          <div class=\"casual-toggle-knob\"></div>\n        </div>\n      </div>\n\n      <div class=\"pause-setting-row\">\n        <div class=\"pause-setting-left\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#ffffff\" stroke=\"#31659c\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <rect x=\"7\" y=\"4\" width=\"10\" height=\"16\" rx=\"2\" fill=\"#ffffff\"/>\n            <path d=\"M3 8l2 2-2 2 2 2-2 2\" fill=\"none\"/>\n            <path d=\"M21 8l-2 2 2 2-2 2 2 2\" fill=\"none\"/>\n          </svg>\n          <span>震动</span>\n        </div>\n        <div class=\"casual-toggle on\" id=\"toggle-vibrate\" data-key=\"vibrate\">\n          <span class=\"casual-toggle-check\">✔</span>\n          <div class=\"casual-toggle-knob\"></div>\n        </div>\n      </div>\n\n      <div class=\"pause-setting-row\">\n        <div class=\"pause-setting-left\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#ffffff\" stroke=\"#31659c\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <path d=\"M9 18V5l12-2v13\" fill=\"none\"/>\n            <circle cx=\"6\" cy=\"18\" r=\"3\" fill=\"#ffffff\"/>\n            <circle cx=\"18\" cy=\"16\" r=\"3\" fill=\"#ffffff\"/>\n          </svg>\n          <span>音乐</span>\n        </div>\n        <div class=\"casual-toggle on\" id=\"toggle-music\" data-key=\"music\">\n          <span class=\"casual-toggle-check\">✔</span>\n          <div class=\"casual-toggle-knob\"></div>\n        </div>\n      </div>\n\n      <div class=\"pause-setting-row\" style=\"margin-bottom:10px;\">\n        <div class=\"pause-setting-left\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#31659c\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n            <polyline points=\"15 3 21 3 21 9\"/>\n            <polyline points=\"9 21 3 21 3 15\"/>\n            <line x1=\"21\" y1=\"3\" x2=\"14\" y2=\"10\"/>\n            <line x1=\"3\" y1=\"21\" x2=\"10\" y2=\"14\"/>\n          </svg>\n          <span>缩放</span>\n        </div>\n        <div class=\"casual-toggle on\" id=\"toggle-zoom\" data-key=\"zoom\">\n          <span class=\"casual-toggle-check\">✔</span>\n          <div class=\"casual-toggle-knob\"></div>\n        </div>\n      </div>\n\n      <!-- 速度x2、提速升级、主题商店、一键破局 快捷入口（整合于设置面板中） -->\n      <div class=\"pause-feature-bar\">\n        <div class=\"pause-feature-btn\" id=\"speed-x2-btn\" title=\"切换2倍倒水速度\">\n          <div class=\"pause-feature-icon\">\n            <svg width=\"20\" height=\"15\" viewBox=\"0 0 24 18\" fill=\"#8c5820\">\n              <polygon points=\"2,2 12,9 2,16\"/>\n              <polygon points=\"12,2 22,9 12,16\"/>\n            </svg>\n          </div>\n          <span class=\"pause-feature-label\" id=\"speed-x2-label\">速度x2</span>\n        </div>\n\n        <div class=\"pause-feature-btn\" id=\"upgrade-open-btn\" title=\"打开速度升级面板\">\n          <div class=\"pause-feature-icon\">\n            <svg width=\"20\" height=\"20\" viewBox=\"0 0 36 36\">\n              <path d=\"M18,5 L28,17 L22,17 L22,30 L14,30 L14,17 L8,17 Z\" fill=\"#e5a344\" stroke=\"#7c4a12\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n            </svg>\n          </div>\n          <span class=\"pause-feature-label\">提速</span>\n        </div>\n\n        <div class=\"pause-feature-btn\" id=\"shop-open-btn\" title=\"打开主题商店\">\n          <div class=\"pause-feature-icon\">\n            <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"#7c4a12\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\">\n              <circle cx=\"12\" cy=\"12\" r=\"9\" fill=\"#f7df94\"/>\n              <circle cx=\"9\" cy=\"10\" r=\"1.5\" fill=\"#c87816\" stroke=\"none\"/>\n              <circle cx=\"15\" cy=\"10\" r=\"1.5\" fill=\"#6d8c3e\" stroke=\"none\"/>\n              <circle cx=\"12\" cy=\"15\" r=\"1.5\" fill=\"#b8582d\" stroke=\"none\"/>\n            </svg>\n          </div>\n          <span class=\"pause-feature-label\">主题</span>\n        </div>\n\n        <div class=\"pause-feature-btn\" id=\"quick-unlock-btn\" title=\"一键解锁当前关所有机关\">\n          <div class=\"pause-feature-icon\">\n            <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\">\n              <path d=\"M12 3L14.4 9.2L21 9.8L16 14.2L17.5 20.8L12 17.3L6.5 20.8L8 14.2L3 9.8L9.6 9.2L12 3Z\"\n                    fill=\"#f5b942\" stroke=\"#7c4a12\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n            </svg>\n          </div>\n          <span class=\"pause-feature-label\">破局</span>\n        </div>\n      </div>\n    </div>\n\n    <div class=\"pause-bottom-actions\">\n      <div class=\"pause-mid-row\">\n        <div class=\"casual-square-btn yellow\" id=\"pause-home-btn\" title=\"打开200关选单\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#ffffff\" style=\"filter:drop-shadow(0 2px 0 #8f5200);\"><path d=\"M12 3L3 10h3v10h12V10h3L12 3z\"/></svg>\n          <span>主页</span>\n        </div>\n        <button class=\"casual-green-btn\" id=\"pause-restart-btn\">重新开始</button>\n        <div class=\"casual-square-btn pink\" id=\"pause-skip-btn\" title=\"跳至下一关\">\n          <svg width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"#ffffff\" style=\"filter:drop-shadow(0 2px 0 #7a0932);\"><polygon points=\"5,4 15,12 5,20\"/><rect x=\"16\" y=\"4\" width=\"3.5\" height=\"16\" rx=\"1\"/></svg>\n          <span>跳过</span>\n        </div>\n      </div>\n      <button class=\"casual-cyan-btn\" id=\"pause-resume-btn\">继续游戏</button>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 B：速度升级面板（100%复刻参考图1 3D立体小黄人、发光星芒与果冻按钮） ==================== -->\n  <div class=\"modal-mask\" id=\"speed-modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\">速度升级</div>\n      <div class=\"casual-close-btn\" id=\"speed-close-btn\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n\n      <div class=\"pastel-sunburst-box\">\n        <div class=\"pastel-sunburst-rays\"></div>\n        <div class=\"pastel-sunburst-content\">\n          <svg width=\"122\" height=\"138\" viewBox=\"0 0 120 136\" filter=\"url(#ui3dDropShadow)\">\n            <!-- 四角白星芒 -->\n            <path d=\"M14,74 L18,65 L22,74 L31,78 L22,82 L18,91 L14,82 L5,78 Z\" fill=\"#ffffff\"/>\n            <path d=\"M96,46 L100,37 L104,46 L113,50 L104,54 L100,63 L96,54 L87,50 Z\" fill=\"#ffffff\"/>\n            <!-- 脚底 3D 柔和阴影 -->\n            <ellipse cx=\"60\" cy=\"125\" rx=\"28\" ry=\"6.5\" fill=\"rgba(45, 55, 95, 0.24)\"/>\n            <!-- 左右 3D 立体手臂（带琥珀暗部、黑色粗描边与亮白高光点） -->\n            <ellipse cx=\"30\" cy=\"84\" rx=\"9\" ry=\"15\" transform=\"rotate(28, 30, 84)\" fill=\"url(#mascotLimb3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <ellipse cx=\"26\" cy=\"82\" rx=\"3.2\" ry=\"6.5\" transform=\"rotate(28, 26, 82)\" fill=\"rgba(255,255,255,0.65)\"/>\n            <ellipse cx=\"90\" cy=\"84\" rx=\"9\" ry=\"15\" transform=\"rotate(-28, 90, 84)\" fill=\"url(#mascotLimb3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <ellipse cx=\"94\" cy=\"82\" rx=\"3.2\" ry=\"6.5\" transform=\"rotate(-28, 94, 82)\" fill=\"rgba(255,255,255,0.65)\"/>\n            <!-- 双腿与立体圆脚掌 -->\n            <rect x=\"41\" y=\"96\" width=\"15.5\" height=\"22\" rx=\"7\" fill=\"url(#mascotLimb3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <rect x=\"63.5\" y=\"96\" width=\"15.5\" height=\"22\" rx=\"7\" fill=\"url(#mascotLimb3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <ellipse cx=\"48\" cy=\"118\" rx=\"10\" ry=\"6\" fill=\"url(#mascotHead3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <ellipse cx=\"46\" cy=\"116.5\" rx=\"4.5\" ry=\"2\" fill=\"rgba(255,255,255,0.75)\"/>\n            <ellipse cx=\"72\" cy=\"118\" rx=\"10\" ry=\"6\" fill=\"url(#mascotHead3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <ellipse cx=\"74\" cy=\"116.5\" rx=\"4.5\" ry=\"2\" fill=\"rgba(255,255,255,0.75)\"/>\n            <!-- 3D 圆润躯干 + 颈部投影与肚皮高光 -->\n            <rect x=\"37\" y=\"66\" width=\"46\" height=\"37\" rx=\"17\" fill=\"url(#mascotTorso3D)\" stroke=\"#231600\" stroke-width=\"2.8\"/>\n            <path d=\"M40,70 Q60,77 80,70\" fill=\"none\" stroke=\"rgba(165, 90, 0, 0.45)\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n            <ellipse cx=\"55\" cy=\"84\" rx=\"12\" ry=\"9\" fill=\"rgba(255, 255, 210, 0.45)\"/>\n            <!-- 3D 方圆大头（带底侧琥珀体积暗面、顶面与右侧高光弧线） -->\n            <rect x=\"25\" y=\"16\" width=\"70\" height=\"56\" rx=\"18\" fill=\"url(#mascotHead3D)\" stroke=\"#231600\" stroke-width=\"3.0\"/>\n            <!-- 下颌 3D 体积暗影 -->\n            <path d=\"M29,58 Q60,70 91,58 L91,63 Q60,73 29,63 Z\" fill=\"rgba(175, 95, 0, 0.35)\"/>\n            <!-- 头顶与右侧亮白 3D 高光弧（完全对标参考图1小黄人脑门与右脸高光） -->\n            <path d=\"M35,22.5 Q60,19.5 84,23.5\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"4.2\" stroke-linecap=\"round\" opacity=\"0.92\"/>\n            <path d=\"M88,28 Q91,42 88.5,56\" fill=\"none\" stroke=\"#ffffff\" stroke-width=\"3.6\" stroke-linecap=\"round\" opacity=\"0.82\"/>\n            <!-- 弯月笑眼 -->\n            <path d=\"M40,45 Q46.5,36 53,45\" fill=\"none\" stroke=\"#231600\" stroke-width=\"4.6\" stroke-linecap=\"round\"/>\n            <path d=\"M67,45 Q73.5,36 80,45\" fill=\"none\" stroke=\"#231600\" stroke-width=\"4.6\" stroke-linecap=\"round\"/>\n          </svg>\n        </div>\n      </div>\n\n      <div class=\"speed-level-title\">等级: <span id=\"speed-lv-num\">0</span></div>\n      <div class=\"speed-prog-bar\">\n        <div class=\"speed-prog-fill\" id=\"speed-prog-fill\" style=\"width: 0%;\"></div>\n        <span class=\"speed-prog-txt\" id=\"speed-prog-txt\">升级进度: 0%</span>\n      </div>\n      <div class=\"speed-cur-line\">当前速度: <b id=\"speed-pts-num\">10</b> 点</div>\n      <div class=\"speed-foot-tip\">每次升级+1点速度</div>\n    </div>\n\n    <div style=\"margin-top: 18px;\">\n      <button class=\"casual-green-btn\" id=\"speed-upgrade-confirm-btn\">\n        <svg width=\"28\" height=\"20\" viewBox=\"0 0 28 20\" fill=\"#ffffff\">\n          <rect x=\"1\" y=\"2\" width=\"18\" height=\"16\" rx=\"4\"/>\n          <polygon points=\"19,7 27,3 27,17 19,13\" stroke-linejoin=\"round\"/>\n          <polygon points=\"8,6.5 8,13.5 14,10\" fill=\"#2e8500\"/>\n        </svg>\n        <span>升级</span>\n      </button>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 C：刷新/提示获得面板（100%复刻参考图3 厚立体双色旋转箭头 + 3D果冻按钮） ==================== -->\n  <div class=\"modal-mask\" id=\"refresh-modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\">刷新</div>\n      <div class=\"casual-close-btn\" id=\"refresh-close-btn\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n\n      <div class=\"pastel-sunburst-box\" style=\"height: 174px;\">\n        <div class=\"pastel-sunburst-rays\"></div>\n        <div class=\"pastel-sunburst-content\">\n          <svg width=\"136\" height=\"136\" viewBox=\"0 0 128 128\" filter=\"url(#ui3dDropShadow)\">\n            <!-- 左右四角白星芒 -->\n            <path d=\"M18,76 L21.5,67 L25,76 L34,79.5 L25,83 L21.5,92 L18,83 L9,79.5 Z\" fill=\"#ffffff\"/>\n            <path d=\"M103,44 L106.5,35 L110,44 L119,47.5 L110,51 L106.5,60 L103,51 L94,47.5 Z\" fill=\"#ffffff\"/>\n\n            <!-- 上方 3D 圆胖果冻黄箭头（细棕外轮廓 + 饱满琥珀3D下沿 + 亮黄圆润主体 + 白色弧形高光） -->\n            <g>\n              <path d=\"M25,57 C25,27 53,14 78,24 L83,14 Q86,9 90,15 L103,39 Q106,45 99,47 L71,53 Q64,54 68,48 L72,40 C55,34 44,42 44,57 Q44,61 39,61 L30,61 Q25,61 25,57 Z\"\n                    fill=\"url(#arrowYellowSide3D)\" stroke=\"#633606\" stroke-width=\"4.2\" stroke-linejoin=\"round\" transform=\"translate(0, 4.5)\"/>\n              <path d=\"M25,57 C25,27 53,14 78,24 L83,14 Q86,9 90,15 L103,39 Q106,45 99,47 L71,53 Q64,54 68,48 L72,40 C55,34 44,42 44,57 Q44,61 39,61 L30,61 Q25,61 25,57 Z\"\n                    fill=\"url(#arrowYellowTop3D)\" stroke=\"#633606\" stroke-width=\"2.4\" stroke-linejoin=\"round\"/>\n              <!-- 顶部亮白果冻高光弧线 -->\n              <path d=\"M31,49 C35,31 53,21 75,27\" fill=\"none\" stroke=\"#fffde0\" stroke-width=\"4.8\" stroke-linecap=\"round\" opacity=\"0.92\"/>\n              <circle cx=\"29.5\" cy=\"55\" r=\"2.2\" fill=\"#fffde0\" opacity=\"0.92\"/>\n            </g>\n\n            <!-- 下方 3D 圆胖果冻粉箭头（细紫红外轮廓 + 饱满深粉3D下沿 + 樱粉圆润主体 + 粉白弧形高光） -->\n            <g>\n              <path d=\"M103,71 C103,101 75,114 50,104 L45,114 Q42,119 38,113 L25,89 Q22,83 29,81 L57,75 Q64,74 60,80 L56,88 C73,94 84,86 84,71 Q84,67 89,67 L98,67 Q103,67 103,71 Z\"\n                    fill=\"url(#arrowPinkSide3D)\" stroke=\"#610c32\" stroke-width=\"4.2\" stroke-linejoin=\"round\" transform=\"translate(0, 4.5)\"/>\n              <path d=\"M103,71 C103,101 75,114 50,104 L45,114 Q42,119 38,113 L25,89 Q22,83 29,81 L57,75 Q64,74 60,80 L56,88 C73,94 84,86 84,71 Q84,67 89,67 L98,67 Q103,67 103,71 Z\"\n                    fill=\"url(#arrowPinkTop3D)\" stroke=\"#610c32\" stroke-width=\"2.4\" stroke-linejoin=\"round\"/>\n              <!-- 粉箭头立体高光弧线 -->\n              <path d=\"M97,79 C93,97 75,107 53,101\" fill=\"none\" stroke=\"#ffd9ee\" stroke-width=\"4.6\" stroke-linecap=\"round\" opacity=\"0.88\"/>\n              <circle cx=\"98.5\" cy=\"73\" r=\"2.2\" fill=\"#ffffff\" opacity=\"0.90\"/>\n            </g>\n          </svg>\n        </div>\n      </div>\n\n      <div style=\"font-size: 18px; font-weight: 900; color: #5c3d18; margin: 12px 0 18px; letter-spacing: 0.5px;\">智能破局一步 / 随机刷新药水颜色</div>\n\n      <button class=\"casual-green-btn\" id=\"refresh-confirm-btn\">\n        <svg width=\"28\" height=\"20\" viewBox=\"0 0 28 20\" fill=\"#ffffff\">\n          <rect x=\"1\" y=\"2\" width=\"18\" height=\"16\" rx=\"4\"/>\n          <polygon points=\"19,7 27,3 27,17 19,13\" stroke-linejoin=\"round\"/>\n          <polygon points=\"8,6.5 8,13.5 14,10\" fill=\"#2e8500\"/>\n        </svg>\n        <span>获得</span>\n      </button>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 D：主题商店面板（复刻参考图2 3D粉白遮阳篷 + 霓虹灯泡招牌 + 6套主题） ==================== -->\n  <div class=\"modal-mask\" id=\"shop-modal-mask\">\n    <div class=\"casual-modal-card shop-modal-card\">\n      <div class=\"casual-header-pill\">主题背景</div>\n      <div class=\"shop-awning-header\">\n        <svg viewBox=\"0 0 380 98\" width=\"100%\" height=\"100%\" style=\"overflow:visible;\">\n          <!-- 遮阳篷立体斜顶 -->\n          <path d=\"M12,48 Q30,24 65,22 L315,22 Q350,24 368,48 L376,66 L4,66 Z\" fill=\"#f472b6\" stroke=\"#be185d\" stroke-width=\"2.2\"/>\n          <polygon points=\"62,22 112,22 102,66 44,66\" fill=\"#fce7f3\"/>\n          <polygon points=\"164,22 216,22 216,66 164,66\" fill=\"#fce7f3\"/>\n          <polygon points=\"268,22 318,22 336,66 278,66\" fill=\"#fce7f3\"/>\n          <!-- 遮阳篷顶部弧形柔光高光带 -->\n          <path d=\"M24,42 Q190,32 356,42\" fill=\"none\" stroke=\"rgba(255,255,255,0.55)\" stroke-width=\"5\" stroke-linecap=\"round\"/>\n          <!-- 7 瓣 3D 波浪垂帘（带厚底暗影边与亮面） -->\n          <g transform=\"translate(0, 4)\">\n            <path d=\"M4,62 A26,20 0 0,0 56,62 Z\" fill=\"#d88bb8\"/>\n            <path d=\"M56,62 A26,20 0 0,0 108,62 Z\" fill=\"#be185d\"/>\n            <path d=\"M108,62 A26,20 0 0,0 160,62 Z\" fill=\"#d88bb8\"/>\n            <path d=\"M160,62 A27,20 0 0,0 214,62 Z\" fill=\"#be185d\"/>\n            <path d=\"M214,62 A26,20 0 0,0 266,62 Z\" fill=\"#d88bb8\"/>\n            <path d=\"M266,62 A26,20 0 0,0 318,62 Z\" fill=\"#be185d\"/>\n            <path d=\"M318,62 A28,20 0 0,0 376,62 Z\" fill=\"#d88bb8\"/>\n          </g>\n          <path d=\"M4,62 A26,20 0 0,0 56,62 Z\" fill=\"#fbcfe8\" stroke=\"#db2777\" stroke-width=\"1.5\"/>\n          <path d=\"M56,62 A26,20 0 0,0 108,62 Z\" fill=\"#ec4899\" stroke=\"#be185d\" stroke-width=\"1.5\"/>\n          <path d=\"M108,62 A26,20 0 0,0 160,62 Z\" fill=\"#fbcfe8\" stroke=\"#db2777\" stroke-width=\"1.5\"/>\n          <path d=\"M160,62 A27,20 0 0,0 214,62 Z\" fill=\"#ec4899\" stroke=\"#be185d\" stroke-width=\"1.5\"/>\n          <path d=\"M214,62 A26,20 0 0,0 266,62 Z\" fill=\"#fbcfe8\" stroke=\"#db2777\" stroke-width=\"1.5\"/>\n          <path d=\"M266,62 A26,20 0 0,0 318,62 Z\" fill=\"#ec4899\" stroke=\"#be185d\" stroke-width=\"1.5\"/>\n          <path d=\"M318,62 A28,20 0 0,0 376,62 Z\" fill=\"#fbcfe8\" stroke=\"#db2777\" stroke-width=\"1.5\"/>\n          <!-- 紫色鎏金灯泡招牌 -->\n          <path d=\"M72,44 L64,14 Q62,2 78,2 L145,2 Q190,-8 235,2 L302,2 Q318,2 316,14 L308,44 Z\"\n                fill=\"#7e22ce\" stroke=\"#d97706\" stroke-width=\"7\" stroke-linejoin=\"round\" transform=\"translate(0, 3)\"/>\n          <path d=\"M72,44 L64,14 Q62,2 78,2 L145,2 Q190,-8 235,2 L302,2 Q318,2 316,14 L308,44 Z\"\n                fill=\"#9333ea\" stroke=\"#fbbf24\" stroke-width=\"5.5\" stroke-linejoin=\"round\"/>\n          <!-- 7 颗发光金灯泡 -->\n          <circle cx=\"65\" cy=\"18\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"105\" cy=\"4\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"148\" cy=\"1\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"190\" cy=\"-2\" r=\"6.5\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"232\" cy=\"1\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"275\" cy=\"4\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <circle cx=\"315\" cy=\"18\" r=\"6\" fill=\"#fef08a\" stroke=\"#f59e0b\" stroke-width=\"1.8\"/>\n          <text x=\"190\" y=\"32\" text-anchor=\"middle\" fill=\"#ffffff\" font-size=\"26\" font-weight=\"900\"\n                style=\"-webkit-text-stroke: 4px #581c87; paint-order: stroke fill; filter: drop-shadow(0 2px 0 #3b0764);\">商店</text>\n        </svg>\n      </div>\n      <div class=\"casual-close-btn\" id=\"shop-close-btn\" style=\"top: -18px;\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n\n      <div class=\"shop-grid\" id=\"shop-grid\"></div>\n\n      <div style=\"margin-top: 12px;\">\n        <button class=\"casual-cyan-btn\" id=\"shop-open-levels-btn\" style=\"font-size:16px;padding:9px 24px;min-width:168px;\">🗺️ 打开 200 关选单</button>\n      </div>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 E：200关选关面板 ==================== -->\n  <div class=\"modal-mask\" id=\"level-modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\">关卡选择</div>\n      <div class=\"casual-close-btn\" id=\"level-modal-close-btn\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n      <div style=\"font-size:12.5px;font-weight:800;color:#7c582c;margin-bottom:6px;\">200关大师级试炼 · 点击任一关卡立即挑战</div>\n      <div class=\"chapter-tabs\" id=\"chapter-tabs\">\n        <button class=\"chapter-tab-btn active\" data-ch=\"0\">1-40关</button>\n        <button class=\"chapter-tab-btn\" data-ch=\"1\">41-80关</button>\n        <button class=\"chapter-tab-btn\" data-ch=\"2\">81-120关</button>\n        <button class=\"chapter-tab-btn\" data-ch=\"3\">121-160关</button>\n        <button class=\"chapter-tab-btn\" data-ch=\"4\">161-200关</button>\n      </div>\n      <div class=\"level-grid-scroll\" id=\"level-grid-list\"></div>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 F：100%复刻参考图2 (IMG_6674) 悬浮绶带聚光灯【解锁新玩法】展示层 ==================== -->\n  <div class=\"modal-mask\" id=\"mechanic-modal-mask\">\n    <div class=\"mech-ceremony-wrap\">\n      <!-- 顶部：3D 彩球金星簇拥 + 橙金折叠绶带横幅（复刻图2「解锁新玩法」） -->\n      <div class=\"mech-ribbon-header\">\n        <svg viewBox=\"0 0 360 115\" width=\"100%\" height=\"100%\" style=\"overflow:visible;\">\n          <defs>\n            <linearGradient id=\"ribbonMainGrad\" x1=\"0%\" y1=\"0%\" x2=\"0%\" y2=\"100%\">\n              <stop offset=\"0%\" stop-color=\"#ffd27d\"/>\n              <stop offset=\"35%\" stop-color=\"#f89c3e\"/>\n              <stop offset=\"100%\" stop-color=\"#e0741e\"/>\n            </linearGradient>\n            <linearGradient id=\"ribbonWingGrad\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">\n              <stop offset=\"0%\" stop-color=\"#f28829\"/>\n              <stop offset=\"100%\" stop-color=\"#c95b10\"/>\n            </linearGradient>\n            <radialGradient id=\"orbPinkGrad\" cx=\"35%\" cy=\"30%\" r=\"65%\">\n              <stop offset=\"0%\" stop-color=\"#ffd6f5\"/><stop offset=\"45%\" stop-color=\"#e879f9\"/><stop offset=\"100%\" stop-color=\"#a21caf\"/>\n            </radialGradient>\n            <radialGradient id=\"orbBlueGrad\" cx=\"35%\" cy=\"30%\" r=\"65%\">\n              <stop offset=\"0%\" stop-color=\"#dbeafe\"/><stop offset=\"45%\" stop-color=\"#60a5fa\"/><stop offset=\"100%\" stop-color=\"#1d4ed8\"/>\n            </radialGradient>\n            <radialGradient id=\"orbCoralGrad\" cx=\"35%\" cy=\"30%\" r=\"65%\">\n              <stop offset=\"0%\" stop-color=\"#ffe4e6\"/><stop offset=\"45%\" stop-color=\"#fb7185\"/><stop offset=\"100%\" stop-color=\"#be123c\"/>\n            </radialGradient>\n            <radialGradient id=\"orbCyanGrad\" cx=\"35%\" cy=\"30%\" r=\"65%\">\n              <stop offset=\"0%\" stop-color=\"#e0f2fe\"/><stop offset=\"45%\" stop-color=\"#38bdf8\"/><stop offset=\"100%\" stop-color=\"#0369a1\"/>\n            </radialGradient>\n          </defs>\n\n          <!-- 绶带后方簇拥的 3D 彩色庆典气球与双金星（100%复刻图2顶部元素） -->\n          <circle cx=\"84\" cy=\"48\" r=\"15\" fill=\"url(#orbCyanGrad)\" />\n          <circle cx=\"110\" cy=\"36\" r=\"22\" fill=\"url(#orbPinkGrad)\" />\n          <circle cx=\"242\" cy=\"34\" r=\"21\" fill=\"url(#orbBlueGrad)\" />\n          <circle cx=\"272\" cy=\"44\" r=\"24\" fill=\"url(#orbCoralGrad)\" />\n\n          <!-- 左侧小金星 -->\n          <g transform=\"translate(142, 34) rotate(-14)\">\n            <path d=\"M0,-18 L5.2,-6 L18,-4.2 L8.5,4.5 L11,17.5 L0,11 L-11,17.5 L-8.5,4.5 L-18,-4.2 L-5.2,-6 Z\"\n                  fill=\"url(#funnelGoldGrad)\" stroke=\"#d97706\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n          </g>\n          <!-- 中央大主金星 -->\n          <g transform=\"translate(194, 24) rotate(8)\">\n            <path d=\"M0,-29 L8.5,-9.5 L29,-6.8 L13.8,7.2 L17.8,28 L0,17.8 L-17.8,28 L-13.8,7.2 L-29,-6.8 L-8.5,-9.5 Z\"\n                  fill=\"url(#funnelGoldGrad)\" stroke=\"#d97706\" stroke-width=\"2.8\" stroke-linejoin=\"round\"\n                  style=\"filter:drop-shadow(0 4px 8px rgba(180, 83, 9, 0.45));\"/>\n            <path d=\"M0,-23 L6,-7.5 L22,-5 L10,5.5 L13,21 L0,13.5\" fill=\"rgba(255,255,255,0.35)\"/>\n          </g>\n\n          <!-- 左右两侧燕尾折叠飘带翼 -->\n          <path d=\"M 22,68 L 78,60 L 78,96 L 22,102 L 38,85 Z\" fill=\"url(#ribbonWingGrad)\" stroke=\"#b45309\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n          <polygon points=\"62,62 78,60 78,96 62,88\" fill=\"#8c3905\"/>\n          <path d=\"M 338,68 L 282,60 L 282,96 L 338,102 L 322,85 Z\" fill=\"url(#ribbonWingGrad)\" stroke=\"#b45309\" stroke-width=\"2.2\" stroke-linejoin=\"round\"/>\n          <polygon points=\"298,62 282,60 282,96 298,88\" fill=\"#8c3905\"/>\n\n          <!-- 中央拱起 3D 橙金主绶带 -->\n          <path d=\"M 56,56 C 110,36 250,36 304,56 L 294,94 C 242,74 118,74 66,94 Z\"\n                fill=\"url(#ribbonMainGrad)\" stroke=\"#c2590a\" stroke-width=\"2.8\" stroke-linejoin=\"round\"/>\n          <!-- 绶带内侧金线描边与高光 -->\n          <path d=\"M 62,60 C 114,41 246,41 298,60\" fill=\"none\" stroke=\"#fff7ed\" stroke-width=\"2.2\" stroke-linecap=\"round\" opacity=\"0.82\"/>\n          <path d=\"M 70,88 C 120,70 240,70 290,88\" fill=\"none\" stroke=\"#fed7aa\" stroke-width=\"1.5\" stroke-linecap=\"round\" opacity=\"0.65\"/>\n\n          <!-- 绶带中央标题文字 -->\n          <text id=\"mech-title\" x=\"180\" y=\"75\" text-anchor=\"middle\" fill=\"#ffffff\" font-size=\"27\" font-weight=\"900\"\n                style=\"letter-spacing: 2px; paint-order: stroke fill; stroke: #b45309; stroke-width: 5.5px; stroke-linejoin: round; filter: drop-shadow(0 2px 2px rgba(120, 45, 5, 0.55));\">解锁新玩法</text>\n        </svg>\n      </div>\n\n      <!-- 中央：开放式旋转金芒聚光灯 + 四角闪烁星芒 + 新道具水瓶本体 -->\n      <div class=\"mech-open-spotlight\">\n        <div class=\"mech-open-rays\"></div>\n        <div class=\"mech-open-glow-core\"></div>\n        <svg class=\"mech-sparkles-layer\" viewBox=\"0 0 280 256\">\n          <!-- 左上、左下、右上、右下闪烁四角星与五角星 -->\n          <path d=\"M46,136 L50,124 L54,136 L66,140 L54,144 L50,156 L46,144 L34,140 Z\" fill=\"#fef08a\"/>\n          <path d=\"M226,98 L230,86 L234,98 L246,102 L234,106 L230,118 L226,106 L214,102 Z\" fill=\"#fef08a\"/>\n          <path d=\"M188,184 L191,176 L194,184 L202,187 L194,190 L191,198 L188,190 L180,187 Z\" fill=\"#ffffff\"/>\n          <circle cx=\"72\" cy=\"96\" r=\"4\" fill=\"#fffbeb\" opacity=\"0.85\"/>\n          <circle cx=\"204\" cy=\"146\" r=\"3.5\" fill=\"#fffbeb\" opacity=\"0.85\"/>\n          <circle cx=\"88\" cy=\"176\" r=\"3\" fill=\"#fde047\" opacity=\"0.75\"/>\n        </svg>\n        <div class=\"mech-bottle-hero\" id=\"mech-preview-stage\"></div>\n      </div>\n\n      <div class=\"mech-carousel-dot\"></div>\n\n      <!-- 底部：图2同款双层金边米白说明横幅 + 点击任意位置继续 -->\n      <div class=\"mech-scroll-pill\" id=\"mech-desc\">倒出顶层药水，即可揭晓下方隐藏的颜色。</div>\n      <div class=\"mech-tap-anywhere\" id=\"mech-close-btn\">点击任意位置继续</div>\n      <!-- 兼容隐藏字段 -->\n      <div id=\"mech-badge\" style=\"display:none;\"></div>\n      <div id=\"mech-sub\" style=\"display:none;\"></div>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 G：过关结算弹窗（精简高定庆典版） ==================== -->\n  <div class=\"modal-mask\" id=\"modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\" id=\"modal-badge-pill\">过关成功</div>\n      <div class=\"casual-close-btn\" id=\"win-close-x-btn\">\n        <svg width=\"18\" height=\"18\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.2\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n\n      <!-- 3D 璀璨三星与黄金圣杯动效舞台 -->\n      <div class=\"win-celebration-hero\">\n        <div class=\"win-stars-row\">\n          <svg class=\"win-star-item s1\" width=\"34\" height=\"34\" viewBox=\"0 0 36 36\">\n            <path d=\"M18 3L22.4 12.2L32.5 13.5L25.1 20.6L26.9 30.7L18 25.8L9.1 30.7L10.9 20.6L3.5 13.5L13.6 12.2L18 3Z\" fill=\"url(#funnelGoldGrad)\" stroke=\"#ffffff\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n          </svg>\n          <svg class=\"win-star-item s2\" width=\"44\" height=\"44\" viewBox=\"0 0 36 36\">\n            <path d=\"M18 3L22.4 12.2L32.5 13.5L25.1 20.6L26.9 30.7L18 25.8L9.1 30.7L10.9 20.6L3.5 13.5L13.6 12.2L18 3Z\" fill=\"url(#funnelGoldGrad)\" stroke=\"#ffffff\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n          </svg>\n          <svg class=\"win-star-item s3\" width=\"34\" height=\"34\" viewBox=\"0 0 36 36\">\n            <path d=\"M18 3L22.4 12.2L32.5 13.5L25.1 20.6L26.9 30.7L18 25.8L9.1 30.7L10.9 20.6L3.5 13.5L13.6 12.2L18 3Z\" fill=\"url(#funnelGoldGrad)\" stroke=\"#ffffff\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n          </svg>\n        </div>\n        <div class=\"win-trophy-wrap\">\n          <svg width=\"76\" height=\"72\" viewBox=\"0 0 80 76\" fill=\"none\">\n            <ellipse cx=\"40\" cy=\"70\" rx=\"24\" ry=\"4\" fill=\"rgba(120, 72, 12, 0.22)\"/>\n            <!-- 双耳手柄 -->\n            <path d=\"M22 18H13C10 18 9 22 11 27C13 32 18 35 24 35\" stroke=\"url(#funnelGoldGrad)\" stroke-width=\"4.2\" stroke-linecap=\"round\"/>\n            <path d=\"M58 18H67C70 18 71 22 69 27C67 32 62 35 56 35\" stroke=\"url(#funnelGoldGrad)\" stroke-width=\"4.2\" stroke-linecap=\"round\"/>\n            <!-- 奖杯主体 -->\n            <path d=\"M21 12H59V26C59 38.5 50.5 46 40 46C29.5 46 21 38.5 21 26V12Z\" fill=\"url(#funnelGoldGrad)\" stroke=\"#ffffff\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>\n            <!-- 奖杯高光弧 -->\n            <path d=\"M26 17V25C26 32 29.5 37.5 34.5 40\" stroke=\"rgba(255,255,255,0.78)\" stroke-width=\"3\" stroke-linecap=\"round\"/>\n            <!-- 奖杯柱与底座 -->\n            <rect x=\"36\" y=\"45\" width=\"8\" height=\"13\" rx=\"2\" fill=\"url(#funnelGoldGrad)\"/>\n            <path d=\"M25 58H55L58 66H22L25 58Z\" fill=\"url(#ancientSpoutGrad)\" stroke=\"#ffffff\" stroke-width=\"1.4\" stroke-linejoin=\"round\"/>\n          </svg>\n        </div>\n      </div>\n\n      <div class=\"win-scorecard\">\n        <div>\n          <div class=\"score-col-label\">本次用步</div>\n          <div class=\"score-col-val\" id=\"score-user-moves\">14 步</div>\n        </div>\n        <div class=\"score-divider\"></div>\n        <div>\n          <div class=\"score-col-label\">理论最优解</div>\n          <div class=\"score-col-val cyan\" id=\"score-opt-moves\">12 步</div>\n        </div>\n        <div class=\"score-divider\"></div>\n        <div>\n          <div class=\"score-col-label\">最优解差距</div>\n          <div class=\"score-col-val amber\" id=\"score-diff-moves\">+2</div>\n        </div>\n      </div>\n      <div style=\"font-size:12.5px;font-weight:800;color:#b46914;margin-bottom:14px;\" id=\"score-praise-line\">✨ 步数控制非常出色！</div>\n      <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;\">\n        <button class=\"casual-cyan-btn\" id=\"modal-restart-btn\" style=\"min-width:0;width:100%;padding:12px 0;font-size:16.5px;\">重玩本关</button>\n        <button class=\"casual-green-btn\" id=\"modal-next-btn\" style=\"min-width:0;width:100%;padding:12px 0;font-size:16.5px;\">下一关</button>\n      </div>\n    </div>\n  </div>\n\n  <!-- ==================== 弹窗 H：星晷步数耗尽 · 续步救援弹窗（修复漏洞5） ==================== -->\n  <div class=\"modal-mask\" id=\"out-of-moves-modal-mask\">\n    <div class=\"casual-modal-card\">\n      <div class=\"casual-header-pill\">步数耗尽</div>\n      <div class=\"casual-close-btn\" id=\"oom-close-x-btn\">\n        <svg width=\"19\" height=\"19\" viewBox=\"0 0 24 24\" stroke=\"#ffffff\" stroke-width=\"4.8\" stroke-linecap=\"round\"><line x1=\"6\" y1=\"6\" x2=\"18\" y2=\"18\"/><line x1=\"18\" y1=\"6\" x2=\"6\" y2=\"18\"/></svg>\n      </div>\n      <div class=\"pastel-sunburst-box\" style=\"height: 150px;\">\n        <div class=\"pastel-sunburst-rays\"></div>\n        <div class=\"pastel-sunburst-content\">\n          <svg width=\"110\" height=\"110\" viewBox=\"0 0 110 110\" filter=\"url(#ui3dDropShadow)\">\n            <circle cx=\"55\" cy=\"58\" r=\"38\" fill=\"url(#bombRedBadgeGrad)\" stroke=\"#ffffff\" stroke-width=\"4\"/>\n            <circle cx=\"55\" cy=\"58\" r=\"30\" fill=\"#fff1f2\" stroke=\"#f43f5e\" stroke-width=\"2.5\"/>\n            <line x1=\"55\" y1=\"58\" x2=\"55\" y2=\"38\" stroke=\"#be123c\" stroke-width=\"4.5\" stroke-linecap=\"round\"/>\n            <line x1=\"55\" y1=\"58\" x2=\"70\" y2=\"58\" stroke=\"#f43f5e\" stroke-width=\"4\" stroke-linecap=\"round\"/>\n            <circle cx=\"55\" cy=\"58\" r=\"4.5\" fill=\"#9f1239\"/>\n            <rect x=\"46\" y=\"12\" width=\"18\" height=\"6\" rx=\"3\" fill=\"#fbbf24\" stroke=\"#78350f\" stroke-width=\"2\"/>\n          </svg>\n        </div>\n      </div>\n      <div style=\"font-size:18px;font-weight:900;color:#be123c;margin-bottom:6px;\">⚠️ 步数已用尽！</div>\n      <div style=\"font-size:13px;font-weight:800;color:#7c582c;margin-bottom:16px;\">是否增加 +5 步继续游戏？</div>\n      <button class=\"casual-green-btn\" id=\"oom-add-moves-btn\" style=\"width:100%;margin-bottom:10px;\">\n        <svg width=\"26\" height=\"18\" viewBox=\"0 0 28 20\" fill=\"#ffffff\">\n          <rect x=\"1\" y=\"2\" width=\"18\" height=\"16\" rx=\"4\"/>\n          <polygon points=\"19,7 27,3 27,17 19,13\" stroke-linejoin=\"round\"/>\n          <polygon points=\"8,6.5 8,13.5 14,10\" fill=\"#2e8500\"/>\n        </svg>\n        <span>免费增加 5 步</span>\n      </button>\n      <button class=\"casual-cyan-btn\" id=\"oom-restart-btn\" style=\"width:100%;padding:9px 0;font-size:16px;\">↻ 重新挑战本关</button>\n    </div>\n  </div>";
      while (wrap.firstChild) {
        document.body.appendChild(wrap.firstChild);
      }
    }
    const domCan = document.getElementById('pure-game-canvas');
    if (domCan) wrapCanvasInstance(domCan);
  }

  // --------------------------------------------------------------------------
  // 4. WebAudio / 震动 / 本地存储 跨端桥接
  // --------------------------------------------------------------------------
  if (nativeApi) {
    if (typeof _g.AudioContext === 'undefined' && typeof _g.webkitAudioContext === 'undefined' && typeof nativeApi.createWebAudioContext === 'function') {
      safeSetProp(_g, 'AudioContext', function () {
        return nativeApi.createWebAudioContext();
      });
    }
    if (!_g.navigator) safeSetProp(_g, 'navigator', {});
    if (_g.navigator && typeof _g.navigator.vibrate !== 'function' && typeof nativeApi.vibrateShort === 'function') {
      try {
        _g.navigator.vibrate = function () {
          try { nativeApi.vibrateShort({ type: 'light' }); } catch (e) {}
        };
      } catch (e) {}
    }
    if (typeof _g.localStorage === 'undefined' && typeof nativeApi.getStorageSync === 'function') {
      safeSetProp(_g, 'localStorage', {
        getItem(k) { try { const v = nativeApi.getStorageSync(k); return v === '' || v === undefined ? null : String(v); } catch (e) { return null; } },
        setItem(k, v) { try { nativeApi.setStorageSync(k, String(v)); } catch (e) {} },
        removeItem(k) { try { nativeApi.removeStorageSync(k); } catch (e) {} }
      });
    }
  }
  if (typeof _g.requestAnimationFrame !== 'function') {
    _g.requestAnimationFrame = function (cb) { return setTimeout(() => cb(Date.now()), 16); };
  }
  if (typeof _g.cancelAnimationFrame !== 'function') {
    _g.cancelAnimationFrame = function (id) { clearTimeout(id); };
  }
  if (typeof _g.performance === 'undefined' || typeof _g.performance.now !== 'function') {
    const t0 = Date.now();
    _g.performance = { now: () => Date.now() - t0 };
  }
})();


// ==========================================
    // 1. 8 色高质感丝滑琉璃秘药色板 & 全局共享 SVG <defs>
    // ==========================================
    const COLORS = {
      red:    { name: '红色', left: '#b30804', mid: '#c40a05', highlight: '#dc1e18', right: '#9c0603', topMid: '#e31a1a', topRim: '#fc2829', topLight: '#ff7878', bagMain: '#d4151d', bagDark: '#990910' },
      yellow: { name: '黄色', left: '#ebb008', mid: '#fcc00b', highlight: '#ffd438', right: '#d99f04', topMid: '#fbd126', topRim: '#ffdb2c', topLight: '#fffb8b', bagMain: '#f5a600', bagDark: '#c27d00' },
      blue:   { name: '蓝色', left: '#1515ad', mid: '#1b1bc0', highlight: '#3238d9', right: '#101096', topMid: '#3a56ca', topRim: '#4a68d8', topLight: '#7a96ff', bagMain: '#1c31cc', bagDark: '#101d8a' },
      green:  { name: '绿色', left: '#689905', mid: '#72a506', highlight: '#86ba14', right: '#588503', topMid: '#97cb1d', topRim: '#b2df4f', topLight: '#cff877', bagMain: '#5AA21A', bagDark: '#3F7710' },
      purple: { name: '紫色', left: '#5f1294', mid: '#7319b0', highlight: '#8e2dcf', right: '#4b0c78', topMid: '#9638d6', topRim: '#b055ed', topLight: '#deb3ff', bagMain: '#731fa8', bagDark: '#4d1078' },
      orange: { name: '橙色', left: '#cf4400', mid: '#e65000', highlight: '#f5681a', right: '#b03800', topMid: '#ff731c', topRim: '#ff8f3d', topLight: '#ffc285', bagMain: '#ea5504', bagDark: '#b33c00' },
      cyan:   { name: '青色', left: '#0784c4', mid: '#0e9ae0', highlight: '#2bb6f7', right: '#056da6', topMid: '#2cb9fc', topRim: '#57ccff', topLight: '#a6e9ff', bagMain: '#149ee3', bagDark: '#0b72ab' },
      pink:   { name: '粉色', left: '#c71864', mid: '#e02476', highlight: '#f54290', right: '#a31050', topMid: '#f74d97', topRim: '#ff70ae', topLight: '#ffb3d2', bagMain: '#e02476', bagDark: '#a31050' }
    };
    const COLOR_KEYS = ['red', 'yellow', 'blue', 'green', 'purple', 'orange', 'cyan', 'pink'];

    function initGlobalBottleDefs() {
      const defsEl = document.getElementById('global-bottle-defs');
      if (!defsEl) return;
      let d = '';
      Object.entries(COLORS).forEach(([key, col]) => {
        /* 4区 PBR 立体柔光体积着色：左上暖阳受光面 -> 饱满中调 -> 右下深邃体积暗部 -> 右缘环境反光 */
        d += `<linearGradient id="liq-${key}" x1="0%" y1="0%" x2="100%" y2="8%"><stop offset="0%" stop-color="${col.highlight}"/><stop offset="18%" stop-color="${col.topMid}"/><stop offset="52%" stop-color="${col.mid}"/><stop offset="84%" stop-color="${col.right}"/><stop offset="100%" stop-color="${col.left}"/></linearGradient>`;
        d += `<linearGradient id="top-${key}" x1="15%" y1="0%" x2="85%" y2="100%"><stop offset="0%" stop-color="${col.topLight}"/><stop offset="38%" stop-color="${col.topRim}"/><stop offset="85%" stop-color="${col.topMid}"/><stop offset="100%" stop-color="${col.mid}"/></linearGradient>`;
      });
      d += `
        <linearGradient id="liq-mystery" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#03050a"/><stop offset="35%" stop-color="#090c16"/><stop offset="76%" stop-color="#1c2236"/><stop offset="100%" stop-color="#020308"/></linearGradient>
        <linearGradient id="top-mystery" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#151b2e"/><stop offset="70%" stop-color="#252f4a"/><stop offset="100%" stop-color="#090c16"/></linearGradient>
        <linearGradient id="checkGreenGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#86efac"/><stop offset="45%" stop-color="#22c55e"/><stop offset="100%" stop-color="#15803d"/></linearGradient>
        <linearGradient id="neckLipGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="rgba(255, 248, 230, 0.65)"/><stop offset="18%" stop-color="rgba(255, 255, 255, 0.88)"/><stop offset="48%" stop-color="rgba(240, 225, 195, 0.42)"/><stop offset="76%" stop-color="rgba(255, 255, 255, 0.92)"/><stop offset="100%" stop-color="rgba(245, 230, 200, 0.68)"/></linearGradient>
        <linearGradient id="neckTopRimGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="rgba(255, 250, 235, 0.82)"/><stop offset="30%" stop-color="#ffffff"/><stop offset="65%" stop-color="rgba(254, 243, 199, 0.75)"/><stop offset="100%" stop-color="#ffffff"/></linearGradient>
        <linearGradient id="mouthBoreGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(180, 140, 85, 0.28)"/><stop offset="60%" stop-color="rgba(255, 248, 230, 0.36)"/><stop offset="100%" stop-color="rgba(255, 255, 255, 0.65)"/></linearGradient>
        <radialGradient id="leftShoulderDomeGrad" cx="35%" cy="35%" r="65%"><stop offset="0%" stop-color="rgba(255, 255, 255, 0.42)"/><stop offset="58%" stop-color="rgba(255, 250, 235, 0.14)"/><stop offset="100%" stop-color="rgba(255, 250, 235, 0.0)"/></radialGradient>
        <radialGradient id="rightShoulderSoftGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(255, 255, 255, 0.48)"/><stop offset="55%" stop-color="rgba(255, 250, 235, 0.20)"/><stop offset="100%" stop-color="rgba(255, 250, 235, 0.0)"/></radialGradient>
        <filter id="naturalGlassBlur" x="-15%" y="-10%" width="130%" height="120%"><feGaussianBlur stdDeviation="1.05"/></filter>
        <filter id="warmCastShadowBlur" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4.6"/></filter>
        <linearGradient id="naturalRimGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(255, 255, 255, 0.85)"/><stop offset="25%" stop-color="rgba(255, 248, 225, 0.65)"/><stop offset="65%" stop-color="rgba(255, 255, 255, 0.48)"/><stop offset="90%" stop-color="rgba(255, 244, 210, 0.52)"/><stop offset="100%" stop-color="rgba(255, 250, 235, 0.38)"/></linearGradient>
        <linearGradient id="windowShoulderGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="rgba(255, 255, 255, 0.52)"/><stop offset="50%" stop-color="rgba(255, 253, 245, 0.62)"/><stop offset="90%" stop-color="rgba(255, 248, 225, 0.30)"/><stop offset="100%" stop-color="rgba(255, 248, 225, 0.05)"/></linearGradient>
        <linearGradient id="rightPillarSheen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(255, 255, 255, 0.38)"/><stop offset="45%" stop-color="rgba(255, 252, 240, 0.22)"/><stop offset="85%" stop-color="rgba(255, 248, 225, 0.08)"/><stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/></linearGradient>
        <linearGradient id="leftWallSheen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(255, 255, 255, 0.28)"/><stop offset="65%" stop-color="rgba(255, 250, 235, 0.10)"/><stop offset="100%" stop-color="rgba(255, 250, 235, 0.0)"/></linearGradient>
        <linearGradient id="glassBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="rgba(255, 252, 242, 0.24)"/><stop offset="22%" stop-color="rgba(255, 248, 232, 0.09)"/><stop offset="58%" stop-color="rgba(255, 246, 225, 0.06)"/><stop offset="84%" stop-color="rgba(255, 254, 248, 0.26)"/><stop offset="100%" stop-color="rgba(255, 250, 235, 0.20)"/></linearGradient>
        <!-- 借鉴参考图3 (image_6ee02d) 的 3D 沉底厚玻璃折射渐变：深邃玻璃内折射暗部 + 两侧高折射冷暖焦散亮翼 -->
        <linearGradient id="baseCushionGrad" x1="0%" y1="0%" x2="100%" y2="12%">
          <stop offset="0%" stop-color="rgba(255, 252, 240, 0.62)"/>
          <stop offset="14%" stop-color="rgba(165, 215, 255, 0.34)"/>
          <stop offset="32%" stop-color="rgba(28, 36, 58, 0.44)"/>
          <stop offset="52%" stop-color="rgba(18, 26, 48, 0.52)"/>
          <stop offset="72%" stop-color="rgba(42, 56, 88, 0.38)"/>
          <stop offset="88%" stop-color="rgba(195, 232, 255, 0.58)"/>
          <stop offset="100%" stop-color="rgba(255, 252, 240, 0.68)"/>
        </linearGradient>
        <linearGradient id="glassBaseInnerFloorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(255, 255, 255, 0.55)"/>
          <stop offset="25%" stop-color="rgba(160, 212, 255, 0.28)"/>
          <stop offset="50%" stop-color="rgba(30, 42, 68, 0.35)"/>
          <stop offset="78%" stop-color="rgba(175, 224, 255, 0.42)"/>
          <stop offset="100%" stop-color="rgba(255, 255, 255, 0.62)"/>
        </linearGradient>
        <linearGradient id="glassBaseRimHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)"/>
          <stop offset="18%" stop-color="rgba(255, 255, 255, 0.78)"/>
          <stop offset="50%" stop-color="rgba(190, 230, 255, 0.42)"/>
          <stop offset="82%" stop-color="rgba(255, 255, 255, 0.88)"/>
          <stop offset="100%" stop-color="rgba(255, 255, 255, 0.18)"/>
        </linearGradient>
        <linearGradient id="glassWallSideRefractL" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(255, 255, 255, 0.42)"/>
          <stop offset="60%" stop-color="rgba(175, 220, 255, 0.16)"/>
          <stop offset="100%" stop-color="rgba(255, 255, 255, 0.0)"/>
        </linearGradient>
        <linearGradient id="glassWallSideRefractR" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="rgba(255, 255, 255, 0.0)"/>
          <stop offset="40%" stop-color="rgba(175, 220, 255, 0.18)"/>
          <stop offset="100%" stop-color="rgba(255, 255, 255, 0.48)"/>
        </linearGradient>
        <linearGradient id="ikeaCorkTopGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fef9c3"/><stop offset="45%" stop-color="#facc15"/><stop offset="100%" stop-color="#d97706"/></linearGradient>
        <linearGradient id="ikeaCorkSideGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#b45309"/><stop offset="25%" stop-color="#fde047"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="82%" stop-color="#fef08a"/><stop offset="100%" stop-color="#92400e"/></linearGradient>
        <linearGradient id="ikeaCorkPlugGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#78350f"/><stop offset="45%" stop-color="#d97706"/><stop offset="80%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#652b0d"/></linearGradient>
        <linearGradient id="catEarInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffb8dc" stop-opacity="0.72"/><stop offset="60%" stop-color="#ff6fae" stop-opacity="0.45"/><stop offset="100%" stop-color="#b8256e" stop-opacity="0.28"/></linearGradient>
        <radialGradient id="catBellGrad" cx="35%" cy="30%" r="65%"><stop offset="0%" stop-color="#fff8c4"/><stop offset="45%" stop-color="#ffd54f"/><stop offset="85%" stop-color="#e68a00"/><stop offset="100%" stop-color="#8c4b00"/></radialGradient>
        <linearGradient id="catCollarGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#9e1446"/><stop offset="28%" stop-color="#ff4d8d"/><stop offset="55%" stop-color="#ff85b3"/><stop offset="82%" stop-color="#e01e63"/><stop offset="100%" stop-color="#800b34"/></linearGradient>
        <radialGradient id="mystGoldGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(253, 224, 71, 0.55)"/><stop offset="60%" stop-color="rgba(234, 179, 8, 0.22)"/><stop offset="100%" stop-color="rgba(234, 179, 8, 0.0)"/></radialGradient>
        <radialGradient id="purpleVortexGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(216, 180, 254, 0.55)"/><stop offset="55%" stop-color="rgba(168, 85, 247, 0.28)"/><stop offset="100%" stop-color="rgba(107, 33, 168, 0.0)"/></radialGradient>
        <radialGradient id="purpleSideGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="rgba(232, 121, 249, 0.52)"/><stop offset="100%" stop-color="rgba(168, 85, 247, 0.0)"/></radialGradient>
        <linearGradient id="camPurpleFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#c084fc"/><stop offset="55%" stop-color="#9333ea"/><stop offset="100%" stop-color="#581c87"/></linearGradient>
        <linearGradient id="camBlueFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#ffffff"/><stop offset="65%" stop-color="#e3f3ff"/><stop offset="100%" stop-color="#b3dcff"/></linearGradient>
        <linearGradient id="silkDrapeGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#bfdbfe"/><stop offset="28%" stop-color="#ffffff"/><stop offset="62%" stop-color="#dbeafe"/><stop offset="100%" stop-color="#7dd3fc"/></linearGradient>
        <!-- 高定凝霜玻璃与磨砂琉璃渐变（贴合瓶身真实轮廓，告别塑料多边形） -->
        <linearGradient id="frostGlazeVertGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(224, 247, 255, 0.0)"/>
          <stop offset="18%" stop-color="rgba(210, 245, 255, 0.38)"/>
          <stop offset="55%" stop-color="rgba(165, 230, 255, 0.62)"/>
          <stop offset="88%" stop-color="rgba(125, 211, 252, 0.78)"/>
          <stop offset="100%" stop-color="rgba(224, 247, 255, 0.88)"/>
        </linearGradient>
        <linearGradient id="fullFrostGlassGrad" x1="0%" y1="0%" x2="100%" y2="12%">
          <stop offset="0%" stop-color="rgba(224, 247, 255, 0.78)"/>
          <stop offset="25%" stop-color="rgba(165, 232, 255, 0.56)"/>
          <stop offset="58%" stop-color="rgba(56, 189, 248, 0.48)"/>
          <stop offset="84%" stop-color="rgba(224, 247, 255, 0.75)"/>
          <stop offset="100%" stop-color="rgba(125, 211, 252, 0.68)"/>
        </linearGradient>
        <linearGradient id="smokedAmberFrostedGrad" x1="0%" y1="0%" x2="100%" y2="8%">
          <stop offset="0%" stop-color="rgba(120, 72, 28, 0.86)"/>
          <stop offset="24%" stop-color="rgba(168, 108, 48, 0.78)"/>
          <stop offset="55%" stop-color="rgba(92, 52, 18, 0.88)"/>
          <stop offset="84%" stop-color="rgba(212, 152, 82, 0.82)"/>
          <stop offset="100%" stop-color="rgba(82, 44, 14, 0.88)"/>
        </linearGradient>
        <linearGradient id="royalVelvetFrostedGrad" x1="0%" y1="0%" x2="100%" y2="8%">
          <stop offset="0%" stop-color="rgba(46, 68, 118, 0.86)"/>
          <stop offset="24%" stop-color="rgba(88, 124, 188, 0.78)"/>
          <stop offset="56%" stop-color="rgba(32, 48, 92, 0.88)"/>
          <stop offset="84%" stop-color="rgba(148, 188, 242, 0.82)"/>
          <stop offset="100%" stop-color="rgba(28, 42, 82, 0.88)"/>
        </linearGradient>
        <linearGradient id="iceBaseBackGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="rgba(130, 235, 255, 0.72)"/><stop offset="100%" stop-color="rgba(20, 130, 210, 0.85)"/></linearGradient>
        <linearGradient id="iceFacetLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#67e8f9"/><stop offset="100%" stop-color="#0891b2"/></linearGradient>
        <linearGradient id="iceFacetMidGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#cffafe"/><stop offset="52%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#0e7490"/></linearGradient>
        <linearGradient id="iceFacetRightGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#155e75"/></linearGradient>
        <linearGradient id="fullIceGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#38bdf8"/><stop offset="32%" stop-color="#bae6fd"/><stop offset="68%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#0284c7"/></linearGradient>
        <linearGradient id="stoneLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#e3c9a8"/><stop offset="60%" stop-color="#b8936a"/><stop offset="100%" stop-color="#7d5a38"/></linearGradient>
        <linearGradient id="stoneMidGrad" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#edd6b8"/><stop offset="50%" stop-color="#c49d71"/><stop offset="100%" stop-color="#6e4b2a"/></linearGradient>
        <linearGradient id="stoneRightGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#d4b28c"/><stop offset="100%" stop-color="#694626"/></linearGradient>
        <linearGradient id="kraftInnerMouthGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#6e3f16"/><stop offset="50%" stop-color="#8f5522"/><stop offset="100%" stop-color="#542e0e"/></linearGradient>
        <linearGradient id="kraftBagFrontGrad" x1="0%" y1="0%" x2="100%" y2="12%"><stop offset="0%" stop-color="#e3ae78"/><stop offset="42%" stop-color="#d4985e"/><stop offset="82%" stop-color="#bd7e43"/><stop offset="100%" stop-color="#a6682e"/></linearGradient>
        <linearGradient id="kraftSunlitGrad" x1="0%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="rgba(255, 236, 208, 0.34)"/><stop offset="60%" stop-color="rgba(255, 230, 195, 0.12)"/><stop offset="100%" stop-color="rgba(255, 230, 195, 0.0)"/></linearGradient>
        <linearGradient id="kraftSideLeftGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#a86b34"/><stop offset="100%" stop-color="#7d491b"/></linearGradient>
        <linearGradient id="kraftSideRightGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#734216"/><stop offset="100%" stop-color="#9c622d"/></linearGradient>
        <linearGradient id="stickerRedLiqGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#b91c1c"/><stop offset="35%" stop-color="#dc2626"/><stop offset="78%" stop-color="#ef4444"/><stop offset="100%" stop-color="#991b1b"/></linearGradient>
      `;
      defsEl.innerHTML = d;
    }

    const userSettings = { sound: true, vibrate: true, music: true, zoom: true };
    let speedLevel = 0;
    let speedPoints = 10;
    let isSpeed2x = false;

    function getSpeedMultiplier() {
      const baseMul = 1 + (speedPoints - 10) * 0.08;
      return isSpeed2x ? baseMul * 1.75 : baseMul;
    }

    function triggerHaptic(ms = 12) {
      if (userSettings.vibrate && navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) {
        try { navigator.vibrate(ms); } catch (e) {}
      }
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let cachedPinkNoiseBuffer = null;

    function ensureAudio() {
      if (!audioCtx && AudioCtx) audioCtx = new AudioCtx();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
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
      cavityFilter.Q.setValueAtTime(cavityQ, now);
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

      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(glugRateHz, now);
      lfoGain.gain.setValueAtTime(streamGainLevel * 0.15, now);
      lfo.connect(lfoGain); lfoGain.connect(mainGain.gain);

      noiseSrc.connect(cavityFilter); cavityFilter.connect(warmthLowpass); warmthLowpass.connect(mainGain); mainGain.connect(audioCtx.destination);
      noiseSrc.start(now); lfo.start(now);
      noiseSrc.stop(now + durSec + 0.02); lfo.stop(now + durSec + 0.02);

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
    }

    // 真实生活级物理拟音辅助函数：产生温润木质/玻璃/软木塞/亚麻布原声质感，绝不刺耳吵闹
    function playWarmAcousticNote(freqStart, freqEnd, startTime, duration, peakGain = 0.065, waveType = 'sine', cutoffHz = 1100) {
      if (!audioCtx || typeof audioCtx.createOscillator !== 'function') return;
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
    }

    function playNoiseBrush(startTime, duration, freqStart, freqEnd, qVal = 3.0, peakGain = 0.05) {
      if (!audioCtx || typeof audioCtx.createOscillator !== 'function') return;
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
          x: mt*mt*mt*62.8 + 3*mt*mt*t*75.5 + 3*mt*t*t*81.3 + t*t*t*81.3,
          y: mt*mt*mt*26.0 + 3*mt*mt*t*30.2 + 3*mt*t*t*39.2 + t*t*t*55.0
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
          x: mt*mt*mt*18.7 + 3*mt*mt*t*18.7 + 3*mt*t*t*24.5 + t*t*t*37.2,
          y: mt*mt*mt*55.0 + 3*mt*mt*t*39.2 + 3*mt*t*t*30.2 + t*t*t*26.0
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
      return function() {
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
          { id: 7,  maxCap: 4, layers: [], special: 'none' },
          { id: 8,  maxCap: 4, layers: [], special: 'none' },
          { id: 9,  maxCap: 4, layers: [], special: 'ad_cam' },
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
          { slot: 2, color: null,    locked: true,  packedBottle: null },
          { slot: 3, color: null,    locked: true,  packedBottle: null }
        ];
        cfg.bottles = () => [
          ...filled.map((layers, idx) => ({ id: idx, maxCap: 4, layers: layers.slice(), special: 'none' })),
          { id: 8,  maxCap: 4, layers: [], special: 'none' },
          { id: 9,  maxCap: 4, layers: [], special: 'none' },
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
          { id: 0,  maxCap: 2, layers: [c2A, c2B], special: 'none' },
          { id: 1,  maxCap: 6, layers: tubes6[0].slice(0, 5), special: 'ice_base', poursToBreak: 1 },
          { id: 2,  maxCap: 4, layers: tubes4[0].slice(), special: 'none', mysteryCount: useFunnelAndBombHere ? 0 : 1, countdownMoves: useFunnelAndBombHere ? 9 : null },
          { id: 3,  maxCap: 6, layers: tubes6[1].slice(0, 5), special: 'none', mysteryCount: 2 },
          { id: 4,  maxCap: 2, layers: [c2B, c2A], special: 'none' },
          { id: 5,  maxCap: 4, layers: tubes4[1].slice(), special: 'stone_base', poursToBreak: 2 },
          { id: 6,  maxCap: 2, layers: [], special: 'none' },
          { id: 7,  maxCap: 4, layers: tubes4[2].slice(), special: 'none', mysteryCount: 1 },
          { id: 8,  maxCap: 6, layers: [tubes6[0][5], tubes6[1][5]], special: 'none' },
          { id: 9,  maxCap: 4, layers: [], special: useColorLockHere ? 'color_lock' : 'none', requiredColor: useColorLockHere ? lockCol4 : null },
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
          { slot: 2, color: null,           locked: true,  packedBottle: null },
          { slot: 3, color: null,           locked: true,  packedBottle: null }
        ];
        const useAdv = chapter >= 2;
        const useAdv3 = chapter >= 3;
        const cRed = openPalette[4];
        const cBlue = openPalette[3];
        const cCyan = lockedPalette[0];
        const cPurple = lockedPalette[1];
        const cPink = lockedPalette[2];

        cfg.bottles = () => [
          { id: 0,  maxCap: 4, layers: openTubes[0].slice(0, 3), special: 'none' },
          { id: 1,  maxCap: 4, layers: openTubes[1].slice(), special: 'none', mysteryCount: 2, countdownMoves: useAdv3 ? 8 : null },
          { id: 2,  maxCap: 4, layers: openTubes[2].slice(), special: 'none' },
          { id: 3,  maxCap: 4, layers: lockedTubes[0].slice(), special: 'silk_drape', unlockOrder: 1 },
          { id: 4,  maxCap: 4, layers: openTubes[3].slice(), special: 'none', mysteryCount: 2 },
          { id: 5,  maxCap: 4, layers: openTubes[4].slice(), special: 'ice_base', poursToBreak: 2 },
          { id: 6,  maxCap: 4, layers: [openTubes[0][3]], special: useAdv3 ? 'one_way_out' : 'none' },
          { id: 7,  maxCap: 4, layers: [], special: 'ad_cam' },
          { id: 8,  maxCap: 4, layers: [cCyan, cPurple], special: 'none' },
          { id: 9,  maxCap: 4, layers: [cPurple, cCyan, cPink, cCyan], special: 'none', mysteryCount: 2 },
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
          { slot: 2, color: null,    locked: true,  packedBottle: null },
          { slot: 3, color: null,    locked: true,  packedBottle: null }
        ];
      }

      cfg.bottles = () => {
        // 第 4 关：星雾盲盒首次登场
        if (levelNum === 4) {
          return [
            { id: 0,  maxCap: 4, layers: tubesA[0].slice(), special: 'none', mysteryCount: 2 },
            { id: 1,  maxCap: 4, layers: tubesA[1].slice(), special: 'none', mysteryCount: 2 },
            { id: 2,  maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: 2 },
            { id: 3,  maxCap: 4, layers: tubesA[3].slice(), special: 'none', mysteryCount: 2 },
            { id: 4,  maxCap: 4, layers: tubesA[4].slice(), special: 'none', mysteryCount: 2 },
            { id: 5,  maxCap: 4, layers: tubesA[5].slice(), special: 'none', mysteryCount: 1 },
            { id: 6,  maxCap: 4, layers: tubesB[0].slice(), special: 'none', mysteryCount: 1 },
            { id: 7,  maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
            { id: 8,  maxCap: 4, layers: [], special: 'none' },
            { id: 9,  maxCap: 4, layers: [], special: 'none' },
            { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
            { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
          ];
        }

        // 第 6 关：极地霜晶底座首次登场
        if (levelNum === 6) {
          return [
            { id: 0,  maxCap: 4, layers: tubesA[0].slice(), special: 'none', mysteryCount: 1 },
            { id: 1,  maxCap: 4, layers: tubesA[1].slice(), special: 'ice_base', poursToBreak: 1 },
            { id: 2,  maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: 1 },
            { id: 3,  maxCap: 4, layers: tubesA[3].slice(), special: 'ice_base', poursToBreak: 2 },
            { id: 4,  maxCap: 4, layers: tubesA[4].slice(), special: 'none', mysteryCount: 1 },
            { id: 5,  maxCap: 4, layers: tubesA[5].slice(), special: 'ice_base', poursToBreak: 2 },
            { id: 6,  maxCap: 4, layers: tubesB[0].slice(), special: 'none' },
            { id: 7,  maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
            { id: 8,  maxCap: 4, layers: [], special: 'none' },
            { id: 9,  maxCap: 4, layers: [], special: 'none' },
            { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
            { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
          ];
        }

        // 第 7 关：星缎礼袍首次登场
        if (levelNum === 7) {
          return [
            { id: 0,  maxCap: 4, layers: tubesA[0].slice(), special: 'none', mysteryCount: 1 },
            { id: 1,  maxCap: 4, layers: tubesA[1].slice(), special: 'ice_base', poursToBreak: 1 },
            { id: 2,  maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: 1 },
            { id: 3,  maxCap: 4, layers: tubesA[3].slice(), special: 'none', mysteryCount: 1 },
            { id: 4,  maxCap: 4, layers: tubesA[4].slice(), special: 'ice_base', poursToBreak: 2 },
            { id: 5,  maxCap: 4, layers: tubesA[5].slice(), special: 'none' },
            { id: 6,  maxCap: 4, layers: tubesB[0].slice(), special: 'silk_drape', unlockOrder: 1 },
            { id: 7,  maxCap: 4, layers: tubesB[1].slice(), special: 'silk_drape', unlockOrder: 2 },
            { id: 8,  maxCap: 4, layers: [], special: 'none' },
            { id: 9,  maxCap: 4, layers: [], special: 'none' },
            { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
            { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
          ];
        }

        // 第 12 关 & 所有后续 Pos 2（除第22关外）：🔒 专属色环契约局（防死锁规范 10：1只色环空瓶 + 2只通用免费空瓶）
        if (pos === 2 && levelNum !== 22) {
          return [
            { id: 0,  maxCap: 4, layers: tubesA[0].slice(), special: 'none', mysteryCount: 1 },
            { id: 1,  maxCap: 4, layers: tubesA[1].slice(), special: 'ice_base', poursToBreak: 1 },
            { id: 2,  maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: 1 },
            { id: 3,  maxCap: 4, layers: tubesA[3].slice(), special: 'none', mysteryCount: 1 },
            { id: 4,  maxCap: 4, layers: tubesA[4].slice(), special: 'none' },
            { id: 5,  maxCap: 4, layers: tubesA[5].slice(), special: 'none' },
            { id: 6,  maxCap: 4, layers: tubesB[0].slice(), special: 'silk_drape', unlockOrder: 1 },
            { id: 7,  maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
            { id: 8,  maxCap: 4, layers: [], special: 'color_lock', requiredColor: topExposedColor },
            { id: 9,  maxCap: 4, layers: [], special: 'none' },
            { id: 10, maxCap: 4, layers: [], special: 'none' },
            { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
          ];
        }

        // 第 16 关 & 所有后续 Pos 6：⏬ 单向接水漏斗缓冲谷（第26关同步解锁 ⏳ 星砂流沙炸弹瓶！）
        if (pos === 6 && levelNum >= 16) {
          const hasBombHere = (levelNum >= 26);
          return [
            { id: 0,  maxCap: 4, layers: tubesA[0].slice(), special: 'none', countdownMoves: hasBombHere ? 8 : null },
            { id: 1,  maxCap: 4, layers: tubesA[1].slice(), special: 'none', mysteryCount: 1 },
            { id: 2,  maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: (levelNum >= 36) ? 0 : 1, countdownMoves: (levelNum >= 36) ? 10 : null },
            { id: 3,  maxCap: 4, layers: tubesA[3].slice(), special: 'none', mysteryCount: 1 },
            { id: 4,  maxCap: 4, layers: tubesA[4].slice(), special: 'none' },
            { id: 5,  maxCap: 4, layers: tubesA[5].slice(1), special: 'none' },
            { id: 6,  maxCap: 4, layers: tubesB[0].slice(), special: 'paper_bag', unlockOrder: 1 },
            { id: 7,  maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
            { id: 8,  maxCap: 4, layers: [tubesA[5][0]], special: 'one_way_in' },
            { id: 9,  maxCap: 4, layers: [], special: 'none' },
            { id: 10, maxCap: 4, layers: [], special: 'none' },
            { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
          ];
        }

        // 第 22 关 & Pos 7（levelNum >= 17）：⏫ 单向出水古瓶局（消除鸽巢原理死锁：仅 B0 为单向古瓶，B1 破冰仅需1次合并，确保6种颜色拥有充足可接水瓶位！）
        if (levelNum === 22 || (pos === 7 && levelNum >= 17)) {
          return [
            { id: 0,  maxCap: 4, layers: tubesA[0].slice(), special: 'one_way_out' },
            { id: 1,  maxCap: 4, layers: tubesA[1].slice(), special: 'ice_base', poursToBreak: 1 },
            { id: 2,  maxCap: 4, layers: tubesA[2].slice(), special: 'none' },
            { id: 3,  maxCap: 4, layers: tubesA[3].slice(), special: 'none', mysteryCount: 1 },
            { id: 4,  maxCap: 4, layers: tubesA[4].slice(), special: 'none', mysteryCount: 1 },
            { id: 5,  maxCap: 4, layers: tubesA[5].slice(), special: 'none' },
            { id: 6,  maxCap: 4, layers: tubesB[0].slice(), special: 'full_ice', unlockOrder: 1 },
            { id: 7,  maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
            { id: 8,  maxCap: 4, layers: [], special: 'none' },
            { id: 9,  maxCap: 4, layers: [], special: 'none' },
            { id: 10, maxCap: 4, layers: [], special: 'ad_cam' },
            { id: 11, maxCap: 4, layers: [], special: 'ad_cam' }
          ];
        }

        // Pos 4（第一波峰 · 双重倒计时）& Pos 1（起势局）
        const useBombInPos4 = (pos === 4 && levelNum >= 24);
        const useAncientInPos1 = (pos === 1 && chapter >= 3);
        return [
          { id: 0,  maxCap: 4, layers: tubesA[0].slice(), special: useAncientInPos1 ? 'one_way_out' : 'none', mysteryCount: (useAncientInPos1 || useBombInPos4) ? 0 : 2, countdownMoves: useBombInPos4 ? 8 : null },
          { id: 1,  maxCap: 4, layers: tubesA[1].slice(), special: 'none', mysteryCount: 1 },
          { id: 2,  maxCap: 4, layers: tubesA[2].slice(), special: 'none', mysteryCount: (useBombInPos4 && chapter >= 4) ? 0 : 1, countdownMoves: (useBombInPos4 && chapter >= 4) ? 10 : null },
          { id: 3,  maxCap: 4, layers: tubesA[3].slice(), special: pos === 4 ? 'stone_base' : 'ice_base', poursToBreak: 1 },
          { id: 4,  maxCap: 4, layers: tubesA[4].slice(), special: 'none', mysteryCount: 1 },
          { id: 5,  maxCap: 4, layers: tubesA[5].slice(), special: pos === 4 ? 'stone_base' : 'none', poursToBreak: 2, mysteryCount: 1 },
          { id: 6,  maxCap: 4, layers: tubesB[0].slice(), special: 'none', mysteryCount: 1 },
          { id: 7,  maxCap: 4, layers: tubesB[1].slice(), special: 'none' },
          { id: 8,  maxCap: 4, layers: [], special: 'none' },
          { id: 9,  maxCap: 4, layers: [], special: 'none' },
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
      { id: 'zen_amber', name: '晨曦流金', unlocked: true,  unlockType: 'free',  topCol: '#e49f42', botCol: '#7c8554' },
      { id: 'starlight', name: '深邃星夜', unlocked: true,  unlockType: 'free',  topCol: '#191d52', botCol: '#090b24' },
      { id: 'volcanic',  name: '火山灰',   unlocked: true,  unlockType: 'free',  topCol: '#b8bac8', botCol: '#8d90a3' },
      { id: 'taro',      name: '香芋紫',   unlocked: false, unlockType: 'lv10',  topCol: '#dcd0f0', botCol: '#c2b0e2' },
      { id: 'orange',    name: '活力橙',   unlocked: false, unlockType: 'video', topCol: '#ffd8ad', botCol: '#f7b874' },
      { id: 'beach',     name: '夏日沙滩', unlocked: false, unlockType: 'video', isBeach: true }
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
        try { fn(); } catch (e) {}
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

    function cloneState() {
      flushAllInFlightLogicalStates();
      const raw = JSON.parse(JSON.stringify({ bottles, bags, packedTotal, pourCountTotal, remainingMoves, shuffleUses, undoUses, hintUses, addBottleUses }));
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
      const el = document.getElementById('toast-msg');
      const raw = String(msg || '');
      let orbGrad = 'radial-gradient(circle at 35% 28%, #7eeeff 0%, #2998ff 52%, #1252b3 100%)';
      let iconSvg = '<path d="M12,2 L14.8,9.2 L22,12 L14.8,14.8 L12,22 L9.2,14.8 L2,12 L9.2,9.2 Z" fill="#fef08a"/>';

      if (/漏斗|仅可注入/.test(raw)) {
        orbGrad = 'radial-gradient(circle at 35% 28%, #6ee7b7 0%, #10b981 55%, #047857 100%)';
        iconSvg = '<polygon points="6,6 18,6 14,13 14,19 10,19 10,13" fill="#fef08a"/><polygon points="8,9 16,9 12,15" fill="#064e3b"/>';
      } else if (/古瓶|仅可向外/.test(raw)) {
        orbGrad = 'radial-gradient(circle at 35% 28%, #fde047 0%, #f59e0b 55%, #b45309 100%)';
        iconSvg = '<polygon points="12,5 19,14 14.5,14 14.5,19 9.5,19 9.5,14 5,14" fill="#ffffff"/>';
      } else if (/契约|仅接纳|锁定|封印|礼袍|礼袋/.test(raw)) {
        orbGrad = 'radial-gradient(circle at 35% 28%, #f472b6 0%, #db2777 55%, #831843 100%)';
        iconSvg = '<rect x="6" y="11" width="12" height="9" rx="2.5" fill="#fef08a"/><path d="M8.5,11 V8.5 A3.5,3.5 0 0,1 15.5,8.5 V11" fill="none" stroke="#ffffff" stroke-width="2.2"/>';
      } else if (/冰|霜晶/.test(raw)) {
        orbGrad = 'radial-gradient(circle at 35% 28%, #bae6fd 0%, #0284c7 55%, #075985 100%)';
        iconSvg = '<path d="M12,4 V20 M5,8 L19,16 M5,16 L19,8" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>';
      } else if (/燃尽|灰烬|流沙|耗尽|危机/.test(raw)) {
        orbGrad = 'radial-gradient(circle at 35% 28%, #fdba74 0%, #ea580c 55%, #9a3412 100%)';
        iconSvg = '<path d="M12,3 C16,8 19,11 19,15 A7,7 0 0,1 5,15 C5,11 8,8 12,3 Z" fill="#fef08a"/><path d="M12,9 C14,12 15,13.5 15,15.5 A3,3 0 0,1 9,15.5 C9,13.5 10,12 12,9 Z" fill="#ea580c"/>';
      } else if (/撤回|重新|跳过/.test(raw)) {
        orbGrad = 'radial-gradient(circle at 35% 28%, #fde047 0%, #eab308 55%, #a16207 100%)';
        iconSvg = '<path d="M11,6 L5,11 L11,16 V12.5 C15,12.5 17.5,14.5 18,18 C19.5,13.5 18,9.5 11,9.5 Z" fill="#ffffff"/>';
      } else if (/完成|开启|解锁|升级|获得|补充|封存/.test(raw)) {
        orbGrad = 'radial-gradient(circle at 35% 28%, #86efac 0%, #22c55e 55%, #15803d 100%)';
        iconSvg = '<polyline points="6,12.5 10.2,16.5 18,7.5" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
      }

      const cleanText = raw.replace(/^[\s\u2000-\u3300\uD83C-\uDBFF\uDC00-\uDFFF\uFE00-\uFE0F]+/g, '').trim();
      el.innerHTML = `
        <span class="toast-icon-orb" style="background:${orbGrad};">
          <svg width="16" height="16" viewBox="0 0 24 24">${iconSvg}</svg>
        </span>
        <span class="toast-text-span">${cleanText || raw}</span>
      `;
      el.classList.add('show');
      clearTimeout(el._timer);
      el._timer = setTimeout(() => el.classList.remove('show'), 2300);
    }

    function startSelectSloshAnimation(bottleIdx) {
      if (selectSloshRaf) cancelAnimationFrame(selectSloshRaf);
      selectSloshStart = performance.now();

      function tickSlosh(now) {
        if (selectedIndex !== bottleIdx || isAnimating) {
          if (window._canvasSloshMap) delete window._canvasSloshMap[bottleIdx];
          selectSloshRaf = null;
          return;
        }
        const b = bottles[bottleIdx];
        const liqGroup = document.getElementById(`liquid-group-${bottleIdx}`);
        if (!b || b.removed || !liqGroup || b.layers.length === 0) { selectSloshRaf = null; return; }

        const dt = (now - selectSloshStart) / 1000;
        const amp = Math.exp(-2.65 * dt) * 1.05;
        const phase = dt * 13.5;

        if (amp < 0.008) {
          if (window._canvasSloshMap) delete window._canvasSloshMap[bottleIdx];
          selectSloshRaf = null;
          return;
        }
        window._canvasSloshMap = window._canvasSloshMap || {};
        window._canvasSloshMap[bottleIdx] = { sloshPhase: phase, sloshAmplitude: amp };
        selectSloshRaf = requestAnimationFrame(tickSlosh);
      }
      selectSloshRaf = requestAnimationFrame(tickSlosh);
    }

    let settleSloshRafMap = {};
    function stopSelectSloshAnimation() {
      if (selectSloshRaf) { cancelAnimationFrame(selectSloshRaf); selectSloshRaf = null; }
      if (window._canvasSloshMap && selectedIndex !== null) delete window._canvasSloshMap[selectedIndex];
    }

    // 瓶子放下落定时的轻柔余波晃动（模拟瓶底落回麻布软垫时的流体惯性）
    function startSettleSloshAnimation(bottleIdx, initialAmp = 0.58) {
      if (bottleIdx === null || bottleIdx === undefined || bottleIdx < 0) return;
      if (settleSloshRafMap[bottleIdx]) cancelAnimationFrame(settleSloshRafMap[bottleIdx]);
      const startT = performance.now();
      function tickSettle(now) {
        if (selectedIndex === bottleIdx || isAnimating) {
          if (window._canvasSloshMap) delete window._canvasSloshMap[bottleIdx];
          delete settleSloshRafMap[bottleIdx];
          return;
        }
        const b = bottles[bottleIdx];
        const liqGroup = document.getElementById(`liquid-group-${bottleIdx}`);
        if (!b || b.removed || !liqGroup || b.layers.length === 0) {
          delete settleSloshRafMap[bottleIdx];
          return;
        }
        const dt = (now - startT) / 1000;
        const amp = Math.exp(-3.4 * dt) * initialAmp;
        const phase = dt * 12.8;
        if (amp < 0.008) {
          if (window._canvasSloshMap) delete window._canvasSloshMap[bottleIdx];
          delete settleSloshRafMap[bottleIdx];
          return;
        }
        window._canvasSloshMap = window._canvasSloshMap || {};
        window._canvasSloshMap[bottleIdx] = { sloshPhase: phase, sloshAmplitude: amp };
        settleSloshRafMap[bottleIdx] = requestAnimationFrame(tickSettle);
      }
      settleSloshRafMap[bottleIdx] = requestAnimationFrame(tickSettle);
    }

    // 原地丝滑更新瓶子选中/放下状态（绝不清空重建 #bottles-grid，从而100%保留 CSS 弹簧过渡动画！）
    function updateBottleSelectionDOM(prevIdx = null, nextIdx = null) {
      const gridEl = document.getElementById('bottles-grid');
      if (!gridEl || gridEl.children.length !== bottles.length) {
        renderAll();
        return;
      }
      const selB = (nextIdx !== null && bottles[nextIdx]) ? bottles[nextIdx] : null;
      const selTop = (selB && selB.layers && selB.layers.length > 0) ? selB.layers[selB.layers.length - 1] : null;

      bottles.forEach((b, idx) => {
        const slot = gridEl.children[idx];
        if (!slot || b.removed) return;

        // 清除入场动画残留类，避免干扰选中或放下过渡
        slot.classList.remove('level-enter-anim');
        slot.style.animationDelay = '';

        const isNowSelected = (nextIdx === idx);
        const wasSelected = (prevIdx === idx && nextIdx !== idx);

        slot.classList.toggle('selected', isNowSelected);

        if (wasSelected) {
          slot.classList.remove('settling');
          void slot.offsetWidth;
          slot.classList.add('settling');
          clearTimeout(slot._settleTimer);
          slot._settleTimer = setTimeout(() => {
            slot.classList.remove('settling');
          }, 340);
          startSettleSloshAnimation(idx, 0.56);
        } else if (isNowSelected) {
          slot.classList.remove('settling');
          clearTimeout(slot._settleTimer);
        }

        // 更新提示高亮类
        slot.classList.toggle('hint-source-slot', !!(activeHintPair && activeHintPair.srcIdx === idx));
        slot.classList.toggle('hint-target-slot', !!(activeHintPair && activeHintPair.dstIdx === idx));

        // 实时更新色环契约瓶的匹配/不匹配光效与盾章描边
        const isColorLockActive = (nextIdx !== null && nextIdx !== idx && b.special === 'color_lock' && !b.corked && !!selTop);
        const isMatch = isColorLockActive && (selTop === b.requiredColor);
        const isMismatch = isColorLockActive && (selTop !== b.requiredColor);
        slot.classList.toggle('color-lock-match', isMatch);
        slot.classList.toggle('color-lock-mismatch', isMismatch);

        const shieldGroup = document.getElementById(`color-lock-shield-${idx}`);
        if (shieldGroup) {
          const outerPath = shieldGroup.querySelector('path');
          if (outerPath) {
            outerPath.setAttribute('stroke', isMatch ? '#4ade80' : (isMismatch ? '#fb7185' : '#ffffff'));
            outerPath.setAttribute('stroke-width', (isMatch || isMismatch) ? '2.6' : '1.9');
          }
        }
      });

      if (activeHintPair && !isAnimating) {
        requestAnimationFrame(renderHintGuideOverlay);
      } else if (!isAnimating) {
        const fxSvg = document.getElementById('fx-overlay');
        if (fxSvg) fxSvg.innerHTML = '';
      }
    }

    function renderBagSVG(bag, bagIdx = 0) {
      if (!bag || bag.removed) return '';
      if (bag.locked) {
        return `
          <svg viewBox="13 1 80 118" width="100%" height="100%">
            <ellipse cx="52" cy="117.5" rx="40" ry="4" fill="rgba(0,0,0,0.32)"/>
            <path d="M 38,26 C 38,3 70,3 70,26" fill="none" stroke="#9ea7b8" stroke-width="3.4" stroke-linecap="round"/>
            <polygon points="14,27 78,27 92,20 28,20" fill="#525a6b"/>
            <polygon points="14,27 78,27 78,118 14,113" fill="#d5dce6"/>
            <polygon points="78,27 92,20 92,109 78,118" fill="#a5aeba"/>
            <polygon points="85,23.5 92,20 92,109 85,113.5" fill="#919aa8"/>
            <polygon points="14,96 78,100 78,118 14,113" fill="#8b94a3"/>
            <polygon points="78,100 92,92 92,109 78,118" fill="#6d7585"/>
            <circle cx="29" cy="34" r="3.4" fill="#e6ebf2" stroke="#7a8494" stroke-width="1.2"/>
            <circle cx="63" cy="34" r="3.4" fill="#e6ebf2" stroke="#7a8494" stroke-width="1.2"/>
            <path d="M 29,34 C 29,2 63,2 63,34" fill="none" stroke="#f5f8fc" stroke-width="3.2" stroke-linecap="round"/>
            <rect x="24" y="42" width="44" height="55" rx="6" fill="#7c8594"/>
            <rect x="27.2" y="45.2" width="37.6" height="49.5" rx="4.2" fill="#9ea7b5"/>
            <g transform="translate(33, 60)">
              <rect x="0" y="0" width="24" height="19" rx="5" fill="#ffffff" stroke="#64748b" stroke-width="1"/>
              <polygon points="23,6 33,1 33,18 23,13" fill="#ffffff" stroke="#64748b" stroke-width="1" stroke-linejoin="round"/>
              <polygon points="9,5 9,14 17,9.5" fill="#43586e"/>
            </g>
          </svg>
        `;
      }

      const col = COLORS[bag.color] || COLORS.green;
      const packedCol = bag.packedBottle ? (COLORS[bag.packedBottle] || col) : null;

      const packedBottleMarkup = packedCol ? `
        <g clip-path="url(#bagWindowClip-${bagIdx})">
          <g class="bag-bottle-drop-in" transform="translate(27, 45)">
            <ellipse cx="19" cy="49.5" rx="13" ry="2.6" fill="rgba(0,0,0,0.28)"/>
            <path d="M 13.0,2.8 L 14.2,7.2 A 5.2,1.3 0 0,0 23.8,7.2 L 25.0,2.8 Z" fill="#e6c396" stroke="#9c6b36" stroke-width="0.6"/>
            <ellipse cx="19" cy="2.8" rx="6.0" ry="1.4" fill="#fbf0dc"/>
            <ellipse cx="19" cy="7.2" rx="7.2" ry="1.6" fill="#4d88e5" stroke="#9be0ff" stroke-width="0.6"/>
            <path d="M 14.8,7.8 L 23.2,7.8 L 23.0,11.5 Q 31.5,14.5 31.5,22.0 L 31.5,47.5 A 12.5,3.2 0 0,1 6.5,47.5 L 6.5,22.0 Q 6.5,14.5 15.0,11.5 Z"
                  fill="rgba(22, 45, 105, 0.45)" stroke="#68a8ff" stroke-width="1.2"/>
            <path d="M 7.2,17.2 L 30.8,17.2 L 30.8,47.2 A 11.8,3.0 0 0,1 7.2,47.2 Z" fill="url(#liq-${bag.packedBottle || bag.color})"/>
            <ellipse cx="19" cy="17.2" rx="11.8" ry="2.8" fill="${packedCol.topMid}" stroke="${packedCol.topLight}" stroke-width="0.7"/>
            <rect x="24.8" y="20" width="3.6" height="24" rx="1.8" fill="rgba(255,255,255,0.38)"/>
          </g>
        </g>
      ` : '';

      return `
        <svg viewBox="13 1 80 118" width="100%" height="100%">
          <defs><clipPath id="bagWindowClip-${bagIdx}"><rect x="27.2" y="45.2" width="37.6" height="49.5" rx="4.2"/></clipPath></defs>
          <ellipse cx="52" cy="117.5" rx="41" ry="4.2" fill="rgba(0, 0, 0, 0.35)"/>
          <path d="M 38,26 C 38,3 70,3 70,26" fill="none" stroke="#b5bfd0" stroke-width="4.2" stroke-linecap="round"/>
          <path d="M 38,26 C 38,3 70,3 70,26" fill="none" stroke="#eef3fa" stroke-width="2.2" stroke-linecap="round"/>
          <polygon points="14,27 78,27 92,20 28,20" fill="#7c8596" stroke="#cdd5e2" stroke-width="0.6"/>
          <polygon points="17,26.5 76,26.5 88,21 29,21" fill="#525b6c"/>
          <polygon points="14,27 78,27 78,118 14,113" fill="#f8fafc"/>
          <polygon points="78,27 92,20 92,109 78,118" fill="#d9dde4"/>
          <polygon points="85,23.5 92,20 92,109 85,113.5" fill="#b4bcc8"/>
          <line x1="85" y1="23.5" x2="85" y2="101" stroke="#969fab" stroke-width="1.0"/>
          <rect x="23.5" y="41.5" width="45" height="56.5" rx="6.5" fill="${col.bagMain}"/>
          <rect x="27.2" y="45.2" width="37.6" height="49.5" rx="4.2" fill="#ccd3de"/>
          <polygon points="54.5,45.2 64.8,45.2 64.8,94.7 54.5,94.7" fill="rgba(115, 125, 142, 0.35)"/>
          ${packedBottleMarkup}
          <polygon points="27.2,45.2 47.5,45.2 27.2,84.5" fill="rgba(255, 255, 255, 0.38)" pointer-events="none"/>
          <polygon points="14,95.5 78,99.5 78,118 14,113" fill="${col.bagMain}"/>
          <polygon points="78,99.5 92,91.5 92,109 78,118" fill="${col.bagDark}"/>
          <polygon points="78,118 92,109 85,101.5" fill="rgba(0, 0, 0, 0.22)"/>
          <circle cx="29" cy="34.5" r="3.6" fill="#eef2f8" stroke="#aeb7c6" stroke-width="1.2"/>
          <circle cx="29" cy="34.5" r="1.8" fill="#485264"/>
          <circle cx="63" cy="34.5" r="3.6" fill="#eef2f8" stroke="#aeb7c6" stroke-width="1.2"/>
          <circle cx="63" cy="34.5" r="1.8" fill="#485264"/>
          <path d="M 29,34.5 C 29,2 63,2 63,34.5" fill="none" stroke="rgba(90, 105, 130, 0.32)" stroke-width="5.2" stroke-linecap="round" transform="translate(0, 1.5)"/>
          <path d="M 29,34.5 C 29,2 63,2 63,34.5" fill="none" stroke="#d5dde9" stroke-width="4.4" stroke-linecap="round"/>
          <path d="M 29,34.5 C 29,2 63,2 63,34.5" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/>
        </svg>
      `;
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

    function buildLiquidLayersMarkup(layers, idx, options = {}) {
      const {
        topLayerScale = 1, tiltAngle = 0, pourDir = 1, spillProgress = 0,
        mysteryCount = 0, maxCap = 4, isGiantCat = false,
        sloshPhase = 0, sloshAmplitude = 0,
        revealingLayerIdx = -1, revealProgress = 1
      } = options;

      if (layers.length === 0) return '';
      const effectiveLayers = layers.map((c, i) => (i < mysteryCount ? 'mystery_dark' : c));

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
      if (groups.length === 0) return '';

      const totalVolume = groups.reduce((acc, g) => acc + g.amount, 0);
      if (totalVolume <= 0.005) return '';

      const { bottomY, layerH, rx, ry } = getBottleLayerMetrics(maxCap, isGiantCat);
      const leftX = 50 - rx, rightX = 50 + rx;
      const effectiveTiltDeg = tiltAngle;
      const absTilt = Math.abs(effectiveTiltDeg);

      if (absTilt < 0.08) {
        let html = '';
        let curY = bottomY;
        const sloshSin = Math.sin(sloshPhase);
        const sloshCos = Math.cos(sloshPhase * 1.35);
        const topTiltY = sloshAmplitude * 7.2 * sloshSin;
        const waveCrest = sloshAmplitude * 4.2 * sloshCos;
        const ryDynamic = ry + sloshAmplitude * 1.8 * sloshCos;

        for (let i = 0; i < groups.length; i++) {
          const g = groups[i];
          const h = g.amount * layerH;
          const yBot = curY;
          const yTop = curY - h;
          curY = yTop;
          const yBotDraw = (i === 0) ? yBot + 3.5 : yBot;
          const gradId = g.colorKey === 'mystery_dark' ? 'liq-mystery' : `liq-${g.colorKey}`;

          const isTopGroup = (i === groups.length - 1);
          const prevTiltY = (i > 0 && sloshAmplitude > 0.01) ? (topTiltY * 0.32 * (i / groups.length)) : 0;
          const curTiltY = isTopGroup ? topTiltY : (topTiltY * 0.32 * ((i + 1) / groups.length));
          const curWave = isTopGroup ? waveCrest : (waveCrest * 0.25);

          const yTL = yTop - curTiltY, yTR = yTop + curTiltY;
          const yBL = yBotDraw - prevTiltY, yBR = yBotDraw + prevTiltY;

          if (sloshAmplitude > 0.01 && isTopGroup) {
            html += `<path d="M ${leftX},${yTL.toFixed(2)} C ${50 - rx * 0.45},${(yTop - curTiltY * 0.3 + curWave).toFixed(2)} ${50 + rx * 0.45},${(yTop + curTiltY * 0.3 - curWave).toFixed(2)} ${rightX},${yTR.toFixed(2)} L ${rightX},${yBR.toFixed(2)} A ${rx},${ry} 0 0,1 ${leftX},${yBL.toFixed(2)} Z" fill="url(#${gradId})"/>`;
          } else {
            html += `<path d="M ${leftX},${yTL.toFixed(2)} L ${rightX},${yTR.toFixed(2)} L ${rightX},${yBR.toFixed(2)} A ${rx},${ry} 0 0,1 ${leftX},${yBL.toFixed(2)} Z" fill="url(#${gradId})"/>`;
          }

          if (revealingLayerIdx >= g.startLayerIdx && revealingLayerIdx < g.startLayerIdx + g.amount && revealProgress < 1) {
            const revYBot = bottomY - revealingLayerIdx * layerH;
            const revYTop = revYBot - layerH;
            const curtainH = layerH * (1 - revealProgress);
            const qScale = 1 + revealProgress * 0.85;
            const qOp = Math.max(0, 1 - revealProgress * 1.4);
            const ringRx = rx * (0.35 + revealProgress * 0.72);
            const ringOp = Math.sin(revealProgress * Math.PI);
            const qCenterY = revYBot - layerH * 0.5 + ry * 0.92;
            html += `
              <path d="M ${leftX},${revYTop.toFixed(2)} L ${rightX},${revYTop.toFixed(2)} L ${rightX},${(revYTop + curtainH).toFixed(2)} A ${rx},${ry} 0 0,1 ${leftX},${(revYTop + curtainH).toFixed(2)} Z" fill="url(#liq-mystery)" opacity="${(1 - revealProgress * 0.75).toFixed(2)}"/>
              <ellipse cx="50" cy="${(revYTop + curtainH).toFixed(2)}" rx="${ringRx.toFixed(1)}" ry="${(ry * 0.75).toFixed(1)}" fill="none" stroke="#fff59d" stroke-width="2.6" opacity="${ringOp.toFixed(2)}"/>
              <g transform="translate(50, ${qCenterY.toFixed(1)}) scale(${qScale.toFixed(2)})" opacity="${qOp.toFixed(2)}">
                <text x="0" y="0" text-anchor="middle" dominant-baseline="central" fill="#fffef0" font-size="26" font-weight="900">?</text>
              </g>
            `;
          }
        }

        if (mysteryCount > 0) {
          for (let m = 0; m < Math.min(mysteryCount, layers.length); m++) {
            const qCenterY = bottomY - (m + 0.5) * layerH + ry * 0.92 + (m === 0 ? 1.5 : 0);
            html += `<g transform="translate(50, ${qCenterY.toFixed(1)})"><text x="0" y="0" text-anchor="middle" dominant-baseline="central" fill="#fffef0" font-size="26" font-weight="900" style="filter: drop-shadow(0 2px 3px rgba(0,0,0,0.92));">?</text></g>`;
          }
        }

        const topColorKey = groups[groups.length - 1].colorKey;
        const colTop = COLORS[topColorKey] || { topLight: '#7a96ff' };
        const topGradId = topColorKey === 'mystery_dark' ? 'top-mystery' : `top-${topColorKey}`;
        const surfaceTiltDeg = (Math.atan2(topTiltY * 2, rx * 2) * 180) / Math.PI;
        const shoulderRx = getShoulderRxAtY(curY, maxCap, isGiantCat);
        const topRxEff = Math.min(rx + 0.5, shoulderRx + 0.5);
        const topRyEff = ryDynamic * (topRxEff / (rx + 0.5));

        const menCy = (waveCrest * 0.22).toFixed(2);
        html += `
          <g transform="translate(50, ${curY.toFixed(2)}) rotate(${surfaceTiltDeg.toFixed(2)})">
            <ellipse cx="0" cy="${menCy}" rx="${topRxEff.toFixed(2)}" ry="${topRyEff.toFixed(2)}" fill="url(#${topGradId})"/>
            <path d="M ${-(topRxEff - 1.0)},${(0.3 + waveCrest * 0.22).toFixed(2)} A ${topRxEff - 1.0},${(topRyEff - 0.3).toFixed(2)} 0 0,0 ${topRxEff - 1.0},${(0.3 + waveCrest * 0.22).toFixed(2)}" fill="none" stroke="${colTop.topLight}" stroke-width="1.2" stroke-linecap="round" opacity="0.88"/>
          </g>
        `;
        return html;
      }

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

      let html = '';
      for (let i = 0; i < numGroups; i++) {
        const g = groups[i], lowerIf = interfaces[i], upperIf = interfaces[i + 1];
        const upperRelDeg = (1 - upperIf.shearFactor) * effectiveTiltDeg;
        const lowerRelDeg = (1 - lowerIf.shearFactor) * effectiveTiltDeg;
        const upperTan = Math.tan((upperRelDeg * Math.PI) / 180);
        const lowerTan = Math.tan((lowerRelDeg * Math.PI) / 180);
        const minX = -125, maxX = 225;
        const yUL = upperIf.yG + (minX - upperIf.chord.cx) * upperTan;
        const yUR = upperIf.yG + (maxX - upperIf.chord.cx) * upperTan;
        const yBotBase = (i === 0) ? (lowerIf.yG + 18) : lowerIf.yG;
        const yBL = yBotBase + (minX - lowerIf.chord.cx) * lowerTan;
        const yBR = yBotBase + (maxX - lowerIf.chord.cx) * lowerTan;
        const botRx = (maxX - minX) * 0.52;
        const botRy = (i === 0) ? 4 : Math.min(11.5, Math.max(7.2, lowerIf.chord.rx * 0.23));
        const gradId = g.colorKey === 'mystery_dark' ? 'liq-mystery' : `liq-${g.colorKey}`;
        html += `<path d="M ${minX},${yUL.toFixed(2)} L ${maxX},${yUR.toFixed(2)} L ${maxX},${yBR.toFixed(2)} A ${botRx.toFixed(2)},${botRy.toFixed(2)} ${lowerRelDeg.toFixed(2)} 0,1 ${minX},${yBL.toFixed(2)} Z" fill="url(#${gradId})"/>`;
      }

      const topIf = interfaces[numGroups], topChord = topIf.chord;
      const topRx = topChord.rx + 0.4;
      const topRy = Math.min(10.8, Math.max(6.8, totalGravityDepth * 0.72), Math.max(7.2, topChord.rx * 0.22));
      const topColorKey = groups[numGroups - 1].colorKey;
      const topGradId = topColorKey === 'mystery_dark' ? 'top-mystery' : `top-${topColorKey}`;
      html += `<ellipse cx="${topChord.cx.toFixed(2)}" cy="${topIf.yG.toFixed(2)}" rx="${topRx.toFixed(2)}" ry="${topRy.toFixed(2)}" fill="url(#${topGradId})"/>`;

      return `<g transform="rotate(${(-effectiveTiltDeg).toFixed(2)}, 50, 115)">${html}</g>`;
    }

    function hash01(n) {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
      return x - Math.floor(x);
    }

    function renderIkeaWoodCorkSVG(idx, isSeated = true, showCompleteBadge = false, plugCompressX = 1.0) {
      const pL = (50 - 9.8 * plugCompressX).toFixed(2);
      const pR = (50 + 9.8 * plugCompressX).toFixed(2);
      const pBotL = (50 - 6.6 * plugCompressX).toFixed(2);
      const pBotR = (50 + 6.6 * plugCompressX).toFixed(2);
      return `
        <g>
          <!-- 塞入玻璃瓶颈内部的锥形软木塞下段（带真实软木气孔纹理与玻璃内壁折射压迫感） -->
          <path d="M ${pL},10.0 L ${pR},10.0 L ${pBotR},24.8 A ${(6.6 * plugCompressX).toFixed(2)},2.0 0 0,1 ${pBotL},24.8 Z"
                fill="url(#ikeaCorkPlugGrad)" opacity="0.94"/>
          <line x1="46.2" y1="13.5" x2="46.5" y2="21.5" stroke="#5c2808" stroke-width="0.7" stroke-linecap="round" opacity="0.45"/>
          <line x1="53.2" y1="14.2" x2="52.8" y2="22.0" stroke="#5c2808" stroke-width="0.65" stroke-linecap="round" opacity="0.40"/>
          ${isSeated ? `
            <!-- 玻璃瓶口外唇半透明包裹折射层（让木塞下段看起来真正塞在玻璃瓶颈内部而非贴在表面） -->
            <path d="M 31.8,9.2 C 30.2,13.4 31.4,18.2 36.5,20.4 A 13.8,3.2 0 0,0 63.5,20.4 C 68.6,18.2 69.8,13.4 68.2,9.2 A 18.2,3.7 0 0,0 31.8,9.2 Z"
                  fill="url(#neckLipGrad)" opacity="0.62"/>
            <path d="M 36.2,20.2 A 14.0,3.2 0 0,0 63.8,20.2" fill="none" stroke="#6ea6f7" stroke-width="1.2" stroke-linecap="round" opacity="0.82"/>
          ` : ''}
          <!-- 瓶口上方的 3D 倒角橡木塞帽（带天然木纹年轮与暖阳高光边） -->
          <path d="M 36.2,3.0 L 38.2,10.6 A 11.8,2.6 0 0,0 61.8,10.6 L 63.8,3.0 A 13.8,3.0 0 0,1 36.2,3.0 Z"
                fill="url(#ikeaCorkSideGrad)" stroke="#a36a2c" stroke-width="0.85"/>
          <line x1="42.5" y1="5.2" x2="43.0" y2="9.2" stroke="#8c5218" stroke-width="0.65" stroke-linecap="round" opacity="0.42"/>
          <line x1="56.5" y1="5.0" x2="56.0" y2="9.0" stroke="#8c5218" stroke-width="0.65" stroke-linecap="round" opacity="0.38"/>
          <ellipse cx="50" cy="3.0" rx="13.8" ry="2.9" fill="url(#ikeaCorkTopGrad)" stroke="#fff3db" stroke-width="0.85"/>
          <ellipse cx="50" cy="2.9" rx="8.6" ry="1.55" fill="none" stroke="#b87d3e" stroke-width="0.65" opacity="0.52"/>
          <ellipse cx="50" cy="2.9" rx="3.8" ry="0.68" fill="none" stroke="#b87d3e" stroke-width="0.55" opacity="0.40"/>
          <path d="M 38.2,4.3 A 11.8,2.4 0 0,0 61.8,4.3" fill="none" stroke="#fffdf7" stroke-width="1.05" stroke-linecap="round" opacity="0.88"/>
          ${isSeated ? `<path d="M 32.4,9.5 A 17.8,3.5 0 0,0 67.6,9.5" fill="none" stroke="#cde2ff" stroke-width="1.25" stroke-linecap="round" opacity="0.9"/>` : ''}
        </g>
      `;
    }

    // 四段式自然物理塞木塞特效：
    // 1) 0.00~0.24：木塞从瓶口正上方轻巧垂直对准下落；
    // 2) 0.24~0.54：木塞下半截挤入玻璃瓶颈（锥塞受瓶口内壁挤压微缩、塞帽受压微扁），瓶口绽开一圈细腻气密微雾环与暖金星尘；
    // 3) 0.54~1.00：木塞弹性回弹严丝合缝落座于玻璃瓶口内，干净自然、毫无杂乱遮挡！
    function renderRibbonAndDroppingCorkMarkup(idx, animP = 0.0, neckOffsetY = 0, bBotY = 193, useSpiral = true) {
      let fx = `<g transform="translate(0, ${neckOffsetY})">`;

      if (animP < 0.24) {
        // 阶段 1：木塞从瓶口上方 (-26px) 顺滑加速落向玻璃瓶口 (-2.2px)
        const t = animP / 0.24;
        const easeIn = t * t * (2.2 - 1.2 * t);
        const corkY = -26 * (1 - easeIn) - 2.2 * easeIn;
        const approachShadowOp = (0.12 + 0.32 * easeIn).toFixed(2);
        fx += `<ellipse cx="50" cy="9.2" rx="${(7.5 + 3.5 * easeIn).toFixed(1)}" ry="${(1.5 + 0.6 * easeIn).toFixed(2)}" fill="rgba(75, 38, 8, ${approachShadowOp})"/>`;
        fx += `<g transform="translate(0, ${corkY.toFixed(2)})">${renderIkeaWoodCorkSVG(idx, false, false, 1.0)}</g>`;
      } else {
        // 阶段 2 & 3：木塞缓缓挤入瓶颈并弹性落定 (0.24 -> 1.0)
        const insertP = Math.min(1, (animP - 0.24) / 0.76);
        // 阻尼压入曲线：先从 -2.2px 压入至 +1.5px（过压紧实），再柔和回弹至 0.0px
        let corkY = 0;
        let capScaleX = 1.0;
        let capScaleY = 1.0;
        let plugCompressX = 0.93;

        if (insertP < 0.36) {
          const u = insertP / 0.36;
          const easePush = 1 - Math.pow(1 - u, 2.4);
          corkY = -2.2 * (1 - easePush) + 1.5 * easePush;
          capScaleX = 1 + 0.055 * Math.sin(u * Math.PI * 0.85);
          capScaleY = 1 - 0.075 * Math.sin(u * Math.PI * 0.85);
          plugCompressX = 1.0 - 0.07 * easePush;
        } else {
          const u2 = (insertP - 0.36) / 0.64;
          const damped = Math.exp(-4.2 * u2) * Math.cos(u2 * Math.PI * 2.2);
          corkY = 1.5 * damped;
          capScaleX = 1 + 0.028 * damped;
          capScaleY = 1 - 0.036 * damped;
          plugCompressX = 0.93 + 0.02 * (1 - Math.exp(-3 * u2));
        }

        // 气密瞬间：瓶口四周柔和散开一圈温润的空气微雾波纹与 8 颗小巧香槟星芒
        if (insertP < 0.72) {
          const puffP = insertP / 0.72;
          const puffEase = 1 - Math.pow(1 - puffP, 2.6);
          const puffAlpha = Math.max(0, (1 - puffP) * 0.76);
          const rxRing = 15 + puffEase * 17;
          const ryRing = 3.2 + puffEase * 3.6;

          fx += `
            <ellipse cx="50" cy="9.2" rx="${rxRing.toFixed(1)}" ry="${ryRing.toFixed(1)}"
                     fill="none" stroke="#fffbeb" stroke-width="${(2.2 * (1 - puffP * 0.7)).toFixed(2)}"
                     opacity="${puffAlpha.toFixed(2)}"/>
          `;

          for (let s = 0; s < 8; s++) {
            const ang = (s / 8) * Math.PI * 2 + 0.25;
            const sx = 50 + Math.cos(ang) * (12 + puffEase * 18);
            const sy = 9.0 + Math.sin(ang) * (2.8 + puffEase * 5.5) - puffEase * 6.5;
            const sr = (1.6 - puffP * 1.1) * (s % 2 === 0 ? 1.15 : 0.85);
            if (sr > 0.2) {
              fx += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${sr.toFixed(2)}"
                             fill="${s % 2 === 0 ? '#fef08a' : '#ffffff'}" opacity="${(puffAlpha * 0.92).toFixed(2)}"/>`;
            }
          }
        }

        fx += `<g transform="translate(50, ${(9.2 + corkY).toFixed(2)}) scale(${capScaleX.toFixed(3)}, ${capScaleY.toFixed(3)}) translate(-50, -9.2)">${renderIkeaWoodCorkSVG(idx, true, false, plugCompressX)}</g>`;
      }

      fx += `</g>`;
      return fx;
    }
    // ==========================================
    // 7. 渲染水瓶（共享全局 <defs> + 3D高精机关徽章 + 3D模切红药水贴纸）
    // ==========================================
    // 100% 复刻参考图 image_55d85b 的 3D 粗麻布编织软垫底座（含浅色/深色星级软垫、珠点圆环机关纹、深巧克力侧面体积阴影与暖赤陶地面投影）
    function renderBurlapCoasterSVG(b, idx) {
      const isDarkStarTile = !!(b.corked || b.isGiantCat);
      const hasBeadedRing = (b.special && b.special !== 'none') || (b.mysteryCount && b.mysteryCount > 0);
      const patId = isDarkStarTile ? 'url(#burlapWeaveDarkPat)' : 'url(#burlapWeaveLightPat)';
      const sideGrad = isDarkStarTile ? 'url(#burlapSideWallDark)' : 'url(#burlapSideWallLight)';
      const rimStroke = isDarkStarTile ? 'rgba(255, 232, 185, 0.35)' : 'rgba(255, 248, 225, 0.68)';

      // 针对已封存/灵猫瓶镶嵌原图同款 3D 倒角发光金星，针对特殊机关瓶绘制原图同款白色双圈珠点圆环
      let surfaceInlay = '';
      if (isDarkStarTile) {
        surfaceInlay = `
          <g transform="translate(50, 21) scale(1, 0.52)">
            <path d="M0,-14 L4.2,-4.5 L14.5,-3.2 L6.8,3.8 L8.8,14 L0,8.8 L-8.8,14 L-6.8,3.8 L-14.5,-3.2 L-4.2,-4.5 Z"
                  fill="#ffee44" stroke="#d97706" stroke-width="1.6" stroke-linejoin="round"
                  style="filter:drop-shadow(0 2px 4px rgba(255, 200, 20, 0.65));"/>
          </g>
        `;
      } else if (hasBeadedRing) {
        surfaceInlay = `
          <g transform="translate(50, 19.5)">
            <ellipse cx="0" cy="0" rx="22" ry="6.2" fill="none" stroke="#fffdf7" stroke-width="1.9" stroke-dasharray="1.8 3.2" stroke-linecap="round" opacity="0.88"/>
            <ellipse cx="0" cy="0" rx="17" ry="4.6" fill="none" stroke="#fffdf7" stroke-width="1.5" stroke-dasharray="1.5 2.8" stroke-linecap="round" opacity="0.78"/>
          </g>
        `;
      }

      return `
        <svg viewBox="0 0 100 46" preserveAspectRatio="none">
          <!-- 1. 原图标志性的左下方暖赤陶色柔和地面投影 (Warm Terracotta Cast Shadow) -->
          <ellipse cx="42" cy="34" rx="45" ry="11.5" transform="rotate(-5, 42, 34)" fill="url(#terracottaShadowGrad)" />
          <ellipse cx="48" cy="31" rx="38" ry="8.5" fill="rgba(115, 48, 8, 0.36)" />

          <!-- 2. 3D 软垫厚实侧面（上亮金棕 -> 下深巧克力的圆润枕状体积侧壁） -->
          <path d="M 11,19.5
                   C 11,13 25,10 50,10
                   C 75,10 89,13 89,19.5
                   L 87.5,27.5
                   C 86,35.5 72,39.5 50,39.5
                   C 28,39.5 14,35.5 12.5,27.5 Z"
                fill="${sideGrad}" />
          <!-- 侧壁粗麻经纬暗纹叠加 -->
          <path d="M 11,19.5
                   C 11,13 25,10 50,10
                   C 75,10 89,13 89,19.5
                   L 87.5,27.5
                   C 86,35.5 72,39.5 50,39.5
                   C 28,39.5 14,35.5 12.5,27.5 Z"
                fill="${patId}" opacity="0.28" />

          <!-- 3. 3D 软垫饱满拱起顶面（超椭圆枕面 + 11x11 编织麻线颗粒） -->
          <path d="M 50,7.5
                   C 76,7.5 89,11.5 89,19.2
                   C 89,26.8 76,31.2 50,31.2
                   C 24,31.2 11,26.8 11,19.2
                   C 11,11.5 24,7.5 50,7.5 Z"
                fill="${patId}" />
          <!-- 顶面左上暖阳高光与右下体积暗部过渡 -->
          <path d="M 50,7.5
                   C 76,7.5 89,11.5 89,19.2
                   C 89,26.8 76,31.2 50,31.2
                   C 24,31.2 11,26.8 11,19.2
                   C 11,11.5 24,7.5 50,7.5 Z"
                fill="url(#burlapTopShade)"
                stroke="${rimStroke}" stroke-width="1.1" />

          <!-- 4. 软垫表面镶嵌纹饰（珠点圆环 / 3D发光金星） -->
          ${surfaceInlay}

          <!-- 5. 水瓶底部与麻布垫接触的深色 AO 接触影（瓶子拿起时自动缩小变淡） -->
          <g class="burlap-contact-ao" style="transform-origin: 50px 18.5px; transition: transform 0.24s ease, opacity 0.24s ease;">
            <ellipse cx="50" cy="18.5" rx="28" ry="6.2" fill="url(#burlapContactAOGrad)" opacity="0.72" />
          </g>
        </svg>
      `;
    }

    function renderBottleSVG(b, idx) {
      const maxCap = b.maxCap || 4;
      const isGiantCat = !!b.isGiantCat;
      const cfg = getLevelConfig(currentLevelId);
      // 当瓶子被羊皮纸袋或星缎礼袍完全包裹时，内部药水完全隐藏，杜绝袋口或袋底漏色 Bug
      const hideLiquidUnderCover = (b.special === 'paper_bag' || b.special === 'silk_drape');
      const liquidsHTML = hideLiquidUnderCover ? '' : buildLiquidLayersMarkup(b.layers, idx, {
        mysteryCount: b.mysteryCount || 0,
        maxCap,
        isGiantCat
      });

      if (isGiantCat) {
        const catClipPath = `
          M 35,10 L 65,10 L 65,26 L 70,29 L 83,12 Q 90,7 91,18 L 87,44 Q 95,62 84,82 Q 96,108 94,148 L 92,193 A 42,10.5 0 0,1 8,193 L 6,148 Q 4,108 16,82 Q 5,62 13,44 L 9,18 Q 10,7 17,12 L 30,29 L 35,26 Z
        `;
        let catOverFX = '';
        if (b.corked) {
          const animP = typeof b.corkAnimProgress === 'number' ? b.corkAnimProgress : 1.0;
          catOverFX = `<g id="cork-fx-${idx}">${renderRibbonAndDroppingCorkMarkup(idx, animP, 0, 194, false)}</g>`;
        }
        const targetColObj = COLORS[b.catTargetColor || 'pink'] || COLORS.pink;
        return `
          <svg class="bottle-svg" viewBox="-12 -6 124 224" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="bclip-${idx}"><path d="${catClipPath}" /></clipPath>
            </defs>
            <g class="bottle-ground-shadow" opacity="0.22">
              <ellipse cx="43" cy="210" rx="46" ry="13.5" transform="rotate(-7, 43, 210)" fill="rgba(148, 66, 8, 0.42)" filter="url(#warmCastShadowBlur)" />
              <ellipse cx="49" cy="202" rx="38" ry="7.5" fill="rgba(120, 52, 6, 0.35)" filter="url(#warmCastShadowBlur)" />
            </g>
            <ellipse cx="50" cy="204" rx="45" ry="7.2" fill="none" stroke="${targetColObj.topLight}" stroke-width="1.5" stroke-dasharray="10 5" opacity="0.7" />
            <g id="bottle-body-wrap-${idx}">
              <path d="${catClipPath}" fill="url(#glassBodyGrad)" />
              <path d="M 13.5,16.5 L 27.5,29.5 L 15.5,41.5 Q 11.5,30 13.5,16.5 Z"
                    fill="url(#catEarInnerGrad)" stroke="#b8dcff" stroke-width="1.15" stroke-linejoin="round"/>
              <path d="M 15.5,20.5 L 23.5,28.5 L 16.5,36.5 Z" fill="rgba(255, 220, 240, 0.35)" />
              <path d="M 86.5,16.5 L 72.5,29.5 L 84.5,41.5 Q 88.5,30 86.5,16.5 Z"
                    fill="url(#catEarInnerGrad)" stroke="#b8dcff" stroke-width="1.15" stroke-linejoin="round"/>
              <path d="M 84.5,20.5 L 76.5,28.5 L 83.5,36.5 Z" fill="rgba(255, 220, 240, 0.35)" />
              <ellipse cx="50" cy="193" rx="41.0" ry="8.2" fill="rgba(155, 208, 255, 0.22)" stroke="rgba(135, 195, 255, 0.52)" stroke-width="1.4" />
              <g clip-path="url(#bclip-${idx})" id="liquid-group-${idx}">
                ${liquidsHTML}
              </g>
              <g clip-path="url(#bclip-${idx})">
                <ellipse cx="26" cy="50" rx="19" ry="15" fill="url(#leftShoulderDomeGrad)" />
                <path d="M 56,35 Q 80,41 83,64 L 69,66 Q 65,46 52,39 Z" fill="url(#windowShoulderGrad)" />
                <path d="M 74,88 Q 88,118 85,180 L 73,180 Q 76,120 66,88 Z" fill="url(#rightPillarSheen)" />
                <path d="M 12,88 Q 7,125 11,180 L 18,180 Q 15,125 19,88 Z" fill="url(#leftWallSheen)" />
                <g transform="translate(50, 118)" opacity="0.24" fill="#d8eeff">
                  <ellipse cx="0" cy="4" rx="7.5" ry="6" />
                  <circle cx="-7.5" cy="-4.5" r="2.8" />
                  <circle cx="-2.5" cy="-7.2" r="2.8" />
                  <circle cx="2.5" cy="-7.2" r="2.8" />
                  <circle cx="7.5" cy="-4.5" r="2.8" />
                </g>
              </g>
              <g>
                <ellipse cx="24" cy="64" rx="6.2" ry="3.4" fill="rgba(255, 120, 185, 0.42)" />
                <ellipse cx="76" cy="64" rx="6.2" ry="3.4" fill="rgba(255, 120, 185, 0.42)" />
                <path d="M 24,56 Q 32,48 40,56" fill="none" stroke="#091d4a" stroke-width="3.2" stroke-linecap="round"/>
                <path d="M 24,55.5 Q 32,47.5 40,55.5" fill="none" stroke="#d8f0ff" stroke-width="2.0" stroke-linecap="round"/>
                <line x1="23" y1="54" x2="20" y2="51" stroke="#d8f0ff" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M 60,56 Q 68,48 76,56" fill="none" stroke="#091d4a" stroke-width="3.2" stroke-linecap="round"/>
                <path d="M 60,55.5 Q 68,47.5 76,55.5" fill="none" stroke="#d8f0ff" stroke-width="2.0" stroke-linecap="round"/>
                <line x1="77" y1="54" x2="80" y2="51" stroke="#d8f0ff" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M 50,66.5 C 46,63.5 45.5,59.5 48,59.5 C 49.2,59.5 50,60.5 50,61.2 C 50,60.5 50.8,59.5 52,59.5 C 54.5,59.5 54,63.5 50,66.5 Z"
                      fill="#ff6da8" stroke="#ffffff" stroke-width="1.1"/>
                <circle cx="48.5" cy="61.2" r="1.0" fill="#ffffff" opacity="0.9"/>
                <path d="M 43.5,69.5 Q 46.8,73.5 50,68.5 Q 53.2,73.5 56.5,69.5"
                      fill="none" stroke="#d8f0ff" stroke-width="1.65" stroke-linecap="round"/>
                <g stroke="rgba(205, 235, 255, 0.78)" stroke-width="1.45" stroke-linecap="round">
                  <line x1="9" y1="57" x2="20" y2="60" />
                  <line x1="7" y1="64" x2="19" y2="64" />
                  <line x1="10" y1="71" x2="20" y2="68" />
                  <line x1="91" y1="57" x2="80" y2="60" />
                  <line x1="93" y1="64" x2="81" y2="64" />
                  <line x1="90" y1="71" x2="80" y2="68" />
                </g>
              </g>
              <g>
                <path d="M 15.5,81 Q 50,91 84.5,81 L 85.2,86.5 Q 50,96.5 14.8,86.5 Z"
                      fill="url(#catCollarGrad)" stroke="#ffbfd9" stroke-width="1.0" />
                <circle cx="50" cy="89.5" r="6.8" fill="url(#catBellGrad)" stroke="#fff3b0" stroke-width="1.1" />
                <line x1="45.5" y1="88" x2="54.5" y2="88" stroke="#995200" stroke-width="1.0" />
                <circle cx="50" cy="91.5" r="1.6" fill="#5c2d00" />
                <line x1="50" y1="91.5" x2="50" y2="95.5" stroke="#5c2d00" stroke-width="1.3" />
                <circle cx="48" cy="86.8" r="1.4" fill="#ffffff" opacity="0.88" />
              </g>
              <path d="M 8,193 A 42,10.5 0 0,0 92,193 L 91,199.5 A 41,11.5 0 0,1 9,199.5 Z" fill="url(#baseCushionGrad)" />
              <path d="M 12,197.5 A 39,10.2 0 0,0 88,197.5" fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.2" stroke-linecap="round" />
              <path d="${catClipPath}" fill="none" stroke="#0b2260" stroke-width="3.2" stroke-linejoin="round" opacity="0.7" />
              <path d="${catClipPath}" fill="none" stroke="#5ca4ff" stroke-width="2.4" stroke-linejoin="round" />
              <g class="capacity-tag-badge" transform="translate(50, 146)">
                <rect x="-28" y="-11" width="56" height="21" rx="10.5"
                      fill="rgba(10, 22, 62, 0.78)" stroke="#ffdf6b" stroke-width="1.5" />
                <text x="0" y="3.5" text-anchor="middle" fill="#fff5b8" font-size="11" font-weight="900">
                  🐱 ${b.layers.length}/${maxCap}
                </text>
              </g>
              <g id="neck-group-${idx}">
                <path d="M 33.8,22.5 Q 35.2,26.0 34.5,28.8 A 15.8,3.4 0 0,0 65.5,28.8 Q 64.8,26.0 66.2,22.5 Z" fill="#081642" opacity="0.66" />
                <path d="M 28.5,11.0 C 26.8,15.2 28.0,20.5 33.8,23.2 A 17.2,4.2 0 0,0 66.2,23.2 C 72.0,20.5 73.2,15.2 71.5,11.0 A 21.5,4.4 0 0,1 28.5,11.0 Z"
                      fill="url(#neckLipGrad)" opacity="0.72" stroke="#3b73cc" stroke-width="1.0" />
                <path d="M 58.5,13.2 C 63.0,13.0 65.2,13.5 64.5,17.2 C 63.8,20.2 61.5,22.2 57.5,22.6 C 58.2,19.5 58.8,16.2 58.5,13.2 Z"
                      fill="rgba(225, 242, 255, 0.78)" />
                <ellipse cx="50" cy="11.0" rx="21.2" ry="4.3" fill="url(#neckTopRimGrad)" opacity="0.76" stroke="#6b9fed" stroke-width="1.0" />
                <path d="M 29.5,11.4 A 20.8,4.1 0 0,0 70.5,11.4" fill="none" stroke="#b8d8ff" stroke-width="1.35" stroke-linecap="round" />
                <ellipse cx="50" cy="10.8" rx="11.6" ry="2.3" fill="url(#mouthBoreGrad)" opacity="0.65" stroke="#5c92e6" stroke-width="0.95" />
                <circle id="lip-left-${idx}" cx="36.0" cy="11.0" r="0.1" opacity="0" pointer-events="none" />
                <circle id="lip-right-${idx}" cx="64.0" cy="11.0" r="0.1" opacity="0" pointer-events="none" />
                <circle id="mouth-center-${idx}" cx="50.0" cy="11.0" r="0.1" opacity="0" pointer-events="none" />
              </g>
            </g>
            ${catOverFX}
            <g id="bottle-vfx-${idx}"></g>
          </svg>
        `;
      }

      const neckOffsetY = getNeckOffsetY(maxCap, isGiantCat);
      const { bottomY: bBotY, layerH: bLayerH, vbMinX, vbMinY, vbW, vbH } = getBottleLayerMetrics(maxCap, isGiantCat);
      // 对齐参考图 IMG_6605 经典造型：圆润厚重深蓝玻璃瓶唇 (y=9.2..20.4) + 紧束短颈环 (y=20.4..26.0) + 饱满圆肩 (y=26.0..55.0)
      const neckLipTopY = 9.2 + neckOffsetY;
      const neckStemTopY = 20.0 + neckOffsetY;
      const shoulderTopY = 26.0 + neckOffsetY;
      const shoulderBotY = 55.0 + neckOffsetY;
      const pillarTopY = 46.5 + neckOffsetY;
      const pillarH = (bBotY - 9) - pillarTopY;

      let underGlassFX = '';
      let insideGlassDecorFX = '';
      let overGlassFX = '';

      if (maxCap === 8) {
        insideGlassDecorFX += `<g opacity="0.55">`;
        for (let tick = 1; tick < 8; tick++) {
          const ty = bBotY - tick * bLayerH;
          const isMajor = (tick % 2 === 0);
          insideGlassDecorFX += `
            <line x1="${isMajor ? 73 : 76.5}" y1="${ty.toFixed(1)}" x2="83.5" y2="${ty.toFixed(1)}"
                  stroke="${isMajor ? '#fde047' : '#93c5fd'}" stroke-width="${isMajor ? 1.4 : 1.0}" stroke-linecap="round" />
          `;
        }
        insideGlassDecorFX += `</g>`;
      }

      if (b.mysteryCount && b.mysteryCount > 0) {
        underGlassFX += `
          <g>
            <ellipse cx="14" cy="134" rx="6" ry="52" fill="url(#mystGoldGlow)" />
            <ellipse cx="86" cy="134" rx="6" ry="52" fill="url(#mystGoldGlow)" />
            <circle cx="8" cy="90" r="1.5" fill="#fef08a" opacity="0.9"/>
            <circle cx="6" cy="114" r="1.1" fill="#fde047" opacity="0.8"/>
            <circle cx="9" cy="142" r="1.6" fill="#ffffff" opacity="0.9"/>
            <circle cx="92" cy="96" r="1.4" fill="#fef08a" opacity="0.9"/>
            <circle cx="94" cy="124" r="1.7" fill="#ffffff" opacity="0.9"/>
            <circle cx="91" cy="152" r="1.2" fill="#fde047" opacity="0.85"/>
          </g>
        `;
      }

      if (b.special === 'ad_cam' || b.special === 'ad_cam_blue') {
        underGlassFX += `
          <g>
            <ellipse cx="50" cy="${bBotY + 4}" rx="44" ry="11" fill="url(#purpleVortexGrad)" />
            <ellipse cx="50" cy="${bBotY + 4}" rx="38" ry="8.5" fill="none" stroke="#e879f9" stroke-width="1.8" stroke-dasharray="22 8" opacity="0.88"/>
            <ellipse cx="50" cy="${bBotY + 4}" rx="28" ry="5.8" fill="none" stroke="#f0abfc" stroke-width="1.5" stroke-dasharray="14 6" opacity="0.92"/>
            <ellipse cx="13" cy="122" rx="5" ry="55" fill="url(#purpleSideGlow)" />
            <ellipse cx="87" cy="122" rx="5" ry="55" fill="url(#purpleSideGlow)" />
          </g>
        `;
        overGlassFX += `
          <g transform="translate(50, ${112 + neckOffsetY * 0.4}) rotate(-12) scale(1.28)" style="filter:drop-shadow(0 4px 8px rgba(59, 7, 100, 0.45));">
            <rect x="-15" y="-6" width="30" height="22" rx="4.5" fill="#581c87" stroke="#e9d5ff" stroke-width="1.4"/>
            <rect x="-15" y="-8" width="30" height="21" rx="4.5" fill="url(#camPurpleFaceGrad)" />
            <g transform="rotate(-10, -15, -8)">
              <rect x="-15" y="-14" width="30" height="6.5" rx="2" fill="#3b0764" stroke="#ffffff" stroke-width="0.9"/>
              <polygon points="-11,-14 -6,-14 -9,-7.5 -14,-7.5" fill="#ffffff"/>
              <polygon points="-1,-14 4,-14 1,-7.5 -4,-7.5" fill="#ffffff"/>
              <polygon points="9,-14 14,-14 11,-7.5 6,-7.5" fill="#ffffff"/>
            </g>
            <polygon points="-4,-3 -4,8 6,2.5" fill="#a3e635" stroke="#365314" stroke-width="0.9" stroke-linejoin="round"/>
          </g>
        `;
      }

      // 高定琉璃机关 1：丝绒磨砂琉璃罩 (silk_drape) —— 严格贴合真实玻璃瓶轮廓，配醒目大号火漆金章
      if (b.special === 'silk_drape') {
        const leftCnt = Math.max(1, (b.unlockOrder || 1) - packedTotal);
        overGlassFX += `
          <g id="special-cover-${idx}">
            <g clip-path="url(#bclip-${idx})">
              <rect x="14" y="${shoulderTopY}" width="72" height="${bBotY - shoulderTopY + 12}" fill="url(#royalVelvetFrostedGrad)" />
              <path d="M 18,75 Q 50,92 82,75 M 18,118 Q 50,135 82,118 M 18,160 Q 50,177 82,160"
                    fill="none" stroke="rgba(255, 255, 255, 0.22)" stroke-width="1.5" />
              <rect x="21.0" y="${pillarTopY}" width="5.5" height="${pillarH}" rx="2.7" fill="url(#leftWallSheen)" opacity="0.88" />
              <rect x="63.0" y="${pillarTopY}" width="10.5" height="${pillarH}" rx="2.4" fill="url(#rightPillarSheen)" opacity="0.88" />
            </g>
            <path d="M 35.5,${25.5 + neckOffsetY} A 14.5,3.2 0 0,0 64.5,${25.5 + neckOffsetY}"
                  fill="none" stroke="url(#funnelGoldGrad)" stroke-width="3.6" stroke-linecap="round" />
            <g transform="translate(50, ${114 + neckOffsetY * 0.4})" style="filter:drop-shadow(0 4px 8px rgba(10, 18, 42, 0.55));">
              <circle cx="0" cy="0" r="21" fill="url(#funnelGoldGrad)" stroke="#ffffff" stroke-width="1.8" />
              <circle cx="0" cy="0" r="17" fill="#1e3a8a" stroke="#93c5fd" stroke-width="1.2" />
              <text x="0" y="6.2" text-anchor="middle" fill="#ffffff" font-size="17" font-weight="900">★${leftCnt}</text>
            </g>
          </g>
        `;
      }

      // 高定琉璃机关 2：冰晶凝霜瓶 (ice_base) —— 贴合玻璃瓶身下半部的通透凝霜层 + 醒目大号冰晶菱章
      if (b.special === 'ice_base') {
        const frostTopY = bBotY - 72;
        overGlassFX += `
          <g id="special-cover-${idx}">
            <g clip-path="url(#bclip-${idx})">
              <path d="M 18,${frostTopY + 8}
                       Q 29,${frostTopY - 5} 39,${frostTopY + 6}
                       Q 50,${frostTopY - 7} 62,${frostTopY + 5}
                       Q 73,${frostTopY - 4} 82,${frostTopY + 7}
                       L 82,${bBotY + 6} L 18,${bBotY + 6} Z"
                    fill="url(#frostGlazeVertGrad)" />
              <path d="M 26,${frostTopY + 14} L 35,${frostTopY + 32} L 28,${frostTopY + 52}
                       M 35,${frostTopY + 32} L 46,${frostTopY + 38}
                       M 68,${frostTopY + 12} L 59,${frostTopY + 34} L 66,${frostTopY + 54}
                       M 59,${frostTopY + 34} L 48,${frostTopY + 44}"
                    fill="none" stroke="rgba(255, 255, 255, 0.85)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M 18,${frostTopY + 8}
                       Q 29,${frostTopY - 5} 39,${frostTopY + 6}
                       Q 50,${frostTopY - 7} 62,${frostTopY + 5}
                       Q 73,${frostTopY - 4} 82,${frostTopY + 7}"
                    fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" opacity="0.95" />
            </g>
            <path d="M 17.8,${bBotY + 1.5} A 32.2,8.8 0 0,0 82.2,${bBotY + 1.5}"
                  fill="none" stroke="#bae6fd" stroke-width="2.6" stroke-linecap="round" />
            <g transform="translate(50, ${bBotY - 28})" style="filter:drop-shadow(0 3px 7px rgba(3, 105, 161, 0.55));">
              <polygon points="0,-20 20,0 0,20 -20,0" fill="rgba(7, 89, 133, 0.90)" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round"/>
              <polygon points="0,-15 15,0 0,15 -15,0" fill="none" stroke="#7dd3fc" stroke-width="1.0" stroke-linejoin="round"/>
              <text x="0" y="6.2" text-anchor="middle" fill="#ffffff" font-size="18" font-weight="900">${b.poursToBreak || 1}</text>
            </g>
          </g>
        `;
      }

      // 高定琉璃机关 3：极寒冰封琉璃瓶 (full_ice) —— 100%贴合玻璃瓶身曲线的冰晶通透折射层 + 醒目大号冰章
      if (b.special === 'full_ice') {
        const leftCnt = Math.max(1, (b.unlockOrder || 1) - packedTotal);
        overGlassFX += `
          <g id="special-cover-${idx}">
            <g clip-path="url(#bclip-${idx})">
              <rect x="14" y="${neckLipTopY}" width="72" height="${bBotY - neckLipTopY + 12}" fill="url(#fullFrostGlassGrad)" />
              <polygon points="18,65 82,42 82,68 18,91" fill="rgba(255, 255, 255, 0.30)" />
              <polygon points="18,125 82,102 82,120 18,143" fill="rgba(255, 255, 255, 0.24)" />
              <path d="M 28,56 L 42,78 L 34,104 M 68,82 L 54,108 L 64,138"
                    fill="none" stroke="rgba(255, 255, 255, 0.85)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
              <rect x="63.0" y="${pillarTopY}" width="10.5" height="${pillarH}" rx="2.4" fill="url(#rightPillarSheen)" opacity="0.9" />
            </g>
            <g transform="translate(50, ${114 + neckOffsetY * 0.4})" style="filter:drop-shadow(0 4px 8px rgba(3, 105, 161, 0.55));">
              <polygon points="0,-22 22,0 0,22 -22,0" fill="rgba(7, 89, 133, 0.92)" stroke="#ffffff" stroke-width="2.0" stroke-linejoin="round"/>
              <text x="0" y="6.2" text-anchor="middle" fill="#ffffff" font-size="16.5" font-weight="900">❄${leftCnt}</text>
            </g>
          </g>
        `;
      }

      // 高定琉璃机关 4：黑曜鎏金箍瓶 (stone_base) —— 顺应圆柱玻璃瓶身弧度的双道3D鎏金环箍 + 醒目大号金盾章
      if (b.special === 'stone_base') {
        const bandY1 = bBotY - 44;
        const bandY2 = bBotY - 15;
        overGlassFX += `
          <g id="special-cover-${idx}">
            <path d="M 17.6,${bandY1} A 32.4,7.6 0 0,0 82.4,${bandY1}
                     L 82.4,${bandY1 + 8.5} A 32.4,7.6 0 0,1 17.6,${bandY1 + 8.5} Z"
                  fill="url(#ancientSpoutGrad)" stroke="#fef08a" stroke-width="1.1" />
            <path d="M 17.6,${bandY2} A 32.4,8.0 0 0,0 82.4,${bandY2}
                     L 82.4,${bandY2 + 8.5} A 32.4,8.0 0 0,1 17.6,${bandY2 + 8.5} Z"
                  fill="url(#ancientSpoutGrad)" stroke="#fef08a" stroke-width="1.1" />
            <line x1="25" y1="${bandY1 + 4}" x2="25" y2="${bandY2 + 4}" stroke="url(#funnelGoldGrad)" stroke-width="3.0" stroke-linecap="round" />
            <line x1="75" y1="${bandY1 + 4}" x2="75" y2="${bandY2 + 4}" stroke="url(#funnelGoldGrad)" stroke-width="3.0" stroke-linecap="round" />
            <g transform="translate(50, ${bBotY - 26})" style="filter:drop-shadow(0 4px 7px rgba(45, 20, 4, 0.58));">
              <circle cx="0" cy="0" r="18.5" fill="url(#funnelGoldGrad)" stroke="#ffffff" stroke-width="1.8" />
              <circle cx="0" cy="0" r="14.5" fill="#291507" stroke="#fbbf24" stroke-width="1.1" />
              <text x="0" y="6.2" text-anchor="middle" fill="#fef08a" font-size="18" font-weight="900">${b.poursToBreak || 1}</text>
            </g>
          </g>
        `;
      }

      // 高定琉璃机关 5：琥珀磨砂琉璃盲盒瓶 (paper_bag) —— 保持优雅玻璃瓶身曲线 + 醒目大号火漆金章
      if (b.special === 'paper_bag') {
        const leftCnt = Math.max(1, (b.unlockOrder || 1) - packedTotal);
        overGlassFX += `
          <g id="special-cover-${idx}">
            <g clip-path="url(#bclip-${idx})">
              <rect x="14" y="${shoulderTopY}" width="72" height="${bBotY - shoulderTopY + 12}" fill="url(#smokedAmberFrostedGrad)" />
              <path d="M 18,82 Q 50,98 82,82 M 18,136 Q 50,152 82,136"
                    fill="none" stroke="rgba(255, 236, 195, 0.25)" stroke-width="1.5" />
              <rect x="21.0" y="${pillarTopY}" width="5.5" height="${pillarH}" rx="2.7" fill="url(#leftWallSheen)" opacity="0.88" />
              <rect x="63.0" y="${pillarTopY}" width="10.5" height="${pillarH}" rx="2.4" fill="url(#rightPillarSheen)" opacity="0.88" />
            </g>
            <path d="M 35.5,${25.5 + neckOffsetY} A 14.5,3.2 0 0,0 64.5,${25.5 + neckOffsetY}"
                  fill="none" stroke="url(#funnelGoldGrad)" stroke-width="3.6" stroke-linecap="round" />
            <g transform="translate(50, ${114 + neckOffsetY * 0.4})" style="filter:drop-shadow(0 4px 8px rgba(45, 20, 4, 0.55));">
              <circle cx="0" cy="0" r="21" fill="url(#funnelGoldGrad)" stroke="#ffffff" stroke-width="1.8" />
              <circle cx="0" cy="0" r="17" fill="#7c2d12" stroke="#fdba74" stroke-width="1.2" />
              <text x="0" y="6.2" text-anchor="middle" fill="#fef08a" font-size="17" font-weight="900">★${leftCnt}</text>
            </g>
          </g>
        `;
      }

      // 高定琉璃机关 6：🔒 专属色环契约瓶 (color_lock) —— 放大版宝石盾章与醒目「仅X色」大字胶囊
      if (b.special === 'color_lock') {
        const reqCol = COLORS[b.requiredColor || 'blue'] || COLORS.blue;
        const shortColName = (reqCol.name || '同色').slice(0, 1);
        const selBottle = (selectedIndex !== null && selectedIndex !== idx) ? bottles[selectedIndex] : null;
        const selTopColor = (selBottle && selBottle.layers && selBottle.layers.length > 0) ? selBottle.layers[selBottle.layers.length - 1] : null;
        const isSelMatch = selTopColor && selTopColor === b.requiredColor;
        const isSelMismatch = selTopColor && selTopColor !== b.requiredColor;

        overGlassFX += `
          <g id="color-lock-fx-${idx}">
            <g transform="translate(0, ${neckOffsetY})">
              <ellipse cx="50" cy="9.2" rx="19.5" ry="4.4" fill="none" stroke="${reqCol.topLight}" stroke-width="2.4" opacity="0.95"/>
              <path d="M 33.5,21.0 A 16.5,4.2 0 0,0 66.5,21.0 L 66.5,26.8 A 16.5,4.2 0 0,1 33.5,26.8 Z"
                    fill="url(#funnelGoldGrad)" stroke="#78350f" stroke-width="1.1"/>
              <path d="M 34.5,22.4 A 15.5,3.8 0 0,0 65.5,22.4 L 65.5,25.6 A 15.5,3.8 0 0,1 34.5,25.6 Z"
                    fill="${reqCol.mid}" stroke="#ffffff" stroke-width="1.0"/>
              <circle cx="50" cy="24.2" r="7.6" fill="url(#funnelGoldGrad)" stroke="#ffffff" stroke-width="1.3"/>
              <polygon points="50,18.2 55.4,24.2 50,30.2 44.6,24.2" fill="${reqCol.mid}" stroke="${reqCol.topLight}" stroke-width="1.1"/>
            </g>
            ${!b.corked ? `
              <g id="color-lock-shield-${idx}" transform="translate(50, ${84 + neckOffsetY * 0.45})" style="filter:drop-shadow(0 4px 7px rgba(0,0,0,0.52));">
                <path d="M -18,-20 L 18,-20 L 20,-2 C 20,12 0,22 0,22 C 0,22 -20,12 -20,-2 Z"
                      fill="url(#funnelGoldGrad)" stroke="${isSelMatch ? '#4ade80' : (isSelMismatch ? '#fb7185' : '#ffffff')}" stroke-width="${(isSelMatch || isSelMismatch) ? 2.6 : 1.9}" stroke-linejoin="round"/>
                <path d="M -14.5,-16.5 L 14.5,-16.5 L 16,-2 C 16,9 0,17.5 0,17.5 C 0,17.5 -16,9 -16,-2 Z"
                      fill="${reqCol.mid}" stroke="${reqCol.topLight}" stroke-width="1.4" stroke-linejoin="round"/>
                <rect x="-27" y="16" width="54" height="19" rx="9.5" fill="${reqCol.bagDark}" stroke="#ffffff" stroke-width="1.6"/>
                <circle cx="-15.5" cy="25.5" r="4.8" fill="${reqCol.topRim}" stroke="#ffffff" stroke-width="1.0"/>
                <text x="5" y="30.2" text-anchor="middle" fill="#ffffff" font-size="12.5" font-weight="900">仅${shortColName}色</text>
              </g>
            ` : ''}
          </g>
        `;
      }

      // 高定琉璃机关 7：⏬ 单向接水漏斗瓶 (one_way_in) —— 放大版鎏金琉璃漏斗与大号箭头章
      if (b.special === 'one_way_in' && !b.corked) {
        overGlassFX += `
          <g id="funnel-in-fx-${idx}" transform="translate(0, ${neckOffsetY})" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.45));">
            <path d="M 22,-2 L 78,-2 L 60,24 L 57,35 L 43,35 L 40,24 Z"
                  fill="rgba(253, 224, 71, 0.38)" stroke="url(#funnelGoldGrad)" stroke-width="2.4" stroke-linejoin="round"/>
            <ellipse cx="50" cy="-2" rx="28" ry="5.2" fill="rgba(120, 53, 15, 0.58)" stroke="url(#funnelGoldGrad)" stroke-width="2.8"/>
            <circle cx="50" cy="16" r="13.5" fill="#064e3b" stroke="url(#funnelGoldGrad)" stroke-width="2.2"/>
            <path d="M 42.5,11.5 L 57.5,11.5 L 50,23.5 Z" fill="#34d399" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/>
          </g>
        `;
      }

      // 高定琉璃机关 8：⏫ 单向出水古瓶 (one_way_out) —— 放大版鎏金双翼喷泉嘴与大号上箭头章
      if (b.special === 'one_way_out' && !b.corked) {
        underGlassFX += `
          <g>
            <ellipse cx="50" cy="${bBotY + 5}" rx="42" ry="8.8" fill="rgba(245, 158, 11, 0.22)"
                     stroke="#fbbf24" stroke-width="1.8" stroke-dasharray="8 4"/>
          </g>
        `;
        overGlassFX += `
          <g id="ancient-out-fx-${idx}" transform="translate(0, ${neckOffsetY})" style="filter:drop-shadow(0 3px 6px rgba(0,0,0,0.48));">
            <path d="M 35,16 C 20,11 20,30 35,30" fill="none" stroke="url(#funnelGoldGrad)" stroke-width="3.6" stroke-linecap="round"/>
            <path d="M 65,16 C 80,11 80,30 65,30" fill="none" stroke="url(#funnelGoldGrad)" stroke-width="3.6" stroke-linecap="round"/>
            <path d="M 31,12 L 40,-2 L 60,-2 L 69,12 Z" fill="url(#ancientSpoutGrad)" stroke="#fef08a" stroke-width="1.6" stroke-linejoin="round"/>
            <circle cx="50" cy="24" r="13.5" fill="#3b0764" stroke="url(#funnelGoldGrad)" stroke-width="2.2"/>
            <path d="M 42.5,28.5 L 57.5,28.5 L 50,16.5 Z" fill="#fde047" stroke="#ffffff" stroke-width="1.2" stroke-linejoin="round"/>
          </g>
        `;
      }

      // 高定琉璃机关 9A：⏳ 星砂流沙炸弹瓶 (countdownMoves > 0) —— 放大版3D黄金沙漏怀表与大号倒计时数字
      if (typeof b.countdownMoves === 'number' && b.countdownMoves > 0 && !b.corked) {
        const isDanger = b.countdownMoves <= 2;
        overGlassFX += `
          <g>
            <path d="M 14,68 Q 50,90 86,68" fill="none" stroke="url(#funnelGoldGrad)" stroke-width="2.6" stroke-dasharray="3 2"/>
            <g class="${isDanger ? 'bomb-badge-danger' : ''}" transform="translate(50, 88)">
              <circle cx="0" cy="-25" r="4.2" fill="none" stroke="#fde047" stroke-width="1.8"/>
              <rect x="-5.5" y="-23" width="11" height="4.8" rx="2" fill="url(#funnelGoldGrad)" stroke="#78350f" stroke-width="1.1"/>
              <circle cx="0" cy="0" r="22" fill="${isDanger ? 'url(#bombRedBadgeGrad)' : 'url(#bombGoldBadgeGrad)'}"
                      stroke="#ffffff" stroke-width="2.2" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.58));"/>
              <circle cx="0" cy="0" r="18" fill="${isDanger ? '#4c0519' : '#1e1b4b'}" stroke="${isDanger ? '#fda4af' : '#fde047'}" stroke-width="1.4"/>
              <g transform="translate(-7.5, 0) scale(1.18)">
                <line x1="-4.2" y1="-6.5" x2="4.2" y2="-6.5" stroke="#fde047" stroke-width="1.8" stroke-linecap="round"/>
                <line x1="-4.2" y1="6.5" x2="4.2" y2="6.5" stroke="#fde047" stroke-width="1.8" stroke-linecap="round"/>
                <polygon points="-3.6,-5.5 3.6,-5.5 0,0" fill="#fbbf24"/>
                <polygon points="0,0 3.6,5.5 -3.6,5.5" fill="#fde047"/>
              </g>
              <text x="6.5" y="6.5" text-anchor="middle" fill="#ffffff" font-size="18.5" font-weight="900">${b.countdownMoves}</text>
            </g>
          </g>
        `;
      }

      // 高定琉璃机关 9B：🧊 流沙超时寒冰封口冠 (frozenTurns > 0) —— 放大版冰封口徽章
      if (typeof b.frozenTurns === 'number' && b.frozenTurns > 0 && !b.corked) {
        overGlassFX += `
          <g id="frozen-mouth-fx-${idx}" transform="translate(0, ${neckOffsetY})">
            <polygon points="20,10 31,0 44,5 50,-2 58,5 70,0 80,10 78,36 62,45 50,38 38,45 22,36"
                     fill="url(#iceFacetMidGrad)" stroke="#ffffff" stroke-width="1.8" stroke-linejoin="round" opacity="0.96"/>
            <polygon points="0,-16 16,0 0,16 -16,0" transform="translate(50, 22)" fill="#024b78" stroke="#ffffff" stroke-width="1.8"/>
            <text x="50" y="28" text-anchor="middle" fill="#ffffff" font-size="16.5" font-weight="900">${b.frozenTurns}</text>
          </g>
        `;
      }

      if (b.corked) {
        const animP = typeof b.corkAnimProgress === 'number' ? b.corkAnimProgress : 1.0;
        overGlassFX += `<g id="cork-fx-${idx}">${renderRibbonAndDroppingCorkMarkup(idx, animP, neckOffsetY, bBotY, animP < 0.99)}</g>`;
      }

      // 借鉴参考图3 (image_6ee02d)：内壁与内底微缩，留出真实的玻璃侧壁厚度 (1.5px) 与沉底厚玻璃底座 (4.2px)
      const innerBotY = bBotY - 1.8;
      const outerBotY = bBotY + 2.4;
      const smoothClipPath = `
        M 37.2,${neckLipTopY}
        L 62.8,${neckLipTopY}
        L 62.8,${shoulderTopY}
        C 74.8,${shoulderTopY + 4.2} 80.2,${shoulderTopY + 13.0} 80.2,${shoulderBotY}
        L 80.2,${innerBotY}
        A 30.2,7.5 0 0,1 19.8,${innerBotY}
        L 19.8,${shoulderBotY}
        C 19.8,${shoulderTopY + 13.0} 25.2,${shoulderTopY + 4.2} 37.2,${shoulderTopY}
        Z
      `;

      const smoothOuterBodyPath = `
        M 36.4,${neckStemTopY}
        L 63.6,${neckStemTopY}
        L 63.6,${shoulderTopY}
        C 76.4,${shoulderTopY + 3.8} 82.2,${shoulderTopY + 12.5} 82.2,${shoulderBotY}
        L 82.2,${outerBotY}
        A 32.2,8.8 0 0,1 17.8,${outerBotY}
        L 17.8,${shoulderBotY}
        C 17.8,${shoulderTopY + 12.5} 23.6,${shoulderTopY + 3.8} 36.4,${shoulderTopY}
        Z
      `;

      return `
        <svg class="bottle-svg" viewBox="${vbMinX} ${vbMinY} ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <clipPath id="bclip-${idx}">
              <path d="${smoothClipPath}" />
            </clipPath>
            ${b.special === 'paper_bag' ? `<clipPath id="bag-neck-only-${idx}"><rect x="0" y="-10" width="100" height="${24 + neckOffsetY}"/></clipPath>` : ''}
          </defs>

          ${b.special === "paper_bag" ? `
            <g class="bottle-ground-shadow" opacity="0.22">
              <ellipse cx="43" cy="209" rx="35" ry="12" transform="rotate(-8, 43, 209)" fill="rgba(148, 66, 8, 0.42)" filter="url(#warmCastShadowBlur)" />
            </g>
          ` : `
            <g class="bottle-ground-shadow" opacity="0.22">
              <ellipse cx="43" cy="${bBotY + 13.5}" rx="33" ry="11.8" transform="rotate(-8, 43, ${bBotY + 13.5})" fill="rgba(152, 68, 8, 0.44)" filter="url(#warmCastShadowBlur)" />
              <ellipse cx="49" cy="${bBotY + 6.2}" rx="26.5" ry="6.8" fill="rgba(124, 52, 6, 0.36)" filter="url(#warmCastShadowBlur)" />
            </g>
          `}
          ${underGlassFX}

          <g id="bottle-body-wrap-${idx}">
            <path d="${smoothOuterBodyPath}" fill="url(#glassBodyGrad)" />

            <!-- 左右两侧玻璃壁厚度折射光带（体现真实玻璃瓶壁厚度） -->
            <rect x="17.8" y="${shoulderBotY}" width="2.4" height="${innerBotY - shoulderBotY}" fill="url(#glassWallSideRefractL)" opacity="0.78" />
            <rect x="79.8" y="${shoulderBotY}" width="2.4" height="${innerBotY - shoulderBotY}" fill="url(#glassWallSideRefractR)" opacity="0.82" />

            <!-- 1. 瓶底内壁椭圆台面（参考图3标志性的玻璃内底椭圆环，空瓶与满瓶皆具立体纵深） -->
            <ellipse cx="50" cy="${innerBotY}" rx="30.2" ry="6.6"
                     fill="rgba(22, 32, 58, 0.16)" stroke="url(#glassBaseInnerFloorGrad)" stroke-width="1.15" />

            <g clip-path="url(#bclip-${idx})" id="liquid-group-${idx}">
              ${liquidsHTML}
            </g>

            <g clip-path="url(#bclip-${idx})">
              <ellipse cx="34" cy="${37.5 + neckOffsetY}" rx="13.5" ry="9.2" fill="url(#leftShoulderDomeGrad)" />
              <rect x="21.0" y="${pillarTopY}" width="5.5" height="${pillarH}" rx="2.7" fill="url(#leftWallSheen)" />
              <!-- 纤细修长瓶肩反光块 + 右侧垂直高光柱 -->
              <path class="shoulder-sheen"
                    d="M 53.8,${28.2 + neckOffsetY}
                       C 64.8,${30.2 + neckOffsetY} 72.0,${35.5 + neckOffsetY} 74.5,${42.8 + neckOffsetY}
                       L 62.5,${43.2 + neckOffsetY}
                       C 60.6,${36.5 + neckOffsetY} 56.8,${31.5 + neckOffsetY} 51.2,${29.8 + neckOffsetY}
                       Z"
                    fill="url(#windowShoulderGrad)" />
              <rect x="63.0" y="${pillarTopY}" width="11.4" height="${pillarH}" rx="2.4"
                    fill="url(#rightPillarSheen)" />
              <path class="shoulder-sheen"
                    d="M 65.2,${29.8 + neckOffsetY} C 74.2,${34.2 + neckOffsetY} 78.0,${40.2 + neckOffsetY} 78.6,${47.5 + neckOffsetY}"
                    fill="none" stroke="rgba(225, 242, 255, 0.65)" stroke-width="1.5" stroke-linecap="round" />
              ${insideGlassDecorFX}
            </g>

            <!-- 2. 借鉴参考图3 (image_6ee02d) 的 3D 沉底厚玻璃结构：内底与外底之间的厚实水晶玻璃折射层 -->
            <path d="M 19.6,${innerBotY}
                     A 30.4,7.5 0 0,0 80.4,${innerBotY}
                     L 82.2,${outerBotY}
                     A 32.2,8.8 0 0,1 17.8,${outerBotY}
                     Z"
                  fill="url(#baseCushionGrad)" />

            <!-- 3. 厚底玻璃内部月牙形焦散反光弧（左翼与右翼晶莹聚光、中央深邃通透） -->
            <path d="M 20.5,${innerBotY + 1.4}
                     A 29.8,7.8 0 0,0 79.5,${innerBotY + 1.4}
                     A 30.8,8.5 0 0,1 20.5,${innerBotY + 1.4} Z"
                  fill="url(#glassBaseRimHighlight)" opacity="0.68" />

            <!-- 4. 药水底面与玻璃内底交界处的晶莹折光弦线 -->
            <path d="M 19.8,${innerBotY} A 30.2,7.5 0 0,0 80.2,${innerBotY}"
                  fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.25" stroke-linecap="round" />

            <!-- 5. 瓶底最下沿的高折射亮白与冰蓝双层琉璃底边弧（对标参考图3底部亮弧） -->
            <path d="M 18.4,${outerBotY - 0.3} A 31.6,8.6 0 0,0 81.6,${outerBotY - 0.3}"
                  fill="none" stroke="url(#glassBaseRimHighlight)" stroke-width="1.55" stroke-linecap="round" />
            <path d="M 26.0,${outerBotY + 4.8} A 25.0,5.2 0 0,0 74.0,${outerBotY + 4.8}"
                  fill="none" stroke="rgba(255, 255, 255, 0.52)" stroke-width="0.95" stroke-linecap="round" />

            <!-- 外层3D纤细修长琉璃轮廓线 -->
            <path d="M 32.0,${neckLipTopY}
                     C 30.2,${13.4 + neckOffsetY} 31.4,${18.2 + neckOffsetY} 36.4,${20.4 + neckOffsetY}
                     C 37.5,${22.2 + neckOffsetY} 37.5,${24.4 + neckOffsetY} 36.4,${shoulderTopY}
                     C 23.6,${shoulderTopY + 4.2} 17.8,${shoulderTopY + 13.0} 17.8,${shoulderBotY}
                     L 17.8,${outerBotY}
                     A 32.2,8.8 0 0,0 82.2,${outerBotY}
                     L 82.2,${shoulderBotY}
                     C 82.2,${shoulderTopY + 13.0} 76.4,${shoulderTopY + 4.2} 63.6,${shoulderTopY}
                     C 62.5,${24.4 + neckOffsetY} 62.5,${22.2 + neckOffsetY} 63.6,${20.4 + neckOffsetY}
                     C 68.6,${18.2 + neckOffsetY} 69.8,${13.4 + neckOffsetY} 68.0,${neckLipTopY}"
                  fill="none" stroke="${(b.special === 'ad_cam' || b.special === 'ad_cam_blue') ? '#d884ff' : 'url(#naturalRimGrad)'}"
                  stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />



            <!-- 参考图2 (101f7498) 经典圆润深蓝玻璃瓶口 + 紧束短颈环 -->
            <g id="neck-group-${idx}" transform="translate(0, ${neckOffsetY})">
              <path d="M 36.0,20.2 Q 37.2,23.2 36.4,26.2 A 13.8,2.7 0 0,0 63.6,26.2 Q 62.8,23.2 64.0,20.2 Z"
                    class="neck-dark-bg" fill="#1b438a" opacity="0.32" />
              <ellipse cx="50" cy="24.5" rx="10.4" ry="1.6" fill="rgba(120, 175, 255, 0.24)" />
              <path d="M 36.6,25.8 A 13.4,2.5 0 0,0 63.4,25.8"
                    fill="none" stroke="${maxCap === 8 ? '#fde047' : '#4a80db'}" stroke-width="${maxCap === 8 ? '1.5' : '1.15'}" opacity="0.88" />
              <path d="M 31.4,9.2 C 29.8,13.5 31.0,18.2 36.2,20.6 A 14.2,3.3 0 0,0 63.8,20.6 C 69.0,18.2 70.2,13.5 68.6,9.2 A 18.6,3.8 0 0,1 31.4,9.2 Z"
                    class="neck-glass-lip" fill="url(#neckLipGrad)" opacity="0.82"
                    stroke="#3b73cc" stroke-width="1.0" />
              <path d="M 57.2,11.2 C 61.5,11.0 63.6,11.6 62.8,15.2 C 62.2,18.2 60.0,19.8 56.4,20.1 C 57.0,17.2 57.5,14.0 57.2,11.2 Z"
                    fill="rgba(230, 245, 255, 0.85)" />
              <path d="M 32.8,11.0 C 35.2,11.4 36.4,12.8 36.6,16.2 C 36.8,18.6 35.8,19.6 34.0,19.0 C 32.4,16.8 32.0,13.5 32.8,11.0 Z"
                    fill="rgba(140, 190, 255, 0.62)" />
              <path d="M 35.8,20.4 A 14.6,3.3 0 0,0 64.2,20.4"
                    fill="none" stroke="#6ea6f7" stroke-width="1.3" stroke-linecap="round" />
              <ellipse cx="50" cy="9.2" rx="18.5" ry="3.7"
                       fill="url(#neckTopRimGrad)" opacity="0.82" stroke="#6b9fed" stroke-width="1.0" />
              <path d="M 32.0,9.6 A 18.1,3.5 0 0,0 68.0,9.6"
                    fill="none" stroke="#b8d8ff" stroke-width="1.3" stroke-linecap="round" />
              <ellipse cx="50" cy="9.0" rx="10.2" ry="1.9"
                       class="neck-dark-bg" fill="url(#mouthBoreGrad)" opacity="0.72" stroke="#5c92e6" stroke-width="0.95" />
              <path d="M 40.6,9.4 A 9.5,1.7 0 0,0 59.4,9.4"
                    fill="none" stroke="#8cbaff" stroke-width="0.95" stroke-linecap="round" opacity="0.88" />
              <circle id="lip-left-${idx}" cx="38.0" cy="9.8" r="0.1" opacity="0" pointer-events="none" />
              <circle id="lip-right-${idx}" cx="62.0" cy="9.8" r="0.1" opacity="0" pointer-events="none" />
              <circle id="mouth-center-${idx}" cx="50.0" cy="9.5" r="0.1" opacity="0" pointer-events="none" />
            </g>
          </g>

          ${overGlassFX}
          <g id="bottle-vfx-${idx}"></g>
        </svg>
      `;
    }

    function triggerBottleVFX(bottleIdx, vfxType, extraOpts = {}) {
      const isPaperBagBurn = (vfxType === 'paper_bag_burn') || (vfxType === 'cover_unveil' && extraOpts.coverType === 'paper_bag');
      const startT = performance.now();
      const dur = ((isPaperBagBurn ? 920 : (extraOpts.duration || 540))) / getSpeedMultiplier();
      const b = bottles[bottleIdx];
      const gridEl = document.getElementById('bottles-grid');
      const slotEl = gridEl ? gridEl.children[bottleIdx] : null;

      function stepVFX(now) {
        const vfxEl = document.getElementById(`bottle-vfx-${bottleIdx}`);
        const p = Math.min(1, (now - startT) / dur);
        const easeOut = 1 - Math.pow(1 - p, 3);
        const fade = Math.max(0, 1 - Math.pow(p, 1.6));
        let html = '';

        if (vfxType === 'mystery_reveal') {
          const layerIdx = typeof extraOpts.layerIdx === 'number' ? extraOpts.layerIdx : 1;
          const colorKey = extraOpts.colorKey || 'green';
          const col = COLORS[colorKey] || COLORS.green;
          const maxCap = b ? (b.maxCap || 4) : 4;
          const { bottomY, layerH, rx } = getBottleLayerMetrics(maxCap, b ? !!b.isGiantCat : false);
          const cy = bottomY - layerIdx * layerH - layerH * 0.45;

          const curLiqGroup = document.getElementById(`liquid-group-${bottleIdx}`);
          if (curLiqGroup && b && !b.removed) {
            curLiqGroup.innerHTML = buildLiquidLayersMarkup(b.layers, bottleIdx, {
              topLayerScale: 1,
              tiltAngle: 0,
              mysteryCount: b.mysteryCount || 0,
              maxCap,
              isGiantCat: !!b.isGiantCat,
              revealingLayerIdx: layerIdx,
              revealProgress: easeOut
            });
          }

          const ringRx = 10 + easeOut * (rx + 12);
          const ringRy = 4 + easeOut * 11;
          html += `
            <ellipse cx="50" cy="${cy.toFixed(1)}" rx="${ringRx.toFixed(1)}" ry="${ringRy.toFixed(1)}"
                     fill="none" stroke="${col.topLight}" stroke-width="${(3.8 * fade).toFixed(2)}" opacity="${fade.toFixed(2)}" />
            <ellipse cx="50" cy="${cy.toFixed(1)}" rx="${(ringRx * 0.72).toFixed(1)}" ry="${(ringRy * 0.72).toFixed(1)}"
                     fill="${col.topLight}" opacity="${(0.45 * fade).toFixed(2)}" />
          `;

          const qScale = p < 0.35 ? (1 + (p / 0.35) * 0.65) : (1.65 * (1 - (p - 0.35) / 0.65));
          const qRot = p * 38;
          const qY = cy + 6 - easeOut * 22;
          html += `
            <g transform="translate(50, ${qY.toFixed(1)}) rotate(${qRot.toFixed(1)}) scale(${Math.max(0.05, qScale).toFixed(2)})"
               opacity="${fade.toFixed(2)}">
              <text x="0" y="0" text-anchor="middle" fill="#fef08a" font-size="24" font-weight="900"
                    style="filter: drop-shadow(0 0 8px ${col.topLight});">?</text>
            </g>
          `;

          for (let i = 0; i < 12; i++) {
            const ang = (i / 12) * Math.PI * 2 + 0.3;
            const dist = 8 + easeOut * 34 * (0.7 + 0.3 * (i % 3));
            const px = 50 + Math.cos(ang) * dist;
            const py = cy + Math.sin(ang) * dist * 0.65 - easeOut * 14;
            const pr = (2.2 + (i % 3) * 0.9) * fade;
            const pColor = (i % 2 === 0) ? '#fde047' : col.topLight;
            html += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${pr.toFixed(2)}" fill="${pColor}" opacity="${fade.toFixed(2)}" />`;
          }
        } else if (vfxType === 'ice_shatter' || vfxType === 'ice_crack') {
          if (slotEl && !slotEl.classList.contains('pouring-source') && !slotEl.classList.contains('selected')) {
            if (p < 0.45) {
              const shake = Math.sin(p * Math.PI * 8) * (1 - p * 2) * 4.5;
              slotEl.style.transform = `translateX(${shake.toFixed(1)}px)`;
            } else {
              slotEl.style.transform = '';
            }
          }
          const cy = extraOpts.fullBody ? 115 : 178;
          const ringRx = 16 + easeOut * 42;
          html += `
            <ellipse cx="50" cy="${cy}" rx="${ringRx.toFixed(1)}" ry="${(ringRx * 0.32).toFixed(1)}"
                     fill="none" stroke="#bae6fd" stroke-width="${(3.5 * fade).toFixed(2)}" opacity="${fade.toFixed(2)}" />
          `;
          const shardCount = vfxType === 'ice_crack' ? 8 : (extraOpts.fullBody ? 16 : 12);
          for (let i = 0; i < shardCount; i++) {
            const seedA = (i / shardCount) * Math.PI * 2 + 0.2;
            const vx = Math.cos(seedA) * (26 + (i % 4) * 11);
            const vy = Math.sin(seedA) * 18 - 22;
            const gravityY = 48 * p * p;
            const sx = 50 + vx * easeOut;
            const sy = (extraOpts.fullBody ? (55 + (i % 5) * 28) : 175) + vy * easeOut + gravityY;
            const rot = (i % 2 === 0 ? 1 : -1) * p * (140 + i * 18);
            const sScale = (0.85 + (i % 3) * 0.25) * fade;
            const shardCol = (i % 3 === 0) ? '#e0f2fe' : (i % 3 === 1 ? '#7dd3fc' : '#38bdf8');
            html += `
              <g transform="translate(${sx.toFixed(1)}, ${sy.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sScale.toFixed(2)})"
                 opacity="${fade.toFixed(2)}">
                <polygon points="0,-8 7,-2 4,7 -5,6 -7,-3" fill="${shardCol}" stroke="#ffffff" stroke-width="0.9" />
              </g>
            `;
          }
        } else if (vfxType === 'stone_shatter' || vfxType === 'stone_hit') {
          if (slotEl && !slotEl.classList.contains('pouring-source') && !slotEl.classList.contains('selected')) {
            if (p < 0.45) {
              const shake = Math.sin(p * Math.PI * 8) * (1 - p * 2) * 4.5;
              slotEl.style.transform = `translateX(${shake.toFixed(1)}px)`;
            } else {
              slotEl.style.transform = '';
            }
          }
          const cy = 184;
          for (let c = 0; c < 6; c++) {
            const cAng = (c / 6) * Math.PI * 2;
            const cx = 50 + Math.cos(cAng) * easeOut * 34;
            const cY = cy + Math.sin(cAng) * easeOut * 12 - easeOut * 8;
            const cr = (8 + easeOut * 12) * fade;
            html += `<circle cx="${cx.toFixed(1)}" cy="${cY.toFixed(1)}" r="${cr.toFixed(1)}" fill="rgba(231, 203, 169, ${(0.45 * fade).toFixed(2)})" />`;
          }
          const rockCount = vfxType === 'stone_hit' ? 6 : 11;
          for (let i = 0; i < rockCount; i++) {
            const seedA = (i / rockCount) * Math.PI * 2 + 0.4;
            const vx = Math.cos(seedA) * (28 + (i % 3) * 12);
            const vy = Math.sin(seedA) * 14 - 26;
            const gravityY = 58 * p * p;
            const sx = 50 + vx * easeOut;
            const sy = cy + vy * easeOut + gravityY;
            const rot = (i % 2 === 0 ? 1 : -1) * p * 165;
            const rScale = (0.85 + (i % 3) * 0.22) * fade;
            const rockCol = (i % 2 === 0) ? '#e7cba9' : '#cfa67e';
            html += `
              <g transform="translate(${sx.toFixed(1)}, ${sy.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${rScale.toFixed(2)})"
                 opacity="${fade.toFixed(2)}">
                <polygon points="-6,-6 5,-7 8,2 2,7 -7,5" fill="${rockCol}" stroke="#785230" stroke-width="1.0" />
              </g>
            `;
          }
        } else if (vfxType === 'ancient_vanish' || vfxType === 'bomb_defuse') {
          const cy = vfxType === 'ancient_vanish' ? 115 : 86;
          const ringRx = 14 + easeOut * 38;
          html += `
            <ellipse cx="50" cy="${cy}" rx="${ringRx.toFixed(1)}" ry="${(ringRx * 0.38).toFixed(1)}"
                     fill="none" stroke="#fde047" stroke-width="${(3.2 * fade).toFixed(2)}" opacity="${fade.toFixed(2)}" />
          `;
          for (let s = 0; s < 14; s++) {
            const ang = (s / 14) * Math.PI * 2 + p * 2.2;
            const sx = 50 + Math.cos(ang) * (10 + easeOut * 34);
            const sy = cy + Math.sin(ang) * (16 + easeOut * 28) - easeOut * 38;
            html += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(2.8 * fade).toFixed(1)}" fill="${s % 2 === 0 ? '#fde047' : '#ffffff'}" opacity="${fade.toFixed(2)}" />`;
          }
        } else if (isPaperBagBurn) {
          // 修复问题 2：羊皮纸袋解除时如烈焰灼烧般自下而上化作焦黑灰烬与火星渐渐消散
          const burnProgress = Math.min(1, p * 1.15);
          const burnY = 208 - burnProgress * 192;
          const j1 = Math.sin(p * 26) * 5.5;
          const j2 = Math.cos(p * 31) * 5.5;
          const jagPts = [
            `5,${(burnY + j1).toFixed(1)}`,
            `20,${(burnY - 6 - j2).toFixed(1)}`,
            `36,${(burnY + 4 + j1).toFixed(1)}`,
            `50,${(burnY - 7 + j2).toFixed(1)}`,
            `66,${(burnY + 5 - j1).toFixed(1)}`,
            `80,${(burnY - 5 + j2).toFixed(1)}`,
            `95,${(burnY + j1).toFixed(1)}`
          ];
          const jagLine = 'M ' + jagPts.join(' L ');
          const clipPoly = `${jagLine} L 96,14 L 4,14 Z`;

          if (burnProgress < 0.98) {
            html += `
              <defs>
                <clipPath id="burn-clip-${bottleIdx}">
                  <path d="${clipPoly}"/>
                </clipPath>
              </defs>
              <g clip-path="url(#burn-clip-${bottleIdx})" opacity="${Math.max(0, 1 - Math.pow(p, 2.2)).toFixed(2)}">
                <rect x="18" y="26" width="64" height="168" rx="16" fill="url(#smokedAmberFrostedGrad)" />
              </g>
              <!-- 灼烧碳化黑边 + 橙红烈焰 + 金白火星前锋 -->
              <path d="${jagLine}" fill="none" stroke="#1c1008" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round" opacity="${fade.toFixed(2)}"/>
              <path d="${jagLine}" fill="none" stroke="#ea580c" stroke-width="5.2" stroke-linecap="round" stroke-linejoin="round" opacity="${fade.toFixed(2)}" style="filter:drop-shadow(0 0 6px #f97316);"/>
              <path d="${jagLine}" fill="none" stroke="#fef08a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="${fade.toFixed(2)}"/>
            `;
          }

          // 28 片向上飘散的焦黑灰烬与余烬火星
          for (let a = 0; a < 28; a++) {
            const u1 = hash01(a * 13 + 1);
            const u2 = hash01(a * 13 + 2);
            const u3 = hash01(a * 13 + 3);
            const localP = Math.max(0, Math.min(1, (p - u1 * 0.55) / 0.55));
            if (localP <= 0 || localP >= 1) continue;
            const startY = 204 - u1 * 175;
            const startX = 12 + u2 * 76;
            const swayX = Math.sin(localP * Math.PI * 3 + a) * (8 + u3 * 12);
            const ax = startX + swayX + (u2 - 0.5) * localP * 24;
            const ay = startY - localP * (42 + u3 * 46);
            const aFade = Math.sin(localP * Math.PI) * (1 - localP * 0.35);
            const rot = localP * (180 + a * 25) * (a % 2 === 0 ? 1 : -1);
            const isEmber = (a % 3 === 0);
            if (isEmber) {
              const er = (1.4 + (a % 3) * 0.8) * aFade;
              html += `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${er.toFixed(2)}" fill="${a % 2 === 0 ? '#fde047' : '#f97316'}" opacity="${aFade.toFixed(2)}"/>`;
            } else {
              const ashCol = (a % 2 === 0) ? '#292524' : '#44403c';
              const ashScale = (0.65 + u3 * 0.55) * (1 - localP * 0.4);
              html += `
                <g transform="translate(${ax.toFixed(1)}, ${ay.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${ashScale.toFixed(2)})" opacity="${(aFade * 0.9).toFixed(2)}">
                  <polygon points="-4,-3 3,-4 5,2 -1,4 -5,1" fill="${ashCol}" stroke="#78350f" stroke-width="0.4"/>
                </g>
              `;
            }
          }
        } else if (vfxType === 'cover_unveil') {
          const liftY = -easeOut * 95;
          const scaleX = 1 + easeOut * 0.16;
          const fillCol = 'rgba(219, 234, 254, 0.78)';
          const strokeCol = '#ffffff';
          html += `
            <g transform="translate(50, ${(105 + liftY).toFixed(1)}) scale(${scaleX.toFixed(2)}, ${(1 - p * 0.35).toFixed(2)}) translate(-50, -105)"
               opacity="${fade.toFixed(2)}">
              <path d="M 12,35 Q 50,20 88,35 L 92,165 Q 50,180 8,165 Z"
                    fill="${fillCol}" stroke="${strokeCol}" stroke-width="1.5" />
            </g>
          `;
          for (let s = 0; s < 10; s++) {
            const ang = (s / 10) * Math.PI * 2;
            const sx = 50 + Math.cos(ang) * (14 + easeOut * 32);
            const sy = 105 + Math.sin(ang) * (24 + easeOut * 36) - easeOut * 25;
            html += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="${(2.6 * fade).toFixed(1)}" fill="#fef08a" opacity="${fade.toFixed(2)}" />`;
          }
        }

        if (vfxEl) vfxEl.innerHTML = html;
        window._canvasVfxMap = window._canvasVfxMap || {};
        if (p < 1) {
          window._canvasVfxMap[bottleIdx] = { vfxType, p, easeOut, fade, extraOpts, isPaperBagBurn };
          requestAnimationFrame(stepVFX);
        } else {
          delete window._canvasVfxMap[bottleIdx];
          if (slotEl && !slotEl.classList.contains('pouring-source') && !slotEl.classList.contains('selected')) slotEl.style.transform = '';
          if (vfxEl) vfxEl.innerHTML = '';
        }
      }
      requestAnimationFrame(stepVFX);
    }

    function buildNaturalBottleMotionFX(trailHistory, bodyPose, colObj, phaseMode, phaseP) {
      let html = '';

      if (trailHistory && trailHistory.length >= 2) {
        const firstPt = trailHistory[0];
        const lastPt = trailHistory[trailHistory.length - 1];
        const moveSpan = Math.hypot(lastPt.cx - firstPt.cx, lastPt.cy - firstPt.cy);

        if (moveSpan > 4) {
          const upperPts = [];
          const lowerPts = [];
          const n = trailHistory.length;
          for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            const pt = trailHistory[i];
            const halfW = (pt.halfH || 28) * Math.pow(t, 1.35) * 0.68;
            const rad = ((pt.deg || 0) * Math.PI) / 180;
            const nx = -Math.sin(rad);
            const ny = Math.cos(rad);
            upperPts.push(`${(pt.cx + nx * halfW).toFixed(1)},${(pt.cy + ny * halfW).toFixed(1)}`);
            lowerPts.push(`${(pt.cx - nx * halfW).toFixed(1)},${(pt.cy - ny * halfW).toFixed(1)}`);
          }
          const ribbonPath = `M ${upperPts.join(' L ')} L ${lowerPts.reverse().join(' L ')} Z`;
          const wakeOpacity = phaseMode === 'move'
            ? Math.sin(phaseP * Math.PI) * 0.34 + 0.08
            : (phaseMode === 'return' ? (1 - phaseP) * 0.26 : 0.12);

          html += `
            <defs>
              <linearGradient id="motionSwooshGrad" x1="${firstPt.cx.toFixed(1)}" y1="${firstPt.cy.toFixed(1)}"
                              x2="${lastPt.cx.toFixed(1)}" y2="${lastPt.cy.toFixed(1)}" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0" />
                <stop offset="55%" stop-color="#ffffff" stop-opacity="${(wakeOpacity * 0.55).toFixed(3)}" />
                <stop offset="100%" stop-color="${colObj ? colObj.topLight : '#ffffff'}" stop-opacity="${wakeOpacity.toFixed(3)}" />
              </linearGradient>
            </defs>
            <path d="${ribbonPath}" fill="url(#motionSwooshGrad)" filter="url(#softTrailBlur)" />
          `;
        }
      }

      if (bodyPose) {
        const { cx, cy, deg, halfW, halfH } = bodyPose;
        const globalAlpha = phaseMode === 'return' ? Math.max(0, 1 - phaseP * 1.15) : 1.0;

        if (globalAlpha > 0.02) {
          html += `<g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) rotate(${deg.toFixed(1)})" opacity="${globalAlpha.toFixed(2)}">`;
          html += `
            <ellipse cx="0" cy="0" rx="${(halfW * 1.06).toFixed(1)}" ry="${(halfH * 0.80).toFixed(1)}"
                     fill="rgba(255, 230, 130, 0.11)" filter="url(#softTrailBlur)" />
          `;

          const pCount = 14;
          const timeSec = performance.now() / 1000;
          for (let i = 0; i < pCount; i++) {
            const seed = hash01(i * 17 + 5);
            const seed2 = hash01(i * 31 + 11);
            const cycle = (timeSec * (1.35 + seed * 0.8) + i / pCount) % 1.0;
            const side = (i % 2 === 0) ? -1 : 1;

            const localY = (seed - 0.5) * halfH * 1.55 + Math.cos(cycle * Math.PI * 2 + i) * 5;
            const driftOut = cycle * (10 + seed2 * 12);
            const localX = side * (halfW * 0.92 + driftOut);
            const alpha = Math.sin(cycle * Math.PI) * (0.65 + 0.35 * seed2);
            const r = (1.3 + (i % 3) * 0.95) * Math.sin(cycle * Math.PI);
            const pCol = (i % 3 === 0) ? '#fff59d' : (i % 3 === 1 ? '#ffffff' : (colObj ? colObj.topLight : '#b8e8ff'));

            if (i % 4 === 0) {
              const sScale = (r * 0.42).toFixed(2);
              html += `
                <path d="M 0,-5 L 1.2,-1.2 L 5,0 L 1.2,1.2 L 0,5 L -1.2,1.2 L -5,0 L -1.2,-1.2 Z"
                      fill="${pCol}" opacity="${alpha.toFixed(2)}"
                      transform="translate(${localX.toFixed(1)}, ${localY.toFixed(1)}) rotate(${(-deg).toFixed(1)}) scale(${sScale})" />
              `;
            } else {
              html += `
                <circle cx="${localX.toFixed(1)}" cy="${localY.toFixed(1)}" r="${r.toFixed(2)}"
                        fill="${pCol}" opacity="${alpha.toFixed(2)}" />
              `;
            }
          }
          html += `</g>`;
        }
      }

      return html;
    }

    // ==========================================
    // 9. 商店主题面板、200关选关面板与主界面渲染
    // ==========================================
    function applyTheme(themeId) {
      activeThemeId = themeId;
      document.body.setAttribute('data-theme', themeId);
      renderShopItems();
    }

    function renderShopItems() {
      const gridEl = document.getElementById('shop-grid');
      if (!gridEl) return;
      gridEl.innerHTML = '';

      SHOP_THEMES.forEach(item => {
        if (item.unlockType === 'lv10' && currentLevelId >= 10) item.unlocked = true;
        const isUnlocked = !!item.unlocked;
        const isActive = activeThemeId === item.id;

        const card = document.createElement('div');
        card.className = 'shop-item-card shop-wave-enter' + (isActive ? ' active-theme' : '');
        card.style.animationDelay = `${SHOP_THEMES.indexOf(item) * 36}ms`;

        let btnClass = 'shop-action-btn ';
        let btnHTML = '';
        if (isActive) {
          btnClass += 'in-use';
          btnHTML = '使用中';
        } else if (isUnlocked) {
          btnClass += 'in-use';
          btnHTML = '立即使用';
        } else if (item.unlockType === 'lv10') {
          btnClass += 'unlock-gold';
          btnHTML = '关卡10解锁';
        } else {
          btnClass += 'unlock-gold';
          btnHTML = `
            <svg width="16" height="12" viewBox="0 0 28 20" fill="none" style="filter:drop-shadow(0 1.5px 0 #783f00);">
              <rect x="1" y="2" width="18" height="16" rx="3.5" fill="#ffffff"/>
              <polygon points="19,6 27,2 27,18 19,14" fill="#ffffff" stroke-linejoin="round"/>
              <polygon points="7,6 7,14 14,10" fill="#d97706"/>
            </svg>
            <span>免费获得</span>
          `;
        }

        const swatchBg = item.isBeach
          ? 'linear-gradient(180deg, #62dce8 0%, #98eef5 48%, #f5e2ba 50%, #e6c68b 100%)'
          : `linear-gradient(180deg, ${item.topCol} 0%, ${item.topCol} 48%, ${item.botCol} 48.1%, ${item.botCol} 100%)`;

        const extraDecor = item.isBeach ? `
          <svg viewBox="0 0 64 60" width="100%" height="100%" style="position:absolute;inset:0;">
            <path d="M 0,28 Q 20,21 40,28 T 64,25 L 64,35 Q 42,40 20,33 T 0,36 Z" fill="rgba(255,255,255,0.75)" />
            <ellipse cx="13" cy="45" rx="6.5" ry="4.2" fill="#94a3b8" />
            <ellipse cx="11.5" cy="44" rx="3" ry="1.6" fill="#cbd5e1" />
            <path d="M 48,40 L 50.5,45.5 L 56.5,45.5 L 51.8,49 L 53.5,54.5 L 48,51 L 42.5,54.5 L 44.2,49 L 39.5,45.5 L 45.5,45.5 Z" fill="#f97316" stroke="#c2410c" stroke-width="0.8" stroke-linejoin="round" />
          </svg>
        ` : (item.unlockType === 'mystery' && !isUnlocked ? `
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:#ffffff;text-shadow:0 2px 0 rgba(0,0,0,0.25);">?</div>
        ` : '');

        card.innerHTML = `
          <div class="shop-swatch">
            <div class="shop-swatch-inner" style="background: ${swatchBg};">
              ${extraDecor}
            </div>
            ${isActive ? `
              <div class="shop-check-badge">
                <svg viewBox="0 0 32 30" width="100%" height="100%">
                  <path d="M4,15 L12,23 L28,6" fill="none" stroke="#1e5e00" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" transform="translate(0, 2)"/>
                  <path d="M4,15 L12,23 L28,6" fill="none" stroke="#62eb00" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M5,14 L12,21 L27,5" fill="none" stroke="#b9f6ca" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            ` : ''}
          </div>
          <div class="shop-item-name">${item.name}</div>
          <button class="${btnClass}">${btnHTML}</button>
        `;

        card.addEventListener('click', () => {
          if (isUnlocked) {
            applyTheme(item.id);
            playSound('select');
            showToast(`🎨 已切换主题：【${item.name}】`);
          } else {
            item.unlocked = true;
            applyTheme(item.id);
            playSound('pack');
            showToast(`🎬 已为您免费解锁并装备主题：【${item.name}】！`);
          }
        });

        gridEl.appendChild(card);
      });
    }

    function checkAndShowMechanicIntro() {
      const cfg = getLevelConfig(currentLevelId);
      const key = cfg.introMechanicKey;
      if (!key || shownMechanicIntros.has(key) || !MECHANIC_INTROS[key]) return;

      shownMechanicIntros.add(key);
      const info = MECHANIC_INTROS[key];
      const titleEl = document.getElementById('mech-title');
      const descEl = document.getElementById('mech-desc');

      if (titleEl) titleEl.textContent = info.title || '解锁新玩法';
      if (descEl) descEl.innerHTML = info.desc || '';

      const previewEl = document.getElementById('mech-preview-stage');
      if (previewEl) {
        previewEl.style.width = '96px';
        previewEl.style.height = '204px';
        const sampleB = typeof info.sampleBottle === 'function' ? info.sampleBottle() : info.sampleBottle;
        previewEl.innerHTML = renderBottleSVG(sampleB, 99);
      }
      window._handbookActiveLevelKey = key;
      const hIdx = HANDBOOK_KEYS.indexOf(key);
      if (hIdx !== -1) window._handbookIdx = hIdx;
      const maskEl = document.getElementById('mechanic-modal-mask');
      if (maskEl) maskEl.classList.add('show');
      playSound('pack');
    }

    function renderLevelModalCards() {
      const listEl = document.getElementById('level-grid-list');
      if (!listEl) return;
      listEl.innerHTML = '';

      document.querySelectorAll('.chapter-tab-btn').forEach(btn => {
        btn.classList.toggle('active', Number(btn.dataset.ch) === currentChapterTab);
      });

      const startLv = currentChapterTab * 40 + 1;
      const endLv = Math.min(200, startLv + 39);

      for (let lv = startLv; lv <= endLv; lv++) {
        const cfg = getLevelConfig(lv);
        const cell = document.createElement('div');
        let cls = 'level-cell wave-enter';
        if (lv === currentLevelId) cls += ' active';
        else if (cfg.isCatBossLevel || cfg.pos === 10) cls += ' boss-cell';
        cell.className = cls;
        const localIdx = lv - startLv;
        const r = Math.floor(localIdx / 4), c = localIdx % 4;
        cell.style.animationDelay = `${(r + c) * 18}ms`;

        const starsStr = '★'.repeat(cfg.waveStars) + '☆'.repeat(5 - cfg.waveStars);
        cell.innerHTML = `
          <div class="level-cell-num">第 ${lv} 关</div>
          <div class="level-cell-tag">${cfg.shortTag}</div>
          <div class="level-cell-wave">${starsStr}</div>
        `;
        cell.addEventListener('click', () => {
          if (isAnimating) return;
          currentLevelId = lv;
          initGame();
          document.getElementById('level-modal-mask').classList.remove('show');
          showToast(`✨ 已开启：关卡 ${lv}`);
        });
        listEl.appendChild(cell);
      }
    }

    // 借鉴参考图1 (image_8a1481 瀑布流错落矩阵) 与防碰撞同向位移定律的程序化多拓扑空间排布引擎：
    // 1) 彻底解决图2中「上排瓶底与下排瓶口挨得过近」的问题：同列上下排严格遵循【同向平行位移 + 逐排递增下移 (botY >= topY + 6px)】，上下瓶间距永远恒定宽敞！
    // 2) 突破单调的固定2x6模板循环：结合关卡号与随机种子，动态生成【4x3瀑布流矩阵】、【4x3梅花桩错缝砖阵】、【5-4-3 / 3-5-4 / 4-5-3 / 3-4-5 多阶星钻群落】以及【连续黄金谐波6列流光阵】，千关千面！
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

    function renderAll() {
      window._layoutDirty = true;
      const cfg = getLevelConfig(currentLevelId);
      const bigNumEl = document.getElementById('zen-header-big-num');
      const pillTitleEl = document.getElementById('level-pill-title');
      const corkedCnt = bottles.filter(b => b && b.corked).length;
      const activeOrCorked = bottles.filter(b => b && (b.corked || b.removed || (b.layers && b.layers.length > 0))).length;
      const totalTargets = cfg.isCatBossLevel ? 8 : (cfg.hasBags ? Math.max(4, packedTotal + bottles.filter(b => b && !b.removed && b.layers && b.layers.length > 0).length - 1) : Math.max(1, bottles.filter(b => b && (b.corked || (b.layers && b.layers.length > 0))).length));
      const catBottleNow = cfg.isCatBossLevel ? bottles.find(b => b.isGiantCat) : null;
      const doneCnt = cfg.isCatBossLevel ? (catBottleNow ? catBottleNow.layers.length : 0) : (cfg.hasBags ? packedTotal : corkedCnt);

      if (bigNumEl) {
        bigNumEl.textContent = `第 ${currentLevelId} 关`;
        bigNumEl.classList.toggle('danger-low', remainingMoves !== null && remainingMoves <= 5);
      }
      if (remainingMoves !== null) {
        if (pillTitleEl) pillTitleEl.textContent = `剩余步数 ${remainingMoves}`;
      } else {
        const targetDenom = cfg.hasBags ? (levelTargetTotalBottles || 7) : totalTargets;
        if (pillTitleEl) pillTitleEl.textContent = `已封存 ${doneCnt}/${targetDenom}`;
      }

      const movesCounterPill = document.getElementById('moves-counter-pill');
      const movesLeftNum = document.getElementById('moves-left-num');
      if (movesCounterPill && movesLeftNum) {
        if (remainingMoves !== null) {
          movesCounterPill.classList.add('show');
          movesLeftNum.textContent = remainingMoves;
          const isDanger = (remainingMoves <= 5);
          movesCounterPill.classList.toggle('alarm-danger', isDanger);
        } else {
          movesCounterPill.classList.remove('show');
        }
      }

      const speedBtn = document.getElementById('speed-x2-btn');
      if (speedBtn) {
        speedBtn.classList.toggle('active-2x', !!isSpeed2x);
      }

      const bagsStage = document.getElementById('bags-stage');
      const modeBanner = document.getElementById('mode-banner');

      if (cfg.hasBags) {
        bagsStage.classList.remove('hidden');
        if (remainingMoves !== null) {
          modeBanner.classList.add('show');
          const bannerText = document.getElementById('mode-banner-text');
          const bannerProg = document.getElementById('mode-banner-progress');
          if (bannerText) bannerText.textContent = '🛍️ 倒满同色水装入礼袋';
          if (bannerProg) bannerProg.textContent = `完成 ${packedTotal}/${bags.length}`;
        } else {
          modeBanner.classList.remove('show');
        }
        bagsStage.innerHTML = '';
        bags.forEach((bag, idx) => {
          const slot = document.createElement('div');
          slot.className = 'bag-slot';
          if (bag.removed) {
            slot.style.visibility = 'hidden';
            slot.style.pointerEvents = 'none';
          } else {
            slot.innerHTML = '';
            slot.addEventListener('click', () => onBagClick(idx));
          }
          bagsStage.appendChild(slot);
        });
      } else {
        bagsStage.classList.add('hidden');
        const bannerText = document.getElementById('mode-banner-text');
        const bannerProg = document.getElementById('mode-banner-progress');

        if (cfg.isCatBossLevel) {
          modeBanner.classList.add('show');
          const catBottle = bottles.find(b => b.isGiantCat);
          const curCatLayers = catBottle ? catBottle.layers.length : 0;
          const catColName = COLORS[(catBottle && catBottle.catTargetColor) || 'pink'].name;
          if (bannerText) bannerText.textContent = `🐱 倒满中央【${catColName}】大猫瓶`;
          if (bannerProg) bannerProg.textContent = `完成 ${curCatLayers}/8`;
        } else if (remainingMoves !== null) {
          modeBanner.classList.add('show');
          const corkedCnt = bottles.filter(b => b.corked).length;
          const totalTargets = bottles.filter(b => b.layers.length > 0).length;
          if (bannerText) bannerText.textContent = '⏳ 在步数耗尽前完成归类';
          if (bannerProg) bannerProg.textContent = `完成 ${corkedCnt}/${totalTargets}`;
        } else {
          /* 常规关卡保持参考图极简纯粹画面，隐藏顶部横幅 */
          modeBanner.classList.remove('show');
        }
      }

      const grid = document.getElementById('bottles-grid');
      const stageLayout = computeProceduralStageLayout(currentLevelId, bottles.length, cfg);
      grid.className = 'bottles-grid ' + (stageLayout.gridClass || cfg.gridClass || '') + (userSettings.zoom ? ' zoomed-stage' : '');
      grid.innerHTML = '';
      bottles.forEach((b, idx) => {
        const slot = document.createElement('div');
        const slotPose = (stageLayout.slots && stageLayout.slots[idx]) || { topPx: 0, leftPx: 0, gridCol: '' };
        if (slotPose.gridCol) slot.style.gridColumn = slotPose.gridCol;
        if (slotPose.topPx) slot.style.top = `${slotPose.topPx}px`;
        if (slotPose.leftPx) slot.style.left = `${slotPose.leftPx}px`;

        let cls = 'bottle-slot';
        if (b.isGiantCat) cls += ' giant-cat-slot';
        else if (b.maxCap === 8) cls += ' tall-8-slot';
        if (b.removed) {
          cls += ' bottle-removed';
          slot.className = cls;
          slot.innerHTML = '';
        } else {
          if (selectedIndex === idx) cls += ' selected';
          if (selectedIndex !== null && selectedIndex !== idx && b.special === 'color_lock' && !b.corked) {
            const selB = bottles[selectedIndex];
            const selTop = selB && selB.layers.length > 0 ? selB.layers[selB.layers.length - 1] : null;
            if (selTop) cls += (selTop === b.requiredColor) ? ' color-lock-match' : ' color-lock-mismatch';
          }
          if (activeHintPair && activeHintPair.srcIdx === idx) cls += ' hint-source-slot';
          if (activeHintPair && activeHintPair.dstIdx === idx) cls += ' hint-target-slot';
          if (isLevelEntering && !b.removed) {
            cls += ' level-enter-anim';
            slot.style.animationDelay = `${idx * 28}ms`;
          }
          slot.className = cls;
          const _nOff = getNeckOffsetY(b.maxCap || 4, !!b.isGiantCat);
          const _m = getBottleLayerMetrics(b.maxCap || 4, !!b.isGiantCat);
          const _lipY = b.isGiantCat ? 11.0 : (9.8 + _nOff);
          const _mouthY = b.isGiantCat ? 11.0 : (9.5 + _nOff);
          slot.innerHTML = `<div class="burlap-coaster-pad"></div><svg class="bottle-svg" viewBox="${_m.vbMinX} ${_m.vbMinY} ${_m.vbW} ${_m.vbH}"><g id="liquid-group-${idx}"></g><circle id="lip-left-${idx}" cx="${b.isGiantCat ? 36.0 : 38.0}" cy="${_lipY}" r="0.1"/><circle id="lip-right-${idx}" cx="${b.isGiantCat ? 64.0 : 62.0}" cy="${_lipY}" r="0.1"/><circle id="mouth-center-${idx}" cx="50.0" cy="${_mouthY}" r="0.1"/></svg>`;
          slot.addEventListener('click', () => onBottleClick(idx));
        }
        grid.appendChild(slot);
      });

      const hintBadge = document.getElementById('hint-count');
      if (hintBadge) {
        hintBadge.textContent = hintUses > 0 ? hintUses : '+';
      }
      const shuffleBadge = document.getElementById('shuffle-count');
      if (shuffleBadge) {
        shuffleBadge.textContent = shuffleUses > 0 ? shuffleUses : '+';
      }
      const undoBadge = document.getElementById('undo-count-badge');
      if (undoBadge) {
        undoBadge.textContent = undoUses > 0 ? undoUses : '+';
      }
      const addBottleBadge = document.getElementById('add-bottle-count');
      if (addBottleBadge) {
        addBottleBadge.textContent = addBottleUses > 0 ? addBottleUses : '+';
      }
      if (activeHintPair && !isAnimating) {
        requestAnimationFrame(renderHintGuideOverlay);
      } else if (!isAnimating) {
        const fxSvg = document.getElementById('fx-overlay');
        if (fxSvg) fxSvg.innerHTML = '';
      }
    }

    function renderHintGuideOverlay() {
      const fxSvg = document.getElementById('fx-overlay');
      if (!fxSvg) return;
      if (!activeHintPair || isAnimating) {
        fxSvg.innerHTML = '';
        return;
      }
      const gridEl = document.getElementById('bottles-grid');
      const srcEl = gridEl?.children[activeHintPair.srcIdx];
      const dstEl = gridEl?.children[activeHintPair.dstIdx];
      if (!srcEl || !dstEl) {
        fxSvg.innerHTML = '';
        return;
      }
      const sRect = srcEl.getBoundingClientRect();
      const dRect = dstEl.getBoundingClientRect();
      /* 关键修复：读取水瓶真实瓶口锚点 (#mouth-center-idx) 的屏幕坐标，精准适配 2层矮瓶 / 4层中瓶 / 6层高瓶 / 8层长管瓶的实际高度！ */
      const srcMouthEl = document.getElementById(`mouth-center-${activeHintPair.srcIdx}`);
      const dstMouthEl = document.getElementById(`mouth-center-${activeHintPair.dstIdx}`);
      const sMouthRect = srcMouthEl ? srcMouthEl.getBoundingClientRect() : null;
      const dMouthRect = dstMouthEl ? dstMouthEl.getBoundingClientRect() : null;
      const sx = (sMouthRect && sMouthRect.width >= 0) ? (sMouthRect.left + sMouthRect.width * 0.5) : (sRect.left + sRect.width * 0.5);
      const sy = (sMouthRect && sMouthRect.height >= 0) ? (sMouthRect.top + sMouthRect.height * 0.5) : (sRect.top + 8);
      const dx = (dMouthRect && dMouthRect.width >= 0) ? (dMouthRect.left + dMouthRect.width * 0.5) : (dRect.left + dRect.width * 0.5);
      const dy = (dMouthRect && dMouthRect.height >= 0) ? (dMouthRect.top + dMouthRect.height * 0.5) : (dRect.top + 10);
      const winW = window.innerWidth || 390;

      const deltaX = dx - sx;
      const deltaY = dy - sy;
      const isVertical = Math.abs(deltaX) < 48;

      let path = '';
      let angDeg = 0;
      let arrowX = dx;
      let arrowY = dy;
      let sBadge = { x: sx, y: sy - 16 };
      let dBadge = { x: dx, y: dy - 18 };

      if (isVertical) {
        // 修复问题4：上下两排同列或垂直倒水时，流光弧线向外侧优美外拱，避开瓶身重叠，并自斜上方自然平滑注入目标瓶口
        const sideDir = (Math.abs(deltaX) >= 10) ? Math.sign(deltaX) : (sx > winW * 0.5 ? -1 : 1);
        const spanY = Math.abs(deltaY);
        const bulgeX = Math.max(46, Math.min(68, 42 + spanY * 0.08));

        const cp1x = sx + sideDir * bulgeX;
        const cp1y = sy - (deltaY > 0 ? 18 : 28);
        const cp2x = dx + sideDir * (bulgeX * 0.88);
        const cp2y = dy - 26;

        arrowX = dx + sideDir * 2.5;
        arrowY = dy - 1.5;

        path = `M ${sx.toFixed(1)},${sy.toFixed(1)} C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${arrowX.toFixed(1)},${arrowY.toFixed(1)}`;
        const vx = arrowX - cp2x;
        const vy = arrowY - cp2y;
        angDeg = (Math.atan2(vy, vx) * 180) / Math.PI;

        // 标签置于外凸弧线相对的另一侧瓶口上方，绝不与流光弧线或箭头冲突重合
        sBadge = { x: sx - sideDir * 18, y: sy - 18 };
        dBadge = { x: dx - sideDir * 18, y: dy - 20 };
      } else {
        // 左右横向或大对角线倒水时：起点与终点严格锚定两个水瓶的真实瓶口高度 (sx, sy) 与 (dx, dy)
        const spanX = Math.abs(deltaX);
        const archH = Math.max(44, Math.min(88, spanX * 0.34));
        const ctrlX = (sx + dx) * 0.5;
        // 若两瓶之间隔着高瓶，控制点自然拱起越过中间瓶口，同时起止点100%精准落在矮瓶/高瓶的真实瓶口上
        const highestSlotTop = Math.min(sRect.top, dRect.top);
        const ctrlY = Math.min(Math.min(sy, dy) - archH, highestSlotTop - 18);

        arrowX = dx;
        arrowY = dy;
        path = `M ${sx.toFixed(1)},${sy.toFixed(1)} Q ${ctrlX.toFixed(1)},${ctrlY.toFixed(1)} ${arrowX.toFixed(1)},${arrowY.toFixed(1)}`;
        angDeg = (Math.atan2(dy - ctrlY, dx - ctrlX) * 180) / Math.PI;

        sBadge = { x: sx, y: sy - 18 };
        dBadge = { x: dx, y: dy - 20 };
      }

      sBadge.x = Math.max(30, Math.min(winW - 30, sBadge.x));
      dBadge.x = Math.max(30, Math.min(winW - 30, dBadge.x));

      fxSvg.innerHTML = `
        <defs>
          <linearGradient id="hintArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#fde047"/>
            <stop offset="50%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#4ade80"/>
          </linearGradient>
        </defs>
        <!-- 3D流光指引弧线 -->
        <path d="${path}"
              fill="none" stroke="rgba(12, 24, 56, 0.65)" stroke-width="8" stroke-linecap="round"/>
        <path d="${path}"
              fill="none" stroke="url(#hintArcGrad)" stroke-width="4.5" stroke-dasharray="9 5" stroke-linecap="round"
              style="animation: hintArrowDash 0.8s linear infinite;"/>
        <!-- 目标瓶口箭头 -->
        <g transform="translate(${arrowX.toFixed(1)}, ${arrowY.toFixed(1)}) rotate(${angDeg.toFixed(1)})">
          <polygon points="4,0 -11,-7 -8,0 -11,7" fill="#4ade80" stroke="#064e3b" stroke-width="1.8" stroke-linejoin="round"/>
        </g>
        <!-- ① 倒出 胶囊标签 -->
        <g transform="translate(${sBadge.x.toFixed(1)}, ${sBadge.y.toFixed(1)})" pointer-events="none">
          <rect x="-26" y="-11" width="52" height="20" rx="10" fill="#f59e0b" stroke="#ffffff" stroke-width="2"
                style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.45));"/>
          <text x="0" y="3" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="900">① 倒出</text>
        </g>
        <!-- ② 倒入 胶囊标签 -->
        <g transform="translate(${dBadge.x.toFixed(1)}, ${dBadge.y.toFixed(1)})" pointer-events="none">
          <rect x="-26" y="-11" width="52" height="20" rx="10" fill="#0284c7" stroke="#ffffff" stroke-width="2"
                style="filter:drop-shadow(0 3px 5px rgba(0,0,0,0.45));"/>
          <text x="0" y="3" text-anchor="middle" fill="#ffffff" font-size="11" font-weight="900">② 倒入</text>
        </g>
      `;
    }

    // ==========================================
    // 10. 瓶子交互与物理重力倾倒动画
    // ==========================================
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
      playSound('reject_lock');
      const gridEl = document.getElementById('bottles-grid');
      const slotEl = gridEl ? gridEl.children[bottleIdx] : null;
      if (!slotEl) return;

      // 关键修复：先清除入场动画类 level-enter-anim，防止移除 bottle-reject-shake 时重新触发 bottleStaggerEnter (opacity:0) 导致画面闪一下！
      slotEl.classList.remove('level-enter-anim', 'bottle-reject-shake');
      slotEl.style.animationDelay = '';
      void slotEl.offsetWidth;
      slotEl.classList.add('bottle-reject-shake');
      clearTimeout(slotEl._shakeTimer);
      slotEl._shakeTimer = setTimeout(() => {
        slotEl.classList.remove('bottle-reject-shake');
      }, 400);

      // 移除旧气泡并在该瓶子正上方弹出暖象牙香槟磨砂玻璃气泡（去除多余的圆点）
      const oldCallout = slotEl.querySelector('.bottle-reject-callout');
      if (oldCallout) oldCallout.remove();
      const callout = document.createElement('div');
      callout.className = 'bottle-reject-callout';
      callout.innerHTML = `<span>${badgeText}</span>`;
      slotEl.appendChild(callout);
      setTimeout(() => {
        if (callout.parentNode) callout.remove();
      }, 1350);
    }

    // 统一倾倒状态机条件 1 & 2：源瓶可拿起判定（极简清晰提示气泡）
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
        document.getElementById('out-of-moves-modal-mask')?.classList.add('show');
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
        if (dt > durSec || isAnimating) {
          entranceSloshRaf = null;
          window._canvasSloshMap = {};
          return;
        }

        const amp = 0.88 * Math.exp(-2.85 * dt);
        const phase = dt * 14.2;

        bottles.forEach((b, idx) => {
          if (!b || b.removed || b.layers.length === 0 || b.corked) return;
          const liqGroup = document.getElementById(`liquid-group-${idx}`);
          if (!liqGroup) return;
          const bottlePhase = phase + idx * 0.45;
          window._canvasSloshMap = window._canvasSloshMap || {};
          window._canvasSloshMap[idx] = { sloshPhase: bottlePhase, sloshAmplitude: amp };
        });

        entranceSloshRaf = requestAnimationFrame(tickEntranceSlosh);
      }

      entranceSloshRaf = requestAnimationFrame(tickEntranceSlosh);
    }

    // 智能提示功能（对应底部【💡提示】大按钮）：智能查找当前盘面理论最优一步，并高亮显示与绘制流光指引弧线
    function executeSmartHint() {
      const move = findBestPourMove();
      if (move) {
        if (hintUses > 0) {
          hintUses--;
        } else {
          hintUses = 3;
          showToast('🎬 激励视频奖励：已为您免费补充 +3 次提示机会！');
        }
        stopSelectSloshAnimation();
        const prevIdx = selectedIndex;
        activeHintPair = { srcIdx: move.srcIdx, dstIdx: move.dstIdx };
        selectedIndex = move.srcIdx;
        playSound('btn_hint');
        const hintBadge = document.getElementById('hint-count');
        if (hintBadge) {
          hintBadge.textContent = hintUses > 0 ? hintUses : '+';
          hintBadge.classList.remove('badge-bump');
          void hintBadge.offsetWidth;
          hintBadge.classList.add('badge-bump');
        }
        updateBottleSelectionDOM(prevIdx, move.srcIdx);
        startSelectSloshAnimation(move.srcIdx);
        // 去除冗余遮挡的提示语条，盘面上的高亮瓶身、流光弧线与 ① ② 标签已清晰直白表达操作
      } else {
        showToast('💡 当前无路可走，请点击【打乱】或【撤回】！');
      }
    }

    // 打乱功能（对应底部【双向旋转箭头】大按钮）：将场上未封存瓶子中剩下的所有水打乱重排，总数完全守恒不变！
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
      showToast('🔀 已为您打乱重排盘面剩余药水（药水总数保持不变）！');
      renderAll();
      const shuffleBadge = document.getElementById('shuffle-count');
      if (shuffleBadge) {
        shuffleBadge.classList.remove('badge-bump');
        void shuffleBadge.offsetWidth;
        shuffleBadge.classList.add('badge-bump');
      }
      const gridEl = document.getElementById('bottles-grid');
      if (gridEl) {
        Array.from(gridEl.children).forEach((slotEl, idx) => {
          const b = bottles[idx];
          if (b && !b.removed && !b.corked && b.layers.length > 0) {
            slotEl.classList.remove('level-enter-anim', 'shuffle-wave-anim');
            slotEl.style.animationDelay = `${(idx % 6) * 26 + Math.floor(idx / 6) * 45}ms`;
            slotEl.classList.add('shuffle-wave-anim');
            setTimeout(() => {
              slotEl.classList.remove('shuffle-wave-anim');
              slotEl.style.animationDelay = '';
            }, 620);
          }
        });
      }
      startLevelEntranceSlosh();
    }
    function buildGravityStreamSVG(spoutX, spoutY, mouthX, mouthY, surfaceY, dstRect, pourDir, colObj, pourProgress, splashCtx) {
      const {
        initialDstLayers = 0,
        moveCount = 1,
        currentTotalLayers = 0,
        dstBottle = null
      } = splashCtx || {};

      const headRatio = Math.min(1, pourProgress / 0.09);
      const tailRatio = pourProgress > 0.90 ? Math.min(1, (pourProgress - 0.90) / 0.10) : 0;

      const totalDrop = Math.max(18, surfaceY - spoutY);
      const yStart = spoutY + totalDrop * (tailRatio * tailRatio * 0.82);
      const yEnd = spoutY + totalDrop * (headRatio * headRatio);
      if (yEnd - yStart < 4) return '';

      const isCatTarget = dstBottle && dstBottle.isGiantCat;
      const dstCapVal = dstBottle ? (dstBottle.maxCap || 4) : 4;
      const { vbMinX, vbMinY, vbW, vbH, layerH: dstLayerH, rx: bottleInnerRx } = getBottleLayerMetrics(dstCapVal, isCatTarget);
      const dstNeckOffsetY = getNeckOffsetY(dstCapVal, isCatTarget);

      const scale = Math.min(dstRect.width / vbW, dstRect.height / vbH);
      const offX = dstRect.left + (dstRect.width - vbW * scale) * 0.5 - vbMinX * scale;
      const offY = dstRect.top + (dstRect.height - vbH * scale) * 0.5 - vbMinY * scale;
      const sx = (x) => (offX + x * scale).toFixed(2);
      const sy = (y) => (offY + (y + dstNeckOffsetY) * scale).toFixed(2);

      // 物理参数 1：根据实时落差高度 (totalDrop) 与倾倒水量 (moveCount) 计算流体冲击动能
      // 空瓶/低液位时落差大 (heightFactor ~ 1.35)，水花高扬且充沛；接近满瓶时落差小 (heightFactor ~ 0.35)，转为轻柔细密微澜
      const dropInBottlePx = Math.max(12, surfaceY - mouthY);
      const maxDropInBottlePx = Math.max(60, dstRect.height * 0.78);
      const heightFactor = Math.max(0.30, Math.min(1.42, (dropInBottlePx / maxDropInBottlePx) * 1.38));
      const volumeFactor = 0.86 + Math.min(3, moveCount - 1) * 0.24;
      const impactEnergy = heightFactor * volumeFactor;

      // 物理参数 2：构建受重力加速拉细、带微幅流体脉动的丝滑水柱
      const N = 24;
      const leftEdge = [];
      const rightEdge = [];
      const specCenterCurve = [];

      const archHeight = Math.max(16, (mouthY - spoutY) + 11);
      const fluxRadiusBoost = 0.94 + Math.min(3, moveCount - 1) * 0.14;
      const timeNow = performance.now() * 0.012;

      for (let i = 0; i <= N; i++) {
        const s = i / N;
        const y = yStart + (yEnd - yStart) * s;
        const dyFromSpout = Math.max(0, y - spoutY);
        const globalS = Math.max(0, Math.min(1, dyFromSpout / totalDrop));

        let x;
        if (dyFromSpout < archHeight) {
          const tArch = dyFromSpout / archHeight;
          const easeArch = Math.sin(tArch * Math.PI * 0.5);
          x = spoutX + (mouthX - spoutX) * easeArch;
        } else {
          // 落入瓶口后微幅自然流体正弦摆动
          x = mouthX + Math.sin(globalS * 7.5 - timeNow * 2.2) * (0.45 * heightFactor);
        }

        // 重力加速导致下端水柱自然收窄 (Bernoulli / 连续性方程 v = sqrt(2gy) -> r ~ y^-0.22)
        const gravityNarrow = 1.0 - 0.28 * Math.pow(globalS, 0.65);
        const mouthTaper = dyFromSpout < 9 ? (0.62 + 0.38 * (dyFromSpout / 9)) : 1.0;
        const surfaceFlare = (globalS > 0.90 && headRatio >= 0.98)
          ? (1.0 + Math.pow((globalS - 0.90) / 0.10, 1.5) * (0.55 + 0.35 * impactEnergy))
          : 1.0;
        const flutter = 1.0 + Math.sin(globalS * 14 - timeNow * 3.4) * 0.045;
        const tailShrink = tailRatio > 0 ? Math.max(0.2, 1 - tailRatio * 0.65) : 1.0;

        const halfW = (3.8 * fluxRadiusBoost * gravityNarrow * mouthTaper * surfaceFlare * flutter * tailShrink);

        leftEdge.push({ x: x - halfW, y, halfW });
        rightEdge.push({ x: x + halfW, y, halfW });
        specCenterCurve.push(`${(x - halfW * 0.22).toFixed(2)},${y.toFixed(2)}`);
      }

      const firstL = leftEdge[0];
      const firstR = rightEdge[0];
      const lastL = leftEdge[leftEdge.length - 1];
      const lastR = rightEdge[rightEdge.length - 1];

      let streamPath = `M ${firstL.x.toFixed(2)},${firstL.y.toFixed(2)} `;
      streamPath += `Q ${((firstL.x + firstR.x) * 0.5).toFixed(2)},${(firstL.y - 1.2).toFixed(2)} ${firstR.x.toFixed(2)},${firstR.y.toFixed(2)} `;
      for (let i = 1; i < rightEdge.length; i++) {
        streamPath += `L ${rightEdge[i].x.toFixed(2)},${rightEdge[i].y.toFixed(2)} `;
      }
      streamPath += `A ${lastL.halfW.toFixed(2)},${(lastL.halfW * 0.45).toFixed(2)} 0 0,1 ${lastL.x.toFixed(2)},${lastL.y.toFixed(2)} `;
      for (let i = leftEdge.length - 2; i >= 0; i--) {
        streamPath += `L ${leftEdge[i].x.toFixed(2)},${leftEdge[i].y.toFixed(2)} `;
      }
      streamPath += 'Z';

      const highlightPath = 'M ' + specCenterCurve.join(' L ');

      // 物理参数 3：Cocos 流体级水面交汇涟漪、抛物线水滴皇冠与水下上浮微泡群
      let impactFoamHTML = '';
      if (headRatio >= 0.96 && tailRatio < 0.92) {
        const cx = mouthX;
        const cy = surfaceY;
        const rScale = scale;
        const maxWallRx = (bottleInnerRx || 31.3) - 3.5;

        // 随倾倒进度平滑淡入淡出
        const lifeEnvelope = Math.sin(Math.min(1, Math.max(0, (pourProgress - 0.08) / 0.84)) * Math.PI);
        const effEnergy = impactEnergy * (0.72 + 0.28 * lifeEnvelope);

        // 当前已注入水深（SVG 坐标单位），决定水下气泡下潜深度
        const poolDepthSvg = Math.max(0, currentTotalLayers * (dstLayerH || 36.2));
        const isShallowBottomHit = (currentTotalLayers < 0.38);

        let ripplesHTML = '';
        let underwaterPlumeHTML = '';
        let crownJetsHTML = '';
        let dropletsHTML = '';

        // (A) 液面同心扩散椭圆波纹 + 中心冲击白沫漩涡环（宽度随冲击动能与水深自适应）
        const numRipples = 3;
        for (let rIdx = 0; rIdx < numRipples; rIdx++) {
          const rPhase = (pourProgress * (3.6 + volumeFactor * 0.8) + rIdx / numRipples) % 1.0;
          const maxRipRx = Math.min(maxWallRx, (14 + effEnergy * 13));
          const curRx = 3.8 + rPhase * maxRipRx;
          const curRy = curRx * 0.24;
          const ripAlpha = (1 - rPhase) * (rIdx === 0 ? 0.82 : 0.58) * Math.min(1, effEnergy * 0.95);
          const strokeCol = (rIdx % 2 === 0) ? '#ffffff' : colObj.topLight;
          const sw = (1.6 - rPhase * 1.1) * (0.85 + 0.25 * effEnergy);
          ripplesHTML += `
            <ellipse cx="0" cy="0.4" rx="${curRx.toFixed(2)}" ry="${curRy.toFixed(2)}"
                     fill="none" stroke="${strokeCol}" stroke-width="${sw.toFixed(2)}"
                     opacity="${ripAlpha.toFixed(2)}" />
          `;
        }

        // 水柱入水点的高光冲击凹窝（取代原先僵硬的半圆盖帽）
        const craterRx = (5.2 + effEnergy * 3.6) * (0.92 + 0.08 * Math.sin(timeNow * 4.5));
        const craterRy = craterRx * 0.28;
        ripplesHTML += `
          <ellipse cx="0" cy="0.3" rx="${craterRx.toFixed(2)}" ry="${craterRy.toFixed(2)}"
                   fill="url(#splashFoamGrad)" opacity="0.92" />
        `;

        // (B) 水下柔光卷吸气团与螺旋上浮微泡群（仅当瓶内已有一定水深时出现，深度随水量与落差变化）
        if (poolDepthSvg > 4.5) {
          const maxPlungeSvg = Math.min(poolDepthSvg * 0.76, (10 + effEnergy * 18));
          const plumeRx = 5.5 + effEnergy * 3.8;
          underwaterPlumeHTML += `
            <ellipse cx="0" cy="${(maxPlungeSvg * 0.42).toFixed(1)}"
                     rx="${plumeRx.toFixed(1)}" ry="${(maxPlungeSvg * 0.48).toFixed(1)}"
                     fill="url(#subPlumeGrad)" opacity="${Math.min(0.65, 0.32 + effEnergy * 0.22).toFixed(2)}" />
          `;

          // 随水量与冲击高度变化的浮力微泡群（大小错落、沿正弦轨迹上浮，绝不对称僵硬）
          const bubbleCount = Math.min(16, Math.round(5 + effEnergy * 6 + moveCount * 1.5));
          for (let b = 0; b < bubbleCount; b++) {
            const seed1 = hash01(b * 19 + 3);
            const seed2 = hash01(b * 37 + 11);
            const seed3 = hash01(b * 53 + 7);
            const bCycle = (pourProgress * (2.4 + seed1 * 2.2) + seed2) % 1.0;

            // bCycle: 0 为刚被水柱卷入水下深处，1 为上浮至液面破裂
            const depthRatio = (1 - Math.pow(bCycle, 0.85));
            const by = 1.8 + depthRatio * maxPlungeSvg * (0.45 + 0.55 * seed3);
            const spreadSign = (b % 2 === 0 ? 1 : -1);
            const horizontalSpread = spreadSign * (1.8 + (1 - depthRatio) * (5.5 + seed1 * 8.5 * Math.min(1.2, effEnergy)))
                                   + Math.sin(bCycle * Math.PI * 3 + b) * 1.6;
            const bx = Math.max(-maxWallRx * 0.82, Math.min(maxWallRx * 0.82, horizontalSpread));
            const br = (0.85 + seed3 * 2.1 * Math.min(1.25, effEnergy)) * Math.sin(bCycle * Math.PI * 0.92 + 0.15);
            const bAlpha = (0.35 + 0.55 * (1 - bCycle)) * Math.min(1, poolDepthSvg / 14);

            underwaterPlumeHTML += `
              <circle cx="${bx.toFixed(2)}" cy="${by.toFixed(2)}" r="${br.toFixed(2)}"
                      fill="${b % 3 === 0 ? '#ffffff' : colObj.topLight}"
                      stroke="#ffffff" stroke-width="0.35"
                      opacity="${bAlpha.toFixed(2)}" />
            `;
          }
        }

        // (C) 动态流体皇冠水舌（不对称纤薄水花瓣，高度与张角随落差高度 heightFactor 动态伸缩）
        const jetCount = isShallowBottomHit ? 6 : 4;
        for (let j = 0; j < jetCount; j++) {
          const jSeed = hash01(j * 29 + 5);
          const jPhase = (pourProgress * (4.2 + j * 0.45) + j * 0.23) % 1.0;
          const jEnvelope = Math.sin(jPhase * Math.PI);
          if (jEnvelope < 0.08) continue;

          const side = (j % 2 === 0) ? 1 : -1;
          const reachRatio = 0.45 + (j >> 1) * 0.32 + jSeed * 0.18;
          const tipX = side * Math.min(maxWallRx * 0.78, (5.5 + effEnergy * 9.5) * reachRatio * (0.35 + 0.65 * jPhase));
          const tipY = -(3.2 + effEnergy * (isShallowBottomHit ? 11.5 : 7.8) * (0.6 + 0.4 * jSeed)) * jEnvelope;
          const baseX = side * (2.2 + j * 0.7);
          const ctrlX = baseX + (tipX - baseX) * 0.55;
          const ctrlY = tipY * 1.15;
          const jAlpha = jEnvelope * (0.62 + 0.28 * Math.min(1, effEnergy));

          crownJetsHTML += `
            <path d="M ${(baseX - side * 1.4).toFixed(1)},0.4
                     Q ${ctrlX.toFixed(1)},${ctrlY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}
                     Q ${(ctrlX + side * 1.5).toFixed(1)},${(ctrlY * 0.72).toFixed(1)} ${(baseX + side * 1.4).toFixed(1)},0.6 Z"
                  fill="${j % 2 === 0 ? colObj.topLight : '#ffffff'}"
                  opacity="${jAlpha.toFixed(2)}" />
          `;
        }

        // (D) Cocos 抛物线物理水珠粒子群（水珠数量、初速度、仰角均随落差高度与水量实时变化，且水珠朝向沿速度切线旋转）
        const dropCount = Math.min(14, Math.round(4 + effEnergy * 6.5 + (isShallowBottomHit ? 3 : 0)));
        const gravityAcc = 42.0;
        for (let d = 0; d < dropCount; d++) {
          const s1 = hash01(d * 41 + 9);
          const s2 = hash01(d * 67 + 15);
          const s3 = hash01(d * 83 + 21);

          // 每个水珠独立的生命周期 [0..1]
          const t = (pourProgress * (3.4 + s1 * 2.2) + d * (1 / dropCount)) % 1.0;
          const side = (d % 2 === 0) ? 1 : -1;

          // 初速度随落差动能 effEnergy 动态放大：高处落向瓶底时水珠飞溅高远，快满瓶时仅贴近水面轻跃
          const vx = side * (6.5 + s1 * 12.5) * Math.min(1.25, 0.55 + effEnergy * 0.58);
          const vy0 = (11.5 + s2 * 15.5) * Math.min(1.35, 0.48 + effEnergy * 0.68);

          const rawX = vx * t;
          const dx = Math.max(-maxWallRx * 0.84, Math.min(maxWallRx * 0.84, rawX));
          const dy = -vy0 * t + 0.5 * gravityAcc * t * t;

          // 仅绘制在液面以上或刚落回液面的水珠
          if (dy > 2.2) continue;

          // 瞬时速度切线角度，用于旋转水滴形使其贴合抛物线轨迹
          const vyInst = -vy0 + gravityAcc * t;
          const velAngleDeg = (Math.atan2(vyInst, vx) * 180) / Math.PI;
          const dropRadius = (1.05 + s3 * 1.25 * Math.min(1.2, effEnergy)) * (1 - t * 0.38);
          const dropAlpha = Math.sin(t * Math.PI) * (0.78 + 0.22 * Math.min(1, effEnergy));
          const stretch = 1.25 + Math.min(0.65, Math.hypot(vx, vyInst) * 0.018);

          dropletsHTML += `
            <g transform="translate(${dx.toFixed(2)}, ${dy.toFixed(2)}) rotate(${velAngleDeg.toFixed(1)}) scale(${stretch.toFixed(2)}, 1)"
               opacity="${dropAlpha.toFixed(2)}">
              <path d="M ${(-dropRadius * 1.45).toFixed(2)},0
                       Q 0,${(-dropRadius * 1.05).toFixed(2)} ${dropRadius.toFixed(2)},0
                       Q 0,${(dropRadius * 1.05).toFixed(2)} ${(-dropRadius * 1.45).toFixed(2)},0 Z"
                    fill="${d % 3 === 0 ? '#ffffff' : colObj.topLight}" />
              <circle cx="${(dropRadius * 0.22).toFixed(2)}" cy="${(-dropRadius * 0.22).toFixed(2)}"
                      r="${(dropRadius * 0.35).toFixed(2)}" fill="#ffffff" />
            </g>
          `;
        }

        impactFoamHTML = `
          <defs>
            <radialGradient id="splashFoamGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
              <stop offset="55%" stop-color="${colObj.topLight}" stop-opacity="0.78" />
              <stop offset="100%" stop-color="${colObj.topMid}" stop-opacity="0" />
            </radialGradient>
            <radialGradient id="subPlumeGrad" cx="50%" cy="15%" r="80%">
              <stop offset="0%" stop-color="#ffffff" stop-opacity="0.72" />
              <stop offset="50%" stop-color="${colObj.topLight}" stop-opacity="0.45" />
              <stop offset="100%" stop-color="${colObj.mid}" stop-opacity="0" />
            </radialGradient>
          </defs>
          <g transform="translate(${cx.toFixed(2)}, ${cy.toFixed(2)}) scale(${rScale.toFixed(3)})">
            ${underwaterPlumeHTML}
            ${ripplesHTML}
            ${crownJetsHTML}
            ${dropletsHTML}
          </g>
        `;
      }

      return `
        <defs>
          <linearGradient id="liveStreamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${colObj.left}" />
            <stop offset="28%" stop-color="${colObj.mid}" />
            <stop offset="68%" stop-color="${colObj.topLight}" />
            <stop offset="100%" stop-color="${colObj.right}" />
          </linearGradient>
        </defs>
        <path d="${streamPath}" fill="url(#liveStreamGrad)" />
        <path d="${highlightPath}" fill="none" stroke="rgba(255, 255, 255, 0.55)" stroke-width="${(1.15 * fluxRadiusBoost).toFixed(2)}" stroke-linecap="round" />
        ${impactFoamHTML}
        <path d="M ${sx(31.4)},${sy(9.2)}
                 C ${sx(29.8)},${sy(13.5)} ${sx(31.0)},${sy(18.2)} ${sx(36.2)},${sy(20.6)}
                 A ${(14.2 * scale).toFixed(2)},${(3.3 * scale).toFixed(2)} 0 0,0 ${sx(63.8)},${sy(20.6)}
                 C ${sx(69.0)},${sy(18.2)} ${sx(70.2)},${sy(13.5)} ${sx(68.6)},${sy(9.2)}
                 A ${(18.6 * scale).toFixed(2)},${(3.8 * scale).toFixed(2)} 0 0,0 ${sx(31.4)},${sy(9.2)} Z"
              fill="url(#neckLipGrad)" opacity="0.45"
              stroke="rgba(255, 255, 255, 0.55)" stroke-width="${(1.0 * scale).toFixed(2)}" />
        <path d="M ${sx(32.0)},${sy(9.6)} A ${(18.1 * scale).toFixed(2)},${(3.5 * scale).toFixed(2)} 0 0,0 ${sx(68.0)},${sy(9.6)}"
              fill="none" stroke="rgba(255, 255, 255, 0.72)" stroke-width="${(1.2 * scale).toFixed(2)}" />
      `;
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
        const movesCounterPill = document.getElementById('moves-counter-pill');
        const movesLeftNum = document.getElementById('moves-left-num');
        if (movesLeftNum) movesLeftNum.textContent = remainingMoves;
        if (movesCounterPill) {
          movesCounterPill.classList.toggle('alarm-danger', remainingMoves <= 5);
        }
        const bigNumEl = document.getElementById('zen-header-big-num');
        const pillTitleEl = document.getElementById('level-pill-title');
        if (bigNumEl) {
          bigNumEl.classList.toggle('danger-low', remainingMoves <= 5);
        }
        if (pillTitleEl) {
          pillTitleEl.textContent = `剩余步数 ${remainingMoves}`;
        }
        if (typeof triggerTopNumberStepEffect === 'function') {
          triggerTopNumberStepEffect('-1');
        }
        if (remainingMoves === 3 || remainingMoves === 1) {
          triggerHaptic(25);
        }
      }

      const gridEl = document.getElementById('bottles-grid');
      const srcEl = gridEl.children[srcIdx];
      const dstEl = gridEl.children[dstIdx];
      const srcSvgEl = srcEl ? (srcEl.querySelector('.bottle-svg') || srcEl) : null;

      if (srcEl) {
        srcEl.classList.remove('selected', 'settling', 'level-enter-anim', 'hint-source-slot', 'hint-target-slot');
        srcEl.classList.add('pouring-source');
      }
      if (dstEl) {
        dstEl.classList.remove('selected', 'settling', 'level-enter-anim', 'hint-source-slot', 'hint-target-slot');
        dstEl.classList.add('pouring-target');
      }

      const srcRect = srcEl.getBoundingClientRect();
      const dstRect = dstEl.getBoundingClientRect();
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

      const shellEl = document.querySelector('.app-shell');
      const shellRect = shellEl ? shellEl.getBoundingClientRect() : { left: 0, right: window.innerWidth || 412 };
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
        if (dstEl) dstEl.classList.remove('pouring-target');

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
            showToast('⏳ 星砂耗尽！该瓶已被寒冰封印 3 回合（可点【+空瓶】立即破除）！');
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

          if (typeof emitBonusStarsFromScreen === 'function') {
            emitBonusStarsFromScreen(dstRect, pourColorKey, 7);
          }
          renderAll();

          const hasBagMode = !!cfg.hasBags;
          const corkStart = performance.now();
          const corkDur = (hasBagMode ? 340 : 480) / getSpeedMultiplier();
          let slamSoundPlayed = false;

          function stepCorkAnim(tNow) {
            if (mySessionId !== gameSessionId) return;
            const cp = Math.min(1, (tNow - corkStart) / corkDur);
            dstBottle.corkAnimProgress = cp;

            if (cp >= 0.18 && !slamSoundPlayed) {
              slamSoundPlayed = true;
              playSound('cork_slam');
            }

            if (cp < 1) {
              requestAnimationFrame(stepCorkAnim);
            } else {
              dstBottle.corkAnimProgress = 1.0;
              dstBottle._corking = false;
              if (hasBagMode) {
                const matchedBagIdx = findMatchingOpenBagIndex(pourColorKey);
                if (matchedBagIdx !== -1) {
                  packCompletedBottleIntoBag(dstIdx, pourColorKey, matchedBagIdx);
                } else {
                  renderAll();
                  showToast(`🍾 【${COLORS[pourColorKey].name}】已装满！出现同色礼袋时将自动装入！`);
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
          if (srcEl) srcEl.classList.remove('pouring-source');
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
            document.getElementById('out-of-moves-modal-mask')?.classList.add('show');
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

      const gridEl = document.getElementById('bottles-grid');
      const bagsEl = document.getElementById('bags-stage');
      const bottleEl = gridEl ? gridEl.children[bottleIdx] : null;
      const bagEl = bagsEl ? bagsEl.children[targetBagIdx] : null;

      if (!bagEl || !bottleEl) {
        completedBottle.layers = [];
        completedBottle.corked = false;
        completedBottle.removed = true;
        completedBottle._flyingToBag = false;
        bags[targetBagIdx]._busy = false;
        const unveiledList = unlockBagOrderObstacles();
        renderAll();
        unveiledList.forEach(u => triggerBottleVFX(u.bIdx, u.vfxType, u.opts));
        if (wasGiantCat || isBagLevelAllCleared()) {
          showWinModal(wasGiantCat);
        } else {
          checkAndPackWaitingCorkedBottles();
        }
        return;
      }

      const bRect = bottleEl.getBoundingClientRect();
      const bagRect = bagEl.getBoundingClientRect();
      const startX = bRect.left + bRect.width * 0.5;
      const startY = bRect.top + bRect.height * 0.5;

      const mouthX = bagRect.left + bagRect.width * 0.46;
      const hoverAboveMouthY = bagRect.top - bagRect.height * 0.06;
      const bagMouthRimY = bagRect.top + bagRect.height * 0.21;
      const insideBagTargetY = bagRect.top + bagRect.height * 0.58;

      const mySessionId = gameSessionId;
      const spdMult = getSpeedMultiplier();
      const flyDur = 210 / spdMult;
      const dropInDur = 125 / spdMult;
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

      function stepFlyToBag(now) {
        if (mySessionId !== gameSessionId) {
          delete window._activeCanvasFlyBags[bottleIdx];
          return;
        }
        const elapsed = now - flyStart;
        if (elapsed < flyDur) {
          const t = elapsed / flyDur;
          const ease = 1 - Math.pow(1 - t, 2.6);
          const ctrlX = (startX + mouthX) * 0.5;
          const ctrlY = Math.min(startY, hoverAboveMouthY) - 64;

          const mt = 1 - ease;
          const curX = mt * mt * startX + 2 * mt * ease * ctrlX + ease * ease * mouthX;
          const curY = mt * mt * startY + 2 * mt * ease * ctrlY + ease * ease * hoverAboveMouthY;
          const curScale = 1 - 0.58 * ease;
          const curRot = Math.sin(t * Math.PI) * (mouthX >= startX ? 14 : -14) * (1 - t * 0.4);

          const tx = curX - startX;
          const ty = curY - startY;
          window._activeCanvasFlyBags[bottleIdx] = {
            active: true, phase: 1, bottleIdx, targetBagIdx, colorKey,
            tx, ty, curRot, curScale, clipBottomY: null,
            mouthX, bagMouthRimY, bagW: bagRect.width, t
          };
          window._canvasFlyBagState = window._activeCanvasFlyBags[bottleIdx];
          requestAnimationFrame(stepFlyToBag);

        } else if (elapsed < flyDur + dropInDur) {
          const t2 = (elapsed - flyDur) / dropInDur;
          const ease2 = t2 * (2 - t2);
          const curX = mouthX;
          const curY = hoverAboveMouthY + (insideBagTargetY - hoverAboveMouthY) * ease2;
          const curScale = 0.42 - 0.05 * ease2;
          const tx = curX - startX;
          const ty = curY - startY;

          window._activeCanvasFlyBags[bottleIdx] = {
            active: true, phase: 2, bottleIdx, targetBagIdx, colorKey,
            tx, ty, curRot: 0, curScale, clipBottomY: bagMouthRimY,
            mouthX, bagMouthRimY, bagW: bagRect.width, t2
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
            duration: 165 / spdMult,
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
                  duration: 190 / spdMult
                };
                playSound('bag_drop');
              } else if (window._canvasBagAnimMap) {
                delete window._canvasBagAnimMap[targetBagIdx];
              }

              // 新购物袋就位瞬间即可立即触发等待中的满瓶飞入，无需再等下落动画结束！
              checkAndPackWaitingCorkedBottles();

              setTimeout(() => {
                if (mySessionId !== gameSessionId) return;
                if (window._canvasBagAnimMap) delete window._canvasBagAnimMap[targetBagIdx];
                renderAll();
                checkAndPackWaitingCorkedBottles();
              }, 190 / spdMult);
            }, 240 / spdMult);
          }, 150 / spdMult);
        }
      }

      requestAnimationFrame(stepFlyToBag);
    }

    // ==========================================
    // 11. 全部参考图休闲弹窗 & 底部圆章按钮交互绑定
    // ==========================================
    function updatePauseSwitchUI() {
      const map = [
        ['toggle-sound', userSettings.sound],
        ['toggle-vibrate', userSettings.vibrate],
        ['toggle-music', userSettings.music],
        ['toggle-zoom', userSettings.zoom]
      ];
      map.forEach(([id, val]) => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('on', !!val);
      });
    }

    const pauseModalMask = document.getElementById('pause-modal-mask');
    document.getElementById('settings-btn').addEventListener('click', () => {
      updatePauseSwitchUI();
      pauseModalMask.classList.add('show');
      playSound('modal_open');
    });
    document.getElementById('pause-close-btn').addEventListener('click', () => {
      pauseModalMask.classList.remove('show');
      playSound('modal_close');
    });
    document.getElementById('pause-resume-btn').addEventListener('click', () => {
      pauseModalMask.classList.remove('show');
      playSound('modal_close');
    });
    document.getElementById('pause-restart-btn').addEventListener('click', () => {
      pauseModalMask.classList.remove('show');
      playSound('btn_restart');
      initGame();
      showToast('🔄 当前关卡已重新开始');
    });
    document.getElementById('pause-skip-btn').addEventListener('click', () => {
      pauseModalMask.classList.remove('show');
      playSound('ui_tap');
      currentLevelId = (currentLevelId % 200) + 1;
      initGame();
      showToast(`⏭️ 已跳过并进入：关卡 ${currentLevelId}`);
    });
    document.getElementById('pause-home-btn').addEventListener('click', () => {
      pauseModalMask.classList.remove('show');
      openLevelSelector();
    });

    document.getElementById('toggle-sound').addEventListener('click', () => {
      userSettings.sound = !userSettings.sound;
      updatePauseSwitchUI();
      if (userSettings.sound) playSound('toggle_on');
      showToast(userSettings.sound ? '🔊 声音已开启' : '🔇 声音已关闭');
    });
    document.getElementById('toggle-vibrate').addEventListener('click', () => {
      userSettings.vibrate = !userSettings.vibrate;
      updatePauseSwitchUI();
      playSound(userSettings.vibrate ? 'toggle_on' : 'toggle_off');
      showToast(userSettings.vibrate ? '📳 震动反馈已开启' : '📴 震动反馈已关闭');
    });
    document.getElementById('toggle-music').addEventListener('click', () => {
      userSettings.music = !userSettings.music;
      updatePauseSwitchUI();
      playSound(userSettings.music ? 'toggle_on' : 'toggle_off');
      showToast(userSettings.music ? '🎵 背景音乐已开启' : '🎵 背景音乐已静音');
    });
    document.getElementById('toggle-zoom').addEventListener('click', () => {
      userSettings.zoom = !userSettings.zoom;
      updatePauseSwitchUI();
      renderAll();
      playSound(userSettings.zoom ? 'toggle_on' : 'toggle_off');
      showToast(userSettings.zoom ? '🔍 舞台微缩模式已开启' : '🔍 舞台标准比例已恢复');
    });

    // 速度x2 快捷悬浮按钮
    document.getElementById('speed-x2-btn').addEventListener('click', () => {
      isSpeed2x = !isSpeed2x;
      renderAll();
      playSound(isSpeed2x ? 'toggle_on' : 'toggle_off');
      showToast(isSpeed2x ? '⚡ 已开启 2倍极速倒水模式！' : '⚡ 已恢复标准倒水速度');
    });

    // 速度升级弹窗（对应参考图1）
    const speedModalMask = document.getElementById('speed-modal-mask');
    function updateSpeedModalUI() {
      const lv = speedLevel || 0;
      const pts = speedPoints || 10;
      const pct = Math.min(100, (lv % 5) * 25);
      document.getElementById('speed-lv-num').textContent = lv;
      document.getElementById('speed-pts-num').textContent = pts;
      document.getElementById('speed-prog-fill').style.width = `${pct}%`;
      document.getElementById('speed-prog-txt').textContent = `升级进度: ${pct}%`;
    }
    document.getElementById('upgrade-open-btn').addEventListener('click', () => {
      if (isAnimating) return;
      pauseModalMask.classList.remove('show');
      updateSpeedModalUI();
      speedModalMask.classList.add('show');
      playSound('select');
    });
    document.getElementById('speed-close-btn').addEventListener('click', () => {
      speedModalMask.classList.remove('show');
      playSound('select');
    });
    document.getElementById('speed-upgrade-confirm-btn').addEventListener('click', () => {
      speedLevel = (speedLevel || 0) + 1;
      speedPoints = 10 + speedLevel;
      updateSpeedModalUI();
      playSound('pack');
      showToast(`⚡ 速度升级成功！当前速度：${speedPoints} 点`);
      setTimeout(() => speedModalMask.classList.remove('show'), 360);
    });

    // 商店弹窗（对应参考图2）
    const shopModalMask = document.getElementById('shop-modal-mask');
    document.getElementById('shop-open-btn').addEventListener('click', () => {
      if (isAnimating) return;
      pauseModalMask.classList.remove('show');
      renderShopItems();
      shopModalMask.classList.add('show');
      playSound('select');
    });
    document.getElementById('shop-close-btn').addEventListener('click', () => {
      shopModalMask.classList.remove('show');
      playSound('select');
    });
    document.getElementById('shop-open-levels-btn').addEventListener('click', () => {
      shopModalMask.classList.remove('show');
      openLevelSelector();
    });

    // 问题 2：点击底部【提示】按钮不弹出弹窗，而是直接在盘面上高亮指示「动哪个瓶子往哪个瓶子倒」
    const refreshModalMask = document.getElementById('refresh-modal-mask');

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

    document.getElementById('dock-restart-btn')?.addEventListener('click', () => {
      if (isAnimating) return;
      initGame();
      playSound('btn_restart');
      showToast('🔄 当前关卡已重新开始');
    });

    document.getElementById('hint-btn')?.addEventListener('click', () => {
      if (isAnimating) return;
      executeSmartHint();
    });

    document.getElementById('shuffle-btn')?.addEventListener('click', () => {
      if (isAnimating) return;
      executeShuffleRemainingLiquid();
    });

    document.getElementById('refresh-close-btn')?.addEventListener('click', () => {
      refreshModalMask?.classList.remove('show');
      playSound('select');
    });

    document.getElementById('refresh-confirm-btn')?.addEventListener('click', () => {
      refreshModalMask?.classList.remove('show');
      shuffleUses = 3;
      executeShuffleRemainingLiquid();
    });

    // 200关选关面板
    const levelModalMask = document.getElementById('level-modal-mask');
    document.querySelectorAll('.chapter-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentChapterTab = Number(btn.dataset.ch) || 0;
        renderLevelModalCards();
        playSound('select');
      });
    });

    function openLevelSelector() {
      currentChapterTab = Math.floor((currentLevelId - 1) / 40);
      renderLevelModalCards();
      levelModalMask.classList.add('show');
      playSound('modal_open');
    }

    document.getElementById('level-pill-title').addEventListener('click', openLevelSelector);
    document.getElementById('top-center-level-trigger')?.addEventListener('click', openLevelSelector);
    function syncHandbookModalContent(hIdx) {
      const total = HANDBOOK_KEYS.length;
      window._handbookIdx = ((hIdx % total) + total) % total;
      const key = HANDBOOK_KEYS[window._handbookIdx] || 'basic_rule';
      const info = MECHANIC_INTROS[key] || MECHANIC_INTROS.basic_rule;
      const titleEl = document.getElementById('mech-title');
      const descEl = document.getElementById('mech-desc');
      if (titleEl) titleEl.textContent = info.title || '机关图鉴';
      if (descEl) descEl.innerHTML = info.desc || '';
    }

    document.getElementById('rules-help-btn')?.addEventListener('click', () => {
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
      document.getElementById('mechanic-modal-mask')?.classList.add('show');
      playSound('modal_open');
    });
    document.getElementById('level-select-btn')?.addEventListener('click', openLevelSelector);
    document.getElementById('level-modal-close-btn').addEventListener('click', () => {
      levelModalMask.classList.remove('show');
      playSound('modal_close');
    });

    const mechModalMaskEl = document.getElementById('mechanic-modal-mask');
    if (mechModalMaskEl) {
      mechModalMaskEl.addEventListener('click', () => {
        mechModalMaskEl.classList.remove('show');
        playSound('modal_close');
      });
    }

    // 星晷步数耗尽救援弹窗事件绑定（规范 5）
    const oomModalMask = document.getElementById('out-of-moves-modal-mask');
    document.getElementById('oom-close-x-btn')?.addEventListener('click', () => {
      oomModalMask?.classList.remove('show');
      playSound('select');
    });
    document.getElementById('oom-add-moves-btn')?.addEventListener('click', () => {
      oomModalMask?.classList.remove('show');
      if (remainingMoves !== null) remainingMoves += 5;
      playSound('pack');
      renderAll();
      showToast('🎬 激励视频奖励：已为您免费续 +5 步星晷步数！');
    });
    document.getElementById('oom-restart-btn')?.addEventListener('click', () => {
      oomModalMask?.classList.remove('show');
      initGame();
      showToast('🔄 当前试炼已重新开始');
    });

    // 底部【+空瓶】按钮：功能恒定单一（始终对应解锁或增加 +1 个 4 层琉璃空瓶，并在按钮下方实时预告本次效果！）
    function getAddBottlePreviewText() {
      if (addBottleUses <= 0) return '免费补+2次';
      const hasCam = bottles.some(b => b && !b.removed && (b.special === 'ad_cam' || b.special === 'ad_cam_blue'));
      if (hasCam) return '解锁空瓶';
      const hasRemoved = bottles.some(b => b && b.removed);
      if (hasRemoved || bottles.length < 12) return '+1空瓶';
      return '盘面已满';
    }

    document.getElementById('add-bottle-btn')?.addEventListener('click', () => {
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
    });

    function canSelectBottleNoToast(b) {
      return b && !isBottleBusy(b) && !b.removed && !b.corked && !b.isGiantCat && !(b.frozenTurns > 0) && ['none', 'one_way_out', 'color_lock'].includes(b.special) && b.layers.length > 0 && !isCompleteBottle(b);
    }

    document.getElementById('undo-btn').addEventListener('click', () => {
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
      const undoBadge = document.getElementById('undo-count-badge');
      if (undoBadge) {
        undoBadge.classList.remove('badge-bump');
        void undoBadge.offsetWidth;
        undoBadge.classList.add('badge-bump');
      }
      const gridEl = document.getElementById('bottles-grid');
      if (gridEl) {
        Array.from(gridEl.children).forEach((slotEl, idx) => {
          const b = bottles[idx];
          if (b && !b.removed) {
            slotEl.classList.remove('level-enter-anim', 'undo-rewind-anim');
            slotEl.style.animationDelay = `${(idx % 6) * 18}ms`;
            slotEl.classList.add('undo-rewind-anim');
            setTimeout(() => {
              slotEl.classList.remove('undo-rewind-anim');
              slotEl.style.animationDelay = '';
            }, 420);
          }
        });
      }
      startLevelEntranceSlosh();
    });

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

    document.getElementById('quick-unlock-btn')?.addEventListener('click', () => {
      pauseModalMask?.classList.remove('show');
      unlockAllSpecials();
    });

    const modalMask = document.getElementById('modal-mask');
    document.getElementById('win-close-x-btn').addEventListener('click', () => {
      modalMask.classList.remove('show');
      playSound('modal_close');
    });
    document.getElementById('modal-restart-btn')?.addEventListener('click', () => {
      playSound('btn_restart');
      initGame();
      modalMask.classList.remove('show');
      showToast('🔄 已重新开始本关');
    });
    document.getElementById('modal-next-btn').addEventListener('click', () => {
      playSound('ui_tap');
      currentLevelId = (currentLevelId % 200) + 1;
      initGame();
      modalMask.classList.remove('show');
      showToast(`✨ 已开启：关卡 ${currentLevelId}`);
    });
    function showWinModal(wasGiantCat) {
      streakWins = (streakWins % 2) + 1;
      const streakEl = document.getElementById('streak-chest-prog');
      if (streakEl) streakEl.textContent = `${streakWins}/2`;
      const cfg = getLevelConfig(currentLevelId);
      const userSteps = Math.max(1, pourCountTotal);
      const optSteps = cfg.optimalMoves || 17;
      const diff = Math.max(0, userSteps - optSteps);

      const badgePill = document.getElementById('modal-badge-pill');
      if (badgePill) badgePill.textContent = wasGiantCat ? '灵猫关通关' : '过关成功';

      document.getElementById('score-user-moves').textContent = `${userSteps} 步`;
      document.getElementById('score-opt-moves').textContent = `${optSteps} 步`;
      document.getElementById('score-diff-moves').textContent = `+${diff}`;

      let praise = '✨ 步数控制非常出色！';
      if (diff === 0) praise = '🏆 完美达成理论最少步数！';
      else if (diff > 6) praise = '🎉 顺利通关，手感越来越好了！';
      document.getElementById('score-praise-line').textContent = praise;

      modalMask.classList.add('show');
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
      const totalLiquidLayers = bottles.reduce((acc, b) => acc + (b && b.layers ? b.layers.length : 0), 0);
      levelTargetTotalBottles = cfg.isCatBossLevel ? 8 : Math.max(1, Math.round(totalLiquidLayers / 4));
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
      if (cfg.hasBags) reconcileActiveBagsWithBottles();
      isLevelEntering = true;
      renderAll();
      startLevelEntranceSlosh();
      setTimeout(() => {
        isLevelEntering = false;
        document.querySelectorAll('.bottle-slot.level-enter-anim').forEach(el => {
          el.classList.remove('level-enter-anim');
          el.style.animationDelay = '';
        });
      }, 650);
      checkAndShowMechanicIntro();
    }


    // ==========================================
    // 12. 2D 动态金色星光流、顶部大数字文字特效与通关礼花庆典引擎
    // ==========================================
    const bgStarCanvas = document.getElementById('bg-star-canvas');
    const bgStarCtx = bgStarCanvas ? bgStarCanvas.getContext('2d') : null;

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

    function resizeBgStarCanvas() {
      if (!bgStarCanvas) return;
      bgStarCanvas.width = window.innerWidth || 412;
      bgStarCanvas.height = window.innerHeight || 860;
    }
    window.addEventListener('resize', resizeBgStarCanvas);
    resizeBgStarCanvas();

    // 预烘焙 64x64 发光金星精灵图（避免每帧在循环中重复调用 createRadialGradient）
    let _glowStarSprite = null;
    function getGlowStarSprite() {
      if (_glowStarSprite) return _glowStarSprite;
      try {
        const sp = document.createElement('canvas');
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
      } catch (e) {}
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
          const bagStage = document.getElementById('bags-stage');
          const bagEl = bagStage && bagStage.children[matchIdx];
          if (bagEl) targetBagRect = bagEl.getBoundingClientRect();
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

    initGlobalBottleDefs();
    initGame();

    // ============================================================================
    // 13. 纯原生 Canvas 2D 极速渲染与触控引擎 (0 DOM重排 / 0 正则解析 / 离屏缓存加速)
    //     100% 还原原图暖金琥珀玻璃按钮、3D粗麻布底座、琉璃水瓶与全部特殊机关图标
    // ============================================================================
    (function initPureCanvas2DEngine() {
      const canvas = document.getElementById('pure-game-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });

      window.MiniGameAdapter = {
        platform: typeof wx !== 'undefined' ? 'wechat' : (typeof tt !== 'undefined' ? 'douyin' : 'web_taptap'),
        getMainCanvas: () => canvas,
        createOffscreen: (w, h) => {
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(w));
          c.height = Math.max(1, Math.round(h));
          return c;
        }
      };

      let dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      let viewW = window.innerWidth || 412;
      let viewH = window.innerHeight || 860;
      window._layoutDirty = true;
      let bgOffscreenDirty = true;
      let lastRenderedThemeId = null;

      function syncCanvasSize() {
        const newDpr = Math.min(window.devicePixelRatio || 1, 2.5);
        const newW = window.innerWidth || 412;
        const newH = window.innerHeight || 860;
        if (newW !== viewW || newH !== viewH || newDpr !== dpr || canvas.width !== Math.round(newW * newDpr)) {
          dpr = newDpr;
          viewW = newW;
          viewH = newH;
          canvas.width = Math.round(viewW * dpr);
          canvas.height = Math.round(viewH * dpr);
          bgOffscreenDirty = true;
          window._layoutDirty = true;
        }
      }
      window.addEventListener('resize', () => { syncCanvasSize(); window._layoutDirty = true; });
      syncCanvasSize();

      // ---------------- 1. 静态主题背景离屏缓存（仅在切主题或窗口缩放时重绘一次！） ----------------
      const bgOffscreen = document.createElement('canvas');
      const bgOffCtx = bgOffscreen.getContext('2d');
      bgOffscreenDirty = true;
      lastRenderedThemeId = null;

      function getThemeBackgroundCanvas(w, h) {
        const theme = activeThemeId || 'zen_amber';
        if (!bgOffscreenDirty && lastRenderedThemeId === theme && bgOffscreen.width === Math.round(w * dpr)) {
          return bgOffscreen;
        }
        bgOffscreenDirty = false;
        lastRenderedThemeId = theme;
        bgOffscreen.width = Math.round(w * dpr);
        bgOffscreen.height = Math.round(h * dpr);
        const bCtx = bgOffCtx;
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
        const off = document.createElement('canvas');
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
            [50,13,50,20], [33,17.5,36.8,23.5], [67,17.5,63.2,23.5],
            [21,29,27,32.5], [79,29,73,32.5], [17,44.5,24,44.5],
            [83,44.5,76,44.5], [22,59.5,28,56], [78,59.5,72,56]
          ];
          c.beginPath();
          rays.forEach(([x1,y1,x2,y2]) => { c.moveTo(x1,y1); c.lineTo(x2,y2); });
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
        const pCan = document.createElement('canvas');
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
        const off = document.createElement('canvas');
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

      // ---------------- 4. 修正版 SVG 贴图烘焙器（强制保留 fill="none" 与像素宽高，确保所有 SVG 图标 100% 显示！） ----------------
      const svgTexCache = new Map();
      let sharedDefsMarkup = null;

      function getSharedDefsMarkup() {
        if (sharedDefsMarkup !== null) return sharedDefsMarkup;
        const bDefs = document.getElementById('global-bottle-defs');
        const uDefs = document.getElementById('global-ui-3d-defs');
        if (bDefs && uDefs && bDefs.innerHTML.trim().length > 0) {
          sharedDefsMarkup = `<defs>${bDefs.innerHTML}${uDefs.innerHTML}</defs>`;
          return sharedDefsMarkup;
        }
        return '';
      }

      function getSvgSprite(cacheKey, rawSvgMarkup, vbStr = '0 0 100 100', pixelW = 240, pixelH = 240) {
        if (svgTexCache.has(cacheKey)) return svgTexCache.get(cacheKey);
        const defs = getSharedDefsMarkup();
        let inner = rawSvgMarkup.trim();
        let rootAttrs = '';

        // 关键修复：若传入的是完整 <svg ...>...</svg>，提取其 root 属性（如 fill="none" stroke="..."）并强制覆写为明确的像素 width/height！
        if (inner.startsWith('<svg')) {
          const openEnd = inner.indexOf('>');
          const closeStart = inner.lastIndexOf('</svg>');
          if (openEnd !== -1 && closeStart !== -1) {
            const tagHeader = inner.slice(4, openEnd);
            const fillAttr = tagHeader.match(/fill="[^"]*"/);
            const strokeAttr = tagHeader.match(/stroke="[^"]*"/);
            const swAttr = tagHeader.match(/stroke-width="[^"]*"/);
            const lcAttr = tagHeader.match(/stroke-linecap="[^"]*"/);
            const ljAttr = tagHeader.match(/stroke-linejoin="[^"]*"/);
            const vbAttr = tagHeader.match(/viewBox="([^"]*)"/);
            if (vbAttr) vbStr = vbAttr[1];
            rootAttrs = [fillAttr, strokeAttr, swAttr, lcAttr, ljAttr].filter(Boolean).map(m => m[0]).join(' ');
            inner = inner.slice(openEnd + 1, closeStart);
          }
        }

        const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbStr}" width="${Math.round(pixelW)}" height="${Math.round(pixelH)}" ${rootAttrs}>${defs}${inner}</svg>`;
        const img = new Image();
        const entry = { img, ready: false };
        img.onload = () => { entry.ready = true; };
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(fullSvg);
        if (img.complete && img.naturalWidth > 0) entry.ready = true;
        svgTexCache.set(cacheKey, entry);
        return entry;
      }

      // 4A. 100% 原生 Canvas 2D 3D 礼盒袋离屏烘焙器（含彩色礼袋、袋内已装小瓶、金星徽章、锁定袋摄像机图标，0 异步延迟！）
      const nativeBagCache = new Map();
      function getNativeBagCanvas(bag, bagIdx) {
        if (!bag || bag.removed) return null;
        const key = bag.locked ? 'native_bag_locked' : `native_bag_${bag.color || 'green'}_pk_${bag.packedBottle || 'none'}`;
        if (nativeBagCache.has(key)) return nativeBagCache.get(key);

        const W = 200, H = 295;
        const off = document.createElement('canvas');
        off.width = W; off.height = H;
        const c = off.getContext('2d');
        c.save();
        // 严格映射 SVG viewBox="13 1 80 118" -> 200x295
        c.scale(W / 80, H / 118);
        c.translate(-13, -1);

        const fillPoly = (pts, fillStyle, strokeStyle, lw) => {
          c.beginPath();
          for (let i = 0; i < pts.length; i += 2) {
            if (i === 0) c.moveTo(pts[i], pts[i+1]);
            else c.lineTo(pts[i], pts[i+1]);
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
          fillPoly([14,27, 78,27, 92,20, 28,20], '#525a6b', '#aeb7c6', 0.6);
          fillPoly([14,27, 78,27, 78,118, 14,113], '#d5dce6', 'rgba(120,132,150,0.35)', 0.6);
          fillPoly([78,27, 92,20, 92,109, 78,118], '#a5aeba');
          fillPoly([85,23.5, 92,20, 92,109, 85,113.5], '#919aa8');
          fillPoly([14,96, 78,100, 78,118, 14,113], '#8b94a3');
          fillPoly([78,100, 92,92, 92,109, 78,118], '#6d7585');

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
          fillPoly([23,6, 33,1, 33,18, 23,13], '#ffffff', '#64748b', 1);
          fillPoly([9,5, 9,14, 17,9.5], '#43586e');
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
          fillPoly([14,27, 78,27, 92,20, 28,20], '#7c8596', '#cdd5e2', 0.6);
          fillPoly([17,26.5, 76,26.5, 88,21, 29,21], '#525b6c');

          // 4. 3D 象牙白高定礼袋主袋体（正面 + 右侧立体风琴折面 + 内折痕线）
          const frontGrad = c.createLinearGradient(14, 27, 78, 118);
          frontGrad.addColorStop(0, '#ffffff');
          frontGrad.addColorStop(0.7, '#f8fafc');
          frontGrad.addColorStop(1, '#eef2f7');
          fillPoly([14,27, 78,27, 78,118, 14,113], frontGrad, 'rgba(148, 163, 184, 0.38)', 0.6);
          fillPoly([78,27, 92,20, 92,109, 78,118], '#d9dde4');
          fillPoly([85,23.5, 92,20, 92,109, 85,113.5], '#b4bcc8');
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
          fillPoly([54.5,45.2, 64.8,45.2, 64.8,94.7, 54.5,94.7], 'rgba(115, 125, 142, 0.35)');

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
          fillPoly([27.2,45.2, 47.5,45.2, 27.2,84.5], 'rgba(255, 255, 255, 0.38)');

          // 8. 礼袋底部主题色加强围边（正面 + 右侧折面 + 折角阴影）
          fillPoly([14,95.5, 78,99.5, 78,118, 14,113], col.bagMain);
          fillPoly([78,99.5, 92,91.5, 92,109, 78,118], col.bagDark);
          fillPoly([78,118, 92,109, 85,101.5], 'rgba(0, 0, 0, 0.22)');

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
          [[9,57,20,60],[7,64,19,64],[10,71,20,68],[91,57,80,60],[93,64,81,64],[90,71,80,68]].forEach(([x1,y1,x2,y2]) => {
            ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
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
          [[-11,-14,-6,-14,-9,-7.5,-14,-7.5], [-1,-14,4,-14,1,-7.5,-4,-7.5], [9,-14,14,-14,11,-7.5,6,-7.5]].forEach(p => {
            ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(p[2],p[3]); ctx.lineTo(p[4],p[5]); ctx.lineTo(p[6],p[7]); ctx.closePath(); ctx.fill();
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
          const jagLine = `M 5,${burnY+j1} L 20,${burnY-6-j2} L 36,${burnY+4+j1} L 50,${burnY-7+j2} L 66,${burnY+5-j1} L 80,${burnY-5+j2} L 95,${burnY+j1}`;
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
          const topTiltY = sloshAmplitude * 7.2 * sloshSin;
          const waveCrest = sloshAmplitude * 4.2 * sloshCos;
          const ryDynamic = ry + sloshAmplitude * 1.8 * sloshCos;

          // 倒序或正序绘制每层实心圆柱体：下层先画，上层自带向下弯曲的前壁底弧 (A rx,ry 0 0,1) 自然严丝合缝盖住下层顶部，100% 实心无重影！
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

            const yTL = yTop - curTiltY, yTR = yTop + curTiltY;
            const yBL = yBotDraw - prevTiltY, yBR = yBotDraw + prevTiltY;

            const colInfo = COLORS[g.colorKey] || COLORS.blue;
            // 为保证下层与上层交界处无任何缝隙，非顶层向上微延 1.5px 由上层弧形底沿自然遮盖
            const yTLFill = isTopGroup ? yTL : (yTL - 1.5);
            const yTRFill = isTopGroup ? yTR : (yTR - 1.5);
            const layerPath = (sloshAmplitude > 0.01 && isTopGroup)
              ? new Path2D(`M ${leftX},${yTLFill} C ${50 - rx * 0.45},${yTop - curTiltY * 0.3 + curWave} ${50 + rx * 0.45},${yTop + curTiltY * 0.3 - curWave} ${rightX},${yTRFill} L ${rightX},${yBR} A ${rx},${ry} 0 0,1 ${leftX},${yBL} Z`)
              : new Path2D(`M ${leftX},${yTLFill} L ${rightX},${yTRFill} L ${rightX},${yBR} A ${rx},${ry} 0 0,1 ${leftX},${yBL} Z`);

            ctx.save();
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = createCanvasLiquidGrad(ctx, gradId);
            ctx.fill(layerPath);

            // 液体圆柱内部左前侧 3D 柔和高光亮柱（赋予固体果冻/琉璃秘药般的浑厚立体感）
            ctx.clip(layerPath);
            const cylSpecG = ctx.createLinearGradient(25, 0, 39, 0);
            cylSpecG.addColorStop(0, "rgba(255, 255, 255, 0)");
            cylSpecG.addColorStop(0.45, g.colorKey === "mystery_dark" ? "rgba(148, 163, 184, 0.16)" : "rgba(255, 255, 255, 0.22)");
            cylSpecG.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = cylSpecG;
            ctx.fillRect(25, yTop - 4, 14, h + 12);

            // 每层底沿内部微暗体积压边（增强层与层之间的厚重体块感）
            const botDepthG = ctx.createLinearGradient(0, yBotDraw - Math.min(12, h * 0.35), 0, yBotDraw + ry);
            botDepthG.addColorStop(0, "rgba(0, 0, 0, 0)");
            botDepthG.addColorStop(1, "rgba(10, 15, 30, 0.22)");
            ctx.fillStyle = botDepthG;
            ctx.fillRect(leftX, yBotDraw - Math.min(12, h * 0.35), rx * 2, Math.min(12, h * 0.35) + ry + 2);
            ctx.restore();

            // 分层交界处：仅绘制前壁单弧 3D 立体倒角亮边（绝不画后半圈全椭圆，彻底杜绝图4的半透明空心感！）
            if (i > 0) {
              ctx.save();
              ctx.beginPath();
              ctx.ellipse(50, yBotDraw + 0.8, rx - 0.5, ry, 0, 0.05 * Math.PI, 0.95 * Math.PI, false);
              ctx.strokeStyle = "rgba(15, 23, 42, 0.32)";
              ctx.lineWidth = 1.5;
              ctx.stroke();

              ctx.beginPath();
              ctx.ellipse(50, yBotDraw - 0.3, rx - 0.8, ry, 0, 0.06 * Math.PI, 0.94 * Math.PI, false);
              ctx.strokeStyle = g.colorKey === "mystery_dark" ? "rgba(148, 163, 184, 0.45)" : colInfo.topLight;
              ctx.lineWidth = 1.35;
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
              const qCenterY = bottomY - (m + 0.5) * layerH + ry * 0.45;
              ctx.strokeStyle = "rgba(9, 15, 29, 0.75)";
              ctx.lineWidth = 3.2;
              ctx.strokeText("?", 50, qCenterY);
              ctx.fillStyle = "#fef08a";
              ctx.fillText("?", 50, qCenterY);
            }
            ctx.restore();
          }

          // 顶层 3D 实心厚弯月液面（带左前高光斑 + 前唇亮白折射弧 + 后壁内缘暗弧）
          const topColorKey = groups[groups.length - 1].colorKey;
          const colTop = COLORS[topColorKey] || { topLight: "#7a96ff", topRim: "#5b7cfa", topMid: "#3b5bdb", left: "#2841b5", right: "#1c2d87" };
          const topGradId = topColorKey === "mystery_dark" ? "top-mystery" : `top-${topColorKey}`;
          const surfaceTiltRad = Math.atan2(topTiltY * 2, rx * 2);
          const shoulderRx = getShoulderRxAtY(curY, maxCap, isGiantCat);
          const topRxEff = Math.min(rx + 0.5, shoulderRx + 0.5);
          const topRyEff = Math.max(2.2, (ryDynamic + 0.6) * (topRxEff / (rx + 0.5)));
          const menCy = waveCrest * 0.22;

          ctx.save();
          ctx.translate(50, curY);
          ctx.rotate(surfaceTiltRad);
          ctx.globalAlpha = 1.0;

          // (a) 实心液面主椭圆
          ctx.beginPath();
          ctx.ellipse(0, menCy, topRxEff, topRyEff, 0, 0, Math.PI * 2);
          ctx.fillStyle = createCanvasLiquidGrad(ctx, topGradId);
          ctx.fill();

          // (b) 液面左前侧高光椭圆斑（增强液面油润饱满感）
          if (topColorKey !== "mystery_dark") {
            ctx.beginPath();
            ctx.ellipse(-topRxEff * 0.24, menCy - topRyEff * 0.12, topRxEff * 0.42, topRyEff * 0.48, -0.08, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
            ctx.fill();
          }

          // (c) 液面后缘玻璃接触暗弧
          ctx.strokeStyle = topColorKey === "mystery_dark" ? "#0f172a" : (colTop.right || "#1e293b");
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.ellipse(0, menCy, Math.max(1, topRxEff - 0.5), Math.max(0.8, topRyEff - 0.2), 0, Math.PI * 1.05, Math.PI * 1.95, false);
          ctx.stroke();

          // (d) 液面前唇立体亮边弧
          ctx.strokeStyle = topColorKey === "mystery_dark" ? "#94a3b8" : colTop.topLight;
          ctx.lineWidth = 1.65;
          ctx.beginPath();
          ctx.ellipse(0, menCy + 0.2, Math.max(1, topRxEff - 0.8), Math.max(0.8, topRyEff - 0.3), 0, 0.04 * Math.PI, 0.96 * Math.PI, false);
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
          const yBotBase = (i === 0) ? (lowerIf.yG + 18) : lowerIf.yG;
          const yBL = yBotBase + (minX - lowerIf.chord.cx) * lowerTan;
          const yBR = yBotBase + (maxX - lowerIf.chord.cx) * lowerTan;
          const botRx = (maxX - minX) * 0.52;
          const botRy = (i === 0) ? 4 : Math.min(11.5, Math.max(7.2, lowerIf.chord.rx * 0.23));
          const gradId = g.colorKey === "mystery_dark" ? "liq-mystery" : `liq-${g.colorKey}`;
          ctx.fillStyle = createCanvasLiquidGrad(ctx, gradId);
          ctx.fill(new Path2D(`M ${minX},${yUL.toFixed(2)} L ${maxX},${yUR.toFixed(2)} L ${maxX},${yBR.toFixed(2)} A ${botRx.toFixed(2)},${botRy.toFixed(2)} ${lowerRelDeg.toFixed(2)} 0,1 ${minX},${yBL.toFixed(2)} Z`));
        }

        const topIf = interfaces[numGroups], topChord = topIf.chord;
        const topRx = Math.max(0.5, topChord.rx + 0.4);
        const topRy = Math.max(0.5, Math.min(10.8, Math.max(6.8, totalGravityDepth * 0.72), Math.max(7.2, topChord.rx * 0.22)));
        const topColorKey = groups[numGroups - 1].colorKey;
        const colTop = COLORS[topColorKey] || COLORS.blue;
        const topGradId = topColorKey === "mystery_dark" ? "top-mystery" : `top-${topColorKey}`;
        ctx.beginPath();
        ctx.ellipse(topChord.cx, topIf.yG, topRx, topRy, 0, 0, Math.PI * 2);
        ctx.fillStyle = createCanvasLiquidGrad(ctx, topGradId);
        ctx.fill();
        ctx.strokeStyle = topColorKey === "mystery_dark" ? "#94a3b8" : colTop.topLight;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.ellipse(topChord.cx, topIf.yG, Math.max(0.5, topRx - 0.8), Math.max(0.5, topRy - 0.3), 0, 0.05 * Math.PI, 0.95 * Math.PI, false);
        ctx.stroke();
        ctx.restore();
      }

      // 第 4 层：满瓶三段式自然软木塞 + 瓶身流光金环庆典 + 瓶口香槟金星喷发
      function drawNaturalCorkOnCanvas(ctx, b, idx) {
        if (!b.corked) return;
        const animP = typeof b.corkAnimProgress === 'number' ? b.corkAnimProgress : 1.0;
        const neckOffsetY = getNeckOffsetY(b.maxCap || 4, !!b.isGiantCat);

        ctx.save();
        ctx.translate(0, neckOffsetY);

        let corkY = 0, capScaleX = 1.0, capScaleY = 1.0, plugCompressX = 0.95, isSeated = true;

        if (animP < 0.24) {
          isSeated = false;
          const t = animP / 0.24;
          const easeIn = t * t * (2.2 - 1.2 * t);
          corkY = -26 * (1 - easeIn) - 2.2 * easeIn;
          plugCompressX = 1.0;
          ctx.save();
          ctx.fillStyle = `rgba(75, 38, 8, ${(0.12 + 0.32 * easeIn).toFixed(2)})`;
          ctx.beginPath();
          ctx.ellipse(50, 9.2, 7.5 + 3.5 * easeIn, 1.5 + 0.6 * easeIn, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          const insertP = Math.min(1, (animP - 0.24) / 0.76);
          if (insertP < 0.36) {
            const u = insertP / 0.36;
            const easePush = 1 - Math.pow(1 - u, 2.4);
            corkY = -2.2 * (1 - easePush) + 1.5 * easePush;
            capScaleX = 1 + 0.055 * Math.sin(u * Math.PI * 0.85);
            capScaleY = 1 - 0.075 * Math.sin(u * Math.PI * 0.85);
            plugCompressX = 1.0 - 0.07 * easePush;
          } else {
            const u2 = (insertP - 0.36) / 0.64;
            const damped = Math.exp(-4.2 * u2) * Math.cos(u2 * Math.PI * 2.2);
            corkY = 1.5 * damped;
            capScaleX = 1 + 0.028 * damped;
            capScaleY = 1 - 0.036 * damped;
            plugCompressX = 0.93 + 0.02 * (1 - Math.exp(-3 * u2));
          }

          if (insertP < 0.88) {
            const puffP = insertP / 0.88;
            const puffEase = 1 - Math.pow(1 - puffP, 2.4);
            const puffAlpha = Math.max(0, (1 - puffP) * 0.92);
            const rxRing = 15 + puffEase * 24;
            const ryRing = 3.5 + puffEase * 5.2;

            ctx.save();
            // (a) 瓶身自下而上流光庆典金环扫光（恢复满瓶瓶身特效！）
            const { bottomY: cBotY } = getBottleLayerMetrics(b.maxCap || 4, !!b.isGiantCat);
            const sweepY = (cBotY - neckOffsetY) - puffEase * (cBotY - neckOffsetY - 22);
            const ringG = ctx.createLinearGradient(18, sweepY - 18, 82, sweepY + 18);
            ringG.addColorStop(0, 'rgba(254, 240, 138, 0)');
            ringG.addColorStop(0.5, `rgba(254, 240, 138, ${(puffAlpha * 0.55).toFixed(2)})`);
            ringG.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = ringG;
            ctx.fillRect(19, Math.max(22, sweepY - 20), 62, 40);

            ctx.strokeStyle = `rgba(254, 240, 138, ${(puffAlpha * 0.85).toFixed(2)})`;
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.ellipse(50, Math.max(22, sweepY), 30.5, 6.8, 0, 0, Math.PI * 2);
            ctx.stroke();

            // (b) 瓶口双层香槟气浪环与 12 颗璀璨四角金星喷发
            ctx.globalAlpha *= puffAlpha;
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 2.6 * (1 - puffP * 0.6);
            ctx.beginPath();
            ctx.ellipse(50, 9.2, rxRing, ryRing, 0, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6 * (1 - puffP * 0.6);
            ctx.beginPath();
            ctx.ellipse(50, 9.2, rxRing * 0.72, ryRing * 0.72, 0, 0, Math.PI * 2);
            ctx.stroke();

            for (let s = 0; s < 12; s++) {
              const ang = (s / 12) * Math.PI * 2 + 0.2;
              const sx = 50 + Math.cos(ang) * (13 + puffEase * 26);
              const sy = 9.0 + Math.sin(ang) * (3.2 + puffEase * 8.5) - puffEase * 14.5;
              const sr = (2.8 - puffP * 1.8) * (s % 2 === 0 ? 1.25 : 0.85);
              if (sr > 0.25) {
                if (s % 2 === 0) {
                  drawGlowingStar2D(ctx, sx, sy, sr * 1.4, puffEase * 3 + s, puffAlpha);
                } else {
                  ctx.fillStyle = '#ffffff';
                  ctx.beginPath();
                  ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                  ctx.fill();
                }
              }
            }
            ctx.restore();
          }
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

      // ---------------- 6. 布局坐标快照缓存器（彻底消灭每帧 50 次 getBoundingClientRect 卡顿！） ----------------
      let layoutCache = null;

      function rebuildLayoutCache() {
        window._layoutDirty = false;
        const rectOf = (el) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
        };

        const bagsStageEl = document.getElementById('bags-stage');
        const bagRects = [];
        if (bagsStageEl && !bagsStageEl.classList.contains('hidden')) {
          for (let i = 0; i < bagsStageEl.children.length; i++) {
            bagRects.push(rectOf(bagsStageEl.children[i]));
          }
        }

        const gridEl = document.getElementById('bottles-grid');
        const bottleSlots = [];
        if (gridEl) {
          for (let i = 0; i < gridEl.children.length; i++) {
            const slotEl = gridEl.children[i];
            const padEl = slotEl ? slotEl.querySelector('.burlap-coaster-pad') : null;
            const mouthEl = document.getElementById(`mouth-center-${i}`);
            bottleSlots.push({
              slotRect: rectOf(slotEl),
              padRect: rectOf(padEl),
              mouthRect: rectOf(mouthEl)
            });
          }
        }

        layoutCache = {
          settingsBtn: rectOf(document.getElementById('settings-btn')),
          rulesBtn: rectOf(document.getElementById('rules-help-btn')),
          centerLvTrigger: rectOf(document.getElementById('top-center-level-trigger')),
          modeBanner: rectOf(document.getElementById('mode-banner')),
          modeBannerProg: rectOf(document.getElementById('mode-banner-progress')),
          movesCounterPill: rectOf(document.getElementById('moves-counter-pill')),
          bagRects,
          bottleSlots,
          dockBtns: {
            'dock-restart-btn': { btn: rectOf(document.getElementById('dock-restart-btn')), badge: null },
            'shuffle-btn':      { btn: rectOf(document.getElementById('shuffle-btn')),      badge: rectOf(document.getElementById('shuffle-count')) },
            'undo-btn':         { btn: rectOf(document.getElementById('undo-btn')),         badge: rectOf(document.getElementById('undo-count-badge')) },
            'hint-btn':         { btn: rectOf(document.getElementById('hint-btn')),         badge: rectOf(document.getElementById('hint-count')) },
            'add-bottle-btn':   { btn: rectOf(document.getElementById('add-bottle-btn')),   badge: rectOf(document.getElementById('add-bottle-count')) }
          }
        };
      }

      // ---------------- 7. 静止水瓶整瓶离屏位图缓存（静止瓶每帧仅需1次 drawImage，速度提升10倍！） ----------------
      const staticBottleCanvasCache = new Map();
      const bottleBackGlassCache = new Map();
      const bottleFrontShellCache = new Map();

      function getCachedBottleBackGlass(b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH) {
        const neckOff = getNeckOffsetY(maxCap, isGiantCat);
        const key = `bg_${maxCap}_${neckOff}_${isGiantCat?1:0}_${b.special || 'none'}_${b.requiredColor || ''}`;
        let off = bottleBackGlassCache.get(key);
        if (!off) {
          if (bottleBackGlassCache.size > 32) bottleBackGlassCache.clear();
          off = document.createElement('canvas');
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
        const key = `fs_${maxCap}_${neckOff}_${isGiantCat?1:0}_sp${b.special||'none'}_req${b.requiredColor||''}_p${b.poursToBreak||0}_u${leftBags}_cd${b.countdownMoves||0}_fz${b.frozenTurns||0}_emp${isEmpty?1:0}`;
        let off = bottleFrontShellCache.get(key);
        if (!off) {
          if (bottleFrontShellCache.size > 48) bottleFrontShellCache.clear();
          off = document.createElement('canvas');
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

        // 静止瓶：使用整瓶离屏位图缓存，每帧仅 1 次 drawImage
        const leftBags = ['silk_drape', 'full_ice', 'paper_bag'].includes(b.special) ? Math.max(1, (b.unlockOrder || 1) - packedTotal) : 0;
        const neckOff = getNeckOffsetY(maxCap, isGiantCat);
        const cacheKey = `sb_${maxCap}_${neckOff}_${isGiantCat?1:0}_${(b.layers||[]).join(',')}_m${b.mysteryCount||0}_sp${b.special}_req${b.requiredColor||''}_p${b.poursToBreak||0}_u${leftBags}_cd${b.countdownMoves||0}_fz${b.frozenTurns||0}_ck${b.corked?1:0}`;
        let off = staticBottleCanvasCache.get(cacheKey);
        if (!off) {
          if (staticBottleCanvasCache.size > 64) staticBottleCanvasCache.clear();
          off = document.createElement('canvas');
          const scaleRes = 2.0;
          off.width = Math.round(vbW * scaleRes);
          off.height = Math.round(vbH * scaleRes);
          const oCtx = off.getContext('2d');
          oCtx.save();
          oCtx.scale(scaleRes, scaleRes);
          oCtx.translate(-vbMinX, -vbMinY);
          renderBottleDirectToCtx(oCtx, b, idx, maxCap, isGiantCat, vbMinX, vbMinY, vbW, vbH, liqOpts);
          oCtx.restore();
          staticBottleCanvasCache.set(cacheKey, off);
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

        // 0. 绘制倾倒中水瓶的瓶身流光气场与 14 颗环绕四角星芒微粒（恢复瓶子抬起倒水特效！）
        if (bodyPose && colObj) {
          const { cx, cy, deg, w, h } = bodyPose;
          const auraOp = phase === 'pour' ? 0.34 : (Math.sin(p * Math.PI) * 0.28 + 0.08);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(((deg || 0) * Math.PI) / 180);
          const ag = ctx.createRadialGradient(0, 0, 8, 0, 0, Math.max(w, h) * 0.65);
          ag.addColorStop(0, colObj.topLight || '#fef08a');
          ag.addColorStop(0.55, colObj.mid || '#facc15');
          ag.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.globalAlpha = auraOp;
          ctx.fillStyle = ag;
          ctx.beginPath();
          ctx.ellipse(0, 0, w * 0.66, h * 0.56, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          const nowT = performance.now() * 0.003;
          for (let i = 0; i < 12; i++) {
            const seedA = hash01(i * 31 + 7) * Math.PI * 2 + nowT * (i % 2 === 0 ? 1.1 : -0.9);
            const rx = (w * 0.42) + hash01(i * 17 + 3) * 22;
            const ry = (h * 0.40) + hash01(i * 23 + 5) * 24;
            const sx = cx + Math.cos(seedA) * rx;
            const sy = cy + Math.sin(seedA) * ry - ((nowT * 18 + i * 9) % 24);
            const sr = 2.4 + (i % 3) * 1.1;
            const sAlpha = (0.45 + 0.45 * Math.sin(nowT * 3 + i)) * (phase === 'return' ? (1 - p * 0.7) : 1);
            drawGlowingStar2D(ctx, sx, sy, sr, nowT + i, sAlpha);
          }
        }

        if (trailHistory && trailHistory.length >= 2) {
          const firstPt = trailHistory[0];
          const lastPt = trailHistory[trailHistory.length - 1];
          const moveSpan = Math.hypot(lastPt.cx - firstPt.cx, lastPt.cy - firstPt.cy);
          if (moveSpan > 4) {
            const upperPts = [], lowerPts = [];
            const n = trailHistory.length;
            for (let i = 0; i < n; i++) {
              const t = i / (n - 1);
              const pt = trailHistory[i];
              const halfW = (pt.halfH || 28) * Math.pow(t, 1.35) * 0.68;
              const rad = ((pt.deg || 0) * Math.PI) / 180;
              const nx = -Math.sin(rad), ny = Math.cos(rad);
              upperPts.push(`${(pt.cx + nx * halfW).toFixed(1)},${(pt.cy + ny * halfW).toFixed(1)}`);
              lowerPts.push(`${(pt.cx - nx * halfW).toFixed(1)},${(pt.cy - ny * halfW).toFixed(1)}`);
            }
            const wakeOp = phase === 'move' ? (Math.sin(p * Math.PI) * 0.28 + 0.05) : (phase === 'return' ? (1 - p) * 0.20 : 0.08);
            ctx.save();
            const g = ctx.createLinearGradient(firstPt.cx, firstPt.cy, lastPt.cx, lastPt.cy);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.55, `rgba(255,255,255,${(wakeOp * 0.5).toFixed(3)})`);
            g.addColorStop(1, colObj ? colObj.topLight : '#ffffff');
            ctx.globalAlpha = wakeOp;
            ctx.fillStyle = g;
            ctx.fill(new Path2D(`M ${upperPts.join(' L ')} L ${lowerPts.reverse().join(' L ')} Z`));
            ctx.restore();
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

      // 弹窗渲染（仅在弹窗开启时按需测量并绘制，平时 0 开销）
      const blurSnapshotCanvas = document.createElement('canvas');
      const blurSnapshotCtx = blurSnapshotCanvas.getContext('2d');
      let lastModalOpenState = false;

      const _MODAL_MASK_IDS = [
        'mechanic-modal-mask',
        'out-of-moves-modal-mask',
        'refresh-modal-mask',
        'speed-modal-mask',
        'shop-modal-mask',
        'level-modal-mask',
        'pause-modal-mask',
        'modal-mask'
      ];
      function getOpenModalMaskEl() {
        for (let i = 0; i < _MODAL_MASK_IDS.length; i++) {
          const el = document.getElementById(_MODAL_MASK_IDS[i]);
          if (el && el.classList && el.classList.contains('show')) return el;
        }
        return null;
      }

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
        [[84,48,15,'#38bdf8'], [110,36,22,'#e879f9'], [242,34,21,'#60a5fa'], [272,44,24,'#fb7185']].forEach(([bx,by,br,bc]) => {
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

      function drawOpenModalOnCanvas(ctx, w, h, nowMs) {
        const maskEl = getOpenModalMaskEl();
        if (!maskEl) {
          lastModalOpenState = false;
          return false;
        }

        if (!lastModalOpenState) {
          lastModalOpenState = true;
          const bw = Math.max(72, Math.round(w * 0.18));
          const bh = Math.max(110, Math.round(h * 0.18));
          blurSnapshotCanvas.width = bw;
          blurSnapshotCanvas.height = bh;
          blurSnapshotCtx.drawImage(canvas, 0, 0, bw, bh);
        }
        ctx.save();
        ctx.drawImage(blurSnapshotCanvas, 0, 0, w, h);
        // 全弹窗统一使用图2的沉浸式深琥珀夜幕底色，让顶部折带横幅、黄金聚光灯与金边奶油胶囊成为第一视觉焦点！
        ctx.fillStyle = 'rgba(24, 17, 14, 0.78)';
        ctx.fillRect(0, 0, w, h);

        registerHitRegion('modal_backdrop', 0, 0, w, h, 200, () => {
          if (maskEl.id === 'mechanic-modal-mask') {
            maskEl.classList.remove('show');
            playSound('modal_close');
          }
        });

        const bannerW = Math.min(w - 24, 344);

        // ====================================================================
        // 弹窗 F (图2)：常驻机关与规则图鉴 + 解锁新玩法聚光灯庆典层
        // ====================================================================
        if (maskEl.id === 'mechanic-modal-mask') {
          const totalH = HANDBOOK_KEYS.length;
          const hIdx = ((window._handbookIdx || 0) % totalH + totalH) % totalH;
          const mechKey = HANDBOOK_KEYS[hIdx] || 'basic_rule';
          const mechInfo = (typeof MECHANIC_INTROS !== 'undefined' && MECHANIC_INTROS[mechKey]) || MECHANIC_INTROS.basic_rule;
          const isCurrentLvMech = (window._handbookActiveLevelKey === mechKey);

          const ribbonRect = maskEl.querySelector('.mech-ribbon-header')?.getBoundingClientRect();
          const ribTop = (ribbonRect && ribbonRect.width > 0) ? ribbonRect.top : h * 0.12;
          const ribH = (ribbonRect && ribbonRect.height > 0) ? ribbonRect.height : 108;
          drawFig2RibbonHeader(ctx, w * 0.5, ribTop, bannerW, ribH, mechInfo.title || '机关图鉴');

          // 顶部图鉴页码与【本关出场】标记胶囊
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

          const spotEl = maskEl.querySelector('.mech-open-spotlight');
          if (spotEl) {
            const sRect = spotEl.getBoundingClientRect();
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
          }

          const pillEl = document.getElementById('mech-desc');
          if (pillEl) {
            const pRect = pillEl.getBoundingClientRect();
            const boxX = Math.max(18, w * 0.5 - 166);
            const boxW = Math.min(w - 36, 332);
            const boxY = pRect.top - 18;
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
          }
          const tapEl = document.getElementById('mech-close-btn');
          if (tapEl) {
            const tRect = tapEl.getBoundingClientRect();
            ctx.save();
            ctx.globalAlpha = 0.75 + 0.25 * Math.sin(nowMs * 0.0035);
            ctx.fillStyle = '#ffffff';
            ctx.font = '800 15px "Fredoka", "PingFang SC", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('◀ 左右切换查看全部机关 · 点击空白处继续游戏 ▶', w * 0.5, tRect.top + tRect.height * 0.5 + 10);
            ctx.restore();
          }
          ctx.restore();
          return true;
        }

        // ====================================================================
        // 弹窗 A (图1)：过关成功结算弹窗 —— 100% 升级为图2同款【折带气球金星横幅 + 旋转聚光灯奖杯 + 金边奶油胶囊成绩单】风格！
        // ====================================================================
        if (maskEl.id === 'modal-mask') {
          const cardEl = maskEl.querySelector('.casual-modal-card');
          const headerPill = cardEl ? cardEl.querySelector('.casual-header-pill') : null;
          const winTitle = (headerPill && headerPill.textContent.trim()) || '过关成功';

          const centerY = h * 0.50;
          const ribTopY = Math.max(h * 0.11, centerY - 235);
          drawFig2RibbonHeader(ctx, w * 0.5, ribTopY, bannerW, 108, winTitle);

          const winCloseBtn = document.getElementById('win-close-x-btn');
          if (winCloseBtn) {
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
            registerHitRegion('win_close_x', xX - 6, xY - 6, xW + 12, xH + 12, 240, () => winCloseBtn.click());
          }

          // 中央旋转黄金聚光灯 + 3颗庆典五角金星 + 悬浮3D金奖杯
          const trophyCy = ribTopY + 188;
          drawFig2SpotlightRays(ctx, w * 0.5, trophyCy, 138, nowMs, 1.0);

          // 3颗环绕奖杯上方的 3D 金星
          const starOffsets = [[-56, -46, 17], [0, -56, 23], [56, -46, 17]];
          starOffsets.forEach(([dx, dy, sr], sIdx) => {
            const pulse = 1 + 0.08 * Math.sin(nowMs * 0.004 + sIdx);
            drawStar5(ctx, w * 0.5 + dx, trophyCy + dy, sr * pulse, sr * 0.45 * pulse, '#fde047', '#d97706', 2.2);
          });

          // 悬浮 3D 黄金奖杯
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

          // 图2同款：金边暖象牙奶油胶囊成绩单（本次用步 / 理论最优解 / 最优解差距 + 评价语）
          const pillW = Math.min(w - 36, 332);
          const pillX = (w - pillW) * 0.5;
          const pillY = trophyCy + 64;
          const pillH = 98;
          drawFig2CreamGoldPill(ctx, pillX, pillY, pillW, pillH, 22);

          ctx.save();
          const cols = [
            ['本次用步', document.getElementById('score-user-moves')?.textContent || '', '#7c3f0e'],
            ['理论最优解', document.getElementById('score-opt-moves')?.textContent || '', '#15803d'],
            ['最优解差距', document.getElementById('score-diff-moves')?.textContent || '', '#d97706']
          ];
          cols.forEach(([lbl, val, col], i) => {
            const cx = pillX + pillW * ((i * 2 + 1) / 6);
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#92400e'; ctx.font = '800 11.5px "Fredoka", "PingFang SC", sans-serif';
            ctx.fillText(lbl, cx, pillY + 24);
            ctx.fillStyle = col; ctx.font = '900 19px "Fredoka", "PingFang SC", sans-serif';
            ctx.fillText(val, cx, pillY + 48);
          });

          // 分隔金线与底部评价语
          ctx.strokeStyle = 'rgba(243, 177, 75, 0.45)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(pillX + 22, pillY + 66);
          ctx.lineTo(pillX + pillW - 22, pillY + 66);
          ctx.stroke();

          const praiseTxt = document.getElementById('score-praise-line')?.textContent.trim() || '✨ 完美通关！';
          ctx.fillStyle = '#b45309';
          ctx.font = '800 12.5px "Fredoka", "PingFang SC", sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(praiseTxt, pillX + pillW * 0.5, pillY + 82, pillW - 24);
          ctx.restore();

          // 底部双 3D 琉璃主按钮（重玩本关 / 下一关）
          const btnY = pillY + pillH + 20;
          const btnW = (pillW - 14) * 0.5;
          const btnH = 50;
          const restartEl = document.getElementById('modal-restart-btn');
          const nextEl = document.getElementById('modal-next-btn');
          if (restartEl) {
            draw3DGlossyModalButton(ctx, pillX, btnY, btnW, btnH, 16, MODAL_BTN_PALETTES.amber, restartEl.textContent.trim() || '重玩本关', 16.5);
            registerHitRegion('modal-restart-btn', pillX, btnY, btnW, btnH, 220, () => restartEl.click());
          }
          if (nextEl) {
            draw3DGlossyModalButton(ctx, pillX + btnW + 14, btnY, btnW, btnH, 16, MODAL_BTN_PALETTES.green, nextEl.textContent.trim() || '下一关', 16.5);
            registerHitRegion('modal-next-btn', pillX + btnW + 14, btnY, btnW, btnH, 220, () => nextEl.click());
          }
          ctx.restore();
          return true;
        }

        // ====================================================================
        // 弹窗 B (图3)：设置页面 —— 100% 升级为图2同款【折带气球金星横幅 + 黄金聚光灯背光 + 独立金边奶油胶囊行】风格！
        // ====================================================================
        if (maskEl.id === 'pause-modal-mask') {
          const cardEl = maskEl.querySelector('.casual-modal-card');
          const pillW = Math.min(w - 32, 336);
          const pillX = (w - pillW) * 0.5;
          const totalH = 100 + 4 * 52 + 72 + 56 + 52;
          const ribTopY = Math.max(18, (h - totalH) * 0.45);

          // 1. 背景柔和旋转聚光灯 + 顶部图2同款折带气球金星标题横幅【设置】
          drawFig2SpotlightRays(ctx, w * 0.5, ribTopY + 230, 175, nowMs, 0.65);
          drawFig2RibbonHeader(ctx, w * 0.5, ribTopY, bannerW, 98, '设置');

          // 右上角立体珊瑚红关闭按钮
          const closeBtn = cardEl ? cardEl.querySelector('.casual-close-btn') : null;
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
          if (closeBtn) {
            registerHitRegion('modal_close_x', xX - 6, xY - 6, xW + 12, xH + 12, 240, () => closeBtn.click());
          }

          // 2. 4 条独立图2同款金边奶油胶囊设置项（声音 / 震动 / 音乐 / 缩放）
          const rows = cardEl ? cardEl.querySelectorAll('.pause-setting-row') : [];
          const rowsStartY = ribTopY + 104;
          rows.forEach((rowEl, rIdx) => {
            const rY = rowsStartY + rIdx * 52;
            const rH = 45;
            drawFig2CreamGoldPill(ctx, pillX, rY, pillW, rH, 18);

            ctx.save();
            const labelTxt = rowEl.querySelector('.pause-setting-left span')?.textContent || '';
            ctx.font = '800 16px "Fredoka", "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillStyle = '#7c3f0e';
            ctx.fillText(labelTxt, pillX + 48, rY + rH * 0.5);

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
            } else if (rIdx === 2) {
              ctx.beginPath();
              ctx.moveTo(icX - 2.8, icY + 5.2); ctx.lineTo(icX - 2.8, icY - 5.8);
              ctx.lineTo(icX + 6.2, icY - 7.8); ctx.lineTo(icX + 6.2, icY + 3.2);
              ctx.stroke();
              ctx.beginPath(); ctx.arc(icX - 5.4, icY + 5.2, 2.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
              ctx.beginPath(); ctx.arc(icX + 3.6, icY + 3.2, 2.9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.moveTo(icX + 2.2, icY - 7.2); ctx.lineTo(icX + 7.2, icY - 7.2); ctx.lineTo(icX + 7.2, icY - 2.2);
              ctx.moveTo(icX - 2.2, icY + 7.2); ctx.lineTo(icX - 7.2, icY + 7.2); ctx.lineTo(icX - 7.2, icY + 2.2);
              ctx.moveTo(icX + 7.2, icY - 7.2); ctx.lineTo(icX + 1.2, icY - 1.2);
              ctx.moveTo(icX - 7.2, icY + 7.2); ctx.lineTo(icX - 1.2, icY + 1.2);
              ctx.stroke();
            }

            const toggleEl = rowEl.querySelector('.casual-toggle');
            if (toggleEl) {
              const tW = 72, tH = 32;
              const tX = pillX + pillW - tW - 12;
              const tY = rY + (rH - tH) * 0.5;
              const isOn = toggleEl.classList.contains('on');
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

              registerHitRegion('toggle_' + rIdx, pillX, rY, pillW, rH, 220, () => toggleEl.click());
            }
            ctx.restore();
          });

          // 3. 4 枚独立图2同款金边奶油快捷功能卡（速度x2 / 提速 / 主题 / 破局）
          const fBtns = cardEl ? cardEl.querySelectorAll('.pause-feature-btn') : [];
          const featY = rowsStartY + 4 * 52 + 4;
          const gap = 8;
          const fw = (pillW - gap * 3) / 4;
          const fh = 62;
          fBtns.forEach((fBtn, fIdx) => {
            const fx = pillX + fIdx * (fw + gap);
            const is2x = fBtn.classList.contains('active-2x');
            drawFig2CreamGoldPill(ctx, fx, featY, fw, fh, 16);

            ctx.save();
            if (is2x) {
              ctx.beginPath(); ctx.roundRect(fx + 2, featY + 2, fw - 4, fh - 4, 14);
              ctx.fillStyle = 'rgba(253, 224, 71, 0.35)'; ctx.fill();
            }
            const icX = fx + fw * 0.5, icY = featY + 22;
            if (fIdx === 0) {
              ctx.fillStyle = '#b45309';
              ctx.beginPath(); ctx.moveTo(icX - 8.5, icY - 5.5); ctx.lineTo(icX - 0.5, icY); ctx.lineTo(icX - 8.5, icY + 5.5); ctx.closePath(); ctx.fill();
              ctx.beginPath(); ctx.moveTo(icX + 0.5, icY - 5.5); ctx.lineTo(icX + 8.5, icY); ctx.lineTo(icX + 0.5, icY + 5.5); ctx.closePath(); ctx.fill();
            } else if (fIdx === 1) {
              ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#7c3f0e'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
              ctx.beginPath();
              ctx.moveTo(icX, icY - 7.8); ctx.lineTo(icX + 7.5, icY - 0.2); ctx.lineTo(icX + 3.2, icY - 0.2);
              ctx.lineTo(icX + 3.2, icY + 7.5); ctx.lineTo(icX - 3.2, icY + 7.5); ctx.lineTo(icX - 3.2, icY - 0.2);
              ctx.lineTo(icX - 7.5, icY - 0.2); ctx.closePath();
              ctx.fill(); ctx.stroke();
            } else if (fIdx === 2) {
              ctx.beginPath(); ctx.arc(icX, icY, 8.2, 0, Math.PI * 2);
              ctx.fillStyle = '#fde047'; ctx.fill();
              ctx.strokeStyle = '#7c3f0e'; ctx.lineWidth = 1.6; ctx.stroke();
              [[-3,-2,'#ea580c'], [3,-2,'#16a34a'], [0,3,'#2563eb']].forEach(([dx,dy,col]) => {
                ctx.beginPath(); ctx.arc(icX + dx, icY + dy, 1.6, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
              });
            } else {
              drawStar5(ctx, icX, icY, 9.0, 4.0, '#facc15', '#7c3f0e', 1.5);
            }

            const fLbl = fBtn.querySelector('.pause-feature-label')?.textContent || '';
            ctx.fillStyle = '#7c3f0e';
            ctx.font = '800 12.5px "Fredoka", "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(fLbl, fx + fw * 0.5, featY + fh - 14);
            ctx.restore();
            registerHitRegion('pause_feat_' + fIdx, fx, featY, fw, fh, 220, () => fBtn.click());
          });

          // 4. 底部操作按钮行（主页 / 重新开始 / 跳过 + 继续游戏）
          const row1Y = featY + fh + 14;
          const row1H = 52;
          const homeEl = document.getElementById('pause-home-btn');
          const restartEl = document.getElementById('pause-restart-btn');
          const skipEl = document.getElementById('pause-skip-btn');
          const resumeEl = document.getElementById('pause-resume-btn');

          if (homeEl) {
            draw3DGlossyModalButton(ctx, pillX, row1Y, 60, row1H, 16, MODAL_BTN_PALETTES.goldSquare, '主页', 13);
            registerHitRegion('pause-home-btn', pillX, row1Y, 60, row1H, 220, () => homeEl.click());
          }
          if (restartEl) {
            draw3DGlossyModalButton(ctx, pillX + 70, row1Y, pillW - 140, row1H, 16, MODAL_BTN_PALETTES.green, restartEl.textContent.trim() || '重新开始', 16.5);
            registerHitRegion('pause-restart-btn', pillX + 70, row1Y, pillW - 140, row1H, 220, () => restartEl.click());
          }
          if (skipEl) {
            draw3DGlossyModalButton(ctx, pillX + pillW - 60, row1Y, 60, row1H, 16, MODAL_BTN_PALETTES.coralSquare, '跳过', 13);
            registerHitRegion('pause-skip-btn', pillX + pillW - 60, row1Y, 60, row1H, 220, () => skipEl.click());
          }
          if (resumeEl) {
            const row2Y = row1Y + row1H + 10;
            draw3DGlossyModalButton(ctx, pillX, row2Y, pillW, 50, 16, MODAL_BTN_PALETTES.amber, resumeEl.textContent.trim() || '继续游戏', 17);
            registerHitRegion('pause-resume-btn', pillX, row2Y, pillW, 50, 220, () => resumeEl.click());
          }

          ctx.restore();
          return true;
        }

        const cardEl = maskEl.querySelector('.casual-modal-card');
        if (cardEl) {
          const cRect = cardEl.getBoundingClientRect();
          // 其余弹窗（选关/商店/提速/刷新/步数耗尽）同样升级为顶部图2折带气球横幅 + 金边奶油底板风格！
          const headerPill = cardEl.querySelector('.casual-header-pill');
          const pillTitle = (headerPill && headerPill.textContent.trim()) || (maskEl.id === 'shop-modal-mask' ? '主题商店' : '关卡选择');

          drawFig2SpotlightRays(ctx, w * 0.5, cRect.top + cRect.height * 0.45, 165, nowMs, 0.6);
          drawFig2CreamGoldPill(ctx, cRect.left, cRect.top + 18, cRect.width, cRect.height - 12, 26);
          drawFig2RibbonHeader(ctx, w * 0.5, cRect.top - 52, Math.min(w - 24, 336), 96, pillTitle);

          const closeBtn = cardEl.querySelector('.casual-close-btn');
          if (closeBtn) {
            const xRect = closeBtn.getBoundingClientRect();
            const xY = cRect.top - 10;
            draw3DGlossyModalButton(ctx, xRect.left, xY, xRect.width, xRect.height, 13, MODAL_BTN_PALETTES.coralSquare, '', 16);
            const xcx = xRect.left + xRect.width * 0.5, xcy = xY + xRect.height * 0.5;
            ctx.save();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.2; ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(xcx - 5.5, xcy - 5.5); ctx.lineTo(xcx + 5.5, xcy + 5.5);
            ctx.moveTo(xcx + 5.5, xcy - 5.5); ctx.lineTo(xcx - 5.5, xcy + 5.5);
            ctx.stroke();
            ctx.restore();
            registerHitRegion('modal_close_x', xRect.left - 8, xY - 8, xRect.width + 16, xRect.height + 16, 240, () => closeBtn.click());
          }

          if (maskEl.id === 'level-modal-mask') {
            document.querySelectorAll('.chapter-tab-btn').forEach((tBtn, tIdx) => {
              const tRect = tBtn.getBoundingClientRect();
              const isAct = tBtn.classList.contains('active');
              ctx.save();
              ctx.beginPath(); ctx.roundRect(tRect.left, tRect.top, tRect.width, tRect.height, 11);
              ctx.fillStyle = isAct ? '#d48c28' : 'rgba(243, 177, 75, 0.25)'; ctx.fill();
              ctx.strokeStyle = '#f3b14b'; ctx.lineWidth = 1.6; ctx.stroke();
              ctx.fillStyle = isAct ? '#ffffff' : '#7c3f0e';
              ctx.font = '800 10.5px "Fredoka", "PingFang SC", sans-serif';
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText(tBtn.textContent.trim(), tRect.left + tRect.width * 0.5, tRect.top + tRect.height * 0.5);
              ctx.restore();
              registerHitRegion('ch_tab_' + tIdx, tRect.left, tRect.top, tRect.width, tRect.height, 220, () => tBtn.click());
            });

            const scrollEl = document.getElementById('level-grid-list');
            if (scrollEl) {
              const sRect = scrollEl.getBoundingClientRect();
              ctx.save();
              ctx.beginPath(); ctx.rect(sRect.left, sRect.top, sRect.width, sRect.height); ctx.clip();
              scrollEl.querySelectorAll('.level-cell').forEach((cellEl, cIdx) => {
                const cellRect = cellEl.getBoundingClientRect();
                if (cellRect.bottom < sRect.top || cellRect.top > sRect.bottom) return;
                const isAct = cellEl.classList.contains('active');
                const isBoss = cellEl.classList.contains('boss-cell');
                ctx.beginPath(); ctx.roundRect(cellRect.left, cellRect.top, cellRect.width, cellRect.height, 14);
                ctx.fillStyle = isAct ? '#76914c' : (isBoss ? '#fef3c7' : '#ffffff');
                ctx.fill();
                ctx.strokeStyle = isAct ? '#fde047' : '#f3b14b'; ctx.lineWidth = 1.8; ctx.stroke();
                const numTxt = cellEl.querySelector('.level-cell-num')?.textContent || '';
                const tagTxt = cellEl.querySelector('.level-cell-tag')?.textContent || '';
                const waveTxt = cellEl.querySelector('.level-cell-wave')?.textContent || '';
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
                registerHitRegion('lv_cell_' + cIdx, cellRect.left, Math.max(sRect.top, cellRect.top), cellRect.width, Math.min(cellRect.bottom, sRect.bottom) - Math.max(sRect.top, cellRect.top), 220, () => cellEl.click());
              });
              ctx.restore();
            }
          } else if (maskEl.id === 'shop-modal-mask') {
            const shopGrid = document.getElementById('shop-grid');
            if (shopGrid) {
              const sRect = shopGrid.getBoundingClientRect();
              ctx.save();
              ctx.beginPath(); ctx.rect(sRect.left, sRect.top, sRect.width, sRect.height); ctx.clip();
              shopGrid.querySelectorAll('.shop-item-card').forEach((cardItem, idx) => {
                const r = cardItem.getBoundingClientRect();
                if (r.bottom < sRect.top || r.top > sRect.bottom) return;
                const item = SHOP_THEMES[idx] || SHOP_THEMES[0];
                const isAct = activeThemeId === item.id;
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
                const btnEl = cardItem.querySelector('.shop-action-btn');
                if (btnEl) {
                  const br = btnEl.getBoundingClientRect();
                  const pal = (isAct || item.unlocked) ? MODAL_BTN_PALETTES.green : MODAL_BTN_PALETTES.amber;
                  draw3DGlossyModalButton(ctx, br.left, br.top, br.width, br.height, 10, pal, btnEl.textContent.trim(), 12);
                }
                registerHitRegion('shop_card_' + idx, r.left, Math.max(sRect.top, r.top), r.width, Math.min(r.bottom, sRect.bottom) - Math.max(sRect.top, r.top), 220, () => {
                  cardItem.click();
                  bgOffscreenDirty = true;
                });
              });
              ctx.restore();
            }
            const openLvBtn = document.getElementById('shop-open-levels-btn');
            if (openLvBtn) {
              const br = openLvBtn.getBoundingClientRect();
              draw3DGlossyModalButton(ctx, br.left, br.top, br.width, br.height, 15, MODAL_BTN_PALETTES.amber, openLvBtn.textContent.trim(), 15);
              registerHitRegion('shop_open_lv', br.left, br.top, br.width, br.height, 220, () => openLvBtn.click());
            }
          } else if (maskEl.id === 'speed-modal-mask' || maskEl.id === 'refresh-modal-mask' || maskEl.id === 'out-of-moves-modal-mask') {
            const sunBox = cardEl.querySelector('.pastel-sunburst-box');
            if (sunBox) {
              const sr = sunBox.getBoundingClientRect();
              const scx = sr.left + sr.width * 0.5;
              const scy = sr.top + sr.height * 0.5 + Math.sin(nowMs * 0.0025) * 3.5;
              ctx.save();
              ctx.beginPath(); ctx.roundRect(sr.left, sr.top + 10, sr.width, sr.height - 10, 22);
              const sg = ctx.createRadialGradient(scx, scy, 8, scx, scy, sr.width * 0.65);
              sg.addColorStop(0, '#fffdf2'); sg.addColorStop(0.5, '#f6d28b'); sg.addColorStop(1, '#d89636');
              ctx.fillStyle = sg; ctx.fill();
              ctx.strokeStyle = '#f3b14b'; ctx.lineWidth = 2.4; ctx.stroke();

              if (maskEl.id === 'speed-modal-mask') {
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
              } else if (maskEl.id === 'refresh-modal-mask') {
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
            }

            if (maskEl.id === 'speed-modal-mask') {
              ctx.save();
              ctx.fillStyle = '#7c3f0e'; ctx.font = '800 16px "Fredoka", "PingFang SC", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(`等级: ${speedLevel || 0}  ·  当前速度: ${speedPoints || 10} 点`, cRect.left + cRect.width * 0.5, cRect.bottom - 24);
              ctx.restore();
              const upBtn = document.getElementById('speed-upgrade-confirm-btn');
              if (upBtn) {
                const br = upBtn.getBoundingClientRect();
                draw3DGlossyModalButton(ctx, br.left, br.top, br.width, br.height, 16, MODAL_BTN_PALETTES.green, '', 18);
                ctx.save();
                drawVideoAdIcon(ctx, br.left + br.width * 0.5 - 32, br.top + br.height * 0.5);
                ctx.fillStyle = '#ffffff'; ctx.font = '800 18px "Fredoka", "PingFang SC", sans-serif';
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText('升级', br.left + br.width * 0.5 - 10, br.top + br.height * 0.5);
                ctx.restore();
                registerHitRegion('speed_up_confirm', br.left, br.top, br.width, br.height, 220, () => upBtn.click());
              }
            } else if (maskEl.id === 'refresh-modal-mask') {
              ctx.save();
              ctx.fillStyle = '#7c3f0e'; ctx.font = '800 16px "Fredoka", "PingFang SC", sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('智能破局一步 / 随机刷新药水颜色', cRect.left + cRect.width * 0.5, cRect.bottom - 86);
              ctx.restore();
              const refBtn = document.getElementById('refresh-confirm-btn');
              if (refBtn) {
                const br = refBtn.getBoundingClientRect();
                draw3DGlossyModalButton(ctx, br.left, br.top, br.width, br.height, 16, MODAL_BTN_PALETTES.green, '', 18);
                ctx.save();
                drawVideoAdIcon(ctx, br.left + br.width * 0.5 - 32, br.top + br.height * 0.5);
                ctx.fillStyle = '#ffffff'; ctx.font = '800 18px "Fredoka", "PingFang SC", sans-serif';
                ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                ctx.fillText('获得', br.left + br.width * 0.5 - 10, br.top + br.height * 0.5);
                ctx.restore();
                registerHitRegion('refresh_confirm', br.left, br.top, br.width, br.height, 220, () => refBtn.click());
              }
            } else if (maskEl.id === 'out-of-moves-modal-mask') {
              ['oom-add-moves-btn', 'oom-restart-btn'].forEach(bId => {
                const bEl = document.getElementById(bId);
                if (!bEl) return;
                const br = bEl.getBoundingClientRect();
                if (bId === 'oom-add-moves-btn') {
                  draw3DGlossyModalButton(ctx, br.left, br.top, br.width, br.height, 16, MODAL_BTN_PALETTES.green, '', 16);
                  ctx.save();
                  drawVideoAdIcon(ctx, br.left + br.width * 0.5 - 64, br.top + br.height * 0.5);
                  ctx.fillStyle = '#ffffff'; ctx.font = '800 16px "Fredoka", "PingFang SC", sans-serif';
                  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
                  ctx.fillText('免费增加 5 步', br.left + br.width * 0.5 - 42, br.top + br.height * 0.5);
                  ctx.restore();
                } else {
                  draw3DGlossyModalButton(ctx, br.left, br.top, br.width, br.height, 16, MODAL_BTN_PALETTES.amber, bEl.textContent.trim(), 16);
                }
                registerHitRegion(bId, br.left, br.top, br.width, br.height, 220, () => bEl.click());
              });
            }
          }
        }
        ctx.restore();
        return true;
      }

      // 预烘焙瓶底接触阴影精灵图（避免每帧对 12 个瓶子重复调用 createRadialGradient）
      let _aoShadowSprite = null;
      function getAoShadowSprite() {
        if (_aoShadowSprite) return _aoShadowSprite;
        const sp = document.createElement('canvas');
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

      // ---------------- 8. 极速主循环（全缓存坐标，单 RAF 循环，0 DOM重排，丝滑 60/120 FPS） ----------------
      function renderPureCanvasLoop(nowMs) {
        requestAnimationFrame(renderPureCanvasLoop);
        syncCanvasSize();
        if (window._layoutDirty || !layoutCache) {
          rebuildLayoutCache();
        }
        activeHitRegions = [];

        ctx.save();
        ctx.scale(dpr, dpr);

        // 1. 直接贴入离屏缓存好的主题背景（耗时 < 0.05ms）
        const bgCan = getThemeBackgroundCanvas(viewW, viewH);
        ctx.drawImage(bgCan, 0, 0, viewW, viewH);

        // 2. 直接在主画布绘制萤火微粒、满瓶飞星与礼花（0 副画布全屏拷贝！）
        drawBgStarFXDirectToCtx(ctx, viewW, viewH, nowMs);

        const cfg = getLevelConfig(currentLevelId);

        // 3. 顶部栏（使用 100% 原生 Canvas 烘焙的超椭圆折射玻璃按钮）
        if (layoutCache.settingsBtn) {
          const r = layoutCache.settingsBtn;
          const sp = getNativeGlassButtonSprite('settings-btn');
          const pressS = pressedHitId === 'settings-btn' ? 0.93 : 1.0;
          ctx.save();
          ctx.translate(r.left + r.width * 0.5, r.top + r.height * 0.5);
          ctx.scale(pressS, pressS);
          ctx.drawImage(sp, -r.width * 0.5, -r.height * 0.5, r.width, r.height);
          ctx.restore();
          registerHitRegion('settings-btn', r.left, r.top, r.width, r.height, 30, () => document.getElementById('settings-btn')?.click());
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
          registerHitRegion('rules-help-btn', r.left, r.top, r.width, r.height, 30, () => document.getElementById('rules-help-btn')?.click());
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

          // 首屏第一视觉层级：在关卡标题正下方展示清晰的【本关目标与实时进度胶囊】
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
          registerHitRegion('top-center-level-trigger', r.left - 24, r.top - 6, r.width + 48, r.height + 24, 30, () => document.getElementById('top-center-level-trigger')?.click());
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

              // 若处于装瓶回弹阶段，在袋口上方绘制摇晃的 3D 金色服务铃铛与音波
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
        const modeBannerEl = document.getElementById('mode-banner');
        if (modeBannerEl && modeBannerEl.classList.contains('show') && layoutCache.modeBanner) {
          const mr = layoutCache.modeBanner;
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(mr.left, mr.top, mr.width, mr.height, 18);
          ctx.fillStyle = 'rgba(235, 200, 140, 0.34)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          const bTxt = document.getElementById('mode-banner-text')?.textContent || '';
          const bProg = document.getElementById('mode-banner-progress')?.textContent || '';
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
        const gridEl = document.getElementById('bottles-grid');

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
              // 处于起飞倾倒或飞袋中时，强制保持静止态基准 liftY=0, scale=1.0，彻底消除落回瞬间跳动！
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
            const slotEl = gridEl ? gridEl.children[idx] : null;

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
              if (slotEl && slotEl.classList.contains('bottle-reject-shake')) {
                shakeX = Math.sin(nowMs * 0.048) * 4.8;
                shakeRad = (shakeX * 0.55 * Math.PI) / 180;
              } else if (vfxMap[idx] && vfxMap[idx].p < 0.48 && ['ice_shatter', 'ice_crack', 'stone_shatter', 'stone_hit'].includes(vfxMap[idx].vfxType)) {
                const vp = vfxMap[idx].p;
                shakeX = Math.sin(vp * Math.PI * 10) * (1 - vp * 2) * 5.2;
                shakeRad = (shakeX * 0.45 * Math.PI) / 180;
              }
              let corkScaleX = 1, corkScaleY = 1, corkTransY = 0;
              if (b.corked && typeof b.corkAnimProgress === 'number' && b.corkAnimProgress >= 0.24 && b.corkAnimProgress < 0.62) {
                const hitP = (b.corkAnimProgress - 0.24) / 0.38;
                const squash = Math.sin(hitP * Math.PI) * Math.exp(-2.2 * hitP);
                corkScaleX = 1 + squash * 0.022;
                corkScaleY = 1 - squash * 0.028;
                corkTransY = squash * 2.6;
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

            // (B) 满瓶飞向礼袋时的流光尾迹与袋口金环特效
            if (isFlyingBag && flyState) {
              const fcx = slotRect.left + slotRect.width * 0.5 + flyState.tx;
              const fcy = slotRect.top + slotRect.height * 0.5 + flyState.ty;
              ctx.save();
              for (let tr = 1; tr <= 4; tr++) {
                const ratio = 1 - tr * 0.14;
                const tx = slotRect.left + slotRect.width * 0.5 + flyState.tx * ratio;
                const ty = slotRect.top + slotRect.height * 0.5 + flyState.ty * ratio;
                drawGlowingStar2D(ctx, tx + (tr % 2 === 0 ? 8 : -8), ty, 3.8 - tr * 0.6, nowMs * 0.005 + tr, 0.75 - tr * 0.14);
              }
              ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)';
              ctx.lineWidth = 2.4;
              ctx.beginPath();
              ctx.arc(fcx, fcy, slotRect.width * 0.36 * flyState.curScale, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
            }

            // (C) 当玩家已拿起一个源水瓶时，在色锁瓶/单向瓶上方给出直观的【✓可倒入 / ✕限制原因】操作前预反馈
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

            // 受阻轻提示气泡
            if (slotEl && slotEl.children && slotEl.children.length > 2) {
              const calloutEl = slotEl.querySelector('.bottle-reject-callout');
              if (calloutEl) {
                const txt = calloutEl.textContent.trim();
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
            }
          });
        }

        // 6. 全屏倾倒水柱（支持多个水柱并行绘制）与提示弧线
        if (activePourList.length > 0) {
          activePourList.forEach(pItem => drawPourStreamAndTrailOnCanvas(ctx, pItem));
        } else if (activeHintPair) {
          drawHintGuideOnCanvas(ctx, nowMs);
        }

        // 7. 底部 5 枚超椭圆折射玻璃辅助道具按钮（图5优化：仅保留简洁清晰的单行主标题，去掉下方描述小字！）
        const dockIds = ['dock-restart-btn', 'shuffle-btn', 'undo-btn', 'hint-btn', 'add-bottle-btn'];
        const dockTitles = {
          'dock-restart-btn': '重玩',
          'shuffle-btn':      '重排',
          'undo-btn':         '撤回',
          'hint-btn':         '提示',
          'add-bottle-btn':   '+空瓶'
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

          registerHitRegion(id, r.left - 3, r.top - 3, r.width + 6, r.height + 20, 45, () => document.getElementById(id)?.click());
        });

        // 8. 弹窗面板
        drawOpenModalOnCanvas(ctx, viewW, viewH, nowMs);

        // 9. 顶部轻提示胶囊 (#toast-msg)
        const toastEl = document.getElementById('toast-msg');
        if (toastEl && toastEl.classList.contains('show')) {
          const spanEl = toastEl.querySelector('.toast-text-span');
          const txt = spanEl ? spanEl.textContent.trim() : toastEl.textContent.trim();
          if (txt) {
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
        }

        ctx.restore();
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

      canvas.addEventListener('pointerdown', (e) => {
        const hit = findTopHitRegion(e.clientX, e.clientY);
        pressedHitId = hit ? hit.id : null;
        dragScrollStartY = e.clientY;
        dragScrollMoved = false;
      });

      canvas.addEventListener('pointermove', (e) => {
        const hit = findTopHitRegion(e.clientX, e.clientY);
        canvas.style.cursor = hit ? 'pointer' : 'default';
        if (dragScrollStartY !== null) {
          const dy = e.clientY - dragScrollStartY;
          if (Math.abs(dy) > 8) {
            dragScrollMoved = true;
            pressedHitId = null;
            const lvMask = document.getElementById('level-modal-mask');
            const shopMask = document.getElementById('shop-modal-mask');
            if (lvMask && lvMask.classList.contains('show')) {
              const listEl = document.getElementById('level-grid-list');
              if (listEl) listEl.scrollTop -= dy;
              dragScrollStartY = e.clientY;
            } else if (shopMask && shopMask.classList.contains('show')) {
              const gridEl = document.getElementById('shop-grid');
              if (gridEl) gridEl.scrollTop -= dy;
              dragScrollStartY = e.clientY;
            }
          }
        }
      });

      canvas.addEventListener('pointerup', (e) => {
        const wasDragged = dragScrollMoved;
        dragScrollStartY = null;
        dragScrollMoved = false;
        pressedHitId = null;
        if (wasDragged) return;
        const hit = findTopHitRegion(e.clientX, e.clientY);
        if (hit && typeof hit.onClick === 'function') {
          hit.onClick();
        }
      });

      canvas.addEventListener('pointercancel', () => {
        pressedHitId = null;
        dragScrollStartY = null;
        dragScrollMoved = false;
      });

      canvas.addEventListener('wheel', (e) => {
        const lvMask = document.getElementById('level-modal-mask');
        const shopMask = document.getElementById('shop-modal-mask');
        if (lvMask && lvMask.classList.contains('show')) {
          const listEl = document.getElementById('level-grid-list');
          if (listEl) listEl.scrollTop += e.deltaY;
        } else if (shopMask && shopMask.classList.contains('show')) {
          const gridEl = document.getElementById('shop-grid');
          if (gridEl) gridEl.scrollTop += e.deltaY;
        }
      }, { passive: true });

      setTimeout(() => {
        rebuildLayoutCache();
        requestAnimationFrame(renderPureCanvasLoop);
      }, 0);
    })();