import { useEffect, useState } from "react";
import { loadEventTexts } from "../../../utils/uploadAsset";

const ARScene = ({ eventSlug, isActive = true, onSceneReady }) => {
  const [arAsset, setArAsset] = useState("glasses");
    const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  }, []);
  
  useEffect(() => {
    const loadARConfig = async () => {
      const texts = await loadEventTexts(eventSlug);
      setArAsset(texts.arAsset || "glasses");
    };
    loadARConfig();
  }, [eventSlug]);

  useEffect(() => {
    const scene = document.querySelector("a-scene");
    if (scene) {
      scene.addEventListener("loaded", () => {
        const system = scene.systems["mindar-face-system"];
        if (system) {
          if (isActive) {
            system.start();
          }
          if (onSceneReady) {
            onSceneReady(system);
          }
        }
      });
    }
  }, [isActive, onSceneReady]);

  const startAR = () => {
    const scene = document.querySelector("a-scene");
    if (scene) {
      const system = scene.systems["mindar-face-system"];
      if (system) {
        system.start();
      }
    }
  };

  const stopAR = () => {
    const scene = document.querySelector("a-scene");
    if (scene) {
      const system = scene.systems["mindar-face-system"];
      if (system) {
        system.stop();
      }
    }
  };

  const getARCanvas = () => {
    const arScene = document.querySelector("a-scene");
    if (!arScene) return null;
    return arScene.canvas || arScene.renderer?.domElement;
  };

  // Expose methods via ref if needed
  ARScene.start = startAR;
  ARScene.stop = stopAR;
  ARScene.getCanvas = getARCanvas;

  return (
    <>
      <style>{`
        .ar-scene video {
          display: none !important;
        }
        .ar-scene canvas {
          background: transparent !important;
        }
        .ar-scene a-scene {
          background: transparent !important;
        }
      `}</style>

      <div className="ar-scene absolute inset-0 w-full h-full" style={{ zIndex: 10, pointerEvents: 'none' }}>
        <a-scene
          mindar-face="autoStart: false"
          embedded
          color-space="sRGB"
          renderer="colorManagement: true, physicallyCorrectLights: true, preserveDrawingBuffer: true, alpha: true"
          vr-mode-ui="enabled: false"
          device-orientation-permission-ui="enabled: false"
          style={{ background: 'transparent' }}
        >
          <a-assets>
            <a-asset-item id="glasses" src="/assets/glasses/scene.gltf"></a-asset-item>
            <a-asset-item id="hat" src="/assets/hat/scene.gltf"></a-asset-item>
            <a-asset-item id="mustashe" src="/assets/mustashe/scene.gltf"></a-asset-item>
          </a-assets>
          <a-entity mindar-face-target="anchorIndex: 168">
            {arAsset === 'glasses' && (
              <a-gltf-model rotation="0 0 0" position="0 0 -0.05" scale="0.135 0.135 0.135" src="#glasses"></a-gltf-model>
            )}
            {arAsset === 'hat' && (
              <a-gltf-model rotation="0 0 0" position="0 0.25 -0.45" scale="1.3 1.3 1.3" src="#hat"></a-gltf-model>
            )}
            {arAsset === 'mustashe' && (
              <a-gltf-model rotation="0 0 0" position="0 -0.37 -0.05" scale="0.001 0.001 0.001" src="#mustashe"></a-gltf-model>
            )}
          </a-entity>
          <a-camera active="false" position="0 0 0" look-controls="enabled: false" wasd-controls="enabled: false"></a-camera>
        </a-scene>
      </div>
    </>
  );
};

export default ARScene;
