export type SceneNodeType =
  | "group"
  | "mesh"
  | "geometry"
  | "material"
  | "light"
  | "camera"
  | "model"
  | "environment";

export interface SceneNode {
  id: string;
  name: string;
  type: SceneNodeType;
  params?: Record<string, unknown>;
  children?: SceneNode[];
}
