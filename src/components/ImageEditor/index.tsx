// @ts-nocheck
import React, {
  MouseEvent,
  ReactEventHandler,
  useMemo,
  useRef,
  useState,
} from 'react';

import ImageContainer from './ImageContainer';
import styles from './index.less';
import img from './img.jpeg';

const ImageEditor: React.FC = () => {
  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const originPosition = useRef({ x: 0, y: 0 });
  const originTransform = useRef({ x: 0, y: 0 });
  const [clientTransform, setClientTransform] = useState({ x: 0, y: 0 });

  const imgStyle = useMemo(() => {
    const { width, height } = imageInfo;
    if (width === 0 || height === 0) {
      return {};
    }
    const wrapperWidth = wrapperRef.current!.clientWidth;
    const wrapperHeight = wrapperRef.current!.clientHeight;
    if (width / height > wrapperWidth / wrapperHeight) {
      return {
        width: wrapperWidth,
      };
    } else {
      return {
        height: wrapperHeight,
      };
    }
  }, [imageInfo]);
  const imgTransformStyle = useMemo(() => {
    return {
      transform: `translate(${clientTransform.x}px, ${clientTransform.y}px)`,
    };
  }, [clientTransform]);

  const handleImgLoad: ReactEventHandler<HTMLImageElement> = (e) => {
    setImageInfo({
      width: e.currentTarget.clientWidth,
      height: e.currentTarget.clientHeight,
    });
  };

  const handleDragStart = (e: MouseEvent<HTMLDivElement>) => {
    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);
    originPosition.current = {
      x: e.clientX,
      y: e.clientY,
    };
    originTransform.current = clientTransform;
  };
  const handleDrag = (e) => {
    const transform = {
      x: e.clientX - originPosition.current.x + originTransform.current.x,
      y: e.clientY - originPosition.current.y + originTransform.current.y,
    };
    setClientTransform(transform);
  };
  const handleDragEnd = () => {
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mouseup', handleDragEnd);
  };

  return (
    <div
      ref={wrapperRef}
      className={styles.wrapper}
      onMouseDown={handleDragStart}
    >
      <div className={styles['background-container']}>
        <div className={styles.mask} />
        <ImageContainer src={img} />
      </div>
      <div
        className={styles['crop-container']}
        style={{ clipPath: 'inset(20px 300px 10px 20px)' }}
      >
        <ImageContainer src={img} />
      </div>
    </div>
  );
};

export default ImageEditor;
