import { ReactNode } from "react";

export function ColumnLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="w-full h-full overflow-y-scroll px-12 pt-12">
      {children}
    </div>
  );
}
