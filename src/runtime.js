// Minimal template runtime for Better Days.
// Reads the app's HTML template ({{holes}}, <sc-if>, <sc-for>) and keeps the screen in sync
// with the app's state using a small virtual-DOM patcher. No libraries, works offline.
(function () {
  'use strict';

  // ---------- compile the template ----------
  function compile(node) {
    if (node.nodeType === 3) {
      const t = node.nodeValue;
      if (!t.trim() && !/\S/.test(t)) return t.includes('\n') ? null : { k: 'text', parts: parseParts(t) };
      return { k: 'text', parts: parseParts(t) };
    }
    if (node.nodeType !== 1) return null;
    const tag = node.localName;
    const kids = [];
    const src = node.content ? node.content.childNodes : node.childNodes;
    for (let i = 0; i < src.length; i++) { const c = compile(src[i]); if (c) kids.push(c); }
    if (tag === 'sc-if') return { k: 'if', cond: parseParts(node.getAttribute('value') || ''), kids: kids };
    if (tag === 'sc-for') return { k: 'for', list: parseParts(node.getAttribute('list') || ''), as: node.getAttribute('as') || 'item', kids: kids };
    const attrs = [];
    for (let i = 0; i < node.attributes.length; i++) {
      const a = node.attributes[i];
      if (a.name.indexOf('hint-') === 0) continue;
      attrs.push({ name: a.name, parts: parseParts(a.value) });
    }
    return { k: 'el', tag: tag, ns: node.namespaceURI, attrs: attrs, kids: kids };
  }
  function parseParts(s) {
    const out = []; const re = /\{\{\s*([^}]+?)\s*\}\}/g; let last = 0, m;
    while ((m = re.exec(s))) { if (m.index > last) out.push(s.slice(last, m.index)); out.push({ p: m[1] }); last = re.lastIndex; }
    if (last < s.length) out.push(s.slice(last));
    return out;
  }
  function lookup(path, scope) {
    if (path === 'true') return true; if (path === 'false') return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return parseFloat(path);
    const segs = path.split('.'); let v;
    for (let i = scope.length - 1; i >= 0; i--) { if (scope[i] && Object.prototype.hasOwnProperty.call(scope[i], segs[0])) { v = scope[i][segs[0]]; break; } }
    for (let j = 1; j < segs.length && v != null; j++) v = v[segs[j]];
    return v;
  }
  function evalParts(parts, scope) {
    if (parts.length === 1 && typeof parts[0] === 'object') return lookup(parts[0].p, scope);
    let s = '';
    for (let i = 0; i < parts.length; i++) { const p = parts[i]; if (typeof p === 'string') s += p; else { const v = lookup(p.p, scope); s += v == null ? '' : v; } }
    return s;
  }

  // ---------- template -> virtual nodes ----------
  function build(tnodes, scope, out) {
    for (let i = 0; i < tnodes.length; i++) {
      const t = tnodes[i];
      if (t.k === 'text') { out.push({ text: String(evalParts(t.parts, scope) == null ? '' : evalParts(t.parts, scope)) }); }
      else if (t.k === 'if') { if (evalParts(t.cond, scope)) build(t.kids, scope, out); }
      else if (t.k === 'for') {
        const list = evalParts(t.list, scope) || [];
        for (let j = 0; j < list.length; j++) { const o = {}; o[t.as] = list[j]; o.$index = j; build(t.kids, scope.concat([o]), out); }
      } else {
        const v = { tag: t.tag, ns: t.ns, attrs: {}, ev: {}, kids: [] };
        for (let j = 0; j < t.attrs.length; j++) {
          const a = t.attrs[j]; const val = evalParts(a.parts, scope);
          if (a.name.indexOf('on') === 0 && a.name.length > 2) { if (typeof val === 'function') v.ev[eventName(a.name, t)] = val; }
          else v.attrs[a.name] = val;
        }
        build(t.kids, scope, v.kids);
        out.push(v);
      }
    }
    return out;
  }
  function eventName(attr, t) {
    const n = attr.slice(2).toLowerCase();
    if (n === 'change') {
      const typeAttr = t.attrs.filter(function (a) { return a.name === 'type'; })[0];
      const type = typeAttr ? typeAttr.parts.join('') : '';
      if (t.tag === 'textarea' || (t.tag === 'input' && (type === 'text' || type === ''))) return 'input';
    }
    return n;
  }

  // ---------- patch the real DOM ----------
  function create(v) {
    if (v.text != null) return document.createTextNode(v.text);
    const el = v.ns && v.ns !== 'http://www.w3.org/1999/xhtml' ? document.createElementNS(v.ns, v.tag) : document.createElement(v.tag);
    el.__ev = {};
    updateProps(el, {}, v);
    for (let i = 0; i < v.kids.length; i++) el.appendChild(create(v.kids[i]));
    setValue(el, v);
    el.__v = v;
    return el;
  }
  function updateProps(el, oldA, v) {
    const na = v.attrs;
    for (const k in oldA) if (!(k in na)) { if (k !== 'value') el.removeAttribute(k); }
    for (const k in na) {
      const val = na[k];
      if (k === 'value') continue;
      if (val === false || val == null) { if (el.hasAttribute(k)) el.removeAttribute(k); continue; }
      const s = val === true ? '' : String(val);
      if (el.getAttribute(k) !== s) el.setAttribute(k, s);
    }
    const oldEv = el.__ev || {}; el.__ev = el.__ev || {};
    for (const e in oldEv) if (!v.ev[e]) { el.removeEventListener(e, oldEv[e].l); delete el.__ev[e]; }
    for (const e in v.ev) {
      if (el.__ev[e]) { el.__ev[e].fn = v.ev[e]; continue; }
      const rec = { fn: v.ev[e] }; rec.l = function (ev) { rec.fn(ev); };
      el.addEventListener(e, rec.l); el.__ev[e] = rec;
    }
  }
  function setValue(el, v) {
    if (!('value' in v.attrs)) return;
    const val = v.attrs.value == null ? '' : String(v.attrs.value);
    if (el.value !== val) el.value = val;
  }
  function patch(parent, oldKids, newKids) {
    const nodes = parent.childNodes;
    for (let i = 0; i < newKids.length; i++) {
      const nv = newKids[i], ov = oldKids[i], node = nodes[i];
      if (!ov || !node) { parent.appendChild(create(nv)); continue; }
      const sameText = nv.text != null && ov.text != null;
      if (sameText) { if (node.nodeValue !== nv.text) node.nodeValue = nv.text; continue; }
      if (nv.text != null || ov.text != null || nv.tag !== ov.tag) { parent.replaceChild(create(nv), node); continue; }
      updateProps(node, ov.attrs, nv);
      patch(node, ov.kids, nv.kids);
      setValue(node, nv);
      node.__v = nv;
    }
    while (parent.childNodes.length > newKids.length) parent.removeChild(parent.lastChild);
  }

  // ---------- component shim (same API the app logic uses) ----------
  window.DCLogic = class DCLogic {
    constructor(props) { this.props = props || {}; this.state = {}; }
    setState(p) {
      const upd = typeof p === 'function' ? p(this.state) : p;
      this.state = Object.assign({}, this.state, upd);
      if (this.__mount) this.__mount.schedule();
    }
    forceUpdate() { if (this.__mount) this.__mount.schedule(); }
  };

  window.mountApp = function (Comp, templateEl, root, afterRender) {
    const tree = []; const src = templateEl.content.childNodes;
    for (let i = 0; i < src.length; i++) { const c = compile(src[i]); if (c) tree.push(c); }
    const inst = new Comp({});
    let old = []; let queued = false;
    const m = {
      schedule: function () { if (queued) return; queued = true; Promise.resolve().then(m.render); },
      render: function () {
        queued = false;
        const vals = inst.renderVals();
        const nv = build(tree, [vals], []);
        patch(root, old, nv); old = nv;
        if (afterRender) afterRender(inst);
      }
    };
    inst.__mount = m;
    m.render();
    if (inst.componentDidMount) inst.componentDidMount();
    return inst;
  };
})();
