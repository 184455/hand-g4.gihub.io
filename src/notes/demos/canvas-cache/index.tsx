import React, { useState } from 'react';
import Wrapper from './Wrapper';
import UnCachedBall from './UnCachedBall';
import CachedBall from './CachedBall';

export default function () {
  const [state, setState] = useState(1);

  return (
    <div>
      <Wrapper key={state} Ball={state % 2 ? CachedBall : UnCachedBall} />
      <button onClick={() => setState((pre) => pre + 1)}>
        {state % 2 ? '取消缓存' : '使用缓存'}
      </button>
    </div>
  );
}
