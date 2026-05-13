import { useEffect } from "react";

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Jeevika` : "Jeevika | Finding Work. Finding Workers.";
  }, [title]);
}
