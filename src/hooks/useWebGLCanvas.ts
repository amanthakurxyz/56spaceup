import { useEffect, useRef, useState, useCallback } from 'react';
import { vertexShaderSource as gridVertexSrc, fragmentShaderSource as gridFragmentSrc } from './dotGrid.glsl';
import { imageVertexShaderSource, imageFragmentShaderSource, m3 } from './imageShader.glsl';
import { lineVertexShaderSource, lineFragmentShaderSource } from './lineShader.glsl';
import { useAppStore } from '@/store/useAppStore';

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

// Global texture cache to prevent reloading images constantly
const textureCache = new Map<string, { texture: WebGLTexture, width: number, height: number }>();

export function useWebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const setActiveContext = useAppStore((state) => state.setActiveContext);
  
  // Mutable state prevents React re-renders on every frame
  const renderState = useRef({
    offset: { x: 0, y: 0 },
    targetOffset: { x: 0, y: 0 },
    zoom: 1,
    targetZoom: 1,
    isDragging: false,
    lastPointer: { x: 0, y: 0 },
    needsRender: true,
    gl: null as WebGL2RenderingContext | null,
    maskCache: new Map<string, WebGLTexture>(),
    dragNodeId: null as string | null,
  });

  const resetView = useCallback(() => {
    renderState.current.targetOffset = { x: 0, y: 0 };
    renderState.current.targetZoom = 1;
    renderState.current.needsRender = true;
    setZoomLevel(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const getMaskData = useCallback((nodeId: string): string | null => {
    const gl = renderState.current.gl;
    if (!gl || !renderState.current.maskCache.has(nodeId)) return null;

    const maskTex = renderState.current.maskCache.get(nodeId)!;
    const nodes = useAppStore.getState().nodes;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, maskTex, 0);

    const width = Math.floor(node.width);
    const height = Math.floor(node.height);
    const data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.deleteFramebuffer(fb);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;

    const imageData = ctx.createImageData(width, height);
    imageData.data.set(data);
    ctx.putImageData(imageData, 0, 0);
    return tempCanvas.toDataURL('image/png');
  }, []);

  const clearMask = useCallback((nodeId: string) => {
    const gl = renderState.current.gl;
    if (!gl || !renderState.current.maskCache.has(nodeId)) return;
    const maskTex = renderState.current.maskCache.get(nodeId)!;
    const nodes = useAppStore.getState().nodes;
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    gl.bindTexture(gl.TEXTURE_2D, maskTex);
    const data = new Uint8Array(Math.floor(node.width) * Math.floor(node.height) * 4).fill(0);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Math.floor(node.width), Math.floor(node.height), 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    renderState.current.needsRender = true;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false });
    if (!gl) return;
    renderState.current.gl = gl;

    const vGrid = createShader(gl, gl.VERTEX_SHADER, gridVertexSrc);
    const fGrid = createShader(gl, gl.FRAGMENT_SHADER, gridFragmentSrc);
    const gridProgram = vGrid && fGrid ? createProgram(gl, vGrid, fGrid) : null;
    
    const vImg = createShader(gl, gl.VERTEX_SHADER, imageVertexShaderSource);
    const fImg = createShader(gl, gl.FRAGMENT_SHADER, imageFragmentShaderSource);
    const imgProgram = vImg && fImg ? createProgram(gl, vImg, fImg) : null;

    const vLine = createShader(gl, gl.VERTEX_SHADER, lineVertexShaderSource);
    const fLine = createShader(gl, gl.FRAGMENT_SHADER, lineFragmentShaderSource);
    const lineProgram = vLine && fLine ? createProgram(gl, vLine, fLine) : null;

    if (!gridProgram || !imgProgram || !lineProgram) return;

    const gridPosLoc = gl.getAttribLocation(gridProgram, 'a_position');
    const uGridRes = gl.getUniformLocation(gridProgram, 'uResolution');
    const uGridOffset = gl.getUniformLocation(gridProgram, 'uOffset');
    const uGridZoom = gl.getUniformLocation(gridProgram, 'uZoom');
    const uGridSpacing = gl.getUniformLocation(gridProgram, 'uGridSpacing');
    const uDotRadius = gl.getUniformLocation(gridProgram, 'uDotRadius');
    const uDotColor = gl.getUniformLocation(gridProgram, 'uDotColor');

    const imgPosLoc = gl.getAttribLocation(imgProgram, 'a_position');
    const imgTexLoc = gl.getAttribLocation(imgProgram, 'a_texCoord');
    const uImgMatrix = gl.getUniformLocation(imgProgram, 'u_matrix');
    const uImgTex = gl.getUniformLocation(imgProgram, 'u_image');
    const uImgMask = gl.getUniformLocation(imgProgram, 'u_mask');
    const uImgAlpha = gl.getUniformLocation(imgProgram, 'u_alpha');
    const uImgSelected = gl.getUniformLocation(imgProgram, 'u_isSelected');
    const uImgShowMask = gl.getUniformLocation(imgProgram, 'u_showMask');

    const linePosLoc = gl.getAttribLocation(lineProgram, 'a_position');
    const uLineMatrix = gl.getUniformLocation(lineProgram, 'u_matrix');
    const uLineColor = gl.getUniformLocation(lineProgram, 'u_color');

    const gridVao = gl.createVertexArray();
    gl.bindVertexArray(gridVao);
    const gridBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(gridPosLoc);
    gl.vertexAttribPointer(gridPosLoc, 2, gl.FLOAT, false, 0, 0);

    const imgVao = gl.createVertexArray();
    gl.bindVertexArray(imgVao);
    const imgPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, imgPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(imgPosLoc);
    gl.vertexAttribPointer(imgPosLoc, 2, gl.FLOAT, false, 0, 0);

    const imgTexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, imgTexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(imgTexLoc);
    gl.vertexAttribPointer(imgTexLoc, 2, gl.FLOAT, false, 0, 0);

    const lineVao = gl.createVertexArray();
    gl.bindVertexArray(lineVao);
    const lineOffsetBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, lineOffsetBuffer);
    gl.enableVertexAttribArray(linePosLoc);
    gl.vertexAttribPointer(linePosLoc, 2, gl.FLOAT, false, 0, 0);

    const createMaskTexture = (width: number, height: number) => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(width * height * 4));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return tex;
    };

    let animationFrameId: number;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      
      const dx = Math.abs(renderState.current.offset.x - renderState.current.targetOffset.x);
      const dy = Math.abs(renderState.current.offset.y - renderState.current.targetOffset.y);
      const dz = Math.abs(renderState.current.zoom - renderState.current.targetZoom);
      
      if (dx > 0.01 || dy > 0.01 || dz > 0.001) {
        renderState.current.offset.x = lerp(renderState.current.offset.x, renderState.current.targetOffset.x, 0.2);
        renderState.current.offset.y = lerp(renderState.current.offset.y, renderState.current.targetOffset.y, 0.2);
        renderState.current.zoom = lerp(renderState.current.zoom, renderState.current.targetZoom, 0.2);
        
        // Sync React state for UI components
        setZoomLevel(renderState.current.zoom);
        setOffset({ ...renderState.current.offset });
        
        renderState.current.needsRender = true;
      }

      if (!renderState.current.needsRender) return;

      const dpr = window.devicePixelRatio;
      const displayWidth = Math.floor(canvas.clientWidth * dpr);
      const displayHeight = Math.floor(canvas.clientHeight * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth; canvas.height = displayHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
      }

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Grid
      gl.useProgram(gridProgram);
      gl.bindVertexArray(gridVao);
      gl.uniform2f(uGridRes, canvas.width, canvas.height);
      gl.uniform2f(uGridOffset, renderState.current.offset.x * dpr, renderState.current.offset.y * dpr);
      gl.uniform1f(uGridZoom, renderState.current.zoom);
      gl.uniform1f(uGridSpacing, 40.0 * dpr);
      const isDark = document.documentElement.classList.contains('dark');
      // Increased grid visibility to 0.6
      gl.uniform4fv(uDotColor, isDark ? [1,1,1,0.6] : [0,0,0,0.6]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      const nodes = useAppStore.getState().nodes;
      const activeContext = useAppStore.getState().activeContext;
      const projectionMat = m3.projection(canvas.clientWidth, canvas.clientHeight);

      // Lines
      gl.useProgram(lineProgram);
      gl.bindVertexArray(lineVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineOffsetBuffer);
      const edges = useAppStore.getState().edges;
      for (const edge of edges) {
        const source = nodes.find(n => n.id === edge.sourceId);
        const target = nodes.find(n => n.id === edge.targetId);
        if (source && target) {
          const sX = (source.x + source.width/2) * renderState.current.zoom + renderState.current.offset.x;
          const sY = (source.y + source.height/2) * renderState.current.zoom + renderState.current.offset.y;
          const tX = (target.x + target.width/2) * renderState.current.zoom + renderState.current.offset.x;
          const tY = (target.y + target.height/2) * renderState.current.zoom + renderState.current.offset.y;
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([sX, sY, tX, tY]), gl.DYNAMIC_DRAW);
          gl.uniformMatrix3fv(uLineMatrix, false, projectionMat);
          gl.uniform4fv(uLineColor, isDark ? [1,1,1,0.5] : [0,0,0,0.5]);
          gl.drawArrays(gl.LINES, 0, 2);
        }
      }

      // Nodes
      gl.useProgram(imgProgram);
      gl.bindVertexArray(imgVao);
      for (const node of nodes) {
        if (!textureCache.has(node.url)) {
          const tex = gl.createTexture();
          textureCache.set(node.url, { texture: tex!, width: 1, height: 1 });
          const img = new Image(); img.crossOrigin = 'anonymous'; img.src = node.url;
          img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, tex!);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            textureCache.set(node.url, { texture: tex!, width: img.width, height: img.height });
            renderState.current.needsRender = true;
          };
        }
        const texData = textureCache.get(node.url);
        if (texData && texData.width > 1) {
          const sX = node.x * renderState.current.zoom + renderState.current.offset.x;
          const sY = node.y * renderState.current.zoom + renderState.current.offset.y;
          const sW = node.width * renderState.current.zoom;
          const sH = node.height * renderState.current.zoom;
          let mat = m3.multiply(projectionMat, m3.translation(sX, sY));
          mat = m3.multiply(mat, m3.scaling(sW, sH));
          gl.uniformMatrix3fv(uImgMatrix, false, mat);
          gl.uniform1f(uImgAlpha, 1.0);
          gl.uniform1f(uImgSelected, node.id === activeContext ? 1.0 : 0.0);
          gl.uniform1f(uImgShowMask, useAppStore.getState().activeTool === 'brush' ? 1.0 : 0.0);
          gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texData.texture); gl.uniform1i(uImgTex, 0);
          if (!renderState.current.maskCache.has(node.id)) {
            const mTex = createMaskTexture(texData.width, texData.height);
            if (mTex) renderState.current.maskCache.set(node.id, mTex);
          }
          const mTex = renderState.current.maskCache.get(node.id);
          if (mTex) { gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mTex); gl.uniform1i(uImgMask, 1); }
          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
      }
      renderState.current.needsRender = false;
    };
    render();

    const unsubStore = useAppStore.subscribe(() => { renderState.current.needsRender = true; });

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const wX = (x - renderState.current.offset.x) / renderState.current.zoom;
      const wY = (y - renderState.current.offset.y) / renderState.current.zoom;
      const nodes = useAppStore.getState().nodes;

      if (e.button === 2) {
        // Right-click always pans
        renderState.current.isDragging = true;
        renderState.current.dragNodeId = null;
      } else {
        let hit = null;
        for (let i = nodes.length - 1; i >= 0; i--) {
          const n = nodes[i]; if (wX >= n.x && wX <= n.x + n.width && wY >= n.y && wY <= n.y + n.height) { hit = n.id; break; }
        }
        setActiveContext(hit);
        renderState.current.isDragging = true;
        renderState.current.dragNodeId = hit;
      }
      renderState.current.lastPointer = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const tool = useAppStore.getState().activeTool;
      canvas.style.cursor = tool === 'brush' ? 'crosshair' : 'default';
      if (!renderState.current.isDragging) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const wX = (x - renderState.current.offset.x) / renderState.current.zoom;
      const wY = (y - renderState.current.offset.y) / renderState.current.zoom;

      if (tool === 'brush') {
        const nodes = useAppStore.getState().nodes;
        const n = nodes.find(n => wX >= n.x && wX <= n.x + n.width && wY >= n.y && wY <= n.y + n.height);
        if (n && renderState.current.maskCache.has(n.id)) {
          const texData = textureCache.get(n.url);
          if (texData) {
            const lX = Math.floor(((wX - n.x) / n.width) * texData.width);
            const lY = Math.floor(((wY - n.y) / n.height) * texData.height);
            const r = Math.floor(useAppStore.getState().brushSize / 2);
            gl.bindTexture(gl.TEXTURE_2D, renderState.current.maskCache.get(n.id)!);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, Math.max(0, lX-r), Math.max(0, lY-r), Math.min(r*2, texData.width-lX+r), Math.min(r*2, texData.height-lY+r), gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(r*r*16).fill(255));
            renderState.current.needsRender = true;
          }
        }
      } else if (renderState.current.dragNodeId) {
        const dx = (e.clientX - renderState.current.lastPointer.x) / renderState.current.zoom;
        const dy = (e.clientY - renderState.current.lastPointer.y) / renderState.current.zoom;
        const n = useAppStore.getState().nodes.find(n => n.id === renderState.current.dragNodeId);
        if (n) useAppStore.getState().updateNode(n.id, { x: n.x + dx, y: n.y + dy });
      } else {
        renderState.current.targetOffset.x += e.clientX - renderState.current.lastPointer.x;
        renderState.current.targetOffset.y += e.clientY - renderState.current.lastPointer.y;
      }
      renderState.current.lastPointer = { x: e.clientX, y: e.clientY };
      renderState.current.needsRender = true;
    };

    const onPointerUp = (e: PointerEvent) => { 
      renderState.current.isDragging = false; 
      renderState.current.dragNodeId = null; 
      canvas.releasePointerCapture(e.pointerId);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const wX = (x - renderState.current.offset.x) / renderState.current.zoom;
      const wY = (y - renderState.current.offset.y) / renderState.current.zoom;

      const delta = -e.deltaY * 0.001;
      let newZoom = renderState.current.targetZoom * Math.exp(delta);
      newZoom = Math.max(0.05, Math.min(newZoom, 20));

      renderState.current.targetZoom = newZoom;
      renderState.current.targetOffset.x = x - wX * newZoom;
      renderState.current.targetOffset.y = y - wY * newZoom;
      renderState.current.needsRender = true;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    // Prevent context menu to allow right-click pan
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    return () => {
      unsubStore(); cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      if (gridProgram) gl.deleteProgram(gridProgram);
      if (imgProgram) gl.deleteProgram(imgProgram);
      if (lineProgram) gl.deleteProgram(lineProgram);
    };
  }, [setActiveContext]);

  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      useAppStore.getState().setGetMaskData(getMaskData);
      useAppStore.getState().setClearMask(clearMask);
      initialized.current = true;
    }
  }, [getMaskData, clearMask]);

  const getScreenPos = useCallback((x: number, y: number) => ({
    x: x * renderState.current.zoom + renderState.current.offset.x,
    y: y * renderState.current.zoom + renderState.current.offset.y
  }), []);

  const getEdgeScreenPos = useCallback((edgeId: string) => {
    const edge = useAppStore.getState().edges.find(e => e.id === edgeId);
    if (!edge) return null;
    const s = useAppStore.getState().nodes.find(n => n.id === edge.sourceId);
    const t = useAppStore.getState().nodes.find(n => n.id === edge.targetId);
    if (!s || !t) return null;
    return getScreenPos((s.x+s.width/2 + t.x+t.width/2)/2, (s.y+s.height/2 + t.y+t.height/2)/2);
  }, [getScreenPos]);

  return { 
    canvasRef, 
    zoomLevel: zoomLevel, 
    offset: offset, 
    isPanning: isPanning, 
    resetView, 
    getScreenPos, 
    getEdgeScreenPos, 
    getMaskData, 
    clearMask 
  };
}
