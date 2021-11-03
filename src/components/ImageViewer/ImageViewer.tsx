import React, { CSSProperties, MouseEventHandler } from 'react';
import styles from './index.less';

interface Props {
  src: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  resize?: boolean;
  move?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onMouseDown?: MouseEventHandler<HTMLDivElement>;
  onDoubleClick?: MouseEventHandler<HTMLDivElement>;
}

const ImageViewer: React.FC<Props> = (props) => {
  const { src, x = 0, y = 0, width = 0, height = 0, ...otherProps } = props;

  const style: CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
  };

  const imgStyle: CSSProperties = {
    top: `${-y}px`,
    left: `${-x}px`,
  };

  return (
    <div className={styles['draggable-wrapper']} style={style} {...otherProps}>
      <img draggable={false} style={imgStyle} src={src} alt="" />
    </div>
  );
};

export default ImageViewer;
