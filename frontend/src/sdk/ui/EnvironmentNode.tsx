import { useEffect } from "react";
import * as THREE from "three/webgpu";
import { useLoader, useThree } from "@react-three/fiber";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

/**
 * Loads an HDR equirectangular environment map and applies it as both the
 * scene environment (image-based lighting) and background, with adjustable
 * environmentIntensity / backgroundIntensity.
 */
export function EnvironmentNode({
  src,
  environmentIntensity = 1,
  backgroundIntensity = 1,
  useEnvironment = true,
  useBackground = true,
}: {
  src: string;
  environmentIntensity?: number;
  backgroundIntensity?: number;
  useEnvironment?: boolean;
  useBackground?: boolean;
}) {
  const scene = useThree((state) => state.scene);
  const texture = useLoader(RGBELoader, src);

  useEffect(() => {
    texture.mapping = THREE.EquirectangularReflectionMapping;

    if (useEnvironment) {
      scene.environment = texture;
      scene.environmentIntensity = environmentIntensity;
    }
    if (useBackground) {
      scene.background = texture;
      scene.backgroundIntensity = backgroundIntensity;
    }

    return () => {
      if (scene.environment === texture) scene.environment = null;
      if (scene.background === texture) scene.background = null;
    };
  }, [
    scene,
    texture,
    environmentIntensity,
    backgroundIntensity,
    useEnvironment,
    useBackground,
  ]);

  return null;
}
