export type SceneNodeType =
  | "group"
  | "mesh"
  | "geometry"
  | "material"
  | "light"
  | "model";

export interface SceneNode {
  id: string;
  name: string;
  type: SceneNodeType;
  params?: Record<string, unknown>;
  children?: SceneNode[];
}
