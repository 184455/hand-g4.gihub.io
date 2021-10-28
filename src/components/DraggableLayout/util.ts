import React, { ReactNode } from 'react';
import ResizeObserver from 'resize-observer-polyfill';

const hasSymbol = typeof Symbol === 'function' && Symbol.for;
const REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
const REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;

function isFragment(object: any): boolean {
  return (
    object?.$$typeof === REACT_ELEMENT_TYPE &&
    object?.type === REACT_FRAGMENT_TYPE
  );
}

export function convertChildrenToConfigArray<T = any>(
  children: ReactNode,
  focusType?: any,
): Array<T> {
  let configArr: Array<T> = [];
  React.Children.forEach(children, (child: any) => {
    if (!child) {
      return;
    }
    if (isFragment(child) && child?.hasOwnProperty('props')) {
      configArr = [
        ...configArr,
        ...convertChildrenToConfigArray(child.props.children, focusType),
      ];
    } else if (!focusType || child.type === focusType) {
      const config = {} as T;
      if (child.props) {
        Object.assign(config, child.props);
      }
      if (child.key !== undefined && child.key !== null) {
        Object.assign(config, {
          key: child.key,
        });
      }
      configArr.push(config);
    }
  });
  return configArr;
}

export function listenResize(
  dom: HTMLDivElement,
  listener: (vector: number) => void,
  attribute: 'width' | 'height',
) {
  let lastWidth = dom.clientWidth;
  let lastHeight = dom.clientHeight;
  const handleResize = (entries: ResizeObserverEntry[]) => {
    const {
      contentRect: { width, height },
    } = entries[0];
    if (lastWidth !== width && attribute === 'width') {
      listener(Math.round(width));
    }
    if (lastHeight !== height && attribute === 'height') {
      listener(Math.round(height));
    }
    lastWidth = width;
    lastHeight = height;
  };
  const observer = new ResizeObserver(handleResize);
  observer.observe(dom);
  return () => observer.disconnect();
}

export function computeVectors(
  allVector: number,
  initVectors: Array<number | string | undefined>,
): number[] {
  const vectors: number[] = [];
  const _initVectors = [...initVectors];
  let allWeight = 0;
  let surVector = allVector;
  for (let i = 0; i < _initVectors.length; i++) {
    const initVector = _initVectors[i];
    if (typeof initVector === 'number') {
      allWeight += initVector;
    } else if (typeof initVector === 'undefined') {
      allWeight += 1;
      _initVectors[i] = 1;
    } else if (/^\d+px$/.test(initVector)) {
      vectors[i] = parseInt(initVector, 10);
      surVector -= vectors[i];
    } else if (/^\d+%$/.test(initVector)) {
      vectors[i] = (parseInt(initVector, 10) / 100) * allVector;
      surVector -= vectors[i];
    } else {
      allWeight += 1;
      _initVectors[i] = 1;
    }
  }
  if (allWeight > 0) {
    for (let i = 0; i < _initVectors.length; i++) {
      const initVector = _initVectors[i];
      if (typeof initVector === 'number') {
        vectors[i] = (surVector / allWeight) * initVector;
      }
    }
  }
  return vectors;
}

export function getResizeResult(
  resized: number,
  minVectorArr: number[],
  maxVectorArr: number[],
  originVectorArr: number[],
) {
  let curMaxVectorArr = [...maxVectorArr];
  let curResized = resized;
  let nextResized = 0;
  let curVectorArr = [...originVectorArr];
  if (resized < 0) {
    curMaxVectorArr = minVectorArr.map((vector) => -vector);
    curResized = -resized;
    curVectorArr = originVectorArr.map((vector) => -vector);
  }
  let allWeight = curVectorArr.reduce((pre, cur, index) => {
    return cur < curMaxVectorArr[index] ? pre + cur : pre;
  }, 0);
  let nextAllWeight = 0;
  for (let i = 0; i < curVectorArr.length; i++) {
    let overCount = 0;
    if (curVectorArr[i] >= curMaxVectorArr[i]) {
      overCount++;
    } else {
      const newVector =
        (curResized / allWeight) * curVectorArr[i] + curVectorArr[i];
      if (curMaxVectorArr[i] > newVector) {
        curVectorArr[i] = newVector;
        nextAllWeight += curVectorArr[i];
      } else {
        nextResized += newVector - curMaxVectorArr[i];
        curVectorArr[i] = curMaxVectorArr[i];
        overCount++;
      }
    }
    if (overCount === curVectorArr.length) {
      break;
    }
    if (i === curVectorArr.length - 1 && nextResized > 0) {
      curResized = nextResized;
      nextResized = 0;
      allWeight = nextAllWeight;
      nextAllWeight = 0;
      i = -1;
    }
  }
  if (resized < 0) {
    curVectorArr = curVectorArr.map((vector) => -vector);
  }
  curVectorArr = curVectorArr.map(Math.round);
  return curVectorArr;
}

export function getDragResult(
  index: number,
  moved: number,
  minVectorArr: number[],
  maxVectorArr: number[],
  originVectorArr: number[],
): [number, number[]] {
  const curMinVectorArr = [...minVectorArr];
  const curMaxVectorArr = [...maxVectorArr];
  const curOriginVectorArr = [...originVectorArr];
  const vectorArr = [...originVectorArr];
  let addI = index;
  let delI = index + 1;
  let curMoved = moved;
  if (moved < 0) {
    curMinVectorArr.reverse();
    curMaxVectorArr.reverse();
    curOriginVectorArr.reverse();
    vectorArr.reverse();
    addI = curMinVectorArr.length - index - 2;
    delI = addI + 1;
    curMoved = -moved;
  }
  while (addI > -1 && curMoved > 0) {
    let changed = 0;
    let curChanged = 0;
    const addMaxVector = curMaxVectorArr[addI];
    const addOriginVector = curOriginVectorArr[addI];
    if (addMaxVector > addOriginVector + curMoved) {
      changed = curMoved;
    } else {
      changed = addMaxVector - addOriginVector;
    }
    while (delI < curMinVectorArr.length && changed > 0) {
      const delMinVector = curMinVectorArr[delI];
      const delOriginVector = curOriginVectorArr[delI];
      const delCurVector = vectorArr[delI] ?? delOriginVector;
      if (delCurVector - changed > delMinVector) {
        vectorArr[delI] = delCurVector - changed;
        curChanged += changed;
        changed = 0;
      } else {
        vectorArr[delI] = delMinVector;
        curChanged += delCurVector - delMinVector;
        changed -= delCurVector - delMinVector;
        delI++;
      }
    }
    vectorArr[addI] = addOriginVector + curChanged;
    curMoved -= curChanged;
    if (changed > 0) {
      break;
    }
    addI--;
  }
  let _moved = moved - curMoved;
  if (moved < 0) {
    vectorArr.reverse();
    _moved = moved + curMoved;
  }
  return [_moved, vectorArr];
}
