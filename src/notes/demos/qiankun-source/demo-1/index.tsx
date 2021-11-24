import React, { useRef, useState } from 'react';
import { mountEntry } from './mini-qiankun';

const VUE_ENTRY = 'https://linyun-git.github.io/mini-qiankun-demos/vue-demo/';
const REACT_ENTRY =
  'https://linyun-git.github.io/mini-qiankun-demos/react-demo/';

export default () => {
  const [mounting, setMounting] = useState(false);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMount = (entry: string) => {
    if (!entry) {
      [...containerRef.current!.children].forEach((child) => child.remove());
      return;
    }
    setMounting(true);
    const renderContainer = document.createElement('div');
    [...containerRef.current!.children].forEach((child) => child.remove());
    containerRef.current!.appendChild(renderContainer);
    mountEntry(entry, renderContainer)
      .then(() => {
        setError(false);
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => {
        setMounting(false);
      });
  };

  return (
    <div>
      <button disabled={mounting} onClick={() => handleMount(VUE_ENTRY)}>
        挂载Vue子应用
      </button>
      <button disabled={mounting} onClick={() => handleMount(REACT_ENTRY)}>
        挂载React子应用
      </button>
      <button disabled={mounting} onClick={() => handleMount('')}>
        卸载子应用
      </button>
      <div style={{ border: '1px solid red' }}>
        <h1>{error ? `Error: ${error}` : 'Container'}</h1>
        <div ref={containerRef} />
      </div>
    </div>
  );
};
