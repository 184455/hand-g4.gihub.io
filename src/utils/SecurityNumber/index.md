## SecurityNumber

Demo:

```tsx
import React, { useState } from 'react';
import { security, compute } from 'dumi-demo';

export default () => {
  const [value, setValue] = useState('');
  const runCode = () => {
    try {
      const fun = new Function('security', 'compute', value);
      fun(security, compute);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <>
      <textarea
        style={{ width: '100%', minHeight: '300px' }}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      ></textarea>
      <button onClick={runCode}>click me!</button>
    </>
  );
};
```
