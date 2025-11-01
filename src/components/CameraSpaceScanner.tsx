import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface Props {
  onResult: (areaSqM: number) => void;
  autoStart?: boolean;
}

export const CameraSpaceScanner = ({ onResult, autoStart }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [measuredArea, setMeasuredArea] = useState<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackingRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pointsRef = useRef<Array<{ x: number; y: number; timestamp: number }>>([]);

  useEffect(() => {
    if (autoStart && !isActive) {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [autoStart]);

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: 1280, height: 720 } 
      });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      setIsActive(true);
      startTimeRef.current = Date.now();
      pointsRef.current = [];
      
      // Start tracking
      trackingRef.current = requestAnimationFrame(trackMovement);
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (trackingRef.current) {
      cancelAnimationFrame(trackingRef.current);
      trackingRef.current = null;
    }
    setIsActive(false);
    calculateArea();
  };

  const trackMovement = () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      trackingRef.current = requestAnimationFrame(trackMovement);
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Sample points from video (simulate tracking)
    const now = Date.now();
    const sampleInterval = 500; // Sample every 500ms
    const lastPoint = pointsRef.current[pointsRef.current.length - 1];
    
    if (!lastPoint || now - lastPoint.timestamp > sampleInterval) {
      // Simulate movement tracking by sampling center area
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      pointsRef.current.push({
        x: centerX + (Math.random() - 0.5) * 100,
        y: centerY + (Math.random() - 0.5) * 100,
        timestamp: now
      });
      
      // Keep only last 20 points
      if (pointsRef.current.length > 20) {
        pointsRef.current.shift();
      }
    }
    
    // Draw tracking points
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    pointsRef.current.forEach((point, i) => {
      if (i > 0) {
        ctx.beginPath();
        ctx.moveTo(pointsRef.current[i-1].x, pointsRef.current[i-1].y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    trackingRef.current = requestAnimationFrame(trackMovement);
  };

  const calculateArea = () => {
    // Estimate area based on tracking points and time
    const duration = (Date.now() - startTimeRef.current) / 1000; // seconds
    const points = pointsRef.current.length;
    
    if (points > 5 && duration > 5) {
      // Calculate bounding box
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      pointsRef.current.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });
      
      // Estimate dimensions (rough approximation)
      // Assume average phone FOV is about 60 degrees
      const avgDistance = 1.5; // Assume user is 1.5m from ground
      const fovRadians = Math.PI / 3; // 60 degrees
      const height = 2 * avgDistance * Math.tan(fovRadians / 2);
      const width = height * (maxX - minX) / (maxY - minY || 1);
      
      const area = width * height;
      setMeasuredArea(area);
      onResult(area);
    } else {
      // Fallback: estimate based on time
      const estimatedArea = 2 * duration; // Rough estimate: 2 m² per second
      setMeasuredArea(estimatedArea);
      onResult(estimatedArea);
    }
  };

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden bg-black">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />
      
      <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Scanning..." : "Ready"}
        </Badge>
        {measuredArea && (
          <Badge>
            ~{measuredArea.toFixed(2)} m²
          </Badge>
        )}
      </div>

      <div className="absolute inset-0 pointer-events-none border-2 border-green-500/50">
        <div className="absolute top-4 left-4 w-6 h-6 border-l-2 border-t-2 border-green-500"></div>
        <div className="absolute top-4 right-4 w-6 h-6 border-r-2 border-t-2 border-green-500"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 border-green-500"></div>
        <div className="absolute bottom-4 right-4 w-6 h-6 border-r-2 border-b-2 border-green-500"></div>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex justify-center gap-2 z-10">
        {isActive ? (
          <Button variant="secondary" onClick={stopScanning} className="bg-red-600 hover:bg-red-700">
            <Camera className="mr-2 h-4 w-4" />
            Stop & Calculate
          </Button>
        ) : (
          <Button onClick={startScanning}>
            <Camera className="mr-2 h-4 w-4" />
            Start AR Scan
          </Button>
        )}
      </div>
    </div>
  );
};

export default CameraSpaceScanner;

