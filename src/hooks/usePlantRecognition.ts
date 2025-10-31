import { useCallback, useState } from "react";

export interface PlantPrediction {
  name: string;
  probability: number;
}

export const usePlantRecognition = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PlantPrediction[] | null>(null);

  const identify = useCallback(async (dataUrl: string) => {
    setLoading(true);
    setError(null);
    setPredictions(null);
    try {
      const apiKey = import.meta.env.VITE_PLANT_ID_API_KEY;
      if (!apiKey) throw new Error("Missing VITE_PLANT_ID_API_KEY");

      const base64 = dataUrl.split(",")[1] || dataUrl;
      const res = await fetch("https://api.plant.id/v3/identification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": apiKey
        },
        body: JSON.stringify({
          images: [base64],
          modifiers: ["similar_images"],
          plant_language: "en",
          plant_details: ["common_names", "url", "taxonomy"]
        })
      });
      if (!res.ok) throw new Error(`Plant.id error ${res.status}`);
      const data = await res.json();
      const preds: PlantPrediction[] = (data?.result?.classification?.suggestions || []).map((s: any) => ({
        name: s.name as string,
        probability: s.probability as number
      }));
      setPredictions(preds);
      return preds;
    } catch (e: any) {
      setError(e?.message || "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, predictions, identify };
};


