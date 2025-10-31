import { useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWebXRSpace } from "@/hooks/useWebXRSpace";

interface Props {
  onResult: (areaSqM: number) => void;
  autoStart?: boolean;
}

export const ARSpaceScannerWebXR = ({ onResult, autoStart }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { supported, active, result, start, stop } = useWebXRSpace();

  useEffect(() => {
    if (result) onResult(result.estimatedArea);
  }, [result, onResult]);

  useEffect(() => {
    if (autoStart && supported && !active && canvasRef.current) {
      start(canvasRef.current);
    }
  }, [autoStart, supported, active, start]);

  return (
    <div className="relative w-full h-[60vh] rounded-md overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute top-2 left-2 flex items-center gap-2">
        <Badge variant={supported ? "default" : "destructive"}>
          {supported ? "WebXR supported" : "WebXR not supported"}
        </Badge>
        {result && (
          <Badge>
            ~{result.widthMeters.toFixed(2)}m x {result.depthMeters.toFixed(2)}m (
            {result.estimatedArea.toFixed(2)} m²)
          </Badge>
        )}
      </div>

      <div className="absolute bottom-3 left-3 flex gap-2">
        {!active ? (
          <Button
            onClick={async () => {
              if (canvasRef.current) await start(canvasRef.current);
            }}
            disabled={!supported}
          >
            Start AR Scan
          </Button>
        ) : (
          <Button variant="secondary" onClick={() => stop()}>Stop</Button>
        )}
      </div>
    </div>
  );
};

export default ARSpaceScannerWebXR;


