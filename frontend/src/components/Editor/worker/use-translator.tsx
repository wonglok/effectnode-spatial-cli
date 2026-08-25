import { useCallback, useEffect, useMemo, useState } from "react";
import CodeAndJSONWorker from "./code-and-json?worker";

export const useTranslationService = () => {
  let [worker, setWorker] = useState<any>();

  const mapID = useMemo(() => {
    return new Map();
  }, []);

  useEffect(() => {
    const worker = new CodeAndJSONWorker();

    worker.addEventListener("message", ({ data: rawData }) => {
      const data = JSON.parse(rawData);

      const api = mapID.get(data.id);

      if (api) {
        if (data.ok) {
          api.resolve(data.result);
        } else {
          api.reject(data.result);
        }
      }
    });
    setWorker(worker);
  }, []);

  const translateAsync = useCallback(
    (code: string) => {
      if (!worker) {
        return;
      }
      const id = crypto.randomUUID();

      worker.postMessage(
        JSON.stringify({
          id,
          code: `${code}`,
        }),
      );

      return new Promise((resolve, reject) => {
        mapID.set(id, { resolve, reject });
      });
    },
    [worker, mapID],
  );

  return {
    //
    translateAsync,
    //
  };
  //
  //
};
