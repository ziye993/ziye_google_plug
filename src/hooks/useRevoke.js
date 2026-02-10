import { useRef } from "react";

export default function useRevoke() {
  const idRef = useRef({});

  const addMask = (_id, timeout, cb) => {
    let id = _id;
    if (!cb) return
    if (!_id) id = Date?.now();
    idRef.current[id] = setTimeout(() => {
      cb?.(id, timeout);
      revoke(id)
    }, timeout);
  }

  const revoke = (id, cb) => {
    if (!idRef.current[id]) {
      return
    }
    clearTimeout(idRef.current[id]);
    const newData = { ...idRef.current }
    delete newData[id];
    idRef.current = newData
    cb?.(id);
  }
  const hasMask = (id) => {
    return !!idRef.current[id]
  }
  const revokeAll = () => {
    for (const key in idRef.current) {
      if (!Object.hasOwn(idRef.current, key)) continue;
      revoke(key)
    }
  }

  return { addMask, revoke, hasMask, revokeAll }
}