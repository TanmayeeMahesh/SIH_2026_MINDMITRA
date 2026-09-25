import React, { useEffect, useState } from 'react';
import { photoURL } from '../store/db.js';

/** Async photo loader. Falls back to a large initial so a missing photo never
 *  produces an empty box — a blank card reads as broken to an elderly user.
 *
 *  `src` is for static content-pack images (T3 regional-default pack, shipped
 *  under public/content/) — a plain URL, no IndexedDB lookup needed. `id` is
 *  for caregiver-uploaded photo Blobs (T1). If both are given, `src` wins. */
export default function Photo({ id, name = '', className = '', alt, src }) {
  const [url, setUrl] = useState(src || null);
  useEffect(() => {
    if (src) { setUrl(src); return; }
    let live = true; photoURL(id).then((u) => live && setUrl(u)); return () => { live = false; };
  }, [id, src]);

  if (url) return <img className={className} src={url} alt={alt ?? name} />;
  return (
    <div className={className || 'ph'} role="img" aria-label={alt ?? name}>
      <span aria-hidden="true">{name ? name.trim()[0].toUpperCase() : '🙂'}</span>
    </div>
  );
}
