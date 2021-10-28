import React, {
  MouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import classNames from 'classnames';
import { debounce } from 'lodash';
import {
  DragModelType,
  LayoutProps,
  LayoutType,
  WrapperProps,
} from './interface';
import {
  computeVectors,
  convertChildrenToConfigArray,
  getDragResult,
  getResizeResult,
  listenResize,
} from './util';
import Box from './Box';
import Wrapper from './Wrapper';
import styles from './index.less';

const MIN_VECTOR = '20px';
const MAX_VECTOR = '100%';

interface LayoutProperties {
  Wrapper: typeof Wrapper;
}

const Layout: React.FC<LayoutProps> & LayoutProperties = (props) => {
  const {
    activeDividerClassName,
    activeDividerStyle,
    children,
    className,
    dragModel = DragModelType.synchronous,
    dividerClassName,
    dividerStyle,
    layout = LayoutType.horizontal,
    onVectorsChange,
    resizeDebounce = 0,
    style,
  } = props;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [vectorArr, setVectorArr] = useState<Array<number>>([]);
  const [asyncDragAttr, setAsyncDragAttr] = useState<[number, number]>([-1, 0]);
  // 开始拖拽时的鼠标坐标
  const originCoordinateRef = useRef(0);
  // 开始拖拽时的实际长度
  const originVectorListRef = useRef<number[]>([]);
  const boxArr: Array<WrapperProps> = useMemo(() => {
    return convertChildrenToConfigArray<WrapperProps>(children, Wrapper).map(
      (box, index) => ({
        ...box,
        key: box.key ?? `__draggable_layout_${index}__`,
      }),
    );
  }, [children]);
  const minVectorArrRef = useRef<number[]>([]);
  const maxVectorArrRef = useRef<number[]>([]);
  const lastResizeRef = useRef<number>(0);
  const childCount = useMemo(() => boxArr.length, [boxArr]);
  const asyncDrag = useMemo(
    () => dragModel === DragModelType.asynchronous,
    [dragModel],
  );

  const layoutClassName =
    layout === LayoutType.horizontal ? styles.horizontal : styles.vertical;
  const vectorAttrName = layout === LayoutType.horizontal ? 'width' : 'height';
  const cooAttrName = layout === LayoutType.horizontal ? 'clientX' : 'clientY';
  const clientVectorAttrName =
    layout === LayoutType.horizontal ? 'clientWidth' : 'clientHeight';

  const initVectors: Array<number | string> = useMemo(() => {
    return boxArr.map((box) => {
      if (
        typeof box.initVector === 'number' ||
        (typeof box.initVector === 'string' &&
          /^\d+(px|%)$/.test(box.initVector))
      ) {
        return box.initVector;
      } else {
        return 1;
      }
    });
  }, [childCount]);

  useLayoutEffect(() => {
    const allVector = wrapperRef.current![clientVectorAttrName];
    minVectorArrRef.current = computeVectors(
      allVector,
      boxArr.map((box) => box.minVector ?? MIN_VECTOR),
    );
    maxVectorArrRef.current = computeVectors(
      allVector,
      boxArr.map((box) => box.maxVector ?? MAX_VECTOR),
    );
    lastResizeRef.current = allVector;
    setVectorArr(computeVectors(allVector, initVectors));
  }, [childCount]);

  const handleResize = useCallback(
    debounce((newSize: number) => {
      if (newSize === lastResizeRef.current) {
        return;
      }
      minVectorArrRef.current = computeVectors(
        newSize,
        boxArr.map((box) => box.minVector ?? MIN_VECTOR),
      );
      maxVectorArrRef.current = computeVectors(
        newSize,
        boxArr.map((box) => box.maxVector ?? MAX_VECTOR),
      );
      setVectorArr((curVectorArr) => {
        const _vectorArr = [...curVectorArr];
        const allVector = _vectorArr.reduce((pre, cur) => pre + cur, 0);
        const resized = newSize - allVector;
        const resizeVectorArr = getResizeResult(
          resized,
          minVectorArrRef.current.filter(
            (_, index) => typeof initVectors[index] === 'number',
          ),
          maxVectorArrRef.current.filter(
            (_, index) => typeof initVectors[index] === 'number',
          ),
          _vectorArr.filter(
            (_, index) => typeof initVectors[index] === 'number',
          ),
        );
        let resizeIndex = 0;
        for (let i = 0; i < _vectorArr.length; i++) {
          if (typeof initVectors[i] === 'number') {
            _vectorArr[i] = resizeVectorArr[resizeIndex];
            resizeIndex++;
          }
        }
        lastResizeRef.current = newSize;
        return _vectorArr;
      });
    }, resizeDebounce),
    [childCount, resizeDebounce],
  );

  useEffect(() => {
    handleResize(wrapperRef.current![clientVectorAttrName]);
    return listenResize(wrapperRef.current!, handleResize, vectorAttrName);
  }, [wrapperRef.current, handleResize]);

  useEffect(() => {
    if (!(onVectorsChange instanceof Function)) {
      return;
    }
    if (vectorArr.length < childCount && wrapperRef.current) {
      const vectors: number[] = [];
      wrapperRef.current.childNodes.forEach((node) => {
        if (
          !(node as HTMLDivElement)?.classList.contains(styles['draggable-box'])
        ) {
          return;
        }
        // @ts-ignore
        vectors.push(node[clientVectorAttrName]);
      });
      onVectorsChange(vectors);
    } else {
      onVectorsChange(vectorArr);
    }
  }, [vectorArr]);

  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    document.body.classList.add(styles['body-dragging'], layoutClassName);
    originCoordinateRef.current = e[cooAttrName];
    originVectorListRef.current = [];
    if (!wrapperRef.current) {
      return;
    }
    wrapperRef.current.childNodes.forEach((node) => {
      if (
        !(node as HTMLDivElement)?.classList.contains(styles['draggable-box'])
      ) {
        return;
      }
      // @ts-ignore
      originVectorListRef.current.push(node[clientVectorAttrName]);
    });
  };

  const handleDrag = (e: MouseEvent<HTMLDocument>, index: number) => {
    const moved = e[cooAttrName] - originCoordinateRef.current;
    const [_moved, _vectorArr] = getDragResult(
      index,
      moved,
      minVectorArrRef.current,
      maxVectorArrRef.current,
      originVectorListRef.current,
    );
    if (asyncDrag) {
      setAsyncDragAttr([index, _moved]);
    } else {
      setVectorArr(_vectorArr);
    }
  };

  const handleDragEnd = () => {
    document.body.classList.remove(styles['body-dragging'], layoutClassName);
    if (!asyncDrag) {
      return;
    }
    setAsyncDragAttr((prevState) => {
      const [, _vectorArr] = getDragResult(
        prevState[0],
        prevState[1],
        minVectorArrRef.current,
        maxVectorArrRef.current,
        originVectorListRef.current,
      );
      setVectorArr(_vectorArr);
      return [-1, 0];
    });
  };

  return (
    <div
      className={classNames(styles.wrapper, layoutClassName, className)}
      style={style}
      ref={wrapperRef}
    >
      {boxArr.map((box, index) => (
        <Box
          activeDividerClassName={box.activeDividerClassName}
          activeDividerStyle={box.activeDividerStyle}
          asyncDragMoved={
            index === asyncDragAttr[0] ? asyncDragAttr[1] : undefined
          }
          boxClassName={box.className}
          boxStyle={box.style}
          dividerClassName={box.dividerClassName}
          dividerStyle={box.dividerStyle}
          globalActiveDividerClassName={activeDividerClassName}
          globalDividerClassName={dividerClassName}
          globalActiveDividerStyle={activeDividerStyle}
          globalDividerStyle={dividerStyle}
          key={box.key}
          layout={layout}
          last={index === childCount - 1}
          onDragStart={(e) => handleDragStart(e)}
          onDrag={(e) => handleDrag(e, index)}
          onDragEnd={() => handleDragEnd()}
          onVectorChange={box.onVectorChange}
          vector={vectorArr[index]}
        >
          {box.children}
        </Box>
      ))}
    </div>
  );
};

Layout.Wrapper = Wrapper;

export default Layout;
