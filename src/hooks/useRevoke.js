import { useRef } from "react";

export default function useRevoke() {
  const idRef = useRef({});

  const addMask = (id, timeout, cb) => {
    if (!cb) return
    idRef.current[id] = setTimeout(() => {
      cb?.(id, timeout); idRef.current[id] = undefined
    }, timeout);
  }

  const revoke = (id, cb) => {
    if (!idRef.current[id]) {
      return
    }
    clearTimeout(idRef.current[id]);
    idRef.current[id] = undefined
    cb?.(id);
  }
  const hasMask = (id) => {
    return !!idRef.current[id]
  }


  return { addMask, revoke, hasMask }
}