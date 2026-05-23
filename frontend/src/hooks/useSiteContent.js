import { useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

/**
 * Lightweight read-only hook for public CMS content.
 * Returns { data, loading, error }. If the request fails or returns
 * empty, callers should render their hard-coded fallback i18n content.
 */
export function useSiteContent(path) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    axios
      .get(`${API}/site/${path}`)
      .then((r) => {
        if (alive) setState({ data: r.data, loading: false, error: null });
      })
      .catch((err) => {
        if (alive) setState({ data: null, loading: false, error: err });
      });
    return () => { alive = false; };
  }, [path]);

  return state;
}

export const CMS_API = API;
