// @ts-nocheck
import React, {
  CSSProperties,
  ReactEventHandler,
  useMemo,
  useRef,
  useState,
} from 'react';
import classnames from 'classnames';
import styles from './styles/imageContainer.less';

interface Props {
  src?: string;
  left?: number;
  top?: number;
  scale?: number;
  rotate?: number;
  zoom?: number;
}

const ImageContainer: React.FC<Props> = (props) => {
  const { src, left = 0, top = 0, scale = 1, rotate = 0, zoom = 1 } = props;
  const [imageInfo, setImageInfo] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLoad: ReactEventHandler<HTMLImageElement> = (e) => {
    const { clientWidth, clientHeight } = containerRef.current.parentElement;
    const { clientWidth: width, clientHeight: height } = e.currentTarget;
    console.log({
      clientWidth,
      clientHeight,
      width,
      height,
    });
    let info = {
      width: 0,
      height: 0,
    };
    if (width / height > clientWidth / clientHeight) {
      info = {
        width: width > clientWidth ? clientWidth : width,
        height: width > clientWidth ? (clientWidth / width) * height : height,
      };
    } else {
      info = {
        width: height > clientHeight ? (clientHeight / height) * width : width,
        height: height > clientHeight ? clientHeight : height,
      };
    }
    setImageInfo(info);
  };

  const loaded = useMemo(() => {
    return imageInfo.width !== 0 && imageInfo.height !== 0;
  }, [imageInfo]);

  const style: CSSProperties = useMemo(() => {
    return {
      top: `${top}px`,
      left: `${left}px`,
      transform: `scaleX(${scale * zoom}) rotate(${rotate}reg)`,
      width: `${imageInfo.width}px`,
      height: `${imageInfo.height}px`,
    };
  }, [top, left, scale, rotate, zoom, imageInfo]);

  return (
    <div
      ref={containerRef}
      style={style}
      className={classnames(styles.container, { [styles.loaded]: loaded })}
    >
      <img src={src} alt="" onLoad={handleLoad} />
    </div>
  );
};

export default ImageContainer;
