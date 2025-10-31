import { useCallback, useEffect, useRef, useState } from "react";

export interface WebXRSpacePoint {
  x: number;
  y: number;
  z: number;
  confidence: number;
}

export interface WebXRSpaceDetectionResult {
  widthMeters: number;
  depthMeters: number;
  estimatedArea: number;
  detectionPoints: WebXRSpacePoint[];
}

export const useWebXRSpace = () => {
  const [supported, setSupported] = useState<boolean>(false);
  const [active, setActive] = useState<boolean>(false);
  const [result, setResult] = useState<WebXRSpaceDetectionResult | null>(null);
  const xrRef = useRef<XRSession | null>(null);
  const glRef = useRef<WebGLRenderingContext | WebGL2RenderingContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const viewerSpaceRef = useRef<XRReferenceSpace | null>(null);
  const hitTestSourceRef = useRef<XRHitTestSource | null>(null);

  useEffect(() => {
    let mounted = true;
    if (navigator.xr && navigator.xr.isSessionSupported) {
      navigator.xr.isSessionSupported("immersive-ar").then((ok) => {
        if (mounted) setSupported(ok);
      }).catch(() => setSupported(false));
    }
    return () => { mounted = false; };
  }, []);

  const start = useCallback(async (canvas: HTMLCanvasElement) => {
    if (!navigator.xr) return false;
    const isSupported = await navigator.xr.isSessionSupported?.("immersive-ar").catch(() => false);
    if (!isSupported) return false;

    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test", "local-floor"],
      optionalFeatures: ["depth-sensing" as any]
    });
    xrRef.current = session;

    const gl = (canvas.getContext("webgl2", { xrCompatible: true }) || canvas.getContext("webgl", { xrCompatible: true })) as WebGLRenderingContext | WebGL2RenderingContext | null;
    if (!gl) {
      await session.end();
      xrRef.current = null;
      return false;
    }
    glRef.current = gl;

    const layer = new XRWebGLLayer(session, gl as WebGLRenderingContext);
    // @ts-expect-error layer type for TS DOM lib
    session.updateRenderState({ baseLayer: layer });

    const refSpace = await session.requestReferenceSpace("local-floor");
    viewerSpaceRef.current = await session.requestReferenceSpace("viewer");
    const hitTestSource = await session.requestHitTestSource?.({ space: viewerSpaceRef.current as XRReferenceSpace });
    hitTestSourceRef.current = hitTestSource ?? null;

    const points: WebXRSpacePoint[] = [];
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

    const onFrame = (time: DOMHighResTimeStamp, frame: XRFrame) => {
      const sessionLocal = session;
      rafRef.current = sessionLocal.requestAnimationFrame(onFrame);
      // @ts-expect-error baseLayer type in DOM lib
      const baseLayer: XRWebGLLayer = sessionLocal.renderState.baseLayer;
      if (!baseLayer || !viewerSpaceRef.current) return;
      const pose = frame.getViewerPose(refSpace);
      if (!pose) return;

      const hitSource = hitTestSourceRef.current;
      if (hitSource) {
        const hits = frame.getHitTestResults(hitSource);
        for (const hit of hits) {
          const poseHit = hit.getPose(refSpace);
          if (!poseHit) continue;
          const { x, y, z } = poseHit.transform.position;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minZ = Math.min(minZ, z);
          maxZ = Math.max(maxZ, z);
          points.push({ x, y, z, confidence: 0.9 });
        }
      }

      // compute simple bounding rectangle in X-Z plane
      if (isFinite(minX) && isFinite(maxX) && isFinite(minZ) && isFinite(maxZ)) {
        const width = Math.max(0, Math.abs(maxX - minX));
        const depth = Math.max(0, Math.abs(maxZ - minZ));
        setResult({
          widthMeters: width,
          depthMeters: depth,
          estimatedArea: width * depth,
          detectionPoints: points.slice(-200)
        });
      }
    };

    setActive(true);
    rafRef.current = session.requestAnimationFrame(onFrame);
    return true;
  }, []);

  const stop = useCallback(async () => {
    if (rafRef.current && xrRef.current) {
      xrRef.current.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (hitTestSourceRef.current) {
      hitTestSourceRef.current.cancel?.();
      hitTestSourceRef.current = null;
    }
    if (xrRef.current) {
      await xrRef.current.end().catch(() => {});
      xrRef.current = null;
    }
    glRef.current = null;
    viewerSpaceRef.current = null;
    setActive(false);
  }, []);

  return { supported, active, result, start, stop };
};


