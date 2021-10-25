## BlobResponseHelper

Demo:

```tsx
import React, { useState } from 'react';
import { BlobHelper, BlobResponseHelper } from 'dumi-demo';

export default () => {
  const [value, setValue] = useState('');
  const runCode = () => {
    try {
      const fun = new Function('BlobHelper', 'BlobResponseHelper', value);
      fun(BlobHelper, BlobResponseHelper);
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

More skills for writing demo: https://d.umijs.org/guide/basic#write-component-demo
